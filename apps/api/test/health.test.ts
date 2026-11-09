import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './helpers/testApp.js';

describe('GET /health', () => {
  it('responde 200 com status ok, sem autenticação', async () => {
    const { app } = await createTestApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('rotas desconhecidas exigem autenticação', async () => {
    const { app } = await createTestApp();
    const res = await request(app).get('/me');
    expect(res.status).toBe(401);
  });
});
