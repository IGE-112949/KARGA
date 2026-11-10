import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './helpers/testApp.js';
import * as svc from '../src/modules/spaces/service.js';
import type { Db } from '../src/db/types.js';

const HOST = '12121212-1212-4121-8121-121212121212';
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
const data = {
  title: 'Garagem', address: 'Rua Ferreira Borges, 40', latitude: 38.7, longitude: -9.1, spaceType: 'covered',
  plugType: 'type2', powerKw: 7.4, pricePerHour: 0.3, availability: [{ weekday: 0, startTime: '09:00', endTime: '18:00' }],
};

let t: Awaited<ReturnType<typeof createTestApp>>;
let token: string;
let id: string;
const auth = () => ({ Authorization: `Bearer ${token}` });
const day = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

beforeEach(async () => {
  t = await createTestApp();
  token = await t.tokenFor(HOST);
  await request(t.app).post('/me').set(auth()).send({ fullName: 'Host', isDriver: false, isHost: true, acceptTerms: true }).expect(201);
  id = (await request(t.app).post('/me/spaces').set(auth()).field('data', JSON.stringify(data)).attach('photos', JPEG, 'a.jpg').expect(201)).body.id;
});

describe('espaços: casos-limite', () => {
  it('editar um espaço eliminado não o volta a ativar (404)', async () => {
    await request(t.app).delete(`/me/spaces/${id}`).set(auth()).expect(204);
    await request(t.app).patch(`/me/spaces/${id}`).set(auth()).send({ status: 'active' }).expect(404);
    const r = await t.pg.query<{ status: string }>('select status from spaces where id = $1', [id]);
    expect(r.rows[0].status).toBe('deleted');
  });

  it('preço com mais de 2 casas decimais é recusado com mensagem', async () => {
    const r = await request(t.app).patch(`/me/spaces/${id}`).set(auth()).send({ pricePerHour: 0.333 }).expect(400);
    expect(r.body.error.details[0]).toMatchObject({ field: 'pricePerHour', message: 'Preço por hora: usa no máximo 2 casas decimais' });
  });

  it('energia aceita 3 casas e recusa 4', async () => {
    await request(t.app).patch(`/me/spaces/${id}`).set(auth()).send({ energyPriceKwh: 0.155 }).expect(200);
    await request(t.app).patch(`/me/spaces/${id}`).set(auth()).send({ energyPriceKwh: 0.1555 }).expect(400);
  });

  it('falha do Storage devolve 503 STORAGE_UNAVAILABLE com mensagem clara', async () => {
    t.spacePhotos.failOn = 2; // o 1.º envio foi o do beforeEach
    const r = await request(t.app).post(`/me/spaces/${id}/photos`).set(auth()).attach('file', JPEG, 'c.jpg').expect(503);
    expect(r.body.error.code).toBe('STORAGE_UNAVAILABLE');
  });

  it('com 5 fotos, a 6.ª é recusada antes de ser enviada para o Storage', async () => {
    for (let i = 0; i < 4; i++) await request(t.app).post(`/me/spaces/${id}/photos`).set(auth()).attach('file', JPEG, 'c.jpg').expect(201);
    const sent = t.spacePhotos.uploaded.length;
    const r = await request(t.app).post(`/me/spaces/${id}/photos`).set(auth()).attach('file', JPEG, 'c.jpg').expect(409);
    expect(r.body.error.code).toBe('TOO_MANY_PHOTOS');
    expect(t.spacePhotos.uploaded.length).toBe(sent);
  });

  it('o endereço das fotos não inclui o id do proprietário', async () => {
    const s = (await request(t.app).get(`/me/spaces/${id}`).set(auth())).body;
    expect(s.photos[0].url).not.toContain(HOST);
    expect(s.photos[0].url).toContain(id);
  });

  it('ficheiro com o nome de campo errado dá INVALID_IMAGE', async () => {
    const r = await request(t.app).post(`/me/spaces/${id}/photos`).set(auth()).attach('foto', JPEG, 'c.jpg').expect(400);
    expect(r.body.error.code).toBe('INVALID_IMAGE');
    const c = await request(t.app).post('/me/spaces').set(auth()).field('data', JSON.stringify(data)).attach('imagens', JPEG, 'a.jpg').expect(400);
    expect(c.body.error.code).toBe('INVALID_IMAGE');
  });

  it('6 fotos na criação continua a dar TOO_MANY_PHOTOS', async () => {
    const r = request(t.app).post('/me/spaces').set(auth()).field('data', JSON.stringify(data));
    for (let i = 0; i < 6; i++) r.attach('photos', JPEG, `${i}.jpg`);
    expect((await r.expect(409)).body.error.code).toBe('TOO_MANY_PHOTOS');
  });

  it('se a base de dados falhar depois do envio, as fotos enviadas são apagadas e nada fica criado', async () => {
    const failing = new Proxy(t.db as Db, {
      get(target, prop, recv) {
        if (prop === 'transaction') return async () => { throw new Error('BD em baixo'); };
        return Reflect.get(target, prop, recv);
      },
    });
    const file = { buffer: JPEG } as Express.Multer.File;
    const before = t.spacePhotos.uploaded.length;
    const { availability, ...rest } = data;
    await expect(svc.createSpace(failing, t.spacePhotos, HOST, { ...rest, availability, spaceType: 'covered', plugType: 'type2' } as never, [file, file]))
      .rejects.toThrow('BD em baixo');
    const sent = t.spacePhotos.uploaded.slice(before);
    expect(sent).toHaveLength(2);
    expect(t.spacePhotos.removed).toEqual(expect.arrayContaining(sent));
    const n = await t.pg.query('select 1 from spaces where owner_id = $1', [HOST]);
    expect(n.rows).toHaveLength(1);
  });
});

describe('bloqueios: casos-limite', () => {
  it('bloqueio que já terminou é recusado', async () => {
    const r = await request(t.app).post(`/me/spaces/${id}/blocks`).set(auth()).send({ startsAt: day(-5), endsAt: day(-2) }).expect(400);
    expect(r.body.error.code).toBe('BLOCK_IN_PAST');
  });

  it('bloqueio sobreposto a outro é recusado', async () => {
    await request(t.app).post(`/me/spaces/${id}/blocks`).set(auth()).send({ startsAt: day(2), endsAt: day(6) }).expect(201);
    const r = await request(t.app).post(`/me/spaces/${id}/blocks`).set(auth()).send({ startsAt: day(5), endsAt: day(9) }).expect(409);
    expect(r.body.error.code).toBe('BLOCK_OVERLAP');
    await request(t.app).post(`/me/spaces/${id}/blocks`).set(auth()).send({ startsAt: day(6), endsAt: day(9) }).expect(201);
  });
});
