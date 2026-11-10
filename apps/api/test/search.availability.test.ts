import { describe, it, expect } from 'vitest';
import { addDays, isAvailable, lisbonToUtc, requestInterval, todayLisbon } from '../src/modules/search/availability.js';

const w = (weekday: number, startTime: string, endTime: string) => ({ weekday, startTime, endTime });
const MON = '2026-11-16'; // segunda-feira
const req = (date: string, start: string, hours: number) => ({ date, start, hours });

describe('hora de Lisboa', () => {
  it('converte com horário de verão e de inverno', () => {
    expect(lisbonToUtc('2026-10-24', 12 * 60).toISOString()).toBe('2026-10-24T11:00:00.000Z');
    expect(lisbonToUtc('2026-10-26', 12 * 60).toISOString()).toBe('2026-10-26T12:00:00.000Z');
    expect(lisbonToUtc('2026-11-16', 25 * 60).toISOString()).toBe('2026-11-17T01:00:00.000Z');
  });
  it('hoje em Lisboa e somar dias', () => {
    expect(todayLisbon(new Date('2026-11-10T23:30:00Z'))).toBe('2026-11-10');
    expect(todayLisbon(new Date('2026-07-10T23:30:00Z'))).toBe('2026-07-11');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });
  it('intervalo pedido', () => {
    const r = requestInterval(req(MON, '20:00', 12));
    expect([r.from.toISOString(), r.to.toISOString()]).toEqual(['2026-11-16T20:00:00.000Z', '2026-11-17T08:00:00.000Z']);
  });
});

describe('disponibilidade', () => {
  it('janela dentro do horário do dia', () => {
    expect(isAvailable(req(MON, '09:00', 2), [w(0, '08:00', '12:00')], [], [])).toBe(true);
    expect(isAvailable(req(MON, '11:00', 2), [w(0, '08:00', '12:00')], [], [])).toBe(false);
  });
  it('horário que atravessa a meia-noite', () => {
    expect(isAvailable(req(MON, '20:00', 12), [w(0, '19:00', '08:00')], [], [])).toBe(true);
    expect(isAvailable(req(MON, '21:00', 12), [w(0, '19:00', '08:00')], [], [])).toBe(false);
    expect(isAvailable(req('2026-11-17', '06:00', 2), [w(0, '19:00', '08:00')], [], [])).toBe(true);
  });
  it('janelas contíguas de dois dias juntam-se', () => {
    expect(isAvailable(req(MON, '22:00', 4), [w(0, '19:00', '24:00'), w(1, '00:00', '08:00')], [], [])).toBe(true);
    expect(isAvailable(req('2026-11-21', '20:00', 12), [w(5, '00:00', '24:00'), w(6, '00:00', '24:00')], [], [])).toBe(true);
  });
  it('dia sem horário → indisponível', () => {
    expect(isAvailable(req(MON, '09:00', 1), [w(2, '00:00', '24:00')], [], [])).toBe(false);
  });
  it('bloqueio ou reserva sobreposta → indisponível; encostado → disponível', () => {
    const ws = [w(0, '00:00', '24:00')];
    const at = (h: number) => new Date(Date.UTC(2026, 10, 16, h));
    expect(isAvailable(req(MON, '10:00', 2), ws, [{ startsAt: at(11), endsAt: at(13) }], [])).toBe(false);
    expect(isAvailable(req(MON, '10:00', 2), ws, [], [{ startsAt: at(9), endsAt: at(11) }])).toBe(false);
    expect(isAvailable(req(MON, '10:00', 2), ws, [{ startsAt: at(12), endsAt: at(14) }], [{ startsAt: at(8), endsAt: at(10) }])).toBe(true);
  });
});
