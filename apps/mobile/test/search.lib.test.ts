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
