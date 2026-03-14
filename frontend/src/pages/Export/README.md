# 数据导出功能 (Data Export Feature)

## 概述

数据导出功能允许用户将系统中的 Agent、任务、日志和配置数据导出为多种格式（CSV、JSON、XLSX），支持自定义字段选择和数据过滤。

## 文件结构

```
src/pages/Export/
├── Export.jsx              # 主导出页面组件
├── Export.css              # 页面样式
└── README.md               # 本文档

src/components/
├── ExportConfig.jsx        # 导出配置组件
├── ExportProgress.jsx      # 导出进度组件
└── ExportHistory.jsx       # 导出历史组件

src/services/
└── exportService.js        # API 服务层

src/tests/
└── Export.test.jsx         # 单元测试
```

## 功能特性

### 1. 数据类型选择
支持导出以下数据类型：
- **Agent 数据**: Agent 基本信息、状态、配置等
- **任务数据**: 任务列表、执行记录、结果等
- **日志数据**: 系统日志、操作日志、错误日志等
- **配置数据**: 系统配置、用户配置等

### 2. 导出格式选择
- **CSV**: 逗号分隔值，适用于 Excel 等表格软件
- **JSON**: JavaScript 对象格式，适用于程序处理
- **XLSX**: Excel 表格格式，保留格式和样式

### 3. 字段配置
- 每种数据类型都有预定义的可用字段列表
- 支持全选/取消全选
- 支持自定义选择特定字段
- 实时显示已选字段数量

### 4. 数据过滤
根据不同数据类型提供相应的过滤条件：

**任务数据过滤**:
- 状态筛选（运行中/已完成/失败/待处理）
- 时间范围（今天/本周/本月/本季度/今年）

**Agent 数据过滤**:
- 状态筛选（活跃/空闲/离线）
- 类型筛选（数据处理/代码审查/客户支持/分析）

**日志数据过滤**:
- 日志级别（错误/警告/信息/调试）
- 时间范围（今天/本周/本月）

**配置数据过滤**:
- 配置类型（系统配置/Agent 配置/用户配置）

### 5. 导出进度展示
- 实时进度百分比
- 已处理/总记录数统计
- 剩余时间估算
- 当前步骤显示
- 支持取消导出

### 6. 导出历史
- 查看所有历史导出记录
- 支持搜索和筛选
- 支持下载已完成的导出文件
- 支持删除历史记录
- 分页显示

## 使用流程

### 步骤 1: 配置导出
1. 访问"数据导出"页面
2. 选择要导出的数据类型
3. 选择导出格式（CSV/JSON/XLSX）
4. 选择需要导出的字段
5. （可选）设置数据过滤条件

### 步骤 2: 开始导出
1. 点击"开始导出"按钮
2. 系统创建导出任务
3. 自动跳转到进度页面

### 步骤 3: 等待完成
1. 查看实时进度
2. 可查看统计信息
3. 可选择取消导出
4. 完成后自动跳转

### 步骤 4: 下载文件
1. 导出完成后显示"下载导出文件"按钮
2. 点击按钮下载文件到本地
3. 可选择导出其他数据或查看历史

## API 接口

### initiateExport
创建导出任务
```javascript
POST /api/export/initiate
Body: {
  type: string,      // 数据类型
  format: string,    // 导出格式
  fields: string[],  // 字段列表
  filters: object    // 过滤条件
}
Response: {
  id: string,        // 任务 ID
  status: string     // 任务状态
}
```

### getExportProgress
获取导出进度
```javascript
GET /api/export/progress/:jobId
Response: {
  status: string,        // 状态
  percentage: number,    // 进度百分比
  totalRecords: number,  // 总记录数
  processedRecords: number, // 已处理记录数
  currentStep: string,   // 当前步骤
  estimatedTime: number, // 预计剩余时间（秒）
  startTime: string,     // 开始时间
  endTime: string        // 结束时间
}
```

### getExportHistory
获取导出历史
```javascript
GET /api/export/history?page=1&pageSize=10&type=task&format=csv&status=completed
Response: {
  data: array,           // 历史记录列表
  total: number,         // 总记录数
  page: number           // 当前页码
}
```

### downloadExport
下载导出文件
```javascript
GET /api/export/download/:fileId
Response: File stream (binary)
```

### cancelExport
取消导出任务
```javascript
POST /api/export/cancel/:jobId
Response: {
  success: boolean
}
```

### deleteExportRecord
删除导出历史记录
```javascript
DELETE /api/export/history/:recordId
Response: {
  success: boolean
}
```

## 组件说明

### ExportConfig
导出配置组件，提供数据类型、格式、字段和过滤条件的配置界面。

**Props**:
- `onConfigChange`: 配置变更回调函数
- `initialConfig`: 初始配置对象

### ExportProgress
导出进度组件，实时显示导出进度和统计信息。

**Props**:
- `jobId`: 导出任务 ID
- `onComplete`: 导出完成回调函数
- `onCancel`: 导出取消回调函数

### ExportHistory
导出历史组件，展示和管理历史导出记录。

**Props**:
- `onRefresh`: 刷新回调函数

## 样式说明

组件使用 Ant Design 作为基础 UI 库，自定义样式位于 `Export.css`：

- `.export-page-content`: 页面容器
- `.export-header`: 页面头部
- `.export-workflow-card`: 工作流卡片
- `.export-steps`: 步骤条
- `.config-section`: 配置区块
- `.export-progress-card`: 进度卡片
- `.export-history-card`: 历史卡片

## 测试说明

单元测试文件位于 `src/tests/Export.test.jsx`，包含：

- ExportConfig 组件测试
  - 渲染测试
  - 交互测试
  - 回调测试

- ExportProgress 组件测试
  - 状态渲染测试
  - 进度显示测试
  - 操作按钮测试

- ExportHistory 组件测试
  - 列表渲染测试
  - 筛选功能测试
  - 下载删除测试

- ExportPage 组件测试
  - 页面结构测试
  - 流程测试

- Service 函数测试
  - API 调用测试
  - 错误处理测试

运行测试：
```bash
npm test -- Export.test.jsx
```

## 注意事项

1. **大数据量导出**: 导出大量数据时可能需要较长时间，建议使用过滤条件减少数据量
2. **文件格式**: 不同格式适用于不同场景，CSV 适合表格处理，JSON 适合程序处理，XLSX 适合办公场景
3. **浏览器限制**: 大文件下载可能受浏览器限制，建议使用现代浏览器
4. **并发导出**: 系统可能限制同时进行的导出任务数量
5. **存储限制**: 导出文件可能有大小限制，超出限制需要分批导出

## 未来优化方向

1. 支持定时导出任务
2. 支持导出模板保存和复用
3. 支持邮件发送导出文件
4. 支持云存储同步
5. 支持增量导出
6. 支持导出任务优先级设置
7. 支持导出压缩打包

## 相关文档

- [Ant Design 组件库](https://ant.design/)
- [React 官方文档](https://react.dev/)
- [项目架构文档](../../docs/ARCHITECTURE.md)
