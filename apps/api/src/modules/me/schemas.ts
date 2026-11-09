import { z } from 'zod';
import type { VehicleDto } from '../vehicles/schemas.js';

const fullName = z.string({ required_error: 'Indica o teu nome' }).trim()
  .min(2, 'O nome tem de ter pelo menos 2 caracteres').max(100, 'O nome é demasiado longo');

const phone = z.string().transform((s) => s.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, 'Telemóvel inválido (usa o formato +351 912 345 678)'));

export const createProfileSchema = z.object({
  fullName,
  phone: phone.optional(),
  isDriver: z.boolean(),
  isHost: z.boolean(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Tens de aceitar os Termos e a Política de Privacidade' }) }),
}).refine((d) => d.isDriver || d.isHost, { message: 'Escolhe pelo menos um modo: condutor ou proprietário', path: ['isDriver'] });

export const updateProfileSchema = z.object({
  fullName: fullName.optional(),
  phone: phone.nullable().optional(),
  isDriver: z.boolean().optional(),
  isHost: z.boolean().optional(),
}).strict();

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type ProfileDto = {
  id: string;
  fullName: string;
  phone: string | null;
  isDriver: boolean;
  isHost: boolean;
  termsAcceptedAt: string;
  vehicles: VehicleDto[];
};
