// System metrics types (matching backend structure)
export interface SystemMetrics {
  timestamp: string; // ISO 8601
  performance: {
    cpu: {
      usage: number; // percentage 0-100
      cores: Array<{
        model: string;
        speed: number;
      }>;
    };
    memory: {
      total: number; // MB
      used: number; // MB
      free: number; // MB
      usagePercent: number; // percentage 0-100
      unit: string;
    };
    process: {
      heapUsed: number; // MB
      heapTotal: number; // MB
      external: number; // MB
      unit: string;
    };
  };
  network: {
    interfaces: Array<{
      name: string;
      addresses?: Array<{
        address: string;
        netmask: string;
      }>;
    }>;
  };
  requests: {
    total: number;
    active: number;
    failed: number;
  };
}

// Historical metrics for charts
export interface MetricsHistory {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

// Alert types
export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
