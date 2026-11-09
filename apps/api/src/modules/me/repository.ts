import { eq, sql } from 'drizzle-orm';
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
