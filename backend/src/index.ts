import express, { Request, Response, Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
if (NODE_ENV === 'development') {
  app.use(requestLogger());
}

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint (public)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'openclaw-dashboard-backend',
    version: '1.0.0',
  });
});

// Welcome endpoint (public)
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to OpenClaw Dashboard API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      dashboards: '/api/dashboards',
      system: '/api/system',
    },
  });
});

// 404 handler - must be registered before error handler
app.use(notFoundHandler);

// Global error handler - must be registered last
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🔧 Environment: ${NODE_ENV}`);
});

export default app;
