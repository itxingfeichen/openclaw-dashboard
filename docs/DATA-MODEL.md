# OpenClaw Dashboard 数据模型文档

本文档描述 OpenClaw Dashboard 项目的数据库模型设计，基于 Prisma ORM 和 SQLite 数据库。

## 目录

- [概述](#概述)
- [核心模型](#核心模型)
  - [User (用户)](#user-用户)
  - [Session (会话)](#session-会话)
  - [Dashboard (仪表盘)](#dashboard-仪表盘)
  - [Widget (组件)](#widget-组件)
- [关系图](#关系图)
- [使用指南](#使用指南)
- [迁移与种子数据](#迁移与种子数据)

---

## 概述

本项目使用 **Prisma ORM** 配合 **SQLite** 数据库，提供类型安全的数据库访问层。

**技术栈**:
- ORM: Prisma ^7.5.0
- 数据库：SQLite (通过 @libsql/client)
- 运行时：Node.js + TypeScript

**设计原则**:
- 使用 UUID 作为主键，避免 ID 暴露
- 所有模型包含时间戳字段 (createdAt/updatedAt)
- 使用级联删除维护数据一致性
- 关键外键字段建立索引优化查询性能

---

## 核心模型

### User (用户)

系统用户模型，用于身份认证和权限管理。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | @id @default(uuid()) | 主键，UUID 自动生成 |
| email | String | @unique | 用户邮箱，唯一索引 |
| password | String | - | 密码哈希 (bcrypt) |
| name | String | ? | 用户名称，可选 |
| createdAt | DateTime | @default(now()) | 创建时间 |
| updatedAt | DateTime | @updatedAt | 更新时间 (自动) |

**关系**:
- `1:N` → Session (用户会话)
- `1:N` → Dashboard (用户仪表盘)

**索引**:
- email (唯一索引 + 普通索引)

**示例**:
```typescript
const user = await prisma.user.create({
  data: {
    email: 'admin@example.com',
    password: '$2b$10$hashed...',
    name: 'Administrator',
  },
});
```

---

### Session (会话)

用户会话模型，用于管理登录状态和令牌验证。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | @id @default(uuid()) | 主键，UUID 自动生成 |
| userId | String | - | 关联用户 ID (外键) |
| token | String | @unique | 会话令牌，唯一 |
| expiresAt | DateTime | - | 会话过期时间 |
| createdAt | DateTime | @default(now()) | 创建时间 |

**关系**:
- `N:1` → User (级联删除)

**索引**:
- userId (索引)
- token (唯一索引)

**示例**:
```typescript
const session = await prisma.session.create({
  data: {
    userId: 'user-id',
    token: 'secure-random-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 天
  },
});
```

---

### Dashboard (仪表盘)

用户自定义的仪表板配置模型。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | @id @default(uuid()) | 主键，UUID 自动生成 |
| userId | String | - | 关联用户 ID (外键) |
| name | String | - | 仪表盘名称 |
| config | String | ? | JSON 配置字符串 |
| createdAt | DateTime | @default(now()) | 创建时间 |
| updatedAt | DateTime | @updatedAt | 更新时间 (自动) |

**关系**:
- `N:1` → User (级联删除)
- `1:N` → Widget (仪表盘组件)

**索引**:
- userId (索引)

**示例**:
```typescript
const dashboard = await prisma.dashboard.create({
  data: {
    userId: 'user-id',
    name: 'System Overview',
    config: JSON.stringify({ layout: 'grid', refreshInterval: 30 }),
  },
});
```

---

### Widget (组件)

仪表板中的小部件/组件模型。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | @id @default(uuid()) | 主键，UUID 自动生成 |
| dashboardId | String | - | 关联仪表盘 ID (外键) |
| type | String | - | 组件类型 (metric/chart/table) |
| config | String | ? | JSON 配置字符串 |
| position | Int | - | 显示顺序/位置 |
| createdAt | DateTime | @default(now()) | 创建时间 |

**关系**:
- `N:1` → Dashboard (级联删除)

**索引**:
- dashboardId (索引)

**支持的组件类型**:
- `metric` - 指标卡片 (CPU、内存使用率等)
- `chart` - 图表 (折线图、柱状图等)
- `table` - 数据表格
- `log` - 日志查看器

**示例**:
```typescript
const widget = await prisma.widget.create({
  data: {
    dashboardId: 'dashboard-id',
    type: 'metric',
    config: JSON.stringify({ title: 'CPU Usage', unit: '%' }),
    position: 1,
  },
});
```

---

## 关系图

```
┌──────────────────┐
│      User        │
│ ──────────────── │
│ id (PK)          │
│ email (unique)   │
│ password         │
│ name             │
│ createdAt        │
│ updatedAt        │
└────────┬─────────┘
         │
    ┌────┴────┐
    │  1 : N  │
    ▼         ▼
┌─────────┐  ┌──────────────┐
│ Session │  │  Dashboard   │
│ ─────── │  │ ──────────── │
│ id (PK) │  │ id (PK)      │
│ userId  │  │ userId (FK)  │
│ token   │  │ name         │
│ expires │  │ config       │
│ created │  │ createdAt    │
│         │  │ updatedAt    │
└─────────┘  └──────┬───────┘
                    │
               1 : N│
                    ▼
              ┌──────────┐
              │  Widget  │
              │ ──────── │
              │ id (PK)  │
              │ dashId   │
              │ type     │
              │ config   │
              │ position │
              │ created  │
              └──────────┘
```

---

## 使用指南

### Prisma 客户端导入

```typescript
import { prisma, connectDatabase, disconnectDatabase } from '@/lib/prisma';

// 应用启动时连接
await connectDatabase();

// 使用客户端
const users = await prisma.user.findMany();

// 应用关闭时断开
await disconnectDatabase();
```

### 常用查询模式

**查询用户及其关联数据**:
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: {
    sessions: true,
    dashboards: {
      include: {
        widgets: true,
      },
    },
  },
});
```

**事务操作**:
```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ /* ... */ });
  await tx.dashboard.create({
    data: { userId: user.id, name: 'Default' },
  });
});
```

---

## 迁移与种子数据

### 数据库迁移

```bash
cd backend

# 创建新迁移
pnpm db:migrate

# 重置数据库 (开发环境)
pnpm prisma migrate reset

# 打开 Prisma Studio
pnpm db:studio
```

### 种子数据

```bash
# 运行种子脚本
pnpm db:seed
```

种子数据包含:
- 2 个示例用户 (admin@example.com, user@example.com)
- 1 个活跃会话
- 2 个示例仪表盘
- 5 个示例组件

---

## 文件结构

```
backend/
├── prisma/
│   ├── schema.prisma      # Prisma 数据模型定义
│   ├── seed.ts            # 种子数据脚本
│   ├── dev.db             # 开发数据库文件
│   └── migrations/        # 迁移文件目录
├── src/
│   └── lib/
│       └── prisma.ts      # Prisma 客户端实例
└── docs/
    └── DATA-MODEL.md      # 本文档
```

---

## 注意事项

1. **密码安全**: 生产环境必须使用 bcrypt 或 Argon2 进行密码哈希
2. **配置存储**: config 字段存储 JSON 字符串，读取时需 `JSON.parse()`
3. **级联删除**: 删除用户会自动删除所有关联的会话、仪表盘和组件
4. **会话过期**: 应用层需定期检查 session.expiresAt 清理过期会话
5. **并发访问**: SQLite 在高并发场景下可能需要优化或迁移到 PostgreSQL

---

_文档版本：1.0_
_最后更新：2026-03-19_
