import { Router } from 'express';
import type { Db } from '../../db/types.js';
import { createVehicleSchema, updateVehicleSchema } from './schemas.js';
import { addVehicle, editVehicle, listVehicles, removeVehicle } from './service.js';

export function vehicleRoutes(db: Db): Router {
  const r = Router();

  r.get('/me/vehicles', async (req, res, next) => {
    try {
      res.json(await listVehicles(db, req.userId));
    } catch (e) { next(e); }
  });

  r.post('/me/vehicles', async (req, res, next) => {
    try {
      const input = createVehicleSchema.parse(req.body);
      res.status(201).json(await addVehicle(db, req.userId, input));
    } catch (e) { next(e); }
  });

  r.patch('/me/vehicles/:id', async (req, res, next) => {
    try {
      const input = updateVehicleSchema.parse(req.body);
      res.json(await editVehicle(db, req.userId, req.params.id, input));
    } catch (e) { next(e); }
  });

  r.delete('/me/vehicles/:id', async (req, res, next) => {
    try {
      await removeVehicle(db, req.userId, req.params.id);
      res.status(204).end();
    } catch (e) { next(e); }
  });

  return r;
}
