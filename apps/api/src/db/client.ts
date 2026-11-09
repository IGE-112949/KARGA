import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import type { Db } from './types.js';

export function createPool(databaseUrl: string): pg.Pool {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  // Ligações inativas fechadas pelo pooler emitem 'error'; sem listener o Node termina o processo.
  pool.on('error', (err) => console.error('Erro numa ligação inativa à base de dados:', err.message));
  return pool;
}

export function createDb(databaseUrl: string): Db {
  return drizzle(createPool(databaseUrl), { schema }) as unknown as Db;
}
