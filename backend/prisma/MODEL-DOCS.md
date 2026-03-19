# Prisma 数据模型文档

本文档描述了 OpenClaw Dashboard 的数据库模型设计。

## 概述

本项目使用 **Prisma ORM** 配合 **SQLite** 数据库，提供类型安全的数据库访问。

## 核心模型

### 1. User (用户)

系统用户模型，用于身份认证和权限管理。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 主键，自动生成 |
| email | String (unique) | 用户邮箱，唯一 |
| password | String | 密码哈希 |
| name | String? | 用户名称，可选 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**关系**:
- 一对多 → Sessions (用户会话)
- 一对多 → Dashboards (用户仪表盘)

**索引**:
- email (唯一索引)
- email (普通索引)

---

### 2. Session (会话)

用户会话模型，用于管理登录状态和令牌。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 主键，自动生成 |
| userId | String | 关联用户 ID (外键) |
| token | String (unique) | 会话令牌，唯一 |
| expiresAt | DateTime | 过期时间 |
| createdAt | DateTime | 创建时间 |

**关系**:
- 多对一 → User (级联删除)

**索引**:
- userId (索引)
- token (唯一索引 + 普通索引)

---

### 3. Dashboard (仪表盘)

用户自定义的仪表板配置模型。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 主键，自动生成 |
| userId | String | 关联用户 ID (外键) |
| name | String | 仪表盘名称 |
| config | String? | JSON 配置字符串 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**关系**:
- 多对一 → User (级联删除)
- 一对多 → Widgets (仪表盘组件)

**索引**:
- userId (索引)

---

### 4. Widget (组件)

仪表板中的小部件/组件模型。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 主键，自动生成 |
| dashboardId | String | 关联仪表盘 ID (外键) |
| type | String | 组件类型 (如: "chart", "table", "metric") |
| config | String? | JSON 配置字符串 |
| position | Int | 显示顺序/位置 |
| createdAt | DateTime | 创建时间 |

**关系**:
- 多对一 → Dashboard (级联删除)

**索引**:
- dashboardId (索引)

---

## 数据库关系图

```
┌─────────────┐       ┌─────────────┐
│    User     │       │   Session   │
├─────────────┤       ├─────────────┤
│ id          │◄──────│ userId      │
│ email       │       │ token       │
│ password    │       │ expiresAt   │
│ name        │       │ createdAt   │
│ createdAt   │       └─────────────┘
│ updatedAt   │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐       ┌─────────────┐
│  Dashboard  │       │   Widget    │
├─────────────┤       ├─────────────┤
│ id          │◄──────│ dashboardId │
│ userId      │       │ type        │
│ name        │       │ config      │
│ config      │       │ position    │
│ createdAt   │       │ createdAt   │
│ updatedAt   │       └─────────────┘
└─────────────┘
```

## 使用示例

### 创建用户

```typescript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: 'hashed_password',
    name: 'John Doe',
  },
});
```

### 创建仪表盘及组件

```typescript
const dashboard = await prisma.dashboard.create({
  data: {
    userId: 'user-id',
    name: 'My Dashboard',
    config: JSON.stringify({ layout: 'grid' }),
    widgets: {
      create: [
        {
          type: 'metric',
          config: JSON.stringify({ title: 'CPU' }),
          position: 1,
        },
        {
          type: 'chart',
          config: JSON.stringify({ title: 'Memory' }),
          position: 2,
        },
      ],
    },
  },
});
```

### 查询用户及其仪表盘

```typescript
const userWithDashboards = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: {
    dashboards: {
      include: {
        widgets: true,
      },
    },
  },
});
```

## 种子数据

运行以下命令填充示例数据：

```bash
npm run db:seed
```

种子数据包括：
- 2 个示例用户 (admin@example.com, user@example.com)
- 1 个会话
- 2 个仪表盘 (System Overview, Performance Metrics)
- 5 个组件 (metric, chart, table 类型)

## 数据库迁移

```bash
# 创建新迁移
npm run db:migrate

# 打开 Prisma Studio 可视化数据库
npm run db:studio
```

## 注意事项

1. **密码存储**: 生产环境中应使用 bcrypt 或其他安全哈希算法
2. **配置存储**: config 字段使用 JSON 字符串存储，读取时需要解析
3. **级联删除**: 删除用户会自动删除其所有会话、仪表盘和组件
4. **位置字段**: Widget 的 position 字段用于控制组件显示顺序
