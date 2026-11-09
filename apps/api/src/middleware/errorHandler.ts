import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    if (process.env.NODE_ENV !== 'test') console.warn('  validação:', err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }
  if (err instanceof AppError) {
    if (process.env.NODE_ENV !== 'test') console.warn(`  ${err.code}: ${err.message}`);
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }
  // JSON malformado no corpo do pedido
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'JSON inválido' } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro inesperado.' } });
};
