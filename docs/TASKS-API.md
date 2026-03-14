# Tasks API 文档

任务列表与状态管理 API，支持任务查询、状态筛选、任务详情查看。

## 概述

Tasks API 集成 OpenClaw sessions API，提供对子 Agent 任务的统一管理接口。支持分页查询、状态过滤、Agent 过滤和统计信息获取。

## 基础信息

- **Base URL**: `/api/tasks`
- **认证**: 暂无（后续可添加）
- **数据格式**: JSON

## 端点列表

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/tasks` | 获取任务列表 |
| GET | `/api/tasks/:id` | 获取任务详情 |
| GET | `/api/tasks/stats` | 获取任务统计 |

---

## API 详情

### 1. GET /api/tasks

获取任务列表，支持分页、状态过滤和 Agent 过滤。

#### 请求参数

**Query Parameters**:

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | integer | 否 | 1 | 页码（从 1 开始） |
| `limit` | integer | 否 | 20 | 每页数量（1-500） |
| `status` | string | 否 | - | 状态过滤：`running`, `done`, `failed` |
| `agent` | string | 否 | - | Agent ID 过滤 |

#### 请求示例

```bash
# 获取默认任务列表
curl http://localhost:3000/api/tasks

# 分页查询
curl http://localhost:3000/api/tasks?page=2&limit=50

# 状态过滤
curl http://localhost:3000/api/tasks?status=running

# Agent 过滤
curl http://localhost:3000/api/tasks?agent=main

# 组合过滤
curl http://localhost:3000/api/tasks?page=1&limit=20&status=running&agent=main
```

#### 响应示例

**成功响应 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-123",
        "agentId": "main",
        "status": "running",
        "type": "subagent",
        "label": "T2.5-frontend",
        "createdAt": "2026-03-14T00:00:00Z",
        "updatedAt": "2026-03-14T00:05:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "status": "running",
      "agent": "main"
    }
  },
  "timestamp": "2026-03-14T00:10:00Z"
}
```

#### 错误响应

**无效状态 (400 Bad Request)**:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS",
    "message": "Invalid status: invalid. Valid statuses: running, done, failed"
  },
  "timestamp": "2026-03-14T00:10:00Z"
}
```

**无效分页参数 (400 Bad Request)**:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PAGE",
    "message": "Page must be a positive integer"
  },
  "timestamp": "2026-03-14T00:10:00Z"
}
```

**CLI 不可用 (503 Service Unavailable)**:

```json
{
  "success": false,
  "error": {
    "code": "CLI_UNAVAILABLE",
    "message": "OpenClaw CLI unavailable"
  },
  "timestamp": "2026-03-14T00:10:00Z"
}
```

---

### 2. GET /api/tasks/:id

获取指定任务的详细信息。

#### 请求参数

**Path Parameters**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 任务 ID |

#### 请求示例

```bash
curl http://localhost:3000/api/tasks/task-123
```

#### 响应示例

