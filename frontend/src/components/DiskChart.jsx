import React, { useState, useMemo } from 'react'
import { Card, Select, Radio, Space, Alert, Button, Progress, Table, Tag } from 'antd'
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
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { DownloadOutlined } from '@ant-design/icons'

const { Option } = Select

/**
 * 磁盘使用率图表组件
 * @param {Object} props
 * @param {Array} props.data - 磁盘使用率历史数据 [{time, value, used, available, total}]
 * @param {Array} props.diskDetails - 磁盘分区详情 [{mount, filesystem, size, used, available, percent}]
 * @param {Function} props.onTimeRangeChange - 时间范围变化回调
 * @param {String} props.timeRange - 当前时间范围 (1h/24h/7d)
 */
const DiskChart = ({ data = [], diskDetails = [], onTimeRangeChange, timeRange = '1h' }) => {
  const [chartType, setChartType] = useState('area')
  const [showThreshold, setShowThreshold] = useState(true)
  
  // 磁盘阈值
  const DISK_WARNING_THRESHOLD = 80
  const DISK_CRITICAL_THRESHOLD = 95

  // 检查是否超过阈值
  const hasWarning = useMemo(() => {
    return data.some(item => item.value >= DISK_WARNING_THRESHOLD && item.value < DISK_CRITICAL_THRESHOLD)
  }, [data])

  const hasCritical = useMemo(() => {
    return data.some(item => item.value >= DISK_CRITICAL_THRESHOLD)
  }, [data])

  // 当前磁盘使用率
  const currentDisk = data.length > 0 ? data[data.length - 1].value : 0

  // 平均磁盘使用率
  const avgDisk = useMemo(() => {
    if (data.length === 0) return 0
    const sum = data.reduce((acc, item) => acc + item.value, 0)
    return (sum / data.length).toFixed(1)
  }, [data])

  // 最大磁盘使用率
  const maxDisk = useMemo(() => {
    if (data.length === 0) return 0
    return Math.max(...data.map(item => item.value))
  }, [data])

  // 总磁盘空间 (GB)
  const totalDiskGB = data.length > 0 && data[0].total ? (data[0].total / 1024 / 1024 / 1024).toFixed(1) : 'N/A'

  // 已用磁盘空间 (GB)
  const usedDiskGB = data.length > 0 && data[data.length - 1].used 
    ? (data[data.length - 1].used / 1024 / 1024 / 1024).toFixed(1) 
    : '0'

  // 可用磁盘空间 (GB)
  const availableDiskGB = data.length > 0 && data[data.length - 1].available 
    ? (data[data.length - 1].available / 1024 / 1024 / 1024).toFixed(1) 
    : '0'

  // 饼图数据
  const pieData = useMemo(() => {
    if (data.length === 0) return []
    const lastItem = data[data.length - 1]
    return [
      { name: '已用', value: lastItem.used || 0 },
      { name: '可用', value: lastItem.available || 0 }
    ]
  }, [data])

  const COLORS = ['#1890ff', '#52c41a']

  // 图表配置
  const chartConfig = {
    height: 300,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial'
  }

  // 渲染主图表
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
                  y={DISK_WARNING_THRESHOLD}
                  stroke="#faad14"
                  strokeDasharray="3 3"
                  label="警告"
                />
                <ReferenceLine
                  y={DISK_CRITICAL_THRESHOLD}
                  stroke="#ff4d4f"
                  strokeDasharray="3 3"
                  label="严重"
                />
              </>
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#52c41a"
              strokeWidth={2}
              dot={false}
              name="磁盘使用率"
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
                  y={DISK_WARNING_THRESHOLD}
                  stroke="#faad14"
                  strokeDasharray="3 3"
                  label="警告"
                />
                <ReferenceLine
                  y={DISK_CRITICAL_THRESHOLD}
                  stroke="#ff4d4f"
                  strokeDasharray="3 3"
                  label="严重"
                />
              </>
            )}
            <Bar dataKey="value" fill="#52c41a" name="磁盘使用率" />
          </BarChart>
        )
      case 'area':
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#52c41a" stopOpacity={0.1} />
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
                  y={DISK_WARNING_THRESHOLD}
                  stroke="#faad14"
                  strokeDasharray="3 3"
                  label="警告"
                />
                <ReferenceLine
                  y={DISK_CRITICAL_THRESHOLD}
                  stroke="#ff4d4f"
                  strokeDasharray="3 3"
                  label="严重"
                />
              </>
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#52c41a"
              fillOpacity={1}
              fill="url(#colorDisk)"
              name="磁盘使用率"
            />
          </AreaChart>
        )
    }
  }

  // 分区表格列
  const columns = [
    {
      title: '挂载点',
      dataIndex: 'mount',
      key: 'mount'
    },
    {
      title: '文件系统',
      dataIndex: 'filesystem',
      key: 'filesystem'
    },
    {
      title: '总大小',
      dataIndex: 'size',
      key: 'size',
      render: (size) => `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`
    },
    {
      title: '已用',
      dataIndex: 'used',
      key: 'used',
      render: (used) => `${(used / 1024 / 1024 / 1024).toFixed(1)} GB`
    },
    {
      title: '可用',
      dataIndex: 'available',
      key: 'available',
      render: (available) => `${(available / 1024 / 1024 / 1024).toFixed(1)} GB`
    },
    {
      title: '使用率',
      dataIndex: 'percent',
      key: 'percent',
      render: (percent) => {
        let color = '#52c41a'
        if (percent >= DISK_CRITICAL_THRESHOLD) color = '#ff4d4f'
        else if (percent >= DISK_WARNING_THRESHOLD) color = '#faad14'
        return <Tag color={color}>{percent}%</Tag>
      }
    }
  ]

  // 导出数据
  const handleExport = () => {
    const csvContent = [
      ['时间', '磁盘使用率 (%)', '已用 (MB)', '可用 (MB)', '总计 (MB)'],
      ...data.map(item => [
        item.time,
        item.value,
        item.used || 0,
        item.available || 0,
        item.total || 0
      ])
    ]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `disk-usage-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  return (
    <Card
      title="磁盘使用率"
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
          message="磁盘使用率严重过高"
          description={`当前磁盘使用率已达到 ${currentDisk}%，超过临界阈值 ${DISK_CRITICAL_THRESHOLD}%`}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}
      {hasWarning && !hasCritical && (
        <Alert
          message="磁盘使用率警告"
          description={`当前磁盘使用率为 ${currentDisk}%，超过警告阈值 ${DISK_WARNING_THRESHOLD}%`}
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* 磁盘进度条 */}
      <div style={{ marginBottom: '16px' }}>
        <Progress
          percent={currentDisk}
          strokeColor={{
            '0%': '#108ee9',
            '100%': currentDisk > DISK_CRITICAL_THRESHOLD ? '#ff4d4f' : currentDisk > DISK_WARNING_THRESHOLD ? '#faad14' : '#52c41a'
          }}
          format={(percent) => `${percent}% 已用`}
        />
      </div>

      {/* 统计卡片 */}
      <Space size="large" style={{ marginBottom: '16px' }}>
        <div>
          <span style={{ color: '#8c8c8c' }}>当前:</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', marginLeft: '8px', color: currentDisk > DISK_CRITICAL_THRESHOLD ? '#ff4d4f' : currentDisk > DISK_WARNING_THRESHOLD ? '#faad14' : '#52c41a' }}>
            {currentDisk}%
          </span>
        </div>
        <div>
          <span style={{ color: '#8c8c8c' }}>平均:</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', marginLeft: '8px' }}>{avgDisk}%</span>
        </div>
        <div>
          <span style={{ color: '#8c8c8c' }}>峰值:</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', marginLeft: '8px' }}>{maxDisk}%</span>
        </div>
        <div>
          <span style={{ color: '#8c8c8c' }}>总空间:</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', marginLeft: '8px' }}>{totalDiskGB} GB</span>
        </div>
      </Space>

      {/* 详细磁盘信息 */}
      <Space size="large" style={{ marginBottom: '16px' }}>
        <div>
          <span style={{ color: '#8c8c8c' }}>已用:</span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', marginLeft: '8px' }}>{usedDiskGB} GB</span>
        </div>
        <div>
          <span style={{ color: '#8c8c8c' }}>可用:</span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', marginLeft: '8px' }}>{availableDiskGB} GB</span>
        </div>
      </Space>

      {/* 图表和饼图 */}
      <Space style={{ width: '100%', marginBottom: '24px' }}>
        <div style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height={chartConfig.height}>
            {renderChart()}
          </ResponsiveContainer>
        </div>
        <div style={{ width: 300 }}>
          <h4 style={{ textAlign: 'center', marginBottom: '16px' }}>空间分布</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Space>

      {/* 分区详情表格 */}
      {diskDetails && diskDetails.length > 0 && (
        <>
          <h4 style={{ marginBottom: '16px' }}>分区详情</h4>
          <Table
            columns={columns}
            dataSource={diskDetails}
            rowKey="mount"
            pagination={false}
            size="small"
            scroll={{ x: 600 }}
          />
        </>
      )}
    </Card>
  )
}

export default DiskChart
