// Tipos e regras dos espaços do proprietário (iguais às da API: apps/api/src/modules/spaces).
export type SpaceType = 'closed_garage' | 'covered' | 'outdoor';
export type SpacePlug = 'schuko' | 'type2';
export type Window = { weekday: number; startTime: string; endTime: string };
export type SpacePhoto = { id: string; url: string; isCover: boolean };
export type SpaceBlock = { id: string; startsAt: string; endsAt: string; reason: string | null };

type SpaceBase = {
  id: string;
  title: string;
  address: string;
  spotDetails: string | null;
  latitude: number;
  longitude: number;
  spaceType: SpaceType;
  plugType: SpacePlug;
  powerKw: number;
  pricePerHour: number;
  energyPriceKwh: number | null;
  status: 'active' | 'inactive';
  availability: Window[];
  createdAt: string;
};
export type SpaceSummary = SpaceBase & { coverUrl: string | null };
export type Space = SpaceBase & {
  accessInstructions: string | null;
  accessCode: string | null;
  photos: SpacePhoto[];
  blocks: SpaceBlock[];
};

export const SPACE_TYPES: { value: SpaceType; label: string }[] = [
  { value: 'closed_garage', label: 'Garagem fechada' },
  { value: 'covered', label: 'Coberto' },
  { value: 'outdoor', label: 'Exterior' },
];
export const spaceTypeLabel = (t: SpaceType) => SPACE_TYPES.find((x) => x.value === t)?.label ?? t;
export const plugLabelOf = (p: SpacePlug) => (p === 'schuko' ? 'Schuko' : 'Tipo 2');

export const AMPS = [8, 10, 13, 16];
export const WALLBOX_KW = [3.7, 7.4, 11, 22];
export const ampsToKw = (a: number) => Math.round((a * 230) / 100) / 10;
export const kwToAmps = (kw: number) => AMPS.find((a) => ampsToKw(a) === kw) ?? 10;

export const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const WEEKDAY_LETTERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
export const WEEKDAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
export const isAllDay = (w: Pick<Window, 'startTime' | 'endTime'>) => w.startTime === '00:00' && w.endTime === '24:00';

export function windowHours(w: Window): number {
  let d = minutes(w.endTime) - minutes(w.startTime);
  if (d <= 0) d += 24 * 60;
  return d / 60;
}

export const weeklyHours = (ws: Window[]) => ws.reduce((s, w) => s + windowHours(w), 0);

// Estimativa de ganhos: 50% de ocupação, 52 semanas / 12 meses; antes da taxa de serviço, sem energia.
export const monthlyEstimate = (ws: Window[], pricePerHour: number) =>
  Math.round(weeklyHours(ws) * 0.5 * pricePerHour * (52 / 12) * 100) / 100;

const windowText = (w: Window) => (isAllDay(w) ? 'dia todo' : `${w.startTime}–${w.endTime}`);

export function scheduleSummary(ws: Window[]): string {
  if (!ws.length) return 'Sem horário definido';
  const sorted = [...ws].sort((a, b) => a.weekday - b.weekday);
  const groups: { from: number; to: number; text: string }[] = [];
  for (const w of sorted) {
    const text = windowText(w);
    const last = groups[groups.length - 1];
    if (last && last.text === text && last.to === w.weekday - 1) last.to = w.weekday;
    else groups.push({ from: w.weekday, to: w.weekday, text });
  }
  return groups
    .map((g) => `${g.from === g.to ? WEEKDAYS[g.from] : `${WEEKDAYS[g.from]}–${WEEKDAYS[g.to]}`} ${g.text}`)
    .join(' · ');
}

export function parseEuro(s: string): number {
  const t = s.trim().replace(',', '.');
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}

export const formatEuro = (v: number, decimals = 2) => `${v.toFixed(decimals).replace('.', ',')} €`;
export const formatKw = (kw: number) => `${String(kw).replace('.', ',')} kW`;

// Horas de 30 em 30 minutos; "24:00" só como fim.
export const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
export const END_TIMES = [...TIMES.slice(1), '24:00'];
