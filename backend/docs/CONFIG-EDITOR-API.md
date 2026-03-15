# Config Editor API 文档

## 概述

Config Editor API 提供 Agent 配置文件的管理功能，支持配置读取、编辑、保存、验证和历史记录管理。

**基础路径**: `/api/config`

## 认证

所有端点都需要 Bearer Token 认证（如果启用了认证中间件）。

```
Authorization: Bearer <your-token>
```

## 端点列表

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/:agentId` | 读取指定 Agent 的配置 |
| PUT | `/:agentId` | 保存指定 Agent 的配置 |
| POST | `/:agentId/validate` | 验证 Agent 配置 |
| GET | `/:agentId/history` | 获取配置历史记录 |
| POST | `/:agentId/history/:filename/restore` | 从历史记录恢复配置 |

---

## 1. GET /api/config/:agentId

读取指定 Agent 的配置文件。

### 请求

**路径参数**:
- `agentId` (string): Agent ID，只能包含字母、数字、连字符和下划线（2-50 字符）

### 响应

**成功 (200)**:
```json
{
  "success": true,
  "data": {
    "agentId": "my-agent",
    "config": {
      "agent": {
        "name": "my-agent",
        "model": "qwen3.5-plus",
        "tools": ["exec", "read", "write"],
        "workspace": "/home/admin/.openclaw/workspace",
        "createdAt": "2026-03-14T01:38:00.000Z",
        "version": "1.0.0"
      },
      "metadata": {
        "createdBy": "openclaw-dashboard",
        "createdAt": "2026-03-14T01:38:00.000Z",
        "format": "yaml"
      }
    },
    "format": "yaml",
    "path": "/home/admin/.openclaw/workspace/agents/my-agent/my-agent-config.yaml"
  },
  "timestamp": "2026-03-14T02:00:00.000Z"
}
```

**失败 (404)**:
```json
{
  "success": false,
  "error": {
    "message": "Agent 配置不存在",
    "code": "CONFIG_NOT_FOUND",
    "agentId": "non-existent"
  },
  "timestamp": "2026-03-14T02:00:00.000Z"
}
```

**失败 (400)**:
```json
{
  "success": false,
  "error": {
    "message": "无效的 Agent ID 格式",
    "code": "INVALID_AGENT_ID",
    "agentId": "invalid@id",
    "details": {
      "hint": "Agent ID 只能包含字母、数字、连字符和下划线（2-50 字符）"
    }
  },
  "timestamp": "2026-03-14T02:00:00.000Z"
}
```

### 错误码

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 200 | - | 读取成功 |
| 400 | INVALID_AGENT_ID | Agent ID 格式无效 |
| 404 | CONFIG_NOT_FOUND | 配置不存在 |
| 500 | IO_ERROR | 文件系统读取失败 |
| 500 | PARSE_ERROR | 配置文件解析失败 |

---

## 2. PUT /api/config/:agentId

保存指定 Agent 的配置。

### 请求

**路径参数**:
- `agentId` (string): Agent ID

**查询参数**:
- `format` (string, 可选): 配置文件格式，`yaml`（默认）或 `json`

**Body**:
```json
{
  "agent": {
    "name": "my-agent",
    "model": "qwen3.5-plus",
    "tools": ["exec", "read", "write"],
    "workspace": "/home/admin/.openclaw/workspace",
    "createdAt": "2026-03-14T01:38:00.000Z",
    "version": "1.0.0"
  },
  "metadata": {
    "createdBy": "openclaw-dashboard",
    "createdAt": "2026-03-14T02:00:00.000Z",
    "format": "yaml"
  }
}
```

### 参数说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `agent.name` | string | ✅ | Agent 名称，必须与路径中的 agentId 一致 |
| `agent.model` | string | ✅ | 模型名称 |
| `agent.tools` | string[] | ✅ | 工具列表 |
| `agent.workspace` | string | ✅ | 工作目录（绝对路径） |
| `agent.createdAt` | string | ❌ | 创建时间 |
| `agent.version` | string | ❌ | 配置版本 |
| `metadata.createdBy` | string | ❌ | 创建者 |
| `metadata.createdAt` | string | ❌ | 创建时间 |
| `metadata.format` | string | ❌ | 配置文件格式 |

### 响应

**成功 (200)**:
```json
{
  "success": true,
  "data": {
    "agentId": "my-agent",
    "path": "/home/admin/.openclaw/workspace/agents/my-agent/my-agent-config.yaml",
    "format": "yaml",
    "config": {
      "agent": {
        "name": "my-agent",
        "model": "qwen3.5-plus",
        "tools": ["exec", "read", "write"],
        "workspace": "/home/admin/.openclaw/workspace"
      },
      "metadata": {
        "createdBy": "openclaw-dashboard",
        "createdAt": "2026-03-14T02:00:00.000Z"
      }
    }
  },
  "warnings": [],
  "timestamp": "2026-03-14T02:00:00.000Z"
}
```

**成功但有警告 (200)**:
```json
{
  "success": true,
  "data": {
    "agentId": "my-agent",
    "path": "/home/admin/.openclaw/workspace/agents/my-agent/my-agent-config.yaml",
    "format": "yaml",
    "config": { ... }
  },
  "warnings": [
    "缺少 metadata 字段（可选）"
  ],
  "timestamp": "2026-03-14T02:00:00.000Z"
}
```

**失败 (400)**:
```json
{
  "success": false,
  "error": {
    "message": "配置验证失败",
    "code": "VALIDATION_ERROR",
    "details": {
      "details": [
        "缺少必要字段：agent.model",
        "agent.workspace 必须是绝对路径"
      ]
    }
  },
  "timestamp": "2026-03-14T02:00:00.000Z"
}
```

### 错误码

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 200 | - | 保存成功 |
| 400 | INVALID_AGENT_ID | Agent ID 格式无效 |
| 400 | INVALID_CONFIG | 配置格式无效 |
| 400 | VALIDATION_ERROR | 配置验证失败 |
| 500 | IO_ERROR | 文件系统写入失败 |
| 500 | SERIALIZE_ERROR | 配置文件序列化失败 |

---

## 3. POST /api/config/:agentId/validate

验证 Agent 配置，不实际保存，仅用于前端表单验证。

### 请求

**路径参数**:
- `agentId` (string): Agent ID

**Body**:
```json
{
  "agent": {
    "name": "my-agent",
    "model": "qwen3.5-plus",
    "tools": ["exec", "read", "write"],
    "workspace": "/home/admin/.openclaw/workspace"
  },
  "metadata": {
    "createdBy": "openclaw-dashboard"
  }
}
```

### 响应

**验证通过 (200)**:
```json
{
  "success": true,
  "data": {
    "agentId": "my-agent",
    "valid": true,
    "config": {
      "agent": {
        "name": "my-agent",
        "model": "qwen3.5-plus",
        "tools": ["exec", "read", "write"],
        "workspace": "/home/admin/.openclaw/workspace"
      }
    }
  },
  "errors": [],
  "warnings": [],
  "timestamp": "2026-03-14T02:00:00.000Z"
}
```

**验证失败 (400)**:
```json
{
  "success": false,
  "error": {
    "message": "配置验证失败",
    "code": "VALIDATION_ERROR"
  },
  "errors": [
    "缺少必要字段：agent.model",
    "agent.workspace 必须是绝对路径"
  ],
  "warnings": [],
  "timestamp": "2026-03-14T02:00:00.000Z"
}
```

### 验证规则

| 字段 | 规则 |
|------|------|
| `agent.name` | 必填，2-50 字符，只能包含字母、数字、连字符和下划线 |
| `agent.model` | 必填，字符串 |
| `agent.tools` | 必填，非空数组 |
| `agent.workspace` | 必填，必须是绝对路径 |
| `metadata` | 可选，缺少时仅产生警告 |

### 错误码

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 200 | - | 验证通过 |
| 400 | - | 验证失败（errors 数组包含具体错误） |

---

## 4. GET /api/config/:agentId/history

获取 Agent 配置的历史记录。

### 请求

**路径参数**:
- `agentId` (string): Agent ID

**查询参数**:
- `limit` (number, 可选): 返回记录数量限制，默认 20

### 响应

**成功 (200)**:
```json
{
  "success": true,
  "data": {
    "agentId": "my-agent",
    "history": [
      {
        "filename": "2026-03-14T02-00-00-000Z-update.json",
        "timestamp": "2026-03-14T02:00:00.000Z",
        "operation": "update",
        "config": {
          "agent": {
            "name": "my-agent",
            "model": "qwen3.5-plus",
            "tools": ["exec", "read"],
            "workspace": "/home/admin/.openclaw/workspace"
          }
        }
      },
      {
        "filename": "2026-03-14T01-38-00-000Z-create.json",
        "timestamp": "2026-03-14T01:38:00.000Z",
        "operation": "create",
        "config": {
          "agent": {
            "name": "my-agent",
            "model": "qwen3.5-plus",
            "tools": ["exec"],
            "workspace": "/home/admin/.openclaw/workspace"
          }
        }
      }
    ],
    "count": 2
  },
  "timestamp": "2026-03-14T02:05:00.000Z"
}
```

**空历史记录 (200)**:
```json
{
  "success": true,
  "data": {
    "agentId": "my-agent",
    "history": [],
    "count": 0
  },
  "timestamp": "2026-03-14T02:05:00.000Z"
}
```

### 操作类型

| 操作 | 说明 |
|------|------|
| `create` | 初始创建配置 |
| `update` | 更新现有配置 |
| `delete` | 删除配置（保留历史） |

### 错误码

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 200 | - | 查询成功 |
| 400 | INVALID_AGENT_ID | Agent ID 格式无效 |
| 500 | IO_ERROR | 文件系统读取失败 |

---

## 5. POST /api/config/:agentId/history/:filename/restore

从历史记录恢复配置到指定版本。

### 请求

**路径参数**:
- `agentId` (string): Agent ID
- `filename` (string): 历史记录文件名（从 history 接口获取）

### 响应

**成功 (200)**:
```json
{
  "success": true,
  "data": {
    "agentId": "my-agent",
    "restoredFrom": "2026-03-14T01-38-00-000Z-create.json",
    "timestamp": "2026-03-14T01:38:00.000Z",
    "config": {
      "agent": {
        "name": "my-agent",
        "model": "qwen3.5-plus",
        "tools": ["exec"],
        "workspace": "/home/admin/.openclaw/workspace"
      }
    }
  },
  "timestamp": "2026-03-14T02:10:00.000Z"
}
```

**失败 (404)**:
```json
{
  "success": false,
  "error": {
    "message": "历史记录文件不存在",
    "code": "HISTORY_FILE_NOT_FOUND",
    "agentId": "my-agent",
    "filename": "non-existent.json"
  },
  "timestamp": "2026-03-14T02:10:00.000Z"
}
```

### 注意事项

1. 恢复操作会自动保存当前配置到历史记录（作为回滚点）
2. 恢复后的配置会覆盖当前配置
3. 恢复操作本身不会产生新的历史记录条目（避免循环）

### 错误码

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 200 | - | 恢复成功 |
| 400 | INVALID_AGENT_ID | Agent ID 格式无效 |
| 400 | INVALID_HISTORY_FILE | 历史记录文件名无效 |
| 404 | HISTORY_FILE_NOT_FOUND | 历史记录文件不存在 |
| 500 | IO_ERROR | 文件系统操作失败 |

---

## 配置文件格式

### YAML 格式（默认）

```yaml
# Agent Configuration - my-agent
# Generated at: 2026-03-14T02:00:00.000Z

