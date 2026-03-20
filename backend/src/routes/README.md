# API Routes

This directory contains all API route definitions for the OpenClaw Dashboard backend.

## Structure

```
routes/
├── index.ts           # Main router, mounts all route modules
├── auth.routes.ts     # Authentication endpoints
├── user.routes.ts     # User management endpoints
├── dashboard.routes.ts # Dashboard and widget endpoints
└── system.routes.ts   # System monitoring endpoints
```

## Route Organization

### Base Path: `/api`

All routes are mounted under the `/api` base path.

### Route Modules

#### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout (requires auth)
- `GET /me` - Get current user (requires auth)
- `POST /refresh` - Refresh access token (requires auth)

#### Users (`/api/users`)
- `GET /` - List all users (requires admin)
- `POST /` - Create user (requires admin)
- `GET /:id` - Get user by ID (requires auth)
- `PUT /:id` - Update user (requires auth)
- `DELETE /:id` - Delete user (requires admin)

#### Dashboards (`/api/dashboards`)
- `GET /` - List user's dashboards (requires auth)
- `POST /` - Create dashboard (requires auth)
- `GET /:id` - Get dashboard by ID (requires auth)
- `PUT /:id` - Update dashboard (requires auth)
- `DELETE /:id` - Delete dashboard (requires auth)

#### Widgets (nested under dashboards)
- `GET /:id/widgets` - List dashboard widgets (requires auth)
- `POST /:id/widgets` - Create widget (requires auth)
- `PUT /:dashboardId/widgets/:widgetId` - Update widget (requires auth)
- `DELETE /:dashboardId/widgets/:widgetId` - Delete widget (requires auth)

#### System (`/api/system`)
- `GET /status` - Basic system status (public)
- `GET /health` - Detailed health info (requires admin)
- `GET /metrics` - Performance metrics (requires admin)

## RESTful Conventions

All routes follow RESTful conventions:

- **GET** - Retrieve resources
- **POST** - Create new resources
- **PUT** - Update existing resources
- **DELETE** - Remove resources

## Response Format

All responses follow a consistent format:

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "ERR_CODE",
    "message": "Error description",
    "httpStatus": 400
  }
}
```

## Middleware

Routes use the following middleware:

- **authenticate** - Verifies JWT token (for protected routes)
- **requireAdmin** - Checks admin role (for admin routes)
- **validateRequest** - Validates request body/params with Zod schemas
- **generalLimiter** - Rate limiting (100 req/15min)
- **authLimiter** - Stricter rate limiting for auth endpoints (10 req/15min)

## Adding New Routes

1. Create a new route file: `your-feature.routes.ts`
2. Define routes using Express Router
3. Add JSDoc comments for each endpoint
4. Apply appropriate middleware
5. Export the router
6. Mount in `index.ts`

Example:
```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/your-feature
 * @desc    Get your feature
 * @access  Private
 */
router.get('/', authenticate, yourHandler);

export default router;
```

## Error Handling

All errors are caught and passed to the global error handler. Use try-catch in async handlers:

```typescript
export const yourHandler = async (req, res, next) => {
  try {
    // Your logic
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
```

## Testing

Test routes using:
- curl
- Postman
- Automated tests in `/tests` directory

Example curl:
```bash
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```
