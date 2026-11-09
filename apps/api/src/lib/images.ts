import type { RequestHandler } from 'express';
import multer from 'multer';
import { AppError } from './errors.js';

export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_EXT: Record<ImageType, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export const invalidImage = () =>
  new AppError(400, 'INVALID_IMAGE', 'Formato de imagem não suportado (usa JPEG, PNG ou WebP)');
export const imageTooLarge = () => new AppError(413, 'IMAGE_TOO_LARGE', 'A imagem tem mais de 5 MB');
export const tooManyPhotos = () => new AppError(409, 'TOO_MANY_PHOTOS', 'Um espaço pode ter no máximo 5 fotografias');

// Tipo real pela assinatura dos primeiros bytes (o Content-Type enviado não é fiável).
export function detectImageType(buf: Buffer): ImageType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 4 && buf.readUInt32BE(0) === 0x89504e47) return 'image/png';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

// Recebe imagens em multipart (memória) e traduz os erros do multer para os códigos da API.
export function receiveImages(field: string, maxFiles: number): RequestHandler {
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES, files: maxFiles } });
  const handler = maxFiles === 1 ? upload.single(field) : upload.array(field, maxFiles);
  return (req, res, next) => {
    handler(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return next(imageTooLarge());
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(maxFiles > 1 ? tooManyPhotos() : invalidImage());
        }
        return next(invalidImage());
      }
      next(err);
    });
  };
}
