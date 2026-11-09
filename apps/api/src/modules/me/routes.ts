import { Router } from 'express';
import type { Db } from '../../db/types.js';
import { createProfileSchema, updateProfileSchema } from './schemas.js';
import { createProfile, editProfile, getProfile } from './service.js';

export function meRoutes(db: Db): Router {
  const r = Router();

  r.get('/me', async (req, res, next) => {
    try {
      res.json(await getProfile(db, req.userId));
    } catch (e) { next(e); }
  });

  r.post('/me', async (req, res, next) => {
    try {
      const input = createProfileSchema.parse(req.body);
      res.status(201).json(await createProfile(db, req.userId, input));
    } catch (e) { next(e); }
  });

  r.patch('/me', async (req, res, next) => {
    try {
      const input = updateProfileSchema.parse(req.body);
      res.json(await editProfile(db, req.userId, input));
    } catch (e) { next(e); }
  });

  return r;
}
