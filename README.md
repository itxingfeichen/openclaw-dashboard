# OpenClaw Dashboard

OpenClaw Dashboard 是一个全栈 Web 应用程序，提供现代化的用户界面和强大的后端 API 服务。

## 📁 项目结构

```
openclaw-dashboard/
├── frontend/           # React + TypeScript + Vite 前端
│   ├── src/           # 源代码
│   ├── public/        # 静态资源
│   ├── package.json   # 前端依赖配置
│   └── vite.config.ts # Vite 构建配置
├── backend/           # Node.js + Express + TypeScript 后端
│   ├── src/           # 源代码
│   ├── tests/         # 测试文件
│   ├── data/          # 数据库文件
│   └── package.json   # 后端依赖配置
├── package.json       # 根项目配置
├── Makefile           # 常用命令快捷方式
├── .editorconfig      # 编辑器配置
├── .prettierrc        # 代码格式化配置
└── README.md          # 项目说明文档
```

## 🛠 技术栈

### 前端
- **框架**: React 19
- **语言**: TypeScript 5.9
- **构建工具**: Vite 8
- **代码规范**: ESLint 9 + Prettier 3

### 后端
- **框架**: Express 4
- **语言**: TypeScript 5.3
- **运行时**: Node.js 18+
- **代码规范**: ESLint 8 + Prettier 3

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
# 使用 Make
make install

# 或手动安装
npm install
npm install --prefix frontend
npm install --prefix backend
```

### 开发模式

```bash
# 同时启动前后端开发服务器
make dev

# 或分别启动
make dev-fe  # 仅前端 (http://localhost:8080)
make dev-be  # 仅后端 (http://localhost:3000)
```

### 构建生产版本

```bash
make build
```

### 代码质量检查

```bash
# 运行代码检查
make lint

# 格式化代码
make format
```

### 运行测试

```bash
make test
```

### 清理项目

```bash
make clean
```

## 📜 开发规范

### 代码风格
- 使用 2 个空格缩进
- 使用单引号
- 行尾不加分号（TypeScript 文件除外）
- 最大行宽 100 字符

### Git 提交规范
```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具链相关
```

## 🔧 配置文件说明

| 文件 | 说明 |
|------|------|
| `.editorconfig` | 编辑器统一配置 |
| `.prettierrc` | Prettier 格式化规则 |
| `.prettierignore` | Prettier 忽略文件 |
| `Makefile` | 常用命令快捷方式 |
| `package.json` | 项目依赖和脚本 |

## 📝 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run lint` | 代码检查 |
| `npm run format` | 代码格式化 |
| `npm run test` | 运行测试 |

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

ISC License

---

**Happy Coding!** 🎉
