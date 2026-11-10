import { randomUUID } from 'node:crypto';
import { and, eq, gt, lt, ne, sql } from 'drizzle-orm';
import type { Db } from '../../db/types.js';
import { spaceBlocks, spacePhotos, spaces } from '../../db/schema.js';
import { AppError } from '../../lib/errors.js';
import { detectImageType, invalidImage, storageUnavailable, tooManyPhotos, type ImageType } from '../../lib/images.js';
import type { SpacePhotoStore } from '../../storage/spacePhotoStore.js';
import { requireProfile } from '../me/service.js';
import type { AvailabilityWindow } from './availability.js';
import * as repo from './repository.js';
import { powerIssue, uuidSchema, type CreateSpaceInput, type UpdateSpaceInput } from './schemas.js';

export const MAX_PHOTOS = 5;

const spaceNotFound = () => new AppError(404, 'SPACE_NOT_FOUND', 'Espaço não encontrado');
const photoNotFound = () => new AppError(404, 'PHOTO_NOT_FOUND', 'Fotografia não encontrada');
const blockNotFound = () => new AppError(404, 'BLOCK_NOT_FOUND', 'Bloqueio não encontrado');
export const photosRequired = () => new AppError(400, 'PHOTOS_REQUIRED', 'Adiciona pelo menos uma fotografia');

type Photo = { id: string; url: string; isCover: boolean };
const hhmm = (t: string) => t.slice(0, 5);
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export async function requireHost(db: Db, userId: string) {
  const p = await requireProfile(db, userId);
  if (!p.isHost) throw new AppError(403, 'HOST_REQUIRED', 'Ativa o Modo Proprietário para gerir espaços');
  return p;
}

async function requireOwn(db: Db, userId: string, id: string, lock = false) {
  if (!uuidSchema.safeParse(id).success) throw spaceNotFound();
  const s = await repo.findOwnSpace(db, userId, id, lock);
  if (!s) throw spaceNotFound();
  return s;
}

