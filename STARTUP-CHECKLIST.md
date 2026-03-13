# OpenClaw Dashboard - 项目启动清单

## 📋 项目信息

| 字段 | 内容 |
|------|------|
| **项目名称** | OpenClaw Dashboard |
| **工作空间** | `/home/admin/openclaw-dashboard` |
| **启动日期** | 2026-03-17 |
| **项目经理** | 待指定 |
| **技术负责人** | 待指定 |

---

## ✅ 环境准备清单

### 1. 开发环境

#### 1.1 Node.js 环境
- [ ] 安装 Node.js >= 20.x（推荐使用 nvm 管理）
  ```bash
  # 检查版本
  node --version
  
  # 安装 nvm（如未安装）
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  
  # 安装 Node.js 20
  nvm install 20
  nvm use 20
  ```

- [ ] 安装 npm >= 9.x
  ```bash
  npm --version
  ```

#### 1.2 OpenClaw 环境
- [ ] 确认 OpenClaw 已安装且可用
  ```bash
  openclaw --version
  openclaw gateway status
  ```

- [ ] 确认 OpenClaw 工作空间路径
  ```bash
  # 默认路径
  ls -la /home/admin/.openclaw/workspace/
  ```

- [ ] 确认 CLI 命令可用
  ```bash
  openclaw sessions_list --json
  openclaw subagents list
  ```

#### 1.3 开发工具
- [ ] 安装 Git
  ```bash
  git --version
  ```

- [ ] 安装代码编辑器（VS Code 推荐）
  - [ ] 安装 ESLint 插件
  - [ ] 安装 Prettier 插件
  - [ ] 安装 TypeScript 插件

- [ ] 安装 Postman 或类似 API 测试工具

#### 1.4 数据库工具（可选）
- [ ] 安装 SQLite 浏览器（DB Browser for SQLite）
- [ ] 或安装 PostgreSQL 客户端（如 pgAdmin）

---

### 2. 运行环境

#### 2.1 系统要求
- [ ] 操作系统：Linux / macOS / Windows
- [ ] 内存：>= 4GB（推荐 8GB+）
- [ ] 磁盘：>= 10GB 可用空间
- [ ] 网络：可访问 skillhub/clawhub 注册表

#### 2.2 端口检查
- [ ] 确认 8080 端口未被占用
  ```bash
  # Linux/macOS
  lsof -i :8080
  
  # 或被占用时修改端口
  export PORT=8081
  ```

#### 2.3 权限检查
- [ ] 确认工作空间目录读写权限
  ```bash
  ls -la /home/admin/openclaw-dashboard/
  chmod -R 755 /home/admin/openclaw-dashboard/
  ```

- [ ] 确认 OpenClaw 日志目录访问权限
  ```bash
  ls -la /home/admin/.openclaw/logs/
  ```

---

## 📦 依赖安装清单

### 1. 前端依赖

#### 1.1 创建前端项目
```bash
# 进入项目目录
cd /home/admin/openclaw-dashboard

# 创建前端目录
mkdir -p frontend
cd frontend

# 使用 Vite 创建 React + TypeScript 项目
npm create vite@latest . -- --template react-ts
```

#### 1.2 安装核心依赖
```bash
npm install react@^18.2.0 react-dom@^18.2.0

# UI 组件库
npm install antd@^5.x @ant-design/icons@^5.x

# 状态管理
npm install zustand@^4.x

# 路由
npm install react-router-dom@^6.x

# 图表库
npm install echarts@^5.x echarts-for-react@^3.x

# 代码编辑器
npm install @monaco-editor/react@^4.x

# HTTP 客户端
npm install axios@^1.x

# 工具库
npm install dayjs@^1.x lodash@^4.x

# WebSocket
npm install ws@^8.x @types/ws@^8.x
```

#### 1.3 安装开发依赖
```bash
npm install -D typescript@^5.x vite@^5.x @types/react@^18.x @types/node@^20.x

# 代码质量
npm install -D eslint@^8.x prettier@^3.x eslint-config-prettier

# 测试
npm install -D vitest@^1.x @testing-library/react@^14.x
```

