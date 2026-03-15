# 数据备份与恢复 API 文档

## 概述

备份与恢复 API 提供完整的数据保护功能，支持手动备份、定时备份、备份恢复和备份管理。

**基础路径**: `/api/backup`

**认证**: 需要 JWT 认证（通过 `Authorization: Bearer <token>` 头）

## 数据模型

### Backup 对象

```json
{
  "id": "manual-2024-03-14T08-00-00",
  "filename": "backup-manual-2024-03-14T08-00-00.sqlite.gz",
  "path": "/path/to/backups/backup-manual-2024-03-14T08-00-00.sqlite.gz",
  "size": 1048576,
  "type": "manual",
  "status": "completed",
  "createdAt": "2024-03-14T08:00:00.000Z",
  "verified": true
}
```

**字段说明**:
- `id` (string): 备份唯一标识符
- `filename` (string): 备份文件名
- `path` (string): 备份文件完整路径
- `size` (number): 备份文件大小（字节）
- `type` (string): 备份类型 (`manual`, `scheduled`, `pre_update`)
- `status` (string): 备份状态 (`pending`, `in_progress`, `completed`, `failed`, `restored`)
- `createdAt` (string): 创建时间（ISO 8601 格式）
- `verified` (boolean): 是否已通过完整性验证

### Schedule 对象

```json
{
  "enabled": true,
  "cron": "0 2 * * *",
  "type": "scheduled",
  "retention": 10,
  "lastRun": "2024-03-14T02:00:00.000Z",
  "nextRun": "2024-03-15T02:00:00.000Z",
  "updatedAt": "2024-03-14T01:00:00.000Z"
}
```

**字段说明**:
- `enabled` (boolean): 是否启用定时备份
- `cron` (string): Cron 表达式
- `type` (string): 备份类型
- `retention` (number): 保留的备份数量
- `lastRun` (string): 上次执行时间
- `nextRun` (string): 下次执行时间
- `updatedAt` (string): 最后更新时间

---

## API 端点

### 1. 创建备份

**端点**: `POST /api/backup/create`

**描述**: 创建新的数据备份（数据库 + 配置文件）

**请求体**:
```json
{
  "type": "manual"
}
```

**请求参数**:
- `type` (string, 可选): 备份类型
  - `manual` (默认): 手动备份
  - `pre_update`: 更新前备份
  - `scheduled`: 定时备份（通常由系统自动调用）

**响应**: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "manual-2024-03-14T08-00-00",
    "filename": "backup-manual-2024-03-14T08-00-00.sqlite.gz",
    "path": "/path/to/backups/backup-manual-2024-03-14T08-00-00.sqlite.gz",
    "size": 1048576,
    "type": "manual",
    "status": "completed",
    "createdAt": "2024-03-14T08:00:00.000Z",
    "verified": true,
    "configBackup": true
  },
  "timestamp": "2024-03-14T08:00:00.000Z"
}
```

**错误响应**:
- `500 Internal Server Error`: 备份创建失败

**示例**:
```bash
curl -X POST http://localhost:3000/api/backup/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "manual"}'
```

---

### 2. 获取备份列表

**端点**: `GET /api/backup/list`

**描述**: 获取所有备份的列表（按创建时间倒序）

**查询参数**:
- `limit` (number, 可选): 返回数量限制（默认：50，最大：1000）

**响应**: `200 OK`
```json
{
  "success": true,
  "data": {
    "backups": [
      {
        "id": "manual-2024-03-14T08-00-00",
        "filename": "backup-manual-2024-03-14T08-00-00.sqlite.gz",
        "path": "/path/to/backups/backup-manual-2024-03-14T08-00-00.sqlite.gz",
        "size": 1048576,
        "type": "manual",
        "status": "completed",
        "createdAt": "2024-03-14T08:00:00.000Z",
        "verified": true
      }
    ],
    "total": 1,
    "backupDir": "/path/to/backups"
  },
  "timestamp": "2024-03-14T08:00:00.000Z"
}
```

**示例**:
```bash
curl -X GET "http://localhost:3000/api/backup/list?limit=10" \
  -H "Authorization: Bearer <token>"
