# OpenClaw Dashboard

OpenClaw Dashboard 是一个现代化的 Web 应用，用于管理和监控 OpenClaw 系统。

## 项目结构

```
openclaw-dashboard/
├── frontend/          # React + TypeScript + Vite 前端
│   ├── src/          # 源代码
│   ├── public/       # 静态资源
│   └── package.json  # 前端依赖和脚本
├── backend/          # Node.js + TypeScript + Express 后端
│   ├── src/          # 源代码
│   └── package.json  # 后端依赖和脚本
└── README.md         # 项目说明文档
```

## 技术栈

### 前端
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **ESLint + Prettier** - 代码规范

### 后端
- **Node.js** - 运行时
- **TypeScript** - 类型安全
- **Express** - Web 框架
- **ESLint + Prettier** - 代码规范

## 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
# 安装所有依赖（从项目根目录）
npm run install:all

# 或者分别安装
cd frontend && npm install
cd ../backend && npm install
```

### 启动开发服务器

#### 方式一：同时启动前后端
```bash
# 从项目根目录
npm run dev
```

#### 方式二：分别启动

**前端**
```bash
cd frontend
npm run dev
```
访问地址：http://localhost:5173

**后端**
```bash
cd backend
npm run dev
```
访问地址：http://localhost:3001
健康检查：http://localhost:3001/api/health

### 构建生产版本

```bash
# 构建所有（从项目根目录）
npm run build

# 或者分别构建
cd frontend && npm run build
cd ../backend && npm run build
```

### 代码规范检查

```bash
# 检查所有（从项目根目录）
npm run lint

# 或者分别检查
cd frontend && npm run lint:check
cd ../backend && npm run lint:check
```

### 自动修复代码格式

```bash
# 格式化所有（从项目根目录）
npm run format

# 或者分别格式化
cd frontend && npm run format
cd ../backend && npm run format
```

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api` | GET | API 欢迎信息 |
| `/api/health` | GET | 健康检查 |

## 开发规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 提交前运行 lint 和 format 检查

## 环境变量

### 后端 (.env)
```bash
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
API_PREFIX=/api
```

### 前端 (.env)
```bash
VITE_API_URL=http://localhost:3001/api
VITE_APP_TITLE=OpenClaw Dashboard
```

## License

ISC
