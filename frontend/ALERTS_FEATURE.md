# 告警通知系统 - 前端实现文档

## 概述

实现了完整的告警管理页面，支持告警规则配置、告警列表查看、通知渠道配置等功能。

## 交付物清单

### 1. 页面组件
- **`src/pages/Alerts/Alerts.jsx`** - 告警管理主页面
  - 集成告警列表、规则配置、通知设置三个标签页
  - 提供告警统计面板（总数、严重、警告、已解决）
  - 支持数据自动刷新（30 秒间隔）

### 2. 功能组件
- **`src/components/AlertRules.jsx`** - 告警规则配置组件
  - ✅ 告警规则 CRUD（创建、读取、更新、删除）
  - ✅ 规则列表展示（名称、级别、条件、通知渠道、启用状态）
  - ✅ 新建规则弹窗表单
  - ✅ 编辑规则弹窗表单
  - ✅ 删除确认对话框

- **`src/components/AlertList.jsx`** - 告警列表组件（增强版）
  - ✅ 告警列表展示（级别、内容、来源、时间、状态）
  - ✅ 告警级别筛选（严重、警告、信息）
  - ✅ 告警状态筛选（未解决、已确认、已忽略、已解决）
  - ✅ 告警搜索（按内容/来源）
  - ✅ 告警确认操作
  - ✅ 告警忽略操作
  - ✅ 告警解除操作
  - ✅ 查看详情操作

- **`src/components/NotificationSettings.jsx`** - 通知设置组件
  - ✅ 邮件通知配置（启用开关、收件人列表）
  - ✅ 短信通知配置（启用开关、手机号列表）
  - ✅ 钉钉通知配置（启用开关、Webhook 地址）
  - ✅ 飞书通知配置（启用开关、Webhook 地址）
  - ✅ 企业微信通知配置（启用开关、Webhook 地址）
  - ✅ 免打扰时段设置
  - ✅ 自定义 Webhook 管理（增删改查）

### 3. 测试文件
- **`src/tests/Alerts.test.jsx`** - 单元测试
  - AlertList 组件测试（10 个测试用例）
  - AlertRules 组件测试（6 个测试用例）
  - NotificationSettings 组件测试（7 个测试用例）
  - Alerts 页面测试（3 个测试用例）

### 4. 路由配置
- **`src/App.jsx`** - 已更新
  - 添加 `/alerts` 路由
  - 添加侧边栏菜单项（告警管理）

## 功能特性

### 1. 告警规则 CRUD
- 支持创建新告警规则，包含名称、级别、触发条件、通知渠道、启用状态
- 支持编辑现有规则
- 支持删除规则（带确认对话框）
- 规则列表支持分页

### 2. 告警级别筛选
- 支持按级别筛选：全部、严重、警告、信息
- 不同级别使用不同颜色标签（红/橙/蓝）
- 级别图标直观展示

### 3. 告警确认/忽略
- 支持确认告警（状态变更为"已确认"）
- 支持忽略告警（状态变更为"已忽略"）
- 支持解除告警（状态变更为"已解决"）
- 操作按钮根据状态动态显示/禁用

### 4. 通知渠道配置
- 支持多种通知渠道：邮件、短信、钉钉、飞书、企业微信、Webhook
- 每个渠道可独立启用/禁用
- 支持配置多个收件人/接收者
- 支持配置多个自定义 Webhook

### 5. 告警统计面板
- 总告警数统计
- 严重告警数统计
- 警告数统计
- 已解决告警数统计
- 实时数据更新

## API 接口约定

前端期望的后端 API 接口：

```
GET    /api/alerts              # 获取告警列表
POST   /api/alerts/:id/dismiss  # 解除告警
POST   /api/alerts/:id/confirm  # 确认告警
POST   /api/alerts/:id/ignore   # 忽略告警

GET    /api/alerts/rules        # 获取告警规则列表
POST   /api/alerts/rules        # 创建告警规则
PUT    /api/alerts/rules/:id    # 更新告警规则
DELETE /api/alerts/rules/:id    # 删除告警规则

GET    /api/alerts/settings     # 获取通知设置
PUT    /api/alerts/settings     # 更新通知设置
```

## 数据模型

### Alert（告警）
```javascript
{
  id: string,
  level: 'critical' | 'warning' | 'info',
  message: string,
  source: string,
  timestamp: string (ISO 8601),
  status: 'active' | 'confirmed' | 'ignored' | 'resolved'
}
```

### AlertRule（告警规则）
```javascript
{
  id: string,
  name: string,
  level: 'critical' | 'warning' | 'info',
  condition: string,
  channels: string[],
  enabled: boolean,
  description?: string
}
```

### NotificationSettings（通知设置）
```javascript
{
  emailEnabled: boolean,
  emailRecipients: string[],
  smsEnabled: boolean,
  smsRecipients: string[],
  dingtalkEnabled: boolean,
  dingtalkWebhook: string,
  feishuEnabled: boolean,
  feishuWebhook: string,
  wechatEnabled: boolean,
  wechatWebhook: string,
  quietHoursEnabled: boolean,
  quietHoursStart: string,
  quietHoursEnd: string,
  webhooks: Array<{
    id: string,
    name: string,
    url: string,
    enabled: boolean
  }>
}
```

## 技术栈

- React 18
- Ant Design 5.x
- React Router 6.x
- Vitest（测试框架）
- Testing Library（测试工具）

## 构建验证

```bash
cd /home/admin/openclaw-dashboard/frontend
npm run build
```

✅ 构建成功，无错误

## 测试运行

```bash
cd /home/admin/openclaw-dashboard/frontend
npm test -- Alerts.test.jsx
```

## 访问路径

启动应用后，访问：`http://localhost:5173/alerts`

或通过侧边栏菜单点击"告警管理"进入。

## 注意事项

1. 当前实现包含模拟数据用于演示，实际使用时需要后端 API 支持
2. 所有 API 调用都包含错误处理，API 不可用时会自动降级到模拟数据
3. 组件支持响应式布局，适配不同屏幕尺寸
4. 所有用户操作都有相应的提示信息（message）
5. 敏感操作（如删除）都有确认对话框

## 后续优化建议

1. 添加告警详情页（弹窗或独立页面）
2. 支持告警批量操作（批量确认、批量忽略、批量解除）
3. 添加告警历史查询功能
4. 支持告警规则导入/导出
5. 添加告警统计图表（趋势分析、分布图）
6. 支持告警规则模板
7. 添加告警通知日志
