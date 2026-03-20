import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import dashboardRoutes from './dashboard.routes';
import systemRoutes from './system.routes';

const router: Router = Router();

/**
 * API Routes
 * Base path: /api
 */

// Authentication routes
router.use('/auth', authRoutes);

// User management routes
router.use('/users', userRoutes);

// Dashboard management routes
router.use('/dashboards', dashboardRoutes);

// System monitoring routes
router.use('/system', systemRoutes);

export default router;
