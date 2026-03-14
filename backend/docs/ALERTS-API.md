# 告警通知系统 API 文档

## 概述

告警通知系统提供告警规则配置、多渠道通知、告警历史管理功能。支持告警级别（警告/严重/紧急）、告警聚合（避免告警风暴）和多种通知渠道（邮件/钉钉/企业微信）。

## 基础信息

- **Base URL**: `/api/alerts`
- **认证**: 需要（根据系统配置）
- **Content-Type**: `application/json`

## 数据模型

### AlertRule (告警规则)

```json
{
  "id": 1,
  "name": "High CPU Usage",
  "description": "CPU 使用率超过阈值时触发告警",
  "condition": "cpu > 80",
  "severity": "warning",
  "channels": ["email", "dingtalk"],
  "cooldown": 300,
  "enabled": true,
  "metadata": {},
  "created_at": "2026-03-14T00:00:00.000Z",
  "updated_at": "2026-03-14T00:00:00.000Z"
}
```

**字段说明**:
- `id`: 规则 ID（自动生成）
- `name`: 规则名称（唯一，必填）
- `description`: 规则描述（可选）
- `condition`: 告警条件表达式（必填），支持 `>`, `<`, `>=`, `<=`, `==`, `!=`, `&&`, `||`
- `severity`: 告警级别（可选，默认：warning）
  - `warning`: 警告
  - `critical`: 严重
  - `emergency`: 紧急
- `channels`: 通知渠道数组（可选）
  - `email`: 邮件
  - `dingtalk`: 钉钉
  - `wechat_work`: 企业微信
- `cooldown`: 冷却时间（秒，可选，默认：300），避免告警风暴
- `enabled`: 是否启用（可选，默认：true）
- `metadata`: 额外元数据（可选）

### AlertHistory (告警历史)

```json
{
  "id": 1,
  "rule_id": 1,
  "title": "High CPU Usage",
  "message": "Alert triggered: High CPU Usage",
  "severity": "warning",
  "context": {
    "condition": "cpu > 80",
    "metrics": { "cpu": 85 },
    "triggeredBy": "system"
  },
  "status": "active",
  "acknowledged_by": null,
  "acknowledged_at": null,
  "acknowledgment_notes": null,
  "resolved_by": null,
  "resolved_at": null,
  "resolution_notes": null,
  "triggered_at": "2026-03-14T00:00:00.000Z",
  "created_at": "2026-03-14T00:00:00.000Z",
  "updated_at": "2026-03-14T00:00:00.000Z"
}
```

**字段说明**:
- `id`: 告警记录 ID（自动生成）
- `rule_id`: 关联的规则 ID
- `title`: 告警标题
- `message`: 告警消息
- `severity`: 告警级别
- `context`: 告警上下文（触发时的指标数据）
- `status`: 告警状态
  - `active`: 活跃
  - `acknowledged`: 已确认
  - `resolved`: 已解决
- `acknowledged_by`: 确认人
- `acknowledged_at`: 确认时间
- `acknowledgment_notes`: 确认备注
- `resolved_by`: 解决人
- `resolved_at`: 解决时间
- `resolution_notes`: 解决备注
- `triggered_at`: 触发时间

## API 端点

### 1. 获取告警规则列表

**GET** `/api/alerts/rules`

获取所有告警规则，支持过滤和分页。

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| severity | string | 否 | 按级别过滤 (warning\|critical\|emergency) |
| enabled | boolean | 否 | 按启用状态过滤 (true\|false) |
| limit | number | 否 | 每页数量 (默认：100) |
| offset | number | 否 | 偏移量 (默认：0) |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "High CPU Usage",
      "condition": "cpu > 80",
      "severity": "warning",
      "channels": ["email"],
      "cooldown": 300,
      "enabled": true
    }
  ],
  "count": 1
}
```

---

### 2. 创建告警规则

**POST** `/api/alerts/rules`

创建新的告警规则。

**请求体**:
```json
{
  "name": "High Memory Usage",
  "description": "内存使用率超过 90% 时触发",
  "condition": "memory > 90",
  "severity": "critical",
  "channels": ["email", "dingtalk"],
  "cooldown": 600,
  "enabled": true,
  "metadata": {
    "team": "ops",
    "escalation_policy": "immediate"
  }
}
```

**字段约束**:
- `name`: 必填，唯一
- `condition`: 必填，有效的表达式
- `severity`: 可选，必须是 warning\|critical\|emergency
- `channels`: 可选，数组，元素必须是 email\|dingtalk\|wechat_work
- `cooldown`: 可选，非负整数（秒）

**响应示例** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "High Memory Usage",
    "condition": "memory > 90",
    "severity": "critical",
    "channels": ["email", "dingtalk"],
    "cooldown": 600,
    "enabled": true
  },
  "message": "Alert rule created successfully"
}
```

**错误响应** (400 Bad Request):
```json
{
  "error": "Name is required",
  "code": "VALIDATION_ERROR"
}
```

---

### 3. 更新告警规则

**PUT** `/api/alerts/rules/:id`

更新现有告警规则。所有字段可选，只更新提供的字段。

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 规则 ID |

