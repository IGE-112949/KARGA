import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './helpers/testApp.js';
import { addDays, todayLisbon } from '../src/modules/search/availability.js';

const HOST = '11111111-1111-4111-8111-111111111111';
const DRIVER = '22222222-2222-4222-8222-222222222222';
const BBOX = '-9.30,38.70,-9.10,38.90';

let t: Awaited<ReturnType<typeof createTestApp>>;
let driver: string;
const today = todayLisbon();

async function profile(id: string, isHost: boolean) {
  const token = await t.tokenFor(id);
  await request(t.app).post('/me').set('Authorization', `Bearer ${token}`)
    .send({ fullName: isHost ? 'Ana Maria Silva' : 'Rui Condutor', isDriver: true, isHost, acceptTerms: true }).expect(201);
  return token;
}

type Opts = { title?: string; lat?: number; lng?: number; price?: number; kw?: number; plug?: string; type?: string; status?: string; owner?: string; energy?: number | null; allDay?: boolean };
async function space(o: Opts = {}) {
  const r = await t.pg.query<{ id: string }>(
    `insert into spaces (owner_id, title, address, spot_details, area, location, space_type, power_kw, plug_type, price_per_hour, energy_price_kwh, access_code, status)
     values ($1, $2, 'Rua Secreta, 12, Odivelas', 'Piso -1', 'Odivelas', ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8, $9, '9999', $10) returning id`,
    [o.owner ?? HOST, o.title ?? 'Garagem', o.lng ?? -9.18, o.lat ?? 38.79, o.type ?? 'closed_garage', o.kw ?? 7.4, o.plug ?? 'type2', o.price ?? 0.3, o.energy === undefined ? 0.15 : o.energy, o.status ?? 'active']);
  const id = r.rows[0].id;
  if (o.allDay !== false) {
    for (let wd = 0; wd < 7; wd++) await t.pg.query(`insert into space_availability (space_id, weekday, start_time, end_time) values ($1, $2, '00:00', '24:00')`, [id, wd]);
  }
  await t.pg.query(`insert into space_photos (space_id, storage_path, position) values ($1, 'h/s/1.jpg', 0)`, [id]);
  return id;
}

const search = (q: Record<string, string | number> = {}) =>
  request(t.app).get('/spaces/search').set('Authorization', `Bearer ${driver}`)
    .query({ bbox: BBOX, date: today, start: '10:00', hours: 2, ...q });

beforeEach(async () => {
  t = await createTestApp();
  await profile(HOST, true);
  driver = await profile(DRIVER, false);
});