```

---

### 3. 恢复备份

**端点**: `POST /api/backup/restore/:id`

**描述**: 从指定备份恢复数据

**路径参数**:
- `id` (string, 必需): 备份 ID

**响应**: `200 OK`
```json
{
  "success": true,
  "data": {
    "backupId": "manual-2024-03-14T08-00-00",
    "restoredAt": "2024-03-14T09:00:00.000Z",
    "dbPath": "/path/to/data/openclaw.db",
    "preRestoreBackup": "pre_restore-2024-03-14T09-00-00"
  },
  "timestamp": "2024-03-14T09:00:00.000Z"
}
```

**错误响应**:
- `404 Not Found`: 备份不存在
- `500 Internal Server Error`: 恢复失败

**示例**:
```bash
curl -X POST http://localhost:3000/api/backup/restore/manual-2024-03-14T08-00-00 \
  -H "Authorization: Bearer <token>"
```

**注意事项**:
- 恢复前会自动创建当前数据库的备份（`pre_restore` 类型）
- 恢复操作会关闭当前数据库连接
- 恢复后会验证数据库完整性

---

### 4. 删除备份

**端点**: `DELETE /api/backup/:id`

**描述**: 删除指定备份及其相关文件

**路径参数**:
- `id` (string, 必需): 备份 ID

**响应**: `200 OK`
```json
{
  "success": true,
  "data": {
    "backupId": "manual-2024-03-14T08-00-00",
    "deletedAt": "2024-03-14T10:00:00.000Z"
  },
  "timestamp": "2024-03-14T10:00:00.000Z"
}
```

**错误响应**:
- `404 Not Found`: 备份不存在
- `500 Internal Server Error`: 删除失败

**示例**:
```bash
curl -X DELETE http://localhost:3000/api/backup/manual-2024-03-14T08-00-00 \
  -H "Authorization: Bearer <token>"
```

---

### 5. 获取备份计划

**端点**: `GET /api/backup/schedule`

**描述**: 获取当前定时备份配置

**响应**: `200 OK`
```json
{
  "success": true,
  "data": {
    "enabled": false,
    "cron": "0 2 * * *",
    "type": "scheduled",
    "retention": 10,
    "lastRun": null,
    "nextRun": null,
    "updatedAt": "2024-03-14T01:00:00.000Z"
  },
  "timestamp": "2024-03-14T08:00:00.000Z"
}
```

**示例**:
```bash
curl -X GET http://localhost:3000/api/backup/schedule \
  -H "Authorization: Bearer <token>"
```

---

### 6. 更新备份计划

**端点**: `PUT /api/backup/schedule`

**描述**: 更新定时备份配置

**请求体**:
```json
{
  "enabled": true,
  "cron": "0 2 * * *",
  "retention": 10
}
```

**请求参数**:
- `enabled` (boolean, 可选): 是否启用定时备份（默认：false）
- `cron` (string, 可选): Cron 表达式（默认：`0 2 * * *`，每天凌晨 2 点）
- `retention` (number, 可选): 保留的备份数量（默认：10）

**Cron 表达式格式**:
```
┌───────────── 分钟 (0 - 59)
│ ┌───────────── 小时 (0 - 23)
│ │ ┌───────────── 日期 (1 - 31)
│ │ │ ┌───────────── 月份 (1 - 12)
│ │ │ │ ┌───────────── 星期 (0 - 6) (周日 = 0)
│ │ │ │ │
* * * * *
```

**常用示例**:
- `0 2 * * *`: 每天凌晨 2 点
- `0 */6 * * *`: 每 6 小时
- `0 0 * * 0`: 每周日凌晨 0 点
- `0 0 1 * *`: 每月 1 日凌晨 0 点

**响应**: `200 OK`
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "cron": "0 2 * * *",
    "type": "scheduled",
    "retention": 10,
    "lastRun": null,
    "nextRun": null,
    "updatedAt": "2024-03-14T08:00:00.000Z"
  },
  "timestamp": "2024-03-14T08:00:00.000Z"
}
```