agent:
  name: my-agent
  model: qwen3.5-plus
  tools:
    - exec
    - read
    - write
  workspace: /home/admin/.openclaw/workspace
  createdAt: 2026-03-14T01:38:00.000Z
  version: "1.0.0"

metadata:
  createdBy: openclaw-dashboard
  createdAt: 2026-03-14T02:00:00.000Z
  format: yaml
```

### JSON 格式

```json
{
  "agent": {
    "name": "my-agent",
    "model": "qwen3.5-plus",
    "tools": ["exec", "read", "write"],
    "workspace": "/home/admin/.openclaw/workspace",
    "createdAt": "2026-03-14T01:38:00.000Z",
    "version": "1.0.0"
  },
  "metadata": {
    "createdBy": "openclaw-dashboard",
    "createdAt": "2026-03-14T02:00:00.000Z",
    "format": "json"
  }
}
```

---

## 使用示例

### 使用 Node.js (fetch)

```javascript
// 读取配置
const response = await fetch('/api/config/my-agent')
const result = await response.json()
console.log(result.data.config)

// 保存配置
const saveResponse = await fetch('/api/config/my-agent', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    agent: {
      name: 'my-agent',
      model: 'qwen3.5-plus',
      tools: ['exec', 'read', 'write'],
      workspace: '/home/admin/workspace',
    },
    metadata: {
      createdBy: 'openclaw-dashboard',
    },
  }),
})
const saveResult = await saveResponse.json()
console.log(saveResult)

