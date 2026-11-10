import { describe, it, expect, vi, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { SignJWT, errors } from 'jose';
import { createTestApp } from './helpers/testApp.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { createKeyVerifier } from '../src/auth/verifier.js';
import { requireAuth } from '../src/middleware/requireAuth.js';
import { createHs256Verifier } from '../src/auth/verifier.js';

const U = '77777777-7777-4777-8777-777777777777';
const profileBody = { fullName: 'Rita Teste', isDriver: true, isHost: true, acceptTerms: true };

afterEach(() => vi.restoreAllMocks());

describe('API: corpo grande e rotas desconhecidas', () => {
  it('corpo acima de 100 kB devolve 413 em JSON', async () => {
    const t = await createTestApp();
    const h = { Authorization: `Bearer ${await t.tokenFor(U)}` };
    const res = await request(t.app).patch('/me').set(h).send({ fullName: 'x'.repeat(120_000) });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('rota desconhecida devolve 404 em JSON', async () => {
    const t = await createTestApp();
    const h = { Authorization: `Bearer ${await t.tokenFor(U)}` };
    const res = await request(t.app).get('/nao-existe').set(h);
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('PATCH /me e POST /me em casos-limite', () => {
  it('dois PATCH simultâneos a desligar cada um um modo: um passa, o outro dá 400 (nunca 500)', async () => {
    const t = await createTestApp();
    const h = { Authorization: `Bearer ${await t.tokenFor(U)}` };
    await request(t.app).post('/me').set(h).send(profileBody);
    const [a, b] = await Promise.all([
      request(t.app).patch('/me').set(h).send({ isDriver: false }),
      request(t.app).patch('/me').set(h).send({ isHost: false }),
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 400]);
    const r = await t.pg.query<{ is_driver: boolean; is_host: boolean }>('select is_driver, is_host from profiles where id = $1', [U]);
    expect(r.rows[0].is_driver || r.rows[0].is_host).toBe(true);
  });

  it('PATCH /me quando o perfil desaparece a meio devolve 404', async () => {
    const t = await createTestApp();
    const h = { Authorization: `Bearer ${await t.tokenFor(U)}` };
    await request(t.app).post('/me').set(h).send(profileBody);
    const [del, patch] = await Promise.all([
      request(t.app).delete('/me').set(h),
      request(t.app).patch('/me').set(h).send({ fullName: 'Outro Nome' }),
    ]);
    expect(del.status).toBe(204);
    expect([200, 404]).toContain(patch.status);
  });

  it('token ainda válido de uma conta apagada: POST /me devolve 401, não 500', async () => {
    const t = await createTestApp();
    const token = await t.tokenFor(U);
    await t.pg.query('delete from auth.users where id = $1', [U]);
    const res = await request(t.app).post('/me').set({ Authorization: `Bearer ${token}` }).send(profileBody);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('apagar a conta apaga também as fotos dos espaços do Storage', async () => {
    const t = await createTestApp();
    const h = { Authorization: `Bearer ${await t.tokenFor(U)}` };
    await request(t.app).post('/me').set(h).send(profileBody).expect(201);
    const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
    const data = { title: 'Garagem', address: 'Rua Ferreira Borges, 40', latitude: 38.7, longitude: -9.1, spaceType: 'covered',
      plugType: 'type2', powerKw: 7.4, pricePerHour: 0.3, availability: [{ weekday: 0, startTime: '09:00', endTime: '18:00' }] };
    await request(t.app).post('/me/spaces').set(h).field('data', JSON.stringify(data)).attach('photos', JPEG, 'a.jpg').attach('photos', JPEG, 'b.jpg').expect(201);
    const sent = [...t.spacePhotos.uploaded];
    await request(t.app).delete('/me').set(h).expect(204);
    expect(t.spacePhotos.removed).toEqual(expect.arrayContaining(sent));
  });

  it('o endereço da foto de perfil não inclui o id do utilizador', async () => {
    const t = await createTestApp();
    const h = { Authorization: `Bearer ${await t.tokenFor(U)}` };
    await request(t.app).post('/me').set(h).send(profileBody).expect(201);
    const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
    const r = await request(t.app).put('/me/avatar').set(h).attach('file', JPEG, 'a.jpg');
    expect(r.status).toBe(200);
    expect(r.body.avatarUrl).not.toContain(U);
  });

  it('utilizador sem perfil (registo a meio) pode apagar a conta da Auth', async () => {
    const t = await createTestApp();
    const h = { Authorization: `Bearer ${await t.tokenFor(U)}` };
    const res = await request(t.app).delete('/me').set(h);
    expect(res.status).toBe(204);
    expect(t.authAdmin.deleted).toEqual([U]);
  });
});

describe('Autenticação', () => {
  const ISSUER = 'https://x.supabase.co/auth/v1';
  const token = () => new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(U).setIssuer(ISSUER)
    .setAudience('authenticated').setExpirationTime('1h').sign(new TextEncoder().encode('s'));

  it('falha de rede a obter as chaves (JWKS) dá 503, não 401', async () => {
    const v = createKeyVerifier(async () => { throw new TypeError('fetch failed'); }, ISSUER);
    await expect(v.verify(await token())).rejects.toMatchObject({ status: 503, code: 'AUTH_UNAVAILABLE' });
  });

  it('tempo esgotado a obter as chaves dá 503', async () => {
    const v = createKeyVerifier(async () => { throw new errors.JWKSTimeout(); }, ISSUER);
    await expect(v.verify(await token())).rejects.toMatchObject({ status: 503 });
  });

  it('resposta de erro do servidor de chaves (ex.: 502, HTML) dá 503, não 401', async () => {
    const v = createKeyVerifier(async () => { throw new errors.JOSEError('Expected 200 OK from the JSON Web Key Set HTTP response'); }, ISSUER);
    await expect(v.verify(await token())).rejects.toMatchObject({ status: 503 });
  });

  it('token mal formado continua a dar 401', async () => {
    const v = createKeyVerifier(async () => { throw new Error('não devia chegar aqui'); }, ISSUER);
    await expect(v.verify('isto.nao.e-um-token')).rejects.toMatchObject({ status: 401 });
  });

  it('chave que não corresponde continua a dar 401', async () => {
    const v = createKeyVerifier(async () => { throw new errors.JWKSNoMatchingKey(); }, ISSUER);
    await expect(v.verify(await token())).rejects.toMatchObject({ status: 401 });
  });

  it('"bearer" em minúsculas também é aceite', async () => {
    const SECRET = 'test-secret';
    const app = express();
    app.use(requireAuth(createHs256Verifier(SECRET, 'iss')));
    app.get('/whoami', (req, res) => res.json({ userId: req.userId }));
    app.use(errorHandler);
    const tok = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(U).setIssuer('iss')
      .setAudience('authenticated').setExpirationTime('1h').sign(new TextEncoder().encode(SECRET));
    const res = await request(app).get('/whoami').set('Authorization', `bearer ${tok}`);
    expect(res.status).toBe(200);
  });
});

describe('Registos (logs)', () => {
  it('um erro 500 não escreve no registo os valores do pedido (ex.: telemóvel)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = express();
    app.get('/boom', () => {
      throw Object.assign(new Error('Failed query: update "profiles" set "phone" = $1\nparams: +351912345678,abc'), {
        cause: { code: '42P01', message: 'relation does not exist' },
      });
    });
    app.use(errorHandler);
    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    const logged = spy.mock.calls.map((c) => c.map((x) => (x instanceof Error ? `${x.message} ${x.stack}` : String(x))).join(' ')).join('\n');
    expect(logged).not.toContain('912345678');
    expect(logged).toContain('relation does not exist');
  });
});
