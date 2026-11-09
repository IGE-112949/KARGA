import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './helpers/testApp.js';

const HOST = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const DRIVER = '33333333-3333-4333-8333-333333333333';
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);

const base = {
  title: 'Garagem do Tiago',
  address: 'Rua Ferreira Borges, 40, Lisboa',
  spotDetails: 'Piso -1 · Lugar 7',
  latitude: 38.7183,
  longitude: -9.1655,
  spaceType: 'closed_garage',
  plugType: 'type2',
  powerKw: 7.4,
  pricePerHour: 0.3,
  energyPriceKwh: 0.15,
  accessInstructions: 'Portão à esquerda',
  accessCode: '1234#',
  availability: [
    { weekday: 0, startTime: '19:00', endTime: '08:00' },
    { weekday: 5, startTime: '00:00', endTime: '24:00' },
  ],
};

let t: Awaited<ReturnType<typeof createTestApp>>;
let host: string;

async function profile(id: string, isHost: boolean) {
  const token = await t.tokenFor(id);
  await request(t.app).post('/me').set('Authorization', `Bearer ${token}`)
    .send({ fullName: 'Teste', isDriver: true, isHost, acceptTerms: true }).expect(201);
  return token;
}

function create(token: string, data: unknown = base, photos = 1) {
  const r = request(t.app).post('/me/spaces').set('Authorization', `Bearer ${token}`).field('data', JSON.stringify(data));
  for (let i = 0; i < photos; i++) r.attach('photos', JPEG, `f${i}.jpg`);
  return r;
}

beforeEach(async () => {
  t = await createTestApp();
  host = await profile(HOST, true);
});

describe('POST /me/spaces', () => {
  it('cria o espaço com fotos ordenadas e horário', async () => {
    const r = await create(host, base, 2).expect(201);
    expect(r.body).toMatchObject({ title: 'Garagem do Tiago', powerKw: 7.4, pricePerHour: 0.3, energyPriceKwh: 0.15, status: 'active', accessCode: '1234#' });
    expect(r.body.latitude).toBeCloseTo(38.7183);
    expect(r.body.photos).toHaveLength(2);
    expect(r.body.photos[0].isCover).toBe(true);
    expect(r.body.availability).toEqual(base.availability);
  });

  it('perfil sem modo proprietário → 403 HOST_REQUIRED', async () => {
    const driver = await profile(DRIVER, false);
    const r = await create(driver).expect(403);
    expect(r.body.error.code).toBe('HOST_REQUIRED');
  });

  it('sem fotos → PHOTOS_REQUIRED; 6 fotos → TOO_MANY_PHOTOS', async () => {
    expect((await create(host, base, 0).expect(400)).body.error.code).toBe('PHOTOS_REQUIRED');
    expect((await create(host, base, 6).expect(409)).body.error.code).toBe('TOO_MANY_PHOTOS');
  });

  it('ficheiro que não é imagem → INVALID_IMAGE', async () => {
    const r = await request(t.app).post('/me/spaces').set('Authorization', `Bearer ${host}`)
      .field('data', JSON.stringify(base)).attach('photos', Buffer.from('nada de imagem'), 'x.jpg').expect(400);
    expect(r.body.error.code).toBe('INVALID_IMAGE');
  });

  it.each([
    [{ plugType: 'ccs' }, 'plugType'],
    [{ pricePerHour: 0.05 }, 'pricePerHour'],
    [{ pricePerHour: 25 }, 'pricePerHour'],
    [{ energyPriceKwh: 2 }, 'energyPriceKwh'],
    [{ plugType: 'schuko', powerKw: 7.4 }, 'powerKw'],
    [{ powerKw: 30 }, 'powerKw'],
    [{ latitude: 95 }, 'latitude'],
    [{ title: 'A' }, 'title'],
    [{ accessCode: 'x'.repeat(21) }, 'accessCode'],
  ])('regra %j → 400 em %s', async (patch, field) => {
    const r = await create(host, { ...base, ...patch }).expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
    expect(r.body.error.details.map((d: { field: string }) => d.field)).toContain(field);
  });

  it('Schuko 13 A (3,0 kW) e sem €/kWh é válido', async () => {
    const r = await create(host, { ...base, plugType: 'schuko', powerKw: 3, energyPriceKwh: null }).expect(201);
    expect(r.body.energyPriceKwh).toBeNull();
  });

  it('falha do Storage na 3.ª foto → nada criado e as anteriores apagadas', async () => {
    t.spacePhotos.failOn = 3;
    await create(host, base, 3).expect(500);
    expect(t.spacePhotos.removed).toHaveLength(2);
    const list = await request(t.app).get('/me/spaces').set('Authorization', `Bearer ${host}`).expect(200);
    expect(list.body).toEqual([]);
  });
});

