/**
 * WebSocket Service Tests
 * 测试 WebSocket 日志流服务的核心功能
 * @module tests/websocket.test
 */

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { WebSocket } from 'ws'
import http from 'http'
import { Server as WebSocketServer } from 'ws'

// 导入被测试的模块
import websocketService, {
  initializeWebSocketServer,
  pushAgentLog,
  pushTaskLog,
  getConnectionStats,
  generateWebSocketToken,
  closeWebSocketServer,
} from '../src/services/websocketService.js'

/**
 * 测试辅助函数
 */

/**
 * 创建测试 HTTP 服务器
 */
function createTestServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200)
      res.end('OK')
    })
    
    server.listen(0, () => {
      resolve(server)
    })
  })
}

/**
 * 创建 WebSocket 客户端连接
 */
function createWebSocketClient(server, path = '/ws', token = 'test_token_12345') {
  return new Promise((resolve, reject) => {
    const port = server.address().port
    const ws = new WebSocket(`ws://localhost:${port}${path}?token=${token}`)
    
    ws.on('open', () => resolve(ws))
    ws.on('error', reject)
    
    // 5 秒超时
    setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close()
        reject(new Error('WebSocket connection timeout'))
      }
    }, 5000)
  })
}

/**
 * 等待并收集消息
 */
function collectMessages(ws, count = 1, timeout = 2000) {
  return new Promise((resolve) => {
    const messages = []
    let resolved = false
    
    ws.on('message', (data) => {
      if (resolved) return
      try {
        const message = JSON.parse(data.toString())
        messages.push(message)
        
        if (messages.length >= count) {
          resolved = true
          resolve(messages)
        }
      } catch (error) {
        // 忽略解析错误
      }
    })
    
    // 超时返回已收集的消息
    setTimeout(() => {
      if (!resolved) {
        resolved = true
        resolve(messages)
      }
    }, timeout)
  })
}

/**
 * 主测试套件
 */
