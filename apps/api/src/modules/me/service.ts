import type { Db } from '../../db/types.js';
import type { AuthAdmin } from '../../auth/admin.js';
import type { AvatarStore } from '../../storage/avatarStore.js';
import { AppError } from '../../lib/errors.js';
import { listVehiclesByUser } from '../vehicles/repository.js';
import { findProfile, insertProfile, updateProfile, type ProfileRow } from './repository.js';
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
  const row = await insertProfile(db, {
    id: userId,
    fullName: input.fullName,
    phone: input.phone ?? null,
    isDriver: input.isDriver,
    isHost: input.isHost,
    termsAcceptedAt: new Date(),
  });
  if (!row) throw new AppError(409, 'PROFILE_EXISTS', 'Já existe um perfil para esta conta');
  return toDto(db, row);
}

export async function editProfile(db: Db, userId: string, input: UpdateProfileInput): Promise<ProfileDto> {
  const current = await requireProfile(db, userId);
  const isDriver = input.isDriver ?? current.isDriver;
  const isHost = input.isHost ?? current.isHost;
  if (!isDriver && !isHost) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Dados inválidos', [
      { field: 'isDriver', message: 'Tens de manter pelo menos um modo ativo: condutor ou proprietário' },
    ]);
  }
  const row = await updateProfile(db, userId, {
    ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    isDriver,
    isHost,
  });
  return toDto(db, row);
}

// RGPD: apaga o utilizador na Auth; o cascade apaga o perfil e os dados associados.
export async function deleteAccount(db: Db, authAdmin: AuthAdmin, avatars: AvatarStore, userId: string): Promise<void> {
  const profile = await requireProfile(db, userId);
  await authAdmin.deleteUser(userId);
  if (profile.avatarUrl) {
    try {
      await avatars.remove(profile.avatarUrl);
    } catch (e) {
      console.error('Não foi possível apagar a foto da conta apagada:', (e as Error).message);
    }
  }
}
