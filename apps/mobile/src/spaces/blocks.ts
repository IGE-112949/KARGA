import { shortDate as fmt } from '@/ui/RangeCalendar';

// Bloqueio de dias inteiros: início às 00:00 do primeiro dia, fim às 00:00 do dia a seguir ao último.
export function blockRange(start: Date, end: Date) {
  const endsAt = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
  return { startsAt: start.toISOString(), endsAt: endsAt.toISOString() };
}

export function blockLabel(b: { startsAt: string; endsAt: string }) {
  const s = new Date(b.startsAt);
  const last = new Date(new Date(b.endsAt).getTime() - 1);
  return s.toDateString() === last.toDateString() ? fmt(s) : `${fmt(s)} – ${fmt(last)}`;
}
