# Export API 文档

数据导出功能 API，支持多格式导出、自定义字段、批量导出、异步导出。

## 概述

Export API 提供系统数据的导出能力，支持：

- 📊 多格式支持：JSON, CSV, XLSX
- 🎯 自定义字段选择
- 🔍 数据过滤
- 📦 批量导出
- ⚡ 异步导出（大文件）

## 基础信息

- **Base URL**: `/api/export`
- **认证**: 需要（根据项目配置）
- **数据格式**: JSON

## 导出格式

| 格式 | 值 | MIME Type | 说明 |
|------|-----|-----------|------|
| JSON | `json` | `application/json` | 结构化数据，适合程序处理 |
| CSV | `csv` | `text/csv` | 表格数据，适合 Excel 打开 |
| XLSX | `xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | Excel 格式 |

## 导出类型

| 类型 | 端点 | 说明 |
|------|------|------|
| Agents | `/api/export/agents` | 导出 Agent 配置和状态 |
| Tasks | `/api/export/tasks` | 导出任务数据 |
| Logs | `/api/export/logs` | 导出日志数据 |
| Config | `/api/export/config` | 导出配置数据 |

## 数据模型

### ExportResult（导出结果）

```json
{
  "exportId": "export_1710432000000_abc123",
  "filePath": "/path/to/export/file.json",
  "format": "json",
  "type": "agents",
  "recordCount": 150,
  "mimeType": "application/json",
  "createdAt": "2024-03-14T10:00:00.000Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| exportId | string | 导出任务唯一 ID |
| filePath | string | 导出文件路径 |
| format | string | 导出格式 |
| type | string | 导出类型 |
| recordCount | number | 记录数量 |
| mimeType | string | 文件 MIME 类型 |
| createdAt | string | 创建时间（ISO 8601） |

### AsyncExportResult（异步导出结果）

```json
{
  "exportId": "export_1710432000000_abc123",
  "status": "pending",
  "message": "导出任务已创建，正在后台处理"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| exportId | string | 导出任务唯一 ID |
| status | string | 导出状态：pending, processing, completed, failed |
| message | string | 状态消息 |

### ExportHistory（导出历史）

```json
{
  "exportId": "export_1710432000000_abc123",
  "type": "agents",
  "format": "json",
  "status": "completed",
  "filePath": "/path/to/export/file.json",
  "fields": ["id", "name", "status"],
  "filters": {},
  "options": {},
  "createdAt": "2024-03-14T10:00:00.000Z",
  "completedAt": "2024-03-14T10:00:05.000Z",
  "errorMessage": null,
  "recordCount": 150
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| exportId | string | 导出任务唯一 ID |
| type | string | 导出类型 |
| format | string | 导出格式 |
| status | string | 导出状态 |
| filePath | string | 导出文件路径 |
| fields | array | 导出字段列表 |
| filters | object | 过滤条件 |
| options | object | 查询选项 |
| createdAt | string | 创建时间 |
| completedAt | string | 完成时间 |
| errorMessage | string | 错误消息（失败时） |
| recordCount | number | 记录数量 |

### ExportFields（可用字段）

```json
{
  "type": "agents",
  "defaultFields": ["id", "name", "type", "description", "status", "model_name", "created_at", "updated_at"],
  "description": "Agent 配置和状态信息"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 导出类型 |
| defaultFields | array | 默认字段列表 |
| description | string | 类型描述 |

## API 端点

### POST /api/export/agents

导出 Agent 数据。

**请求参数**：

Query Parameters:
- `format` (string, optional): 导出格式 (json/csv/xlsx)，默认 `json`
- `async` (boolean, optional): 是否异步导出，默认 `false`

Request Body:
```json
{
  "fields": ["id", "name", "status", "model_name"],
  "filters": {
    "status": "running"
  },
  "options": {
    "limit": 100,
    "offset": 0,
    "orderBy": "created_at",
    "orderDirection": "DESC"
  }
}
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "exportId": "export_1710432000000_abc123",
    "filePath": "/path/to/export/file.json",
    "format": "json",
    "type": "agents",
    "recordCount": 5,
    "mimeType": "application/json",
    "createdAt": "2024-03-14T10:00:00.000Z"
  },
  "timestamp": "2024-03-14T10:00:00.000Z"
}
```

**错误响应**：

```json
{
  "success": false,
  "error": {
    "message": "不支持的导出格式：xml。支持的格式：json, csv, xlsx",
    "code": "INVALID_FORMAT"
  },
  "timestamp": "2024-03-14T10:00:00.000Z"
}
```

---

### POST /api/export/tasks

导出任务数据。

**请求参数**：

Query Parameters:
- `format` (string, optional): 导出格式 (json/csv/xlsx)，默认 `json`
- `async` (boolean, optional): 是否异步导出，默认 `false`

Request Body:
```json
{
  "fields": ["task_id", "title", "status", "priority", "agent_id"],
  "filters": {
    "status": "completed",
    "priority": "high"
  },
  "options": {
    "limit": 100,
    "orderBy": "completed_at",
    "orderDirection": "DESC"
  }
}
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "exportId": "export_1710432000000_def456",
    "filePath": "/path/to/export/file.json",
    "format": "json",
    "type": "tasks",
    "recordCount": 25,
    "mimeType": "application/json",
    "createdAt": "2024-03-14T10:00:00.000Z"
  },
  "timestamp": "2024-03-14T10:00:00.000Z"
}
```

---

### POST /api/export/logs

导出日志数据。

**请求参数**：

Query Parameters:
- `format` (string, optional): 导出格式 (json/csv/xlsx)，默认 `json`
- `async` (boolean, optional): 是否异步导出，默认 `false`

Request Body:
```json
{
  "fields": ["task_id", "level", "message", "created_at"],
  "filters": {
    "level": "error"
  },
  "options": {
    "limit": 1000,
    "orderBy": "created_at",
    "orderDirection": "DESC"
  }
}
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "exportId": "export_1710432000000_ghi789",
    "filePath": "/path/to/export/file.json",
    "format": "json",
    "type": "logs",
    "recordCount": 100,
    "mimeType": "application/json",
    "createdAt": "2024-03-14T10:00:00.000Z"
  },
  "timestamp": "2024-03-14T10:00:00.000Z"
}
```

---

### POST /api/export/config

导出配置数据。

**请求参数**：

Query Parameters:
- `format` (string, optional): 导出格式 (json/csv/xlsx)，默认 `json`
- `async` (boolean, optional): 是否异步导出，默认 `false`

Request Body:
```json
{
  "fields": ["key", "value", "type", "description"],
  "filters": {},
  "options": {
    "limit": 500
  }
}
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "exportId": "export_1710432000000_jkl012",
    "filePath": "/path/to/export/file.json",
    "format": "json",
    "type": "config",
    "recordCount": 50,
    "mimeType": "application/json",
    "createdAt": "2024-03-14T10:00:00.000Z"
  },
  "timestamp": "2024-03-14T10:00:00.000Z"
}
```

---

### GET /api/export/download/:id

下载导出文件。

**路径参数**：
- `id` (string, required): 导出 ID

**响应**：

- Content-Type: 根据文件格式自动设置
- Content-Disposition: `attachment; filename="export_<id>.<format>"`
- 文件内容

**示例请求**：

```
GET /api/export/download/export_1710432000000_abc123
```

---

### GET /api/export/history

获取导出历史记录。

**查询参数**：
- `limit` (number, optional): 每页数量，默认 `50`
- `offset` (number, optional): 偏移量，默认 `0`

**响应示例**：

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "exportId": "export_1710432000000_abc123",
        "type": "agents",
        "format": "json",
        "status": "completed",
        "recordCount": 150,
        "createdAt": "2024-03-14T10:00:00.000Z",
        "completedAt": "2024-03-14T10:00:05.000Z"
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 1
    }
  },
  "timestamp": "2024-03-14T10:00:00.000Z"
}
```

