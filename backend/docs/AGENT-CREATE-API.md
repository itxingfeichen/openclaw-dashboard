# Agent Create API 文档

## 概述

Agent Create API 提供基础 Agent 创建功能，支持简化版 Agent 创建表单、配置文件生成、模板管理和配置验证。

**基础路径**: `/api/agents`

## 认证

所有端点都需要 Bearer Token 认证（如果启用了认证中间件）。

```
Authorization: Bearer <your-token>
```

## 端点列表

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/create` | 创建新 Agent |
| GET | `/templates` | 获取 Agent 模板列表 |
| GET | `/templates/:id` | 获取指定 Agent 模板 |
| POST | `/validate` | 验证 Agent 配置 |

---

## 1. POST /api/agents/create

创建新 Agent，自动生成配置文件并集成 OpenClaw CLI。

### 请求

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "name": "my-agent",
  "model": "qwen3.5-plus",
  "tools": ["exec", "read", "write"],
  "workspace": "/path/to/workspace",
  "generateConfigFile": true,
  "configFormat": "yaml"
}
```

### 参数说明

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `name` | string | ✅ | - | Agent 名称，2-50 字符，仅允许字母、数字、连字符和下划线 |
| `model` | string | ✅ | - | 模型名称，见下方模型列表 |
| `tools` | string[] | ✅ | - | 工具列表，见下方工具列表 |
| `workspace` | string | ✅ | - | 工作目录，必须是绝对路径 |
| `generateConfigFile` | boolean | ❌ | `true` | 是否生成配置文件 |
| `configFormat` | string | ❌ | `"yaml"` | 配置文件格式：`yaml` 或 `json` |

### 可用模型

```javascript
{
  "QWEN_3_5_PLUS": "qwen3.5-plus",
  "QWEN_3_PLUS": "qwen3-plus",
  "QWEN_2_5_PLUS": "qwen2.5-plus",
  "LLAMA_3_1_70B": "llama-3.1-70b",
  "LLAMA_3_1_8B": "llama-3.1-8b",
  "GPT_4O": "gpt-4o",
  "GPT_4O_MINI": "gpt-4o-mini",
  "CLAUDE_3_5_SONNET": "claude-3.5-sonnet",
  "CLAUDE_3_HAIKU": "claude-3-haiku"
}
```

### 可用工具

```javascript
[
  "exec", "read", "write", "edit",
  "web_search", "web_fetch", "browser",
  "message", "subagents", "image",
  "pdf", "tts", "canvas", "nodes", "process"
]
```

### 响应

**成功 (201)**:
```json
{
  "success": true,
  "data": {
    "id": "my-agent",
    "name": "my-agent",
    "model": "qwen3.5-plus",
    "tools": ["exec", "read", "write"],
    "workspace": "/path/to/workspace",
    "status": "created",
    "createdAt": "2026-03-14T01:38:00.000Z",
    "configFile": {
      "path": "/path/to/workspace/agents/my-agent/my-agent-config.yaml",
      "format": "yaml",
      "config": {
        "agent": {
          "name": "my-agent",
          "model": "qwen3.5-plus",
          "tools": ["exec", "read", "write"],
          "workspace": "/path/to/workspace",
          "createdAt": "2026-03-14T01:38:00.000Z",
          "version": "1.0.0"
        },
        "metadata": {
          "createdBy": "openclaw-dashboard",
          "createdAt": "2026-03-14T01:38:00.000Z",
          "format": "yaml"
        }
      }
    }
  },
  "timestamp": "2026-03-14T01:38:00.000Z"
}
```

**失败 (400/500)**:
```json
{
  "success": false,
  "error": {
    "message": "Agent 配置验证失败",
    "details": [
      "Agent 名称只能包含字母、数字、连字符和下划线"
    ]
  },
  "timestamp": "2026-03-14T01:38:00.000Z"
}
```

### 错误码

