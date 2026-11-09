import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { SignJWT } from 'jose';
import { requireAuth } from '../src/middleware/requireAuth.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { createHs256Verifier } from '../src/auth/verifier.js';

const SECRET = 'test-secret';
const ISSUER = 'test-issuer';
const USER = '33333333-3333-4333-8333-333333333333';

async function sign(opts: { issuer?: string; exp?: string | number } = {}) {
  return new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(USER)
    .setIssuer(opts.issuer ?? ISSUER)
    .setAudience('authenticated')
    .setIssuedAt()
    .setExpirationTime(opts.exp ?? '1h')
    .sign(new TextEncoder().encode(SECRET));
}

function miniApp() {
  const app = express();
  app.use(requireAuth(createHs256Verifier(SECRET, ISSUER)));
  app.get('/whoami', (req, res) => res.json({ userId: req.userId }));
  app.get('/boom', () => {
    throw new Error('boom');
  });
  app.use(errorHandler);
  return app;
}

describe('requireAuth', () => {
  it('sem header devolve 401 UNAUTHORIZED', async () => {
    const res = await request(miniApp()).get('/whoami');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('token malformado devolve 401', async () => {
    const res = await request(miniApp()).get('/whoami').set('Authorization', 'Bearer lixo');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('token expirado devolve 401', async () => {
    const token = await sign({ exp: Math.floor(Date.now() / 1000) - 60 });
    const res = await request(miniApp()).get('/whoami').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('token de outro emissor devolve 401', async () => {
    const token = await sign({ issuer: 'outro' });
    const res = await request(miniApp()).get('/whoami').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('token válido expõe o userId', async () => {
    const token = await sign();
    const res = await request(miniApp()).get('/whoami').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: USER });
  });
});

describe('errorHandler', () => {
  it('erro inesperado devolve 500 sem detalhes técnicos', async () => {
    const token = await sign();
    const res = await request(miniApp()).get('/boom').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro inesperado.' } });
  });
});
