import { Router } from 'express';
import type { Db } from '../../db/types.js';
import type { SpacePhotoStore } from '../../storage/spacePhotoStore.js';
import { addFavorite, listFavorites, removeFavorite } from './service.js';

export function favoriteRoutes(db: Db, store: SpacePhotoStore): Router {
  const r = Router();
  r.get('/me/favorites', async (req, res, next) => {
    try { res.json(await listFavorites(db, store, req.userId)); } catch (e) { next(e); }
  });
  r.put('/me/favorites/:spaceId', async (req, res, next) => {
    try { await addFavorite(db, req.userId, req.params.spaceId); res.status(204).end(); } catch (e) { next(e); }
  });
  r.delete('/me/favorites/:spaceId', async (req, res, next) => {
    try { await removeFavorite(db, req.userId, req.params.spaceId); res.status(204).end(); } catch (e) { next(e); }
  });
  return r;
}
