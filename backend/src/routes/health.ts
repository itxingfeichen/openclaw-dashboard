import { Router } from 'express';

export const healthRoutes = Router();

healthRoutes.get('/', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

healthRoutes.get('/ready', (_req, res) => {
  res.json({ ready: true });
});

healthRoutes.get('/live', (_req, res) => {
  res.json({ live: true });
});
