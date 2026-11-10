import { z } from 'zod';
import { addDays, lisbonToUtc, todayLisbon } from './availability.js';

export const MAX_DAYS_AHEAD = 3;
const MAX_SPAN = 0.5; // graus de lado (~50 km): impede pesquisar o país inteiro de uma vez

const windowFields = {
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').refine((d) => {
    const today = todayLisbon();
    return d >= today && d <= addDays(today, MAX_DAYS_AHEAD);
  }, 'Só podes escolher hoje ou um dos 3 dias seguintes'),
  start: z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, 'Hora inválida (de 30 em 30 minutos)'),
  hours: z.coerce.number().int('Duração inválida').min(1, 'Duração mínima de 1 hora').max(12, 'Duração máxima de 12 horas'),
};

const GRACE_MS = 30 * 60_000; // a meia hora em curso ainda se pode escolher

// Horas de hoje que já passaram não servem.
function notPast(v: { date: string; start: string }, ctx: z.RefinementCtx) {
  // Com a data ou a hora mal formadas o erro já foi dado pelo campo; não há nada a comparar.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date) || !/^\d{2}:\d{2}$/.test(v.start)) return;
  const [h, m] = v.start.split(':').map(Number);
  const t = lisbonToUtc(v.date, h * 60 + m).getTime();
  if (Number.isFinite(t) && t < Date.now() - GRACE_MS) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['start'], message: 'Essa hora já passou. Escolhe uma hora a partir de agora.' });
  }
}

export const windowSchema = z.object(windowFields).superRefine(notPast);

const bbox = z.string().transform((s, ctx) => {
  const n = s.split(',').map(Number);
  const [minLng, minLat, maxLng, maxLat] = n;
  const ok = n.length === 4 && n.every(Number.isFinite) && minLng < maxLng && minLat < maxLat
    && maxLng - minLng <= MAX_SPAN && maxLat - minLat <= MAX_SPAN && minLat >= -90 && maxLat <= 90;
  if (!ok) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Zona do mapa inválida ou demasiado grande' });
    return z.NEVER;
  }
  return { minLng, minLat, maxLng, maxLat };
});

export const searchSchema = z.object({
  ...windowFields,
  bbox,
  maxPrice: z.coerce.number().positive().optional(),
  minKw: z.coerce.number().positive().optional(),
  plug: z.enum(['schuko', 'type2']).optional(),
  covered: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
}).superRefine(notPast);

// No detalhe a janela é opcional (tudo ou nada).
export const detailQuerySchema = z.union([
  z.object(windowFields).superRefine(notPast),
  z.object({}).strict().transform(() => null),
]);

export type SearchQuery = z.infer<typeof searchSchema>;