**请求体** (所有字段可选):
```json
{
  "name": "Updated Rule Name",
  "condition": "cpu > 85",
  "severity": "critical",
  "channels": ["dingtalk", "wechat_work"],
  "cooldown": 900,
  "enabled": false
}
```

**响应示例** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Updated Rule Name",
    "condition": "cpu > 85",
    "severity": "critical",
    "channels": ["dingtalk", "wechat_work"],
    "cooldown": 900,
    "enabled": false
  },
  "message": "Alert rule updated successfully"
}
```

**错误响应** (404 Not Found):
```json
{
  "error": "Alert rule not found",
  "code": "RULE_NOT_FOUND"
}
```

---

### 4. 删除告警规则

**DELETE** `/api/alerts/rules/:id`

删除告警规则。关联的告警历史会保留（外键约束：ON DELETE CASCADE 会删除关联历史）。

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 规则 ID |

**响应示例** (200 OK):
```json
{
  "success": true,
  "message": "Alert rule deleted successfully"
}
```

**错误响应** (404 Not Found):
```json
{
  "error": "Alert rule not found",
  "code": "RULE_NOT_FOUND"
}
```

---

### 5. 获取告警历史

**GET** `/api/alerts/history`

获取告警历史记录，支持过滤和分页。

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| rule_id | number | 否 | 按规则 ID 过滤 |
| severity | string | 否 | 按级别过滤 |
| status | string | 否 | 按状态过滤 (active\|acknowledged\|resolved) |
| from | string | 否 | 起始时间 (ISO 8601) |
| to | string | 否 | 结束时间 (ISO 8601) |
| limit | number | 否 | 每页数量 (默认：100) |
| offset | number | 否 | 偏移量 (默认：0) |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rule_id": 1,
      "title": "High CPU Usage",
      "message": "Alert triggered: High CPU Usage",
      "severity": "warning",
      "context": {
        "cpu": 85,
        "timestamp": "2026-03-14T00:00:00.000Z"
      },
      "status": "active",
      "triggered_at": "2026-03-14T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 6. 确认告警

**POST** `/api/alerts/acknowledge`

确认一个活跃告警，表示有人正在处理。

**请求体**:
```json
{
  "alertId": 1,
  "acknowledgedBy": "admin",
  "notes": "正在调查，可能是临时峰值"
}
```

**字段约束**:
- `alertId`: 必填，告警 ID
- `acknowledgedBy`: 必填，确认人
- `notes`: 可选，确认备注

**响应示例** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "rule_id": 1,
    "title": "High CPU Usage",
    "status": "acknowledged",
    "acknowledged_by": "admin",
    "acknowledged_at": "2026-03-14T00:05:00.000Z",
    "acknowledgment_notes": "正在调查，可能是临时峰值"
  },
  "message": "Alert acknowledged successfully"
}
```

**错误响应** (400 Bad Request):
```json
{
  "error": "Alert not found or not active",
  "code": "ALERT_NOT_FOUND"
}
```

---

### 7. 解决告警

**POST** `/api/alerts/resolve`

标记告警为已解决。

**请求体**:
```json
{
  "alertId": 1,
  "resolvedBy": "admin",
  "notes": "问题已解决，CPU 使用率恢复正常"
}
```

**字段约束**:
- `alertId`: 必填，告警 ID
- `resolvedBy`: 必填，解决人
- `notes`: 可选，解决备注

**响应示例** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "rule_id": 1,
    "title": "High CPU Usage",
    "status": "resolved",
    "resolved_by": "admin",
    "resolved_at": "2026-03-14T01:00:00.000Z",
    "resolution_notes": "问题已解决，CPU 使用率恢复正常"
  },
  "message": "Alert resolved successfully"
}
```

---

### 8. 手动触发告警

**POST** `/api/alerts/trigger`

手动触发告警规则（用于测试或特殊情况）。

**请求体**:
```json
{
  "ruleId": 1,
  "metrics": {
    "cpu": 85,
    "memory": 70,
    "disk": 60
  },
  "triggeredBy": "admin"
}
```

**字段约束**:
- `ruleId`: 必填，规则 ID
- `metrics`: 必填，用于评估的指标对象
- `triggeredBy`: 可选，触发人（默认：api）

**响应示例** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 5,
    "rule_id": 1,
    "title": "High CPU Usage",
    "message": "Alert triggered: High CPU Usage",
    "severity": "warning",
    "status": "active",
    "triggered_at": "2026-03-14T00:00:00.000Z"
  },
  "message": "Alert triggered successfully"
}
```

**响应示例** (条件未满足或冷却中):
```json
{
  "success": true,
  "data": null,
  "message": "Alert condition not met or suppressed by cooldown"
}
```

---

### 9. 批量评估规则

**POST** `/api/alerts/evaluate`

对所有启用的规则进行评估（用于定时任务或指标上报时）。

