import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import { ProtectedRoute, PublicRoute } from '../components/ProtectedRoute';

/**
 * Route configuration
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <Register />
      </PublicRoute>
    ),
  },
  // Protected routes will be added here as they are developed
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <div className="dashboard-placeholder">
          <h1>Dashboard</h1>
          <p>Welcome to OpenClaw Dashboard!</p>
        </div>
      </ProtectedRoute>
    ),
  },
  {
    path: '/agents',
    element: (
      <ProtectedRoute>
        <div className="agents-placeholder">
          <h1>Agents</h1>
          <p>Agent management will be implemented here.</p>
        </div>
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: (
      <ProtectedRoute>
        <Navigate to="/dashboard" replace />
      </ProtectedRoute>
    ),
  },
];

/**
 * Create browser router with route configuration
 */
export const router = createBrowserRouter(routes);

export default router;
