import React, { useState, useMemo } from 'react'
import { Card, Select, Radio, Space, Alert, Button } from 'antd'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { DownloadOutlined } from '@ant-design/icons'

const { Option } = Select

/**
 * CPU 使用率图表组件
 * @param {Object} props
 * @param {Array} props.data - CPU 使用率历史数据 [{time, value, usage, system, user}]
 * @param {Function} props.onTimeRangeChange - 时间范围变化回调
 * @param {String} props.timeRange - 当前时间范围 (1h/24h/7d)
 */
const CpuChart = ({ data = [], onTimeRangeChange, timeRange = '1h' }) => {
  const [chartType, setChartType] = useState('area') // line, area, bar
  const [showThreshold, setShowThreshold] = useState(true)
  
  // CPU 阈值
  const CPU_WARNING_THRESHOLD = 70
  const CPU_CRITICAL_THRESHOLD = 90

  // 检查是否超过阈值
  const hasWarning = useMemo(() => {
    return data.some(item => item.value >= CPU_WARNING_THRESHOLD && item.value < CPU_CRITICAL_THRESHOLD)
  }, [data])

  const hasCritical = useMemo(() => {
    return data.some(item => item.value >= CPU_CRITICAL_THRESHOLD)
  }, [data])

  // 当前 CPU 使用率
  const currentCpu = data.length > 0 ? data[data.length - 1].value : 0

  // 平均 CPU 使用率
  const avgCpu = useMemo(() => {
    if (data.length === 0) return 0
    const sum = data.reduce((acc, item) => acc + item.value, 0)
    return (sum / data.length).toFixed(1)
  }, [data])

  // 最大 CPU 使用率
  const maxCpu = useMemo(() => {
    if (data.length === 0) return 0
    return Math.max(...data.map(item => item.value))
  }, [data])

  // 图表配置
  const chartConfig = {
    height: 300,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial'
  }

  // 渲染图表
  const renderChart = () => {
    const commonProps = {
      data,
      style: chartConfig
    }

    const gridProps = {
      strokeDasharray: '3 3',
      stroke: '#f0f0f0'
    }

    const xAxisProps = {
      dataKey: 'time',
      tick: { fontSize: 12 },
      label: { value: '时间', position: 'insideBottom', offset: -5 }
    }

    const yAxisProps = {
      domain: [0, 100],
      tick: { fontSize: 12 },
      label: { value: '使用率 (%)', angle: -90, position: 'insideLeft' }
    }

    const tooltipProps = {
      formatter: (value) => `${value}%`,
      contentStyle: { borderRadius: '4px', border: '1px solid #f0f0f0' }
    }

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Legend />
            {showThreshold && (
              <>
                <ReferenceLine
                  y={CPU_WARNING_THRESHOLD}
                  stroke="#faad14"
                  strokeDasharray="3 3"
                  label="警告"
                />
                <ReferenceLine
                  y={CPU_CRITICAL_THRESHOLD}
                  stroke="#ff4d4f"
                  strokeDasharray="3 3"
                  label="严重"
                />
              </>
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1890ff"
              strokeWidth={2}
              dot={false}
              name="CPU 使用率"
            />
          </LineChart>
        )
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Legend />
            {showThreshold && (
              <>
                <ReferenceLine
                  y={CPU_WARNING_THRESHOLD}
                  stroke="#faad14"
                  strokeDasharray="3 3"
                  label="警告"
                />
                <ReferenceLine
                  y={CPU_CRITICAL_THRESHOLD}
                  stroke="#ff4d4f"
                  strokeDasharray="3 3"
                  label="严重"
                />
              </>
            )}
            <Bar dataKey="value" fill="#1890ff" name="CPU 使用率" />
          </BarChart>
        )
      case 'area':
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Legend />
            {showThreshold && (
              <>
                <ReferenceLine
                  y={CPU_WARNING_THRESHOLD}
                  stroke="#faad14"
                  strokeDasharray="3 3"
                  label="警告"
                />
                <ReferenceLine
                  y={CPU_CRITICAL_THRESHOLD}
                  stroke="#ff4d4f"
                  strokeDasharray="3 3"
                  label="严重"
                />
              </>
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#1890ff"
              fillOpacity={1}
              fill="url(#colorCpu)"
              name="CPU 使用率"
            />
          </AreaChart>
        )
    }
  }

  // 导出数据
  const handleExport = () => {
    const csvContent = [
      ['时间', 'CPU 使用率 (%)', '系统 (%)', '用户 (%)'],
      ...data.map(item => [
        item.time,
        item.value,
        item.system || 0,
        item.user || 0
      ])
    ]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `cpu-usage-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  return (
    <Card
      title="CPU 使用率"
      variant="borderless"
      style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px' }}
      extra={
        <Space>
          <Select
            value={timeRange}
            onChange={onTimeRangeChange}
            style={{ width: 100 }}
          >
            <Option value="1h">1 小时</Option>
            <Option value="24h">24 小时</Option>
            <Option value="7d">7 天</Option>
          </Select>
          <Radio.Group value={chartType} onChange={(e) => setChartType(e.target.value)} buttonStyle="solid">
            <Radio.Button value="line">折线</Radio.Button>
            <Radio.Button value="area">面积</Radio.Button>
            <Radio.Button value="bar">柱状</Radio.Button>
          </Radio.Group>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      }
    >
      {/* 告警提示 */}
      {hasCritical && (
        <Alert
          message="CPU 使用率严重过高"
          description={`当前 CPU 使用率已达到 ${currentCpu}%，超过临界阈值 ${CPU_CRITICAL_THRESHOLD}%`}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}
      {hasWarning && !hasCritical && (
        <Alert
          message="CPU 使用率警告"
          description={`当前 CPU 使用率为 ${currentCpu}%，超过警告阈值 ${CPU_WARNING_THRESHOLD}%`}
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* 统计卡片 */}
      <Space size="large" style={{ marginBottom: '16px' }}>
        <div>
          <span style={{ color: '#8c8c8c' }}>当前:</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', marginLeft: '8px', color: currentCpu > CPU_CRITICAL_THRESHOLD ? '#ff4d4f' : currentCpu > CPU_WARNING_THRESHOLD ? '#faad14' : '#1890ff' }}>
            {currentCpu}%
          </span>
        </div>
        <div>
          <span style={{ color: '#8c8c8c' }}>平均:</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', marginLeft: '8px' }}>{avgCpu}%</span>
        </div>
        <div>
          <span style={{ color: '#8c8c8c' }}>峰值:</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', marginLeft: '8px' }}>{maxCpu}%</span>
        </div>
      </Space>

      {/* 图表 */}
      <ResponsiveContainer width="100%" height={chartConfig.height}>
        {renderChart()}
      </ResponsiveContainer>
    </Card>
  )
}

export default CpuChart
