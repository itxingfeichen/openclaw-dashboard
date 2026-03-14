import React, { useState, useEffect, useCallback } from 'react'
import { Row, Col, Spin, Alert, Button, Switch } from 'antd'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import LogSourceSelector from '../../components/LogSourceSelector'
import LogSearchBar from '../../components/LogSearchBar'
import LogViewer from '../../components/LogViewer'
import LogPagination from '../../components/LogPagination'
import './Logs.css'

/**
 * 日志查看页面主组件
 */
const Logs = () => {
  // API 基础 URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

  // 日志源
  const [logSources, setLogSources] = useState([])
  const [selectedSource, setSelectedSource] = useState('')

  // 日志数据
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 分页
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  })

  // 搜索和过滤
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [timeRange, setTimeRange] = useState('all')

  // 自动刷新
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(null)

  /**
   * 获取日志源列表
   */
  const fetchLogSources = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/logs/sources`)
      if (!response.ok) throw new Error('Failed to fetch log sources')
      const data = await response.json()
      setLogSources(Array.isArray(data) ? data : [])
      if (data.length > 0 && !selectedSource) {
        setSelectedSource(data[0])
      }
    } catch (err) {
      console.error('Failed to fetch log sources:', err)
      // 使用模拟数据用于演示
      const mockSources = ['system', 'application', 'agent', 'gateway']
      setLogSources(mockSources)
      if (!selectedSource) {
        setSelectedSource('system')
      }
    }
  }, [API_BASE_URL, selectedSource])

  /**
   * 获取日志数据
   */
  const fetchLogs = useCallback(async () => {
    if (!selectedSource) return

    setLoading(true)
    setError(null)

    try {
      const url = searchQuery
        ? `${API_BASE_URL}/logs/${selectedSource}/search?q=${encodeURIComponent(searchQuery)}`
        : `${API_BASE_URL}/logs/${selectedSource}?page=${pagination.page}&limit=${pagination.limit}`

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch logs')
      const data = await response.json()

      // 应用级别过滤
      let filteredLogs = Array.isArray(data.logs) ? data.logs : data
      if (levelFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.level === levelFilter)
      }

      // 应用时间范围过滤
      if (timeRange !== 'all') {
        const now = Date.now()
        const timeRanges = {
          '1h': 3600000,
          '6h': 21600000,
          '24h': 86400000,
          '7d': 604800000
        }
        const cutoff = now - timeRanges[timeRange]
        filteredLogs = filteredLogs.filter(log => {
          const logTime = new Date(log.timestamp).getTime()
          return logTime >= cutoff
        })
      }

      setLogs(filteredLogs)
      setPagination(prev => ({
        ...prev,
        total: data.total || filteredLogs.length
      }))
    } catch (err) {
      console.error('Failed to fetch logs:', err)
      setError('加载日志失败，请稍后重试')
      // 使用模拟数据用于演示
      setLogs(generateMockLogs())
      setPagination(prev => ({ ...prev, total: 100 }))
    } finally {
      setLoading(false)
    }
  }, [API_BASE_URL, selectedSource, pagination.page, pagination.limit, searchQuery, levelFilter, timeRange])

  /**
   * 生成模拟日志数据（用于演示）
   */
  const generateMockLogs = () => {
    const levels = ['info', 'warning', 'error', 'debug']
    const sources = ['system', 'application', 'agent', 'gateway']
    const messages = [
      'Agent 启动成功',
      '任务执行完成',
      'API 请求失败',
      '配置加载成功',
      '会话已创建',
      '内存使用率过高',
      '磁盘空间不足',
      '网络连接超时',
      '权限验证通过',
      '数据同步完成'
    ]

    const logs = []
    for (let i = 0; i < 50; i++) {
      const level = levels[Math.floor(Math.random() * levels.length)]
      const now = new Date()
      const timestamp = new Date(now.getTime() - Math.random() * 86400000)

      logs.push({
        id: `log-${i}`,
        level: level,
        message: messages[Math.floor(Math.random() * messages.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        timestamp: timestamp.toISOString(),
        context: {
          userId: `user-${Math.floor(Math.random() * 100)}`,
          sessionId: `session-${Math.floor(Math.random() * 50)}`
        }
      })
    }
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  /**
   * 加载所有数据
   */
  const loadAllData = useCallback(async () => {
    await Promise.all([fetchLogSources(), fetchLogs()])
  }, [fetchLogSources, fetchLogs])

  // 初始加载
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // 自动刷新
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 30000)
      setRefreshInterval(interval)
      return () => clearInterval(interval)
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
    }
  }, [autoRefresh, fetchLogs])

  // 当日志源改变时，重置分页
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [selectedSource])

  /**
   * 处理日志源改变
   */
  const handleSourceChange = (source) => {
    setSelectedSource(source)
  }

  /**
   * 处理搜索
   */
  const handleSearch = (query) => {
    setSearchQuery(query)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  /**
   * 处理级别过滤
   */
  const handleLevelFilter = (level) => {
    setLevelFilter(level)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  /**
   * 处理时间范围过滤
   */
  const handleTimeRangeChange = (range) => {
    setTimeRange(range)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  /**
   * 处理分页改变
   */
  const handlePageChange = (page, limit) => {
    setPagination(prev => ({ ...prev, page, limit }))
  }

  /**
   * 手动刷新
   */
  const handleRefresh = () => {
    fetchLogs()
  }

  /**
   * 导出日志
   */
  const handleExportLogs = () => {
    const logData = logs.map(log => ({
      time: new Date(log.timestamp).toLocaleString('zh-CN'),
      level: log.level,
      message: log.message,
      source: log.source
    }))

    const csvContent = [
      ['time', 'level', 'message', 'source'].join(','),
      ...logData.map(row =>
        [row['time'], row['level'], `"${row['message']}"`, row['source']].join(',')
      )
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `logs-${selectedSource}-${new Date().toISOString().slice(0, 19)}.csv`
    link.click()
  }

  return (
    <div className="logs-page">
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* 顶部控制栏 */}
      <div className="logs-controls">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <LogSourceSelector
              sources={logSources}
              selectedSource={selectedSource}
              onChange={handleSourceChange}
            />
          </Col>
          <Col xs={24} sm={16} md={12}>
            <LogSearchBar
              onSearch={handleSearch}
              onLevelFilter={handleLevelFilter}
              onTimeRangeChange={handleTimeRangeChange}
              levelFilter={levelFilter}
              timeRange={timeRange}
            />
          </Col>
          <Col xs={24} sm={12} md={3}>
            <div className="auto-refresh-control">
              <span>自动刷新</span>
              <Switch
                checked={autoRefresh}
                onChange={setAutoRefresh}
                size="small"
              />
            </div>
          </Col>
          <Col xs={24} sm={6} md={3}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
              block
            >
              刷新
            </Button>
          </Col>
          <Col xs={24} sm={6} md={2}>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportLogs}
              block
            >
              导出
            </Button>
          </Col>
        </Row>
      </div>

      {/* 日志展示区 */}
      <div className="logs-content">
        {loading && logs.length === 0 ? (
          <div className="logs-loading">
            <Spin size="large" tip="加载日志中..." />
          </div>
        ) : (
          <>
            <LogViewer logs={logs} searchQuery={searchQuery} />
            <LogPagination
              current={pagination.page}
              pageSize={pagination.limit}
              total={pagination.total}
              onChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default Logs
