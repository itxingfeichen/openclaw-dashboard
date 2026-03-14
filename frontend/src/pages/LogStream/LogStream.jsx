import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Alert, Spin, Empty, message as antdMessage } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import LogViewerRealtime from '../../components/LogViewerRealtime'
import websocketService from '../../services/websocketService'
import './LogStream.css'

/**
 * Real-time Log Stream Page
 * Features:
 * - WebSocket connection management
 * - Real-time log streaming
 * - Auto-reconnect with exponential backoff
 * - Heartbeat detection
 * - Log filtering and search
 * - Pause/resume scrolling
 * - Export functionality
 */
const LogStream = () => {
  // WebSocket URL from environment or default
  const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/api/logs/stream`

  // State
  const [logs, setLogs] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  const [reconnectInfo, setReconnectInfo] = useState(null)

  // Refs
  const maxLogsRef = useRef(1000)

  /**
   * Initialize WebSocket connection
   */
  const connectWebSocket = useCallback(() => {
    setIsConnecting(true)
    setError(null)

    websocketService.connect(WS_URL, {
      protocols: ['json']
    })

    websocketService.onOpen = () => {
      setIsConnected(true)
      setIsConnecting(false)
      antdMessage.success('实时日志连接成功')
      
      // Subscribe to logs
      websocketService.subscribe({
        source: 'all',
        levels: ['info', 'warning', 'error', 'debug', 'trace']
      })
    }

    websocketService.onClose = (event) => {
      setIsConnected(false)
      setIsConnecting(false)
      
      if (event.code !== 1000) {
        antdMessage.warning('实时日志连接已断开')
      }
    }

    websocketService.onError = (err) => {
      console.error('WebSocket error:', err)
      setError('连接失败，请检查网络或服务器状态')
      setIsConnecting(false)
      antdMessage.error('连接错误')
    }

    websocketService.onMessage = (data) => {
      handleLogMessage(data)
    }

    websocketService.onReconnecting = (info) => {
      setReconnectInfo(info)
      antdMessage.loading({
        content: `正在重连... (尝试 ${info.attempt}/${websocketService.maxReconnectAttempts})`,
        key: 'reconnect',
        duration: 0
      })
    }
  }, [WS_URL])

  /**
   * Handle incoming log message
   */
  const handleLogMessage = useCallback((data) => {
    if (!data || !data.logs) return

    const newLogs = Array.isArray(data.logs) ? data.logs : [data]

    setLogs(prevLogs => {
      const updatedLogs = [...prevLogs, ...newLogs]
      
      // Limit buffer size
      if (updatedLogs.length > maxLogsRef.current) {
        return updatedLogs.slice(updatedLogs.length - maxLogsRef.current)
      }
      
      return updatedLogs
    })
  }, [])

  /**
   * Handle reconnection
   */
  const handleReconnect = useCallback(() => {
    antdMessage.loading({ content: '正在重新连接...', key: 'manual-reconnect', duration: 2 })
    websocketService.reconnect()
  }, [])

  /**
   * Handle pause/resume toggle
   */
  const handlePauseToggle = useCallback((paused) => {
    setIsPaused(paused)
    
    if (!paused) {
      // When resuming, clear reconnect message
      antdMessage.destroy('reconnect')
    }
  }, [])

  /**
   * Handle clear logs event
   */
  useEffect(() => {
    const handleClear = () => {
      setLogs([])
      antdMessage.success('日志已清空')
    }

    window.addEventListener('logViewer:clear', handleClear)

    return () => {
      window.removeEventListener('logViewer:clear', handleClear)
    }
  }, [])

  /**
   * Initialize connection on mount
   */
  useEffect(() => {
    connectWebSocket()

    // Cleanup on unmount
    return () => {
      websocketService.close()
    }
  }, [connectWebSocket])

  /**
   * Get connection status
   */
  const connectionStatus = {
    isConnected,
    isConnecting,
    reconnectAttempts: websocketService.reconnectAttempts,
    bufferLength: logs.length
  }

  return (
    <div className="log-stream-page">
      <Card
        className="log-stream-card"
        title="实时日志流"
        bordered={false}
        extra={
          <div className="connection-status">
            {isConnected && (
              <span className="status-badge connected">
                <span className="status-dot" />
                已连接
              </span>
            )}
            {isConnecting && (
              <span className="status-badge connecting">
                <span className="status-dot" />
                连接中...
              </span>
            )}
            {!isConnected && !isConnecting && (
              <span className="status-badge disconnected">
                <span className="status-dot" />
                未连接
              </span>
            )}
          </div>
        }
      >
        {/* Connection Info Alert */}
        {reconnectInfo && !isConnected && (
          <Alert
            message="连接中断"
            description={`正在尝试第 ${reconnectInfo.attempt} 次重连，下次重试将在 ${reconnectInfo.delay}ms 后`}
            type="warning"
            showIcon
            closable
            onClose={() => setReconnectInfo(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Error Alert */}
        {error && (
          <Alert
            message="连接错误"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
            action={
              <button
                className="ant-btn ant-btn-primary"
                onClick={handleReconnect}
              >
                重新连接
              </button>
            }
          />
        )}

        {/* Log Viewer */}
        <div className="log-stream-content">
          {!isConnected && !isConnecting && logs.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="等待连接..."
            >
              <button
                className="ant-btn ant-btn-primary"
                onClick={connectWebSocket}
              >
                连接服务器
              </button>
            </Empty>
          ) : (
            <LogViewerRealtime
              logs={logs}
              connectionStatus={connectionStatus}
              onReconnect={handleReconnect}
              onPauseToggle={handlePauseToggle}
              isPaused={isPaused}
              maxLogs={maxLogsRef.current}
            />
          )}
        </div>

        {/* Help Tips */}
        <div className="log-stream-tips">
          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message="使用提示"
            description={
              <ul>
                <li>实时日志通过 WebSocket 推送，无需手动刷新</li>
                <li>点击"暂停"可停止自动滚动，方便查看历史日志</li>
                <li>支持按日志级别过滤和关键词搜索</li>
                <li>网络断开后会自动重连（指数退避策略）</li>
                <li>点击"导出"可将当前日志保存为文件</li>
              </ul>
            }
            style={{ marginTop: 16 }}
            closable
          />
        </div>
      </Card>
    </div>
  )
}

export default LogStream
