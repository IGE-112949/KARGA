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

// Preço máximo em barra: 0,10–2,00 €/h, de 0,05 em 0,05; no fim da barra = qualquer preço.
export const PRICE_MIN = 0.1;
export const PRICE_MAX = 2;
export const PRICE_STEP = 0.05;
export const priceLabel = (v: number | null) =>
  v == null || v >= PRICE_MAX ? 'Qualquer preço' : `Até ${v.toFixed(2).replace('.', ',')} €/h`;
export const KW_OPTS = [{ label: 'Qualquer', value: null }, { label: '3,7 kW ou mais', value: 3.7 }, { label: '7,4 kW ou mais', value: 7.4 }, { label: '11 kW', value: 11 }];
export const PLUG_OPTS = [{ label: 'Qualquer', value: null }, { label: 'Tipo 2', value: 'type2' as const }, { label: 'Schuko', value: 'schuko' as const }];

const pad = (n: number) => String(n).padStart(2, '0');
const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WD_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Data e hora em Portugal continental (a API usa a mesma referência), independente do fuso do telemóvel.
function lisbon(now: Date) {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(now).map((x) => [x.type, x.value]));
    return { y: Number(p.year), m: Number(p.month) - 1, d: Number(p.day), minutes: Number(p.hour) * 60 + Number(p.minute) };
  } catch {
    return { y: now.getFullYear(), m: now.getMonth(), d: now.getDate(), minutes: now.getHours() * 60 + now.getMinutes() };
  }
}

export function defaultWhen(now = new Date()): When {
  let m = lisbon(now).minutes;
  m = Math.ceil(m / 30) * 30;
  const dayOffset = m >= 1440 ? 1 : 0;
  m %= 1440;
  return { dayOffset, start: `${pad(Math.floor(m / 60))}:${pad(m % 60)}`, hours: 2 };
}

// Dia de calendário (em Lisboa) + offset, como Date ao meio-dia UTC (só para ler ano/mês/dia/dia da semana).
const dayAt = (offset: number, now: Date) => {
  const l = lisbon(now);
  return new Date(Date.UTC(l.y, l.m, l.d + offset, 12));
};

export const dateFor = (offset: number, now = new Date()) => {
  const d = dayAt(offset, now);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

export function dayChips(now = new Date()) {
  return Array.from({ length: MAX_DAYS_AHEAD + 1 }, (_, i) => {
    const d = dayAt(i, now);
    return { offset: i, top: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : WD_LONG[d.getUTCDay()], bot: `${WD[d.getUTCDay()]} ${d.getUTCDate()}` };
  });
}

const addMin = (t: string, mins: number) => {
  const m = (Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) + mins) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

const minOf = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const hhmm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

// A hora de chegada já passou? (a meia hora em curso ainda conta: ex.: às 15:10, "15:00" serve)
export const isPastStart = (w: When, now = new Date()) => w.dayOffset === 0 && minOf(w.start) + 30 <= lisbon(now).minutes;

// Com a app aberta muito tempo, a hora escolhida para hoje pode ficar para trás: avança para a próxima meia hora.
export function freshWhen(w: When, now = new Date()): When {
  if (!isPastStart(w, now)) return w;
  const d = defaultWhen(now);
  return { ...w, dayOffset: d.dayOffset, start: d.start };
}

// "Esta noite": das 20:00 às 08:00; se já passou das 20:00 (ou é madrugada), começa já e vai até às 08:00.
export function tonightWhen(now = new Date()): When {
  const m = lisbon(now).minutes;
  if (m >= 480 && m < 1200) return TONIGHT;
  let s = Math.ceil(m / 30) * 30;
  const dayOffset = s >= 1440 ? 1 : 0;
  s %= 1440;
  const end = s < 480 ? 480 : 1920;
  return { dayOffset, start: hhmm(s), hours: Math.max(1, Math.min(12, Math.floor((end - s) / 60))) };
}

export const effectiveWhen = (when: When, f: Pick<Filters, 'tonight'>, now = new Date()) =>
  (f.tonight ? tonightWhen(now) : freshWhen(when, now));

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
  const w = effectiveWhen(when, f, now);
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
  const w = effectiveWhen(when, f, now);
  return { date: dateFor(w.dayOffset, now), start: w.start, hours: String(w.hours) };
};

export const toQueryString = (q: Record<string, string>) => new URLSearchParams(q).toString();
