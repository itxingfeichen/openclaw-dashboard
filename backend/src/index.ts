import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { generalLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());
app.use(requestLogger);
app.use(generalLimiter);

// API Routes
app.use('/api', routes);

// Welcome endpoint
app.get('/api', (_req, res) => {
  res.json({
    message: 'Welcome to OpenClaw Dashboard API',
    version: '0.1.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
      },
      users: {
        get: 'GET /api/users/:id',
        update: 'PUT /api/users/:id',
      },
      dashboard: {
        getConfig: 'GET /api/dashboard/config',
        updateConfig: 'PUT /api/dashboard/config',
      },
      system: {
        status: 'GET /api/system/status',
      },
    },
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📖 API documentation: http://localhost:${PORT}/api`);
});
