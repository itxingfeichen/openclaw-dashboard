# 监控设计文档 - OpenClaw Dashboard

## 概述

本文档描述 OpenClaw Dashboard 的监控系统设计，包括 Prometheus 指标采集、健康检查、性能监控、告警规则和可视化仪表板。

## 目录

1. [架构设计](#架构设计)
2. [Prometheus 指标采集](#prometheus-指标采集)
3. [健康检查端点](#健康检查端点)
4. [性能监控](#性能监控)
5. [Grafana 仪表板](#grafana-仪表板)
6. [告警规则](#告警规则)
7. [部署指南](#部署指南)
8. [运维手册](#运维手册)

---

## 架构设计

### 监控架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw Dashboard                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Metrics   │  │   Health    │  │   Performance       │  │
│  │   Module    │  │   Checks    │  │   Monitor           │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          │                                   │
│                  ┌───────▼────────┐                          │
│                  │  /metrics      │                          │
│                  │  /health/*     │                          │
│                  └───────┬────────┘                          │
└──────────────────────────┼───────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ Prometheus  │
                    │  Scraper    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌───▼────┐ ┌────▼─────┐
       │   Grafana   │ │ Alert  │ │  Push    │
       │  Dashboard  │ │ Manager│ │  Gateway │
       └─────────────┘ └────────┘ └──────────┘
```

### 组件说明

| 组件 | 位置 | 说明 |
|------|------|------|
| Metrics Module | `backend/src/metrics/` | Prometheus 指标定义和采集 |
| Health Checks | `backend/src/routes/health.js` | 健康检查端点 |
| Performance Monitor | `backend/src/utils/performance-monitor.js` | 性能监控工具 |
| Middleware | `backend/src/metrics/middleware.js` | 指标采集中间件 |

---

## Prometheus 指标采集

### 默认指标

系统自动采集 Node.js 运行时指标：

- `nodejs_version_info` - Node.js 版本信息
- `nodejs_eventloop_lag_seconds` - 事件循环延迟
- `nodejs_heap_size_used_bytes` - 堆内存使用量
- `nodejs_heap_size_total_bytes` - 堆内存总量
- `nodejs_active_handles_total` - 活跃句柄数
- `nodejs_active_requests_total` - 活跃请求数
- `process_cpu_seconds_total` - CPU 使用时间
- `process_resident_memory_bytes` - 常驻内存

### 自定义 HTTP 指标

#### http_requests_total
HTTP 请求总数计数器

```prometheus
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/users",status_code="200"} 1542
```

#### http_request_duration_seconds
HTTP 请求持续时间直方图

```prometheus
# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/api/users",status_code="200",le="0.1"} 1200
http_request_duration_seconds_bucket{method="GET",route="/api/users",status_code="200",le="0.5"} 1500
http_request_duration_seconds_bucket{method="GET",route="/api/users",status_code="200",le="+Inf"} 1542
```

#### http_requests_in_flight
当前正在处理的请求数

```prometheus
# HELP http_requests_in_flight Number of HTTP requests currently being processed
# TYPE http_requests_in_flight gauge
http_requests_in_flight{method="GET"} 5
```

### 数据库指标

#### db_queries_total
数据库查询总数

```prometheus
# HELP db_queries_total Total number of database queries
# TYPE db_queries_total counter
db_queries_total{query_type="SELECT",table="users"} 5000
```

#### db_query_duration_milliseconds
数据库查询持续时间

```prometheus
# HELP db_query_duration_milliseconds Database query duration in milliseconds
# TYPE db_query_duration_milliseconds histogram
db_query_duration_milliseconds_bucket{query_type="SELECT",table="users",le="10"} 4500
db_query_duration_milliseconds_bucket{query_type="SELECT",table="users",le="100"} 4900
```

### 缓存指标

#### cache_hits_total / cache_misses_total
缓存命中/未命中次数

```prometheus
# HELP cache_hits_total Total number of cache hits
# TYPE cache_hits_total counter
cache_hits_total{cache_type="default"} 8000

# HELP cache_misses_total Total number of cache misses
# TYPE cache_misses_total counter
cache_misses_total{cache_type="default"} 2000
```

#### cache_size_bytes
缓存大小

```prometheus
# HELP cache_size_bytes Current cache size in bytes
# TYPE cache_size_bytes gauge
cache_size_bytes{cache_type="default"} 1048576
```

### 错误指标

#### errors_total
错误总数

```prometheus
# HELP errors_total Total number of errors
# TYPE errors_total counter
errors_total{type="http",severity="warning"} 50
errors_total{type="database",severity="critical"} 5
```

---

## 健康检查端点

### GET /api/health

基础健康检查，返回服务整体状态。

**响应示例：**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-13T12:00:00.000Z",
  "uptime": 86400,
  "uptimeFormatted": "1d 0h 0m 0s",
  "environment": "production",
  "version": "0.1.0"
}
```

**状态码：**
- `200` - 服务健康

### GET /api/health/ready

就绪检查，验证所有依赖服务是否可用。用于 Kubernetes readiness probe。

**响应示例：**
```json
{
  "status": "ready",
  "checks": {
    "database": {
      "status": "healthy",
      "message": "Database connection OK"
    },
    "cache": {
      "status": "healthy",
      "message": "Cache operational",
      "stats": {
        "size": 1024,
        "hits": 5000,
        "misses": 1000
      }
    },
    "externalServices": {
      "status": "healthy",
      "message": "No external dependencies configured"
    }
  },
  "timestamp": "2026-03-13T12:00:00.000Z",
  "uptime": 86400
}
```

**状态码：**
- `200` - 服务就绪，可以接收流量
- `503` - 服务未就绪，依赖服务不可用

**状态说明：**
- `ready` - 所有依赖健康
- `degraded` - 部分依赖降级（仍接受流量）
- `not_ready` - 关键依赖不可用

### GET /api/health/live

存活检查，验证服务进程是否存活。用于 Kubernetes liveness probe。

**响应示例：**
```json
{
  "status": "alive",
  "timestamp": "2026-03-13T12:00:00.000Z",
  "uptime": 86400,
  "memory": {
    "heapUsed": 52428800,
    "heapTotal": 104857600
  }
}
```

**状态码：**
- `200` - 服务存活
- `503` - 服务异常（如内存压力过大）

### GET /api/health/detailed

详细健康检查，包含系统和进程详细信息。

**响应示例：**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-13T12:00:00.000Z",
  "uptime": 86400,
  "system": {
    "platform": "linux",
    "arch": "x64",
    "cpus": 4,
    "totalMemory": 17179869184,
    "freeMemory": 8589934592,
    "loadAvg": [0.5, 0.6, 0.7]
  },
  "process": {
    "memoryUsage": {
      "rss": 104857600,
      "heapTotal": 104857600,
      "heapUsed": 52428800,
      "external": 1048576
    },
    "cpuUsage": {
      "user": 1000000,
      "system": 500000
    },
    "uptime": 86400,
    "version": "v22.22.0",
    "pid": 12345
  },
  "checks": {
    "database": { "status": "healthy" },
    "cache": { "status": "healthy" },
    "externalServices": { "status": "healthy" }
  }
}
```

### GET /api/health/metrics

Prometheus 格式指标导出端点。

**响应头：**
```
Content-Type: text/plain; version=0.0.4; charset=utf-8
```

**响应示例：**
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/users",status_code="200"} 1542
...
```

---

## 性能监控

### API 响应时间统计

性能监控器自动记录每个 API 端点的响应时间，并提供统计分析：

- **计数 (count)** - 请求总数
- **最小值 (min)** - 最快响应时间
- **最大值 (max)** - 最慢响应时间
- **平均值 (avg)** - 平均响应时间
- **百分位数 (p50, p95, p99)** - 响应时间分布

**使用示例：**
```javascript
import { getPerformanceMonitor } from './utils/performance-monitor.js'

const monitor = getPerformanceMonitor()

// 记录响应时间
monitor.recordResponseTime('/api/users', 'GET', 150)

// 获取统计信息
const stats = monitor.getResponseTimeStats('/api/users', 'GET')
console.log(stats)
// { count: 100, min: 50, max: 500, avg: 150, p50: 140, p95: 300, p99: 450 }
```

### 慢查询日志

自动记录超过阈值的慢查询：

```javascript
// 记录慢查询
monitor.recordSlowQuery('SELECT * FROM users WHERE id = ?', 250, {
  table: 'users',
  userId: 123,
})

// 获取慢查询列表
const slowQueries = monitor.getSlowQueries(50)
```

**慢查询事件：**
```javascript
monitor.on('slowQuery', (data) => {
  console.warn('Slow query detected:', data)
  // 发送到日志系统或告警系统
})
```

### 内存泄漏检测

性能监控器持续监控内存使用情况，检测潜在的内存泄漏：

```javascript
const monitor = getPerformanceMonitor({
  memoryCheckInterval: 30000, // 30 秒检查一次
  enableMemoryLeakDetection: true,
})

monitor.on('memoryLeakWarning', (data) => {
  console.error('Potential memory leak detected:', {
    growthRate: data.growthRate, // 内存增长率
    currentHeap: data.currentHeap, // 当前堆大小
  })
  // 触发告警或自动重启
})
```

### 系统统计

获取系统和进程详细信息：

```javascript
const systemStats = monitor.getSystemStats()
console.log(systemStats)
// {
//   uptime: 86400,
//   platform: 'linux',
//   nodeVersion: 'v22.22.0',
//   memoryUsage: { ... },
//   cpuUsage: { ... },
//   loadAvg: [0.5, 0.6, 0.7],
//   totalMemory: 17179869184,
//   freeMemory: 8589934592,
//   cpuCount: 4
// }
```

### 综合性能报告

生成综合性能报告：

```javascript
const report = monitor.getReport()
console.log(JSON.stringify(report, null, 2))
```

---

## Grafana 仪表板

### 导入步骤

1. 登录 Grafana
2. 导航到 Dashboards → Import
3. 上传 `monitoring/grafana-dashboard.json`
4. 选择 Prometheus 数据源
5. 点击 Import

### 仪表板面板

| 面板 | 说明 | 指标 |
|------|------|------|
| Request Rate | 请求速率 | `rate(http_requests_total[5m])` |
| Request Latency | 请求延迟 (p50, p95) | `histogram_quantile(http_request_duration_seconds_bucket)` |
| CPU Usage | CPU 使用率 | `node_cpu_seconds_total` |
| Memory Usage | 内存使用量 | `nodejs_heap_size_used_bytes` |
| In-Flight Requests | 正在处理的请求数 | `http_requests_in_flight` |
| Database Query Rate | 数据库查询速率 | `rate(db_queries_total[5m])` |
| Database Query Latency | 数据库查询延迟 | `histogram_quantile(db_query_duration_milliseconds_bucket)` |
| Cache Performance | 缓存命中率 | `cache_hits_total`, `cache_misses_total` |
| Error Rate | 错误率 | `rate(errors_total[5m])` |
| Event Loop Lag | 事件循环延迟 | `nodejs_eventloop_lag_seconds` |
| System Memory Usage | 系统内存使用率 | `node_memory_MemAvailable_bytes` |
| System CPU Usage | 系统 CPU 使用率 | `node_cpu_seconds_total` |
| Critical Error Rate | 严重错误率 | `rate(errors_total{severity="critical"}[5m])` |

### 自定义仪表板

可以根据需要修改或添加面板：

1. 点击面板标题 → Edit
2. 修改 PromQL 查询
3. 调整可视化选项
4. 保存仪表板

---

## 告警规则

### 导入告警规则

将 `monitoring/alert-rules.yml` 添加到 Prometheus 配置：

```yaml
# prometheus.yml
rule_files:
  - "alert-rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 告警规则列表

#### 错误率告警

| 告警名称 | 条件 | 严重性 | 持续时间 |
|---------|------|--------|---------|
| HighErrorRate | 错误率 > 0.1/s | warning | 5m |
| CriticalErrorRate | 严重错误率 > 0.01/s | critical | 2m |

#### 延迟告警

| 告警名称 | 条件 | 严重性 | 持续时间 |
|---------|------|--------|---------|
| HighRequestLatency | p95 延迟 > 0.5s | warning | 5m |
| VeryHighRequestLatency | p95 延迟 > 1s | critical | 5m |

#### CPU 告警

| 告警名称 | 条件 | 严重性 | 持续时间 |
|---------|------|--------|---------|
| HighCPUUsage | CPU 使用率 > 80% | warning | 10m |
| CriticalCPUUsage | CPU 使用率 > 95% | critical | 5m |

#### 内存告警

| 告警名称 | 条件 | 严重性 | 持续时间 |
|---------|------|--------|---------|
| HighMemoryUsage | 内存使用率 > 85% | warning | 10m |
| CriticalMemoryUsage | 内存使用率 > 95% | critical | 5m |
| NodejsHeapMemoryHigh | Node.js 堆使用率 > 85% | warning | 10m |
| NodejsHeapMemoryCritical | Node.js 堆使用率 > 95% | critical | 5m |

#### 数据库告警

| 告警名称 | 条件 | 严重性 | 持续时间 |
|---------|------|--------|---------|
| HighDatabaseQueryLatency | p95 DB 延迟 > 500ms | warning | 5m |
| DatabaseQueryRateHigh | DB 查询率 > 100/s | warning | 5m |

#### 缓存告警

| 告警名称 | 条件 | 严重性 | 持续时间 |
|---------|------|--------|---------|
| LowCacheHitRate | 缓存命中率 < 50% | warning | 10m |

#### 事件循环告警

| 告警名称 | 条件 | 严重性 | 持续时间 |
|---------|------|--------|---------|
| HighEventLoopLag | 事件循环延迟 > 0.5s | warning | 5m |
| CriticalEventLoopLag | 事件循环延迟 > 1s | critical | 2m |

#### 服务可用性告警

| 告警名称 | 条件 | 严重性 | 持续时间 |
|---------|------|--------|---------|
| ServiceDown | 服务不可用 | critical | 1m |
| HealthCheckFailed | 健康检查失败 | critical | 2m |
| HealthCheckDegraded | 健康检查降级 | warning | 5m |

#### 磁盘空间告警

| 告警名称 | 条件 | 严重性 | 持续时间 |
|---------|------|--------|---------|
| LowDiskSpace | 磁盘可用 < 15% | warning | 10m |
| CriticalLowDiskSpace | 磁盘可用 < 5% | critical | 5m |

### 告警通知配置

配置 Alertmanager 发送告警通知：

```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alertmanager@example.com'

route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'email-notifications'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'

receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'team@example.com'
        send_resolved: true

  - name: 'critical-alerts'
    email_configs:
      - to: 'oncall@example.com'
        send_resolved: true
    webhook_configs:
      - url: 'http://pagerduty:8080/webhook'
```

---

## 部署指南

### 前置条件

- Node.js >= 22.0.0
- Prometheus >= 2.40.0
- Grafana >= 9.0.0
- (可选) Alertmanager >= 0.25.0

### 安装依赖

```bash
cd /home/admin/openclaw-dashboard/backend
npm install prom-client
```

### 配置 Prometheus

创建 Prometheus 配置文件：

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'openclaw-dashboard'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/api/health/metrics'
    scrape_interval: 10s

  - job_name: 'openclaw-health'
    metrics_path: '/probe'
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - http://localhost:8080/api/health
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: localhost:9115  # Blackbox exporter
```

### 启动服务

1. **启动应用：**
```bash
cd /home/admin/openclaw-dashboard/backend
npm start
```

2. **启动 Prometheus：**
```bash
prometheus --config.file=prometheus.yml
```

3. **启动 Grafana：**
```bash
grafana-server --config=/etc/grafana/grafana.ini
```

4. **启动 Alertmanager（可选）：**
```bash
alertmanager --config.file=alertmanager.yml
```

### Docker 部署

使用 Docker Compose 部署完整监控栈：

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  openclaw-dashboard:
    image: openclaw/dashboard:latest
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080

  prometheus:
    image: prom/prometheus:v2.45.0
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alert-rules.yml:/etc/prometheus/alert-rules.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:10.0.0
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana-dashboard.json:/etc/grafana/provisioning/dashboards/dashboard.json
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource

  alertmanager:
    image: prom/alertmanager:v0.25.0
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:
```

启动服务：
```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### Kubernetes 部署

创建 Kubernetes 资源：

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: openclaw-dashboard
spec:
  replicas: 3
  selector:
    matchLabels:
      app: openclaw-dashboard
  template:
    metadata:
      labels:
        app: openclaw-dashboard
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/api/health/metrics"
    spec:
      containers:
        - name: dashboard
          image: openclaw/dashboard:latest
          ports:
            - containerPort: 8080
          livenessProbe:
            httpGet:
              path: /api/health/live
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: openclaw-dashboard
  labels:
    app: openclaw-dashboard
spec:
  ports:
    - port: 8080
      targetPort: 8080
      name: http
  selector:
    app: openclaw-dashboard
```

```yaml
# k8s/servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: openclaw-dashboard
  labels:
    app: openclaw-dashboard
spec:
  selector:
    matchLabels:
      app: openclaw-dashboard
  endpoints:
    - port: http
      path: /api/health/metrics
      interval: 10s
```

---

## 运维手册

### 日常监控检查清单

#### 每日检查
- [ ] 检查 Grafana 仪表板是否有异常
- [ ] 查看错误率是否在正常范围
- [ ] 检查慢查询日志
- [ ] 验证健康检查端点响应正常

#### 每周检查
- [ ] 分析性能趋势
- [ ] 检查内存使用趋势
- [ ] 审查告警规则有效性
- [ ] 更新文档（如有变更）

#### 每月检查
- [ ] 容量规划评估
- [ ] 性能基准测试
- [ ] 告警规则优化
- [ ] 监控系统升级评估

### 常见问题排查

#### 问题：指标采集失败

**症状：**
- Prometheus 显示 target down
- `/api/health/metrics` 返回 500 错误

**排查步骤：**
1. 检查应用日志：`journalctl -u openclaw-dashboard -f`
2. 验证端点可访问：`curl http://localhost:8080/api/health/metrics`
3. 检查 Prometheus 配置：`promtool check config prometheus.yml`
4. 验证网络连接：`telnet localhost 8080`

**解决方案：**
```bash
# 重启应用
systemctl restart openclaw-dashboard

# 检查指标模块
node -e "import('./src/metrics/metrics.js').then(m => console.log('OK'))"
```

#### 问题：内存使用持续增长

**症状：**
- Grafana 显示内存使用持续上升
- 触发 NodejsHeapMemoryHigh 告警

**排查步骤：**
1. 生成堆快照：
```bash
node --inspect app.js
# 在 Chrome DevTools 中捕获堆快照
```

2. 分析内存泄漏：
```javascript
const monitor = getPerformanceMonitor()
monitor.on('memoryLeakWarning', (data) => {
  console.error('Memory leak:', data)
})
```

3. 检查事件监听器：
```javascript
process.on('warning', (warning) => {
  console.warn('MaxListenersExceededWarning:', warning)
})
```

**解决方案：**
- 修复内存泄漏代码
- 增加资源限制
- 配置自动重启策略

#### 问题：慢查询过多

**症状：**
- 触发 HighDatabaseQueryLatency 告警
- API 响应时间增加

**排查步骤：**
1. 获取慢查询列表：
```javascript
const monitor = getPerformanceMonitor()
const slowQueries = monitor.getSlowQueries(100)
console.table(slowQueries)
```

2. 分析查询模式
3. 检查数据库索引
4. 验证缓存命中率

**解决方案：**
- 优化慢查询 SQL
- 添加数据库索引
- 增加缓存层
- 实现查询限流

#### 问题：告警风暴

**症状：**
- 短时间内收到大量告警
- 告警通知淹没

**排查步骤：**
1. 检查告警分组配置
2. 验证告警抑制规则
3. 分析根本原因

**解决方案：**
```yaml
# alertmanager.yml
route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname']
```

### 性能优化建议

#### 指标采集优化
1. 调整采集频率（默认 10s）
2. 减少不必要的标签基数
3. 使用 recording rules 预计算复杂查询

#### 存储优化
1. 配置 Prometheus 保留策略：
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

storage:
  tsdb:
    retention:
      time: 15d
      size: 10GB
```

2. 使用降采样（downsampling）
3. 配置远程存储

#### 查询优化
1. 使用适当的查询范围
2. 避免高基数标签
3. 使用 recording rules

### 备份与恢复

#### Prometheus 数据备份
```bash
# 停止 Prometheus
systemctl stop prometheus

# 备份数据目录
tar -czf prometheus-backup-$(date +%Y%m%d).tar.gz /var/lib/prometheus

# 恢复数据
tar -xzf prometheus-backup-20260313.tar.gz -C /
```

#### Grafana 仪表板备份
```bash
# 导出仪表板
curl http://admin:admin@localhost:3000/api/dashboards/uid/openclaw-dashboard > dashboard-backup.json

# 导入仪表板
curl -X POST \
  -H "Content-Type: application/json" \
  -d @dashboard-backup.json \
  http://admin:admin@localhost:3000/api/dashboards/db
```

### 升级指南

#### Prometheus 升级
```bash
# 下载新版本
wget https://github.com/prometheus/prometheus/releases/download/v2.46.0/prometheus-2.46.0.linux-amd64.tar.gz

# 备份配置
cp -r /etc/prometheus /etc/prometheus.backup

# 停止服务
systemctl stop prometheus

# 替换二进制
tar xzf prometheus-2.46.0.linux-amd64.tar.gz
sudo cp prometheus-2.46.0.linux-amd64/prometheus /usr/local/bin/

# 启动服务
systemctl start prometheus

# 验证
prometheus --version
```

#### Grafana 升级
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install grafana

# 验证
grafana-server -v
```

---

## 附录

### 指标命名规范

遵循 Prometheus 最佳实践：

- 使用小写字母和下划线
- 使用 `_total` 后缀表示计数器
- 使用 `_seconds`, `_bytes` 等单位
- 使用 `_bucket`, `_sum`, `_count` 表示直方图

### 标签命名规范

- 使用小写字母和下划线
- 避免高基数标签（如 user_id）
- 使用有意义的标签名（如 method, route, status_code）

### 相关文档

- [Prometheus 官方文档](https://prometheus.io/docs/)
- [Grafana 官方文档](https://grafana.com/docs/)
- [Node.js 性能监控最佳实践](https://nodejs.org/en/docs/guides/diagnostics/)

### 联系方式

- 技术支持：support@openclaw.dev
- 文档问题：docs@openclaw.dev
- GitHub Issues: https://github.com/openclaw/dashboard/issues

---

_文档版本：1.0_
_最后更新：2026-03-13_
_维护者：OpenClaw Team_