**错误响应**:
- `400 Bad Request`: 无效的 cron 表达式

**示例**:
```bash
curl -X PUT http://localhost:3000/api/backup/schedule \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "cron": "0 3 * * *",
    "retention": 7
  }'
```

---

### 7. 测试定时备份

**端点**: `POST /api/backup/schedule/test`

**描述**: 手动触发一次定时备份（用于测试配置）

**响应**: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "scheduled-2024-03-14T08-00-00",
    "filename": "backup-scheduled-2024-03-14T08-00-00.sqlite.gz",
    "size": 1048576,
    "type": "scheduled",
    "status": "completed",
    "createdAt": "2024-03-14T08:00:00.000Z",
    "verified": true
  },
  "timestamp": "2024-03-14T08:00:00.000Z"
}
```

**示例**:
```bash
curl -X POST http://localhost:3000/api/backup/schedule/test \
  -H "Authorization: Bearer <token>"
```

---

## 错误处理

所有 API 端点在发生错误时返回统一的错误格式：

```json
{
  "success": false,
  "error": {
    "message": "错误描述",
    "details": "详细错误信息（仅开发环境）",
    "backupId": "相关备份 ID"
  },
  "timestamp": "2024-03-14T08:00:00.000Z"
}
```

**常见错误码**:
- `400 Bad Request`: 请求参数错误（如无效的 cron 表达式）
- `404 Not Found`: 备份不存在
- `500 Internal Server Error`: 服务器内部错误
- `504 Gateway Timeout`: 操作超时
- `507 Insufficient Storage`: 磁盘空间不足

---

## 配置选项

通过环境变量配置备份行为：

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `BACKUP_DIR` | `./backups` | 备份文件存储目录 |
| `DB_PATH` | `./data/openclaw.db` | 数据库文件路径 |
| `CONFIG_DIR` | `./` | 配置文件目录 |
| `MAX_BACKUPS` | `10` | 最大保留备份数量 |
| `COMPRESSION_LEVEL` | `6` | Gzip 压缩级别（1-9） |

---

## 最佳实践

### 1. 定期备份
建议配置定时备份，每天凌晨执行：
```json
{
  "enabled": true,
  "cron": "0 2 * * *",
  "retention": 7
}
```

### 2. 更新前备份
在执行系统更新前手动创建备份：
```bash
curl -X POST http://localhost:3000/api/backup/create \
  -H "Authorization: Bearer <token>" \
  -d '{"type": "pre_update"}'
```

### 3. 恢复前验证
恢复备份前，先获取备份列表确认备份存在且已验证：
```bash
# 获取备份列表
curl -X GET http://localhost:3000/api/backup/list \
  -H "Authorization: Bearer <token>"

# 确认 verified: true 后再恢复
```

### 4. 监控备份大小
定期检查备份大小，异常增长可能表示数据问题：
```bash
# 获取备份列表并检查 size 字段
```

### 5. 异地备份
定期将备份文件复制到其他存储位置，防止单点故障。

---

## 技术实现细节

### 备份流程
1. 关闭现有数据库连接
2. 复制数据库文件
3. 使用 Gzip 压缩（可配置压缩级别）
4. 验证备份完整性（检查 SQLite 文件头）
5. 备份配置文件（.env, package.json 等）
6. 清理旧备份（保留最近的 N 个）

### 恢复流程
1. 查找并验证备份文件
2. 创建当前数据库的预恢复备份
3. 解压备份文件到数据库路径
4. 验证恢复后的数据库
5. 重新初始化数据库连接

### 备份验证
- 检查文件是否存在
- 检查文件大小（>1KB）
- 解压并验证 SQLite 文件头（`SQLite format 3`）
- 5 秒超时保护

---

## 更新日志

### v1.0.0 (2024-03-14)
- 初始版本
- 支持手动备份和定时备份
- 支持备份恢复和删除
- 支持备份计划管理
- Gzip 压缩存储
- 备份完整性验证
