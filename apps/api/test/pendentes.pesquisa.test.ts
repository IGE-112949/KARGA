import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './helpers/testApp.js';
import { addDays, lisbonToUtc, requestInterval, todayLisbon } from '../src/modules/search/availability.js';
import { searchConfig } from '../src/modules/search/service.js';

const H = 3_600_000;

describe('mudança de hora (Lisboa)', () => {
  it('outono (25 out 2026): 2 h a começar à 01:00 duram 2 h reais', () => {
    const { from, to } = requestInterval({ date: '2026-10-25', start: '01:00', hours: 2 });
    expect(to.getTime() - from.getTime()).toBe(2 * H);
  });

  it('outono: 1:30 com 1 h também dura 1 h', () => {
    const { from, to } = requestInterval({ date: '2026-10-25', start: '01:30', hours: 1 });
    expect(to.getTime() - from.getTime()).toBe(H);
  });

  it('primavera (28 mar 2027): 01:30 não existe e passa para as 02:30 de verão, com 2 h reais', () => {
    const { from, to } = requestInterval({ date: '2027-03-28', start: '01:30', hours: 2 });
    expect(from.toISOString()).toBe('2027-03-28T01:30:00.000Z');
    expect(to.getTime() - from.getTime()).toBe(2 * H);
  });

  it('dias normais continuam iguais', () => {
    expect(lisbonToUtc('2026-07-01', 600).toISOString()).toBe('2026-07-01T09:00:00.000Z');
    expect(lisbonToUtc('2026-12-01', 600).toISOString()).toBe('2026-12-01T10:00:00.000Z');
  });
});

const HOST = '31313131-3131-4313-8313-313131313131';
const DRIVER = '32323232-3232-4323-8323-323232323232';
const BBOX = '-9.30,38.70,-9.10,38.90';
let t: Awaited<ReturnType<typeof createTestApp>>;
let driver: string;

async function profile(id: string, isHost: boolean) {
  const token = await t.tokenFor(id);
  await request(t.app).post('/me').set('Authorization', `Bearer ${token}`)
    .send({ fullName: 'Pessoa Teste', isDriver: true, isHost, acceptTerms: true }).expect(201);
  return token;
}
async function space(price: number, free: boolean) {
  const r = await t.pg.query<{ id: string }>(
    `insert into spaces (owner_id, title, address, area, location, space_type, power_kw, plug_type, price_per_hour, status)
     values ($1, 'G', 'Rua, 1', 'Odivelas', ST_SetSRID(ST_MakePoint(-9.18, 38.79), 4326), 'closed_garage', 7.4, 'type2', $2, 'active') returning id`, [HOST, price]);
  const id = r.rows[0].id;
  if (free) for (let wd = 0; wd < 7; wd++) await t.pg.query(`insert into space_availability (space_id, weekday, start_time, end_time) values ($1, $2, '00:00', '24:00')`, [id, wd]);
  return id;
}

beforeEach(async () => {
  t = await createTestApp();
  await profile(HOST, true);
  driver = await profile(DRIVER, false);
});

describe('pesquisa: casos-limite', () => {
  it('hora de hoje que já passou é recusada', async () => {
    const now = new Date();
    if (now.getUTCHours() < 2) return; // perto da meia-noite não há "hora que já passou" hoje
    const r = await request(t.app).get('/spaces/search').set('Authorization', `Bearer ${driver}`)
      .query({ bbox: BBOX, date: todayLisbon(), start: '00:00', hours: 1 }).expect(400);
    expect(r.body.error.details[0]).toMatchObject({ field: 'start', message: 'Essa hora já passou. Escolhe uma hora a partir de agora.' });
  });

  it('com muitos espaços ocupados à frente, continua a procurar até encontrar os livres', async () => {
    const old = searchConfig.pageSize;
    searchConfig.pageSize = 3;
    try {
      for (let i = 0; i < 7; i++) await space(0.1 + i * 0.01, false); // os mais baratos estão todos ocupados
      const freeId = await space(1, true);
      const r = await request(t.app).get('/spaces/search').set('Authorization', `Bearer ${driver}`)
        .query({ bbox: BBOX, date: addDays(todayLisbon(), 1), start: '10:00', hours: 1 }).expect(200);
      expect(r.body.map((s: { id: string }) => s.id)).toEqual([freeId]);
    } finally {
      searchConfig.pageSize = old;
    }
  });
});

describe('revisão final: pesquisa', () => {
  it('data ou hora mal formadas dão 400, não 500', async () => {
    for (const q of [{ date: 'abc', start: '10:00' }, { date: addDays(todayLisbon(), 1), start: 'xx' }]) {
      const r = await request(t.app).get('/spaces/search').set('Authorization', `Bearer ${driver}`).query({ bbox: BBOX, hours: 1, ...q });
      expect(r.status).toBe(400);
    }
  });
});
