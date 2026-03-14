/**
 * WebSocket Service - 实时日志流服务
 * 提供 WebSocket 连接管理、心跳检测、房间管理、日志推送功能
 * @module services/websocketService
 */

import { WebSocketServer } from 'ws'
import { logInfo, logError, logDebug, createLogger } from '../utils/logger.js'
import { logService } from './logService.js'

const logger = createLogger('websocketService')

/**
 * 心跳配置
 */
const HEARTBEAT_CONFIG = {
  interval: 30000, // 30 秒心跳间隔
  timeout: 5000,   // 5 秒超时
}

/**
 * 重连配置
 */
const RECONNECT_CONFIG = {
  maxAttempts: 5,      // 最大重连次数
  baseDelay: 1000,     // 基础延迟 1 秒
  maxDelay: 30000,     // 最大延迟 30 秒
  backoffMultiplier: 2, // 指数退避倍数
}

/**
 * WebSocket 服务实例
 */
let wss = null

/**
 * 连接管理器
 * 管理所有活跃的 WebSocket 连接
 */
class ConnectionManager {
  constructor() {
    // 按 agentId 分组的连接
    this.agentRooms = new Map()
    // 按 taskId 分组的连接
    this.taskRooms = new Map()
    // 所有活跃连接
    this.connections = new Map()
    // 连接元数据
    this.connectionMeta = new Map()
  }

  /**
   * 添加连接
   * @param {WebSocket} ws - WebSocket 连接
   * @param {string} connectionId - 连接 ID
   * @param {Object} meta - 连接元数据
   */
  addConnection(ws, connectionId, meta = {}) {
    this.connections.set(connectionId, ws)
    this.connectionMeta.set(connectionId, {
      ...meta,
      connectedAt: new Date().toISOString(),
      lastActivity: Date.now(),
      heartbeatCount: 0,
      reconnectAttempts: 0,
    })

    // 添加到对应的房间
    if (meta.agentId) {
      this.addToAgentRoom(meta.agentId, connectionId)
    }
    if (meta.taskId) {
      this.addToTaskRoom(meta.taskId, connectionId)
    }

    logger.debug('Connection added', { connectionId, meta })
  }

  /**
   * 移除连接
   * @param {string} connectionId - 连接 ID
   */
  removeConnection(connectionId) {
    const meta = this.connectionMeta.get(connectionId)
    
    if (meta) {
      // 从房间中移除
      if (meta.agentId) {
        this.removeFromAgentRoom(meta.agentId, connectionId)
      }
      if (meta.taskId) {
        this.removeFromTaskRoom(meta.taskId, connectionId)
      }
    }

    this.connections.delete(connectionId)
    this.connectionMeta.delete(connectionId)

    logger.debug('Connection removed', { connectionId })
  }

  /**
   * 添加到 Agent 房间
   * @param {string} agentId - Agent ID
   * @param {string} connectionId - 连接 ID
   */
  addToAgentRoom(agentId, connectionId) {
    if (!this.agentRooms.has(agentId)) {
      this.agentRooms.set(agentId, new Set())
    }
    this.agentRooms.get(agentId).add(connectionId)
  }

  /**
   * 从 Agent 房间移除
   * @param {string} agentId - Agent ID
   * @param {string} connectionId - 连接 ID
   */
  removeFromAgentRoom(agentId, connectionId) {
    const room = this.agentRooms.get(agentId)
    if (room) {
      room.delete(connectionId)
      if (room.size === 0) {
        this.agentRooms.delete(agentId)
      }
    }
  }

  /**
   * 添加到任务房间
   * @param {string} taskId - Task ID
   * @param {string} connectionId - 连接 ID
   */
  addToTaskRoom(taskId, connectionId) {
    if (!this.taskRooms.has(taskId)) {
      this.taskRooms.set(taskId, new Set())
    }
    this.taskRooms.get(taskId).add(connectionId)
  }

  /**
   * 从任务房间移除
   * @param {string} taskId - Task ID
   * @param {string} connectionId - 连接 ID
   */
  removeFromTaskRoom(taskId, connectionId) {
    const room = this.taskRooms.get(taskId)
    if (room) {
      room.delete(connectionId)
      if (room.size === 0) {
        this.taskRooms.delete(taskId)
      }
    }
  }

