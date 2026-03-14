# Logs API 文档

日志查看功能的后端 API，支持日志读取、分页、搜索和过滤。

## 基础信息

- **Base URL**: `/api/logs`
- **认证**: 暂无（可根据需要添加）
- **响应格式**: JSON

## 响应结构

所有 API 响应遵循统一格式：

### 成功响应
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-03-14T00:00:00.000Z"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": "详细错误信息（仅开发环境）",
    "source": "日志源名称"
  },
  "timestamp": "2026-03-14T00:00:00.000Z"
}
```

## API 端点

### 1. 获取日志源列表

**GET** `/api/logs/sources`

获取系统中所有可用的日志源。

#### 响应示例
```json
{
  "success": true,
  "data": {
    "sources": [
      {
        "id": "application",
        "name": "Application Log",
        "path": "/home/admin/openclaw-dashboard/backend/logs/app.log",
        "description": "应用程序主日志"
      },
      {
        "id": "error",
        "name": "Error Log",
        "path": "/home/admin/openclaw-dashboard/backend/logs/error.log",
        "description": "错误日志"
      },
      {
        "id": "access",
        "name": "Access Log",
        "path": "/home/admin/openclaw-dashboard/backend/logs/access.log",
        "description": "访问日志"
      }
    ],
    "total": 3
  },
  "timestamp": "2026-03-14T00:00:00.000Z"
}
```

---

### 2. 读取日志内容

**GET** `/api/logs/:source`

读取指定日志源的内容，支持分页、级别过滤和时间范围过滤。

#### 路径参数
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| source | string | 是 | 日志源 ID（从 `/sources` 接口获取） |

#### 查询参数
| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| page | integer | 1 | 页码（从 1 开始） |
| limit | integer | 50 | 每页数量（1-500） |
| level | string | - | 日志级别过滤（DEBUG/INFO/WARN/ERROR） |
| from | string (ISO 8601) | - | 起始时间 |
| to | string (ISO 8601) | - | 结束时间 |

#### 请求示例
```bash
# 获取第 1 页，每页 50 条
GET /api/logs/application?page=1&limit=50

# 仅获取 ERROR 级别日志
GET /api/logs/application?level=ERROR

# 获取指定时间范围的日志
GET /api/logs/application?from=2026-03-14T00:00:00Z&to=2026-03-14T23:59:59Z

# 组合过滤
GET /api/logs/application?level=WARN&page=2&limit=20&from=2026-03-14T00:00:00Z
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "source": "application",
    "logs": [
      {
        "timestamp": "2026-03-14T00:05:00.000Z",
        "level": "ERROR",
        "message": "Database connection failed",
        "context": {
          "retry": 3,
          "error": "Connection timeout"
        },
        "raw": "[2026-03-14T00:05:00.000Z] [ERROR] Database connection failed {\"retry\":3}"
      },
      {
        "timestamp": "2026-03-14T00:04:00.000Z",
        "level": "WARN",
        "message": "High memory usage",
        "context": {
          "usage": 85
        },
        "raw": "[2026-03-14T00:04:00.000Z] [WARN] High memory usage {\"usage\":85}"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1000,
      "totalPages": 20,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "level": "ERROR",
      "from": "2026-03-14T00:00:00.000Z",
      "to": "2026-03-14T23:59:59.000Z"
    }
  },
  "timestamp": "2026-03-14T00:00:00.000Z"
}
```

#### 错误代码
| 代码 | HTTP 状态码 | 描述 |
|------|------------|------|
| LOG_SOURCE_NOT_FOUND | 404 | 日志源不存在 |
| INVALID_PAGE | 400 | 页码参数无效 |
| INVALID_LIMIT | 400 | 每页数量参数无效 |
| INVALID_LOG_LEVEL | 400 | 日志级别参数无效 |
| INVALID_DATE_FORMAT | 400 | 日期格式无效 |
| INVALID_DATE_RANGE | 400 | 日期范围无效（from > to） |

---

### 3. 搜索日志

**GET** `/api/logs/:source/search`

在指定日志源中搜索包含关键词的日志。

#### 路径参数
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| source | string | 是 | 日志源 ID |

#### 查询参数
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| q | string | 是 | 搜索关键词（支持部分匹配，不区分大小写） |
| page | integer | 否 | 页码（默认 1） |
| limit | integer | 否 | 每页数量（默认 50） |

#### 请求示例
```bash
# 搜索包含 "database" 的日志
GET /api/logs/application/search?q=database

