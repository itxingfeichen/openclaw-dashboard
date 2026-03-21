import React from 'react';
import type { SystemMetrics } from '../types';
import './SystemStatusCard.css';

interface SystemStatusCardProps {
  metrics: SystemMetrics | null;
  loading: boolean;
  error: string | null;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const CircularProgress: React.FC<{
  percentage: number;
  label: string;
  color: string;
  size?: number;
}> = ({ percentage, label, color, size = 120 }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="circular-progress-svg">
        <circle
          className="circular-progress-bg"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="circular-progress-bar"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <div className="circular-progress-content">
        <span className="circular-progress-value">{percentage.toFixed(1)}%</span>
        <span className="circular-progress-label">{label}</span>
      </div>
    </div>
  );
};

const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ metrics, loading, error }) => {
  if (loading) {
    return (
      <div className="system-status-card loading">
        <div className="loading-spinner">Loading system metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="system-status-card error">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const cpuUsage = metrics.performance.cpu.usage;
  const memoryUsage = metrics.performance.memory.usagePercent;
  // Disk usage not available in current backend, using memory as placeholder
  const diskUsage = 0;

  const getCpuColor = (usage: number) => {
    if (usage < 50) return '#4ade80'; // green
    if (usage < 75) return '#fbbf24'; // yellow
    if (usage < 90) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getMemoryColor = (usage: number) => {
    if (usage < 60) return '#60a5fa'; // blue
    if (usage < 80) return '#fbbf24'; // yellow
    if (usage < 90) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getDiskColor = (usage: number) => {
    if (usage < 70) return '#a78bfa'; // purple
    if (usage < 85) return '#fbbf24'; // yellow
    if (usage < 95) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="system-status-card">
      <div className="card-header">
        <h2>🖥️ System Status</h2>
        <span className="last-updated">
          Updated: {new Date(metrics.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div className="metrics-grid">
        <div className="metric-item">
          <CircularProgress percentage={cpuUsage} label="CPU Usage" color={getCpuColor(cpuUsage)} />
          <div className="metric-details">
            <div>Cores: {metrics.performance.cpu.cores.length}</div>
            <div>
              Model: {metrics.performance.cpu.cores[0]?.model?.split('@')[0]?.trim() || 'Unknown'}
            </div>
          </div>
        </div>

        <div className="metric-item">
          <CircularProgress
            percentage={memoryUsage}
            label="Memory Usage"
            color={getMemoryColor(memoryUsage)}
          />
          <div className="metric-details">
            <div>Used: {formatBytes(metrics.performance.memory.used * 1024 * 1024)}</div>
            <div>Total: {formatBytes(metrics.performance.memory.total * 1024 * 1024)}</div>
            <div>Free: {formatBytes(metrics.performance.memory.free * 1024 * 1024)}</div>
          </div>
        </div>

        <div className="metric-item">
          <CircularProgress
            percentage={diskUsage}
            label="Disk Usage"
            color={getDiskColor(diskUsage)}
          />
          <div className="metric-details">
            <div>Not available</div>
            <div>Backend integration pending</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusCard;