  /**
   * 获取连接
   * @param {string} connectionId - 连接 ID
   * @returns {WebSocket|null}
   */
  getConnection(connectionId) {
    return this.connections.get(connectionId) || null
  }

  /**
   * 获取连接元数据
   * @param {string} connectionId - 连接 ID
   * @returns {Object|null}
   */
  getMeta(connectionId) {
    return this.connectionMeta.get(connectionId) || null
  }

  /**
   * 更新连接活动状态
   * @param {string} connectionId - 连接 ID
   */
  updateActivity(connectionId) {
    const meta = this.connectionMeta.get(connectionId)
    if (meta) {
      meta.lastActivity = Date.now()
    }
  }

  /**
   * 增加心跳计数
   * @param {string} connectionId - 连接 ID
   */
  incrementHeartbeat(connectionId) {
    const meta = this.connectionMeta.get(connectionId)
    if (meta) {
      meta.heartbeatCount++
    }
  }

  /**
   * 获取重连次数
   * @param {string} connectionId - 连接 ID
   * @returns {number}
   */
  getReconnectAttempts(connectionId) {
    const meta = this.connectionMeta.get(connectionId)
    return meta?.reconnectAttempts || 0
  }

  /**
   * 增加重连次数
   * @param {string} connectionId - 连接 ID
   */
  incrementReconnectAttempts(connectionId) {
    const meta = this.connectionMeta.get(connectionId)
    if (meta) {
      meta.reconnectAttempts++
    }
  }

  /**
   * 重置重连次数
   * @param {string} connectionId - 连接 ID
   */
  resetReconnectAttempts(connectionId) {
    const meta = this.connectionMeta.get(connectionId)
    if (meta) {
      meta.reconnectAttempts = 0
    }
  }

  /**
   * 获取 Agent 房间的所有连接
   * @param {string} agentId - Agent ID
   * @returns {WebSocket[]}
   */
  getAgentRoomConnections(agentId) {
    const room = this.agentRooms.get(agentId)
    if (!room) return []
    
    return Array.from(room)
      .map(id => this.connections.get(id))
      .filter(ws => ws && ws.readyState === 1) // WebSocket.OPEN = 1
  }

  /**
   * 获取任务房间的所有连接
   * @param {string} taskId - Task ID
   * @returns {WebSocket[]}
   */
  getTaskRoomConnections(taskId) {
    const room = this.taskRooms.get(taskId)
    if (!room) return []
    
    return Array.from(room)
      .map(id => this.connections.get(id))
      .filter(ws => ws && ws.readyState === 1)
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    return {
      totalConnections: this.connections.size,
      agentRooms: this.agentRooms.size,
      taskRooms: this.taskRooms.size,
      connectionsByAgent: Array.from(this.agentRooms.entries()).map(([agentId, room]) => ({
        agentId,
        connections: room.size,
      })),
      connectionsByTask: Array.from(this.taskRooms.entries()).map(([taskId, room]) => ({
        taskId,
        connections: room.size,
      })),
    }
  }

  /**
   * 关闭所有连接
   */
  closeAll() {
    this.connections.forEach((ws, connectionId) => {
      try {
        ws.close(1001, 'Server shutting down')
      } catch (error) {
        logger.error('Error closing connection', { connectionId, error })
      }
    })
    
    this.connections.clear()
    this.connectionMeta.clear()
    this.agentRooms.clear()
    this.taskRooms.clear()
    
    logger.info('All connections closed')
  }
}

// 创建全局连接管理器实例
const connectionManager = new ConnectionManager()

/**
 * 生成唯一连接 ID
 * @returns {string}
 */
