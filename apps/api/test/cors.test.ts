import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './helpers/testApp.js';

describe('CORS', () => {
  it('responde ao preflight com os headers necessários para a app web', async () => {
    const { app } = await createTestApp();
    const res = await request(app)
      .options('/me')
      .set('Origin', 'http://localhost:8081')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization,content-type');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:8081');
    expect(res.headers['access-control-allow-headers']?.toLowerCase()).toContain('authorization');
  });
});
