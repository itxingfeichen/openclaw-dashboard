# Metrics API Documentation

## Overview

The Metrics API provides comprehensive system resource monitoring capabilities for the OpenClaw Dashboard. It supports real-time and historical data collection for CPU, memory, disk, and network metrics, with optional agent-specific tracking.

## Base URL

```
/api/metrics
```

## Authentication

Currently, the Metrics API endpoints are publicly accessible. For production deployments, consider adding authentication middleware.

## Endpoints

### 1. GET /api/metrics/current

Get current system resource usage metrics.

**Description**: Collects and returns real-time system metrics including CPU usage, memory consumption, disk usage, network statistics, and system load averages. Optionally associates metrics with a specific agent.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `agentId` | string | No | `null` | Associate metrics with an agent ID |

**Response**:
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-03-14T12:00:00.000Z",
    "agentId": "agent-123",
    "hostname": "server-01",
    "platform": "linux",
    "arch": "x64",
    "cpu": {
      "usage": 45.6,
      "cores": 8,
      "model": "Intel(R) Xeon(R) CPU",
      "speed": 2400
    },
    "memory": {
      "total": 17179869184,
      "used": 8589934592,
      "free": 8589934592,
      "percent": 50.0
    },
    "disk": {
      "total": 107374182400,
      "used": 53687091200,
      "free": 53687091200,
      "percent": 50.0
    },
    "network": {
      "rxBytes": 1048576,
      "txBytes": 524288,
      "interfaceCount": 3
    },
    "load": {
      "load1": 1.25,
      "load5": 1.10,
      "load15": 0.95
    }
  },
  "timestamp": "2026-03-14T12:00:00.000Z"
}
```

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/metrics/current?agentId=agent-123"
```

---

### 2. GET /api/metrics/history

Retrieve historical metrics data with filtering and pagination support.

**Description**: Returns time-series metrics data from the database. Supports filtering by agent ID, time range, and customizable pagination.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `agentId` | string | No | `null` | Filter by agent ID |
| `from` | string (ISO 8601) | No | `null` | Start timestamp (e.g., `2026-03-14T10:00:00Z`) |
| `to` | string (ISO 8601) | No | `null` | End timestamp |
| `limit` | integer | No | `100` | Maximum records to return (1-1000) |
| `order` | string | No | `desc` | Sort order: `asc` or `desc` |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "timestamp": "2026-03-14T12:00:00.000Z",
      "agentId": "agent-123",
      "hostname": "server-01",
      "cpu": {
        "usage": 45.6,
        "cores": 8
      },
      "memory": {
        "total": 17179869184,
        "used": 8589934592,
        "free": 8589934592,
        "percent": 50.0
      },
      "disk": {
        "total": 107374182400,
        "used": 53687091200,
        "free": 53687091200,
        "percent": 50.0
      },
      "network": {
        "rxBytes": 1048576,
        "txBytes": 524288
      },
      "load": {
        "load1": 1.25,
        "load5": 1.10,
        "load15": 0.95
      }
    }
  ],
  "count": 1,
  "filters": {
    "agentId": "agent-123",
    "from": "2026-03-14T10:00:00.000Z",
    "to": "2026-03-14T12:00:00.000Z",
    "limit": 100,
    "order": "desc"
  },
  "timestamp": "2026-03-14T12:00:00.000Z"
}
```

**Example Request**:
```bash
# Get last 50 records for agent-123 from the last hour
curl -X GET "http://localhost:3000/api/metrics/history?agentId=agent-123&from=2026-03-14T11:00:00Z&limit=50"