| 状态码 | 说明 |
|--------|------|
| 201 | 创建成功 |
| 400 | 请求参数验证失败 |
| 500 | 内部服务器错误 |
| 502 | CLI 命令执行失败 |

---

## 2. GET /api/agents/templates

获取 Agent 模板列表，用于快速创建预配置 Agent。

### 请求

无需请求体。

### 响应

**成功 (200)**:
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "default",
        "name": "默认 Agent",
        "description": "基础 Agent 配置，包含常用工具",
        "model": "qwen3.5-plus",
        "tools": ["exec", "read", "write", "web_search"],
        "workspace": "/home/admin/.openclaw/workspace"
      },
      {
        "id": "coder",
        "name": "代码开发 Agent",
        "description": "专注于代码开发和技术实现",
        "model": "qwen3.5-plus",
        "tools": ["exec", "read", "write", "edit", "web_search", "web_fetch"],
        "workspace": "/home/admin/.openclaw/workspace/projects"
      },
      {
        "id": "product-manager",
        "name": "产品经理 Agent",
        "description": "专注于产品需求和 PRD 文档",
        "model": "qwen3.5-plus",
        "tools": ["read", "write", "web_search", "message"],
        "workspace": "/home/admin/.openclaw/workspace/products"
      },
      {
        "id": "researcher",
        "name": "研究分析 Agent",
        "description": "专注于信息收集和分析",
        "model": "qwen3.5-plus",
        "tools": ["web_search", "web_fetch", "read", "write", "pdf"],
        "workspace": "/home/admin/.openclaw/workspace/research"
      }
    ],
    "count": 4
  },
  "timestamp": "2026-03-14T01:38:00.000Z"
}
```

---

## 3. GET /api/agents/templates/:id

获取指定 Agent 模板的详细信息。

### 请求

**路径参数**:
- `id` (string): 模板 ID

### 响应

**成功 (200)**:
```json
{
  "success": true,
  "data": {
    "id": "coder",
    "name": "代码开发 Agent",
    "description": "专注于代码开发和技术实现",
    "model": "qwen3.5-plus",
    "tools": ["exec", "read", "write", "edit", "web_search", "web_fetch"],
    "workspace": "/home/admin/.openclaw/workspace/projects"
  },
  "timestamp": "2026-03-14T01:38:00.000Z"
}
```

**失败 (404)**:
```json
{
  "success": false,
  "error": {
    "message": "模板不存在",
    "templateId": "non-existent"
  },
  "timestamp": "2026-03-14T01:38:00.000Z"
}
```

---

## 4. POST /api/agents/validate

验证 Agent 配置，不实际创建 Agent，仅用于前端表单验证。

### 请求

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "name": "my-agent",
  "model": "qwen3.5-plus",
  "tools": ["exec", "read", "write"],
  "workspace": "/path/to/workspace"
}
```

### 响应

**验证通过 (200)**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "config": {
      "name": "my-agent",
      "model": "qwen3.5-plus",
      "tools": ["exec", "read", "write"],
      "workspace": "/path/to/workspace"
    }
  },
  "timestamp": "2026-03-14T01:38:00.000Z"
}
```

**验证失败 (400)**:
```json
{
  "success": false,
  "error": {
    "message": "Agent 配置验证失败",
    "details": [
      "Agent 名称只能包含字母、数字、连字符和下划线",
      "无效的模型名称。有效值：qwen3.5-plus, qwen3-plus, ..."
    ]
  },
  "timestamp": "2026-03-14T01:38:00.000Z"
}
```

---

## 配置文件格式

### YAML 格式

```yaml
# Agent Configuration - my-agent
# Generated at: 2026-03-14T01:38:00.000Z

agent:
  name: my-agent
  model: qwen3.5-plus
  tools:
    - exec
    - read
    - write
  workspace: /path/to/workspace
  createdAt: 2026-03-14T01:38:00.000Z
  version: "1.0.0"

metadata:
  createdBy: openclaw-dashboard
  createdAt: 2026-03-14T01:38:00.000Z
  format: yaml
