import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import type { Db } from '../../db/types.js';
import { spaceAvailability, spaceBlocks, spacePhotos, spaces } from '../../db/schema.js';
import type { AvailabilityWindow } from './availability.js';

const columns = {
  id: spaces.id,
  ownerId: spaces.ownerId,
  title: spaces.title,
  description: spaces.description,
  address: spaces.address,
  spotDetails: spaces.spotDetails,
  area: spaces.area,
  latitude: sql<number>`ST_Y(${spaces.location})`,
  longitude: sql<number>`ST_X(${spaces.location})`,
  spaceType: spaces.spaceType,
  plugType: spaces.plugType,
  powerKw: spaces.powerKw,
  pricePerHour: spaces.pricePerHour,
  energyPriceKwh: spaces.energyPriceKwh,
  accessInstructions: spaces.accessInstructions,
  accessCode: spaces.accessCode,
  status: spaces.status,
  createdAt: spaces.createdAt,
};

export type SpaceRow = { [K in keyof typeof columns]: any } & {
  id: string; ownerId: string; title: string; status: 'active' | 'inactive' | 'deleted';
};

export const point = (lat: number, lng: number) => sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;

export async function findOwnSpace(db: Db, ownerId: string, id: string, lock = false): Promise<SpaceRow | undefined> {
  if (lock) await db.execute(sql`select id from spaces where id = ${id} for update`);
  const [row] = await db.select(columns).from(spaces)
    .where(and(eq(spaces.id, id), eq(spaces.ownerId, ownerId), ne(spaces.status, 'deleted')));
  return row as SpaceRow | undefined;
}

export async function listOwnSpaces(db: Db, ownerId: string): Promise<SpaceRow[]> {
  return (await db.select(columns).from(spaces)
    .where(and(eq(spaces.ownerId, ownerId), ne(spaces.status, 'deleted')))
    .orderBy(desc(spaces.createdAt))) as SpaceRow[];
}

export async function photosOf(db: Db, spaceIds: string[]) {
  if (!spaceIds.length) return [];
  return db.select().from(spacePhotos).where(inArray(spacePhotos.spaceId, spaceIds))
    .orderBy(asc(spacePhotos.position), asc(spacePhotos.createdAt));
}

export async function availabilityOf(db: Db, spaceIds: string[]) {
  if (!spaceIds.length) return [];
  return db.select().from(spaceAvailability).where(inArray(spaceAvailability.spaceId, spaceIds))
    .orderBy(asc(spaceAvailability.weekday));
}

export async function blocksOf(db: Db, spaceId: string) {
  return db.select().from(spaceBlocks).where(eq(spaceBlocks.spaceId, spaceId)).orderBy(asc(spaceBlocks.startsAt));
}

export async function replaceAvailability(db: Db, spaceId: string, windows: AvailabilityWindow[]) {
  await db.delete(spaceAvailability).where(eq(spaceAvailability.spaceId, spaceId));
  await db.insert(spaceAvailability).values(windows.map((w) => ({ spaceId, ...w })));
}

export async function hasActiveBookings(db: Db, spaceId: string): Promise<boolean> {
  const r = await db.execute(sql`select 1 from bookings where space_id = ${spaceId} and status = 'confirmed' and ends_at > now() limit 1`);
  return ((r as unknown as { rows?: unknown[] }).rows ?? (r as unknown as unknown[])).length > 0;
}
