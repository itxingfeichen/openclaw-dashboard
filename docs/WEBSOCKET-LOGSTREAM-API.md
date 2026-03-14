# WebSocket 实时日志流 API 文档

## 概述

WebSocket 实时日志流服务提供低延迟的日志推送能力，支持按 Agent 或任务订阅日志，具备心跳检测、自动重连、房间管理等功能。

## 特性

- ✅ **实时推送** - 日志产生后立即推送到客户端
- ✅ **房间管理** - 按 Agent ID 或 Task ID 分组订阅
- ✅ **心跳检测** - 30 秒心跳间隔，自动检测断线
- ✅ **自动重连** - 指数退避策略，最大 5 次重试
- ✅ **增量推送** - 仅推送新增日志，减少带宽消耗
- ✅ **认证安全** - JWT Token 认证，支持权限控制

---

## 快速开始

### 1. 获取 WebSocket Token

```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
  http://localhost:3000/api/log-stream/token
```

响应示例：

```json
{
  "success": true,
  "data": {
    "token": "eyJ1c2VySWQiOiJ1c2VyLTAwMSIsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJwZXJtaXNzaW9ucyI6WyJ3ZWJzb2NrZXQ6Y29ubmVjdCJdLCJleHAiOjE3MTAzNDU2MDB9",
    "expiresIn": 3600,
    "websocketUrl": "/ws/logs"
  },
  "timestamp": "2026-03-14T03:51:00.000Z"
}
```

### 2. 建立 WebSocket 连接

#### 订阅 Agent 日志

```javascript
const token = 'your-websocket-token'
const agentId = 'agent-001'
const ws = new WebSocket(`ws://localhost:3000/ws/logs/${agentId}?token=${token}`)
```

#### 订阅任务日志

```javascript
const token = 'your-websocket-token'
const taskId = 'task-001'
const ws = new WebSocket(`ws://localhost:3000/ws/logs/task/${taskId}?token=${token}`)
```

### 3. 处理消息

```javascript
ws.on('open', () => {
  console.log('Connected to log stream')
})

ws.on('message', (data) => {
  const message = JSON.parse(data.toString())
  
  switch (message.type) {
    case 'welcome':
      console.log('Connection established:', message.connectionId)
      break
    
    case 'heartbeat':
      console.log('Heartbeat received')
      break
    
    case 'log':
      console.log('New log entry:', message.data)
      // 处理日志：message.data = { level, message, timestamp, context }
      break
    
    case 'pong':
      console.log('Pong received')
      break
    
    case 'error':
      console.error('Error:', message.code, message.message)
      break
  }
})

ws.on('close', (code, reason) => {
  console.log('Connection closed:', code, reason)
  // 触发重连逻辑
})

ws.on('error', (error) => {
  console.error('WebSocket error:', error)
})
```

---

## API 端点

### WebSocket 端点

#### `WS /ws/logs/:agentId`

订阅指定 Agent 的实时日志流。

**路径参数：**
- `agentId` (string) - Agent 唯一标识

**查询参数：**
- `token` (string) - WebSocket 认证 Token（必需）

**示例：**
```
ws://localhost:3000/ws/logs/agent-001?token=eyJ1c2VySWQiOiJ1c2VyLTAwMSJ9
```

**欢迎消息：**
```json
{
  "type": "welcome",
  "connectionId": "ws_1710345600000_abc123def",
  "timestamp": "2026-03-14T03:51:00.000Z",
  "room": {
    "type": "agent",
    "id": "agent-001"
  }
}
```

---

#### `WS /ws/logs/task/:taskId`

订阅指定任务的实时日志流。

**路径参数：**
- `taskId` (string) - 任务唯一标识

**查询参数：**
- `token` (string) - WebSocket 认证 Token（必需）

**示例：**
```
ws://localhost:3000/ws/logs/task/task-001?token=eyJ1c2VySWQiOiJ1c2VyLTAwMSJ9
```

**欢迎消息：**
```json
{
  "type": "welcome",
  "connectionId": "ws_1710345600000_abc123def",
  "timestamp": "2026-03-14T03:51:00.000Z",
  "room": {
    "type": "task",
    "id": "task-001"
  }
}
```

---

### HTTP API 端点

#### `GET /api/log-stream/token`

获取 WebSocket 认证 Token。

**认证：** 需要 JWT Token

**请求头：**
```
Authorization: Bearer <your-jwt-token>
```

**响应：**
```json
{
  "success": true,
  "data": {
    "token": "eyJ1c2VySWQiOiJ1c2VyLTAwMSJ9",
    "expiresIn": 3600,
    "websocketUrl": "/ws/logs"
  },
  "timestamp": "2026-03-14T03:51:00.000Z"
}
```

**错误响应：**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required"
  },
  "timestamp": "2026-03-14T03:51:00.000Z"
}
```

---

#### `GET /api/log-stream/stats`

获取 WebSocket 连接统计信息。

**认证：** 不需要

