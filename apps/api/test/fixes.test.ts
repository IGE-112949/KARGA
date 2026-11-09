import { describe, it, expect } from 'vitest';
import { mapVehicleWriteError } from '../src/modules/vehicles/service.js';
import { createPool } from '../src/db/client.js';
import { AppError } from '../src/lib/errors.js';

const wrapped = (constraint: string) => ({ message: 'Failed query', cause: { code: '23505', constraint } });

describe('mapVehicleWriteError', () => {
  it('matrícula duplicada → 409 PLATE_TAKEN', () => {
    const e = mapVehicleWriteError(wrapped('vehicles_plate_unique'));
    expect(e).toBeInstanceOf(AppError);
    expect((e as AppError).code).toBe('PLATE_TAKEN');
  });

  it('conflito no veículo predefinido (pedidos simultâneos) → 409 VEHICLE_CONFLICT, não PLATE_TAKEN', () => {
    const e = mapVehicleWriteError(wrapped('vehicles_one_default_per_user'));
    expect((e as AppError).code).toBe('VEHICLE_CONFLICT');
    expect((e as AppError).status).toBe(409);
  });

  it('outros erros passam inalterados', () => {
    const original = new Error('x');
    expect(mapVehicleWriteError(original)).toBe(original);
  });
});

describe('createPool', () => {
  it('regista um listener de erro para ligações inativas não derrubarem o processo', async () => {
    const pool = createPool('postgresql://u:p@localhost:1/db');
    expect(pool.listenerCount('error')).toBeGreaterThan(0);
    await pool.end();
  });
});
