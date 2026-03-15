# API Documentation

OpenClaw Dashboard Backend API Reference

## Base URL

```
Development: http://localhost:3000
Production:  http://your-domain.com
```

## Authentication

Most API endpoints require authentication using JWT tokens.

### Obtaining a Token

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### Using the Token

Include the token in the Authorization header:

```http
Authorization: Bearer <your-token>
```

## Endpoints

### Health Check

```http
GET /api/v1/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-15T00:00:00.000Z",
  "version": "0.1.0"
}
```

### Agents

#### List All Agents

```http
GET /api/v1/agents
```

Response:
```json
{
  "agents": [
    {
      "id": "agent-1",
      "name": "Main Coordinator",
      "status": "active",
      "type": "main",
      "createdAt": "2026-03-15T00:00:00.000Z",
      "lastHeartbeat": "2026-03-15T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

#### Get Agent Details

```http
GET /api/v1/agents/:id
```

#### Create Agent

```http
POST /api/v1/agents
Content-Type: application/json

{
  "name": "New Agent",
  "type": "subagent",
  "config": {}
}
```

#### Update Agent

```http
PUT /api/v1/agents/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "paused"
}
```

#### Delete Agent

```http
DELETE /api/v1/agents/:id
```

### Tasks

#### List Tasks

```http
GET /api/v1/tasks?status=pending&agentId=agent-1
```

Query Parameters:
- `status`: Filter by status (pending, running, completed, failed)
- `agentId`: Filter by agent ID
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset (default: 0)

Response:
```json
{
  "tasks": [
    {
      "id": "task-1",
      "name": "Code Review",
      "status": "running",
      "agentId": "agent-1",
      "progress": 45,
      "createdAt": "2026-03-15T00:00:00.000Z",
      "updatedAt": "2026-03-15T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

#### Get Task Details

```http
GET /api/v1/tasks/:id
```

#### Create Task

```http
POST /api/v1/tasks
Content-Type: application/json

{
  "name": "New Task",
  "agentId": "agent-1",
  "payload": {}
}
```

#### Update Task

```http
PUT /api/v1/tasks/:id
Content-Type: application/json

{
  "status": "completed",
  "result": {}
}
```

#### Delete Task

```http
DELETE /api/v1/tasks/:id
```

### Logs

#### Get Logs

```http
GET /api/v1/logs?agentId=agent-1&level=info&limit=100
```

Query Parameters:
- `agentId`: Filter by agent ID
- `level`: Filter by log level (debug, info, warn, error)
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset

Response:
```json
{
  "logs": [
    {
      "id": "log-1",
      "level": "info",
      "message": "Task started",
      "agentId": "agent-1",
      "timestamp": "2026-03-15T00:00:00.000Z",
      "metadata": {}
    }
  ],
  "total": 1
}
```

### Metrics

#### Get System Metrics

```http
GET /api/v1/metrics
```

Response:
```json
{
  "cpu": 45.2,
  "memory": 512000000,
  "activeAgents": 3,
  "runningTasks": 12,
  "requestsPerMinute": 150
}
```

### Settings

#### Get Settings

```http
GET /api/v1/settings
```

#### Update Settings

```http
PUT /api/v1/settings
Content-Type: application/json

{
  "maxConcurrentTasks": 10,
  "logRetentionDays": 30
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid request parameters |
| `CONFLICT` | 409 | Resource conflict |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Default**: 100 requests per minute per IP
- **Authentication endpoints**: 10 requests per minute per IP

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1647302400
```

## WebSocket

Real-time updates are available via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

### Message Types

- `agent:status` - Agent status changes
- `task:progress` - Task progress updates
- `task:complete` - Task completion
- `log:new` - New log entries

## Versioning

API version is included in the URL path (`/api/v1/`). Future versions will be available at `/api/v2/`, etc.

Deprecated endpoints will be maintained for at least 6 months after a new version is released.
