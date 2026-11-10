import { z } from 'zod';
import { availabilitySchema } from './availability.js';

const trimmed = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label} tem de ter pelo menos ${min} caracteres`).max(max, `${label} é demasiado longo`);
const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} é demasiado longo`).transform((s) => s || null).nullable().optional();
const money = (min: number, max: number, decimals: number, label: string) =>
  z.number({ invalid_type_error: `${label} inválido` }).min(min, `${label}: mínimo ${min.toFixed(2).replace('.', ',')} €`)
    .max(max, `${label}: máximo ${max.toFixed(2).replace('.', ',')} €`)
    // Recusa em vez de arredondar sem avisar (0,333 não passa a 0,33).
    .refine((v) => Math.abs(v * 10 ** decimals - Math.round(v * 10 ** decimals)) < 1e-6, `${label}: usa no máximo ${decimals} casas decimais`)
    .transform((v) => Number(v.toFixed(decimals)));

// A zona é pública (mostrada antes de reservar): tira códigos postais e recusa o que pareça uma morada (números).
export function sanitizeArea(v: string | null | undefined): string | null {
  if (v == null) return null;
  const s = v.replace(/\b\d{4}-\d{3}\b/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s || /\d/.test(s) || s.length > 80) return null;
  return s;
}

export const POWER_LIMITS = { schuko: [1.8, 3.7], type2: [3.7, 22] } as const;

const fields = {
  title: trimmed(3, 60, 'O nome'),
  address: trimmed(5, 200, 'A morada'),
  spotDetails: optionalText(60, 'O piso/lugar'),
  area: z.string().nullable().optional().transform((v) => (v === undefined ? undefined : sanitizeArea(v))),
  description: optionalText(500, 'A descrição'),
  latitude: z.number().min(-90, 'Latitude inválida').max(90, 'Latitude inválida'),
  longitude: z.number().min(-180, 'Longitude inválida').max(180, 'Longitude inválida'),
  spaceType: z.enum(['closed_garage', 'covered', 'outdoor'], { errorMap: () => ({ message: 'Tipo de lugar inválido' }) }),
  plugType: z.enum(['schuko', 'type2'], { errorMap: () => ({ message: 'Ficha inválida (Schuko ou Tipo 2)' }) }),
  powerKw: z.number().positive('Potência inválida').transform((v) => Number(v.toFixed(1))),
  pricePerHour: money(0.1, 20, 2, 'Preço por hora'),
  energyPriceKwh: money(0.05, 1, 3, 'Preço da energia').nullable().optional(),
  accessInstructions: optionalText(500, 'As instruções'),
  accessCode: optionalText(20, 'O código de acesso'),
};

export function powerIssue(plugType: 'schuko' | 'type2', powerKw: number): string | null {
  const [min, max] = POWER_LIMITS[plugType];
  if (powerKw < min || powerKw > max) {
    return plugType === 'schuko'
      ? 'Numa tomada Schuko a potência vai de 1,8 a 3,7 kW'
      : 'Numa wallbox Tipo 2 a potência vai de 3,7 a 22 kW';
  }
  return null;
}

export const createSpaceSchema = z.object({ ...fields, availability: availabilitySchema }).superRefine((v, ctx) => {
  const issue = powerIssue(v.plugType, v.powerKw);
  if (issue) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['powerKw'], message: issue });
});

export const updateSpaceSchema = z.object({
  ...Object.fromEntries(Object.entries(fields).map(([k, s]) => [k, (s as z.ZodTypeAny).optional()])) as {
    [K in keyof typeof fields]: z.ZodOptional<(typeof fields)[K]>;
  },
  status: z.enum(['active', 'inactive'], { errorMap: () => ({ message: 'Estado inválido' }) }).optional(),
}).strict();

export const blockSchema = z.object({
  startsAt: z.string().datetime({ offset: true, message: 'Data inválida' }),
  endsAt: z.string().datetime({ offset: true, message: 'Data inválida' }),
  reason: optionalText(100, 'O motivo'),
}).refine((b) => new Date(b.endsAt) > new Date(b.startsAt), { message: 'O fim tem de ser depois do início', path: ['endsAt'] });

export const coverSchema = z.object({ isCover: z.literal(true) });
export const uuidSchema = z.string().uuid();

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;
