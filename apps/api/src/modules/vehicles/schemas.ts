import { z } from 'zod';
import { normalizePlate } from './plate.js';

export type PlugType = 'type2' | 'schuko' | 'ccs';

export type VehicleDto = {
  id: string;
  makeModel: string;
  plate: string;
  plugType: PlugType;
  isDefault: boolean;
};

const makeModel = z.string({ required_error: 'Indica a marca e o modelo' }).trim()
  .min(2, 'Marca/modelo demasiado curto').max(60, 'Marca/modelo demasiado longo');

const plate = z.string({ required_error: 'Indica a matrícula' }).transform((s, ctx) => {
  const normalized = normalizePlate(s);
  if (!normalized) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Matrícula inválida (ex.: AA-00-AA)' });
    return z.NEVER;
  }
  return normalized;
});

const plugType = z.enum(['type2', 'schuko', 'ccs'], {
  errorMap: () => ({ message: 'Tipo de ficha inválido (Tipo 2, Schuko ou CCS)' }),
});

export const createVehicleSchema = z.object({ makeModel, plate, plugType });

export const updateVehicleSchema = z.object({
  makeModel: makeModel.optional(),
  plate: plate.optional(),
  plugType: plugType.optional(),
  isDefault: z.literal(true, { errorMap: () => ({ message: 'Só é possível definir como predefinido (true)' }) }).optional(),
}).strict();

export const vehicleIdSchema = z.string().uuid();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
