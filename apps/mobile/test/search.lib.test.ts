import { dateFor, dayChips, defaultWhen, searchQuery, TONIGHT, whenLabel, type Filters } from '@/search/search';

const at = (iso: string) => new Date(iso);
const none: Filters = { maxPrice: null, minKw: null, plug: null, covered: false, fast: false, tonight: false };

describe('pesquisa (app)', () => {
  it('por omissão: hoje, próxima meia hora, 2 h', () => {
    expect(defaultWhen(at('2026-11-10T11:12:00'))).toEqual({ dayOffset: 0, start: '11:30', hours: 2 });
    expect(defaultWhen(at('2026-11-10T11:30:00'))).toEqual({ dayOffset: 0, start: '11:30', hours: 2 });
    expect(defaultWhen(at('2026-11-10T23:45:00'))).toEqual({ dayOffset: 1, start: '00:00', hours: 2 });
  });

  it('dias: hoje e os 3 seguintes', () => {
    const chips = dayChips(at('2026-11-10T09:00:00'));
    expect(chips.map((c) => c.top)).toEqual(['Hoje', 'Amanhã', 'Quinta', 'Sexta']);
    expect(chips[0].bot).toBe('Ter 10');
    expect(dateFor(3, at('2026-11-30T09:00:00'))).toBe('2026-12-03');
  });

  it('parâmetros: filtros, "Rápido" e "Esta noite"', () => {
    const bbox = { minLng: -9.3, minLat: 38.7, maxLng: -9.1, maxLat: 38.9 };
    const now = at('2026-11-10T09:00:00');
    expect(searchQuery(bbox, defaultWhen(now), { ...none, maxPrice: 0.3, plug: 'schuko', covered: true }, now)).toEqual({
      bbox: '-9.3,38.7,-9.1,38.9', date: '2026-11-10', start: '09:00', hours: '2', maxPrice: '0.3', plug: 'schuko', covered: 'true',
    });
    const q = searchQuery(bbox, defaultWhen(now), { ...none, fast: true, minKw: 3.7, tonight: true }, now);
    expect(q).toMatchObject({ minKw: '7.4', start: TONIGHT.start, hours: '12', date: '2026-11-10' });
  });

  it('a zona do mapa nunca passa de 0,5° de lado', () => {
    const q = searchQuery({ minLng: -10, minLat: 37, maxLng: -8, maxLat: 40 }, defaultWhen(at('2026-11-10T09:00:00')), none, at('2026-11-10T09:00:00'));
    const [a, b, c, d] = q.bbox.split(',').map(Number);
    expect(c - a).toBeLessThanOrEqual(0.5);
    expect(d - b).toBeLessThanOrEqual(0.5);
  });

  it('etiqueta da janela', () => {
    expect(whenLabel({ dayOffset: 0, start: '20:00', hours: 12 }, at('2026-11-10T09:00:00'))).toBe('Hoje · 20:00 – 08:00 (12 h)');
  });
});

describe('hora de Portugal (igual à API), não a do telemóvel', () => {
  it('23:12 UTC em julho já é dia seguinte em Lisboa', () => {
    const now = new Date('2026-07-10T23:12:00Z');
    expect(defaultWhen(now)).toEqual({ dayOffset: 0, start: '00:30', hours: 2 });
    expect(dateFor(0, now)).toBe('2026-07-11');
    expect(dayChips(now)[0].bot).toBe('Sáb 11');
  });
});

import { freshWhen, isPastStart, tonightWhen } from '@/search/search';

describe('horas que já passaram', () => {
  const at2 = (iso: string) => new Date(`${iso}Z`); // novembro: Lisboa = UTC

  it('a hora escolhida hoje que entretanto passou avança para a próxima meia hora', () => {
    const now = at2('2026-11-10T15:10:00');
    expect(freshWhen({ dayOffset: 0, start: '11:30', hours: 3 }, now)).toEqual({ dayOffset: 0, start: '15:30', hours: 3 });
  });

  it('hora futura ou de outro dia fica como está', () => {
    const now = at2('2026-11-10T15:10:00');
    const w = { dayOffset: 0, start: '18:00', hours: 2 };
    expect(freshWhen(w, now)).toBe(w);
    const t = { dayOffset: 1, start: '08:00', hours: 2 };
    expect(freshWhen(t, now)).toBe(t);
  });

  it('a meia hora em curso ainda conta como válida (até 25 min, antes do limite da API)', () => {
    expect(isPastStart({ dayOffset: 0, start: '15:00', hours: 1 }, at2('2026-11-10T15:10:00'))).toBe(false);
    expect(isPastStart({ dayOffset: 0, start: '15:00', hours: 1 }, at2('2026-11-10T15:25:00'))).toBe(true);
    expect(isPastStart({ dayOffset: 0, start: '14:30', hours: 1 }, at2('2026-11-10T15:10:00'))).toBe(true);
  });

  it('"Esta noite" depois das 20:00 começa já e vai até às 08:00', () => {
    expect(tonightWhen(at2('2026-11-10T18:00:00'))).toEqual({ dayOffset: 0, start: '20:00', hours: 12 });
    expect(tonightWhen(at2('2026-11-10T22:10:00'))).toEqual({ dayOffset: 0, start: '22:30', hours: 9 });
    expect(tonightWhen(at2('2026-11-10T02:10:00'))).toEqual({ dayOffset: 0, start: '02:30', hours: 5 });
    expect(tonightWhen(at2('2026-11-10T07:40:00'))).toEqual({ dayOffset: 0, start: '20:00', hours: 12 });
  });

  it('a pesquisa "Esta noite" usa a janela ajustada', () => {
    const now = at2('2026-11-10T22:10:00');
    const q = searchQuery({ minLng: -9.2, minLat: 38.7, maxLng: -9.1, maxLat: 38.8 }, defaultWhen(now),
      { maxPrice: null, minKw: null, plug: null, covered: false, fast: false, tonight: true }, now);
    expect(q).toMatchObject({ start: '22:30', hours: '9' });
  });
});
