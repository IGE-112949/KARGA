import type { Db } from '../../db/types.js';
import { AppError } from '../../lib/errors.js';
import { sql } from 'drizzle-orm';
import { pgConstraint, pgErrorCode, UNIQUE_VIOLATION } from '../../lib/pgErrors.js';
import { requireProfile } from '../me/service.js';
import * as repo from './repository.js';
import { vehicleIdSchema, type CreateVehicleInput, type UpdateVehicleInput, type VehicleDto } from './schemas.js';

const vehicleNotFound = () => new AppError(404, 'VEHICLE_NOT_FOUND', 'Veículo não encontrado');
const plateTaken = () => new AppError(409, 'PLATE_TAKEN', 'Esta matrícula já está registada');

// Traduz violações de unicidade: matrícula repetida vs. conflito de predefinido (pedidos simultâneos).
export function mapVehicleWriteError(err: unknown): unknown {
  if (pgErrorCode(err) !== UNIQUE_VIOLATION) return err;
  if (pgConstraint(err) === 'vehicles_plate_unique') return plateTaken();
  return new AppError(409, 'VEHICLE_CONFLICT', 'O veículo foi alterado noutro pedido. Tenta novamente.');
}

function rethrowPlate(err: unknown): never {
  throw mapVehicleWriteError(err);
}

// Serializa as escritas de veículos do mesmo utilizador (evita dois predefinidos em pedidos simultâneos).
async function lockUser(t: Db, userId: string): Promise<void> {
  await t.execute(sql`select id from profiles where id = ${userId} for update`);
}

// Só devolve veículos do próprio utilizador (404 caso contrário, sem revelar se existe).
async function requireOwnVehicle(db: Db, userId: string, id: string): Promise<repo.VehicleRow> {
  if (!vehicleIdSchema.safeParse(id).success) throw vehicleNotFound();
  const v = await repo.findUserVehicle(db, userId, id);
  if (!v) throw vehicleNotFound();
  return v;
}

export async function listVehicles(db: Db, userId: string): Promise<VehicleDto[]> {
  await requireProfile(db, userId);
  return repo.listVehiclesByUser(db, userId);
}

export async function addVehicle(db: Db, userId: string, input: CreateVehicleInput): Promise<VehicleDto> {
  await requireProfile(db, userId);
  try {
    return await db.transaction(async (tx) => {
      const t = tx as unknown as Db;
      await lockUser(t, userId);
      const isDefault = (await repo.countUserVehicles(t, userId)) === 0;
      return repo.toVehicleDto(await repo.insertVehicle(t, { userId, ...input, isDefault }));
    });
  } catch (err) {
    rethrowPlate(err);
  }
}

export async function editVehicle(db: Db, userId: string, id: string, input: UpdateVehicleInput): Promise<VehicleDto> {
  await requireProfile(db, userId);
  const current = await requireOwnVehicle(db, userId, id);
  const { isDefault, ...fields } = input;
  try {
    return await db.transaction(async (tx) => {
      const t = tx as unknown as Db;
      await lockUser(t, userId);
      if (isDefault && !current.isDefault) await repo.clearDefault(t, userId);
      const row = await repo.updateVehicle(t, id, { ...fields, ...(isDefault ? { isDefault: true } : {}) });
      return repo.toVehicleDto(row);
    });
  } catch (err) {
    rethrowPlate(err);
  }
}

export async function removeVehicle(db: Db, userId: string, id: string): Promise<void> {
  await requireProfile(db, userId);
  const current = await requireOwnVehicle(db, userId, id);
  await db.transaction(async (tx) => {
    const t = tx as unknown as Db;
    await lockUser(t, userId);
    await repo.deleteVehicle(t, id);
    if (current.isDefault) {
      const next = await repo.newestUserVehicle(t, userId);
      if (next) await repo.updateVehicle(t, next.id, { isDefault: true });
    }
  });
}
