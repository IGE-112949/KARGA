import { z } from 'zod';

const startTime = z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, 'Hora inválida (HH:MM, de 30 em 30 minutos)');
const endTime = z.string().regex(/^(([01]\d|2[0-3]):(00|30)|24:00)$/, 'Hora inválida (HH:MM, de 30 em 30 minutos)');

// Um horário por dia: 0 = segunda … 6 = domingo. end <= start atravessa a meia-noite; 00:00–24:00 = dia todo.
export const windowSchema = z.object({
  weekday: z.number().int().min(0, 'Dia inválido').max(6, 'Dia inválido'),
  startTime,
  endTime,
}).refine((w) => w.startTime !== w.endTime, { message: 'A hora de fim tem de ser diferente da de início', path: ['endTime'] });

export const availabilitySchema = z.array(windowSchema)
  .min(1, 'Escolhe pelo menos um dia')
  .max(7)
  .refine((ws) => new Set(ws.map((w) => w.weekday)).size === ws.length, { message: 'Cada dia só pode ter um horário' });

export type AvailabilityWindow = z.infer<typeof windowSchema>;
