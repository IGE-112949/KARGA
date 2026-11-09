import { Router } from 'express';
import { detectImageType, invalidImage, MAX_IMAGE_BYTES, receiveImages } from '../../lib/images.js';
import { eq, sql } from 'drizzle-orm';
import type { Db } from '../../db/types.js';
import { profiles } from '../../db/schema.js';
import type { AvatarStore } from '../../storage/avatarStore.js';
import { AppError } from '../../lib/errors.js';
import { getProfile, requireProfile } from './service.js';

export const MAX_AVATAR_BYTES = MAX_IMAGE_BYTES;
export { detectImageType };

const receiveFile = receiveImages('file', 1);

async function removeQuietly(avatars: AvatarStore, url: string | null) {
  if (!url) return;
  try {
    await avatars.remove(url);
  } catch (e) {
    console.error('Não foi possível apagar a foto anterior:', (e as Error).message);
  }
}

export function avatarRoutes(db: Db, avatars: AvatarStore): Router {
  const r = Router();

  r.put('/me/avatar', receiveFile, async (req, res, next) => {
    try {
      const current = await requireProfile(db, req.userId);
      const file = req.file;
      const type = file ? detectImageType(file.buffer) : null;
      if (!file || !type) throw invalidImage();
      const url = await avatars.upload(req.userId, file.buffer, type);
      await db.update(profiles).set({ avatarUrl: url, updatedAt: sql`now()` }).where(eq(profiles.id, req.userId));
      await removeQuietly(avatars, current.avatarUrl);
      res.json(await getProfile(db, req.userId));
    } catch (e) { next(e); }
  });

  r.delete('/me/avatar', async (req, res, next) => {
    try {
      const current = await requireProfile(db, req.userId);
      await db.update(profiles).set({ avatarUrl: null, updatedAt: sql`now()` }).where(eq(profiles.id, req.userId));
      await removeQuietly(avatars, current.avatarUrl);
      res.status(204).end();
    } catch (e) { next(e); }
  });

  return r;
}
