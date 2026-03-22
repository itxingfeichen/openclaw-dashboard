/**
 * System Metrics API Response Types
 */

export interface SystemMetricsResponse {
  success: boolean;
  data: SystemMetrics;
  warning?: string;
}

export interface SystemMetrics {
  timestamp: string;
  cpu: CPUUsage;
  memory: MemoryUsage;
  disk: DiskUsage;
  sessions: SessionInfo;
  gateway: GatewayStatus;
}

export interface CPUUsage {
  usagePercent: number;
  cores: number;
  load: LoadAverage;
}

export interface LoadAverage {
  oneMinute: number;
  fiveMinutes: number;
  fifteenMinutes: number;
}

export interface MemoryUsage {
  total: number;
  used: number;
  free: number;
  usagePercent: number;
  unit: string;
}

export interface DiskUsage {
  total: number;
  used: number;
  free: number;
  usagePercent: number;
  unit: string;
}

export interface SessionInfo {
  active: number;
  total: number;
}

export interface GatewayStatus {
  status: 'running' | 'stopped' | 'unknown';
  uptime?: number;
  version?: string;
  pid?: number;
}

/**
 * Historical Metrics Response
 */
export interface MetricsHistoryResponse {
  success: boolean;
  data: MetricsHistoryPoint[];
  hours: number;
}

export interface MetricsHistoryPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
}

/**
 * Alert Types
 */
export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface AlertsResponse {
  success: boolean;
  data: Alert[];
  total: number;
}

/**
 * Generic API Response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  warning?: string;
}
