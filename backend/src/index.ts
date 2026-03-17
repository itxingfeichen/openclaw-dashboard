import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from './config/index.js';
import { healthRoutes } from './routes/health.js';
import { apiRoutes } from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

dotenv.config();

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/health', healthRoutes);
app.use('/api', apiRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
