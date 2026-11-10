import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { approximate, configureLocationSecret } from '../src/modules/search/service.js';
import { sanitizeArea } from '../src/modules/spaces/schemas.js';

const ID = '5b1d3c4e-1111-4111-8111-111111111111';

// O que um atacante faria com o código público (offset a partir de sha256(id) sem segredo).
function unkeyed(id: string, lat: number) {
  const h = createHash('sha256').update(id).digest();
  const angle = (h.readUInt16BE(0) / 65535) * 2 * Math.PI;
  const dist = 50 + (h[2] / 255) * 100;
  return { dLat: (dist * Math.cos(angle)) / 111320, dLng: (dist * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180)) };
}

describe('privacidade da localização', () => {
  it('o deslocamento depende de um segredo do servidor (não se reverte só com o id)', () => {
    configureLocationSecret('segredo-A');
    const a = approximate(ID, 38.79, -9.18);
    const guess = unkeyed(ID, 38.79);
    expect(Math.abs(a.latitude - guess.dLat - 38.79)).toBeGreaterThan(1e-5);
    configureLocationSecret('segredo-B');
    const b = approximate(ID, 38.79, -9.18);
    expect(b.latitude).not.toBe(a.latitude);
    configureLocationSecret('segredo-A');
    expect(approximate(ID, 38.79, -9.18)).toEqual(a);
  });

  it('espaços no mesmo prédio partilham o mesmo ponto aproximado', () => {
    configureLocationSecret('segredo-A');
    const p1 = approximate('aaaaaaaa-1111-4111-8111-111111111111', 38.79265, -9.18321);
    const p2 = approximate('bbbbbbbb-1111-4111-8111-111111111111', 38.79265, -9.18321);
    expect(p1).toEqual(p2);
  });

  it.each([
    ['Odivelas', 'Odivelas'],
    ['2675-300 Odivelas', 'Odivelas'],
    ['  Póvoa de Santo Adrião ', 'Póvoa de Santo Adrião'],
    ['Rua Guilherme Gomes Fernandes 12 Odivelas', null],
    ['2675-300', null],
    ['', null],
  ])('zona "%s" → %s', (input, expected) => expect(sanitizeArea(input)).toBe(expected));
});