```

### JSON 格式

```json
{
  "agent": {
    "name": "my-agent",
    "model": "qwen3.5-plus",
    "tools": ["exec", "read", "write"],
    "workspace": "/path/to/workspace",
    "createdAt": "2026-03-14T01:38:00.000Z",
    "version": "1.0.0"
  },
  "metadata": {
    "createdBy": "openclaw-dashboard",
    "createdAt": "2026-03-14T01:38:00.000Z",
    "format": "json"
  }
}
```

---

## 使用示例

### 使用 Node.js (fetch)

```javascript
// 创建 Agent
const response = await fetch('/api/agents/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'my-agent',
    model: 'qwen3.5-plus',
    tools: ['exec', 'read', 'write'],
    workspace: '/home/admin/workspace',
  }),
})

const result = await response.json()
console.log(result)

// 获取模板列表
const templatesResponse = await fetch('/api/agents/templates')
const templates = await templatesResponse.json()
console.log(templates)

// 验证配置
const validateResponse = await fetch('/api/agents/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'my-agent',
    model: 'qwen3.5-plus',
    tools: ['exec', 'read'],
    workspace: '/home/admin/workspace',
  }),
})

const validation = await validateResponse.json()
console.log(validation)
```

### 使用 cURL

```bash
# 创建 Agent
curl -X POST http://localhost:3000/api/agents/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-agent",
    "model": "qwen3.5-plus",
    "tools": ["exec", "read", "write"],
    "workspace": "/home/admin/workspace"
  }'

# 获取模板列表
curl http://localhost:3000/api/agents/templates

# 获取指定模板
curl http://localhost:3000/api/agents/templates/coder

# 验证配置
curl -X POST http://localhost:3000/api/agents/validate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-agent",
    "model": "qwen3.5-plus",
    "tools": ["exec", "read"],
    "workspace": "/home/admin/workspace"
  }'
```

---

## 错误处理

所有错误响应遵循统一格式：

```json
{
  "success": false,
  "error": {
    "message": "错误描述",
    "details": ["详细错误信息数组"],
    "agentId": "相关 Agent ID（如果有）"
  },
  "timestamp": "2026-03-14T01:38:00.000Z"
}
```

### 常见错误

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| Agent 名称不能为空 | name 字段缺失或为空 | 提供有效的 name |
| Agent 名称长度必须在 2-50 个字符之间 | name 太短或太长 | 调整名称长度 |
| Agent 名称只能包含字母、数字、连字符和下划线 | name 包含特殊字符 | 只使用 a-z, A-Z, 0-9, -, _ |
| 无效的模型名称 | model 不在可用列表中 | 使用有效的模型名称 |
| 至少需要选择一个工具 | tools 数组为空 | 添加至少一个工具 |
| 无效的工具 | tools 包含不可用工具 | 使用 AvailableTools 列表中的工具 |
| 工作目录必须是绝对路径 | workspace 不是绝对路径 | 使用完整路径如 /home/admin/workspace |
| 工作目录路径包含非法字符 | workspace 包含 .. 或 ~ | 移除危险字符 |

---

## 技术实现

### 文件结构

```
backend/
├── src/
│   ├── routes/
│   │   └── agent-create.js       # API 路由
│   └── services/
│       └── agentCreateService.js # 业务逻辑
└── tests/
    └── agent-create.test.js      # 单元测试
```

### 依赖

- Express.js - Web 框架
- OpenClaw CLI - Agent 管理
- Node.js fs/path - 文件系统操作

### 安全考虑

1. **路径遍历防护**: 验证 workspace 路径，禁止 `..` 和 `~`
2. **名称验证**: 严格的命名规则，防止注入攻击
3. **工具白名单**: 只允许预定义的工具列表
4. **模型白名单**: 只允许配置的模型

---

## 更新日志

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-03-14 | 初始版本，支持基础 Agent 创建 |

---

## 联系方式

如有问题或建议，请联系 OpenClaw Dashboard 开发团队。