---

### DELETE /api/export/:id

删除导出文件。

**路径参数**：
- `id` (string, required): 导出 ID

**响应示例**：

```json
{
  "success": true,
  "data": {
    "exportId": "export_1710432000000_abc123",
    "deleted": true
  },
  "timestamp": "2024-03-14T10:00:00.000Z"
}
```

**错误响应**：

```json
{
  "success": false,
  "error": {
    "message": "导出文件不存在：export_1710432000000_abc123",
    "code": "NOT_FOUND"
  },
  "timestamp": "2024-03-14T10:00:00.000Z"
}
```

---

### POST /api/export/cleanup

清理过期的导出文件。

**请求参数**：

Request Body:
```json
{
  "maxAge": 604800000
}
```

| 参数 | 类型 | 说明 |
|------|------|------|
| maxAge | number | 最大保留时间（毫秒），默认 7 天（604800000ms） |

**响应示例**：

```json
{
  "success": true,
  "data": {
    "deletedCount": 5,
    "freedSpace": 1024000,
    "maxAge": 604800000
  },
  "timestamp": "2024-03-14T10:00:00.000Z"
}
```

---

### GET /api/export/fields/:type

获取指定类型的可用字段列表。

**路径参数**：
- `type` (string, required): 导出类型 (agents/tasks/logs/config)

**响应示例**：

