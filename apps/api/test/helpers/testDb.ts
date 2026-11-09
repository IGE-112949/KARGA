import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { postgis } from '@electric-sql/pglite-postgis';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '../../src/db/schema.js';
import type { Db } from '../../src/db/types.js';

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '../../../../db/migrations');

// Base de dados de teste em memória com as mesmas migrações do Supabase.
export async function createTestDb(): Promise<{ db: Db; pg: PGlite }> {
  const pg = await PGlite.create({ extensions: { postgis, btree_gist } });
  // O Supabase tem o schema "auth" e o search_path inclui "extensions"; simula-se aqui.
  await pg.exec(`
    create schema auth;
    create table auth.users (id uuid primary key);
    set search_path to public, extensions;
  `);
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    await pg.exec(readFileSync(join(migrationsDir, file), 'utf8'));
  }
  const db = drizzle(pg, { schema }) as unknown as Db;
  return { db, pg };
}

let cached: Promise<{ db: Db; pg: PGlite }> | null = null;

// Uma base por ficheiro de teste, limpa entre testes (criar o PostGIS demora vários segundos).
export async function getCleanTestDb(): Promise<{ db: Db; pg: PGlite }> {
  cached ??= createTestDb();
  const t = await cached;
  await t.pg.exec(`
    truncate auth.users, profiles, vehicles, spaces, space_photos, space_availability, space_blocks, bookings cascade;
  `);
  return t;
}
