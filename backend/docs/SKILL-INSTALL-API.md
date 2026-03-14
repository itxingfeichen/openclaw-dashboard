# 技能安装 API 文档

## 概述

技能安装 API 提供技能的搜索、安装、更新、卸载等全生命周期管理功能。支持 skillhub（国内注册表）和 clawhub（公共注册表）双注册表集成，自动实现优先级fallback。

## 基础信息

- **Base URL**: `/api/skills`
- **认证**: 需要 Bearer Token 认证
- **内容类型**: `application/json`

## 注册表策略

根据 operator 配置的技能存储策略：

1. **优先使用 skillhub**（国内注册表，优先级 1）
2. **自动 fallback 到 clawhub**（公共注册表，优先级 2）
3. 不支持独占声明，两个注册表都可用
4. 安装前会显示来源、版本和风险信号

## 风险评估等级

| 等级 | 分数范围 | 说明 |
|------|---------|------|
| `low` | 0-19 | 低风险，可以安全安装 |
| `medium` | 20-39 | 中等风险，注意相关权限 |
| `high` | 40-59 | 中高风险，存在多个风险因素 |
| `critical` | 60+ | 高风险，建议仔细审查 |

### 风险因素

- **权限风险**: 请求 `exec`, `write`, `browser`, `nodes` 等敏感权限
- **依赖风险**: 依赖包数量过多（>5 个）
- **网络风险**: 需要网络访问权限
- **作者风险**: 作者信息未知
- **许可证风险**: 许可证信息缺失
- **来源风险**: 来自公共注册表（未审核）

---

## API 端点

### 1. 搜索技能

**POST** `/api/skills/search`

搜索技能注册表中的技能。

#### 请求参数

```json
{
  "query": "weather",           // 必填，搜索关键词
  "limit": 10,                  // 可选，结果数量限制，默认 10
  "source": "skillhub"          // 可选，指定注册表：skillhub/clawhub
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "query": "weather",
    "total": 3,
    "skills": [
      {
        "name": "weather",
        "version": "1.2.0",
        "description": "获取天气信息",
        "source": "skillhub",
        "author": "openclaw-team",
        "license": "MIT",
        "permissions": ["web_search"],
        "available": true
      }
    ],
    "sources": ["skillhub"]
  },
  "timestamp": "2026-03-14T05:00:00.000Z"
}
```

#### 错误响应

| 状态码 | 错误码 | 说明 |
|--------|-------|------|
| 400 | `INVALID_PARAM` | 搜索关键词为空 |
| 400 | `INVALID_PARAM` | 无效的注册表来源 |
| 502 | `EXTERNAL_SERVICE_ERROR` | 所有注册表都无法访问 |
| 504 | `TIMEOUT` | 搜索超时 |

---

### 2. 获取技能详情

**GET** `/api/skills/:name/details`

获取指定技能的详细信息和风险评估。

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `name` | string | 技能名称 |

#### 查询参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `source` | string | 可选，指定注册表 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "name": "weather",
    "version": "1.2.0",
    "description": "获取天气信息和预报",
    "source": "skillhub",
    "author": "openclaw-team",
    "license": "MIT",
    "permissions": ["web_search"],
    "dependencies": [],
    "networkAccess": true,
    "publishedAt": "2026-03-01T00:00:00.000Z",
    "available": true,
    "riskAssessment": {
      "level": "low",
      "score": 15,
      "factors": [
        {
          "type": "network",
          "level": "medium",
          "message": "需要网络访问权限"
        }
      ],
      "summary": "✅ 低风险：可以安全安装",
      "recommendations": []
    }
  },
  "timestamp": "2026-03-14T05:00:00.000Z"
}
```

---

### 3. 安装技能

**POST** `/api/skills/install`

安装指定技能。

#### 请求参数

```json
{
  "skillName": "weather",       // 必填，技能名称
  "version": "1.2.0",           // 可选，指定版本，默认最新
  "source": "skillhub",         // 可选，注册表来源
  "skipRiskCheck": false,       // 可选，跳过风险评估（不推荐）
  "config": {}                  // 可选，技能配置
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "skill": {
      "id": 1,
      "name": "weather",
      "version": "1.2.0",
      "status": "installed",
      "source": "skillhub",
      "installedVersion": "1.2.0",
      "location": "/path/to/skill",
      "installedAt": "2026-03-14T05:00:00.000Z"
    },
    "riskAssessment": {
      "level": "low",
      "score": 15,
      "summary": "✅ 低风险：可以安全安装"
    },
    "installResult": {
      "success": true,
      "version": "1.2.0",
      "location": "/path/to/skill"
    },
    "installedAt": "2026-03-14T05:00:00.000Z"
  },
  "timestamp": "2026-03-14T05:00:00.000Z"
}
```

#### 进度回调

安装过程会发射事件，可通过 SSE 端点订阅实时进度：

**GET** `/api/skills/install/progress?skillName=weather`

SSE 事件格式：

```
data: {"type":"progress","skillName":"weather","status":"pending","progress":0,"message":"准备安装..."}

