# OpenClaw Dashboard - 技术实现方案

## 1. 系统架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户浏览器                                │
│                    (React + TypeScript)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Nginx (反向代理)                              │
│              - 静态资源服务                                       │
│              - SSL 终止                                          │
│              - 负载均衡                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Dashboard Backend                              │
│                  (Node.js + Express)                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ Agent API   │ │ Task API    │ │ Skill API   │ │ Config API│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ Log API     │ │ System API  │ │ Auth API    │ │ WS Server │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ OpenClaw Gateway API / CLI
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   OpenClaw Gateway                               │
│              - Agent 调度                                         │
│              - 工具调用                                          │
│              - 会话管理                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    数据存储层                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │  SQLite     │ │  文件系统    │ │     日志文件            │   │
│  │  (配置/状态) │ │  (Workspace)│ │    (/var/log/)          │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 模块划分

| 模块 | 职责 | 技术实现 |
|------|------|----------|
| **Frontend** | 用户界面、交互逻辑 | React 18 + TypeScript + Ant Design |
| **API Gateway** | 路由、认证、限流 | Express + JWT + express-rate-limit |
| **Agent Service** | Agent 管理、状态同步 | OpenClaw CLI + 状态轮询 |
| **Task Service** | 任务创建、追踪、日志 | OpenClaw sessions API + WebSocket |
| **Skill Service** | 技能搜索、安装、更新 | skillhub/clawhub CLI 封装 |
| **Config Service** | 配置文件读写、版本管理 | 文件系统 + Git 版本控制 |
| **Log Service** | 日志收集、查询、流式传输 | tail -f + WebSocket |
| **System Service** | 系统监控、健康检查 | Node.js systeminformation 库 |

---

## 2. 功能优先级与排期

### 2.1 优先级定义

| 优先级 | 定义 | 占比 |
|--------|------|------|
| **P0** | 核心功能，无此无法上线 | 40% |
| **P1** | 重要功能，影响用户体验 | 40% |
| **P2** | 锦上添花，可后续迭代 | 20% |

### 2.2 功能优先级排序

#### P0 - 核心功能（第 1-4 周）

| 功能 | 工作量 (人天) | 依赖 | 说明 |
|------|---------------|------|------|
| 项目脚手架搭建 | 2 | 无 | 前后端框架、构建配置 |
| 系统状态仪表盘 | 3 | 无 | 基础指标展示 |
| Agent 列表与详情 | 3 | 无 | 读取 OpenClaw 状态 |
| Agent 启动/停止 | 2 | Agent 列表 | CLI 命令封装 |
| 任务列表与状态 | 3 | 无 | sessions_list API 封装 |
| 基础认证系统 | 2 | 无 | JWT 登录 |
| **小计** | **15 人天** | | |

#### P1 - 重要功能（第 5-8 周）

| 功能 | 工作量 (人天) | 依赖 | 说明 |
|------|---------------|------|------|
| Agent 创建向导 | 4 | P0 Agent 管理 | 表单 + 配置文件生成 |
| Agent 配置编辑 | 3 | P0 Agent 管理 | Markdown 编辑器 |
| 任务日志查看 | 3 | P0 任务管理 | 日志文件读取 |
| 实时日志流 | 4 | 任务日志查看 | WebSocket 实现 |
| 技能搜索与浏览 | 3 | 无 | skillhub/clawhub 封装 |
| 技能安装/更新 | 3 | 技能搜索 | CLI 命令封装 |
| 配置文件编辑器 | 4 | 无 | 文件树 + 编辑器 |
| 配置版本历史 | 3 | 配置文件编辑 | Git 集成 |
| **小计** | **27 人天** | | |

#### P2 - 增强功能（第 9-11 周）

