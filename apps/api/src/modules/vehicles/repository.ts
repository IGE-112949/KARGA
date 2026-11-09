import { and, desc, eq, sql } from 'drizzle-orm';
import type { Db } from '../../db/types.js';
import { vehicles } from '../../db/schema.js';
import type { VehicleDto } from './schemas.js';

export type VehicleRow = typeof vehicles.$inferSelect;

export function toVehicleDto(v: VehicleRow): VehicleDto {
  return { id: v.id, makeModel: v.makeModel, plate: v.plate, plugType: v.plugType, isDefault: v.isDefault };
}

// Predefinido primeiro, depois os mais recentes.
export async function listVehiclesByUser(db: Db, userId: string): Promise<VehicleDto[]> {
  const rows = await db.select().from(vehicles).where(eq(vehicles.userId, userId))
    .orderBy(desc(vehicles.isDefault), desc(vehicles.createdAt));
  return rows.map(toVehicleDto);
}

export async function findUserVehicle(db: Db, userId: string, id: string): Promise<VehicleRow | undefined> {
  const [row] = await db.select().from(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)));
  return row;
}

export async function countUserVehicles(db: Db, userId: string): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(vehicles).where(eq(vehicles.userId, userId));
  return r.n;
}

export async function insertVehicle(db: Db, values: typeof vehicles.$inferInsert): Promise<VehicleRow> {
  const [row] = await db.insert(vehicles).values(values).returning();
  return row;
}

export async function updateVehicle(db: Db, id: string, values: Partial<typeof vehicles.$inferInsert>): Promise<VehicleRow> {
  const [row] = await db.update(vehicles).set({ ...values, updatedAt: sql`now()` }).where(eq(vehicles.id, id)).returning();
  return row;
}

export async function clearDefault(db: Db, userId: string): Promise<void> {
  await db.update(vehicles).set({ isDefault: false }).where(and(eq(vehicles.userId, userId), eq(vehicles.isDefault, true)));
}

export async function deleteVehicle(db: Db, id: string): Promise<void> {
  await db.delete(vehicles).where(eq(vehicles.id, id));
}

export async function newestUserVehicle(db: Db, userId: string): Promise<VehicleRow | undefined> {
  const [row] = await db.select().from(vehicles).where(eq(vehicles.userId, userId)).orderBy(desc(vehicles.createdAt)).limit(1);
  return row;
}
