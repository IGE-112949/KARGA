import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createTestApp } from './helpers/testApp.js';

const U1 = '44444444-4444-4444-8444-444444444444';
const valid = { fullName: 'Tiago Ferreira', phone: '+351 912 345 678', isDriver: true, isHost: false, acceptTerms: true };

let app: Express;
let token: string;

beforeEach(async () => {
  const t = await createTestApp();
  app = t.app;
  token = await t.tokenFor(U1);
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('GET /me', () => {
  it('sem perfil devolve 404 PROFILE_NOT_FOUND', async () => {
    const res = await request(app).get('/me').set(auth());
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
  });
});

describe('POST /me', () => {
  it('cria o perfil e devolve-o; GET /me devolve o mesmo', async () => {
    const res = await request(app).post('/me').set(auth()).send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: U1, fullName: 'Tiago Ferreira', phone: '+351912345678', isDriver: true, isHost: false, vehicles: [],
    });
    expect(typeof res.body.termsAcceptedAt).toBe('string');
    const get = await request(app).get('/me').set(auth());
    expect(get.status).toBe(200);
    expect(get.body).toEqual(res.body);
  });

  it('segunda vez devolve 409 PROFILE_EXISTS', async () => {
    await request(app).post('/me').set(auth()).send(valid);
    const res = await request(app).post('/me').set(auth()).send(valid);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PROFILE_EXISTS');
  });

  it('sem aceitar os termos devolve 400 com detalhe em acceptTerms', async () => {
    const res = await request(app).post('/me').set(auth()).send({ ...valid, acceptTerms: false });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { field: string }) => d.field)).toContain('acceptTerms');
  });

  it('sem nenhum modo ativo devolve 400', async () => {
    const res = await request(app).post('/me').set(auth()).send({ ...valid, isDriver: false, isHost: false });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('telemóvel inválido devolve 400', async () => {
    const res = await request(app).post('/me').set(auth()).send({ ...valid, phone: '912' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('phone');
  });

  it('nome com espaços a mais é guardado limpo; nome curto é rejeitado', async () => {
    const ok = await request(app).post('/me').set(auth()).send({ ...valid, fullName: '  Ana  ' });
    expect(ok.body.fullName).toBe('Ana');
    const t2 = await createTestApp();
    const tk = await t2.tokenFor(U1);
    const bad = await request(t2.app).post('/me').set({ Authorization: `Bearer ${tk}` }).send({ ...valid, fullName: 'A' });
    expect(bad.status).toBe(400);
  });
});

describe('PATCH /me', () => {
  it('atualiza o nome', async () => {
    await request(app).post('/me').set(auth()).send(valid);
    const res = await request(app).patch('/me').set(auth()).send({ fullName: 'Tiago F.' });
    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Tiago F.');
  });

  it('não permite desligar o único modo ativo', async () => {
    await request(app).post('/me').set(auth()).send(valid);
    const res = await request(app).patch('/me').set(auth()).send({ isDriver: false });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('permite trocar de condutor para proprietário num só pedido', async () => {
    await request(app).post('/me').set(auth()).send(valid);
    const res = await request(app).patch('/me').set(auth()).send({ isDriver: false, isHost: true });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ isDriver: false, isHost: true });
  });

  it('sem perfil devolve 404', async () => {
    const res = await request(app).patch('/me').set(auth()).send({ fullName: 'Xx' });
    expect(res.status).toBe(404);
  });

  it('phone: null remove o telemóvel', async () => {
    await request(app).post('/me').set(auth()).send(valid);
    const res = await request(app).patch('/me').set(auth()).send({ phone: null });
    expect(res.status).toBe(200);
    expect(res.body.phone).toBeNull();
  });
});
