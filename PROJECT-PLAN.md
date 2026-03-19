# OpenClaw Dashboard - Project Plan

## Phase 1: 基础架构 ✅
- [x] T1.1: 项目脚手架搭建 (React + Vite + TypeScript + Express)
- [x] T1.2: ESLint + Prettier 代码规范配置
- [x] T1.3: 数据库设计 (SQLite + Prisma ORM)

## Phase 2: 后端核心功能 🔄
- [ ] T2.1: 用户认证模块 (JWT + Session 管理)
- [ ] T2.2: API 路由设计 (RESTful 风格)
- [ ] T2.3: 数据模型实现 (Prisma Schema)
- [ ] T2.4: 单元测试配置 (Jest + Supertest)

## Phase 3: 前端核心功能 ⏳
- [ ] T3.1: 登录/注册页面
- [ ] T3.2: Dashboard 主界面布局
- [ ] T3.3: 状态管理 (Zustand/Redux)
- [ ] T3.4: API 客户端封装 (Axios + React Query)

## Phase 4: DevOps & 部署 ⏳
- [ ] T4.1: Docker 容器化配置
- [ ] T4.2: CI/CD Pipeline (GitHub Actions)
- [ ] T4.3: 生产环境配置
- [ ] T4.4: 监控和日志系统

---

## 当前阶段：Phase 2 - 后端核心功能

### 优先级排序
1. **T2.3: 数据模型实现** - 基础依赖，优先开发
2. **T2.2: API 路由设计** - 基于数据模型
3. **T2.1: 用户认证模块** - 核心安全功能
4. **T2.2: 单元测试配置** - 质量保障

### 任务依赖关系
```
T2.3 (数据模型) → T2.2 (API 路由) → T2.1 (用户认证)
                              ↓
                         T2.4 (单元测试)
```

---

## Git 分支开发流程

1. 从 main 创建功能分支：`feature/{task-id}-{task-name}`
2. 子 Agent 在功能分支上开发
3. 完成后推送到 GitHub
4. 创建 Merge Request (MR) 到 main 分支
5. 主 Agent 进行代码审查 (CR)
6. 审查通过后合并到 main
7. 删除功能分支

### 分支命名规范
- 格式：`feature/{task-id}-{task-name}`
- 示例：`feature/t2.3-data-models`

### 提交信息规范
- 格式：`feat: {task-name} - {date}`
- 示例：`feat: implement Prisma schemas - 2026-03-18`

### MR 规范
- 标题：`{Task ID}: {task-name}`
- 必须通过 CR 才能合并
- 关联任务 ID

---

## 访问地址
- 开发环境：http://localhost:8080
- 后端 API: http://localhost:3001/api
- 前端开发：http://localhost:5173
