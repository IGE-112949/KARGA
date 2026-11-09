import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createTestApp } from './helpers/testApp.js';

const A = '55555555-5555-4555-8555-555555555555';
const B = '66666666-6666-4666-8666-666666666666';
const profile = { fullName: 'Condutor', isDriver: true, isHost: false, acceptTerms: true };
const zoe = { makeModel: 'Renault Zoe', plate: '12ab34', plugType: 'type2' };
const leaf = { makeModel: 'Nissan Leaf', plate: 'AA-11-BB', plugType: 'type2' };

let app: Express;
let hA: Record<string, string>;
let hB: Record<string, string>;

beforeEach(async () => {
  const t = await createTestApp();
  app = t.app;
  hA = { Authorization: `Bearer ${await t.tokenFor(A)}` };
  hB = { Authorization: `Bearer ${await t.tokenFor(B)}` };
  await request(app).post('/me').set(hA).send(profile);
  await request(app).post('/me').set(hB).send(profile);
});

describe('/me/vehicles', () => {
  it('o primeiro veículo fica predefinido, o segundo não', async () => {
    const r1 = await request(app).post('/me/vehicles').set(hA).send(zoe);
    expect(r1.status).toBe(201);
    expect(r1.body).toMatchObject({ makeModel: 'Renault Zoe', plate: '12-AB-34', plugType: 'type2', isDefault: true });
    const r2 = await request(app).post('/me/vehicles').set(hA).send(leaf);
    expect(r2.body.isDefault).toBe(false);
  });

  it('matrícula repetida noutro utilizador devolve 409 PLATE_TAKEN', async () => {
    await request(app).post('/me/vehicles').set(hA).send(zoe);
    const res = await request(app).post('/me/vehicles').set(hB).send({ ...zoe, plate: '12-AB-34' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PLATE_TAKEN');
  });

  it('matrícula inválida devolve 400', async () => {
    const res = await request(app).post('/me/vehicles').set(hA).send({ ...zoe, plate: 'ABC123' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('plate');
  });

  it('plugType desconhecido devolve 400', async () => {
    const res = await request(app).post('/me/vehicles').set(hA).send({ ...zoe, plugType: 'tesla' });
    expect(res.status).toBe(400);
  });

  it('definir outro como predefinido desmarca o anterior', async () => {
    await request(app).post('/me/vehicles').set(hA).send(zoe);
    const second = await request(app).post('/me/vehicles').set(hA).send(leaf);
    const patch = await request(app).patch(`/me/vehicles/${second.body.id}`).set(hA).send({ isDefault: true });
    expect(patch.status).toBe(200);
    const list = await request(app).get('/me/vehicles').set(hA);
    expect(list.body.filter((v: { isDefault: boolean }) => v.isDefault).map((v: { id: string }) => v.id)).toEqual([second.body.id]);
    expect(list.body[0].id).toBe(second.body.id);
  });

  it('apagar o predefinido passa o restante a predefinido', async () => {
    const first = await request(app).post('/me/vehicles').set(hA).send(zoe);
    const second = await request(app).post('/me/vehicles').set(hA).send(leaf);
    const del = await request(app).delete(`/me/vehicles/${first.body.id}`).set(hA);
    expect(del.status).toBe(204);
    const list = await request(app).get('/me/vehicles').set(hA);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ id: second.body.id, isDefault: true });
  });

  it('editar a matrícula normaliza e valida', async () => {
    const v = await request(app).post('/me/vehicles').set(hA).send(zoe);
    const res = await request(app).patch(`/me/vehicles/${v.body.id}`).set(hA).send({ plate: 'zz 99 zz' });
    expect(res.status).toBe(200);
    expect(res.body.plate).toBe('ZZ-99-ZZ');
  });

  it('o veículo de outro utilizador é invisível (404 em GET/PATCH/DELETE)', async () => {
    const v = await request(app).post('/me/vehicles').set(hA).send(zoe);
    const list = await request(app).get('/me/vehicles').set(hB);
    expect(list.body).toEqual([]);
    const p = await request(app).patch(`/me/vehicles/${v.body.id}`).set(hB).send({ makeModel: 'Hack' });
    expect(p.status).toBe(404);
    expect(p.body.error.code).toBe('VEHICLE_NOT_FOUND');
    const d = await request(app).delete(`/me/vehicles/${v.body.id}`).set(hB);
    expect(d.status).toBe(404);
  });

  it('id que não é uuid devolve 404 VEHICLE_NOT_FOUND', async () => {
    const res = await request(app).patch('/me/vehicles/abc').set(hA).send({ makeModel: 'X x' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('VEHICLE_NOT_FOUND');
  });

  it('sem perfil devolve 404 PROFILE_NOT_FOUND', async () => {
    const t = await createTestApp();
    const h = { Authorization: `Bearer ${await t.tokenFor('77777777-7777-4777-8777-777777777777')}` };
    const res = await request(t.app).post('/me/vehicles').set(h).send(zoe);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
  });

  it('GET /me inclui os veículos', async () => {
    await request(app).post('/me/vehicles').set(hA).send(zoe);
    const me = await request(app).get('/me').set(hA);
    expect(me.body.vehicles).toHaveLength(1);
    expect(me.body.vehicles[0].plate).toBe('12-AB-34');
  });
});
