import { describe, it, expect, beforeEach } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { getCleanTestDb } from './helpers/testDb.js';

const U1 = '11111111-1111-4111-8111-111111111111';
const U2 = '22222222-2222-4222-8222-222222222222';

let pg: PGlite;

async function addUser(id: string, driver = true, host = false) {
  await pg.query('insert into auth.users (id) values ($1)', [id]);
  await pg.query(
    'insert into profiles (id, full_name, is_driver, is_host, terms_accepted_at) values ($1, $2, $3, $4, now())',
    [id, 'Teste', driver, host],
  );
}

async function addSpace(ownerId: string): Promise<string> {
  const r = await pg.query<{ id: string }>(
    `insert into spaces (owner_id, title, address, location, space_type, power_kw, plug_type, price_per_hour)
     values ($1, 'Garagem', 'Rua X', ST_SetSRID(ST_MakePoint(-9.16, 38.72), 4326), 'closed_garage', 7.4, 'type2', 0.30)
     returning id`,
    [ownerId],
  );
  return r.rows[0].id;
}

async function addBooking(spaceId: string, driverId: string, start: string, end: string, status = 'confirmed') {
  await pg.query(
    `insert into bookings (space_id, driver_id, starts_at, ends_at, status, price_per_hour, service_fee_percent, service_fee, estimated_total)
     values ($1, $2, $3, $4, $5, 0.30, 10, 0.84, 9.24)`,
    [spaceId, driverId, start, end, status],
  );
}

beforeEach(async () => {
  ({ pg } = await getCleanTestDb());
});

describe('schema da base de dados', () => {
  it('platform_settings tem service_fee_percent = 10', async () => {
    const r = await pg.query<{ value: string }>("select value from platform_settings where key = 'service_fee_percent'");
    expect(Number(r.rows[0].value)).toBe(10);
  });

  it('rejeita perfil sem nenhum modo ativo', async () => {
    await pg.query('insert into auth.users (id) values ($1)', [U1]);
    await expect(
      pg.query('insert into profiles (id, full_name, is_driver, is_host, terms_accepted_at) values ($1, $2, false, false, now())', [U1, 'X']),
    ).rejects.toThrow();
  });

  it('rejeita reservas confirmadas sobrepostas no mesmo espaço', async () => {
    await addUser(U1, false, true);
    await addUser(U2);
    const space = await addSpace(U1);
    await addBooking(space, U2, '2026-11-10T21:00:00Z', '2026-11-11T05:00:00Z');
    await expect(addBooking(space, U2, '2026-11-10T23:00:00Z', '2026-11-11T01:00:00Z')).rejects.toThrow();
  });

  it('aceita reserva sobreposta se estiver cancelada', async () => {
    await addUser(U1, false, true);
    await addUser(U2);
    const space = await addSpace(U1);
    await addBooking(space, U2, '2026-11-10T21:00:00Z', '2026-11-11T05:00:00Z');
    await expect(
      addBooking(space, U2, '2026-11-10T23:00:00Z', '2026-11-11T01:00:00Z', 'cancelled_by_driver'),
    ).resolves.not.toThrow();
  });

  it('rejeita dois veículos predefinidos do mesmo utilizador', async () => {
    await addUser(U1);
    await pg.query("insert into vehicles (user_id, make_model, plate, plug_type, is_default) values ($1, 'Zoe', 'AA-11-BB', 'type2', true)", [U1]);
    await expect(
      pg.query("insert into vehicles (user_id, make_model, plate, plug_type, is_default) values ($1, 'Leaf', 'AA-22-BB', 'type2', true)", [U1]),
    ).rejects.toThrow();
  });

  it('rejeita matrícula duplicada', async () => {
    await addUser(U1);
    await addUser(U2);
    await pg.query("insert into vehicles (user_id, make_model, plate, plug_type) values ($1, 'Zoe', 'AA-11-BB', 'type2')", [U1]);
    await expect(
      pg.query("insert into vehicles (user_id, make_model, plate, plug_type) values ($1, 'Leaf', 'AA-11-BB', 'type2')", [U2]),
    ).rejects.toThrow();
  });

  it('todas as tabelas de public têm RLS ativo', async () => {
    const r = await pg.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'spatial_ref_sys'`,
    );
    expect(r.rows.map((x) => x.relname).sort()).toEqual(
      ['bookings', 'platform_settings', 'profiles', 'space_availability', 'space_blocks', 'space_photos', 'spaces', 'vehicles'],
    );
    expect(r.rows.every((x) => x.relrowsecurity)).toBe(true);
  });
});
