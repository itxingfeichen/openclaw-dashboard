# OpenClaw Dashboard API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3001/api`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Endpoints](#endpoints)

---

## Overview

The OpenClaw Dashboard API follows RESTful conventions and uses JSON for request/response bodies.

### HTTP Methods

| Method | Description |
|--------|-------------|
| `GET` | Retrieve resources |
| `POST` | Create new resources |
| `PUT` | Update existing resources |
| `DELETE` | Remove resources |

---

## Authentication

Most endpoints require authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-token>
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

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

### Pagination Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 10 requests / 15 minutes |
| General API | 100 requests / 15 minutes |

---

## Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh token |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (admin) |
| POST | `/api/users` | Create user (admin) |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user (admin) |

### Dashboards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboards` | List dashboards |
| POST | `/api/dashboards` | Create dashboard |
| GET | `/api/dashboards/:id` | Get dashboard |
| PUT | `/api/dashboards/:id` | Update dashboard |
| DELETE | `/api/dashboards/:id` | Delete dashboard |

### Widgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboards/:id/widgets` | List widgets |
| POST | `/api/dashboards/:id/widgets` | Create widget |
| PUT | `/api/dashboards/:dashboardId/widgets/:widgetId` | Update widget |
| DELETE | `/api/dashboards/:dashboardId/widgets/:widgetId` | Delete widget |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/system/status` | System status |
| GET | `/api/system/health` | Health info (admin) |
| GET | `/api/system/metrics` | Metrics (admin) |

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `CORS_ORIGIN` | CORS origin | * |

---

For detailed endpoint documentation with request/response examples, see the full API reference.