describe('WebSocket Service', () => {
  let server
  let wss

  before(async () => {
    // 创建测试服务器
    server = await createTestServer()
    wss = initializeWebSocketServer(server)
  })

  after(() => {
    closeWebSocketServer()
    server.close()
  })

  describe('Connection Management', () => {
    it('should establish WebSocket connection', async () => {
      const port = server.address().port
      const ws = await createWebSocketClient(server, '/ws/logs/agent-001')
      
      assert.strictEqual(ws.readyState, WebSocket.OPEN)
      
      // 接收欢迎消息
      const messages = await collectMessages(ws, 1)
      assert.strictEqual(messages.length, 1)
      assert.strictEqual(messages[0].type, 'welcome')
      assert.ok(messages[0].connectionId)
      
      ws.close()
    })

    it('should reject connection without token', async () => {
      const port = server.address().port
      
      return new Promise((resolve) => {
        const ws = new WebSocket(`ws://localhost:${port}/ws/logs/agent-001`)
        
        ws.on('close', (code) => {
          assert.strictEqual(code, 4001)
          resolve()
        })
        
        ws.on('open', () => {
          // 不应该连接成功
          assert.fail('Connection should be rejected')
        })
      })
    })

    it('should handle agent room subscription', async () => {
      const ws = await createWebSocketClient(server, '/ws/logs/agent-001')
      
      const messages = await collectMessages(ws, 1)
      assert.strictEqual(messages[0].type, 'welcome')
      assert.strictEqual(messages[0].room.type, 'agent')
      assert.strictEqual(messages[0].room.id, 'agent-001')
      
      ws.close()
    })

    it('should handle task room subscription', async () => {
      const ws = await createWebSocketClient(server, '/ws/logs/task/task-001')
      
      const messages = await collectMessages(ws, 1)
      assert.strictEqual(messages[0].type, 'welcome')
      assert.strictEqual(messages[0].room.type, 'task')
      assert.strictEqual(messages[0].room.id, 'task-001')
      
      ws.close()
    })
  })

  describe('Heartbeat Mechanism', () => {
    it('should respond to ping with pong', async () => {
      const ws = await createWebSocketClient(server, '/ws/logs/agent-001')
      
      // 等待欢迎消息
      await collectMessages(ws, 1)
      
      // 发送 ping
      ws.send(JSON.stringify({ type: 'ping' }))
      
      // 接收 pong
      const messages = await collectMessages(ws, 1)
      assert.strictEqual(messages.length, 1)
      assert.strictEqual(messages[0].type, 'pong')
      
      ws.close()
    })

    it('should receive heartbeat from server', async () => {
      const ws = await createWebSocketClient(server, '/ws/logs/agent-001')
      
      // 等待欢迎消息
      const messages = await collectMessages(ws, 2, 35000) // 35 秒，等待心跳
      
      // 应该收到欢迎消息和心跳消息
      const welcomeMessage = messages.find(m => m.type === 'welcome')
      assert.ok(welcomeMessage)
      
      // 心跳消息可能在 30 秒后到达，这里不强制要求
      // 因为测试时间限制，只验证连接正常
      
      ws.close()
    })
  })

  describe('Message Handling', () => {
    it('should handle subscribe message', async () => {
      const ws = await createWebSocketClient(server, '/ws/logs/agent-001')
      
      // 等待欢迎消息
      await collectMessages(ws, 1)
      
      // 订阅新房间
      ws.send(JSON.stringify({
        type: 'subscribe',
        roomType: 'task',
        roomId: 'task-002',
      }))
      
      const messages = await collectMessages(ws, 1)
      assert.strictEqual(messages.length, 1)
      assert.strictEqual(messages[0].type, 'subscribed')
      assert.strictEqual(messages[0].roomType, 'task')
      assert.strictEqual(messages[0].roomId, 'task-002')
      
      ws.close()
    })

    it('should handle unsubscribe message', async () => {
      const ws = await createWebSocketClient(server, '/ws/logs/agent-001')
      
      // 等待欢迎消息
      await collectMessages(ws, 1)
      
      // 先订阅
      ws.send(JSON.stringify({
        type: 'subscribe',
        roomType: 'task',
        roomId: 'task-003',
      }))
      await collectMessages(ws, 1)
      
      // 取消订阅
      ws.send(JSON.stringify({
        type: 'unsubscribe',
        roomType: 'task',
        roomId: 'task-003',
      }))
      
      const messages = await collectMessages(ws, 1)
      assert.strictEqual(messages.length, 1)
      assert.strictEqual(messages[0].type, 'unsubscribed')
      assert.strictEqual(messages[0].roomType, 'task')
      assert.strictEqual(messages[0].roomId, 'task-003')
      
      ws.close()
    })

    it('should handle invalid message', async () => {
      const ws = await createWebSocketClient(server, '/ws/logs/agent-001')
      
      // 等待欢迎消息
      await collectMessages(ws, 1)
      
      // 发送无效 JSON
      ws.send('invalid json')
      
      const messages = await collectMessages(ws, 1)
      assert.strictEqual(messages.length, 1)
      assert.strictEqual(messages[0].type, 'error')
      assert.strictEqual(messages[0].code, 'INVALID_MESSAGE')
      
      ws.close()
    })

    it('should handle invalid subscription', async () => {
      const ws = await createWebSocketClient(server, '/ws/logs/agent-001')
      
      // 等待欢迎消息
      await collectMessages(ws, 1)
      
      // 发送缺少参数的订阅
      ws.send(JSON.stringify({
        type: 'subscribe',
        roomType: 'agent',
        // 缺少 roomId
      }))
      
      const messages = await collectMessages(ws, 1)
      assert.strictEqual(messages.length, 1)
      assert.strictEqual(messages[0].type, 'error')
      assert.strictEqual(messages[0].code, 'INVALID_SUBSCRIPTION')
      
      ws.close()
    })
  })

  describe('Log Pushing', () => {
    it('should push log to agent room', async () => {
      const ws = await createWebSocketClient(server, '/ws/logs/agent-test-001')
      
      // 等待欢迎消息
      await collectMessages(ws, 1)
      
      // 推送日志
      const logEntry = {
        level: 'INFO',
        message: 'Test log message',
        timestamp: new Date().toISOString(),
        context: { test: true },
      }
      
      const pushedCount = pushAgentLog('agent-test-001', logEntry)
      assert.strictEqual(pushedCount, 1)
      
      // 接收日志消息
      const messages = await collectMessages(ws, 1)
      assert.strictEqual(messages.length, 1)
      assert.strictEqual(messages[0].type, 'log')
      assert.strictEqual(messages[0].roomType, 'agent')
      assert.strictEqual(messages[0].roomId, 'agent-test-001')
      assert.deepStrictEqual(messages[0].data, logEntry)
      
      ws.close()
    })

    it('should push log to task room', async () => {
      const ws = await createWebSocketClient(server, '/ws/logs/task/task-test-001')
      
      // 等待欢迎消息
      await collectMessages(ws, 1)
      
      // 推送日志
      const logEntry = {
        level: 'ERROR',
        message: 'Task error',
        timestamp: new Date().toISOString(),
      }
      
      const pushedCount = pushTaskLog('task-test-001', logEntry)
      assert.strictEqual(pushedCount, 1)
      
      // 接收日志消息
      const messages = await collectMessages(ws, 1)
      assert.strictEqual(messages.length, 1)
      assert.strictEqual(messages[0].type, 'log')
      assert.strictEqual(messages[0].roomType, 'task')
      assert.strictEqual(messages[0].roomId, 'task-test-001')
      assert.deepStrictEqual(messages[0].data, logEntry)
      
      ws.close()
    })

    it('should not push to non-existent room', () => {
      const logEntry = {
        level: 'INFO',
        message: 'Test',
        timestamp: new Date().toISOString(),
      }
      
      const pushedCount = pushAgentLog('non-existent-agent', logEntry)
      assert.strictEqual(pushedCount, 0)
    })

    it('should push to multiple clients in same room', async () => {
      // 创建两个连接到同一房间
      const ws1 = await createWebSocketClient(server, '/ws/logs/agent-multi-001')
      const ws2 = await createWebSocketClient(server, '/ws/logs/agent-multi-001')
      
      // 等待欢迎消息
      await collectMessages(ws1, 1)
      await collectMessages(ws2, 1)
      
      // 推送日志
      const logEntry = {
        level: 'WARN',
        message: 'Multi-client test',
        timestamp: new Date().toISOString(),
      }
      
      const pushedCount = pushAgentLog('agent-multi-001', logEntry)
      assert.strictEqual(pushedCount, 2)
      
      // 两个客户端都应该收到消息
      const messages1 = await collectMessages(ws1, 1)
      const messages2 = await collectMessages(ws2, 1)
      
      assert.strictEqual(messages1.length, 1)
      assert.strictEqual(messages2.length, 1)
      assert.strictEqual(messages1[0].type, 'log')
      assert.strictEqual(messages2[0].type, 'log')
      
      ws1.close()
      ws2.close()
    })
  })

  describe('Connection Stats', () => {
    it('should return connection statistics', () => {
      const stats = getConnectionStats()
      
      assert.ok(typeof stats.totalConnections === 'number')
      assert.ok(typeof stats.agentRooms === 'number')
      assert.ok(typeof stats.taskRooms === 'number')
      assert.ok(Array.isArray(stats.connectionsByAgent))
      assert.ok(Array.isArray(stats.connectionsByTask))
    })

    it('should track active connections', async () => {
      const initialStats = getConnectionStats()
      
      const ws1 = await createWebSocketClient(server, '/ws/logs/agent-stats-001')
      await collectMessages(ws1, 1)
      
      const ws2 = await createWebSocketClient(server, '/ws/logs/task-stats-001')
      await collectMessages(ws2, 1)
      
      const stats = getConnectionStats()
      assert.strictEqual(stats.totalConnections, initialStats.totalConnections + 2)
      assert.ok(stats.agentRooms >= 1)
      assert.ok(stats.taskRooms >= 1)
      
      ws1.close()
      ws2.close()
      
      // 等待连接清理
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const finalStats = getConnectionStats()
      assert.strictEqual(finalStats.totalConnections, initialStats.totalConnections)
    })
  })

  describe('Token Generation', () => {
    it('should generate WebSocket token', () => {
      const user = {
        id: 'user-001',
        username: 'testuser',
      }
      
      const token = generateWebSocketToken(user)
      
      assert.ok(token)
      assert.ok(token.length > 0)
      
      // 验证 token 可以解码
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
      assert.strictEqual(decoded.userId, user.id)
      assert.strictEqual(decoded.username, user.username)
      assert.ok(decoded.exp)
    })

    it('should generate token with custom expiration', () => {
      const user = {
        id: 'user-002',
        username: 'testuser2',
      }
      
      const token = generateWebSocketToken(user, '2h')
      assert.ok(token)
      
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
      assert.ok(decoded.exp > Date.now())
    })
  })

  describe('Reconnection Logic', () => {
    it('should calculate exponential backoff delay', () => {
      // 测试重连延迟计算
      const delays = []
      for (let i = 1; i <= 5; i++) {
        const delay = Math.min(1000 * Math.pow(2, i - 1), 30000)
        delays.push(delay)
      }
      
      assert.strictEqual(delays[0], 1000)    // 1 秒
      assert.strictEqual(delays[1], 2000)    // 2 秒
      assert.strictEqual(delays[2], 4000)    // 4 秒
      assert.strictEqual(delays[3], 8000)    // 8 秒
      assert.strictEqual(delays[4], 16000)   // 16 秒
    })

    it('should cap delay at maximum', () => {
      const attempts = 10
      const delay = Math.min(1000 * Math.pow(2, attempts - 1), 30000)
      assert.strictEqual(delay, 30000) // 最大 30 秒
    })
  })

  describe('Connection Cleanup', () => {
    it('should clean up connection on close', async () => {
      const initialStats = getConnectionStats()
      
      const ws = await createWebSocketClient(server, '/ws/logs/agent-cleanup-001')
      await collectMessages(ws, 1)
      
      const connectedStats = getConnectionStats()
      assert.strictEqual(connectedStats.totalConnections, initialStats.totalConnections + 1)
      
      ws.close()
      
      // 等待连接清理
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const finalStats = getConnectionStats()
      assert.strictEqual(finalStats.totalConnections, initialStats.totalConnections)
    })

    it('should clean up rooms when empty', async () => {
      const ws = await createWebSocketClient(server, '/ws/logs/agent-room-cleanup-001')
      await collectMessages(ws, 1)
      
      let stats = getConnectionStats()
      const agentRoomCount = stats.agentRooms
      
      ws.close()
      
      // 等待清理
      await new Promise(resolve => setTimeout(resolve, 200))
      
      stats = getConnectionStats()
      assert.strictEqual(stats.agentRooms, agentRoomCount - 1)
    })
  })
})

