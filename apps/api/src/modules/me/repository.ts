import { and, eq, sql } from 'drizzle-orm';
import type { Db } from '../../db/types.js';
import { profiles } from '../../db/schema.js';

export type ProfileRow = typeof profiles.$inferSelect;

export async function findProfile(db: Db, id: string): Promise<ProfileRow | undefined> {
  const [row] = await db.select().from(profiles).where(eq(profiles.id, id));
  return row;
}

// Devolve undefined se já existir um perfil com este id.
export async function insertProfile(db: Db, values: typeof profiles.$inferInsert): Promise<ProfileRow | undefined> {
  const [row] = await db.insert(profiles).values(values).onConflictDoNothing({ target: profiles.id }).returning();
  return row;
}

export async function updateProfile(db: Db, id: string, values: Partial<typeof profiles.$inferInsert>): Promise<ProfileRow> {
  const [row] = await db.update(profiles).set({ ...values, updatedAt: sql`now()` }).where(eq(profiles.id, id)).returning();
  return row;
}

// Atualiza nome/telemóvel e os modos de uma só vez; a condição "pelo menos um modo" é verificada na mesma instrução,
// por isso dois pedidos simultâneos nunca deixam o perfil sem modos. Devolve undefined se a condição falhar ou não houver perfil.
export async function updateProfileAtomic(db: Db, id: string, input: { fullName?: string; phone?: string | null; isDriver?: boolean; isHost?: boolean }) {
  const d = input.isDriver === undefined ? sql`${profiles.isDriver}` : sql`${input.isDriver}`;
  const h = input.isHost === undefined ? sql`${profiles.isHost}` : sql`${input.isHost}`;
  const [row] = await db.update(profiles).set({
    ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    isDriver: sql`${d}`,
    isHost: sql`${h}`,
    updatedAt: sql`now()`,
  }).where(and(eq(profiles.id, id), sql`(${d} or ${h})`)).returning();
  return row as ProfileRow | undefined;
}
