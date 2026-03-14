import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Tag, Input, Button, Space, Tooltip, Typography } from 'antd'
import {
  PauseOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  ClearOutlined,
  SearchOutlined,
  WifiOutlined,
  DisconnectOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import './LogViewerRealtime.css'

const { Text } = Typography

/**
 * Real-time Log Viewer Component
 * Features:
 * - Virtual scrolling for large log files
 * - Log level filtering
 * - Keyword search
 * - Pause/resume scrolling
 * - Export logs
 * - Connection status indicator
 * 
 * @param {Object} props
 * @param {Array} props.logs - Log data array
 * @param {Object} props.connectionStatus - WebSocket connection status
 * @param {Function} props.onReconnect - Reconnect handler
 * @param {Function} props.onPauseToggle - Pause/resume toggle handler
 * @param {boolean} props.isPaused - Whether scrolling is paused
 */
const LogViewerRealtime = ({
  logs = [],
  connectionStatus = { isConnected: false, isConnecting: false },
  onReconnect,
  onPauseToggle,
  isPaused = false,
  maxLogs = 1000
}) => {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Refs for virtual scrolling
  const containerRef = useRef(null)
  const endRef = useRef(null)
  const isAutoScrolling = useRef(true)

  // Virtual scrolling constants
  const ROW_HEIGHT = 28
  const OVERSCAN = 20

  /**
   * Get log level tag configuration
   */
  const getLevelTag = useCallback((level) => {
    const levelConfig = {
      info: { color: 'blue', text: 'INFO' },
      warning: { color: 'orange', text: 'WARN' },
      error: { color: 'red', text: 'ERROR' },
      debug: { color: 'green', text: 'DEBUG' },
      trace: { color: 'purple', text: 'TRACE' }
    }

    const config = levelConfig[level?.toLowerCase()] || { color: 'default', text: level || 'UNKNOWN' }
    return <Tag color={config.color} className="log-level-tag">{config.text}</Tag>
  }, [])

  /**
   * Format timestamp
   */
  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }, [])

  /**
   * Highlight search keywords in text
   */
  const highlightText = useCallback((text, query) => {
    if (!query || !text) return text

    try {
      const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'))
      return parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="highlight">
            {part}
          </mark>
        ) : (
          part
        )
      )
    } catch (error) {
      return text
    }
  }, [])

  /**
   * Escape regex special characters
   */
  const escapeRegExp = useCallback((string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }, [])

  /**
   * Filter logs based on search query and level
   */
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Level filter
      if (levelFilter !== 'all' && log.level !== levelFilter) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const messageMatch = log.message?.toLowerCase().includes(query)
        const sourceMatch = log.source?.toLowerCase().includes(query)
        const idMatch = log.id?.toLowerCase().includes(query)
        return messageMatch || sourceMatch || idMatch
      }

      return true
    })
  }, [logs, levelFilter, searchQuery])

  /**
   * Check if user has scrolled up (disable auto-scroll)
   */
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100

    isAutoScrolling.current = isAtBottom

    // If user scrolled up and not paused, show pause hint
    if (!isAtBottom && !isPaused && onPauseToggle) {
      // Could show a toast here
    }
  }, [isPaused, onPauseToggle])

  /**
   * Scroll to bottom
   */
  const scrollToBottom = useCallback(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  /**
   * Auto-scroll when new logs arrive (if not paused and at bottom)
   */
  useEffect(() => {
    if (isAutoScrolling.current && !isPaused) {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        if (endRef.current) {
          endRef.current.scrollIntoView({ behavior: 'auto' })
        }
      })
    }
  }, [filteredLogs.length, isPaused])

  /**
   * Export logs to file
   */
  const handleExport = useCallback((format = 'txt') => {
    let content = ''
    let filename = `logs-${new Date().toISOString().slice(0, 19)}.txt`
    let mimeType = 'text/plain'

    if (format === 'json') {
      content = JSON.stringify(filteredLogs, null, 2)
      filename = `logs-${new Date().toISOString().slice(0, 19)}.json`
      mimeType = 'application/json'
    } else if (format === 'csv') {
      const headers = ['timestamp', 'level', 'source', 'message']
      const rows = filteredLogs.map(log => [
        log.timestamp || '',
        log.level || '',
        log.source || '',
        `"${(log.message || '').replace(/"/g, '""')}"`
      ])
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      filename = `logs-${new Date().toISOString().slice(0, 19)}.csv`
      mimeType = 'text/csv'
    } else {
      // Plain text format
      content = filteredLogs.map(log => 
        `[${formatTime(log.timestamp)}] [${log.level?.toUpperCase()}] [${log.source || 'unknown'}] ${log.message}`
      ).join('\n')
    }

    const blob = new Blob(['\ufeff' + content], { type: mimeType + ';charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }, [filteredLogs, formatTime])

  /**
   * Clear all logs
   */
  const handleClear = useCallback(() => {
    // Dispatch custom event for parent to handle
    window.dispatchEvent(new CustomEvent('logViewer:clear'))
  }, [])

  /**
   * Virtual scrolling calculation
   */
  const virtualScrollData = useMemo(() => {
    const totalHeight = filteredLogs.length * ROW_HEIGHT
    const containerHeight = containerRef.current?.clientHeight || 600
    const scrollTop = containerRef.current?.scrollTop || 0

    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
    const endIndex = Math.min(
      filteredLogs.length,
      Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN
    )

    const visibleLogs = filteredLogs.slice(startIndex, endIndex)
    const offsetY = startIndex * ROW_HEIGHT

    return {
      visibleLogs,
      totalHeight,
      offsetY,
      startIndex,
      endIndex
    }
  }, [filteredLogs])

  /**
   * Connection status indicator
   */
  const ConnectionIndicator = () => {
    if (connectionStatus.isConnecting) {
      return (
        <Tooltip title="连接中...">
          <ReloadOutlined spin className="connection-indicator connecting" />
        </Tooltip>
      )
    }

    if (connectionStatus.isConnected) {
      return (
        <Tooltip title="已连接">
          <WifiOutlined className="connection-indicator connected" />
        </Tooltip>
      )
    }

    return (
      <Tooltip title="未连接">
        <DisconnectOutlined className="connection-indicator disconnected" />
      </Tooltip>
    )
  }

  return (
    <div className="log-viewer-realtime">
      {/* Control Bar */}
      <div className="log-viewer-controls">
        <Space wrap size="small" className="control-group">
          {/* Connection Status */}
          <ConnectionIndicator />

          {/* Pause/Resume */}
          <Tooltip title={isPaused ? '恢复滚动' : '暂停滚动'}>
            <Button
              type={isPaused ? 'primary' : 'default'}
              icon={isPaused ? <PlayCircleOutlined /> : <PauseOutlined />}
              onClick={() => onPauseToggle?.(!isPaused)}
              size="small"
            >
              {isPaused ? '继续' : '暂停'}
            </Button>
          </Tooltip>

          {/* Reconnect */}
          <Tooltip title="重新连接">
            <Button
              icon={<ReloadOutlined />}
              onClick={onReconnect}
              size="small"
              disabled={connectionStatus.isConnecting}
            />
          </Tooltip>

          {/* Clear */}
          <Tooltip title="清空日志">
            <Button
              icon={<ClearOutlined />}
              onClick={handleClear}
              size="small"
              danger
            />
          </Tooltip>
        </Space>

        <Space wrap size="small" className="control-group">
          {/* Search */}
          <Input.Search
            placeholder="搜索日志..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={() => {}}
            prefix={<SearchOutlined />}
            allowClear
            size="small"
            style={{ width: 200 }}
          />

          {/* Level Filter */}
          <select
            className="log-level-filter"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="all">所有级别</option>
            <option value="debug">DEBUG</option>
            <option value="info">INFO</option>
            <option value="warning">WARNING</option>
            <option value="error">ERROR</option>
            <option value="trace">TRACE</option>
          </select>

          {/* Export */}
          <Tooltip title="导出日志">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExport('txt')}
              size="small"
            >
              导出
            </Button>
          </Tooltip>
        </Space>

        {/* Stats */}
        <div className="log-stats">
          <Text type="secondary" size="small">
            {filteredLogs.length} / {logs.length} 条日志
          </Text>
        </div>
      </div>

      {/* Log Container with Virtual Scrolling */}
      <div 
        ref={containerRef}
        className="log-container"
        onScroll={handleScroll}
      >
        <div 
          className="log-content"
          style={{ height: virtualScrollData.totalHeight, position: 'relative' }}
        >
          <div 
            className="log-viewport"
            style={{ 
              position: 'absolute',
              top: virtualScrollData.offsetY,
              left: 0,
              right: 0
            }}
          >
            {virtualScrollData.visibleLogs.map((log, index) => (
              <div
                key={log.id || `log-${virtualScrollData.startIndex + index}`}
                className={`log-row log-level-${log.level?.toLowerCase()}`}
              >
                <div className="log-timestamp">
                  {formatTime(log.timestamp)}
                </div>
                <div className="log-level">
                  {getLevelTag(log.level)}
                </div>
                <div className="log-source">
                  <Text code>{log.source || 'unknown'}</Text>
                </div>
                <div className="log-message">
                  {highlightText(log.message, searchQuery)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div ref={endRef} />
      </div>

      {/* Pause Indicator */}
      {isPaused && (
        <div className="pause-indicator">
          <Space>
            <PauseOutlined />
            <Text>已暂停滚动</Text>
            <Button 
              type="primary" 
              size="small" 
              icon={<PlayCircleOutlined />}
              onClick={() => onPauseToggle?.(false)}
            >
              恢复
            </Button>
            <Button 
              size="small"
              onClick={scrollToBottom}
            >
              跳到底部
            </Button>
          </Space>
        </div>
      )}
    </div>
  )
}

export default LogViewerRealtime
