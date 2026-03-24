# OpenClaw Dashboard - Docker 部署指南

本文档介绍如何使用 Docker Compose 一键部署 OpenClaw Dashboard。

## 📋 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (仅用于本地开发)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd openclaw-dashboard
```

### 2. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，修改以下关键配置：
# - JWT_SECRET: 设置一个强随机密钥（生产环境必须修改！）
# - 其他配置可根据需要调整
```

### 3. 一键启动服务

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 访问应用

- **前端界面**: http://localhost:80
- **后端 API**: http://localhost:3001
- **API 健康检查**: http://localhost:3001/api/health

## 🏗️ 服务架构

```
┌─────────────────┐
│    Frontend     │  Port 80
│  (nginx + React)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Backend     │  Port 3001
│ (Node.js + Express)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Database     │  SQLite (volume)
│     (SQLite)    │
└─────────────────┘
```

### 服务说明

| 服务 | 端口 | 说明 |
|------|------|------|
| frontend | 80 | React 前端，使用 nginx 托管静态资源 |
| backend | 3001 | Node.js + Express API 服务 |
| database | - | SQLite 数据库（数据存储在 Docker volume） |

## 🔧 常用命令

### 服务管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 重新构建并启动
docker-compose up -d --build
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 进入容器

```bash
# 进入 backend 容器
docker-compose exec backend sh

# 进入 frontend 容器
docker-compose exec frontend sh
```

### 数据库管理

```bash
# 查看数据库文件位置
docker volume inspect openclaw-dashboard_db-data

# 备份数据库
docker run --rm \
  -v openclaw-dashboard_db-data:/source \
  -v $(pwd):/backup \
  alpine tar czf /backup/db-backup.tar.gz -C /source .
```

## 🔒 生产环境部署

### 安全建议

1. **修改 JWT_SECRET**: 使用强随机密钥
   ```bash
   # 生成随机密钥
   openssl rand -base64 32
   ```

2. **使用 HTTPS**: 在生产环境中配置反向代理（如 Nginx）处理 SSL/TLS

3. **限制 CORS**: 在 `.env` 中设置具体的域名，不要使用 `*`

4. **定期更新**: 保持 Docker 镜像和依赖库更新

### Docker Compose 生产配置示例

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M

  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

## 🐛 故障排查

### 服务无法启动

```bash
# 查看详细日志
docker-compose logs backend
docker-compose logs frontend

# 检查容器状态
docker-compose ps -a

# 检查端口占用
docker ps --format "table {{.Ports}}"
```

### 数据库问题

```bash
# 检查数据库 volume
docker volume ls | grep openclaw

# 重置数据库（会删除所有数据！）
docker volume rm openclaw-dashboard_db-data
docker-compose up -d
```

### 健康检查失败

```bash
# 手动检查健康状态
docker inspect --format='{{.State.Health.Status}}' openclaw-dashboard-backend
docker inspect --format='{{.State.Health.Status}}' openclaw-dashboard-frontend

# 查看健康检查日志
docker inspect --format='{{json .State.Health}}' openclaw-dashboard-backend | jq
```

## 📊 监控与维护

### 查看资源使用

```bash
# 查看容器资源使用
docker stats openclaw-dashboard-backend openclaw-dashboard-frontend
```

### 清理资源

```bash
# 停止并删除所有容器、网络
docker-compose down

# 删除 volume（会删除数据库！）
docker-compose down -v

# 清理未使用的镜像
docker image prune -a
```

## 📝 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建并部署
docker-compose up -d --build

# 验证部署
curl http://localhost:3001/api/health
```

## 🆘 获取帮助

如有问题，请查看：
- 项目 README.md
- 后端 API 文档：http://localhost:3001/api/docs
- GitHub Issues

---

_最后更新：2026-03-24_