### 2. 后端依赖

#### 2.1 创建后端项目
```bash
# 返回项目根目录
cd /home/admin/openclaw-dashboard

# 创建后端目录
mkdir -p backend
cd backend

# 初始化 npm 项目
npm init -y

# 安装 TypeScript
npm install typescript@^5.x tsx@^4.x
npx tsc --init
```

#### 2.2 安装核心依赖
```bash
# Web 框架
npm install express@^4.x cors@^2.x helmet@^7.x

# 认证
npm install jsonwebtoken@^9.x bcryptjs@^2.x

# 限流
npm install express-rate-limit@^7.x

# WebSocket
npm install ws@^8.x

# 数据库
npm install better-sqlite3@^9.x

# 系统信息
npm install systeminformation@^5.x

# 文件监听
npm install chokidar@^3.x

# 工具库
npm install dotenv@^16.x lodash@^4.x
```

#### 2.3 安装开发依赖
```bash
npm install -D @types/express@^4.x @types/node@^20.x @types/ws@^8.x @types/better-sqlite3@^7.x

# 开发工具
npm install -D nodemon@^3.x

# 测试
npm install -D jest@^29.x @types/jest@^29.x supertest@^6.x
```

### 3. 全局工具

#### 3.1 进程管理（生产环境）
```bash
npm install -g pm2
```

#### 3.2 代码质量工具
```bash
npm install -g eslint prettier
```

---

## ⚙️ 配置项清单

### 1. 环境变量配置

#### 1.1 创建 .env 文件
在项目根目录创建 `.env` 文件：

```bash
# 服务配置
PORT=8080
NODE_ENV=development

# JWT 配置（生产环境必须修改）
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

# OpenClaw 配置
OPENCLAW_WORKSPACE=/home/admin/.openclaw/workspace
OPENCLAW_LOGS=/home/admin/.openclaw/logs

# 数据库配置
DATABASE_PATH=/home/admin/openclaw-dashboard/data/dashboard.db

# 缓存配置
CACHE_TTL_AGENTS=30
CACHE_TTL_TASKS=10
CACHE_TTL_SKILLS=3600

# 日志配置
LOG_LEVEL=info
LOG_MAX_FILE_SIZE=104857600
LOG_MAX_FILES=10

# 安全配置
CORS_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
```

#### 1.2 创建 .env.example 文件
```bash
cp .env .env.example
# 编辑 .env.example，移除敏感信息
```

### 2. Git 配置

#### 2.1 创建 .gitignore 文件
```gitignore
# 依赖
node_modules/
package-lock.json

# 环境配置
.env
.env.local
.env.*.local

# 构建输出
dist/
build/

# 数据库
*.db
*.sqlite

# 日志
logs/
*.log

# 系统文件
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
```

#### 2.2 初始化 Git 仓库
```bash
cd /home/admin/openclaw-dashboard
git init
git add .
git commit -m "Initial commit: OpenClaw Dashboard project setup"
```

### 3. 项目配置文件

