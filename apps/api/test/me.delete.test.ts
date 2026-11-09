import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './helpers/testApp.js';

const U = '88888888-8888-4888-8888-888888888888';

describe('DELETE /me', () => {
  it('apaga a conta, o perfil e os veículos', async () => {
    const t = await createTestApp();
    const h = { Authorization: `Bearer ${await t.tokenFor(U)}` };
    await request(t.app).post('/me').set(h).send({ fullName: 'Apagar', isDriver: true, isHost: false, acceptTerms: true });
    await request(t.app).post('/me/vehicles').set(h).send({ makeModel: 'Renault Zoe', plate: 'AA-11-BB', plugType: 'type2' });
    await request(t.app).post('/me/vehicles').set(h).send({ makeModel: 'Nissan Leaf', plate: 'AA-22-BB', plugType: 'type2' });

    const res = await request(t.app).delete('/me').set(h);
    expect(res.status).toBe(204);
    expect(t.authAdmin.deleted).toEqual([U]);
    const p = await t.pg.query('select 1 from profiles where id = $1', [U]);
    const v = await t.pg.query('select 1 from vehicles where user_id = $1', [U]);
    expect(p.rows).toHaveLength(0);
    expect(v.rows).toHaveLength(0);
  });

  it('sem perfil devolve 404 e não apaga nada na Auth', async () => {
    const t = await createTestApp();
    const h = { Authorization: `Bearer ${await t.tokenFor(U)}` };
    const res = await request(t.app).delete('/me').set(h);
    expect(res.status).toBe(404);
    expect(t.authAdmin.deleted).toEqual([]);
  });
});
