# OpenClaw Dashboard API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Token Types
- **Access Token**: Short-lived token (15 minutes) for API requests
- **Refresh Token**: Long-lived token (7 days) for obtaining new access tokens

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "timestamp": "2026-03-24T00:00:00.000Z"
  }
}
```

---

## Endpoints

### Health Check

#### GET /api/health
Check API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-24T00:00:00.000Z",
  "service": "openclaw-dashboard-backend",
  "version": "1.0.0"
}
```

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Validation Rules:**
- `email`: Valid email format
- `password`: 8-128 characters, must contain uppercase, lowercase, and number
- `name`: Optional, 1-100 characters

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm123abc...",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2026-03-24T00:00:00.000Z"
    },
    "message": "User registered successfully"
  }
}
```

**Errors:**
- `400` - Validation error
- `409` - User already exists

**Rate Limit:** 10 requests per 15 minutes

---

### POST /api/auth/login
Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm123abc...",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "message": "Login successful"
  }
}
```

**Token Expiry:**
- Access Token: 15 minutes (900 seconds)
- Refresh Token: 7 days

**Errors:**
- `400` - Validation error
- `401` - Invalid credentials

**Rate Limit:** 10 requests per 15 minutes

---

### GET /api/auth/verify
Verify JWT token validity.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "userId": "cm123abc...",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "expiresAt": "2026-03-24T01:00:00.000Z",
    "message": "Token is valid"
  }
}
```

**Errors:**
- `400` - Token required
- `401` - Invalid or expired token

---

### GET /api/auth/me
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm123abc...",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user"
    }
  }
}
```

**Errors:**
- `401` - Authentication required
- `404` - User not found

---

### POST /api/auth/refresh
Refresh access token using valid access token.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "message": "Token refreshed successfully"
  }
}
```

**Errors:**
- `401` - Authentication required

---

### POST /api/auth/logout
Logout current user.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logout successful"
  }
}
```

---

## User Management Endpoints

### GET /api/users
Get all users with pagination.

**Query Parameters:**
- `offset` (optional, default: 0) - Number of users to skip
- `limit` (optional, default: 10) - Maximum users to return

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "cm123abc...",
        "email": "john@example.com",
        "name": "John Doe",
        "role": "user",
        "createdAt": "2026-03-24T00:00:00.000Z",
        "updatedAt": "2026-03-24T00:00:00.000Z"
      }
    ],
    "total": 50
  }
}
```

---

### GET /api/users/:id
Get user information by ID.

**Parameters:**
- `id` (path) - User ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm123abc...",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2026-03-24T00:00:00.000Z",
      "updatedAt": "2026-03-24T00:00:00.000Z"
    }
  }
}
```

**Errors:**
- `404` - User not found

---

### PUT /api/users/:id
Update user information.

**Parameters:**
- `id` (path) - User ID

**Request Body (all optional):**
```json
{
  "email": "new@example.com",
  "name": "New Name",
  "role": "admin"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm123abc...",
      "email": "new@example.com",
      "name": "New Name",
      "role": "admin",
      "updatedAt": "2026-03-24T00:00:00.000Z"
    },
    "message": "User updated successfully"
  }
}
```

**Errors:**
- `400` - Validation error
- `404` - User not found
- `409` - Email already in use

---

### DELETE /api/users/:id
Delete a user.

**Parameters:**
- `id` (path) - User ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "User deleted successfully"
  }
}
```

**Errors:**
- `404` - User not found

---

## Dashboard Configuration Endpoints

### GET /api/dashboard/config
Get dashboard configuration for current user.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "config": {
      "theme": "light",
      "language": "en",
      "timezone": "UTC",
      "refreshInterval": 30000,
      "widgets": []
    }
  }
}
```

---

### PUT /api/dashboard/config
Update dashboard configuration.

**Request Body (all optional):**
```json
{
  "theme": "dark",
  "language": "zh-CN",
  "timezone": "Asia/Shanghai",
  "refreshInterval": 60000,
  "widgets": [
    {
      "id": "widget-1",
      "type": "chart",
      "position": {
        "x": 0,
        "y": 0,
        "width": 6,
        "height": 4
      },
      "visible": true
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "config": {
      "theme": "dark",
      "language": "zh-CN",
      "timezone": "Asia/Shanghai",
      "refreshInterval": 60000,
      "widgets": [...],
      "updatedAt": "2026-03-24T00:00:00.000Z"
    },
    "message": "Dashboard configuration updated successfully"
  }
}
```

---

## System Endpoints

### GET /api/system/status
Get system status and health information.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "operational",
    "uptime": 12345.67,
    "timestamp": "2026-03-24T00:00:00.000Z",
    "services": {
      "database": {
        "status": "connected",
        "responseTime": "12ms"
      },
      "api": {
        "status": "operational",
        "responseTime": "5ms"
      }
    },
    "resources": {
      "memory": {
        "used": 256,
        "total": 512,
        "unit": "MB"
      }
    }
  }
}
```

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (Validation Error) |
| 401 | Unauthorized (Invalid/Missing Token) |
| 404 | Not Found |
| 409 | Conflict (Resource Already Exists) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Rate Limiting

| Endpoint Type | Limit |
|--------------|-------|
| Authentication endpoints | 10 requests per 15 minutes |
| General endpoints | 100 requests per 15 minutes |

Rate limit headers are included in responses:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining
- `RateLimit-Reset`: Time when limit resets (Unix timestamp)

---

## CORS

CORS is enabled for configured origins. Configure via environment variable:
```
CORS_ORIGIN=http://localhost:5173
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment mode | development |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |
| `JWT_SECRET` | JWT access token secret | (required) |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | (required) |
| `DATABASE_URL` | Database connection string | file:prisma/dev.db |

---

## Security Notes

- Passwords are hashed using bcrypt with 10 salt rounds
- JWT tokens are signed using HS256 algorithm
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Rate limiting is applied to prevent brute force attacks
- Input validation is performed using Zod schema validation

---

## Testing

Run tests with:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

All tests must pass before deployment.
