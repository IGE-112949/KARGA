import { and, desc, eq, ne, sql } from 'drizzle-orm';
import type { Db } from '../../db/types.js';
import { favorites, spacePhotos, spaces } from '../../db/schema.js';
import { AppError } from '../../lib/errors.js';
import type { SpacePhotoStore } from '../../storage/spacePhotoStore.js';
import { requireProfile } from '../me/service.js';
import { uuidSchema } from '../spaces/schemas.js';
import { approximate } from '../search/service.js';

const notFound = () => new AppError(404, 'SPACE_NOT_FOUND', 'Espaço não encontrado');

// Favoritos: sem eliminados; inativos aparecem com status "inactive" (a app mostra "Indisponível").
export async function listFavorites(db: Db, store: SpacePhotoStore, userId: string) {
  const rows = await db.select({
    id: spaces.id, title: spaces.title, area: spaces.area, status: spaces.status,
    lat: sql<number>`ST_Y(${spaces.location})`, lng: sql<number>`ST_X(${spaces.location})`,
    pricePerHour: spaces.pricePerHour, powerKw: spaces.powerKw, plugType: spaces.plugType, spaceType: spaces.spaceType,
    energyPriceKwh: spaces.energyPriceKwh,
    cover: sql<string | null>`(select ${spacePhotos.storagePath} from ${spacePhotos} where ${spacePhotos.spaceId} = ${spaces.id} order by ${spacePhotos.position} limit 1)`,
  }).from(favorites).innerJoin(spaces, eq(spaces.id, favorites.spaceId))
    .where(and(eq(favorites.userId, userId), ne(spaces.status, 'deleted')))
    .orderBy(desc(favorites.createdAt));
  return rows.map((r) => ({
    id: r.id, title: r.title, area: r.area, status: r.status,
    ...approximate(r.id, Number(r.lat), Number(r.lng)),
    pricePerHour: Number(r.pricePerHour), powerKw: Number(r.powerKw), plugType: r.plugType, spaceType: r.spaceType,
    energyPriceKwh: r.energyPriceKwh == null ? null : Number(r.energyPriceKwh),
    coverUrl: r.cover ? store.publicUrl(r.cover) : null,
    isFavorite: true,
  }));
}

export async function addFavorite(db: Db, userId: string, spaceId: string) {
  await requireProfile(db, userId);
  if (!uuidSchema.safeParse(spaceId).success) throw notFound();
  const [s] = await db.select({ ownerId: spaces.ownerId }).from(spaces).where(and(eq(spaces.id, spaceId), eq(spaces.status, 'active')));
  if (!s) throw notFound();
  if (s.ownerId === userId) throw new AppError(400, 'OWN_SPACE', 'Não podes adicionar o teu próprio espaço aos favoritos');
  await db.insert(favorites).values({ userId, spaceId }).onConflictDoNothing();
}

export async function removeFavorite(db: Db, userId: string, spaceId: string) {
  if (!uuidSchema.safeParse(spaceId).success) return;
  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.spaceId, spaceId)));
}