function generateConnectionId() {
  return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 计算重连延迟（指数退避）
 * @param {number} attempts - 当前尝试次数
 * @returns {number} 延迟毫秒数
 */
function calculateReconnectDelay(attempts) {
  const delay = RECONNECT_CONFIG.baseDelay * Math.pow(RECONNECT_CONFIG.backoffMultiplier, attempts - 1)
  return Math.min(delay, RECONNECT_CONFIG.maxDelay)
}

/**
 * 发送心跳
 * @param {WebSocket} ws - WebSocket 连接
 * @param {string} connectionId - 连接 ID
 */
function sendHeartbeat(ws, connectionId) {
  if (ws.readyState === 1) { // WebSocket.OPEN
    try {
      ws.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        connectionId,
      }))
      connectionManager.incrementHeartbeat(connectionId)
      logger.debug('Heartbeat sent', { connectionId })
    } catch (error) {
      logger.error('Failed to send heartbeat', { connectionId, error })
    }
  }
}

/**
 * 启动心跳检测
 * @param {WebSocket} ws - WebSocket 连接
 * @param {string} connectionId - 连接 ID
 */
function startHeartbeat(ws, connectionId) {
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState !== 1) { // Not OPEN
      clearInterval(heartbeatInterval)
      return
    }
    
    sendHeartbeat(ws, connectionId)
    
    // 检查超时
    const meta = connectionManager.getMeta(connectionId)
    if (meta && Date.now() - meta.lastActivity > HEARTBEAT_CONFIG.interval + HEARTBEAT_CONFIG.timeout) {
      logger.warn('Connection timeout', { connectionId })
      ws.terminate()
      clearInterval(heartbeatInterval)
    }
  }, HEARTBEAT_CONFIG.interval)

  // 将 interval 保存到连接元数据以便清理
  const meta = connectionManager.getMeta(connectionId)
  if (meta) {
    meta.heartbeatInterval = heartbeatInterval
  }

  return heartbeatInterval
}

/**
 * 推送日志到房间
 * @param {string} type - 房间类型 ('agent' | 'task')
 * @param {string} id - Agent ID 或 Task ID
 * @param {Object} logEntry - 日志条目
 */
function pushLogToRoom(type, id, logEntry) {
  const connections = type === 'agent'
    ? connectionManager.getAgentRoomConnections(id)
    : connectionManager.getTaskRoomConnections(id)

  if (connections.length === 0) {
    logger.debug('No active connections in room', { type, id })
    return 0
  }

  const message = JSON.stringify({
    type: 'log',
    roomType: type,
    roomId: id,
    data: logEntry,
    timestamp: new Date().toISOString(),
  })

  let successCount = 0
  connections.forEach(ws => {
    if (ws.readyState === 1) {
      try {
        ws.send(message)
        successCount++
      } catch (error) {
        logger.error('Failed to push log', { type, id, error })
      }
    }
  })

  logger.debug('Log pushed to room', { type, id, successCount, total: connections.length })
  return successCount
}

/**
 * 初始化 WebSocket 服务器
 * @param {http.Server} server - HTTP 服务器实例
 * @returns {WebSocketServer}
 */
export function initializeWebSocketServer(server) {
  if (wss) {
    logger.warn('WebSocket server already initialized')
    return wss
  }

  wss = new WebSocketServer({ 
    server,
    path: '/ws',
    clientTracking: true,
  })

  wss.on('connection', handleConnection)
  wss.on('error', (error) => {
    logger.error('WebSocket server error', error)
  })

  logInfo('WebSocket server initialized')
  return wss
}

/**
 * 处理新连接
 * @param {WebSocket} ws - WebSocket 连接
 * @param {http.IncomingMessage} request - HTTP 请求
 */