describe('GET /spaces/search', () => {
  it('devolve espaços livres, sem morada nem código, com ponto aproximado e estável', async () => {
    const id = await space();
    const r = await search().expect(200);
    expect(r.body).toHaveLength(1);
    const s = r.body[0];
    expect(s).toMatchObject({ id, title: 'Garagem', area: 'Odivelas', pricePerHour: 0.3, powerKw: 7.4, plugType: 'type2', isFavorite: false });
    expect(s.address).toBeUndefined();
    expect(s.accessCode).toBeUndefined();
    expect(s.spotDetails).toBeUndefined();
    const dLat = (s.latitude - 38.79) * 111320;
    const dLng = (s.longitude + 9.18) * 111320 * Math.cos((38.79 * Math.PI) / 180);
    const dist = Math.hypot(dLat, dLng);
    expect(dist).toBeGreaterThanOrEqual(49);
    expect(dist).toBeLessThanOrEqual(151);
    const again = await search().expect(200);
    expect(again.body[0].latitude).toBe(s.latitude);
  });

  it('exclui fora da zona, inativos, eliminados e os do próprio utilizador', async () => {
    await space({ lat: 41.15, lng: -8.61 });
    await space({ status: 'inactive' });
    await space({ status: 'deleted' });
    await space({ owner: DRIVER });
    expect((await search().expect(200)).body).toEqual([]);
  });

  it('filtros: preço, potência, ficha e coberta', async () => {
    await space({ title: 'Barata', price: 0.2, kw: 3.7, plug: 'schuko', type: 'outdoor' });
    await space({ title: 'Rápida', price: 0.4, kw: 11, plug: 'type2', type: 'covered' });
    const names = async (q: Record<string, string | number>) => (await search(q).expect(200)).body.map((s: { title: string }) => s.title);
    expect(await names({})).toEqual(['Barata', 'Rápida']);
    expect(await names({ maxPrice: 0.3 })).toEqual(['Barata']);
    expect(await names({ minKw: 7.4 })).toEqual(['Rápida']);
    expect(await names({ plug: 'schuko' })).toEqual(['Barata']);
    expect(await names({ covered: 'true' })).toEqual(['Rápida']);
  });

  it('respeita o horário, os bloqueios e as reservas', async () => {
    const noHours = await space({ title: 'Sem horário', allDay: false });
    const blocked = await space({ title: 'Bloqueada' });
    await t.pg.query(`insert into space_blocks (space_id, starts_at, ends_at) values ($1, now() - interval '1 day', now() + interval '5 days')`, [blocked]);
    await space({ title: 'Livre' });
    void noHours;
    expect((await search().expect(200)).body.map((s: { title: string }) => s.title)).toEqual(['Livre']);
  });

  it.each([
    [{ date: addDays(today, 4) }],
    [{ date: addDays(today, -1) }],
    [{ start: '10:15' }],
    [{ hours: 13 }],
    [{ bbox: '-10,36,-6,42' }],
    [{ bbox: '-9.1,38.9,-9.3,38.7' }],
    [{ bbox: 'abc' }],
  ])('parâmetros inválidos %j → 400', async (q) => {
    const r = await search(q).expect(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /spaces/:id', () => {
  it('detalhe público com custo estimado (lugar + energia + taxa 10%)', async () => {
    const id = await space({ price: 0.3, kw: 7.4, energy: 0.15 });
    const r = await request(t.app).get(`/spaces/${id}`).set('Authorization', `Bearer ${driver}`)
      .query({ date: today, start: '10:00', hours: 4 }).expect(200);
    expect(r.body).toMatchObject({ id, area: 'Odivelas', available: true, host: { firstName: 'Ana', initial: 'S' } });
    expect(r.body.address).toBeUndefined();
    expect(r.body.accessCode).toBeUndefined();
    expect(r.body.photos).toHaveLength(1);
    // lugar 0,30×4 = 1,20; energia min(7,4×4=29,6; 20) = 20 kWh × 0,15 = 3,00; taxa 10% de 4,20 = 0,42; total 4,62
    expect(r.body.cost).toEqual({ hours: 4, place: 1.2, energyKwh: 20, energy: 3, serviceFeePercent: 10, serviceFee: 0.42, total: 4.62 });
  });

  it('sem €/kWh a energia é 0; sem janela não há custo', async () => {
    const id = await space({ energy: null });
    const r = await request(t.app).get(`/spaces/${id}`).set('Authorization', `Bearer ${driver}`)
      .query({ date: today, start: '10:00', hours: 2 }).expect(200);
    expect(r.body.cost).toMatchObject({ energy: 0, energyKwh: 0, place: 0.6, serviceFee: 0.06, total: 0.66 });
    const plain = await request(t.app).get(`/spaces/${id}`).set('Authorization', `Bearer ${driver}`).expect(200);
    expect(plain.body.cost).toBeNull();
    expect(plain.body.available).toBeNull();
  });

  it('inativo, eliminado ou inexistente → 404', async () => {
    for (const status of ['inactive', 'deleted']) {
      const id = await space({ status });
      await request(t.app).get(`/spaces/${id}`).set('Authorization', `Bearer ${driver}`).expect(404);
    }
    await request(t.app).get('/spaces/nao-existe').set('Authorization', `Bearer ${driver}`).expect(404);
  });
});
