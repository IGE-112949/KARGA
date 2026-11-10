import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './helpers/testApp.js';

const HOST = '11111111-1111-4111-8111-111111111111';
const DRIVER = '22222222-2222-4222-8222-222222222222';
let t: Awaited<ReturnType<typeof createTestApp>>;
let driver: string;
let host: string;
let id: string;

async function profile(uid: string, isHost: boolean) {
  const token = await t.tokenFor(uid);
  await request(t.app).post('/me').set('Authorization', `Bearer ${token}`).send({ fullName: 'Teste Um', isDriver: true, isHost, acceptTerms: true }).expect(201);
  return token;
}

beforeEach(async () => {
  t = await createTestApp();
  host = await profile(HOST, true);
  driver = await profile(DRIVER, false);
  id = (await t.pg.query<{ id: string }>(
    `insert into spaces (owner_id, title, address, area, location, space_type, power_kw, plug_type, price_per_hour)
     values ($1, 'Garagem', 'Rua X, 1, Loures', 'Loures', ST_SetSRID(ST_MakePoint(-9.17, 38.83), 4326), 'covered', 7.4, 'type2', 0.3) returning id`, [HOST])).rows[0].id;
});

const fav = (method: 'put' | 'delete', sid = id, token = driver) => request(t.app)[method](`/me/favorites/${sid}`).set('Authorization', `Bearer ${token}`);
const list = () => request(t.app).get('/me/favorites').set('Authorization', `Bearer ${driver}`).expect(200);

describe('favoritos', () => {
  it('adicionar e remover são idempotentes', async () => {
    await fav('put').expect(204);
    await fav('put').expect(204);
    const r = await list();
    expect(r.body).toHaveLength(1);
    expect(r.body[0]).toMatchObject({ id, title: 'Garagem', area: 'Loures', status: 'active', isFavorite: true });
    expect(r.body[0].address).toBeUndefined();
    await fav('delete').expect(204);
    await fav('delete').expect(204);
    expect((await list()).body).toEqual([]);
  });

  it('o próprio espaço não pode ser favorito; inexistente → 404', async () => {
    expect((await fav('put', id, host).expect(400)).body.error.code).toBe('OWN_SPACE');
    await fav('put', '00000000-0000-4000-8000-000000000000').expect(404);
    await fav('put', 'xpto').expect(404);
  });

  it('espaço eliminado desaparece da lista; inativo aparece como inactive', async () => {
    await fav('put').expect(204);
    await t.pg.query(`update spaces set status = 'inactive' where id = $1`, [id]);
    expect((await list()).body[0].status).toBe('inactive');
    await t.pg.query(`update spaces set status = 'deleted' where id = $1`, [id]);
    expect((await list()).body).toEqual([]);
  });

  it('a pesquisa marca os favoritos', async () => {
    await t.pg.query(`insert into space_availability (space_id, weekday, start_time, end_time) select $1, g, '00:00', '24:00' from generate_series(0,6) g`, [id]);
    await fav('put').expect(204);
    const { todayLisbon } = await import('../src/modules/search/availability.js');
    const r = await request(t.app).get('/spaces/search').set('Authorization', `Bearer ${driver}`)
      .query({ bbox: '-9.3,38.7,-9.1,38.9', date: todayLisbon(), start: '10:00', hours: 1 }).expect(200);
    expect(r.body[0].isFavorite).toBe(true);
  });
});
