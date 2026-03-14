/**
 * WebSocket Service for Real-time Log Streaming
 * Features:
 * - Connection management
 * - Heartbeat detection (30 seconds)
 * - Auto-reconnect with exponential backoff
 * - Message buffering
 * - Event callbacks
 */

class WebSocketService {
  constructor() {
    this.ws = null
    this.url = null
    this.isConnected = false
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.baseReconnectDelay = 1000 // 1 second
    this.maxReconnectDelay = 30000 // 30 seconds
    this.heartbeatInterval = 30000 // 30 seconds
    this.heartbeatTimer = null
    this.messageBuffer = []
    this.maxBufferSize = 1000
    
    // Callbacks
    this.onOpen = null
    this.onClose = null
    this.onMessage = null
    this.onError = null
    this.onReconnecting = null
  }

  /**
   * Connect to WebSocket server
   * @param {string} url - WebSocket server URL
   * @param {Object} options - Connection options
   */
  connect(url, options = {}) {
    if (this.isConnected || this.isConnecting) {
      console.warn('WebSocket already connected or connecting')
      return
    }

    this.url = url
    this.isConnecting = true

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.isConnected = true
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.startHeartbeat()
        if (this.onOpen) this.onOpen()
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket closed', event.code, event.reason)
        this.isConnected = false
        this.isConnecting = false
        this.stopHeartbeat()
        if (this.onClose) this.onClose(event)
        
        // Auto-reconnect if not intentionally closed
        if (event.code !== 1000 && !event.wasClean) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error', error)
        this.isConnecting = false
        if (this.onError) this.onError(error)
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection', error)
      this.isConnecting = false
      if (this.onError) this.onError(error)
      this.scheduleReconnect()
    }
  }

  /**
   * Handle incoming message
   * @param {string} data - Raw message data
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data)
      
      // Handle heartbeat response
      if (message.type === 'pong') {
        this.resetHeartbeat()
        return
      }

      // Buffer the message
      this.messageBuffer.push(message)
      if (this.messageBuffer.length > this.maxBufferSize) {
        this.messageBuffer.shift()
      }

      if (this.onMessage) this.onMessage(message)
    } catch (error) {
      console.error('Failed to parse WebSocket message', error, data)
      // Handle non-JSON messages
      if (this.onMessage) {
        this.onMessage({ type: 'raw', data })
      }
    }
  }

  /**
   * Start heartbeat timer
   */
  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat()
    }, this.heartbeatInterval)
  }

  /**
   * Stop heartbeat timer
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * Reset heartbeat timer (called on pong response)
   */
  resetHeartbeat() {
    this.startHeartbeat()
  }

  /**
   * Send heartbeat ping
   */
  sendHeartbeat() {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: 'ping', timestamp: Date.now() })
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      if (this.onError) {
        this.onError(new Error('Max reconnection attempts reached'))
      }
      return
    }

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    )

    this.reconnectAttempts++
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`)

    if (this.onReconnecting) {
      this.onReconnecting({ attempt: this.reconnectAttempts, delay })
    }

    setTimeout(() => {
      if (!this.isConnected) {
        this.connect(this.url)
      }
    }, delay)
  }

  /**
   * Send message to server
   * @param {Object|String} data - Message data
   */
  send(data) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, message not sent')
      return false
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      this.ws.send(message)
      return true
    } catch (error) {
      console.error('Failed to send WebSocket message', error)
      return false
    }
  }

  /**
   * Send log subscription request
   * @param {Object} filters - Log filters (source, level, etc.)
   */
  subscribe(filters = {}) {
    return this.send({
      type: 'subscribe',
      payload: {
        channel: 'logs',
        filters
      }
    })
  }

  /**
   * Send log unsubscription request
   */
  unsubscribe() {
    return this.send({
      type: 'unsubscribe',
      payload: {
        channel: 'logs'
      }
    })
  }

  /**
   * Send search query
   * @param {string} query - Search keyword
   */
  search(query) {
    return this.send({
      type: 'search',
      payload: {
        query
      }
    })
  }

  /**
   * Get buffered messages
   * @returns {Array} Buffered messages
   */
  getBuffer() {
    return [...this.messageBuffer]
  }

  /**
   * Clear message buffer
   */
  clearBuffer() {
    this.messageBuffer = []
  }

  /**
   * Get connection status
   * @returns {Object} Connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      bufferLength: this.messageBuffer.length,
      readyState: this.ws?.readyState
    }
  }

  /**
   * Close connection
   * @param {number} code - Close code
   * @param {string} reason - Close reason
   */
  close(code = 1000, reason = 'Normal closure') {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close(code, reason)
      this.ws = null
    }
    this.isConnected = false
    this.isConnecting = false
    this.reconnectAttempts = 0
  }

  /**
   * Reconnect immediately
   */
  reconnect() {
    this.close()
    this.reconnectAttempts = 0
    this.connect(this.url)
  }
}

// Singleton instance
const websocketService = new WebSocketService()

export default websocketService
