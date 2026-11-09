import { describe, it, expect } from 'vitest';
import { normalizePlate } from '../src/modules/vehicles/plate.js';

describe('normalizePlate', () => {
  it.each([
    ['aa 12 bb', 'AA-12-BB'],
    ['12AB34', '12-AB-34'],
    ['12-34-ab', '12-34-AB'],
    ['AB-12-34', 'AB-12-34'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePlate(input)).toBe(expected);
  });

  it.each(['ABC123', '', 'AB-CD-EF', '12-34-56', 'AB12C3'])('rejeita "%s"', (input) => {
    expect(normalizePlate(input)).toBeNull();
  });
});