```json
{
  "success": true,
  "data": {
    "type": "agents",
    "defaultFields": ["id", "name", "type", "description", "status", "model_name", "created_at", "updated_at"],
    "description": "Agent 配置和状态信息"
  },
  "timestamp": "2024-03-14T10:00:00.000Z"
}
```

## 使用示例

### 1. 导出所有 Agent 数据（JSON 格式）

```bash
curl -X POST http://localhost:3000/api/export/agents \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 2. 导出运行中的 Agent（CSV 格式）

```bash
curl -X POST "http://localhost:3000/api/export/agents?format=csv" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": ["id", "name", "status", "model_name"],
    "filters": {
      "status": "running"
    }
  }'
```

### 3. 异步导出大量任务数据

```bash
curl -X POST "http://localhost:3000/api/export/tasks?async=true" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "status": "completed"
    },
    "options": {
      "limit": 10000
    }
  }'
```

### 4. 下载导出文件

```bash
curl -O http://localhost:3000/api/export/download/export_1710432000000_abc123
```

### 5. 查看导出历史

```bash
curl "http://localhost:3000/api/export/history?limit=20&offset=0"
```

### 6. 清理过期导出文件

```bash
curl -X POST http://localhost:3000/api/export/cleanup \
  -H "Content-Type: application/json" \
  -d '{
    "maxAge": 604800000
  }'
```

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| INVALID_FORMAT | 400 | 不支持的导出格式 |
| INVALID_TYPE | 400 | 未知的导出类型 |
| NOT_FOUND | 404 | 导出文件不存在 |
| PERMISSION_DENIED | 403 | 权限不足 |
| TIMEOUT | 504 | 导出超时 |
| EXPORT_ERROR | 500 | 导出操作失败 |

## 最佳实践

### 1. 大数据量导出

对于大量数据（>10000 条记录），建议使用异步导出：

```javascript
// 异步导出
const response = await fetch('/api/export/tasks?async=true', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    options: { batchSize: 1000, limit: 100000 }
  })
})

// 轮询状态或等待通知
const { exportId } = await response.json()
```

### 2. 自定义字段

只导出需要的字段可以减少文件大小和提高性能：

```javascript
const response = await fetch('/api/export/agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fields: ['id', 'name', 'status']
  })
})
```

### 3. 数据过滤

使用过滤条件减少导出数据量：

```javascript
const response = await fetch('/api/export/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filters: {
      status: 'completed',
      priority: 'high'
    },
    options: {
      orderBy: 'completed_at',
      orderDirection: 'DESC'
    }
  })
})
```

### 4. 定期清理

建议定期清理过期导出文件，避免占用过多存储空间：

```javascript
// 每天清理 7 天前的导出文件
await fetch('/api/export/cleanup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 天
  })
})
```

## 技术实现

### 后端文件结构

```
backend/
├── src/
│   ├── routes/
│   │   └── export.js          # 导出 API 路由
│   └── services/
│       └── exportService.js   # 导出服务
├── tests/
│   └── export.test.js         # 单元测试
└── docs/
    └── EXPORT-API.md          # API 文档
```

### 核心功能

1. **多格式支持**：
   - JSON：使用 `JSON.stringify` 序列化
   - CSV：自定义转换函数，处理特殊字符转义
   - XLSX：简化实现（CSV 兼容格式），可扩展使用 `exceljs` 库

2. **异步导出**：
   - 使用后台任务处理大数据量导出
   - 分批查询和写入，避免内存溢出
   - 元数据文件跟踪导出状态

3. **数据过滤**：
   - 支持 SQL WHERE 条件过滤
   - 支持 ORDER BY 排序
   - 支持 LIMIT/OFFSET 分页

4. **文件管理**：
   - 唯一导出 ID 生成
   - 元数据文件记录导出信息
   - 过期文件自动清理

## 扩展建议

### 1. 增强 XLSX 支持

安装 `exceljs` 库实现真正的 Excel 格式：

```bash
npm install exceljs
```

### 2. 添加更多导出类型

- Sessions: 会话数据
- Skills: 技能安装记录
- Alerts: 告警记录
- Metrics: 性能指标

### 3. 导出模板

支持预定义导出模板，方便常用导出场景：

```json
{
  "templates": {
    "agent-summary": {
      "type": "agents",
      "fields": ["id", "name", "status", "model_name"],
      "format": "csv"
    },
    "task-report": {
      "type": "tasks",
      "fields": ["task_id", "title", "status", "priority", "completed_at"],
      "format": "xlsx"
    }
  }
}
```

### 4. 导出通知

异步导出完成后发送通知：

- WebSocket 实时通知
- 邮件通知
- Webhook 回调

---

_最后更新：2024-03-14_
