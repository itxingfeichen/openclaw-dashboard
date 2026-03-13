# Git 推送配置说明

## 自动推送流程

每个子 Agent 任务完成后，自动执行以下步骤：

### 1. 初始化 Git（仅第一次）
```bash
cd /home/admin/openclaw-dashboard
git init
git config user.name "OpenClaw Dashboard Bot"
git config user.email "bot@openclaw.local"
```

### 2. 创建 GitHub 仓库

**手动步骤**（需要用户完成）:
1. 登录 GitHub
2. 创建新仓库 `openclaw-dashboard`
3. 复制仓库地址，例如：`https://github.com/YOUR_USERNAME/openclaw-dashboard.git`

### 3. 配置远程仓库
```bash
cd /home/admin/openclaw-dashboard
git remote add origin https://github.com/YOUR_USERNAME/openclaw-dashboard.git
git branch -M main
```

### 4. 每次任务完成后的推送流程

```bash
# 添加所有变更
git add .

# 提交代码
git commit -m "chore: complete {任务名称} - {日期}"

# 推送到 GitHub
git push -u origin main
```

---

## 提交信息规范

**格式**: `chore: complete {任务 ID} {任务名称} - {YYYY-MM-DD}`

**示例**:
```
chore: complete T1.1 项目脚手架搭建 - 2026-03-13
chore: complete T1.2 CLI 适配层 - 2026-03-14
chore: complete T2.1 系统状态仪表盘 - 2026-03-20
```

---

## 报告格式

每个任务完成后，推送成功后的报告格式：

```
✅ 任务完成报告

任务名称：T1.1 项目脚手架搭建
负责 Agent: fullstack
完成状态：✅ 成功
访问地址：http://localhost:8080
启动命令：npm start

📦 Git 推送
提交 SHA: abc123def
提交信息：chore: complete T1.1 项目脚手架搭建 - 2026-03-13
GitHub 仓库：https://github.com/YOUR_USERNAME/openclaw-dashboard
推送状态：✅ 成功
```

---

## 认证方式

### 方式 1: Personal Access Token (推荐)

1. GitHub Settings → Developer settings → Personal access tokens
2. 生成新 token，勾选 `repo` 权限
3. 使用 token 推送：
   ```bash
   git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/openclaw-dashboard.git
   ```

### 方式 2: SSH Key

1. 生成 SSH key:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
2. 添加公钥到 GitHub Settings → SSH and GPG keys
3. 使用 SSH 地址：
   ```bash
   git remote set-url origin git@github.com:YOUR_USERNAME/openclaw-dashboard.git
   ```

---

## 环境变量配置

创建 `.env` 文件存储敏感信息：

```bash
# /home/admin/openclaw-dashboard/.env
GITHUB_TOKEN=your_personal_access_token
GITHUB_USERNAME=your_username
GITHUB_REPO=openclaw-dashboard
```

---

## 自动化脚本

创建推送脚本 `/home/admin/openclaw-dashboard/scripts/push-to-github.sh`:

```bash
#!/bin/bash

# 推送脚本
set -e

TASK_NAME=$1
DATE=$(date +%Y-%m-%d)
COMMIT_MSG="chore: complete $TASK_NAME - $DATE"

cd /home/admin/openclaw-dashboard

# 添加并提交
git add .
git commit -m "$COMMIT_MSG" || echo "No changes to commit"

# 推送
git push -u origin main

echo "✅ Pushed to GitHub: $COMMIT_MSG"
```

使用方式：
```bash
chmod +x scripts/push-to-github.sh
./scripts/push-to-github.sh "T1.1 项目脚手架搭建"
```

---

## 注意事项

1. **首次推送前**必须先创建 GitHub 仓库
2. **Token 安全**: 不要将 token 提交到 Git
3. **冲突处理**: 推送失败时先 `git pull` 再 `git push`
4. **大文件**: 超过 100MB 的文件需要使用 Git LFS

---

_配置完成后，每个任务将自动推送到 GitHub_