# 搜索 "error" 并分页
GET /api/logs/application/search?q=error&page=2&limit=20
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "source": "application",
    "query": "database",
    "logs": [
      {
        "timestamp": "2026-03-14T00:05:00.000Z",
        "level": "ERROR",
        "message": "Database connection failed",
        "context": {
          "retry": 3
        },
        "raw": "[2026-03-14T00:05:00.000Z] [ERROR] Database connection failed {\"retry\":3}"
      },
      {
        "timestamp": "2026-03-14T00:06:00.000Z",
        "level": "INFO",
        "message": "Database reconnected",
        "context": null,
        "raw": "[2026-03-14T00:06:00.000Z] [INFO] Database reconnected"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 15,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  },
  "timestamp": "2026-03-14T00:00:00.000Z"
}
```

#### 错误代码
| 代码 | HTTP 状态码 | 描述 |
|------|------------|------|
| SEARCH_QUERY_REQUIRED | 400 | 搜索关键词不能为空 |
| LOG_SOURCE_NOT_FOUND | 404 | 日志源不存在 |
| INVALID_PAGE | 400 | 页码参数无效 |
| INVALID_LIMIT | 400 | 每页数量参数无效 |

---

### 4. 获取日志统计

**GET** `/api/logs/:source/stats`

获取指定日志源的统计信息。

#### 路径参数
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| source | string | 是 | 日志源 ID |

#### 请求示例
```bash
GET /api/logs/application/stats
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "source": "application",
    "stats": {
      "total": 1000,
      "byLevel": {
        "DEBUG": 150,
        "INFO": 600,
        "WARN": 200,
        "ERROR": 45,
        "UNKNOWN": 5
      }
    }
  },
  "timestamp": "2026-03-14T00:00:00.000Z"
}
```

---

## 日志格式

### 标准日志格式
```
[timestamp] [LEVEL] message {context}
```

### 示例
```
[2026-03-14T00:00:00.000Z] [INFO] Application started
[2026-03-14T00:01:00.000Z] [DEBUG] Loading configuration {"configPath":"/etc/app/config.json"}
[2026-03-14T00:02:00.000Z] [ERROR] Connection failed {"retry":3,"error":"timeout"}
```

### 日志级别
| 级别 | 数值 | 描述 |
|------|------|------|
| DEBUG | 0 | 调试信息，详细的技术细节 |
| INFO | 1 | 一般信息，系统正常运行状态 |
| WARN | 2 | 警告信息，可能需要注意的问题 |
| ERROR | 3 | 错误信息，需要立即处理的问题 |

级别过滤规则：指定级别会返回该级别及更严重的所有日志。例如，`level=WARN` 会返回 WARN 和 ERROR 级别的日志。

---

## 分页说明

所有列表接口都支持分页，分页信息包含在响应的 `pagination` 字段中：

```json
{
  "pagination": {
    "page": 1,        // 当前页码
    "limit": 50,      // 每页数量
    "total": 1000,    // 总记录数
    "totalPages": 20, // 总页数
    "hasNext": true,  // 是否有下一页
    "hasPrev": false  // 是否有上一页
  }
}
```

### 分页最佳实践
1. 默认每页 50 条，最大 500 条
2. 使用 `hasNext` 判断是否继续加载
3. 对于大量日志，建议结合时间范围过滤减少数据量

---

## 使用示例

### JavaScript / Fetch
```javascript
// 获取日志源列表
const sources = await fetch('/api/logs/sources')
  .then(res => res.json())

// 读取日志（带过滤）
const logs = await fetch('/api/logs/application?level=ERROR&page=1&limit=50')
  .then(res => res.json())

// 搜索日志
const results = await fetch('/api/logs/application/search?q=database')
  .then(res => res.json())
```

### cURL
```bash
# 获取日志源
curl http://localhost:8080/api/logs/sources

# 读取错误日志
curl "http://localhost:8080/api/logs/application?level=ERROR"

# 搜索日志
curl "http://localhost:8080/api/logs/application/search?q=connection"

# 获取统计信息
curl http://localhost:8080/api/logs/application/stats
```

---

## 扩展日志源

可以通过环境变量 `LOG_SOURCES_PATH` 指定自定义日志源配置文件：

```bash
export LOG_SOURCES_PATH=/path/to/log-sources.json
```

配置文件格式：
```json
{
  "custom": {
    "name": "Custom Log",
    "path": "/var/log/custom.log",
    "description": "Custom application log"
  }
}
```

---

## 注意事项

1. **日志文件权限**: 确保应用有读取日志文件的权限
2. **大文件处理**: 对于大型日志文件，建议始终使用分页和时间过滤
3. **性能考虑**: 搜索操作需要扫描整个文件，大数据量时可能较慢
4. **日志轮转**: 支持标准日志轮转，但需要确保文件路径正确
5. **编码**: 日志文件必须使用 UTF-8 编码

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-03-14 | 初始版本 |