**响应：**
```json
{
  "success": true,
  "data": {
    "totalConnections": 15,
    "agentRooms": 8,
    "taskRooms": 5,
    "connectionsByAgent": [
      { "agentId": "agent-001", "connections": 3 },
      { "agentId": "agent-002", "connections": 2 }
    ],
    "connectionsByTask": [
      { "taskId": "task-001", "connections": 5 }
    ]
  },
  "timestamp": "2026-03-14T03:51:00.000Z"
}
```

---

#### `GET /api/log-stream/health`

WebSocket 服务健康检查。

**认证：** 不需要

**响应：**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "websocketServer": "running",
    "activeConnections": 15,
    "agentRooms": 8,
    "taskRooms": 5
  },
  "timestamp": "2026-03-14T03:51:00.000Z"
}
```

---

## 消息协议

### 客户端 → 服务器

#### Ping（心跳响应）

```json
{
  "type": "ping"
}
```

#### Subscribe（订阅房间）

```json
{
  "type": "subscribe",
  "roomType": "agent",
  "roomId": "agent-002"
}
```

**字段说明：**
- `roomType` (string) - 房间类型：`agent` 或 `task`
- `roomId` (string) - 房间 ID：Agent ID 或 Task ID

#### Unsubscribe（取消订阅）

```json
{
  "type": "unsubscribe",
  "roomType": "agent",
  "roomId": "agent-001"
}
```

---

### 服务器 → 客户端

#### Welcome（欢迎消息）

连接建立时发送。

```json
{
  "type": "welcome",
  "connectionId": "ws_1710345600000_abc123def",
  "timestamp": "2026-03-14T03:51:00.000Z",
  "room": {
    "type": "agent",
    "id": "agent-001"
  }
}
```

#### Heartbeat（心跳）

每 30 秒发送一次。

```json
{
  "type": "heartbeat",
  "timestamp": "2026-03-14T03:51:30.000Z",
  "connectionId": "ws_1710345600000_abc123def"
}
```

#### Log（日志推送）

```json
{
  "type": "log",
  "roomType": "agent",
  "roomId": "agent-001",
  "data": {
    "level": "INFO",
    "message": "Agent started successfully",
    "timestamp": "2026-03-14T03:51:35.000Z",
    "context": {
      "agentId": "agent-001",
      "workspace": "/home/admin/workspace"
    }
  },
  "timestamp": "2026-03-14T03:51:35.000Z"
}
```

**日志数据字段：**
- `level` (string) - 日志级别：`DEBUG`, `INFO`, `WARN`, `ERROR`
- `message` (string) - 日志消息
- `timestamp` (string) - ISO 8601 时间戳
- `context` (object, optional) - 附加上下文信息

#### Pong（Ping 响应）

```json
{
  "type": "pong",
  "timestamp": "2026-03-14T03:51:30.000Z",
  "connectionId": "ws_1710345600000_abc123def"
}
```

#### Subscribed（订阅确认）

```json
{
  "type": "subscribed",
  "roomType": "task",
  "roomId": "task-001",
  "timestamp": "2026-03-14T03:51:40.000Z"
}
```

#### Unsubscribed（取消订阅确认）

```json
{
  "type": "unsubscribed",
  "roomType": "task",
  "roomId": "task-001",
  "timestamp": "2026-03-14T03:51:45.000Z"
}
```

#### Error（错误消息）

```json
{
  "type": "error",
  "code": "INVALID_MESSAGE",
  "message": "Failed to parse message",
  "timestamp": "2026-03-14T03:51:50.000Z"
}
```

**错误代码：**
- `INVALID_MESSAGE` - 消息格式错误
- `INVALID_SUBSCRIPTION` - 订阅参数无效
- `CONNECTION_ERROR` - 连接错误
- `AUTH_FAILED` - 认证失败

---

## 连接管理

### 心跳机制

- **心跳间隔：** 30 秒
- **超时时间：** 5 秒（心跳后 35 秒无活动视为超时）
- **检测方式：** 服务器定期发送 `heartbeat` 消息，客户端应响应 `ping`

### 自动重连

当连接断开时，客户端应实现自动重连逻辑：

```javascript
class LogStreamClient {
  constructor(agentId, token) {
    this.agentId = agentId
    this.token = token
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.baseDelay = 1000 // 1 秒
    this.maxDelay = 30000 // 30 秒
  }

  connect() {
    const url = `ws://localhost:3000/ws/logs/${this.agentId}?token=${this.token}`
    this.ws = new WebSocket(url)
    
    this.ws.on('open', () => {
      console.log('Connected')
      this.reconnectAttempts = 0
    })
    
    this.ws.on('close', (code, reason) => {
      console.log('Disconnected:', code, reason)
      this.scheduleReconnect()
    })
    
    this.ws.on('error', (error) => {
      console.error('Error:', error)
    })
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      this.maxDelay
    )

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)
    
    setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
  }
}