**成功响应 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "task-123",
    "agentId": "main",
    "status": "running",
    "type": "subagent",
    "label": "T2.5-frontend",
    "task": "实现前端界面...",
    "createdAt": "2026-03-14T00:00:00Z",
    "updatedAt": "2026-03-14T00:05:00Z",
    "stats": {
      "tokens": 50000,
      "runtime": 300
    }
  },
  "timestamp": "2026-03-14T00:10:00Z"
}
```

#### 错误响应

**任务未找到 (404 Not Found)**:

```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task not found: task-123",
    "taskId": "task-123"
  },
  "timestamp": "2026-03-14T00:10:00Z"
}
```

---

### 3. GET /api/tasks/stats

获取任务统计信息，包括总数、按状态分布、按 Agent 分布。

#### 请求参数

无

#### 请求示例

```bash
curl http://localhost:3000/api/tasks/stats
```

#### 响应示例

**成功响应 (200 OK)**:

```json
{
  "success": true,
  "data": {
    "total": 100,
    "byStatus": {
      "running": 5,
      "done": 80,
      "failed": 15
    },
    "byAgent": {
      "main": 50,
      "coder": 30,
      "product_manager": 20
    }
  },
  "timestamp": "2026-03-14T00:10:00Z"
}
```

---

## 数据模型

### Task 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 任务唯一标识 |
| `agentId` | string | 执行任务的 Agent ID |
| `status` | string | 任务状态：`running`, `done`, `failed` |
| `type` | string | 任务类型：`subagent`, `cron`, `manual` |
| `label` | string | 任务标签/名称 |
| `task` | string | 任务描述（可选） |
| `createdAt` | string | 创建时间（ISO 8601） |
| `updatedAt` | string | 更新时间（ISO 8601） |
| `stats` | object | 任务统计（可选） |

### Task Stats 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| `tokens` | integer | 消耗的 token 数量 |
| `runtime` | integer | 运行时间（秒） |

### Pagination 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | integer | 当前页码 |
| `limit` | integer | 每页数量 |
| `total` | integer | 总记录数 |
| `totalPages` | integer | 总页数 |
| `hasNext` | boolean | 是否有下一页 |
| `hasPrev` | boolean | 是否有上一页 |

### Task Statistics 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| `total` | integer | 任务总数 |
| `byStatus` | object | 按状态统计 |
| `byStatus.running` | integer | 运行中任务数 |
| `byStatus.done` | integer | 已完成任务数 |
| `byStatus.failed` | integer | 失败任务数 |
| `byAgent` | object | 按 Agent 统计 |

---

## 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 资源未找到 |
| 503 | OpenClaw CLI 不可用 |
| 500 | 服务器内部错误 |

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| `INVALID_STATUS` | 无效的状态参数 |
| `INVALID_PAGE` | 无效的页码参数 |
| `INVALID_LIMIT` | 无效的每页数量参数 |
| `TASK_NOT_FOUND` | 任务未找到 |
| `TASK_ID_REQUIRED` | 任务 ID 必需 |
| `CLI_UNAVAILABLE` | OpenClaw CLI 不可用 |
| `UNKNOWN_ERROR` | 未知错误 |

---

## 集成说明

### OpenClaw Sessions API 集成

Tasks API 通过 OpenClaw CLI 的 `sessions` 命令获取任务数据：

```bash
openclaw sessions --json
```

Session 状态会自动映射到任务状态：

| Session 状态 | 任务状态 |
|-------------|---------|
| `active`, `running`, `idle` | `running` |
| `completed`, `done`, `finished` | `done` |
| `error`, `failed`, `killed` | `failed` |

### 降级处理

当 OpenClaw CLI 不可用时，API 会返回空列表或空统计，并附带 `note` 字段说明原因，确保前端应用不会崩溃。

---

## 使用示例

### 前端集成示例（JavaScript）

```javascript
// 获取任务列表
async function fetchTasks(page = 1, limit = 20, status, agent) {
  const params = new URLSearchParams({ page, limit })
  if (status) params.append('status', status)
  if (agent) params.append('agent', agent)
  
  const response = await fetch(`/api/tasks?${params}`)
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error.message)
  }
  
  return result.data
}

// 获取任务详情
async function fetchTaskDetails(taskId) {
  const response = await fetch(`/api/tasks/${taskId}`)
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error.message)
  }
  
  return result.data
}

// 获取任务统计
async function fetchTaskStats() {
  const response = await fetch('/api/tasks/stats')
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error.message)
  }
  
  return result.data
}
```

### 监控面板示例

```javascript
// 实时更新任务统计
async function updateDashboard() {
  try {
    const stats = await fetchTaskStats()
    
    document.getElementById('total-tasks').textContent = stats.total
    document.getElementById('running-tasks').textContent = stats.byStatus.running
    document.getElementById('done-tasks').textContent = stats.byStatus.done
    document.getElementById('failed-tasks').textContent = stats.byStatus.failed
    
    // 更新 Agent 分布图表
    updateAgentChart(stats.byAgent)
  } catch (error) {
    console.error('Failed to update dashboard:', error)
  }
}
```

---

## 测试

运行单元测试：

```bash
cd /home/admin/openclaw-dashboard/backend
npm test -- tests/tasks.test.js
```

测试覆盖率：

```bash
npm run test:coverage -- tests/tasks.test.js
```

---

## 更新日志

### v0.1.0 (2026-03-14)

- 初始版本
- 实现任务列表查询（支持分页、状态过滤、Agent 过滤）
- 实现任务详情查询
- 实现任务统计
- 集成 OpenClaw sessions API
- 添加单元测试
- 添加错误处理和降级机制

---

## 相关文件

- 路由实现：`backend/src/routes/tasks.js`
- 服务实现：`backend/src/services/taskService.js`
- 单元测试：`backend/tests/tasks.test.js`
- 参考路由：`backend/src/routes/agents.js`
- 参考路由：`backend/src/routes/logs.js`
- CLI 适配器：`backend/src/cli-adapter/commands.js`
