import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import type { Db } from './types.js';

export function createDb(databaseUrl: string): Db {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  return drizzle(pool, { schema }) as unknown as Db;
}
