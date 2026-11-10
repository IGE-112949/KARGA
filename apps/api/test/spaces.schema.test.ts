import { describe, it, expect, beforeEach } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { getCleanTestDb } from './helpers/testDb.js';

const U1 = '11111111-1111-4111-8111-111111111111';
let pg: PGlite;
let spaceId: string;

beforeEach(async () => {
  ({ pg } = await getCleanTestDb());
  await pg.query('insert into auth.users (id) values ($1)', [U1]);
  await pg.query(`insert into profiles (id, full_name, is_driver, is_host, terms_accepted_at) values ($1, 'T', true, true, now())`, [U1]);
  const r = await pg.query<{ id: string }>(
    `insert into spaces (owner_id, title, address, location, space_type, power_kw, plug_type, price_per_hour)
     values ($1, 'Garagem', 'Rua X', ST_SetSRID(ST_MakePoint(-9.16, 38.72), 4326), 'closed_garage', 7.4, 'type2', 0.30) returning id`, [U1]);
  spaceId = r.rows[0].id;
});

describe('schema · espaços (fase anfitrião)', () => {
  it('aceita o estado deleted com deleted_at', async () => {
    await pg.query(`update spaces set status = 'deleted', deleted_at = now() where id = $1`, [spaceId]);
    const r = await pg.query<{ status: string }>('select status from spaces where id = $1', [spaceId]);
    expect(r.rows[0].status).toBe('deleted');
  });

  it('só um horário por dia da semana', async () => {
    await pg.query(`insert into space_availability (space_id, weekday, start_time, end_time) values ($1, 0, '19:00', '08:00')`, [spaceId]);
    await expect(pg.query(`insert into space_availability (space_id, weekday, start_time, end_time) values ($1, 0, '09:00', '12:00')`, [spaceId]))
      .rejects.toThrow();
  });

  it('aceita 24:00 como fim (dia todo)', async () => {
    await pg.query(`insert into space_availability (space_id, weekday, start_time, end_time) values ($1, 1, '00:00', '24:00')`, [spaceId]);
  });

  it('apagar um espaço com reservas é recusado (histórico protegido)', async () => {
    await pg.query(
      `insert into bookings (space_id, driver_id, starts_at, ends_at, price_per_hour, service_fee_percent, service_fee, estimated_total)
       values ($1, $2, now() - interval '3 days', now() - interval '3 days' + interval '2 hours', 0.30, 10, 0.06, 0.66)`, [spaceId, U1]);
    await expect(pg.query('delete from spaces where id = $1', [spaceId])).rejects.toThrow();
  });
});

describe('schema · favoritos e zona', () => {
  it('favorito único por utilizador e espaço; apagar o espaço apaga o favorito', async () => {
    await pg.query('insert into favorites (user_id, space_id) values ($1, $2)', [U1, spaceId]);
    await expect(pg.query('insert into favorites (user_id, space_id) values ($1, $2)', [U1, spaceId])).rejects.toThrow();
    await pg.query('delete from spaces where id = $1', [spaceId]);
    expect((await pg.query('select * from favorites')).rows).toHaveLength(0);
  });
  it('spaces.area existe', async () => {
    await pg.query(`update spaces set area = 'Odivelas' where id = $1`, [spaceId]);
    expect((await pg.query<{ area: string }>('select area from spaces where id = $1', [spaceId])).rows[0].area).toBe('Odivelas');
  });
});
