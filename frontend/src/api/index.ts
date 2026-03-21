import axios from 'axios';
import type { SystemMetrics, MetricsHistory, Alert, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock data for development when backend is not available
const generateMockMetrics = (): SystemMetrics => ({
  timestamp: new Date().toISOString(),
  performance: {
    cpu: {
      usage: Math.floor(Math.random() * 40) + 20, // 20-60%
      cores: [
        { model: 'Intel Core i7', speed: 2800 },
        { model: 'Intel Core i7', speed: 2800 },
        { model: 'Intel Core i7', speed: 2800 },
        { model: 'Intel Core i7', speed: 2800 },
      ],
    },
    memory: {
      total: 16384, // 16GB
      used: Math.floor(Math.random() * 4000) + 4000, // 4-8GB
      free: Math.floor(Math.random() * 4000) + 4000,
      usagePercent: Math.floor(Math.random() * 40) + 30, // 30-70%
      unit: 'MB',
    },
    process: {
      heapUsed: 150,
      heapTotal: 256,
      external: 50,
      unit: 'MB',
    },
  },
  network: {
    interfaces: [
      {
        name: 'eth0',
        addresses: [{ address: '192.168.1.100', netmask: '255.255.255.0' }],
      },
    ],
  },
  requests: {
    total: 1000,
    active: 5,
    failed: 2,
  },
});

const generateMockHistory = (hours: number): MetricsHistory[] => {
  const data: MetricsHistory[] = [];
  const now = new Date();
  const interval = hours * 60 * 60 * 1000; // milliseconds
  const points = 24; // data points

  for (let i = points; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (interval * i) / points);
    data.push({
      timestamp: timestamp.toISOString(),
      cpuUsage: Math.floor(Math.random() * 40) + 20,
      memoryUsage: Math.floor(Math.random() * 30) + 40,
      diskUsage: Math.floor(Math.random() * 10) + 50,
    });
  }

  return data;
};

const generateMockAlerts = (): Alert[] => [
  {
    id: '1',
    level: 'warning',
    title: 'High Memory Usage',
    message: 'Memory usage has exceeded 70% threshold.',
    source: 'System Monitor',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    acknowledged: false,
  },
  {
    id: '2',
    level: 'info',
    title: 'System Update Available',
    message: 'A new version of OpenClaw is available for installation.',
    source: 'Update Service',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    acknowledged: false,
  },
  {
    id: '3',
    level: 'error',
    title: 'Database Connection Timeout',
    message: 'Database connection timed out after 30 seconds.',
    source: 'Database',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    acknowledged: true,
  },
];

// System metrics API
export const systemApi = {
  // Get current system metrics
  getMetrics: async (): Promise<SystemMetrics> => {
    try {
      const response = await apiClient.get<ApiResponse<SystemMetrics>>('/system/metrics');
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch system metrics');
      }
      return response.data.data;
    } catch (error) {
      console.warn('Using mock metrics data:', error);
      return generateMockMetrics();
    }
  },

  // Get historical metrics for charts
  getMetricsHistory: async (hours: number = 24): Promise<MetricsHistory[]> => {
    try {
      // Backend endpoint for history (if available)
      const response = await apiClient.get<ApiResponse<MetricsHistory[]>>(
        `/system/metrics/history?hours=${hours}`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch metrics history');
      }
      return response.data.data;
    } catch (error) {
      console.warn('Using mock history data:', error);
      return generateMockHistory(hours);
    }
  },
};

// Alerts API
export const alertsApi = {
  // Get all alerts
  getAlerts: async (): Promise<Alert[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Alert[]>>('/alerts');
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch alerts');
      }
      return response.data.data;
    } catch (error) {
      console.warn('Using mock alerts data:', error);
      return generateMockAlerts();
    }
  },

  // Acknowledge an alert
  acknowledgeAlert: async (alertId: string): Promise<void> => {
    try {
      const response = await apiClient.post<ApiResponse<void>>(
        `/alerts/${alertId}/acknowledge`
      );
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to acknowledge alert');
      }
    } catch (error) {
      console.warn('Alert acknowledgment simulated:', error);
      // In mock mode, just succeed silently
    }
  },
};

export default apiClient;