| 功能 | 工作量 (人天) | 依赖 | 说明 |
|------|---------------|------|------|
| 资源监控图表 | 3 | 系统状态 | ECharts 图表 |
| 告警通知配置 | 3 | 资源监控 | 规则配置 + 通知推送 |
| 用户权限管理 | 4 | 基础认证 | RBAC 实现 |
| 操作审计日志 | 2 | 用户权限 | 操作记录 |
| 数据导出功能 | 2 | 各模块 | CSV/JSON 导出 |
| 移动端适配 | 3 | 所有页面 | 响应式布局 |
| 多语言支持 | 3 | 所有页面 | i18n 框架 |
| **小计** | **20 人天** | | |

### 2.3 里程碑排期

```
第 1-2 周：项目搭建 + P0 基础框架
  - 前后端脚手架
  - 认证系统
  - 系统状态 API

第 3-4 周：P0 核心功能开发
  - Agent 管理
  - 任务管理
  - 仪表盘完善

第 5-6 周：P1 功能开发 (上)
  - Agent 创建与编辑
  - 日志查看器
  - 技能市场基础

第 7-8 周：P1 功能开发 (下)
  - 实时日志流
  - 技能安装
  - 配置编辑器

第 9 周：P2 功能开发 + 集成测试
  - 资源监控
  - 权限管理
  - 全链路测试

第 10 周：灰度发布
  - 内部团队试用
  - Bug 修复
  - 性能优化

第 11 周：全量发布
  - 文档完善
  - 正式上线
```

---

## 3. 技术实现细节

### 3.1 前端技术栈

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "antd": "^5.x",
    "zustand": "^4.x",
    "react-router-dom": "^6.x",
    "echarts": "^5.x",
    "echarts-for-react": "^3.x",
    "@monaco-editor/react": "^4.x",
    "axios": "^1.x",
    "dayjs": "^1.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "@types/react": "^18.x",
    "@types/node": "^20.x",
    "eslint": "^8.x",
    "prettier": "^3.x"
  }
}
```

### 3.2 后端技术栈

```json
{
  "dependencies": {
    "express": "^4.x",
    "cors": "^2.x",
    "helmet": "^7.x",
    "jsonwebtoken": "^9.x",
    "bcryptjs": "^2.x",
    "express-rate-limit": "^7.x",
    "ws": "^8.x",
    "better-sqlite3": "^9.x",
    "systeminformation": "^5.x",
    "chokidar": "^3.x",
    "node-pty": "^1.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tsx": "^4.x",
    "nodemon": "^3.x",
    "@types/express": "^4.x",
    "@types/ws": "^8.x"
  }
}
```

### 3.3 核心 API 实现示例

#### Agent 状态轮询服务

```typescript
// services/agent.service.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class AgentService {
  // 获取 Agent 列表
  async getAgents(): Promise<Agent[]> {
    const { stdout } = await execAsync('openclaw sessions_list --json');
    return JSON.parse(stdout);
  }

  // 启动 Agent
  async startAgent(agentId: string): Promise<void> {
    await execAsync(`openclaw sessions_send --session ${agentId} --message "start"`);
  }

  // 停止 Agent
  async stopAgent(agentId: string): Promise<void> {
    await execAsync(`openclaw sessions_send --session ${agentId} --message "stop"`);
  }

  // 创建子 Agent
  async createSubagent(params: CreateSubagentParams): Promise<string> {
    const { target, message, recentMinutes } = params;
    const { stdout } = await execAsync(
      `openclaw subagents steer --target "${target}" --message "${message}"`
    );
    return stdout.trim();
  }
}
```

#### 实时日志流服务

```typescript
// services/log.service.ts
import chokidar from 'chokidar';
import { WebSocketServer } from 'ws';

export class LogStreamService {
  private wss: WebSocketServer;
  private watchers: Map<string, chokidar.FSWatcher> = new Map();

  constructor(wss: WebSocketServer) {
    this.wss = wss;
  }

