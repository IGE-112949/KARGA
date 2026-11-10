import express from 'express';
import cors from 'cors';
import type { Db } from './db/types.js';
import type { AuthVerifier } from './auth/verifier.js';
import type { AuthAdmin } from './auth/admin.js';
import type { AvatarStore } from './storage/avatarStore.js';
import { avatarRoutes } from './modules/me/avatar.js';
import { requireAuth } from './middleware/requireAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { meRoutes } from './modules/me/routes.js';
import { vehicleRoutes } from './modules/vehicles/routes.js';
import { spaceRoutes } from './modules/spaces/routes.js';
import { searchRoutes } from './modules/search/routes.js';
import { configureLocationSecret } from './modules/search/service.js';
import { favoriteRoutes } from './modules/favorites/routes.js';
import type { SpacePhotoStore } from './storage/spacePhotoStore.js';

export type AppDeps = { db: Db; auth: AuthVerifier; authAdmin: AuthAdmin; avatars: AvatarStore; spacePhotos: SpacePhotoStore; locationSecret: string };

export function createApp(deps: AppDeps): express.Express {
  const app = express();
  // A app web (Expo) chama a API a partir de outra origem; sem cookies, só Bearer token.
  app.use(cors({ origin: true }));
  // Registo simples de cada pedido no terminal (desligado nos testes).
  if (process.env.NODE_ENV !== 'test') {
    app.use((req, res, next) => {
      const t0 = Date.now();
      res.on('finish', () => console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - t0} ms)`));
      next();
    });
  }
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Todas as rotas abaixo exigem sessão.
  const api = express.Router();
  api.use(requireAuth(deps.auth));
  api.use(meRoutes(deps.db, deps.authAdmin, deps.avatars));
  api.use(avatarRoutes(deps.db, deps.avatars));
  api.use(vehicleRoutes(deps.db));
  api.use(spaceRoutes(deps.db, deps.spacePhotos));
  configureLocationSecret(deps.locationSecret);
  api.use(searchRoutes(deps.db, deps.spacePhotos));
  api.use(favoriteRoutes(deps.db, deps.spacePhotos));
  app.use(api);

  app.use(errorHandler);
  return app;
}
