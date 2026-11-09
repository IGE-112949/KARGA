import { desc, eq } from 'drizzle-orm';
import type { Db } from '../../db/types.js';
import { vehicles } from '../../db/schema.js';
import type { VehicleDto } from './schemas.js';

export function toVehicleDto(v: typeof vehicles.$inferSelect): VehicleDto {
  return { id: v.id, makeModel: v.makeModel, plate: v.plate, plugType: v.plugType, isDefault: v.isDefault };
}

// Predefinido primeiro, depois os mais recentes.
export async function listVehiclesByUser(db: Db, userId: string): Promise<VehicleDto[]> {
  const rows = await db.select().from(vehicles).where(eq(vehicles.userId, userId))
    .orderBy(desc(vehicles.isDefault), desc(vehicles.createdAt));
  return rows.map(toVehicleDto);
}
