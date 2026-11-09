import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './helpers/testApp.js';

const HOST = '11111111-1111-4111-8111-111111111111';
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
const data = {
  title: 'Garagem', address: 'Rua Ferreira Borges, 40', latitude: 38.7, longitude: -9.1, spaceType: 'covered',
  plugType: 'type2', powerKw: 7.4, pricePerHour: 0.3, availability: [{ weekday: 0, startTime: '09:00', endTime: '18:00' }],
};

let t: Awaited<ReturnType<typeof createTestApp>>;
let token: string;
let id: string;
const auth = () => ({ Authorization: `Bearer ${token}` });

beforeEach(async () => {
  t = await createTestApp();
  token = await t.tokenFor(HOST);
  await request(t.app).post('/me').set(auth()).send({ fullName: 'Host', isDriver: false, isHost: true, acceptTerms: true }).expect(201);
  const r = request(t.app).post('/me/spaces').set(auth()).field('data', JSON.stringify(data));
  r.attach('photos', JPEG, 'a.jpg').attach('photos', JPEG, 'b.jpg');
  id = (await r.expect(201)).body.id;
});

const addPhoto = () => request(t.app).post(`/me/spaces/${id}/photos`).set(auth()).attach('file', JPEG, 'c.jpg');

describe('fotografias', () => {
  it('adiciona até 5; a 6.ª → TOO_MANY_PHOTOS e não fica no Storage', async () => {
    for (let i = 0; i < 3; i++) await addPhoto().expect(201);
    const before = t.spacePhotos.removed.length;
    const r = await addPhoto().expect(409);
    expect(r.body.error.code).toBe('TOO_MANY_PHOTOS');
    expect(t.spacePhotos.removed.length).toBe(before + 1);
  });

  it('pedidos em paralelo nunca deixam mais de 5', async () => {
    const results = await Promise.all([addPhoto(), addPhoto(), addPhoto(), addPhoto()]);
    expect(results.filter((r) => r.status === 201)).toHaveLength(3);
    const s = await request(t.app).get(`/me/spaces/${id}`).set(auth()).expect(200);
    expect(s.body.photos).toHaveLength(5);
  });

  it('tornar capa reordena; remover apaga do Storage; última → LAST_PHOTO', async () => {
    const s = (await request(t.app).get(`/me/spaces/${id}`).set(auth())).body;
    const [first, second] = s.photos;
    const r = await request(t.app).patch(`/me/spaces/${id}/photos/${second.id}`).set(auth()).send({ isCover: true }).expect(200);
    expect(r.body.photos[0]).toMatchObject({ id: second.id, isCover: true });
    await request(t.app).delete(`/me/spaces/${id}/photos/${second.id}`).set(auth()).expect(200);
    expect(t.spacePhotos.removed.some((p) => second.url.endsWith(p))).toBe(true);
    const last = await request(t.app).delete(`/me/spaces/${id}/photos/${first.id}`).set(auth()).expect(409);
    expect(last.body.error.code).toBe('LAST_PHOTO');
  });

  it('foto inexistente → PHOTO_NOT_FOUND', async () => {
    const r = await request(t.app).delete(`/me/spaces/${id}/photos/00000000-0000-4000-8000-000000000000`).set(auth()).expect(404);
    expect(r.body.error.code).toBe('PHOTO_NOT_FOUND');
  });
});

describe('bloqueios', () => {
  it('cria, lista e remove', async () => {
    const created = await request(t.app).post(`/me/spaces/${id}/blocks`).set(auth())
      .send({ startsAt: '2026-12-20T00:00:00Z', endsAt: '2026-12-27T00:00:00Z', reason: 'Férias' }).expect(201);
    expect(created.body).toHaveLength(1);
    expect(created.body[0]).toMatchObject({ reason: 'Férias' });
    const list = await request(t.app).get(`/me/spaces/${id}/blocks`).set(auth()).expect(200);
    await request(t.app).delete(`/me/spaces/${id}/blocks/${list.body[0].id}`).set(auth()).expect(204);
    expect((await request(t.app).get(`/me/spaces/${id}/blocks`).set(auth())).body).toEqual([]);
  });

  it('fim antes do início → 400; bloqueio inexistente → 404', async () => {
    await request(t.app).post(`/me/spaces/${id}/blocks`).set(auth())
      .send({ startsAt: '2026-12-27T00:00:00Z', endsAt: '2026-12-20T00:00:00Z' }).expect(400);
    const r = await request(t.app).delete(`/me/spaces/${id}/blocks/00000000-0000-4000-8000-000000000000`).set(auth()).expect(404);
    expect(r.body.error.code).toBe('BLOCK_NOT_FOUND');
  });
});