// 验证配置
const validateResponse = await fetch('/api/config/my-agent/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    agent: {
      name: 'my-agent',
      model: 'qwen3.5-plus',
      tools: ['exec', 'read'],
      workspace: '/home/admin/workspace',
    },
  }),
})
const validation = await validateResponse.json()
console.log(validation)

// 获取历史记录
const historyResponse = await fetch('/api/config/my-agent/history?limit=10')
const history = await historyResponse.json()
console.log(history.data.history)

// 恢复配置
const restoreResponse = await fetch('/api/config/my-agent/history/2026-03-14T01-38-00-000Z-create.json/restore', {
  method: 'POST',
})
const restoreResult = await restoreResponse.json()
console.log(restoreResult)
```

### 使用 cURL

```bash
# 读取配置
curl http://localhost:3000/api/config/my-agent

# 保存配置
curl -X PUT http://localhost:3000/api/config/my-agent \
  -H "Content-Type: application/json" \
  -d '{
    "agent": {
      "name": "my-agent",
      "model": "qwen3.5-plus",
      "tools": ["exec", "read", "write"],
      "workspace": "/home/admin/workspace"
    }
  }'

# 保存为 JSON 格式
curl -X PUT "http://localhost:3000/api/config/my-agent?format=json" \
  -H "Content-Type: application/json" \
  -d '{ ... }'

