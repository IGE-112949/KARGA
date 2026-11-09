import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, type FakeAvatarStore } from './helpers/testApp.js';
import type { Express } from 'express';

const U = '99999999-9999-4999-8999-999999999999';
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100)]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(100)]);

let app: Express;
let avatars: FakeAvatarStore;
let h: Record<string, string>;

beforeEach(async () => {
  const t = await createTestApp();
  app = t.app;
  avatars = t.avatars;
  h = { Authorization: `Bearer ${await t.tokenFor(U)}` };
});

const createProfile = () =>
  request(app).post('/me').set(h).send({ fullName: 'Foto', isDriver: true, isHost: false, acceptTerms: true });

describe('PUT /me/avatar', () => {
  it('PNG válido grava a foto e devolve o perfil com avatarUrl', async () => {
    await createProfile();
    const res = await request(app).put('/me/avatar').set(h).attach('file', PNG, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toBe(avatars.uploaded[0]);
    const me = await request(app).get('/me').set(h);
    expect(me.body.avatarUrl).toBe(avatars.uploaded[0]);
  });

  it('nova foto remove a anterior do armazenamento', async () => {
    await createProfile();
    await request(app).put('/me/avatar').set(h).attach('file', PNG, { filename: 'a.png', contentType: 'image/png' });
    const res = await request(app).put('/me/avatar').set(h).attach('file', JPEG, { filename: 'b.jpg', contentType: 'image/jpeg' });
    expect(res.body.avatarUrl).toBe(avatars.uploaded[1]);
    expect(avatars.removed).toEqual([avatars.uploaded[0]]);
  });

  it('ficheiro que não é imagem (mesmo com content-type de imagem) devolve 400 INVALID_IMAGE', async () => {
    await createProfile();
    const res = await request(app).put('/me/avatar').set(h).attach('file', Buffer.from('olá, não sou um png'), { filename: 'x.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_IMAGE');
  });

  it('sem ficheiro devolve 400 INVALID_IMAGE', async () => {
    await createProfile();
    const res = await request(app).put('/me/avatar').set(h);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_IMAGE');
  });

  it('mais de 5 MB devolve 413 IMAGE_TOO_LARGE', async () => {
    await createProfile();
    const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
    const res = await request(app).put('/me/avatar').set(h).attach('file', big, { filename: 'big.png', contentType: 'image/png' });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('IMAGE_TOO_LARGE');
  });

  it('sem perfil devolve 404', async () => {
    const res = await request(app).put('/me/avatar').set(h).attach('file', PNG, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /me/avatar', () => {
  it('remove a foto', async () => {
    await createProfile();
    const up = await request(app).put('/me/avatar').set(h).attach('file', PNG, { filename: 'a.png', contentType: 'image/png' });
    const res = await request(app).delete('/me/avatar').set(h);
    expect(res.status).toBe(204);
    expect(avatars.removed).toEqual([up.body.avatarUrl]);
    const me = await request(app).get('/me').set(h);
    expect(me.body.avatarUrl).toBeNull();
  });
});

describe('DELETE /me', () => {
  it('apaga também a foto de perfil', async () => {
    await createProfile();
    const up = await request(app).put('/me/avatar').set(h).attach('file', PNG, { filename: 'a.png', contentType: 'image/png' });
    await request(app).delete('/me').set(h);
    expect(avatars.removed).toContain(up.body.avatarUrl);
  });
});