#### 3.1 前端 Vite 配置
创建 `frontend/vite.config.ts`：
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
})
```

#### 3.2 后端 TypeScript 配置
创建 `backend/tsconfig.json`：
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 3.3 后端 Express 服务器配置
创建 `backend/src/index.ts`：
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || 'http://localhost:5173',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Dashboard server running on port ${PORT}`);
});
```

### 4. 数据库初始化

#### 4.1 创建数据库迁移脚本
创建 `backend/src/database/migrate.ts`：
```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 配置版本表
CREATE TABLE IF NOT EXISTS config_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL,
  author_id INTEGER,
  change_log TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- 操作审计表
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_config_versions_path ON config_versions(file_path);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- 插入默认管理员账户（密码：admin123，需要 bcrypt 哈希）
INSERT OR IGNORE INTO users (username, password_hash, role) 
VALUES ('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu', 'admin');
```

---

## 🚀 第一周必须完成的任务

### 第 1 周任务清单（2026-03-17 ~ 2026-03-23）

#### 任务 1: 项目脚手架搭建（T1.1）
**负责人**: 全栈开发  
**优先级**: P0  
**预计工时**: 3 人天  

- [ ] **Day 1**: 
  - [ ] 创建项目目录结构
  - [ ] 初始化前端项目（Vite + React + TypeScript）
  - [ ] 初始化后端项目（Node.js + Express + TypeScript）
  - [ ] 配置 ESLint + Prettier

- [ ] **Day 2**:
  - [ ] 安装前端核心依赖（Ant Design、Zustand、React Router）
  - [ ] 安装后端核心依赖（Express、JWT、SQLite）
  - [ ] 配置环境变量和 .env 文件
  - [ ] 创建基础目录结构

- [ ] **Day 3**:
  - [ ] 创建前端基础布局（Header、Sidebar、Content）
  - [ ] 创建后端基础路由结构
  - [ ] 配置开发服务器和热重载
  - [ ] 编写项目 README.md

**交付物**:
- [ ] 可运行的前后端项目骨架
- [ ] 基础布局页面
- [ ] 健康检查 API（`GET /health`）
- [ ] 项目文档（README.md）

**验收标准**:
```bash
# 前端可启动
cd frontend && npm run dev
# 访问 http://localhost:5173 看到基础页面

# 后端可启动
cd backend && npm run dev
# 访问 http://localhost:8080/health 返回 {"status": "ok"}
```

---

#### 任务 2: OpenClaw CLI 适配层（T1.2）
**负责人**: 后端开发  
**优先级**: P0  
**预计工时**: 3 人天  

- [ ] **Day 1**:
  - [ ] 设计 CLI 适配器接口
  - [ ] 实现命令执行工具函数
  - [ ] 定义 CLI 输出 Schema

- [ ] **Day 2**:
  - [ ] 实现 `sessions_list` 命令封装
  - [ ] 实现 `subagents steer` 命令封装
  - [ ] 实现 `skillhub search` 命令封装
  - [ ] 添加输出格式校验

- [ ] **Day 3**:
  - [ ] 实现错误处理和重试机制
  - [ ] 编写单元测试
  - [ ] 编写使用文档

**交付物**:
- [ ] CLI Adapter 模块（`backend/src/adapters/openclaw-cli.adapter.ts`）
- [ ] 单元测试用例
- [ ] API 文档

**验收标准**:
```typescript
// 测试代码示例
const adapter = new OpenClawCLIAdapter();

// 测试 1: 获取 Agent 列表
const agents = await adapter.getAgents();
expect(agents).toBeInstanceOf(Array);

// 测试 2: 创建子 Agent
const sessionId = await adapter.createSubagent({
  target: 'product_manager',
  message: 'test task',
});
expect(sessionId).toBeDefined();

// 测试 3: 搜索技能
const skills = await adapter.searchSkills('weather');
expect(skills).toBeInstanceOf(Array);
```

---

#### 任务 3: 数据库设计与实现（T1.3）
**负责人**: 后端开发  
**优先级**: P0  
**预计工时**: 2 人天  

- [ ] **Day 1**:
  - [ ] 设计数据库 Schema
  - [ ] 创建数据库迁移脚本
  - [ ] 实现数据库连接模块

- [ ] **Day 2**:
  - [ ] 实现数据访问层（DAO）
  - [ ] 插入测试数据
  - [ ] 编写数据库文档

**交付物**:
- [ ] 数据库 Schema 文件
- [ ] 迁移脚本（`backend/src/database/migrate.ts`）
- [ ] DAO 模块
- [ ] 测试数据

**验收标准**:
```bash
# 运行迁移
cd backend && npm run migrate

# 检查数据库文件
ls -la data/dashboard.db

