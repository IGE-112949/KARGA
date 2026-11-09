import { Router } from 'express';
import type { Db } from '../../db/types.js';
import { AppError } from '../../lib/errors.js';
import { receiveImages } from '../../lib/images.js';
import type { SpacePhotoStore } from '../../storage/spacePhotoStore.js';
import { availabilitySchema } from './availability.js';
import { blockSchema, coverSchema, createSpaceSchema, updateSpaceSchema } from './schemas.js';
import * as svc from './service.js';

const invalidData = () => new AppError(400, 'VALIDATION_ERROR', 'Dados inválidos', [{ field: 'data', message: 'JSON inválido' }]);

function parseData(raw: unknown): unknown {
  if (typeof raw !== 'string') throw invalidData();
  try {
    return JSON.parse(raw);
  } catch {
    throw invalidData();
  }
}

export function spaceRoutes(db: Db, store: SpacePhotoStore): Router {
  const r = Router();
  const p = (req: { params: Record<string, string> }) => req.params;

  r.get('/me/spaces', async (req, res, next) => {
    try { res.json(await svc.listSpaces(db, store, req.userId)); } catch (e) { next(e); }
  });

  // Multipart: campo "data" (JSON) + "photos" (1–5 imagens).
  r.post('/me/spaces', receiveImages('photos', svc.MAX_PHOTOS), async (req, res, next) => {
    try {
      await svc.requireHost(db, req.userId);
      const input = createSpaceSchema.parse(parseData(req.body?.data));
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      res.status(201).json(await svc.createSpace(db, store, req.userId, input, files));
    } catch (e) { next(e); }
  });

  r.get('/me/spaces/:id', async (req, res, next) => {
    try { res.json(await svc.getSpace(db, store, req.userId, p(req).id)); } catch (e) { next(e); }
  });

  r.patch('/me/spaces/:id', async (req, res, next) => {
    try { res.json(await svc.updateSpace(db, store, req.userId, p(req).id, updateSpaceSchema.parse(req.body))); } catch (e) { next(e); }
  });

  r.put('/me/spaces/:id/availability', async (req, res, next) => {
    try { res.json(await svc.setAvailability(db, store, req.userId, p(req).id, availabilitySchema.parse(req.body))); } catch (e) { next(e); }
  });

  r.delete('/me/spaces/:id', async (req, res, next) => {
    try { await svc.deleteSpace(db, req.userId, p(req).id); res.status(204).end(); } catch (e) { next(e); }
  });

  r.post('/me/spaces/:id/photos', receiveImages('file', 1), async (req, res, next) => {
    try { res.status(201).json(await svc.addPhoto(db, store, req.userId, p(req).id, req.file)); } catch (e) { next(e); }
  });

  r.patch('/me/spaces/:id/photos/:photoId', async (req, res, next) => {
    try {
      coverSchema.parse(req.body);
      res.json(await svc.makeCover(db, store, req.userId, p(req).id, p(req).photoId));
    } catch (e) { next(e); }
  });

  r.delete('/me/spaces/:id/photos/:photoId', async (req, res, next) => {
    try { res.json(await svc.removePhoto(db, store, req.userId, p(req).id, p(req).photoId)); } catch (e) { next(e); }
  });

  r.get('/me/spaces/:id/blocks', async (req, res, next) => {
    try { res.json(await svc.listBlocks(db, store, req.userId, p(req).id)); } catch (e) { next(e); }
  });

  r.post('/me/spaces/:id/blocks', async (req, res, next) => {
    try { res.status(201).json(await svc.addBlock(db, store, req.userId, p(req).id, blockSchema.parse(req.body))); } catch (e) { next(e); }
  });

  r.delete('/me/spaces/:id/blocks/:blockId', async (req, res, next) => {
    try { await svc.removeBlock(db, req.userId, p(req).id, p(req).blockId); res.status(204).end(); } catch (e) { next(e); }
  });

  return r;
}
