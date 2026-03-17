import { Router } from 'express';

export const apiRoutes = Router();

apiRoutes.get('/', (_req, res) => {
  res.json({
    message: 'OpenClaw Dashboard API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

// Example endpoint
apiRoutes.get('/status', (_req, res) => {
  res.json({
    status: 'running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
