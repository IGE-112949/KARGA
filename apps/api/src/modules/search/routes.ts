import { Router } from 'express';
import type { Db } from '../../db/types.js';
import type { SpacePhotoStore } from '../../storage/spacePhotoStore.js';
import { detailQuerySchema, searchSchema } from './schemas.js';
import { publicSpace, searchSpaces } from './service.js';

export function searchRoutes(db: Db, store: SpacePhotoStore): Router {
  const r = Router();
  r.get('/spaces/search', async (req, res, next) => {
    try { res.json(await searchSpaces(db, store, req.userId, searchSchema.parse(req.query))); } catch (e) { next(e); }
  });
  r.get('/spaces/:id', async (req, res, next) => {
    try { res.json(await publicSpace(db, store, req.userId, req.params.id, detailQuerySchema.parse(req.query))); } catch (e) { next(e); }
  });
  return r;
}
