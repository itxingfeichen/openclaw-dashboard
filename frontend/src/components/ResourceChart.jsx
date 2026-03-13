import React from 'react'
import { Card, Row, Col } from 'antd'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

/**
 * 资源使用率图表组件
 * @param {Object} props
 * @param {Array} props.cpuData - CPU 使用率历史数据 [{time, value}]
 * @param {Array} props.memoryData - 内存使用率历史数据 [{time, value}]
 */
const ResourceChart = ({ cpuData = [], memoryData = [] }) => {
  // 合并数据用于同时展示
  const combinedData = cpuData.map((cpu, index) => ({
    time: cpu.time,
    cpu: cpu.value,
    memory: memoryData[index]?.value || 0
  }))

  const chartStyle = {
    height: 300,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial'
  }

  return (
    <Card
      title="资源使用率"
      variant="borderless"
      style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginTop: '24px' }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <h4 style={{ marginBottom: '16px', textAlign: 'center' }}>CPU 使用率趋势</h4>
          <ResponsiveContainer width="100%" height={chartStyle.height}>
            <AreaChart data={cpuData} style={chartStyle}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                label={{ value: '时间', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{ value: '使用率 (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{ borderRadius: '4px', border: '1px solid #f0f0f0' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#1890ff"
                fillOpacity={1}
                fill="url(#colorCpu)"
                name="CPU"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Col>
        <Col span={12}>
          <h4 style={{ marginBottom: '16px', textAlign: 'center' }}>内存使用率趋势</h4>
          <ResponsiveContainer width="100%" height={chartStyle.height}>
            <AreaChart data={memoryData} style={chartStyle}>
              <defs>
                <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#722ed1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#722ed1" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                label={{ value: '时间', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{ value: '使用率 (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{ borderRadius: '4px', border: '1px solid #f0f0f0' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#722ed1"
                fillOpacity={1}
                fill="url(#colorMemory)"
                name="内存"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Col>
      </Row>

      {/* 综合趋势图 */}
      <div style={{ marginTop: '24px' }}>
        <h4 style={{ marginBottom: '16px', textAlign: 'center' }}>资源使用综合趋势</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combinedData} style={chartStyle}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              label={{ value: '时间', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{ value: '使用率 (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value, name) => `${value}%`}
              contentStyle={{ borderRadius: '4px', border: '1px solid #f0f0f0' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="cpu"
              stroke="#1890ff"
              strokeWidth={2}
              dot={false}
              name="CPU"
            />
            <Line
              type="monotone"
              dataKey="memory"
              stroke="#722ed1"
              strokeWidth={2}
              dot={false}
              name="内存"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default ResourceChart
