import React, { useState, useMemo } from 'react'
import { Card, Select, Radio, Space, Alert, Button, Tag } from 'antd'
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
import { DownloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

const { Option } = Select

/**
 * 网络流量图表组件
 * @param {Object} props
 * @param {Array} props.data - 网络流量历史数据 [{time, rx, tx, rxRate, txRate}]
 * @param {Function} props.onTimeRangeChange - 时间范围变化回调
 * @param {String} props.timeRange - 当前时间范围 (1h/24h/7d)
 */
const NetworkChart = ({ data = [], onTimeRangeChange, timeRange = '1h' }) => {
  const [chartType, setChartType] = useState('area')
  const [unit, setUnit] = useState('Mbps') // Mbps, Kbps, GB

  // 网络阈值 (Mbps)
  const NETWORK_WARNING_THRESHOLD = 800
  const NETWORK_CRITICAL_THRESHOLD = 950

  // 检查是否超过阈值
  const hasWarning = useMemo(() => {
    return data.some(item => {
      const totalRate = (item.rxRate || 0) + (item.txRate || 0)
      return totalRate >= NETWORK_WARNING_THRESHOLD && totalRate < NETWORK_CRITICAL_THRESHOLD
    })
  }, [data])

  const hasCritical = useMemo(() => {
    return data.some(item => {
      const totalRate = (item.rxRate || 0) + (item.txRate || 0)
      return totalRate >= NETWORK_CRITICAL_THRESHOLD
    })
  }, [data])

  // 当前接收速率
  const currentRx = data.length > 0 ? (data[data.length - 1].rxRate || 0) : 0

  // 当前发送速率
  const currentTx = data.length > 0 ? (data[data.length - 1].txRate || 0) : 0

  // 总速率
  const currentTotal = currentRx + currentTx

  // 平均接收速率
  const avgRx = useMemo(() => {
    if (data.length === 0) return 0
    const sum = data.reduce((acc, item) => acc + (item.rxRate || 0), 0)
    return (sum / data.length).toFixed(2)
  }, [data])

  // 平均发送速率
  const avgTx = useMemo(() => {
    if (data.length === 0) return 0
    const sum = data.reduce((acc, item) => acc + (item.txRate || 0), 0)
    return (sum / data.length).toFixed(2)
  }, [data])

  // 最大接收速率
  const maxRx = useMemo(() => {
    if (data.length === 0) return 0
    return Math.max(...data.map(item => item.rxRate || 0))
  }, [data])

  // 最大发送速率
  const maxTx = useMemo(() => {
    if (data.length === 0) return 0
    return Math.max(...data.map(item => item.txRate || 0))
  }, [data])

  // 总接收量 (GB)
  const totalRxGB = data.length > 0 && data[0].rx 
    ? (data[0].rx / 1024 / 1024 / 1024).toFixed(2) 
    : '0'

  // 总发送量 (GB)
  const totalTxGB = data.length > 0 && data[0].tx 
    ? (data[0].tx / 1024 / 1024 / 1024).toFixed(2) 
    : '0'

  // 转换速率单位
  const formatRate = (rate) => {
    if (unit === 'Kbps') return (rate * 1000).toFixed(2)
    if (unit === 'GB') return (rate / 1000).toFixed(4)
    return rate.toFixed(2)
  }

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
      tick: { fontSize: 12 },
      label: { value: `速率 (${unit})`, angle: -90, position: 'insideLeft' }
    }

    const tooltipProps = {
      formatter: (value, name) => {
        const formattedValue = formatRate(value)
        if (name === '接收') return `${formattedValue} ${unit}`
        if (name === '发送') return `${formattedValue} ${unit}`
        if (name === '总计') return `${formattedValue} ${unit}`
        return `${value} ${unit}`
      },
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
            <Line
              type="monotone"
              dataKey="rxRate"
              stroke="#1890ff"
              strokeWidth={2}
              dot={false}
              name="接收"
            />
            <Line
              type="monotone"
              dataKey="txRate"
              stroke="#52c41a"
              strokeWidth={2}
              dot={false}
              name="发送"
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
            <Bar dataKey="rxRate" fill="#1890ff" name="接收" />
            <Bar dataKey="txRate" fill="#52c41a" name="发送" />
          </BarChart>
        )
      case 'area':
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#52c41a" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Legend />
            <Area
              type="monotone"
              dataKey="rxRate"
              stroke="#1890ff"
              fillOpacity={1}
              fill="url(#colorRx)"
              name="接收"
            />
            <Area
              type="monotone"
              dataKey="txRate"
              stroke="#52c41a"
              fillOpacity={1}
              fill="url(#colorTx)"
              name="发送"
            />
          </AreaChart>
        )
    }
  }

  // 导出数据
  const handleExport = () => {
    const csvContent = [
      ['时间', '接收速率 (Mbps)', '发送速率 (Mbps)', '总速率 (Mbps)', '累计接收 (MB)', '累计发送 (MB)'],
      ...data.map(item => [
        item.time,
        item.rxRate || 0,
        item.txRate || 0,
        (item.rxRate || 0) + (item.txRate || 0),
        item.rx || 0,
        item.tx || 0
      ])
    ]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `network-traffic-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  return (
    <Card
      title="网络流量"
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
          <Select
            value={unit}
            onChange={setUnit}
            style={{ width: 80 }}
          >
            <Option value="Mbps">Mbps</Option>
            <Option value="Kbps">Kbps</Option>
            <Option value="GB">Gbps</Option>
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
          message="网络流量严重过高"
          description={`当前网络总速率已达到 ${formatRate(currentTotal)} ${unit}，超过临界阈值`}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}
      {hasWarning && !hasCritical && (
        <Alert
          message="网络流量警告"
          description={`当前网络总速率为 ${formatRate(currentTotal)} ${unit}，超过警告阈值`}
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* 统计卡片 */}
      <Space size="large" style={{ marginBottom: '16px' }}>
        <div>
          <span style={{ color: '#8c8c8c' }}>
            <ArrowDownOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
            当前接收:
          </span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', marginLeft: '8px', color: '#1890ff' }}>
            {formatRate(currentRx)} {unit}
          </span>
        </div>
        <div>
          <span style={{ color: '#8c8c8c' }}>
            <ArrowUpOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
            当前发送:
          </span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', marginLeft: '8px', color: '#52c41a' }}>
            {formatRate(currentTx)} {unit}
          </span>
        </div>
        <div>
          <span style={{ color: '#8c8c8c' }}>总速率:</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', marginLeft: '8px', color: currentTotal > NETWORK_CRITICAL_THRESHOLD ? '#ff4d4f' : currentTotal > NETWORK_WARNING_THRESHOLD ? '#faad14' : '#8c8c8c' }}>
            {formatRate(currentTotal)} {unit}
          </span>
        </div>
      </Space>

      {/* 平均和峰值 */}
      <Space size="large" style={{ marginBottom: '16px' }}>
        <div>
          <span style={{ color: '#8c8c8c' }}>平均接收:</span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', marginLeft: '8px' }}>{formatRate(avgRx)} {unit}</span>
        </div>
        <div>
          <span style={{ color: '#8c8c8c' }}>平均发送:</span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', marginLeft: '8px' }}>{formatRate(avgTx)} {unit}</span>
        </div>
        <div>
          <span style={{ color: '#8c8c8c' }}>峰值接收:</span>
          <Tag color="blue">{formatRate(maxRx)} {unit}</Tag>
        </div>
        <div>
          <span style={{ color: '#8c8c8c' }}>峰值发送:</span>
          <Tag color="green">{formatRate(maxTx)} {unit}</Tag>
        </div>
      </Space>

      {/* 累计流量 */}
      <Space size="large" style={{ marginBottom: '16px' }}>
        <div>
          <span style={{ color: '#8c8c8c' }}>累计接收:</span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', marginLeft: '8px' }}>{totalRxGB} GB</span>
        </div>
        <div>
          <span style={{ color: '#8c8c8c' }}>累计发送:</span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', marginLeft: '8px' }}>{totalTxGB} GB</span>
        </div>
      </Space>

      {/* 图表 */}
      <ResponsiveContainer width="100%" height={chartConfig.height}>
        {renderChart()}
      </ResponsiveContainer>
    </Card>
  )
}

export default NetworkChart
