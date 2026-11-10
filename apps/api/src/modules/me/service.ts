import type { Db } from '../../db/types.js';
import type { AuthAdmin } from '../../auth/admin.js';
import type { AvatarStore } from '../../storage/avatarStore.js';
import type { SpacePhotoStore } from '../../storage/spacePhotoStore.js';
import { eq } from 'drizzle-orm';
import { spacePhotos as spacePhotosTable, spaces } from '../../db/schema.js';
import { AppError, unauthorized } from '../../lib/errors.js';
import { CHECK_VIOLATION, FOREIGN_KEY_VIOLATION, pgErrorCode } from '../../lib/pgErrors.js';
import { listVehiclesByUser } from '../vehicles/repository.js';
import { findProfile, insertProfile, updateProfileAtomic, type ProfileRow } from './repository.js';
import type { CreateProfileInput, ProfileDto, UpdateProfileInput } from './schemas.js';

export const profileNotFound = () =>
  new AppError(404, 'PROFILE_NOT_FOUND', 'Perfil não encontrado. Conclui o registo.');

async function toDto(db: Db, p: ProfileRow): Promise<ProfileDto> {
  return {
    id: p.id,
    fullName: p.fullName,
    phone: p.phone,
    avatarUrl: p.avatarUrl,
    isDriver: p.isDriver,
    isHost: p.isHost,
    termsAcceptedAt: p.termsAcceptedAt.toISOString(),
    vehicles: await listVehiclesByUser(db, p.id),
  };
}

export async function requireProfile(db: Db, userId: string): Promise<ProfileRow> {
  const p = await findProfile(db, userId);
  if (!p) throw profileNotFound();
  return p;
}

export async function getProfile(db: Db, userId: string): Promise<ProfileDto> {
  return toDto(db, await requireProfile(db, userId));
}

export async function createProfile(db: Db, userId: string, input: CreateProfileInput): Promise<ProfileDto> {
  let row: ProfileRow | undefined;
  try {
    row = await insertProfile(db, {
      id: userId,
      fullName: input.fullName,
      phone: input.phone ?? null,
      isDriver: input.isDriver,
      isHost: input.isHost,
      termsAcceptedAt: new Date(),
    });
  } catch (e) {
    // A conta já não existe na Auth (apagada com o token ainda válido): a sessão não serve.
    if (pgErrorCode(e) === FOREIGN_KEY_VIOLATION) throw unauthorized();
    throw e;
  }
  if (!row) throw new AppError(409, 'PROFILE_EXISTS', 'Já existe um perfil para esta conta');
  return toDto(db, row);
}

const needsOneMode = () => new AppError(400, 'VALIDATION_ERROR', 'Dados inválidos', [
  { field: 'isDriver', message: 'Tens de manter pelo menos um modo ativo: condutor ou proprietário' },
]);

export async function editProfile(db: Db, userId: string, input: UpdateProfileInput): Promise<ProfileDto> {
  let row: ProfileRow | undefined;
  try {
    row = await updateProfileAtomic(db, userId, input);
  } catch (e) {
    if (pgErrorCode(e) === CHECK_VIOLATION) throw needsOneMode();
    throw e;
  }
  if (row) return toDto(db, row);
  // Nada atualizado: ou o perfil não existe (ou foi apagado entretanto), ou ficaria sem modos.
  await requireProfile(db, userId);
  throw needsOneMode();
}

// RGPD: apaga o utilizador na Auth; o cascade apaga o perfil e os dados associados.
// Funciona também sem perfil (registo a meio): a conta da Auth é apagada na mesma.
export async function deleteAccount(db: Db, authAdmin: AuthAdmin, avatars: AvatarStore, userId: string, spacePhotos?: SpacePhotoStore): Promise<void> {
  const profile = await findProfile(db, userId);
  // Os caminhos das fotos dos espaços têm de ser lidos antes: o cascade apaga as linhas e os ficheiros ficariam públicos.
  const photoPaths = (await db.select({ path: spacePhotosTable.storagePath }).from(spacePhotosTable)
    .innerJoin(spaces, eq(spaces.id, spacePhotosTable.spaceId)).where(eq(spaces.ownerId, userId))).map((r) => r.path);
  await authAdmin.deleteUser(userId);
  if (spacePhotos && photoPaths.length) {
    try {
      await spacePhotos.remove(photoPaths);
    } catch (e) {
      console.error('Não foi possível apagar as fotos dos espaços da conta apagada:', (e as Error).message);
    }
  }
  if (profile?.avatarUrl) {
    try {
      await avatars.remove(profile.avatarUrl);
    } catch (e) {
      console.error('Não foi possível apagar a foto da conta apagada:', (e as Error).message);
    }
  }
}
