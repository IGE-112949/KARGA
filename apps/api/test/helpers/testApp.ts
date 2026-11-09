import { SignJWT } from 'jose';
import type { PGlite } from '@electric-sql/pglite';
import { createApp } from '../../src/app.js';
import { createHs256Verifier } from '../../src/auth/verifier.js';
import type { AuthAdmin } from '../../src/auth/admin.js';
import type { Db } from '../../src/db/types.js';
import { getCleanTestDb } from './testDb.js';

const SECRET = 'test-secret';
const ISSUER = 'test-issuer';

export class FakeAuthAdmin implements AuthAdmin {
  deleted: string[] = [];
  constructor(private pg: PGlite) {}
  async deleteUser(userId: string) {
    this.deleted.push(userId);
    await this.pg.query('delete from auth.users where id = $1', [userId]);
  }
}

export async function createTestApp() {
  const { db, pg } = await getCleanTestDb();
  const authAdmin = new FakeAuthAdmin(pg);
  const app = createApp({ db: db as Db, auth: createHs256Verifier(SECRET, ISSUER), authAdmin });

  // Cria o utilizador na "Auth" (se não existir) e devolve um token válido para ele.
  async function tokenFor(userId: string, opts: { expiresIn?: string } = {}) {
    await pg.query('insert into auth.users (id) values ($1) on conflict do nothing', [userId]);
    return new SignJWT({ role: 'authenticated' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuer(ISSUER)
      .setAudience('authenticated')
      .setIssuedAt()
      .setExpirationTime(opts.expiresIn ?? '1h')
      .sign(new TextEncoder().encode(SECRET));
  }

  return { app, db, pg, authAdmin, tokenFor };
}
