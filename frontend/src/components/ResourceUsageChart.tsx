import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MetricsHistory } from '../types';
import './ResourceUsageChart.css';

interface ResourceUsageChartProps {
  data: MetricsHistory[];
  loading: boolean;
  error: string | null;
  timeRange: number; // hours
  onTimeRangeChange: (hours: number) => void;
}

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label ? new Date(label).toLocaleString() : ''}</p>
        {payload.map((entry, index) => (
          <p key={index} className="tooltip-item" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(1)}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ResourceUsageChart: React.FC<ResourceUsageChartProps> = ({
  data,
  loading,
  error,
  timeRange,
  onTimeRangeChange,
}) => {
  const timeRanges = [
    { label: '1H', value: 1 },
    { label: '6H', value: 6 },
    { label: '12H', value: 12 },
    { label: '24H', value: 24 },
  ];

  if (loading) {
    return (
      <div className="resource-usage-chart loading">
        <div className="loading-spinner">Loading chart data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="resource-usage-chart error">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="resource-usage-chart">
      <div className="chart-header">
        <h2>📊 Resource Usage History</h2>
        <div className="time-range-selector">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              className={`time-range-btn ${timeRange === range.value ? 'active' : ''}`}
              onClick={() => onTimeRangeChange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="#888"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#888"
              tick={{ fontSize: 12 }}
              label={{ value: 'Usage (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="cpuUsage"
              name="CPU"
              stroke="#4ade80"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="memoryUsage"
              name="Memory"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="diskUsage"
              name="Disk"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {data.length === 0 && (
        <div className="no-data-message">
          <p>No historical data available for the selected time range.</p>
        </div>
      )}
    </div>
  );
};

export default ResourceUsageChart;
