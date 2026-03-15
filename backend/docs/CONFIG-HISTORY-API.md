# Config History API 文档

配置版本历史管理 API，支持 Git 集成、版本对比、回滚功能。

## 概述

Config History API 提供 Agent 配置文件的版本控制能力，基于 Git 实现版本管理，支持：

- 📜 查看配置版本历史
- 🔍 获取特定版本详情
- ↔️ 版本对比
- ⏮️ 回滚到历史版本
- 💾 提交配置变更

## 基础信息

- **Base URL**: `/api/config`
- **认证**: 需要（根据项目配置）
- **数据格式**: JSON

## 数据模型

### Version（版本）

```json
{
  "versionId": "abc123def456...",
  "shortHash": "abc123d",
  "message": "Update agent config",
  "author": "admin",
  "authorEmail": "admin@example.com",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "changedFiles": []
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| versionId | string | 完整 Git commit hash |
| shortHash | string | 短 commit hash（7 位） |
| message | string | 提交信息 |
| author | string | 作者名称 |
| authorEmail | string | 作者邮箱 |
| timestamp | string | 提交时间（ISO 8601） |
| changedFiles | array | 变更文件列表 |

### VersionDetail（版本详情）

```json
{
  "versionId": "abc123def456...",
  "shortHash": "abc123d",
  "agentId": "my-agent",
  "config": {
    "agent": {
      "name": "my-agent",
      "model": "qwen3.5-plus",
      "tools": ["exec", "read"],
      "workspace": "/path/to/workspace"
    },
    "metadata": {}
  },
  "format": "yaml",
  "message": "Update agent config",
  "author": "admin",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### ConfigDiff（配置差异）

```json
{
  "agentId": "my-agent",
  "version1": {
    "versionId": "abc123...",
    "shortHash": "abc123d",
    "config": { ... }
  },
  "version2": {
    "versionId": "def456...",
    "shortHash": "def456d",
    "config": { ... }
  },
  "diff": {
    "raw": "diff --git a/... ",
    "changes": [
      {
        "path": "agent.tools",
        "type": "modified",
        "oldValue": ["exec", "read"],
        "newValue": ["exec", "read", "write"]
      }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| path | string | 变更的配置路径 |
| type | string | 变更类型：`added` / `removed` / `modified` |
| oldValue | any | 旧值 |
| newValue | any | 新值 |

---

## API 端点

### 1. 获取版本列表

获取指定 Agent 的配置版本历史。

**请求**

```
GET /api/config/:agentId/versions
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentId | string | 是 | Agent ID |

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | integer | 否 | 返回记录数量限制（默认：20） |

**响应示例**

```json
{
  "success": true,
  "data": {
    "agentId": "my-agent",
    "versions": [
      {
        "versionId": "abc123def456...",
        "shortHash": "abc123d",
        "message": "Update agent config",
        "author": "admin",
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ],
    "count": 1
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

**错误响应**

```json
{
  "success": false,
  "error": {
    "message": "无效的 Agent ID 格式",
    "code": "INVALID_AGENT_ID",
    "details": {
      "agentId": "invalid@id",
      "hint": "Agent ID 只能包含字母、数字、连字符和下划线（2-50 字符）"
    }
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

---

### 2. 获取版本详情

获取指定版本的配置详情。

**请求**

```
GET /api/config/:agentId/versions/:versionId
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentId | string | 是 | Agent ID |
| versionId | string | 是 | Git commit hash |

**响应示例**

```json
{
  "success": true,
  "data": {
    "versionId": "abc123def456...",
    "shortHash": "abc123d",
    "agentId": "my-agent",
    "config": {
      "agent": {
        "name": "my-agent",
        "model": "qwen3.5-plus",
        "tools": ["exec", "read"],
        "workspace": "/path/to/workspace"
      }
    },
    "format": "yaml",
    "message": "Update agent config",
    "author": "admin",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

**错误响应**

```json
{
  "success": false,
  "error": {
    "message": "版本不存在",
    "code": "VERSION_NOT_FOUND",
    "details": {
      "agentId": "my-agent",
      "versionId": "nonexistent123"
    }
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

---

### 3. 回滚到指定版本

将配置回滚到指定的历史版本。

**请求**

```
POST /api/config/:agentId/versions/:versionId/rollback
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentId | string | 是 | Agent ID |
| versionId | string | 是 | Git commit hash |

**请求体**

```json
{
  "message": "Rollback to previous version"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message | string | 否 | 回滚提交信息（可选） |

**响应示例**

```json
{
  "success": true,
  "data": {
    "success": true,
    "agentId": "my-agent",
    "rolledBackTo": "abc123def456...",
    "shortHash": "abc123d",
    "timestamp": "2024-01-15T10:35:00.000Z",
    "message": "Rollback to abc123d"
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

**错误响应**

```json
{
  "success": false,
  "error": {
    "message": "版本不存在",
    "code": "VERSION_NOT_FOUND",
    "details": {
      "agentId": "my-agent",
      "versionId": "nonexistent123"
    }
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

---

### 4. 版本对比

对比两个版本的配置差异。

**请求**

```
GET /api/config/:agentId/versions/compare
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentId | string | 是 | Agent ID |

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| version1 | string | 是 | 第一个版本 ID |
| version2 | string | 是 | 第二个版本 ID |

**响应示例**

```json
{
  "success": true,
  "data": {
    "agentId": "my-agent",
    "version1": {
      "versionId": "abc123...",
      "shortHash": "abc123d",
      "config": {
        "agent": {
          "name": "my-agent",
          "tools": ["exec", "read"]
        }
      }
    },
    "version2": {
      "versionId": "def456...",
      "shortHash": "def456d",
      "config": {
        "agent": {
          "name": "my-agent",
          "tools": ["exec", "read", "write"]
        }
      }
    },
    "diff": {
      "raw": "diff --git a/agents/my-agent/my-agent-config.yaml...",
      "changes": [
        {
          "path": "agent.tools",
          "type": "modified",
          "oldValue": ["exec", "read"],
          "newValue": ["exec", "read", "write"]
        }
      ]
    }
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

**错误响应**

```json
{
  "success": false,
  "error": {
    "message": "必须提供 version1 和 version2 参数",
    "code": "MISSING_PARAMS",
    "details": {
      "required": ["version1", "version2"]
    }
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

---

### 5. 提交配置变更

将当前配置提交到版本历史（可选功能）。

**请求**

```
POST /api/config/:agentId/versions/commit
```

**路径参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentId | string | 是 | Agent ID |

**请求体**

```json
{
  "message": "Update configuration"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message | string | 否 | 提交信息（可选） |

**响应示例**

```json
{
  "success": true,
  "data": {
    "success": true,
    "agentId": "my-agent",
    "commitHash": "abc123def456...",
    "shortHash": "abc123d",
    "message": "Update configuration",
    "timestamp": "2024-01-15T10:35:00.000Z"
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| INVALID_AGENT_ID | 400 | Agent ID 格式无效 |
| INVALID_VERSION_ID | 400 | 版本 ID 格式无效 |
| VERSION_NOT_FOUND | 404 | 版本不存在 |
| CONFIG_NOT_FOUND | 404 | 配置文件不存在 |
| MISSING_PARAMS | 400 | 缺少必需参数 |
| PARSE_ERROR | 400 | 配置解析失败 |
| IO_ERROR | 500 | 文件系统操作失败 |

---

## 使用示例

### cURL 示例

#### 获取版本列表

```bash
curl -X GET "http://localhost:3000/api/config/my-agent/versions?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 获取版本详情

```bash
curl -X GET "http://localhost:3000/api/config/my-agent/versions/abc123def456" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 回滚到指定版本

```bash
curl -X POST "http://localhost:3000/api/config/my-agent/versions/abc123def456/rollback" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Rollback to previous version"}'
```

#### 版本对比

```bash
curl -X GET "http://localhost:3000/api/config/my-agent/versions/compare?version1=abc123&version2=def456" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 技术实现

### Git 集成

- 使用 `simple-git` 库进行 Git 操作
- 工作目录：`/home/admin/.openclaw/workspace`
- 配置文件路径：`/home/admin/.openclaw/workspace/agents/:agentId/:agentId-config.yaml`

### 版本存储

- 版本历史通过 Git commit 管理
- 每个配置变更都会创建一个新的 commit
- 支持完整的 Git 历史追溯

### 备份机制

- 回滚操作前会自动创建备份
- 备份存储于：`/home/admin/.openclaw/workspace/.config-history/:agentId/`

---

## 注意事项

1. **Git 仓库初始化**: 首次使用时会自动初始化 Git 仓库
2. **Agent ID 格式**: 只能包含字母、数字、连字符和下划线（2-50 字符）
3. **版本 ID**: 必须是有效的 Git commit hash
4. **回滚安全**: 回滚前会自动备份当前配置
5. **性能考虑**: 建议限制版本列表查询的 limit 参数

---

## 相关文件

- 路由：`src/routes/config-history.js`
- 服务：`src/services/configHistoryService.js`
- 测试：`tests/config-history.test.js`
