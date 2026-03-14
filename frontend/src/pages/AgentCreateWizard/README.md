# Agent 创建向导 (AgentCreateWizard)

## 概述

多步骤 Agent 创建向导，提供用户友好的分步界面，支持工具权限配置、工作空间设置等高级功能。

## 功能特性

### 1. 多步骤表单（5 步）
- **步骤 1：基本信息** - Agent 名称和描述
- **步骤 2：模型配置** - AI 模型选择
- **步骤 3：工具权限** - 详细的工具权限配置
- **步骤 4：工作空间** - 工作目录设置
- **步骤 5：配置预览** - 确认所有配置信息

### 2. 步骤进度展示
- 顶部步骤导航条
- 可点击的步骤指示器
- 实时进度更新
- 支持返回已完成的步骤

### 3. 导航控制
- 上一步/下一步按钮
- 步骤验证后才允许前进
- 支持重置表单
- 创建过程中显示进度

### 4. 工具权限详细配置
- 按类别分组（文件操作、系统操作、网络访问、通信、媒体处理）
- 风险等级标识（低/中/高）
- 快速选择预设（基础权限、开发权限、全部权限）
- 高风险工具警告提示
- 可视化已选择工具标签

### 5. 工作空间路径验证
- 预设工作空间选择
- 自定义路径输入
- 实时路径格式验证
- 基于 Agent 名称的智能路径建议
- 路径安全检测（防止目录穿越）

### 6. 配置预览
- 完整的配置信息展示
- 描述性标签展示
- 创建前最终确认
- 支持返回编辑

### 7. 创建确认
- 多步骤创建进度展示
- 实时进度条
- 成功/失败状态反馈
- 自动跳转到详情页

## 文件结构

```
frontend/src/
├── pages/
│   └── AgentCreateWizard/
│       ├── AgentCreateWizard.jsx      # 向导主页面组件
│       └── AgentCreateWizard.css      # 样式文件
├── components/
│   ├── WizardSteps.jsx                # 步骤导航组件
│   ├── ToolPermissionConfig.jsx       # 工具权限配置组件
│   └── WorkspaceConfig.jsx            # 工作空间配置组件
└── tests/
    └── AgentCreateWizard.test.jsx     # 单元测试
```

## 组件说明

### AgentCreateWizard (主页面)
- 管理向导状态和步骤导航
- 处理表单验证和提交
- 集成所有子组件
- 处理 Agent 创建流程

### WizardSteps
- 显示步骤进度
- 提供步骤导航
- 支持点击跳转（仅限已完成步骤）
- 可视化步骤状态

### ToolPermissionConfig
- 展示所有可用工具
- 按类别分组显示
- 风险等级标识
- 快速选择功能
- 支持单个/批量选择

### WorkspaceConfig
- 预设工作空间选择
- 自定义路径输入
- 实时路径验证
- 智能路径建议
- 安全提示

## 使用方法

### 路由访问
```javascript
// 访问向导页面
navigate('/agents/create-wizard')
```

### 在 App 中的路由配置
```javascript
<Route path="/agents/create-wizard" element={<AgentCreateWizard />} />
```

## 技术实现

### 状态管理
- 使用 React hooks 管理向导状态
- Form 实例管理表单数据
- 分步验证机制

### 验证逻辑
- 实时名称验证（防抖）
- 路径格式验证
- 工具权限必填验证
- 模型选择验证

### 样式设计
- 响应式布局
- Ant Design 组件库
- 自定义动画效果
- 移动端适配

## API 调用

### validateAgentConfig
验证 Agent 配置（名称唯一性等）

```javascript
const result = await validateAgentConfig({ 
  name: 'Agent Name',
  workspacePath: '/path/to/workspace'
});
```

### createAgent
创建 Agent 实例

```javascript
const result = await createAgent({
  name: 'Agent Name',
  description: 'Description',
  model: 'qwen3.5-plus',
  tools: ['read', 'write'],
  workspacePath: '/path/to/workspace',
});
```

## 测试

### 单元测试覆盖
- 向导导航逻辑
- 表单验证
- 工具权限配置
- 工作空间配置
- 创建流程
- 错误处理

### 运行测试
```bash
# 使用 vitest
vitest run src/tests/AgentCreateWizard.test.jsx
```

## 样式定制

主要 CSS 类：
- `.agent-create-wizard-page` - 页面容器
- `.wizard-card` - 主卡片
- `.wizard-steps-container` - 步骤导航
- `.wizard-content` - 内容区域
- `.wizard-navigation` - 导航按钮
- `.tool-permission-config` - 工具配置
- `.workspace-config` - 工作空间配置

## 响应式设计

- **桌面端** (>1024px): 完整布局，显示侧边栏提示
- **平板端** (768px-1024px): 调整步骤指示器大小
- **移动端** (<768px): 简化布局，隐藏侧边栏

## 注意事项

1. **工具权限**: 遵循最小权限原则，仅选择必要工具
2. **工作空间**: 使用专用目录，避免文件冲突
3. **名称验证**: 创建后不可修改，需谨慎选择
4. **高风险工具**: exec 等工具需特别注意安全性

## 未来改进

- [ ] 支持从模板导入配置
- [ ] 添加配置保存为模板功能
- [ ] 增强工作空间路径自动创建
- [ ] 添加更多模型选项
- [ ] 支持批量创建 Agent
- [ ] 添加配置导入/导出功能

## 更新日志

### v1.0.0 (2026-03-14)
- 初始版本发布
- 实现 5 步向导流程
- 工具权限详细配置
- 工作空间路径验证
- 完整的单元测试
