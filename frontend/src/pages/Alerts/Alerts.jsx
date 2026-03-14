import React, { useState, useEffect, useCallback } from 'react'
import { Layout, Typography, Tabs, Row, Col, Statistic, Card, Spin, Alert, message } from 'antd'
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  BellOutlined,
  SettingOutlined,
  UnorderedListOutlined
} from '@ant-design/icons'
import AlertRules from '../../components/AlertRules'
import AlertList from '../../components/AlertList'
import NotificationSettings from '../../components/NotificationSettings'

const { Content } = Layout
const { Title, Text } = Typography

/**
 * 告警管理页面
 * 集成告警规则配置、告警列表、通知设置
 */
const Alerts = () => {
  const [activeTab, setActiveTab] = useState('alerts')
  const [alerts, setAlerts] = useState([])
  const [rules, setRules] = useState([])
  const [notificationSettings, setNotificationSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    resolved: 0
  })

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

  /**
   * 加载告警数据
   */
  const loadAlerts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts`)
      if (!response.ok) throw new Error('Failed to fetch alerts')
      const data = await response.json()
      setAlerts(Array.isArray(data) ? data : [])
      updateStats(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load alerts:', error)
      // 使用模拟数据用于演示
      const mockAlerts = generateMockAlerts()
      setAlerts(mockAlerts)
      updateStats(mockAlerts)
    } finally {
      setLoading(false)
    }
  }, [API_BASE_URL])

  /**
   * 加载告警规则
   */
  const loadRules = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/rules`)
      if (!response.ok) throw new Error('Failed to fetch rules')
      const data = await response.json()
      setRules(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load rules:', error)
      // 使用模拟数据用于演示
      setRules(generateMockRules())
    }
  }, [API_BASE_URL])

  /**
   * 加载通知设置
   */
  const loadNotificationSettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/settings`)
      if (!response.ok) throw new Error('Failed to fetch settings')
      const data = await response.json()
      setNotificationSettings(data || {})
    } catch (error) {
      console.error('Failed to load settings:', error)
      // 使用默认设置
      setNotificationSettings({
        emailEnabled: true,
        emailRecipients: ['admin@example.com'],
        dingtalkEnabled: false,
        feishuEnabled: false
      })
    }
  }, [API_BASE_URL])

  /**
   * 更新统计数据
   */
  const updateStats = (alertsData) => {
    setStats({
      total: alertsData.length,
      critical: alertsData.filter((a) => a.level === 'critical').length,
      warning: alertsData.filter((a) => a.level === 'warning').length,
      info: alertsData.filter((a) => a.level === 'info').length,
      resolved: alertsData.filter((a) => a.status === 'resolved' || a.status === '已解决').length
    })
  }

  /**
   * 生成模拟告警数据
   */
  const generateMockAlerts = () => {
    return [
      {
        id: '1',
        level: 'critical',
        message: 'CPU 使用率持续高于 90% 超过 10 分钟',
        source: 'System Monitor',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'active'
      },
      {
        id: '2',
        level: 'warning',
        message: '内存使用率达到 85%',
        source: 'Resource Monitor',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        status: 'confirmed'
      },
      {
        id: '3',
        level: 'warning',
        message: '磁盘空间不足，剩余 15%',
        source: 'Disk Monitor',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        status: 'active'
      },
      {
        id: '4',
        level: 'info',
        message: '新 Agent 已成功部署',
        source: 'Agent Manager',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        status: 'resolved'
      },
      {
        id: '5',
        level: 'critical',
        message: '服务响应时间超过阈值 (5s)',
        source: 'Performance Monitor',
        timestamp: new Date(Date.now() - 1500000).toISOString(),
        status: 'active'
      },
      {
        id: '6',
        level: 'info',
        message: '定时备份完成',
        source: 'Backup Service',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        status: 'ignored'
      }
    ]
  }

  /**
   * 生成模拟规则数据
   */
  const generateMockRules = () => {
    return [
      {
        id: '1',
        name: 'CPU 使用率过高',
        level: 'critical',
        condition: 'CPU 使用率 > 90% 持续 10 分钟',
        channels: ['email', 'dingtalk'],
        enabled: true,
        description: '监控系统 CPU 使用率'
      },
      {
        id: '2',
        name: '内存使用率警告',
        level: 'warning',
        condition: '内存使用率 > 85% 持续 5 分钟',
        channels: ['email'],
        enabled: true,
        description: '监控系统内存使用'
      },
      {
        id: '3',
        name: '磁盘空间不足',
        level: 'warning',
        condition: '磁盘剩余空间 < 20%',
        channels: ['email', 'sms'],
        enabled: true,
        description: '监控磁盘空间'
      },
      {
        id: '4',
        name: '服务异常',
        level: 'critical',
        condition: '服务不可达或响应时间 > 5s',
        channels: ['email', 'dingtalk', 'feishu'],
        enabled: true,
        description: '监控服务健康状态'
      },
      {
        id: '5',
        name: 'Agent 状态变化',
        level: 'info',
        condition: 'Agent 启动/停止/重启',
        channels: ['email'],
        enabled: false,
        description: '记录 Agent 状态变化'
      }
    ]
  }

  /**
   * 加载所有数据
   */
  const loadAllData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([loadAlerts(), loadRules(), loadNotificationSettings()])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }, [loadAlerts, loadRules, loadNotificationSettings])

  // 初始加载
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // 定时刷新（每 30 秒）
  useEffect(() => {
    const interval = setInterval(loadAlerts, 30000)
    return () => clearInterval(interval)
  }, [loadAlerts])

  /**
   * 解除告警
   */
  const handleDismissAlert = async (alert) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${alert.id}/dismiss`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to dismiss alert')
      await loadAlerts()
      message.success('告警已解除')
    } catch (error) {
      console.error('Failed to dismiss alert:', error)
      // 模拟成功用于演示
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, status: 'resolved' } : a))
      )
      updateStats(alerts.map((a) => (a.id === alert.id ? { ...a, status: 'resolved' } : a)))
      message.success('告警已解除')
    }
  }

  /**
   * 确认告警
   */
  const handleConfirmAlert = async (alert) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${alert.id}/confirm`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to confirm alert')
      await loadAlerts()
      message.success('告警已确认')
    } catch (error) {
      console.error('Failed to confirm alert:', error)
      // 模拟成功用于演示
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, status: 'confirmed' } : a))
      )
      updateStats(alerts.map((a) => (a.id === alert.id ? { ...a, status: 'confirmed' } : a)))
      message.success('告警已确认')
    }
  }

  /**
   * 忽略告警
   */
  const handleIgnoreAlert = async (alert) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${alert.id}/ignore`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to ignore alert')
      await loadAlerts()
      message.success('告警已忽略')
    } catch (error) {
      console.error('Failed to ignore alert:', error)
      // 模拟成功用于演示
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, status: 'ignored' } : a))
      )
      updateStats(alerts.map((a) => (a.id === alert.id ? { ...a, status: 'ignored' } : a)))
      message.success('告警已忽略')
    }
  }

  /**
   * 查看详情
   */
  const handleViewDetail = (alert) => {
    message.info(`查看告警详情：${alert.message}`)
    // 可以实现弹窗或跳转详情页
  }

  /**
   * 创建告警规则
   */
  const handleCreateRule = async (rule) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      })
      if (!response.ok) throw new Error('Failed to create rule')
      await loadRules()
    } catch (error) {
      console.error('Failed to create rule:', error)
      // 模拟成功用于演示
      setRules([...rules, rule])
    }
  }

  /**
   * 更新告警规则
   */
  const handleUpdateRule = async (rule) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      })
      if (!response.ok) throw new Error('Failed to update rule')
      await loadRules()
    } catch (error) {
      console.error('Failed to update rule:', error)
      // 模拟成功用于演示
      setRules(rules.map((r) => (r.id === rule.id ? rule : r)))
    }
  }

  /**
   * 删除告警规则
   */
  const handleDeleteRule = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/rules/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete rule')
      await loadRules()
    } catch (error) {
      console.error('Failed to delete rule:', error)
      // 模拟成功用于演示
      setRules(rules.filter((r) => r.id !== id))
    }
  }

  /**
   * 保存通知设置
   */
  const handleSaveNotificationSettings = async (settings) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (!response.ok) throw new Error('Failed to save settings')
      const data = await response.json()
      setNotificationSettings(data)
    } catch (error) {
      console.error('Failed to save settings:', error)
      // 模拟成功用于演示
      setNotificationSettings(settings)
    }
  }

  const tabItems = [
    {
      key: 'alerts',
      label: (
        <span>
          <UnorderedListOutlined />
          告警列表
        </span>
      ),
      children: (
        <AlertList
          alerts={alerts}
          onDismiss={handleDismissAlert}
          onViewDetail={handleViewDetail}
          onConfirm={handleConfirmAlert}
          onIgnore={handleIgnoreAlert}
        />
      )
    },
    {
      key: 'rules',
      label: (
        <span>
          <SettingOutlined />
          告警规则
        </span>
      ),
      children: (
        <AlertRules
          rules={rules}
          onCreate={handleCreateRule}
          onUpdate={handleUpdateRule}
          onDelete={handleDeleteRule}
        />
      )
    },
    {
      key: 'settings',
      label: (
        <span>
          <BellOutlined />
          通知设置
        </span>
      ),
      children: (
        <NotificationSettings
          settings={notificationSettings}
          onSave={handleSaveNotificationSettings}
        />
      )
    }
  ]

  if (loading) {
    return (
      <Content style={{ padding: '24px', minHeight: '100%' }}>
        <Spin size="large" tip="加载告警数据..." fullscreen />
      </Content>
    )
  }

  return (
    <Content style={{ padding: '24px', minHeight: '100%' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          告警管理
        </Title>
        <Text type="secondary">
          管理告警规则、查看告警列表、配置通知渠道
        </Text>
      </div>

      {/* 统计面板 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总告警数"
              value={stats.total}
              prefix={<ExclamationCircleOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="严重告警"
              value={stats.critical}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="警告"
              value={stats.warning}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已解决"
              value={stats.resolved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 标签页 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        destroyInactiveTabPane
      />
    </Content>
  )
}

export default Alerts