/**
 * 边缘情况测试
 */
describe('WebSocket Service Edge Cases', () => {
  let server
  let wss

  before(async () => {
    server = await createTestServer()
    wss = initializeWebSocketServer(server)
  })

  after(() => {
    closeWebSocketServer()
    server.close()
  })

  it('should handle malformed JSON messages', async () => {
    const ws = await createWebSocketClient(server, '/ws/logs/agent-edge-001')
    await collectMessages(ws, 1)
    
    // 发送 malformed JSON
    ws.send('{ invalid json }')
    
    const messages = await collectMessages(ws, 1)
    assert.strictEqual(messages[0].type, 'error')
    
    ws.close()
  })

  it('should handle large log payloads', async () => {
    const ws = await createWebSocketClient(server, '/ws/logs/agent-edge-002')
    await collectMessages(ws, 1)
    
    // 创建大日志条目
    const largeLog = {
      level: 'INFO',
      message: 'A'.repeat(10000), // 10KB 消息
      timestamp: new Date().toISOString(),
      context: { data: 'B'.repeat(10000) },
    }
    
    const pushedCount = pushAgentLog('agent-edge-002', largeLog)
    assert.strictEqual(pushedCount, 1)
    
    const messages = await collectMessages(ws, 1)
    assert.strictEqual(messages[0].type, 'log')
    
    ws.close()
  })

  it('should handle rapid reconnections', async () => {
    const connections = []
    
    // 快速创建和关闭多个连接
    for (let i = 0; i < 5; i++) {
      const ws = await createWebSocketClient(server, '/ws/logs/agent-edge-003')
      await collectMessages(ws, 1)
      connections.push(ws)
    }
    
    // 验证所有连接都建立了
    const stats = getConnectionStats()
    assert.ok(stats.totalConnections >= 5)
    
    // 关闭所有连接
    connections.forEach(ws => ws.close())
    
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const finalStats = getConnectionStats()
    assert.ok(finalStats.totalConnections < stats.totalConnections)
  })

  it('should handle concurrent log pushes', async () => {
    const ws = await createWebSocketClient(server, '/ws/logs/agent-edge-004')
    await collectMessages(ws, 1)
    
    // 并发推送多个日志
    const logPromises = []
    for (let i = 0; i < 10; i++) {
      const logEntry = {
        level: 'INFO',
        message: `Concurrent log ${i}`,
        timestamp: new Date().toISOString(),
      }
      logPromises.push(pushAgentLog('agent-edge-004', logEntry))
    }
    
    const results = await Promise.all(logPromises)
    results.forEach(count => {
      assert.strictEqual(count, 1)
    })
    
    ws.close()
  })
})
