# 日志查看功能 - 实现文档

## 📋 功能概述

实现了完整的日志查看功能前端页面和组件，支持日志展示、搜索、过滤和分页。

## 📁 交付物清单

### 1. 页面组件
- **`src/pages/Logs/Logs.jsx`** - 日志页面主组件 (9.7KB)
  - 状态管理（日志源、日志数据、分页、搜索、过滤）
  - API 调用（获取日志源、获取日志、搜索日志）
  - 自动刷新功能（30 秒间隔）
  - 导出日志功能（CSV 格式）

- **`src/pages/Logs/Logs.css`** - 样式文件 (2.7KB)
  - 响应式布局
  - 日志级别颜色编码
  - 搜索高亮样式
  - 表格和滚动条样式

### 2. 可复用组件
- **`src/components/LogViewer.jsx`** (3.2KB)
  - 日志表格展示
  - 级别标签（INFO/WARNING/ERROR/DEBUG）
  - 搜索关键词高亮
  - 时间格式化
  - 支持排序和过滤

- **`src/components/LogSourceSelector.jsx`** (0.8KB)
  - 日志源下拉选择
  - 支持搜索过滤

- **`src/components/LogSearchBar.jsx`** (2.4KB)
  - 关键词搜索
  - 级别过滤（全部/INFO/WARNING/ERROR/DEBUG）
  - 时间范围过滤（全部/1 小时/6 小时/24 小时/7 天）

- **`src/components/LogPagination.jsx`** (1.1KB)
  - 分页控制
  - 每页条数选择（20/50/100/200）
  - 显示总记录数

### 3. 测试文件
- **`src/tests/Logs.test.jsx`** (10.3KB)
  - Logs 页面测试（4 个测试用例）
  - LogViewer 组件测试（6 个测试用例）
  - LogSourceSelector 组件测试（3 个测试用例）
  - LogSearchBar 组件测试（4 个测试用例）
  - LogPagination 组件测试（4 个测试用例）
  - 搜索高亮功能测试（2 个测试用例）

### 4. 路由集成
- **`src/App.tsx`** - 已更新
  - 添加日志查看菜单项
  - 集成 Logs 组件到路由系统

## ✨ 功能特性

### 1. 日志源选择
- ✅ 下拉选择日志源
- ✅ 支持搜索过滤
- ✅ 自动加载可用日志源列表

### 2. 日志展示
- ✅ 表格形式展示
- ✅ 级别颜色编码：
  - INFO: 蓝色
  - WARNING: 橙色
  - ERROR: 红色
  - DEBUG: 绿色
- ✅ 时间格式化（本地化显示）
- ✅ 支持 600px 高度滚动区域

### 3. 搜索功能
- ✅ 关键词搜索
- ✅ 搜索结果高亮显示
- ✅ 支持不区分大小写
- ✅ 处理特殊字符

### 4. 过滤功能
- ✅ 级别过滤（INFO/WARNING/ERROR/DEBUG）
- ✅ 时间范围过滤（1h/6h/24h/7d）
- ✅ 组合过滤支持

### 5. 分页功能
- ✅ 页码导航
- ✅ 每页条数选择（20/50/100/200）
- ✅ 显示当前范围和总数
- ✅ 快速跳转

### 6. 自动刷新
- ✅ 开关控制
- ✅ 30 秒间隔刷新
- ✅ 手动刷新按钮

### 7. 导出功能
- ✅ CSV 格式导出
- ✅ 包含 BOM 头（支持中文）
- ✅ 文件名包含时间戳

## 🔌 API 接口

### GET /api/logs/sources
获取日志源列表
```json
["system", "application", "agent", "gateway"]
```

### GET /api/logs/:source?page=1&limit=50
获取日志数据
```json
{
  "logs": [
    {
      "id": "log-1",
      "level": "info",
      "message": "Agent started",
      "source": "system",
      "timestamp": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 100
}
```

### GET /api/logs/:source/search?q=keyword
搜索日志
```json
{
  "logs": [...],
  "total": 10
}
```

## 🎨 设计参考

参考了现有组件的设计模式：
- 遵循 `Dashboard.jsx` 的状态管理和 API 调用模式
- 使用 Ant Design 组件库保持一致的 UI 风格
- 复用 `StatCard.jsx` 的组件结构设计

## 🧪 测试运行

```bash
cd /home/admin/openclaw-dashboard/frontend
npm test -- Logs.test
```

## 🚀 使用说明

1. 在导航栏点击"日志查看"
2. 选择日志源（system/application/agent/gateway）
3. 使用搜索框输入关键词
4. 使用级别和时间范围过滤
5. 查看日志详情
6. 可导出日志为 CSV 文件

## 📝 注意事项

1. **模拟数据**: 当 API 不可用时，组件会自动使用模拟数据进行演示
2. **错误处理**: 所有 API 调用都有错误处理和降级方案
3. **响应式设计**: 支持移动端和桌面端自适应
4. **性能优化**: 使用 useCallback 和 useMemo 优化渲染性能

## 🔧 后续优化建议

1. 添加日志详情弹窗
2. 支持多日志源同时查看
3. 添加日志收藏/标记功能
4. 支持日志图表分析
5. 添加实时日志流（WebSocket）