# Get all metrics in ascending order
curl -X GET "http://localhost:3000/api/metrics/history?order=asc&limit=1000"
```

---

### 3. GET /api/metrics/agent/:agentId

Get metrics for a specific agent.

**Description**: Retrieves historical metrics data associated with a specific agent ID. This is a convenience endpoint that filters by agent ID.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | Yes | Agent identifier |

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | `100` | Maximum records to return |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "timestamp": "2026-03-14T12:00:00.000Z",
      "agentId": "agent-123",
      "hostname": "server-01",
      "cpu": {
        "usage": 45.6,
        "cores": 8
      },
      "memory": {
        "total": 17179869184,
        "used": 8589934592,
        "free": 8589934592,
        "percent": 50.0
      },
      "disk": {
        "total": 107374182400,
        "used": 53687091200,
        "free": 53687091200,
        "percent": 50.0
      },
      "network": {
        "rxBytes": 1048576,
        "txBytes": 524288
      },
      "load": {
        "load1": 1.25,
        "load5": 1.10,
        "load15": 0.95
      }
    }
  ],
  "agentId": "agent-123",
  "count": 1,
  "timestamp": "2026-03-14T12:00:00.000Z"
}
```

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/metrics/agent/agent-123?limit=50"
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Agent ID is required"
}
```

---

### 4. GET /api/metrics/summary

Get aggregated metrics summary with statistical analysis.

**Description**: Returns aggregated statistics (average, min, max) for CPU, memory, disk, and load metrics over a specified time range. Useful for dashboards and reporting.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `agentId` | string | No | `null` | Filter by agent ID |
| `from` | string (ISO 8601) | No | `null` | Start timestamp |
| `to` | string (ISO 8601) | No | `null` | End timestamp |

**Response**:
```json
{
  "success": true,
  "data": {
    "count": 100,
    "timeRange": {
      "first": "2026-03-14T10:00:00.000Z",
      "last": "2026-03-14T12:00:00.000Z"
    },
    "cpu": {
      "avg": 45.6,
      "max": 78.9,
      "min": 12.3
    },
    "memory": {
      "avg": 52.1,
      "max": 68.5,
      "min": 45.2
    },
    "disk": {
      "avg": 50.0,
      "max": 50.5,
      "min": 49.8
    },
    "load": {
      "avg1": 1.25,
      "avg5": 1.15,
      "avg15": 1.05
    }
  },
  "filters": {
    "agentId": "agent-123",
    "from": "2026-03-14T10:00:00.000Z",
    "to": "2026-03-14T12:00:00.000Z"
  },
  "timestamp": "2026-03-14T12:00:00.000Z"
}
```

**Example Request**:
```bash
# Get summary for all agents
curl -X GET "http://localhost:3000/api/metrics/summary"

# Get summary for specific agent in time range
curl -X GET "http://localhost:3000/api/metrics/summary?agentId=agent-123&from=2026-03-14T10:00:00Z&to=2026-03-14T12:00:00Z"
```

---

## Data Models

### Metrics Object

```typescript
interface Metrics {
  id: number;
  timestamp: string;        // ISO 8601 format
  agentId: string | null;   // Optional agent identifier
  hostname: string;         // Server hostname
  platform: string;         // OS platform (linux, darwin, win32)
  arch: string;             // CPU architecture
  
  cpu: {
    usage: number;          // CPU usage percentage (0-100)
    cores: number;          // Number of CPU cores
    model: string;          // CPU model name
    speed: number;          // CPU speed in MHz
  };
  
  memory: {
    total: number;          // Total memory in bytes
    used: number;           // Used memory in bytes
    free: number;           // Free memory in bytes
    percent: number;        // Usage percentage (0-100)
  };
  
  disk: {
    total: number;          // Total disk space in bytes
    used: number;           // Used disk space in bytes
    free: number;           // Free disk space in bytes
    percent: number;        // Usage percentage (0-100)
  };
  
  network: {
    rxBytes: number;        // Bytes received
    txBytes: number;        // Bytes transmitted
    interfaceCount: number; // Number of network interfaces
  };
  
  load: {
    load1: number;          // 1-minute load average
    load5: number;          // 5-minute load average
    load15: number;         // 15-minute load average
  };
}
```

### Summary Object

```typescript
interface MetricsSummary {
  count: number;            // Number of records in range
  timeRange: {
    first: string;          // Earliest timestamp
    last: string;           // Latest timestamp
  };
  cpu: {
    avg: number;            // Average CPU usage
    max: number;            // Maximum CPU usage
    min: number;            // Minimum CPU usage
  };
  memory: {
    avg: number;            // Average memory usage
    max: number;            // Maximum memory usage
    min: number;            // Minimum memory usage
  };
  disk: {
    avg: number;            // Average disk usage
    max: number;            // Maximum disk usage
    min: number;            // Minimum disk usage
  };
  load: {
    avg1: number;           // Average 1-minute load
    avg5: number;           // Average 5-minute load
    avg15: number;          // Average 15-minute load
  };
}
```

---

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error type description",
  "message": "Detailed error message"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 500 | Internal Server Error |

### Error Examples

**Invalid Query Parameter**:
```json
{
  "success": false,
  "error": "Invalid parameter",
  "message": "limit must be a positive integer"
}
```

**Database Error**:
```json
{
  "success": false,
  "error": "Failed to retrieve metrics",
  "message": "Database connection failed"
}
```

---

## Database Schema

The metrics data is stored in the `system_metrics` table:

```sql
CREATE TABLE system_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  agent_id TEXT,
  cpu_usage REAL,
  cpu_cores INTEGER,
  memory_total INTEGER,
  memory_used INTEGER,
  memory_free INTEGER,
  memory_percent REAL,
  disk_total INTEGER,
  disk_used INTEGER,
  disk_free INTEGER,
  disk_percent REAL,
  network_rx_bytes INTEGER,
  network_tx_bytes INTEGER,
  load_avg_1m REAL,
  load_avg_5m REAL,
  load_avg_15m REAL,
  hostname TEXT
);