function base(row: repo.SpaceRow) {
  return {
    id: row.id,
    title: row.title,
    address: row.address as string,
    spotDetails: row.spotDetails as string | null,
    area: row.area as string | null,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    spaceType: row.spaceType as string,
    plugType: row.plugType as string,
    powerKw: Number(row.powerKw),
    pricePerHour: Number(row.pricePerHour),
    energyPriceKwh: num(row.energyPriceKwh),
    status: row.status as 'active' | 'inactive',
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

const toWindow = (a: { weekday: number; startTime: string; endTime: string }): AvailabilityWindow =>
  ({ weekday: a.weekday, startTime: hhmm(a.startTime), endTime: hhmm(a.endTime) });

export async function getSpace(db: Db, store: SpacePhotoStore, userId: string, id: string) {
  await requireHost(db, userId);
  return detail(db, store, await requireOwn(db, userId, id));
}

async function detail(db: Db, store: SpacePhotoStore, row: repo.SpaceRow) {
  const [photos, availability, blocks] = await Promise.all([
    repo.photosOf(db, [row.id]), repo.availabilityOf(db, [row.id]), repo.blocksOf(db, row.id),
  ]);
  return {
    ...base(row),
    description: row.description as string | null,
    accessInstructions: row.accessInstructions as string | null,
    accessCode: row.accessCode as string | null,
    photos: photos.map((p, i): Photo => ({ id: p.id, url: store.publicUrl(p.storagePath), isCover: i === 0 })),
    availability: availability.map(toWindow),
    blocks: blocks.map((b) => ({ id: b.id, startsAt: b.startsAt.toISOString(), endsAt: b.endsAt.toISOString(), reason: b.reason })),
  };
}

export async function listSpaces(db: Db, store: SpacePhotoStore, userId: string) {
  await requireHost(db, userId);
  const rows = await repo.listOwnSpaces(db, userId);
  const ids = rows.map((r) => r.id);
  const [photos, availability] = await Promise.all([repo.photosOf(db, ids), repo.availabilityOf(db, ids)]);
  return rows.map((r) => {
    const cover = photos.find((p) => p.spaceId === r.id);
    return {
      ...base(r),
      coverUrl: cover ? store.publicUrl(cover.storagePath) : null,
      availability: availability.filter((a) => a.spaceId === r.id).map(toWindow),
    };
  });
}

function checkImages(files: Express.Multer.File[]): ImageType[] {
  return files.map((f) => detectImageType(f.buffer) ?? (() => { throw invalidImage(); })());
}

// Envia as fotos uma a uma; se alguma falhar, apaga as já enviadas (tudo-ou-nada).
async function uploadAll(store: SpacePhotoStore, spaceId: string, files: Express.Multer.File[], types: ImageType[]) {
  const paths: string[] = [];
  try {
    for (let i = 0; i < files.length; i++) paths.push(await store.upload(spaceId, files[i].buffer, types[i]));
    return paths;
  } catch (e) {
    console.error('Falha ao enviar fotografia para o Storage:', (e as Error).message);
    await removeQuietly(store, paths);
    throw storageUnavailable();
  }
}

async function removeQuietly(store: SpacePhotoStore, paths: string[]) {
  try {
    await store.remove(paths);
  } catch (e) {
    console.error('Não foi possível apagar fotografias do Storage:', (e as Error).message);
  }
}

export async function createSpace(db: Db, store: SpacePhotoStore, userId: string, input: CreateSpaceInput, files: Express.Multer.File[]) {
  await requireHost(db, userId);
  if (!files.length) throw photosRequired();
  if (files.length > MAX_PHOTOS) throw tooManyPhotos();
  const types = checkImages(files);
  const id = randomUUID();
  const paths = await uploadAll(store, id, files, types);
  try {
    await db.transaction(async (tx) => {
      const t = tx as unknown as Db;
      const { availability, latitude, longitude, ...rest } = input;
      await t.insert(spaces).values({
        id, ownerId: userId, ...rest,
        location: repo.point(latitude, longitude) as never,
        powerKw: String(rest.powerKw), pricePerHour: String(rest.pricePerHour),
        energyPriceKwh: rest.energyPriceKwh == null ? null : String(rest.energyPriceKwh),
      });
      await repo.replaceAvailability(t, id, availability);
      await t.insert(spacePhotos).values(paths.map((storagePath, position) => ({ spaceId: id, storagePath, position })));
    });
  } catch (e) {
    await removeQuietly(store, paths);
    throw e;
  }
  return getSpace(db, store, userId, id);
}

export async function updateSpace(db: Db, store: SpacePhotoStore, userId: string, id: string, input: UpdateSpaceInput) {
  await requireHost(db, userId);
  const current = await requireOwn(db, userId, id);
  const plug = (input.plugType ?? current.plugType) as 'schuko' | 'type2';
  const power = input.powerKw ?? Number(current.powerKw);
  const issue = powerIssue(plug, power);
  if (issue) throw new AppError(400, 'VALIDATION_ERROR', 'Dados inválidos', [{ field: 'powerKw', message: issue }]);
  const { latitude, longitude, powerKw, pricePerHour, energyPriceKwh, ...rest } = input;
  if ((latitude === undefined) !== (longitude === undefined)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Dados inválidos', [{ field: 'latitude', message: 'Indica latitude e longitude' }]);
  }
  await db.update(spaces).set({
    ...rest,
    ...(latitude !== undefined ? { location: repo.point(latitude, longitude!) as never } : {}),
    ...(powerKw !== undefined ? { powerKw: String(powerKw) } : {}),
    ...(pricePerHour !== undefined ? { pricePerHour: String(pricePerHour) } : {}),
    ...(energyPriceKwh !== undefined ? { energyPriceKwh: energyPriceKwh === null ? null : String(energyPriceKwh) } : {}),
    updatedAt: sql`now()`,
  }).where(and(eq(spaces.id, id), eq(spaces.ownerId, userId), ne(spaces.status, 'deleted')));
  return getSpace(db, store, userId, id);
}

export async function setAvailability(db: Db, store: SpacePhotoStore, userId: string, id: string, windows: AvailabilityWindow[]) {
  await requireHost(db, userId);
  await db.transaction(async (tx) => {
    const t = tx as unknown as Db;
    await requireOwn(t, userId, id, true);
    await repo.replaceAvailability(t, id, windows);
  });
  return getSpace(db, store, userId, id);
}

export async function deleteSpace(db: Db, userId: string, id: string) {
  await requireHost(db, userId);
  await db.transaction(async (tx) => {
    const t = tx as unknown as Db;
    await requireOwn(t, userId, id, true);
    if (await repo.hasActiveBookings(t, id)) {
      throw new AppError(409, 'SPACE_HAS_BOOKINGS', 'Tens reservas futuras neste espaço. Cancela-as primeiro.');
    }
    await t.update(spaces).set({ status: 'deleted', deletedAt: sql`now()`, updatedAt: sql`now()` }).where(eq(spaces.id, id));
  });
}

// ---------- fotografias ----------

export async function addPhoto(db: Db, store: SpacePhotoStore, userId: string, id: string, file: Express.Multer.File | undefined) {
  await requireHost(db, userId);
  if (!file) throw invalidImage();
  const [type] = checkImages([file]);
  await requireOwn(db, userId, id);
  // Verifica o limite antes de enviar (volta a verificar dentro da transação, por causa de pedidos em paralelo).
  if ((await repo.photosOf(db, [id])).length >= MAX_PHOTOS) throw tooManyPhotos();
  const [path] = await uploadAll(store, id, [file], [type]);
  try {
    await db.transaction(async (tx) => {
      const t = tx as unknown as Db;
      await requireOwn(t, userId, id, true);
      const photos = await repo.photosOf(t, [id]);
      if (photos.length >= MAX_PHOTOS) throw tooManyPhotos();
      const next = photos.length ? Math.max(...photos.map((p) => p.position)) + 1 : 0;
      await t.insert(spacePhotos).values({ spaceId: id, storagePath: path, position: next });
    });
  } catch (e) {
    await removeQuietly(store, [path]);
    throw e;
  }
  return getSpace(db, store, userId, id);
}

export async function removePhoto(db: Db, store: SpacePhotoStore, userId: string, id: string, photoId: string) {
  await requireHost(db, userId);
  const path = await db.transaction(async (tx) => {
    const t = tx as unknown as Db;
    await requireOwn(t, userId, id, true);
    const photos = await repo.photosOf(t, [id]);
    const photo = uuidSchema.safeParse(photoId).success ? photos.find((p) => p.id === photoId) : undefined;
    if (!photo) throw photoNotFound();
    if (photos.length === 1) throw new AppError(409, 'LAST_PHOTO', 'O espaço tem de ter pelo menos uma fotografia');
    await t.delete(spacePhotos).where(eq(spacePhotos.id, photoId));
    return photo.storagePath;
  });
  await removeQuietly(store, [path]);
  return getSpace(db, store, userId, id);
}

export async function makeCover(db: Db, store: SpacePhotoStore, userId: string, id: string, photoId: string) {
  await requireHost(db, userId);
  await db.transaction(async (tx) => {
    const t = tx as unknown as Db;
    await requireOwn(t, userId, id, true);
    const photos = await repo.photosOf(t, [id]);
    if (!uuidSchema.safeParse(photoId).success || !photos.some((p) => p.id === photoId)) throw photoNotFound();
    const ordered = [photos.find((p) => p.id === photoId)!, ...photos.filter((p) => p.id !== photoId)];
    for (let i = 0; i < ordered.length; i++) {
      await t.update(spacePhotos).set({ position: i }).where(eq(spacePhotos.id, ordered[i].id));
    }
  });
  return getSpace(db, store, userId, id);
}

// ---------- bloqueios ----------

export async function listBlocks(db: Db, store: SpacePhotoStore, userId: string, id: string) {
  return (await getSpace(db, store, userId, id)).blocks;
}

export async function addBlock(db: Db, store: SpacePhotoStore, userId: string, id: string, b: { startsAt: string; endsAt: string; reason?: string | null }) {
  await requireHost(db, userId);
  const startsAt = new Date(b.startsAt);
  const endsAt = new Date(b.endsAt);
  if (endsAt <= new Date()) throw new AppError(400, 'BLOCK_IN_PAST', 'Esse período já passou. Escolhe datas a partir de hoje.');
  await db.transaction(async (tx) => {
    const t = tx as unknown as Db;
    await requireOwn(t, userId, id, true);
    const [clash] = await t.select({ id: spaceBlocks.id }).from(spaceBlocks)
      .where(and(eq(spaceBlocks.spaceId, id), lt(spaceBlocks.startsAt, endsAt), gt(spaceBlocks.endsAt, startsAt)));
    if (clash) throw new AppError(409, 'BLOCK_OVERLAP', 'Já tens um bloqueio nessas datas.');
    await t.insert(spaceBlocks).values({ spaceId: id, startsAt, endsAt, reason: b.reason ?? null });
  });
  return listBlocks(db, store, userId, id);
}

export async function removeBlock(db: Db, userId: string, id: string, blockId: string) {
  await requireHost(db, userId);
  await requireOwn(db, userId, id);
  if (!uuidSchema.safeParse(blockId).success) throw blockNotFound();
  const deleted = await db.delete(spaceBlocks).where(and(eq(spaceBlocks.id, blockId), eq(spaceBlocks.spaceId, id))).returning({ id: spaceBlocks.id });
  if (!deleted.length) throw blockNotFound();
}
