import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { eq, sql } from 'drizzle-orm';
import type { Db } from '../../db/types.js';
import { profiles } from '../../db/schema.js';
import type { AvatarStore, ImageType } from '../../storage/avatarStore.js';
import { AppError } from '../../lib/errors.js';
import { getProfile, requireProfile } from './service.js';

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const invalidImage = () =>
  new AppError(400, 'INVALID_IMAGE', 'Formato de imagem não suportado (usa JPEG, PNG ou WebP)');

// Tipo real pela assinatura dos primeiros bytes (o Content-Type enviado não é fiável).
export function detectImageType(buf: Buffer): ImageType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 4 && buf.readUInt32BE(0) === 0x89504e47) return 'image/png';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_AVATAR_BYTES, files: 1 } });

const receiveFile: RequestHandler = (req, res, next) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError(413, 'IMAGE_TOO_LARGE', 'A imagem tem mais de 5 MB'));
      return next(invalidImage());
    }
    next(err);
  });
};

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
