import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Spin, Alert, Space, Button, Tabs } from 'antd'
import { ReloadOutlined, FullscreenOutlined } from '@ant-design/icons'
import CpuChart from '../../components/CpuChart'
import MemoryChart from '../../components/MemoryChart'
import DiskChart from '../../components/DiskChart'
import NetworkChart from '../../components/NetworkChart'
import './Metrics.css'

/**
 * 资源监控页面
 * 支持实时数据展示、历史趋势图、图表类型切换、阈值告警、数据导出
 */
const Metrics = () => {
  // 时间范围状态
  const [timeRange, setTimeRange] = useState('1h') // 1h, 24h, 7d

  // 数据状态
  const [cpuData, setCpuData] = useState([])
  const [memoryData, setMemoryData] = useState([])
  const [diskData, setDiskData] = useState([])
  const [diskDetails, setDiskDetails] = useState([])
  const [networkData, setNetworkData] = useState([])

  // 加载和错误状态
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  // 刷新间隔 (5 秒)
  const REFRESH_INTERVAL = 5000

  // API 基础 URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

  // 定时器引用
  const intervalRef = useRef(null)

  /**
   * 生成模拟数据（用于演示）
   */
  const generateMockMetrics = useCallback((type, count = 60) => {
    const now = new Date()
    const data = []
    const baseValue = type === 'cpu' ? 30 : type === 'memory' ? 50 : type === 'disk' ? 45 : 0
    const variance = type === 'cpu' ? 20 : type === 'memory' ? 15 : type === 'disk' ? 10 : 0

    for (let i = count - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000)
      const timeStr = time.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })

      if (type === 'cpu') {
        data.push({
          time: timeStr,
          value: Math.floor(Math.random() * variance * 2) + baseValue - variance,
          usage: Math.floor(Math.random() * 100),
          system: Math.floor(Math.random() * 20) + 5,
          user: Math.floor(Math.random() * 50) + 20
        })
      } else if (type === 'memory') {
        const total = 16 * 1024 * 1024 * 1024 // 16GB
        const usedPercent = Math.floor(Math.random() * variance * 2) + baseValue - variance
        const used = (total * usedPercent) / 100
        data.push({
          time: timeStr,
          value: usedPercent,
          used,
          available: total - used,
          total
        })
      } else if (type === 'disk') {
        const total = 500 * 1024 * 1024 * 1024 // 500GB
        const usedPercent = Math.floor(Math.random() * variance * 2) + baseValue - variance
        const used = (total * usedPercent) / 100
        data.push({
          time: timeStr,
          value: usedPercent,
          used,
          available: total - used,
          total
        })
      } else if (type === 'network') {
        const rxRate = Math.random() * 100 // Mbps
        const txRate = Math.random() * 50 // Mbps
        data.push({
          time: timeStr,
          rx: Math.random() * 1000 * 1024 * 1024, // MB
          tx: Math.random() * 500 * 1024 * 1024, // MB
          rxRate,
          txRate
        })
      }
    }
    return data
  }, [])

  /**
   * 生成模拟磁盘分区详情
   */
  const generateMockDiskDetails = useCallback(() => {
    return [
      {
        mount: '/',
        filesystem: '/dev/sda1',
        size: 500 * 1024 * 1024 * 1024,
        used: 225 * 1024 * 1024 * 1024,
        available: 275 * 1024 * 1024 * 1024,
        percent: 45
      },
      {
        mount: '/home',
        filesystem: '/dev/sda2',
        size: 1000 * 1024 * 1024 * 1024,
        used: 600 * 1024 * 1024 * 1024,
        available: 400 * 1024 * 1024 * 1024,
        percent: 60
      },
      {
        mount: '/var',
        filesystem: '/dev/sda3',
        size: 200 * 1024 * 1024 * 1024,
        used: 80 * 1024 * 1024 * 1024,
        available: 120 * 1024 * 1024 * 1024,
        percent: 40
      }
    ]
  }, [])

  /**
   * 获取 CPU 数据
   */
  const fetchCpuData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/cpu?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setCpuData(data.history || data)
      } else {
        // 使用模拟数据
        setCpuData(generateMockMetrics('cpu'))
      }
    } catch (err) {
      console.error('Failed to fetch CPU data:', err)
      setCpuData(generateMockMetrics('cpu'))
    }
  }, [API_BASE_URL, timeRange, generateMockMetrics])

  /**
   * 获取内存数据
   */
  const fetchMemoryData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/memory?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setMemoryData(data.history || data)
      } else {
        setMemoryData(generateMockMetrics('memory'))
      }
    } catch (err) {
      console.error('Failed to fetch memory data:', err)
      setMemoryData(generateMockMetrics('memory'))
    }
  }, [API_BASE_URL, timeRange, generateMockMetrics])

  /**
   * 获取磁盘数据
   */
  const fetchDiskData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/disk?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setDiskData(data.history || data.history || [])
        setDiskDetails(data.details || [])
      } else {
        setDiskData(generateMockMetrics('disk'))
        setDiskDetails(generateMockDiskDetails())
      }
    } catch (err) {
      console.error('Failed to fetch disk data:', err)
      setDiskData(generateMockMetrics('disk'))
      setDiskDetails(generateMockDiskDetails())
    }
  }, [API_BASE_URL, timeRange, generateMockMetrics, generateMockDiskDetails])

  /**
   * 获取网络数据
   */
  const fetchNetworkData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/network?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setNetworkData(data.history || data)
      } else {
        setNetworkData(generateMockMetrics('network'))
      }
    } catch (err) {
      console.error('Failed to fetch network data:', err)
      setNetworkData(generateMockMetrics('network'))
    }
  }, [API_BASE_URL, timeRange, generateMockMetrics])

  /**
   * 加载所有监控数据
   */
  const loadAllMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        fetchCpuData(),
        fetchMemoryData(),
        fetchDiskData(),
        fetchNetworkData()
      ])
      setLastUpdate(new Date())
    } catch (err) {
      setError('加载监控数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [fetchCpuData, fetchMemoryData, fetchDiskData, fetchNetworkData])

  // 初始加载
  useEffect(() => {
    loadAllMetrics()
  }, [loadAllMetrics])

  // 定时刷新（每 5 秒）
  useEffect(() => {
    // 清除之前的定时器
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // 设置新的定时器
    intervalRef.current = setInterval(() => {
      loadAllMetrics()
    }, REFRESH_INTERVAL)

    // 清理函数
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [loadAllMetrics])

  // 时间范围变化处理
  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange)
    // 时间范围变化时立即刷新数据
    loadAllMetrics()
  }

  // 手动刷新
  const handleRefresh = () => {
    loadAllMetrics()
  }

  // 全屏显示
  const handleFullscreen = () => {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen()
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen()
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen()
    }
  }

  if (loading && cpuData.length === 0) {
    return (
      <div className="metrics-loading">
        <Spin size="large" tip="加载监控数据..." fullscreen />
      </div>
    )
  }

  return (
    <div className="metrics">
      {/* 页面头部 */}
      <div className="metrics-header">
        <h1>资源监控</h1>
        <Space>
          {lastUpdate && (
            <span className="last-update">
              最后更新：{lastUpdate.toLocaleTimeString('zh-CN')}
            </span>
          )}
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={handleRefresh}
            disabled={loading}
          >
            刷新
          </Button>
          <Button icon={<FullscreenOutlined />} onClick={handleFullscreen}>
            全屏
          </Button>
        </Space>
      </div>

      {/* 错误提示 */}
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

      {/* 标签页切换 */}
      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: 'overview',
            label: '总览',
            children: (
              <>
                <CpuChart
                  data={cpuData}
                  timeRange={timeRange}
                  onTimeRangeChange={handleTimeRangeChange}
                />
                <MemoryChart
                  data={memoryData}
                  timeRange={timeRange}
                  onTimeRangeChange={handleTimeRangeChange}
                />
              </>
            )
          },
          {
            key: 'disk',
            label: '磁盘',
            children: (
              <DiskChart
                data={diskData}
                diskDetails={diskDetails}
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
              />
            )
          },
          {
            key: 'network',
            label: '网络',
            children: (
              <NetworkChart
                data={networkData}
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
              />
            )
          }
        ]}
      />
    </div>
  )
}

export default Metrics
