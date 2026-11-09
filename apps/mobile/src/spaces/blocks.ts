// "DD/MM/AAAA" → data local (meia-noite) ou null se inválida.
export function parseDate(s: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const date = new Date(y, mo, d);
  return date.getFullYear() === y && date.getMonth() === mo && date.getDate() === d ? date : null;
}

const fmt = (d: Date) => d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }).replace('.', '');

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