describe('listar, detalhe, editar, eliminar', () => {
  let id: string;
  beforeEach(async () => {
    id = (await create(host, base, 2).expect(201)).body.id;
  });

  it('lista sem código de acesso, com capa', async () => {
    const r = await request(t.app).get('/me/spaces').set('Authorization', `Bearer ${host}`).expect(200);
    expect(r.body).toHaveLength(1);
    expect(r.body[0].coverUrl).toBeTruthy();
    expect(r.body[0].accessCode).toBeUndefined();
  });

  it('espaço de outro proprietário → 404', async () => {
    const other = await profile(OTHER, true);
    expect((await request(t.app).get(`/me/spaces/${id}`).set('Authorization', `Bearer ${other}`).expect(404)).body.error.code).toBe('SPACE_NOT_FOUND');
    await request(t.app).patch(`/me/spaces/${id}`).set('Authorization', `Bearer ${other}`).send({ status: 'inactive' }).expect(404);
    await request(t.app).delete(`/me/spaces/${id}`).set('Authorization', `Bearer ${other}`).expect(404);
    await request(t.app).get('/me/spaces/nao-e-uuid').set('Authorization', `Bearer ${other}`).expect(404);
  });

  it('PATCH edita só o que vem e muda a visibilidade', async () => {
    const r = await request(t.app).patch(`/me/spaces/${id}`).set('Authorization', `Bearer ${host}`)
      .send({ pricePerHour: 0.5, status: 'inactive' }).expect(200);
    expect(r.body).toMatchObject({ pricePerHour: 0.5, status: 'inactive', title: 'Garagem do Tiago' });
  });

  it('PATCH não aceita status deleted nem ficha incompatível com a potência', async () => {
    await request(t.app).patch(`/me/spaces/${id}`).set('Authorization', `Bearer ${host}`).send({ status: 'deleted' }).expect(400);
    await request(t.app).patch(`/me/spaces/${id}`).set('Authorization', `Bearer ${host}`).send({ plugType: 'schuko' }).expect(400);
  });

  it('PUT availability substitui o horário', async () => {
    const av = [{ weekday: 6, startTime: '10:00', endTime: '18:00' }];
    const r = await request(t.app).put(`/me/spaces/${id}/availability`).set('Authorization', `Bearer ${host}`).send(av).expect(200);
    expect(r.body.availability).toEqual(av);
    await request(t.app).put(`/me/spaces/${id}/availability`).set('Authorization', `Bearer ${host}`)
      .send([{ weekday: 1, startTime: '24:00', endTime: '08:00' }]).expect(400);
  });

  it('DELETE muda para eliminado: some da lista e do detalhe', async () => {
    await request(t.app).delete(`/me/spaces/${id}`).set('Authorization', `Bearer ${host}`).expect(204);
    expect((await request(t.app).get('/me/spaces').set('Authorization', `Bearer ${host}`)).body).toEqual([]);
    await request(t.app).get(`/me/spaces/${id}`).set('Authorization', `Bearer ${host}`).expect(404);
    const row = await t.pg.query<{ status: string; deleted_at: string | null }>('select status, deleted_at from spaces where id = $1', [id]);
    expect(row.rows[0].status).toBe('deleted');
    expect(row.rows[0].deleted_at).not.toBeNull();
  });

  async function booking(startOffset: string, endOffset: string) {
    await t.pg.query('insert into auth.users (id) values ($1) on conflict do nothing', [DRIVER]);
    await t.pg.query(`insert into profiles (id, full_name, is_driver, is_host, terms_accepted_at) values ($1,'D',true,false,now()) on conflict do nothing`, [DRIVER]);
    await t.pg.query(
      `insert into bookings (space_id, driver_id, starts_at, ends_at, price_per_hour, service_fee_percent, service_fee, estimated_total)
       values ($1, $2, now() + $3::interval, now() + $4::interval, 0.30, 10, 0.06, 0.66)`, [id, DRIVER, startOffset, endOffset]);
  }

  it('DELETE com reserva confirmada futura → SPACE_HAS_BOOKINGS', async () => {
    await booking('1 day', '1 day 2 hours');
    const r = await request(t.app).delete(`/me/spaces/${id}`).set('Authorization', `Bearer ${host}`).expect(409);
    expect(r.body.error.code).toBe('SPACE_HAS_BOOKINGS');
  });

  it('DELETE com reserva já terminada é permitido', async () => {
    await booking('-2 days', '-1 day -22 hours');
    await request(t.app).delete(`/me/spaces/${id}`).set('Authorization', `Bearer ${host}`).expect(204);
  });
});
