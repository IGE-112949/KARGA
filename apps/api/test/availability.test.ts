import { describe, it, expect } from 'vitest';
import { availabilitySchema } from '../src/modules/spaces/availability.js';

const ok = (v: unknown) => availabilitySchema.safeParse(v).success;

describe('horário semanal', () => {
  it('aceita janela que atravessa a meia-noite', () => expect(ok([{ weekday: 0, startTime: '19:00', endTime: '08:00' }])).toBe(true));
  it('aceita dia todo 00:00–24:00', () => expect(ok([{ weekday: 5, startTime: '00:00', endTime: '24:00' }])).toBe(true));
  it('recusa início 24:00', () => expect(ok([{ weekday: 1, startTime: '24:00', endTime: '08:00' }])).toBe(false));
  it('recusa início igual ao fim', () => expect(ok([{ weekday: 1, startTime: '00:00', endTime: '00:00' }])).toBe(false));
  it('recusa dias repetidos', () => expect(ok([
    { weekday: 2, startTime: '09:00', endTime: '12:00' },
    { weekday: 2, startTime: '14:00', endTime: '18:00' },
  ])).toBe(false));
  it('recusa lista vazia', () => expect(ok([])).toBe(false));
  it('recusa dia 7 e hora 25:00', () => {
    expect(ok([{ weekday: 7, startTime: '09:00', endTime: '12:00' }])).toBe(false);
    expect(ok([{ weekday: 1, startTime: '09:00', endTime: '25:00' }])).toBe(false);
  });
  it('recusa minutos que não sejam :00 ou :30', () => expect(ok([{ weekday: 1, startTime: '09:15', endTime: '12:00' }])).toBe(false));
});
