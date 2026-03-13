# OpenClaw Dashboard - 快速启动指南

> 🚀 简化部署，快速开发调试

---

## 📋 目录

- [环境准备](#环境准备)
- [快速启动](#快速启动)
- [开发模式](#开发模式)
- [生产环境](#生产环境)
- [常见问题](#常见问题)

---

## 环境准备

### 前置要求

| 组件 | 版本 | 安装方式 |
|------|------|----------|
| **Node.js** | >= 20.x | [nvm](https://github.com/nvm-sh/nvm) 或 [官网](https://nodejs.org/) |
| **OpenClaw** | 最新版 | 已安装并配置 |

### 验证环境

```bash
# 检查 Node.js 版本
node --version  # 应 >= v20.0.0

# 检查 npm 版本
npm --version   # 应 >= 9.0.0

# 检查 OpenClaw
openclaw --version
```

---

## 快速启动

### 1️⃣ 克隆项目（如果是首次）

```bash
cd /home/admin/openclaw-dashboard
```

### 2️⃣ 安装依赖

```bash
npm install
```

### 3️⃣ 启动服务

```bash
# 生产模式（需要先构建）
npm run build
npm start

# 或直接使用开发模式（推荐）
npm run dev
```

### 4️⃣ 访问 Dashboard

打开浏览器访问：**http://localhost:8080**

---

## 开发模式

### 启动开发服务器

```bash
npm run dev
```

**特性**：
- ✅ 前端热重载（HMR）
- ✅ 后端自动重启
- ✅ 源码映射（Source Maps）
- ✅ 详细日志输出

### 项目结构

```
openclaw-dashboard/
├── src/
│   ├── client/          # 前端代码 (React + TypeScript)
│   ├── server/          # 后端代码 (Node.js + Express)
│   └── shared/          # 前后端共享代码
├── public/              # 静态资源
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env                 # 环境变量（可选）
```

### 开发工作流

```bash
# 1. 启动开发服务器
npm run dev

# 2. 修改代码（自动重载）

# 3. 测试功能
# 访问 http://localhost:8080

# 4. 查看日志
# 开发服务器会自动输出日志
```

---

## 生产环境

### 构建并启动

```bash
# 1. 安装依赖（如果是新环境）
npm install --production

# 2. 构建前端
npm run build

# 3. 启动服务
npm start
```

### 使用 PM2 管理进程（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start npm --name "openclaw-dashboard" -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs openclaw-dashboard

# 重启服务
pm2 restart openclaw-dashboard

# 停止服务
pm2 stop openclaw-dashboard

# 开机自启
pm2 startup
pm2 save
```

### 环境变量配置

创建 `.env` 文件：

```bash
# 服务端口
PORT=8080

# 环境
NODE_ENV=production

# JWT 密钥（必须修改！）
JWT_SECRET=your-secure-random-string-here

# OpenClaw 工作空间（可选，自动检测）
OPENCLAW_WORKSPACE=/home/admin/.openclaw/workspace

# 日志目录（可选，自动检测）
OPENCLAW_LOGS=/home/admin/.openclaw/logs
```

### 防火墙配置

```bash
# 如果使用了防火墙，开放 8080 端口
# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# Ubuntu/Debian
sudo ufw allow 8080/tcp
```

---

## 常见问题

### Q1: 端口 8080 被占用

**解决方案**：修改端口

```bash
# 方式 1: 临时修改
PORT=8081 npm start

# 方式 2: 永久修改（编辑 .env）
echo "PORT=8081" >> .env
```

### Q2: `openclaw` 命令找不到

**解决方案**：检查 OpenClaw 安装

```bash
# 检查是否安装
which openclaw

# 如果未安装，按照 OpenClaw 文档安装
# 或检查 PATH 环境变量
export PATH=$PATH:$(npm bin)
```

### Q3: 前端构建失败

**解决方案**：清理缓存重新构建

```bash
# 清理缓存
rm -rf node_modules dist
npm cache clean --force

# 重新安装
npm install

# 重新构建
npm run build
```

### Q4: WebSocket 连接失败

**解决方案**：检查防火墙和网络

```bash
# 确保 8080 端口开放
netstat -tlnp | grep 8080

# 检查防火墙规则
sudo firewall-cmd --list-all
```

### Q5: 日志文件无法读取

**解决方案**：检查文件权限

```bash
# 查看日志目录权限
ls -la /home/admin/.openclaw/logs

# 如果需要，调整权限
chmod -R 755 /home/admin/.openclaw/logs
```

---

## 技术栈

### 前端
- React 18 + TypeScript
- Ant Design 5.x
- Zustand（状态管理）
- ECharts（图表）
- Monaco Editor（代码编辑器）
- Vite 5.x（构建工具）

### 后端
- Node.js 20+
- Express 4.x
- WebSocket (ws 库)
- SQLite（轻量数据库）
- JWT（认证）

### 部署
- Node.js 直接运行
- PM2 进程管理
- 默认端口：8080

---

## 下一步

启动成功后，你可以：

1. 📊 查看系统状态仪表盘
2. 🤖 管理 Agent（创建、启动、停止）
3. 📝 查看任务列表和日志
4. 🔧 搜索和安装技能
5. ⚙️ 编辑配置文件

---

## 获取帮助

- 📖 查看 [TECHNICAL-DESIGN.md](./TECHNICAL-DESIGN.md) 了解技术细节
- 🐛 遇到问题？检查日志：`pm2 logs openclaw-dashboard`
- 💬 联系开发团队获取支持

---

**最后更新**: 2026-03-12  
**版本**: v1.0 (简化部署版)