**请求体**:
```json
{
  "metrics": {
    "cpu": 85,
    "memory": 92,
    "disk": 75
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 6,
      "rule_id": 1,
      "title": "High CPU Usage",
      "severity": "warning",
      "triggered_at": "2026-03-14T00:00:00.000Z"
    },
    {
      "id": 7,
      "rule_id": 2,
      "title": "High Memory Usage",
      "severity": "critical",
      "triggered_at": "2026-03-14T00:00:01.000Z"
    }
  ],
  "count": 2
}
```

---

### 10. 获取告警统计

**GET** `/api/alerts/stats`

获取当前活跃告警的统计信息。

**响应示例**:
```json
{
  "success": true,
  "data": {
    "active": {
      "warning": 5,
      "critical": 2,
      "emergency": 0,
      "total": 7
    },
    "severity": {
      "WARNING": "warning",
      "CRITICAL": "critical",
      "EMERGENCY": "emergency"
    },
    "status": {
      "ACTIVE": "active",
      "ACKNOWLEDGED": "acknowledged",
      "RESOLVED": "resolved"
    },
    "channels": {
      "EMAIL": "email",
      "DINGTALK": "dingtalk",
      "WECHAT_WORK": "wechat_work"
    }
  }
}
```

---

## 告警规则引擎

### 条件表达式语法

告警规则支持简单的条件表达式，可用于比较指标值：

**支持的运算符**:
- 比较：`>`, `<`, `>=`, `<=`, `==`, `!=`
- 逻辑：`&&` (与), `||` (或)

**示例**:
```javascript
// 简单条件
cpu > 80
memory < 10
disk >= 95

// 复合条件
cpu > 80 && memory > 90
cpu > 90 || memory > 95
cpu > 80 && (memory > 90 || disk > 95)
```

**评估逻辑**:
1. 将表达式中的指标名替换为实际值
2. 安全执行表达式计算
3. 返回布尔结果

**注意**: 表达式评估是同步的，不支持异步操作或函数调用。

---

## 通知渠道配置

### 邮件通知 (Email)

**环境变量**:
```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=user@example.com
SMTP_PASS=password
ALERT_EMAIL_RECIPIENTS=admin@example.com,ops@example.com
```

### 钉钉通知 (DingTalk)

**环境变量**:
```bash
DINGTALK_WEBHOOK_URL=https://oapi.dingtalk.com/robot/send?access_token=xxx
```

**特性**:
- 支持 Markdown 格式
- 紧急告警 (@all)

### 企业微信通知 (WeChat Work)

**环境变量**:
```bash
WECHAT_WORK_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
```

**特性**:
- 支持 Markdown 格式
- 颜色编码（根据告警级别）

---

## 告警聚合与冷却

### 冷却机制

为避免告警风暴，每个规则都有冷却时间（cooldown）：

- **默认冷却时间**: 300 秒（5 分钟）
- **冷却期内**: 同一规则的告警不会重复触发
- **冷却期后**: 如果条件仍满足，会再次触发

**示例**:
```json
{
  "name": "High CPU",
  "condition": "cpu > 80",
  "cooldown": 600  // 10 分钟冷却
}
```

### 最佳实践

1. **设置合理的冷却时间**:
   - 警告级别：300-600 秒
   - 严重级别：180-300 秒
   - 紧急级别：60-120 秒

2. **使用复合条件**: 避免单一指标波动导致误报

3. **分级通知**:
   - 警告：仅邮件
   - 严重：邮件 + 钉钉
   - 紧急：邮件 + 钉钉 + 企业微信（@all）

---

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| RULE_NOT_FOUND | 404 | 告警规则不存在 |
| ALERT_NOT_FOUND | 404 | 告警记录不存在 |
| ALERT_NOT_ACTIVE | 400 | 告警不是活跃状态 |

---

## 使用示例

### 1. 创建 CPU 告警规则

```bash
curl -X POST http://localhost:3000/api/alerts/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High CPU Usage",
    "description": "CPU 使用率超过 80% 时触发",
    "condition": "cpu > 80",
    "severity": "warning",
    "channels": ["email"],
    "cooldown": 300
  }'
```

### 2. 触发告警评估

```bash
curl -X POST http://localhost:3000/api/alerts/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": {
      "cpu": 85,
      "memory": 70,
      "disk": 60
    }
  }'
```

### 3. 确认告警

```bash
curl -X POST http://localhost:3000/api/alerts/acknowledge \
  -H "Content-Type: application/json" \
  -d '{
    "alertId": 1,
    "acknowledgedBy": "admin",
    "notes": "正在处理"
  }'
```

### 4. 查询告警历史

```bash
curl "http://localhost:3000/api/alerts/history?status=active&limit=10"
```

---

## 数据库迁移

告警系统需要数据库迁移版本 11 和 12：

- **Migration 11**: 创建 `alert_rules` 和 `alert_history` 表
- **Migration 12**: 创建相关索引

确保在启用告警功能前运行数据库迁移。

---

## 相关文件

- **路由**: `backend/src/routes/alerts.js`
- **服务**: `backend/src/services/alertService.js`
- **仓库**: `backend/src/repositories/alert-repository.js`
- **测试**: `backend/tests/alerts.test.js`
- **数据库迁移**: `backend/src/database/migrations.js`
- **数据库模式**: `backend/src/database/schema.js`
