import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import dashboardRoutes from './dashboard.routes';
import systemRoutes from './system.routes';

const router: Router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/system', systemRoutes);

export default router;