-- Indexes for efficient querying
CREATE INDEX idx_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX idx_metrics_agent_id ON system_metrics(agent_id);
CREATE INDEX idx_metrics_agent_timestamp ON system_metrics(agent_id, timestamp);
```

---

## Usage Examples

### JavaScript/Node.js

```javascript
// Get current metrics
async function getCurrentMetrics(agentId) {
  const response = await fetch(`/api/metrics/current?agentId=${agentId}`);
  const data = await response.json();
  return data.data;
}

// Get historical metrics for charting
async function getMetricsForChart(agentId, hours = 24) {
  const from = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const response = await fetch(
    `/api/metrics/history?agentId=${agentId}&from=${from}&limit=1000&order=asc`
  );
  const data = await response.json();
  return data.data;
}

// Get summary for dashboard
async function getDashboardSummary(agentId) {
  const response = await fetch(`/api/metrics/summary?agentId=${agentId}`);
  const data = await response.json();
  return data.data;
}
```

### Python

```python
import requests
from datetime import datetime, timedelta

# Get current metrics
def get_current_metrics(agent_id=None):
    params = {}
    if agent_id:
        params['agentId'] = agent_id
    
    response = requests.get('http://localhost:3000/api/metrics/current', params=params)
    return response.json()['data']

# Get historical metrics
def get_historical_metrics(agent_id=None, hours=24):
    params = {
        'from': (datetime.now() - timedelta(hours=hours)).isoformat(),
        'limit': 1000,
        'order': 'asc'
    }
    if agent_id:
        params['agentId'] = agent_id
    
    response = requests.get('http://localhost:3000/api/metrics/history', params=params)
    return response.json()['data']

# Get summary
def get_summary(agent_id=None):
    params = {}
    if agent_id:
        params['agentId'] = agent_id
    
    response = requests.get('http://localhost:3000/api/metrics/summary', params=params)
    return response.json()['data']
```

### cURL Examples

```bash
# Monitor CPU usage over time
watch -n 5 'curl -s http://localhost:3000/api/metrics/current | jq .data.cpu.usage'

# Export last hour of metrics to JSON
curl -s "http://localhost:3000/api/metrics/history?from=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)" | jq . > metrics-export.json

# Get summary statistics
curl -s http://localhost:3000/api/metrics/summary | jq .data
```

---

## Performance Considerations

### Query Optimization

- Use time range filters (`from`, `to`) to limit data volume
- Set appropriate `limit` values (default: 100)
- Use the `/summary` endpoint for aggregated data instead of retrieving all records

### Database Maintenance

Periodically clean up old metrics data:

```javascript
// Delete metrics older than 30 days
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
await deleteOldMetrics(thirtyDaysAgo);
```

### Recommended Polling Intervals

| Use Case | Interval |
|----------|----------|
| Real-time monitoring | 5-10 seconds |
| Dashboard updates | 30-60 seconds |
| Historical analysis | 5-15 minutes |
| Alerting | 1-5 minutes |

---

## Testing

Run the test suite:

```bash
# Run all metrics tests
npm test -- tests/metrics.test.js

# Run with coverage
npm run test:coverage -- tests/metrics.test.js

# Run in watch mode
npm run test:watch -- tests/metrics.test.js
```

---

## Future Enhancements

- [ ] Add authentication/authorization
- [ ] Support for custom metrics
- [ ] Real-time WebSocket streaming
- [ ] Data export (CSV, Prometheus format)
- [ ] Advanced aggregation (hourly, daily rollups)
- [ ] Alerting thresholds and notifications
- [ ] Multi-server clustering support

---

## Support

For issues or questions:
- Check existing issues in the repository
- Review the test files for usage examples
- Contact the development team

**Version**: 1.0.0  
**Last Updated**: 2026-03-14