function handleConnection(ws, request) {
  const connectionId = generateConnectionId()
  const url = new URL(request.url, `http://${request.headers.host}`)
  const pathSegments = url.pathname.split('/').filter(Boolean)
  
  logger.debug('New WebSocket connection', {
    connectionId,
    path: url.pathname,
    ip: request.socket.remoteAddress,
  })

  // 解析路径参数
  let agentId = null
  let taskId = null
  
  // 路径格式：/ws/logs/:agentId 或 /ws/logs/task/:taskId
  if (pathSegments[0] === 'ws' && pathSegments[1] === 'logs') {
    if (pathSegments[2] === 'task' && pathSegments[3]) {
      taskId = pathSegments[3]
    } else if (pathSegments[2]) {
      agentId = pathSegments[2]
    }
  }

  // 验证认证 token（从 query 参数或 header 获取）
  const token = url.searchParams.get('token') || request.headers['x-auth-token']
  if (!token) {
    logger.warn('Connection rejected: missing token', { connectionId })
    ws.close(4001, 'Authentication required')
    return
  }

  // TODO: 验证 token（实际应用中应调用认证服务）
  // 这里简化处理，仅检查 token 是否存在
  const isValidToken = validateToken(token)
  if (!isValidToken) {
    logger.warn('Connection rejected: invalid token', { connectionId })
    ws.close(4003, 'Invalid token')
    return
  }

  // 添加连接到管理器
  connectionManager.addConnection(ws, connectionId, {
    agentId,
    taskId,
    ip: request.socket.remoteAddress,
    userAgent: request.headers['user-agent'],
  })

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'welcome',
    connectionId,
    timestamp: new Date().toISOString(),
    room: agentId ? { type: 'agent', id: agentId } : taskId ? { type: 'task', id: taskId } : null,
  }))

  // 启动心跳检测
  startHeartbeat(ws, connectionId)

  // 处理消息
  ws.on('message', (data) => handleMessage(ws, connectionId, data))
  
  // 处理关闭
  ws.on('close', (code, reason) => handleClose(ws, connectionId, code, reason))
  
  // 处理错误
  ws.on('error', (error) => handleError(ws, connectionId, error))

  logger.info('WebSocket connection established', {
    connectionId,
    agentId,
    taskId,
  })
}

/**
 * 验证 token
 * @param {string} token - JWT token
 * @returns {boolean}
 */
function validateToken(token) {
  // 简化实现：实际应用中应使用 JWT 验证
  // 这里仅做基本格式检查
  if (!token || token.length < 10) {
    return false
  }
  
  // TODO: 集成 JWT 验证
  // try {
  //   jwt.verify(token, process.env.JWT_SECRET)
  //   return true
  // } catch (error) {
  //   return false
  // }
  
  return true
}

/**
 * 处理收到的消息
 * @param {WebSocket} ws - WebSocket 连接
 * @param {string} connectionId - 连接 ID
 * @param {string} data - 消息数据
 */
function handleMessage(ws, connectionId, data) {
  try {
    const message = JSON.parse(data.toString())
    connectionManager.updateActivity(connectionId)

    switch (message.type) {
      case 'ping':
        // 响应 ping
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString(),
          connectionId,
        }))
        break

      case 'subscribe':
        // 订阅新房间
        handleSubscribe(ws, connectionId, message)
        break

      case 'unsubscribe':
        // 取消订阅
        handleUnsubscribe(ws, connectionId, message)
        break

      default:
        logger.debug('Unknown message type', { connectionId, type: message.type })
    }
  } catch (error) {
    logger.error('Failed to parse message', { connectionId, error })
    ws.send(JSON.stringify({
      type: 'error',
      code: 'INVALID_MESSAGE',
      message: 'Failed to parse message',
      timestamp: new Date().toISOString(),
    }))
  }
}

/**
 * 处理订阅请求
 * @param {WebSocket} ws - WebSocket 连接
 * @param {string} connectionId - 连接 ID
 * @param {Object} message - 消息内容
 */
function handleSubscribe(ws, connectionId, message) {
  const { roomType, roomId } = message
  
  if (!roomType || !roomId) {
    ws.send(JSON.stringify({
      type: 'error',
      code: 'INVALID_SUBSCRIPTION',
      message: 'roomType and roomId are required',
      timestamp: new Date().toISOString(),
    }))
    return
  }

  const meta = connectionManager.getMeta(connectionId)
  if (!meta) return

  if (roomType === 'agent') {
    connectionManager.addToAgentRoom(roomId, connectionId)
    meta.agentId = roomId
  } else if (roomType === 'task') {
    connectionManager.addToTaskRoom(roomId, connectionId)
    meta.taskId = roomId
  }

  logger.info('Client subscribed to room', { connectionId, roomType, roomId })
  
  ws.send(JSON.stringify({
    type: 'subscribed',
    roomType,
    roomId,
    timestamp: new Date().toISOString(),
  }))
}

