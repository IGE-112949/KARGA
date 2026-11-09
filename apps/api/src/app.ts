import express from 'express';

// Dependências injetadas na app (preenchidas nas tarefas seguintes).
export type AppDeps = Record<string, never>;

export function createApp(_deps: AppDeps): express.Express {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