# 查询测试数据
sqlite3 data/dashboard.db "SELECT * FROM users;"
```

---

#### 任务 4: 基础认证系统（T1.4）
**负责人**: 后端开发  
**优先级**: P0  
**预计工时**: 2 人天  

- [ ] **Day 1**:
  - [ ] 实现用户登录 API（`POST /api/auth/login`）
  - [ ] 实现 JWT Token 生成和验证
  - [ ] 实现密码加密（bcrypt）

- [ ] **Day 2**:
  - [ ] 创建前端登录页面
  - [ ] 实现认证中间件
  - [ ] 实现权限检查装饰器

**交付物**:
- [ ] 认证 API（登录、登出、刷新 Token）
- [ ] 登录页面（`frontend/src/pages/Login.tsx`）
- [ ] 认证中间件（`backend/src/middleware/auth.ts`）

**验收标准**:
```bash
# 测试登录 API
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# 应返回 JWT Token
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 7200
}
```

---

#### 任务 5: 错误处理框架（T1.5）
**负责人**: 后端开发  
**优先级**: P0  
**预计工时**: 2 人天  

- [ ] **Day 1**:
  - [ ] 定义统一错误类型
  - [ ] 实现错误处理中间件
  - [ ] 实现 CLI 命令重试机制

- [ ] **Day 2**:
  - [ ] 实现熔断器模式
  - [ ] 添加错误日志记录
  - [ ] 编写错误处理文档

**交付物**:
- [ ] 错误处理模块（`backend/src/utils/error-handler.ts`）
- [ ] 熔断器实现（`backend/src/utils/circuit-breaker.ts`）
- [ ] 错误处理文档

**验收标准**:
```typescript
// 测试错误处理
try {
  await adapter.executeCommand('invalid-command');
} catch (error) {
  expect(error).toHaveProperty('code');
  expect(error).toHaveProperty('message');
  expect(error).toHaveProperty('statusCode');
}
```

---

#### 任务 6: 项目文档完善
**负责人**: 全栈开发  
**优先级**: P1  
**预计工时**: 1 人天  

- [ ] 完善 README.md
  - [ ] 项目介绍
  - [ ] 快速开始指南
  - [ ] 开发环境配置
  - [ ] 部署说明

- [ ] 创建 CONTRIBUTING.md
  - [ ] 代码规范
  - [ ] Git 工作流
  - [ ] PR 流程

- [ ] 创建 API 文档
  - [ ] 使用 Swagger/OpenAPI
  - [ ] 或编写 Markdown API 文档

**交付物**:
- [ ] README.md
- [ ] CONTRIBUTING.md
- [ ] API 文档

---

## 📊 第 1 周交付物清单

| 交付物 | 负责人 | 状态 | 验收标准 |
|--------|--------|------|----------|
| 项目脚手架 | 全栈 | ⬜ 待开始 | 前后端可运行 |
| CLI 适配层 | 后端 | ⬜ 待开始 | 单元测试通过 |
| 数据库 Schema | 后端 | ⬜ 待开始 | 迁移成功 |
| 认证系统 | 后端 | ⬜ 待开始 | 登录可用 |
| 错误处理 | 后端 | ⬜ 待开始 | 错误规范统一 |
| 项目文档 | 全栈 | ⬜ 待开始 | 文档完整 |

---

## 🎯 第 1 周里程碑验收

**验收时间**: 2026-03-23（第 1 周周末）

**验收标准**:
- [ ] ✅ 前端项目可启动并显示基础页面
- [ ] ✅ 后端项目可启动并通过健康检查
- [ ] ✅ OpenClaw CLI 命令可正常调用
- [ ] ✅ 用户可登录系统
- [ ] ✅ 数据库初始化完成
- [ ] ✅ 错误处理统一规范
- [ ] ✅ 项目文档完整

**验收流程**:
1. 开发团队演示各功能模块
2. 项目经理检查交付物
3. 记录问题和待办事项
4. 确认第 2 周工作计划

---

## 📞 联系方式与支持

### 项目沟通渠道
- **项目群**: （待创建）
- **文档地址**: `/home/admin/openclaw-dashboard/`
- **代码仓库**: （待创建）

### 问题反馈
遇到问题时，请记录以下信息：
1. 问题描述
2. 复现步骤
3. 错误日志
4. 环境信息（Node.js 版本、OpenClaw 版本等）

---

_最后更新：2026-03-12_  
_下次更新：第 1 周验收后_
