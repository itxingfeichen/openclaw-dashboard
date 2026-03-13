# Dashboard UI 使用文档

## 概述

系统状态仪表盘是 OpenClaw Dashboard 的核心页面，提供系统运行状态、资源使用率、快速操作入口和告警管理的可视化界面。

## 功能特性

### 1. 系统状态概览

展示四个关键指标的状态卡片：

- **系统状态**：显示系统当前运行状态（运行中/停止）
- **Agent 数量**：当前活跃的 Agent 总数
- **任务数量**：正在执行或等待执行的任务数
- **会话数量**：当前活跃的会话数

### 2. 资源使用率监控

实时展示系统资源使用情况：

- **CPU 使用率趋势图**：显示最近 30 分钟的 CPU 使用率变化
- **内存使用率趋势图**：显示最近 30 分钟的内存使用率变化
- **综合趋势图**：同时展示 CPU 和内存的使用趋势对比

图表特性：
- 自动刷新（每 30 秒）
- 响应式设计
- 交互式 Tooltip
- 平滑曲线展示

### 3. 快速操作入口

提供常用操作的快捷按钮：

- **启动/停止 Agent**：根据当前状态动态切换
- **查看日志**：打开日志查看页面
- **创建新 Agent**：跳转到 Agent 创建页面
- **刷新**：手动刷新仪表盘数据

### 4. 告警管理

展示和管理系统告警：

- **告警级别标识**：
  - 🔴 严重（Critical）：红色标签
  - 🟠 警告（Warning）：橙色标签
  - 🔵 信息（Info）：蓝色标签

- **告警状态**：
  - 未解决（Active）
  - 已解决（Resolved）

- **操作功能**：
  - 查看详情
  - 解除告警

## 技术架构

### 组件结构

```
Dashboard/
├── Dashboard.jsx          # 主页面组件
├── Dashboard.css          # 样式文件
└── components/
    ├── StatCard.jsx       # 状态卡片组件
    ├── ResourceChart.jsx  # 资源图表组件
    ├── QuickActions.jsx   # 快速操作组件
    └── AlertList.jsx      # 告警列表组件
```

### 依赖库

- **React 18**：前端框架
- **Ant Design 5**：UI 组件库
- **Recharts**：图表库
- **@ant-design/icons**：图标库

### API 集成

仪表盘通过以下 API 端点获取数据：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 获取系统健康状态 |
| `/api/agents` | GET | 获取 Agent 列表 |
| `/api/sessions` | GET | 获取会话列表 |
| `/api/metrics` | GET | 获取监控指标和告警 |
| `/api/agents/start` | POST | 启动 Agent |
| `/api/agents/stop` | POST | 停止 Agent |
| `/api/alerts/:id/dismiss` | POST | 解除告警 |

### 数据格式

#### 系统健康状态响应
```json
{
  "status": "running",
  "running": true
}
```

#### Agent 列表响应
```json
[
  { "id": "1", "name": "agent-1", "status": "active" }
]
// 或
{
  "count": 5,
  "data": [...]
}
```

#### 监控指标响应
```json
{
  "cpu": {
    "current": 25,
    "history": [
      { "time": "10:00", "value": 25 },
      { "time": "10:01", "value": 30 }
    ]
  },
  "memory": {
    "current": 45,
    "history": [
      { "time": "10:00", "value": 45 },
      { "time": "10:01", "value": 48 }
    ]
  },
  "tasks": {
    "count": 23
  },
  "alerts": [
    {
      "id": "1",
      "level": "warning",
      "message": "CPU 使用率持续高于 80%",
      "source": "System Monitor",
      "timestamp": "2024-01-01T10:00:00Z",
      "status": "active"
    }
  ]
}
```

## 使用方法

### 1. 访问仪表盘

在浏览器中访问：`http://localhost:5173/`（开发环境）

### 2. 查看系统状态

仪表盘会自动加载并显示：
- 系统运行状态
- Agent、任务、会话数量
- 资源使用率图表
- 当前告警列表

### 3. 执行快速操作

点击相应的操作按钮：
- 启动/停止 Agent 会有确认提示
- 查看日志会在新窗口打开日志页面
- 创建 Agent 会跳转到创建页面

### 4. 管理告警

- 点击"详情"查看告警详细信息
- 点击"解除"处理已解决的告警
- 告警列表支持分页和排序

## 配置选项

### 环境变量

```bash
# .env 文件
REACT_APP_API_URL=/api  # API 基础 URL
```

### 自动刷新间隔

默认每 30 秒自动刷新一次数据，可在 `Dashboard.jsx` 中修改：

```javascript
useEffect(() => {
  const interval = setInterval(loadAllData, 30000) // 修改此处的毫秒数
  return () => clearInterval(interval)
}, [loadAllData])
```

## 响应式设计

仪表盘支持多种屏幕尺寸：

- **桌面端**（> 768px）：四列布局，完整功能
- **移动端**（≤ 768px）：单列布局，优化触摸操作

## 测试

### 运行单元测试

```bash
cd /home/admin/openclaw-dashboard/frontend
npm test
```

### 测试覆盖率

目标覆盖率：> 80%

测试包括：
- 组件渲染测试
- 用户交互测试
- API 调用测试
- 状态管理测试

## 故障排查

### 常见问题

#### 1. 数据加载失败
- 检查后端 API 是否正常运行
- 检查网络连接
- 查看浏览器控制台错误信息

#### 2. 图表不显示
- 确认 Recharts 库已正确安装
- 检查数据格式是否正确
- 查看容器尺寸是否足够

#### 3. 样式异常
- 确认 CSS 文件已正确引入
- 清除浏览器缓存
- 检查 Ant Design 版本兼容性

### 日志位置

前端日志可在浏览器开发者工具的 Console 中查看。

## 性能优化建议

1. **数据缓存**：考虑实现本地缓存减少 API 调用
2. **图表优化**：大数据量时考虑降采样
3. **懒加载**：按需加载非关键组件
4. **防抖处理**：频繁操作添加防抖

## 未来扩展

- [ ] 自定义时间范围选择
- [ ] 导出报表功能
- [ ] 告警规则配置
- [ ] 多主题支持
- [ ] 实时 WebSocket 推送
- [ ] 自定义仪表盘布局

## 更新日志

### v0.1.0 (2024-01-01)
- 初始版本发布
- 实现基础监控功能
- 集成后端 API
- 完成单元测试

---

**维护者**: OpenClaw Team  
**最后更新**: 2024-01-01
