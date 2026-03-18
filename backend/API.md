# OpenClaw Dashboard API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

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
    "timestamp": "2026-03-18T00:00:00.000Z"
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
  "timestamp": "2026-03-18T00:00:00.000Z",
  "service": "openclaw-dashboard-backend"
}
```

---

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Validation Rules:**
- `username`: 3-30 characters, alphanumeric and underscores only
- `email`: Valid email format
- `password`: 8-128 characters, must contain uppercase, lowercase, and number

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "createdAt": "2026-03-18T00:00:00.000Z"
    },
    "message": "User registered successfully"
  }
}
```

**Errors:**
- `400` - Validation error
- `409` - User already exists

---

#### POST /api/auth/login
Authenticate user and receive access token.

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
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "token": "jwt-token",
    "message": "Login successful"
  }
}
```

**Errors:**
- `400` - Validation error
- `401` - Invalid credentials

**Rate Limit:** 10 requests per 15 minutes

---

#### POST /api/auth/logout
Logout current user and invalidate token.

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

### Users

#### GET /api/users/:id
Get user information by ID.

**Parameters:**
- `id` (path) - User UUID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "displayName": "John Doe",
      "createdAt": "2026-03-18T00:00:00.000Z",
      "updatedAt": "2026-03-18T00:00:00.000Z"
    }
  }
}
```

**Errors:**
- `404` - User not found

---

#### PUT /api/users/:id
Update user information.

**Parameters:**
- `id` (path) - User UUID

**Request Body (all optional):**
```json
{
  "username": "new_username",
  "email": "new@example.com",
  "displayName": "New Display Name"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "new_username",
      "email": "new@example.com",
      "displayName": "New Display Name",
      "updatedAt": "2026-03-18T00:00:00.000Z"
    },
    "message": "User updated successfully"
  }
}
```

**Errors:**
- `400` - Validation error
- `404` - User not found
- `409` - Email or username already in use

---

### Dashboard Configuration

#### GET /api/dashboard/config
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

#### PUT /api/dashboard/config
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
      "updatedAt": "2026-03-18T00:00:00.000Z"
    },
    "message": "Dashboard configuration updated successfully"
  }
}
```

---

### System

#### GET /api/system/status
Get system status and health information.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "operational",
    "uptime": 12345.67,
    "timestamp": "2026-03-18T00:00:00.000Z",
    "services": {
      "database": {
        "status": "connected",
        "responseTime": "12ms"
      },
      "cache": {
        "status": "connected",
        "responseTime": "2ms"
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
      },
      "cpu": {
        "usage": "N/A"
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
| 401 | Unauthorized |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Authentication endpoints:** 10 requests per 15 minutes
- **General endpoints:** 100 requests per 15 minutes

Rate limit headers are included in responses:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining
- `RateLimit-Reset`: Time when limit resets (Unix timestamp)

---

## CORS

CORS is enabled for all origins by default. Configure via environment variable:
```
CORS_ORIGIN=https://your-domain.com
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `CORS_ORIGIN` | Allowed CORS origin | * |

---

## Notes

- This API uses mock data storage. Replace with database integration in production.
- Password hashing should be implemented before production deployment.
- JWT token validation middleware should be added for protected routes.
