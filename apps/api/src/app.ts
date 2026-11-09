import express from 'express';
import type { Db } from './db/types.js';
import type { AuthVerifier } from './auth/verifier.js';
import type { AuthAdmin } from './auth/admin.js';
import { requireAuth } from './middleware/requireAuth.js';
import { errorHandler } from './middleware/errorHandler.js';

export type AppDeps = { db: Db; auth: AuthVerifier; authAdmin: AuthAdmin };

export function createApp(deps: AppDeps): express.Express {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Todas as rotas abaixo exigem sessão.
  const api = express.Router();
  api.use(requireAuth(deps.auth));
  app.use(api);

  app.use(errorHandler);
  return app;
}