# 验证配置
curl -X POST http://localhost:3000/api/config/my-agent/validate \
  -H "Content-Type: application/json" \
  -d '{
    "agent": {
      "name": "my-agent",
      "model": "qwen3.5-plus",
      "tools": ["exec", "read"],
      "workspace": "/home/admin/workspace"
    }
  }'

# 获取历史记录
curl "http://localhost:3000/api/config/my-agent/history?limit=10"

# 恢复配置
curl -X POST http://localhost:3000/api/config/my-agent/history/2026-03-14T01-38-00-000Z-create.json/restore
```

---

## 错误处理

所有错误响应遵循统一格式：

```json
{
  "success": false,
  "error": {
    "message": "错误描述",
    "code": "错误码",
    "details": {
      // 详细错误信息（开发模式下包含 stack）
    },
    "agentId": "相关 Agent ID（如果有）"
  },
  "timestamp": "2026-03-14T02:00:00.000Z"
}
```

### 常见错误

| 错误信息 | 错误码 | 原因 | 解决方案 |
|----------|--------|------|----------|
| 无效的 Agent ID 格式 | INVALID_AGENT_ID | Agent ID 包含特殊字符或长度不符 | 使用 2-50 字符的字母、数字、连字符、下划线 |
| Agent 配置不存在 | CONFIG_NOT_FOUND | 指定 Agent 的配置文件不存在 | 先创建配置或检查 agentId |
| 配置验证失败 | VALIDATION_ERROR | 配置缺少必要字段或格式错误 | 检查 errors 数组中的详细错误 |
| 无效的配置格式 | INVALID_CONFIG | 配置不是有效的对象 | 提供有效的 JSON 对象 |
| 配置文件解析失败 | PARSE_ERROR | 配置文件内容格式错误 | 检查配置文件语法 |
| 文件系统操作失败 | IO_ERROR | 磁盘空间不足或权限问题 | 检查文件系统状态和权限 |
| 历史记录文件不存在 | HISTORY_FILE_NOT_FOUND | 指定的历史文件不存在 | 从 history 接口获取正确的文件名 |

---

## 技术实现

### 文件结构

```
backend/
├── src/
│   ├── routes/
│   │   └── config-editor.js       # API 路由
│   └── services/
│       └── configEditorService.js # 业务逻辑
└── tests/
    └── config-editor.test.js      # 单元测试
```

### 依赖

- Express.js - Web 框架
- Node.js fs/promises - 异步文件系统操作
- Node.js path - 路径处理

### 安全考虑

1. **Agent ID 验证**: 严格的命名规则，防止路径遍历攻击
2. **路径规范化**: 使用 path 模块处理所有路径，防止目录遍历
3. **配置验证**: 保存前验证配置结构，防止无效数据
4. **历史记录**: 自动保存变更历史，支持回滚

### 数据存储

- **配置文件**: `/home/admin/.openclaw/workspace/agents/:agentId/:agentId-config.yaml`
- **历史记录**: `/home/admin/.openclaw/workspace/.config-history/:agentId/:timestamp-:operation.json`

---

## 更新日志

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-03-14 | 初始版本，支持配置 CRUD 和历史记录 |

---

## 联系方式

如有问题或建议，请联系 OpenClaw Dashboard 开发团队。