// 使用示例
const client = new LogStreamClient('agent-001', 'your-token')
client.connect()
```

### 连接状态码

| 代码 | 含义 | 说明 |
|------|------|------|
| 1000 | Normal Closure | 正常关闭 |
| 1001 | Going Away | 服务器关闭 |
| 4001 | Authentication Required | 缺少认证 Token |
| 4003 | Invalid Token | Token 无效 |

---

## 最佳实践

### 1. 虚拟滚动优化

对于大量日志的展示，建议使用虚拟滚动：

```javascript
class VirtualLogViewer {
  constructor(containerHeight, itemHeight) {
    this.containerHeight = containerHeight
    this.itemHeight = itemHeight
    this.visibleCount = Math.ceil(containerHeight / itemHeight)
    this.logs = []
    this.scrollTop = 0
  }

  addLog(logEntry) {
    this.logs.push(logEntry)
    
    // 保持最大日志数量，避免内存溢出
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-5000)
    }
    
    this.render()
  }

  getVisibleLogs() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight)
    const endIndex = startIndex + this.visibleCount + 1 // 多渲染一行作为缓冲
    
    return {
      logs: this.logs.slice(startIndex, endIndex),
      startIndex,
      totalHeight: this.logs.length * this.itemHeight,
      offset: startIndex * this.itemHeight,
    }
  }

  scrollTo(index) {
    this.scrollTop = Math.max(0, index * this.itemHeight)
    this.render()
  }

  render() {
    const { logs, startIndex, totalHeight, offset } = this.getVisibleLogs()
    // 渲染可见日志...
  }
}
```

### 2. 日志缓冲

在网络不稳定时，可以缓冲日志并在重连后同步：

```javascript
class BufferedLogClient extends LogStreamClient {
  constructor(agentId, token) {
    super(agentId, token)
    this.buffer = []
    this.maxBufferSize = 1000
  }

  onLog(logEntry) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // 直接处理
      this.processLog(logEntry)
    } else {
      // 缓冲日志
      this.buffer.push(logEntry)
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer.shift() // 丢弃最旧的日志
      }
    }
  }

  onReconnect() {
    // 重连成功后，可以请求缺失的日志
    this.syncMissedLogs()
  }

  async syncMissedLogs() {
    if (this.buffer.length === 0) return
    
    // 从 HTTP API 获取缺失的日志
    const response = await fetch(`/api/logs/agent/${this.agentId}?limit=100`)
    const data = await response.json()
    
    // 合并缓冲日志
    this.buffer.forEach(log => this.processLog(log))
    this.buffer = []
  }
}
```

### 3. 错误处理

```javascript
ws.addEventListener('error', (event) => {
  console.error('WebSocket error:', event)
  
  // 记录错误到监控服务
  trackError('websocket', {
    agentId,
    error: event.message,
    timestamp: new Date().toISOString(),
  })
})

ws.addEventListener('close', (event) => {
  console.log('WebSocket closed:', event.code, event.reason)
  
  // 根据关闭代码决定是否重连
  if (event.code === 4003) {
    // Token 无效，需要重新获取
    refreshToken().then(newToken => {
      this.token = newToken
      this.connect()
    })
  } else if (event.code !== 1000) {
    // 非正常关闭，触发重连
    this.scheduleReconnect()
  }
})
```

---

## 性能考虑

### 1. 连接数限制

- 单个 Agent 房间建议最大连接数：100
- 单个任务房间建议最大连接数：50
- 服务器总连接数根据资源配置调整

### 2. 消息频率

- 心跳间隔：30 秒（可配置）
- 日志推送：实时，但建议高频日志进行批处理
- 批处理阈值：100ms 或 10 条日志

### 3. 内存管理

- 连接元数据：每个连接约 1KB
- 房间索引：使用 Map 和 Set 保持 O(1) 查找
- 自动清理：连接关闭时立即清理房间索引

---

## 安全考虑

### 1. 认证

- 所有 WebSocket 连接必须提供有效 Token
- Token 应设置合理的过期时间（建议 1 小时）
- Token 应通过 HTTPS 获取

### 2. 授权

- 用户只能订阅其有权限的 Agent/任务日志
- 在生产环境中应实现细粒度的权限控制

### 3. 速率限制

- 建议实现连接速率限制（如每分钟最多 10 次连接）
- 建议实现消息速率限制（如每秒最多 100 条消息）

---

## 故障排查

### 常见问题

#### 连接立即关闭

**可能原因：**
- 缺少 Token 参数
- Token 格式无效
- Token 已过期

**解决方案：**
```javascript
// 确保 URL 中包含 token
const url = `ws://localhost:3000/ws/logs/${agentId}?token=${token}`
```

#### 收不到日志推送

**可能原因：**
- 房间 ID 不匹配
- 日志未正确推送到 WebSocket 服务
- 客户端未正确处理消息

**解决方案：**
1. 检查欢迎消息中的 `room.id` 是否与预期一致
2. 检查后端是否正确调用 `pushAgentLog()` 或 `pushTaskLog()`
3. 添加消息日志：`ws.on('message', data => console.log(data.toString()))`

#### 频繁重连

**可能原因：**
- 网络不稳定
- 服务器负载过高
- 心跳超时设置过短

**解决方案：**
1. 检查网络连接
2. 监控服务器负载
3. 调整心跳间隔和超时时间

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-03-14 | 初始版本 |

---

## 联系支持

如有问题或建议，请联系开发团队或提交 Issue。
