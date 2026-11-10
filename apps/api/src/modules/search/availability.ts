// Disponibilidade de um espaço numa janela pedida (hora de Portugal continental).
const TZ = 'Europe/Lisbon';
const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function parts(d: Date) {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

export const todayLisbon = (now = new Date()) => parts(now).date;

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Segunda = 0 … domingo = 6.
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

// Diferença (ms) entre a hora de Lisboa e UTC num instante.
function offsetAt(t: number): number {
  const p = parts(new Date(t));
  const [y, m, d] = p.date.split('-').map(Number);
  return Date.UTC(y, m - 1, d) + p.minutes * 60_000 - Math.floor(t / 60_000) * 60_000;
}

// Data local de Lisboa + minutos desde a meia-noite (podem passar de 1440) → instante UTC.
// Na mudança de hora: uma hora que não existe (primavera, 01:00–01:59) passa para a hora de verão equivalente;
// uma hora repetida (outono) usa a segunda ocorrência.
export function lisbonToUtc(date: string, minutes: number): Date {
  const [y, m, d] = date.split('-').map(Number);
  const wanted = Date.UTC(y, m - 1, d) + minutes * 60_000;
  const o1 = offsetAt(wanted);
  const c1 = wanted - o1;
  const o2 = offsetAt(c1);
  if (o1 === o2) return new Date(c1);
  const c2 = wanted - o2;
  if (offsetAt(c2) === o2) return new Date(c2);
  return new Date(wanted - Math.min(o1, o2));
}

export type SearchWindow = { date: string; start: string; hours: number };
export type WeeklyWindow = { weekday: number; startTime: string; endTime: string };
export type Interval = { startsAt: Date; endsAt: Date };

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export function requestInterval(q: SearchWindow) {
  // A duração é em horas reais (numa noite de mudança de hora, 2 h continuam a ser 2 h).
  const from = lisbonToUtc(q.date, toMin(q.start));
  return { from, to: new Date(from.getTime() + q.hours * 3_600_000) };
}

const overlaps = (a: { from: Date; to: Date }, b: Interval) => b.startsAt < a.to && b.endsAt > a.from;

export function isAvailable(q: SearchWindow, windows: WeeklyWindow[], blocks: Interval[], bookings: Interval[]): boolean {
  const want = requestInterval(q);
  if (blocks.some((b) => overlaps(want, b)) || bookings.some((b) => overlaps(want, b))) return false;
  // Janelas semanais dos dias D−1, D e D+1 em instantes reais; contíguas juntam-se.
  const intervals: [number, number][] = [];
  for (const k of [-1, 0, 1]) {
    const day = addDays(q.date, k);
    const wd = weekdayOf(day);
    for (const w of windows.filter((x) => x.weekday === wd)) {
      const s = toMin(w.startTime);
      let e = toMin(w.endTime);
      if (e <= s) e += 1440;
      intervals.push([lisbonToUtc(day, s).getTime(), lisbonToUtc(day, e).getTime()]);
    }
  }
  intervals.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const iv of intervals) {
    const last = merged[merged.length - 1];
    if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]);
    else merged.push([...iv]);
  }
  return merged.some(([s, e]) => s <= want.from.getTime() && e >= want.to.getTime());
}
