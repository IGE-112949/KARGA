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
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Pedido demasiado grande.' } });
    return;
  }
  console.error(safeForLog(err));
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro inesperado.' } });
};

// Os erros do Drizzle trazem os valores do pedido ("params: ...", ex.: telemóveis): não vão para o registo.
export function safeForLog(err: unknown): string {
  const e = err as { name?: string; message?: string; stack?: string; cause?: { code?: string; message?: string } };
  const strip = (t?: string) => (t ?? '').replace(/\n?params:[\s\S]*$/m, '\nparams: [omitidos]');
  const head = `${e?.name ?? 'Error'}: ${strip(e?.message)}`;
  const cause = e?.cause ? `\n  causa: ${e.cause.code ?? ''} ${e.cause.message ?? ''}` : '';
  const frames = (e?.stack ?? '').split('\n').filter((l) => l.trim().startsWith('at ')).slice(0, 5).join('\n');
  return `${head}${cause}${frames ? `\n${frames}` : ''}`;
}