  // 订阅日志流
  subscribe(logPath: string, clientId: string): void {
    const watcher = chokidar.watch(logPath, {
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on('change', (path) => {
      // 读取新增日志行
      const newLines = this.readNewLines(path);
      this.wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'log_update',
            path,
            lines: newLines,
          }));
        }
      });
    });

    this.watchers.set(clientId, watcher);
  }

  // 取消订阅
  unsubscribe(clientId: string): void {
    const watcher = this.watchers.get(clientId);
    if (watcher) {
      watcher.close();
      this.watchers.delete(clientId);
    }
  }
}
```

#### 技能市场服务

```typescript
// services/skill.service.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SkillService {
  // 搜索技能 (优先 skillhub，失败回退 clawhub)
  async searchSkills(keyword: string): Promise<Skill[]> {
    try {
      // 先尝试 skillhub
      const { stdout } = await execAsync(`skillhub search ${keyword} --json`);
      return JSON.parse(stdout);
    } catch (error) {
      // 回退到 clawhub
      const { stdout } = await execAsync(`clawhub search ${keyword} --json`);
      return JSON.parse(stdout);
    }
  }

  // 获取技能详情
  async getSkillDetail(name: string): Promise<SkillDetail> {
    const { stdout } = await execAsync(`skillhub info ${name} --json`);
    return JSON.parse(stdout);
  }

  // 安装技能
  async installSkill(name: string): Promise<InstallResult> {
    // 先显示风险提示
    const detail = await this.getSkillDetail(name);
    
    // 执行安装
    const { stdout, stderr } = await execAsync(`skillhub install ${name}`);
    
    return {
      success: !stderr,
      message: stdout,
      riskLevel: this.assessRisk(detail),
    };
  }

  // 风险评估
  private assessRisk(detail: SkillDetail): RiskLevel {
    const risks: RiskLevel = 'low';
    if (detail.permissions?.includes('exec')) return 'high';
    if (detail.permissions?.includes('file_write')) return 'medium';
    return risks;
  }
}
```

### 3.4 数据库设计

```sql
-- 用户表
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 配置版本表
CREATE TABLE config_versions (
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
CREATE TABLE audit_logs (
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

-- 告警规则表
CREATE TABLE alert_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  metric TEXT NOT NULL,
  threshold REAL,
  condition TEXT,
  notification_channel TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_config_versions_path ON config_versions(file_path);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

---

## 4. 部署方案（简化版）

### 4.1 本地直接启动（推荐用于开发和调试）

**设计原则**：
- ❌ 不需要 Docker 容器化
- ❌ 不需要 Nginx 反向代理
- ✅ Node.js 直接运行
- ✅ 默认使用 8080 端口
- ✅ 最小化配置，快速启动

#### 4.1.1 环境要求

| 组件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 20.x | 推荐使用 nvm 管理 |
| npm | >= 9.x | 随 Node.js 安装 |
| OpenClaw | 最新版 | 确保 `openclaw` 命令可用 |

#### 4.1.2 启动步骤

```bash
# 1. 安装依赖
npm install

# 2. 构建前端（开发模式可跳过）
npm run build

# 3. 启动服务（默认 8080 端口）
npm start

# 或使用开发模式（支持热重载）
npm run dev
```

#### 4.1.3 配置文件

创建 `.env` 文件（可选，有默认值）：

```bash
# 服务端口（默认 8080）
PORT=8080

# 环境（development | production）
NODE_ENV=development

# JWT 密钥（生产环境必须修改）
JWT_SECRET=your-secret-key-change-in-production

# OpenClaw 工作空间路径（默认自动检测）
OPENCLAW_WORKSPACE=/home/admin/.openclaw/workspace

# 日志目录（默认自动检测）
OPENCLAW_LOGS=/home/admin/.openclaw/logs
```

#### 4.1.4 进程管理（可选）

使用 `pm2` 管理生产环境进程：

```bash
# 安装 pm2
npm install -g pm2

# 启动服务
pm2 start npm --name "openclaw-dashboard" -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs openclaw-dashboard

# 重启服务
pm2 restart openclaw-dashboard

# 开机自启
pm2 startup
pm2 save
```

### 4.2 端口占用处理

如果 8080 端口被占用，可通过以下方式修改：

```bash
# 方式 1: 环境变量
PORT=8081 npm start

# 方式 2: .env 文件
echo "PORT=8081" >> .env

# 方式 3: 命令行参数
npm start -- --port 8081
```

### 4.3 访问地址

启动成功后，访问：

- **开发环境**: http://localhost:8080
- **生产环境**: http://<服务器IP>:8080

> ⚠️ **注意**: 生产环境建议配置防火墙规则，仅允许信任 IP 访问 8080 端口。

---

## 5. 安全考虑

### 5.1 认证与授权

- **JWT Token**: 访问令牌有效期 2 小时，刷新令牌 7 天
- **密码存储**: bcrypt 加盐哈希，salt rounds = 12
- **角色权限**:
  - `admin`: 所有权限
  - `user`: 查看 + 操作自己的 Agent/任务
  - `viewer`: 只读权限

### 5.2 API 安全

- **CORS**: 限制允许的来源
- **Rate Limiting**: 每 IP 每分钟 60 次请求
- **输入验证**: 所有输入参数进行校验
- **SQL 注入防护**: 使用参数化查询

### 5.3 文件系统安全

- **路径遍历防护**: 严格限制文件访问范围在 workspace 内
- **权限控制**: 配置文件仅允许授权用户修改
- **操作审计**: 记录所有文件修改操作

---

## 6. 测试策略

### 6.1 测试类型

| 测试类型 | 工具 | 覆盖率目标 |
|----------|------|------------|
| 单元测试 | Jest | 80%+ |
| 集成测试 | Supertest + Jest | 核心流程 100% |
| E2E 测试 | Playwright | 关键用户流程 |
| 性能测试 | k6 | 响应时间 < 500ms |

### 6.2 关键测试用例

```typescript
// 示例：Agent 管理测试
describe('Agent API', () => {
  test('GET /api/agents 返回 Agent 列表', async () => {
    const response = await request(app).get('/api/agents');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  test('POST /api/agents/:id/start 启动 Agent', async () => {
    const response = await request(app)
      .post('/api/agents/test-agent/start')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });

  test('未授权用户无法操作 Agent', async () => {
    const response = await request(app)
      .post('/api/agents/test-agent/start');
    expect(response.status).toBe(401);
  });
});
```

---

## 7. 监控与运维

### 7.1 监控指标

- **应用指标**: 请求量、响应时间、错误率
- **系统指标**: CPU、内存、磁盘、网络
- **业务指标**: 活跃用户、任务完成率、技能安装数

### 7.2 日志收集

```
应用日志 → stdout/stderr → Docker 日志驱动 → ELK/Loki
访问日志 → Nginx 日志 → Filebeat → ELK/Loki
审计日志 → 数据库 → 定期导出 → 归档存储
```

### 7.3 告警规则

| 指标 | 阈值 | 通知渠道 |
|------|------|----------|
| 错误率 | > 5% (5 分钟) | 邮件 + 钉钉 |
| 响应时间 | P95 > 1s (5 分钟) | 邮件 |
| CPU 使用率 | > 80% (10 分钟) | 钉钉 |
| 内存使用率 | > 85% (10 分钟) | 钉钉 |
| 磁盘使用率 | > 90% | 邮件 + 钉钉 |

---

## 8. 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| OpenClaw API 变更 | 高 | 中 | 建立适配层，定期同步上游 |
| 性能瓶颈 | 中 | 中 | 压力测试，缓存优化 |
| 安全问题 | 高 | 低 | 安全审计，渗透测试 |
| 用户接受度低 | 中 | 中 | 用户调研，迭代优化 |

---

**文档版本**: v1.0  
**创建时间**: 2026-03-12  
**状态**: 待评审
