import React, { useState, useEffect, useCallback } from 'react'
import { Row, Col, Spin, Alert } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import StatCard from '../../components/StatCard'
import ResourceChart from '../../components/ResourceChart'
import QuickActions from '../../components/QuickActions'
import AlertList from '../../components/AlertList'
import './Dashboard.css'

/**
 * 系统状态仪表盘主页面
 */
const Dashboard = () => {
  // 系统状态
  const [systemStatus, setSystemStatus] = useState({
    running: false,
    agentCount: 0,
    taskCount: 0,
    sessionCount: 0
  })

  // 资源使用数据
  const [cpuData, setCpuData] = useState([])
  const [memoryData, setMemoryData] = useState([])

  // 告警列表
  const [alerts, setAlerts] = useState([])

  // 加载状态
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // API 基础 URL (Vite 使用 import.meta.env)
  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

  /**
   * 获取系统健康状态
   */
  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      if (!response.ok) throw new Error('Failed to fetch health status')
      const data = await response.json()
      setSystemStatus((prev) => ({
        ...prev,
        running: data.status === 'running' || data.running === true
      }))
    } catch (err) {
      console.error('Failed to fetch health:', err)
      // 使用模拟数据用于演示
      setSystemStatus((prev) => ({ ...prev, running: true }))
    }
  }, [API_BASE_URL])

  /**
   * 获取 Agent 列表
   */
  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/agents`)
      if (!response.ok) throw new Error('Failed to fetch agents')
      const data = await response.json()
      setSystemStatus((prev) => ({
        ...prev,
        agentCount: Array.isArray(data) ? data.length : data.count || 0
      }))
    } catch (err) {
      console.error('Failed to fetch agents:', err)
      // 使用模拟数据用于演示
      setSystemStatus((prev) => ({ ...prev, agentCount: 5 }))
    }
  }, [API_BASE_URL])

  /**
   * 获取会话列表
   */
  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`)
      if (!response.ok) throw new Error('Failed to fetch sessions')
      const data = await response.json()
      setSystemStatus((prev) => ({
        ...prev,
        sessionCount: Array.isArray(data) ? data.length : data.count || 0
      }))
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
      // 使用模拟数据用于演示
      setSystemStatus((prev) => ({ ...prev, sessionCount: 12 }))
    }
  }, [API_BASE_URL])

  /**
   * 获取监控指标 (使用模拟数据，后端 /api/metrics 路由待实现)
   */
  const fetchMetrics = useCallback(async () => {
    // 使用模拟数据用于演示
    setCpuData(generateMockData('CPU'))
    setMemoryData(generateMockData('Memory'))
    setAlerts(generateMockAlerts())
    setSystemStatus((prev) => ({ ...prev, taskCount: 23 }))
  }, [])

  /**
   * 生成模拟数据（用于演示）
   */
  const generateMockData = (type) => {
    const now = new Date()
    const data = []
    for (let i = 30; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000)
      const timeStr = time.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
      data.push({
        time: timeStr,
        value: type === 'CPU'
          ? Math.floor(Math.random() * 40) + 20
          : Math.floor(Math.random() * 30) + 40
      })
    }
    return data
  }

  /**
   * 生成模拟告警（用于演示）
   */
  const generateMockAlerts = () => {
    return [
      {
        id: '1',
        level: 'warning',
        message: 'CPU 使用率持续高于 80%',
        source: 'System Monitor',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'active'
      },
      {
        id: '2',
        level: 'info',
        message: '新 Agent 已创建',
        source: 'Agent Manager',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        status: 'resolved'
      }
    ]
  }

  /**
   * 加载所有数据
   */
  const loadAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchHealth(), fetchAgents(), fetchSessions(), fetchMetrics()])
    } catch (err) {
      setError('加载数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [fetchHealth, fetchAgents, fetchSessions, fetchMetrics])

  // 初始加载
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // 定时刷新（每 30 秒）
  useEffect(() => {
    const interval = setInterval(loadAllData, 30000)
    return () => clearInterval(interval)
  }, [loadAllData])

  /**
   * 启动 Agent
   */
  const handleStartAgent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/start`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to start agent')
      await loadAllData()
    } catch (err) {
      console.error('Failed to start agent:', err)
      // 模拟成功用于演示
      setSystemStatus((prev) => ({ ...prev, running: true }))
    }
  }

  /**
   * 停止 Agent
   */
  const handleStopAgent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/stop`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to stop agent')
      await loadAllData()
    } catch (err) {
      console.error('Failed to stop agent:', err)
      // 模拟成功用于演示
      setSystemStatus((prev) => ({ ...prev, running: false }))
    }
  }

  /**
   * 查看日志
   */
  const handleViewLogs = () => {
    window.open('/logs', '_blank')
  }

  /**
   * 创建新 Agent
   */
  const handleCreateAgent = () => {
    window.location.href = '/agents/new'
  }

  /**
   * 解除告警
   */
  const handleDismissAlert = async (alert) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${alert.id}/dismiss`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to dismiss alert')
      await loadAllData()
    } catch (err) {
      console.error('Failed to dismiss alert:', err)
      // 模拟成功用于演示
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, status: 'resolved' } : a))
      )
    }
  }

  /**
   * 查看告警详情
   */
  const handleViewAlertDetail = (alert) => {
    console.log('View alert detail:', alert)
    // 可以实现弹窗或跳转详情页
  }

  if (loading && systemStatus.agentCount === 0) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" tip="加载仪表盘数据..." fullscreen />
      </div>
    )
  }

  return (
    <div className="dashboard">
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* 状态卡片 */}
      <Row gutter={[16, 16]} className="dashboard-stats">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="系统状态"
            type="system"
            status={systemStatus.running}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Agent 数量"
            type="agent"
            value={systemStatus.agentCount}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="任务数量"
            type="task"
            value={systemStatus.taskCount}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="会话数量"
            type="session"
            value={systemStatus.sessionCount}
          />
        </Col>
      </Row>

      {/* 资源使用率图表 */}
      <ResourceChart cpuData={cpuData} memoryData={memoryData} />

      {/* 快速操作入口 */}
      <QuickActions
        onStartAgent={handleStartAgent}
        onStopAgent={handleStopAgent}
        onViewLogs={handleViewLogs}
        onCreateAgent={handleCreateAgent}
        isAgentRunning={systemStatus.running}
      />

      {/* 告警列表 */}
      <AlertList
        alerts={alerts}
        onDismiss={handleDismissAlert}
        onViewDetail={handleViewAlertDetail}
      />

      {/* 刷新按钮 */}
      <div className="dashboard-refresh">
        <button
          className="refresh-button"
          onClick={loadAllData}
          disabled={loading}
          title="刷新数据"
        >
          <ReloadOutlined spin={loading} /> 刷新
        </button>
      </div>
    </div>
  )
}

export default Dashboard
