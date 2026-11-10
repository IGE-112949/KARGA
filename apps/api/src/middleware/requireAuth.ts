import type { RequestHandler } from 'express';
import type { AuthVerifier } from '../auth/verifier.js';
import { unauthorized } from '../lib/errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export function requireAuth(verifier: AuthVerifier): RequestHandler {
  return async (req, _res, next) => {
    try {
      const header = req.headers.authorization ?? '';
      const [scheme, token] = header.trim().split(/\s+/);
      if (scheme?.toLowerCase() !== 'bearer' || !token) throw unauthorized();
      req.userId = (await verifier.verify(token)).userId;
      next();
    } catch (err) {
      next(err);
    }
  };
}