data: {"type":"progress","skillName":"weather","status":"downloading","progress":10,"message":"获取技能信息..."}

data: {"type":"progress","skillName":"weather","status":"installing","progress":40,"message":"正在安装 weather..."}

data: {"type":"complete","skillName":"weather","success":true,"version":"1.2.0"}
```

#### 错误响应

| 状态码 | 错误码 | 说明 |
|--------|-------|------|
| 400 | `INVALID_PARAM` | 技能名称为空 |
| 403 | `SECURITY_VIOLATION` | 技能风险过高，禁止安装 |
| 404 | `NOT_FOUND` | 技能在注册表中未找到 |
| 500 | `INSTALLATION_FAILED` | 安装失败 |
| 504 | `TIMEOUT` | 安装超时（5 分钟） |

---

### 4. 更新技能

**POST** `/api/skills/update`

更新已安装的技能到最新版本或指定版本。

#### 请求参数

```json
{
  "skillName": "weather",       // 必填，技能名称
  "version": "1.3.0",           // 可选，目标版本，默认最新
  "source": "skillhub"          // 可选，注册表来源
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "skill": {
      "id": 1,
      "name": "weather",
      "status": "installed",
      "installedVersion": "1.3.0",
      "latestVersion": "1.3.0"
    },
    "fromVersion": "1.2.0",
    "toVersion": "1.3.0",
    "updatedAt": "2026-03-14T05:30:00.000Z"
  },
  "timestamp": "2026-03-14T05:30:00.000Z"
}
```

#### 特殊情况

如果已是最新版本：

```json
{
  "success": true,
  "data": {
    "skill": {...},
    "message": "已是最新版本",
    "noUpdateNeeded": true
  }
}
```

#### 错误响应

| 状态码 | 错误码 | 说明 |
|--------|-------|------|
| 400 | `INVALID_PARAM` | 技能名称为空 |
| 404 | `NOT_FOUND` | 技能未安装或不存在 |
| 500 | `INSTALLATION_FAILED` | 更新失败 |

---

### 5. 检查可更新技能

**GET** `/api/skills/updates`

检查所有已安装技能的可更新版本。

#### 响应示例

```json
{
  "success": true,
  "data": {
    "updates": [
      {
        "name": "weather",
        "currentVersion": "1.2.0",
        "latestVersion": "1.3.0",
        "source": "skillhub",
        "description": "获取天气信息",
        "riskAssessment": {
          "level": "low",
          "score": 15
        },
        "publishedAt": "2026-03-10T00:00:00.000Z"
      }
    ],
    "total": 1
  },
  "timestamp": "2026-03-14T05:00:00.000Z"
}
```

---

### 6. 获取安装历史

**GET** `/api/skills/install/history`

获取技能安装历史记录。

#### 查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `skillName` | string | - | 按技能名称过滤 |
| `status` | string | - | 按状态过滤：installed/available/error |
| `limit` | number | 50 | 结果数量限制 |
| `offset` | number | 0 | 偏移量 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "name": "weather",
        "version": "1.2.0",
        "source": "skillhub",
        "status": "installed",
        "installedAt": "2026-03-01T10:00:00.000Z",
        "updatedAt": "2026-03-01T10:00:00.000Z",
        "author": "openclaw-team",
        "license": "MIT"
      }
    ],
    "total": 1
  },
  "timestamp": "2026-03-14T05:00:00.000Z"
}
```

---

### 7. 批量安装技能

**POST** `/api/skills/batch-install`

批量安装多个技能。

#### 请求参数

```json
{
  "skills": [
    {
      "skillName": "weather",
      "version": "1.2.0",
      "source": "skillhub"
    },
    {
      "skillName": "calendar",
      "source": "clawhub"
    }
  ]
}
```

#### 限制

