import { createHash } from 'node:crypto';
import { and, asc, eq, gte, inArray, lte, ne, sql } from 'drizzle-orm';
import type { Db } from '../../db/types.js';
import { bookings, favorites, platformSettings, profiles, spaceAvailability, spaceBlocks, spacePhotos, spaces } from '../../db/schema.js';
import { AppError } from '../../lib/errors.js';
import type { SpacePhotoStore } from '../../storage/spacePhotoStore.js';
import { uuidSchema } from '../spaces/schemas.js';
import { isAvailable, requestInterval, type Interval, type SearchWindow } from './availability.js';
import type { SearchQuery } from './schemas.js';

export const MAX_RESULTS = 100;
const MAX_KWH = 20;

// Ponto aproximado: 50–150 m do real, sempre o mesmo para o mesmo espaço.
export function approximate(id: string, lat: number, lng: number) {
  const h = createHash('sha256').update(id).digest();
  const angle = (h.readUInt16BE(0) / 65535) * 2 * Math.PI;
  const dist = 50 + (h[2] / 255) * 100;
  const dLat = (dist * Math.cos(angle)) / 111320;
  const dLng = (dist * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return { latitude: Number((lat + dLat).toFixed(6)), longitude: Number((lng + dLng).toFixed(6)) };
}

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

export async function serviceFeePercent(db: Db): Promise<number> {
  const [r] = await db.select({ value: platformSettings.value }).from(platformSettings).where(eq(platformSettings.key, 'service_fee_percent'));
  return r ? Number(r.value) : 10;
}

export function estimateCost(q: SearchWindow, pricePerHour: number, powerKw: number, energyPrice: number | null, feePercent: number) {
  const place = round2(pricePerHour * q.hours);
  const energyKwh = energyPrice == null ? 0 : round2(Math.min(powerKw * q.hours, MAX_KWH));
  const energy = energyPrice == null ? 0 : round2(energyKwh * energyPrice);
  const serviceFee = round2(((place + energy) * feePercent) / 100);
  return { hours: q.hours, place, energyKwh, energy, serviceFeePercent: feePercent, serviceFee, total: round2(place + energy + serviceFee) };
}

const cols = {
  id: spaces.id,
  ownerId: spaces.ownerId,
  title: spaces.title,
  area: spaces.area,
  lat: sql<number>`ST_Y(${spaces.location})`,
  lng: sql<number>`ST_X(${spaces.location})`,
  spaceType: spaces.spaceType,
  plugType: spaces.plugType,
  powerKw: spaces.powerKw,
  pricePerHour: spaces.pricePerHour,
  energyPriceKwh: spaces.energyPriceKwh,
  status: spaces.status,
};
type Row = { id: string; ownerId: string; title: string; area: string | null; lat: number; lng: number; spaceType: string; plugType: string; powerKw: string; pricePerHour: string; energyPriceKwh: string | null; status: string };

async function loadAvailability(db: Db, ids: string[], q: SearchWindow) {
  const { from, to } = requestInterval(q);
  const [windows, blocks, books] = await Promise.all([
    db.select().from(spaceAvailability).where(inArray(spaceAvailability.spaceId, ids)),
    db.select().from(spaceBlocks).where(and(inArray(spaceBlocks.spaceId, ids), sql`${spaceBlocks.startsAt} < ${to.toISOString()}`, sql`${spaceBlocks.endsAt} > ${from.toISOString()}`)),
    db.select().from(bookings).where(and(inArray(bookings.spaceId, ids), eq(bookings.status, 'confirmed'), sql`${bookings.startsAt} < ${to.toISOString()}`, sql`${bookings.endsAt} > ${from.toISOString()}`)),
  ]);
  return (id: string) => isAvailable(
    q,
    windows.filter((w) => w.spaceId === id).map((w) => ({ weekday: w.weekday, startTime: w.startTime.slice(0, 5), endTime: w.endTime.slice(0, 5) })),
    blocks.filter((b) => b.spaceId === id) as Interval[],
    books.filter((b) => b.spaceId === id) as Interval[],
  );
}

async function covers(db: Db, store: SpacePhotoStore, ids: string[]) {
  if (!ids.length) return new Map<string, string>();
  const photos = await db.select().from(spacePhotos).where(inArray(spacePhotos.spaceId, ids)).orderBy(asc(spacePhotos.position));
  const m = new Map<string, string>();
  for (const p of photos) if (!m.has(p.spaceId)) m.set(p.spaceId, store.publicUrl(p.storagePath));
  return m;
}

async function favoriteIds(db: Db, userId: string, ids: string[]) {
  if (!ids.length) return new Set<string>();
  const rows = await db.select({ id: favorites.spaceId }).from(favorites).where(and(eq(favorites.userId, userId), inArray(favorites.spaceId, ids)));
  return new Set(rows.map((r) => r.id));
}

export function summary(r: Row, coverUrl: string | null, isFavorite: boolean) {
  return {
    id: r.id,
    title: r.title,
    area: r.area,
    ...approximate(r.id, Number(r.lat), Number(r.lng)),
    pricePerHour: Number(r.pricePerHour),
    energyPriceKwh: r.energyPriceKwh == null ? null : Number(r.energyPriceKwh),
    powerKw: Number(r.powerKw),
    plugType: r.plugType,
    spaceType: r.spaceType,
    coverUrl,
    isFavorite,
  };
}

export async function searchSpaces(db: Db, store: SpacePhotoStore, userId: string, q: SearchQuery) {
  const { minLng, minLat, maxLng, maxLat } = q.bbox;
  const conds = [
    eq(spaces.status, 'active'),
    ne(spaces.ownerId, userId),
    sql`${spaces.location} && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)`,
  ];
  if (q.maxPrice !== undefined) conds.push(lte(spaces.pricePerHour, String(q.maxPrice)));
  if (q.minKw !== undefined) conds.push(gte(spaces.powerKw, String(q.minKw)));
  if (q.plug) conds.push(eq(spaces.plugType, q.plug));
  if (q.covered) conds.push(inArray(spaces.spaceType, ['closed_garage', 'covered']));
  const rows = (await db.select(cols).from(spaces).where(and(...conds)).orderBy(asc(spaces.pricePerHour), asc(spaces.createdAt)).limit(500)) as Row[];
  if (!rows.length) return [];
  const free = await loadAvailability(db, rows.map((r) => r.id), q);
  const hits = rows.filter((r) => free(r.id)).slice(0, MAX_RESULTS);
  const ids = hits.map((r) => r.id);
  const [cov, fav] = await Promise.all([covers(db, store, ids), favoriteIds(db, userId, ids)]);
  return hits.map((r) => summary(r, cov.get(r.id) ?? null, fav.has(r.id)));
}

const notFound = () => new AppError(404, 'SPACE_NOT_FOUND', 'Espaço não encontrado');

export async function publicSpace(db: Db, store: SpacePhotoStore, userId: string, id: string, q: SearchWindow | null) {
  if (!uuidSchema.safeParse(id).success) throw notFound();
  const [r] = (await db.select(cols).from(spaces).where(and(eq(spaces.id, id), eq(spaces.status, 'active')))) as Row[];
  if (!r) throw notFound();
  const [[owner], photos, fav, fee] = await Promise.all([
    db.select({ fullName: profiles.fullName, avatarUrl: profiles.avatarUrl }).from(profiles).where(eq(profiles.id, r.ownerId)),
    db.select().from(spacePhotos).where(eq(spacePhotos.spaceId, id)).orderBy(asc(spacePhotos.position)),
    favoriteIds(db, userId, [id]),
    serviceFeePercent(db),
  ]);
  const names = (owner?.fullName ?? '').trim().split(/\s+/);
  const available = q ? (await loadAvailability(db, [id], q))(id) : null;
  return {
    ...summary(r, photos[0] ? store.publicUrl(photos[0].storagePath) : null, fav.has(id)),
    photos: photos.map((p) => ({ id: p.id, url: store.publicUrl(p.storagePath) })),
    host: { firstName: names[0] ?? '', initial: names.length > 1 ? names[names.length - 1][0].toUpperCase() : '', avatarUrl: owner?.avatarUrl ?? null },
    isOwn: r.ownerId === userId,
    available,
    cost: q ? estimateCost(q, Number(r.pricePerHour), Number(r.powerKw), r.energyPriceKwh == null ? null : Number(r.energyPriceKwh), fee) : null,
  };
}