/**
 * 处理取消订阅请求
 * @param {WebSocket} ws - WebSocket 连接
 * @param {string} connectionId - 连接 ID
 * @param {Object} message - 消息内容
 */
function handleUnsubscribe(ws, connectionId, message) {
  const { roomType, roomId } = message
  
  if (!roomType || !roomId) {
    return
  }

  const meta = connectionManager.getMeta(connectionId)
  if (!meta) return

  if (roomType === 'agent') {
    connectionManager.removeFromAgentRoom(roomId, connectionId)
    if (meta.agentId === roomId) {
      meta.agentId = null
    }
  } else if (roomType === 'task') {
    connectionManager.removeFromTaskRoom(roomId, connectionId)
    if (meta.taskId === roomId) {
      meta.taskId = null
    }
  }

  logger.info('Client unsubscribed from room', { connectionId, roomType, roomId })
  
  ws.send(JSON.stringify({
    type: 'unsubscribed',
    roomType,
    roomId,
    timestamp: new Date().toISOString(),
  }))
}

/**
 * 处理连接关闭
 * @param {WebSocket} ws - WebSocket 连接
 * @param {string} connectionId - 连接 ID
 * @param {number} code - 关闭代码
 * @param {string} reason - 关闭原因
 */
function handleClose(ws, connectionId, code, reason) {
  logger.info('WebSocket connection closed', {
    connectionId,
    code,
    reason: reason?.toString(),
  })

  // 清理心跳 interval
  const meta = connectionManager.getMeta(connectionId)
  if (meta?.heartbeatInterval) {
    clearInterval(meta.heartbeatInterval)
  }

  // 从管理器移除
  connectionManager.removeConnection(connectionId)
}

/**
 * 处理连接错误
 * @param {WebSocket} ws - WebSocket 连接
 * @param {string} connectionId - 连接 ID
 * @param {Error} error - 错误对象
 */
function handleError(ws, connectionId, error) {
  logger.error('WebSocket connection error', {
    connectionId,
    error: error.message,
  })

  // 尝试发送错误消息
  if (ws.readyState === 1) {
    try {
      ws.send(JSON.stringify({
        type: 'error',
        code: 'CONNECTION_ERROR',
        message: 'Connection error occurred',
        timestamp: new Date().toISOString(),
      }))
    } catch (sendError) {
      // 忽略发送错误
    }
  }
}

/**
 * 推送 Agent 日志
 * @param {string} agentId - Agent ID
 * @param {Object} logEntry - 日志条目
 * @returns {number} 成功推送的连接数
 */
export function pushAgentLog(agentId, logEntry) {
  return pushLogToRoom('agent', agentId, logEntry)
}

/**
 * 推送任务日志
 * @param {string} taskId - Task ID
 * @param {Object} logEntry - 日志条目
 * @returns {number} 成功推送的连接数
 */
export function pushTaskLog(taskId, logEntry) {
  return pushLogToRoom('task', taskId, logEntry)
}

/**
 * 获取连接统计信息
 * @returns {Object}
 */
export function getConnectionStats() {
  return connectionManager.getStats()
}

/**
 * 生成 WebSocket 认证 token
 * @param {Object} user - 用户信息
 * @param {string} expiresIn - 过期时间
 * @returns {string}
 */
export function generateWebSocketToken(user, expiresIn = '1h') {
  // TODO: 实际实现应使用 JWT
  // 这里返回一个简化的 token
  const payload = {
    userId: user.id,
    username: user.username,
    permissions: ['websocket:connect'],
    exp: Date.now() + 3600000, // 1 小时
  }
  
  // 简化实现：使用 base64 编码
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

/**
 * 关闭 WebSocket 服务器
 */
export function closeWebSocketServer() {
  if (wss) {
    connectionManager.closeAll()
    
    wss.close(() => {
      logger.info('WebSocket server closed')
    })
    
    wss = null
  }
}

export default {
  initializeWebSocketServer,
  pushAgentLog,
  pushTaskLog,
  getConnectionStats,
  generateWebSocketToken,
  closeWebSocketServer,
  connectionManager,
}
