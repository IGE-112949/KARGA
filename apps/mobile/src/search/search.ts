// Estado e regras da pesquisa do condutor (iguais às da API: apps/api/src/modules/search).
export type When = { dayOffset: number; start: string; hours: number };
export type Filters = {
  maxPrice: number | null; minKw: number | null; plug: 'schuko' | 'type2' | null;
  covered: boolean; fast: boolean; tonight: boolean;
};
export type Bbox = { minLng: number; minLat: number; maxLng: number; maxLat: number };

export const MAX_DAYS_AHEAD = 3;
export const TONIGHT: When = { dayOffset: 0, start: '20:00', hours: 12 };
export const FAST_KW = 7.4;
export const NO_FILTERS: Filters = { maxPrice: null, minKw: null, plug: null, covered: false, fast: false, tonight: false };

export const PRICE_OPTS = [{ label: 'Até 0,25 €/h', value: 0.25 }, { label: 'Até 0,30 €/h', value: 0.3 }, { label: 'Até 0,35 €/h', value: 0.35 }, { label: 'Qualquer', value: null }];
export const KW_OPTS = [{ label: 'Qualquer', value: null }, { label: '3,7 kW ou mais', value: 3.7 }, { label: '7,4 kW ou mais', value: 7.4 }, { label: '11 kW', value: 11 }];
export const PLUG_OPTS = [{ label: 'Qualquer', value: null }, { label: 'Tipo 2', value: 'type2' as const }, { label: 'Schuko', value: 'schuko' as const }];

const pad = (n: number) => String(n).padStart(2, '0');
const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WD_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function defaultWhen(now = new Date()): When {
  let m = now.getHours() * 60 + now.getMinutes();
  m = Math.ceil(m / 30) * 30;
  const dayOffset = m >= 1440 ? 1 : 0;
  m %= 1440;
  return { dayOffset, start: `${pad(Math.floor(m / 60))}:${pad(m % 60)}`, hours: 2 };
}

const dayAt = (offset: number, now: Date) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);

export const dateFor = (offset: number, now = new Date()) => {
  const d = dayAt(offset, now);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function dayChips(now = new Date()) {
  return Array.from({ length: MAX_DAYS_AHEAD + 1 }, (_, i) => {
    const d = dayAt(i, now);
    return { offset: i, top: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : WD_LONG[d.getDay()], bot: `${WD[d.getDay()]} ${d.getDate()}` };
  });
}

const addMin = (t: string, mins: number) => {
  const m = (Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) + mins) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

export const effectiveWhen = (when: When, f: Pick<Filters, 'tonight'>) => (f.tonight ? TONIGHT : when);

export function whenLabel(w: When, now = new Date()): string {
  const day = dayChips(now)[w.dayOffset]?.top ?? '';
  return `${day} · ${w.start} – ${addMin(w.start, w.hours * 60)} (${w.hours} h)`;
}

const clampBbox = (b: Bbox): Bbox => {
  const cx = (b.minLng + b.maxLng) / 2;
  const cy = (b.minLat + b.maxLat) / 2;
  const hw = Math.min((b.maxLng - b.minLng) / 2, 0.249);
  const hh = Math.min((b.maxLat - b.minLat) / 2, 0.249);
  const r = (v: number) => Number(v.toFixed(5));
  return { minLng: r(cx - hw), minLat: r(cy - hh), maxLng: r(cx + hw), maxLat: r(cy + hh) };
};

export function searchQuery(bbox: Bbox, when: When, f: Filters, now = new Date()): Record<string, string> {
  const w = effectiveWhen(when, f);
  const b = clampBbox(bbox);
  const q: Record<string, string> = {
    bbox: [b.minLng, b.minLat, b.maxLng, b.maxLat].join(','), date: dateFor(w.dayOffset, now), start: w.start, hours: String(w.hours),
  };
  if (f.maxPrice != null) q.maxPrice = String(f.maxPrice);
  const kw = f.fast ? Math.max(FAST_KW, f.minKw ?? 0) : f.minKw;
  if (kw != null) q.minKw = String(kw);
  if (f.plug) q.plug = f.plug;
  if (f.covered) q.covered = 'true';
  return q;
}

export const windowQuery = (when: When, f: Filters, now = new Date()) => {
  const w = effectiveWhen(when, f);
  return { date: dateFor(w.dayOffset, now), start: w.start, hours: String(w.hours) };
};

export const toQueryString = (q: Record<string, string>) => new URLSearchParams(q).toString();