- 最多支持 20 个技能同时安装

#### 响应示例

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "skillName": "weather",
        "success": true,
        "data": {...}
      },
      {
        "skillName": "calendar",
        "success": false,
        "error": "技能不存在"
      }
    ],
    "summary": {
      "total": 2,
      "success": 1,
      "failed": 1
    }
  },
  "timestamp": "2026-03-14T05:00:00.000Z"
}
```

#### 错误响应

| 状态码 | 错误码 | 说明 |
|--------|-------|------|
| 400 | `INVALID_PARAM` | 技能列表为空 |
| 400 | `INVALID_PARAM` | 超过最大批量限制（20） |

---

### 8. 卸载技能

**DELETE** `/api/skills/:name`

卸载已安装的技能。

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `name` | string | 技能名称 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "skillName": "weather",
    "uninstalledAt": "2026-03-14T06:00:00.000Z"
  },
  "timestamp": "2026-03-14T06:00:00.000Z"
}
```

#### 错误响应

| 状态码 | 错误码 | 说明 |
|--------|-------|------|
| 400 | `INVALID_PARAM` | 技能名称为空 |
| 404 | `NOT_FOUND` | 技能不存在 |
| 500 | `UNINSTALLATION_FAILED` | 卸载失败 |

---

### 9. 获取技能风险评估

**GET** `/api/skills/:name/risk`

单独获取技能的风险评估报告。

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `name` | string | 技能名称 |

#### 查询参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `source` | string | 可选，指定注册表 |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "skillName": "weather",
    "level": "low",
    "score": 15,
    "factors": [
      {
        "type": "network",
        "level": "medium",
        "message": "需要网络访问权限"
      }
    ],
    "summary": "✅ 低风险：可以安全安装",
    "recommendations": []
  },
  "timestamp": "2026-03-14T05:00:00.000Z"
}
```

---

## 安装状态说明

| 状态 | 说明 |
|------|------|
| `available` | 可用（未安装） |
| `installed` | 已安装 |
| `updating` | 更新中 |
| `error` | 错误状态 |

## 使用示例

### 1. 搜索并安装技能

```javascript
// 搜索技能
const searchResult = await fetch('/api/skills/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'weather' })
})

// 获取详情和风险评估
const details = await fetch('/api/skills/weather/details')

// 安装技能
const installResult = await fetch('/api/skills/install', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    skillName: 'weather',
    skipRiskCheck: false
  })
})
```

### 2. 订阅安装进度（SSE）

```javascript
const eventSource = new EventSource('/api/skills/install/progress?skillName=weather')

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  if (data.type === 'progress') {
    console.log(`进度：${data.progress}% - ${data.message}`)
  } else if (data.type === 'complete') {
    console.log(`安装完成：${data.success ? '成功' : '失败'}`)
    eventSource.close()
  }
}
```

### 3. 批量安装

```javascript
const batchResult = await fetch('/api/skills/batch-install', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    skills: [
      { skillName: 'weather' },
      { skillName: 'calendar' },
      { skillName: 'reminder' }
    ]
  })
})

console.log(`成功：${batchResult.data.summary.success}/${batchResult.data.summary.total}`)
```

---

## 错误码参考

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| `INVALID_PARAM` | 400 | 请求参数无效 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `SECURITY_VIOLATION` | 403 | 安全策略阻止（高风险技能） |
| `INSTALLATION_FAILED` | 500 | 安装失败 |
| `UNINSTALLATION_FAILED` | 500 | 卸载失败 |
| `TIMEOUT` | 504 | 操作超时 |
| `EXTERNAL_SERVICE_ERROR` | 502 | 外部服务（注册表）错误 |
| `INTERNAL_ERROR` | 500 | 内部服务器错误 |

---

## 最佳实践

1. **安装前检查风险**: 始终查看 `riskAssessment` 后再安装
2. **使用 SSE 监控进度**: 对于大技能，使用 SSE 端点跟踪安装进度
3. **批量操作限制**: 批量安装不超过 20 个技能
4. **错误处理**: 捕获并处理 `SECURITY_VIOLATION` 错误，不要强制安装高风险技能
5. **版本管理**: 生产环境建议指定版本号，避免自动升级到不兼容版本

---

## 更新日志

- **v1.0.0** (2026-03-14): 初始版本
  - 支持 skillhub/clawhub 双注册表
  - 实现风险评估系统
  - 提供 SSE 进度订阅
  - 支持批量操作
