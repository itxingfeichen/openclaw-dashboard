# CLI 适配层 (CLI Adapter)

OpenClaw CLI 命令封装模块，提供稳定的 API 接口供前端调用。

## 📁 目录结构

```
cli-adapter/
├── index.js          # 模块入口，导出所有功能
├── executor.js       # CLI 命令执行器 (超时、重试、错误处理)
├── schema.js         # Schema 校验模块 (Zod 风格验证)
├── parsers.js        # 文本输出解析器
├── commands.js       # 高级命令封装 (向后兼容)
├── tools.js          # 工具执行 (exec, read, write, browser 等)
├── memory.js         # 记忆操作 (search, get, reindex)
├── sessions.js       # 会话管理 (list, spawn, send, history)
├── agents.js         # Agent 管理 (list, status, create, delete)
└── README.md         # 本文档
```

## 🚀 快速开始

### 安装依赖

```bash
cd /home/admin/openclaw-dashboard/backend
npm install
```

### 基本使用

```javascript
import {
  // 基础命令
  getStatus,
  getAgentsList,
  getSessionsList,
  
  // 工具执行
  readFile,
  writeFile,
  execCommand,
  browserSnapshot,
  webSearch,
  
  // 记忆操作
  searchMemory,
  getMemory,
  
  // 会话管理
  listSessions,
  spawnSession,
  sendToSession,
  
  // Agent 管理
  listAgents,
  startAgent,
  stopAgent,
} from './src/cli-adapter/index.js'

// 获取系统状态
const status = await getStatus()

// 读取文件
const fileContent = await readFile('/path/to/file.txt')

// 搜索记忆
const memories = await searchMemory('important topic', { limit: 10 })

// 生成新会话
const session = await spawnSession({
  message: 'Hello',
  model: 'qwen3.5-plus',
})
```

## 📖 API 文档

### 核心执行器 (executor.js)

#### `executeCli(command, options)`

执行 CLI 命令并返回结果。

**参数：**
- `command` (string): 要执行的命令
- `options` (object): 执行选项
  - `timeout` (number): 超时时间（毫秒），默认 30000
  - `retries` (number): 重试次数，默认 0
  - `parseJson` (boolean): 是否自动解析 JSON，默认 true

**返回：**
```javascript
{
  success: boolean,
  command: string,
  data: any,
  rawOutput: string,
  error: string | null,
  exitCode: number
}
```

#### `executeCliBatch(commands, options)`

批量执行多个 CLI 命令。

**返回：** `Promise<CliResult[]>`

### 工具执行 (tools.js)

#### 文件操作

```javascript
// 读取文件
const result = await readFile('/path/to/file.txt', { offset: 0, limit: 2000 })

// 写入文件
const result = await writeFile('/path/to/file.txt', 'content')

// 编辑文件 (精确替换)
const result = await editFile('/path/to/file.txt', 'old text', 'new text')
```

#### Shell 执行

```javascript
const result = await execCommand('ls -la', {
  timeout: 30000,
  workdir: '/home/admin',
  env: { NODE_ENV: 'production' },
})
```

#### Browser 操作

```javascript
// 获取快照
const snapshot = await browserSnapshot({
  url: 'https://example.com',
  profile: 'openclaw',
  refs: 'aria',
})

// 点击元素
const clickResult = await browserClick('e12')

// 输入文本
const typeResult = await browserType('e12', 'search query')

// 导航
const navResult = await browserNavigate('https://example.com')
```

#### Web 操作

```javascript
// Web 搜索
const searchResult = await webSearch('OpenClaw', {
  count: 10,
  country: 'US',
  freshness: 'pw',
})

// Web 抓取
const fetchResult = await webFetch('https://example.com', {
  extractMode: 'markdown',
  maxChars: 10000,
})
```

#### Process 管理

```javascript
// 列出进程
const processes = await processList()

// 发送按键
await processSendKeys('session-id', { keys: ['Enter'] })

// 终止进程
await processKill('session-id')
```

#### Message 发送

```javascript
const result = await messageSend('+1234567890', 'Hello', {
  channel: 'telegram',
  replyTo: 'message-id',
  silent: false,
})
```

### 记忆操作 (memory.js)

```javascript
// 搜索记忆
const results = await searchMemory('important topic', {
  limit: 20,
  threshold: 0.5,
  agentId: 'main',
  sessionKey: 'session-123',
})

// 获取记忆详情
const memory = await getMemory('memory-id')

// 重新索引
const reindexResult = await reindexMemory({
  agentId: 'main',
  force: true,
})

// 获取状态
const status = await getMemoryStatus()

// 按会话获取
const sessionMemories = await getMemoriesBySession('session-123', { limit: 50 })

// 按 Agent 获取
const agentMemories = await getMemoriesByAgent('main', { limit: 50 })
```

### 会话管理 (sessions.js)

```javascript
// 列出会话
const sessions = await listSessions({
  activeMinutes: 1440,
  limit: 100,
})

// 生成/唤醒会话
const session = await spawnSession({
  message: 'Hello',
  target: '+1234567890',
  agentId: 'main',
  model: 'qwen3.5-plus',
  deliver: true,
})

// 发送消息到会话
const sendResult = await sendToSession('session-key', 'Follow-up message', {
  agentId: 'main',
  model: 'qwen3.5-plus',
  deliver: false,
})

// 获取历史记录
const history = await getSessionHistory('session-key', {
  limit: 50,
  includeMetadata: true,
})

// 获取会话详情
const session = await getSession('session-key')

// 删除会话
const deleteResult = await deleteSession('session-key')

// 清理过期会话
const cleanupResult = await cleanupSessions({
  olderThanDays: 30,
  dryRun: true,
})

// 获取统计
const stats = await getSessionStats({ activeMinutes: 1440 })
```

### Agent 管理 (agents.js)

```javascript
// 列出 Agent
const agents = await listAgents({ verbose: true })

// 获取状态
const status = await getAgentStatus('main')

// 创建 Agent
const createResult = await createAgent({
  name: 'new-agent',
  workspace: '/path/to/workspace',
  model: 'qwen3.5-plus',
  systemPrompt: 'You are a helpful assistant',
})

// 删除 Agent
const deleteResult = await deleteAgent('agent-name', { force: true })

// 获取配置
const config = await getAgentConfig('main')

// 更新配置
const updateResult = await updateAgentConfig('main', {
  model: 'qwen3.5-plus',
  temperature: '0.7',
})

// 启动 Agent
const startResult = await startAgent('main', { message: 'start' })

// 停止 Agent
const stopResult = await stopAgent('main')

// 重启 Agent
const restartResult = await restartAgent('main')

// 获取统计
const stats = await getAgentStats('main', { timeRange: '24h' })

// 列出子 Agent
const subagents = await listSubagents()
```

### Schema 校验 (schema.js)

```javascript
import { validateCliOutput, formatValidationError } from './cli-adapter/schema.js'

const validation = validateCliOutput('openclaw agents list', data)

if (!validation.valid) {
  console.warn(formatValidationError(validation, 'openclaw agents list'))
}
```

### 支持的 Schema

| 命令类别 | 命令示例 | 必需字段 | 可选字段 |
|---------|---------|---------|---------|
| 系统状态 | `openclaw status` | `status` | `version`, `uptime`, `gateway`, `agents`, `sessions` |
| Agent 列表 | `openclaw agents list` | `agents` | `count`, `timestamp` |
| 会话列表 | `openclaw sessions --json` | `sessions` | `count`, `timestamp`, `activeMinutes` |
| 定时任务 | `openclaw cron list` | `tasks` | `count`, `timestamp` |
| 工具执行 | `openclaw read/write/exec` | `success`, `tool` | `data`, `error`, `exitCode` |
| 记忆操作 | `openclaw memory search` | `success` | `data`, `error`, `query` |

## 🌐 HTTP API 路由

CLI 适配层通过 `routes/cli.js` 提供以下 HTTP 端点：

### 基础端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/status` | GET | 获取系统状态 |
| `/api/agents` | GET | 获取 Agent 列表 |
| `/api/sessions` | GET | 获取会话列表 |
| `/api/cron` | GET | 获取定时任务列表 |
| `/api/config` | GET | 获取配置信息 |

### 工具端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/tools/read` | POST | 读取文件 |
| `/api/tools/write` | POST | 写入文件 |
| `/api/tools/exec` | POST | 执行命令 |
| `/api/tools/browser/snapshot` | POST | Browser 快照 |
| `/api/tools/web/search` | POST | Web 搜索 |
| `/api/tools/web/fetch` | POST | Web 抓取 |

### 记忆端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/memory/search` | POST | 搜索记忆 |
| `/api/memory/get/:id` | GET | 获取记忆详情 |
| `/api/memory/reindex` | POST | 重新索引 |
| `/api/memory/status` | GET | 记忆系统状态 |

### 会话端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/sessions` | GET | 列出会话 |
| `/api/sessions/spawn` | POST | 生成会话 |
| `/api/sessions/:key/send` | POST | 发送消息 |
| `/api/sessions/:key/history` | GET | 获取历史 |
| `/api/sessions/:key` | GET | 获取详情 |
| `/api/sessions/:key` | DELETE | 删除会话 |
| `/api/sessions/stats` | GET | 获取统计 |

### Agent 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/agents` | GET | 列出 Agent |
| `/api/agents/:id/status` | GET | 获取状态 |
| `/api/agents` | POST | 创建 Agent |
| `/api/agents/:id` | DELETE | 删除 Agent |
| `/api/agents/:id/config` | GET | 获取配置 |
| `/api/agents/:id/config` | PUT | 更新配置 |
| `/api/agents/:id/start` | POST | 启动 Agent |
| `/api/agents/:id/stop` | POST | 停止 Agent |
| `/api/agents/:id/restart` | POST | 重启 Agent |
| `/api/agents/:id/stats` | GET | 获取统计 |

### 响应格式

**成功响应：**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-03-15T00:00:00.000Z"
}
```

**错误响应：**
```json
{
  "success": false,
  "error": {
    "message": "错误描述",
    "details": "详细信息（仅开发环境）"
  },
  "timestamp": "2026-03-15T00:00:00.000Z"
}
```

### 错误状态码

| 状态码 | 描述 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 403 | 权限不足 |
| 404 | 资源未找到 |
| 502 | CLI 命令执行失败 |
| 504 | CLI 命令执行超时 |
| 500 | 内部服务器错误 |

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行 CLI 相关测试
npm test -- tests/cli-*.test.js

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

### 测试文件

| 文件 | 描述 |
|------|------|
| `tests/cli-executor.test.js` | CLI 执行器测试 |
| `tests/cli-schema.test.js` | Schema 校验测试 |
| `tests/cli-parsers.test.js` | 解析器测试 |
| `tests/cli-commands.test.js` | 命令封装测试 |
| `tests/cli-routes.test.js` | API 路由测试 |
| `tests/cli-tools.test.js` | 工具执行测试 |
| `tests/cli-memory.test.js` | 记忆操作测试 |
| `tests/cli-sessions.test.js` | 会话管理测试 |
| `tests/cli-agents.test.js` | Agent 管理测试 |

### 测试覆盖率

目标覆盖率：> 80%

查看覆盖率报告：
```bash
npm run test:coverage
```

## ⚙️ 配置

### 超时控制

```javascript
// 默认 30 秒超时
const result = await executeCli('openclaw status')

// 自定义超时
const result = await executeCli('openclaw memory reindex', {
  timeout: 120000, // 2 分钟
})
```

### 重试机制

```javascript
// 不重试
const result = await executeCli('openclaw status', { retries: 0 })

// 重试 3 次
const result = await executeCli('openclaw agents list', {
  retries: 3,
})
```

### JSON 解析

```javascript
// 自动解析 JSON (默认)
const result = await executeCli('openclaw sessions --json')

// 禁用 JSON 解析
const result = await executeCli('echo "plain text"', {
  parseJson: false,
})
```

## 🔒 安全注意事项

1. **命令注入防护**: 不要直接拼接用户输入到命令中
2. **超时控制**: 始终设置合理的超时时间，防止命令挂起
3. **错误处理**: 始终检查 `result.success` 再使用 `result.data`
4. **权限控制**: 确保运行 OpenClaw CLI 的用户有足够权限
5. **输入验证**: 对文件路径、URL 等输入进行验证
6. **资源限制**: 限制文件读取大小、命令执行时间

## 📝 最佳实践

1. **使用预定义函数**: 优先使用封装好的函数而非直接执行命令
2. **处理错误**: 始终使用 try-catch 或检查 `success` 字段
3. **日志记录**: 记录 CLI 执行结果便于排查问题
4. **Schema 校验**: 对关键数据进行格式验证
5. **资源清理**: 及时清理临时文件和过期会话
6. **批量操作**: 使用 `executeCliBatch` 减少并发压力

## 🔄 扩展指南

### 添加新工具命令

1. 在 `tools.js` 中添加函数：

```javascript
export async function newTool(param1, param2) {
  const command = `openclaw new-tool --param1 "${param1}" --param2 "${param2}"`
  
  return executeTool('new-tool', command, {
    timeout: 30000,
    parseJson: true,
  })
}
```

2. 在 `index.js` 中导出：

```javascript
export { newTool } from './tools.js'
```

3. 在 `schema.js` 中添加 Schema：

```javascript
const newToolSchema = {
  required: ['success', 'tool'],
  optional: ['data', 'error'],
}

const schemaMap = {
  // ... existing schemas
  'openclaw new-tool': newToolSchema,
}
```

4. 添加测试用例：

```javascript
// tests/cli-tools.test.js
describe('newTool', () => {
  it('should execute new tool', async () => {
    const result = await newTool('value1', 'value2')
    assert.ok(result)
    assert.ok('success' in result)
  })
})
```

5. 添加 HTTP 路由 (如需要)：

```javascript
// routes/cli.js
router.post('/tools/new-tool', asyncHandler(async (req, res) => {
  const { param1, param2 } = req.body
  const result = await newTool(param1, param2)
  
  res.json({
    success: result.success,
    data: result.data,
    timestamp: new Date().toISOString(),
  })
}))
```

## 📊 性能优化

1. **命令缓存**: 对频繁执行的只读命令使用缓存
2. **批量执行**: 使用 `executeCliBatch` 减少进程创建开销
3. **超时设置**: 根据命令类型设置合理的超时时间
4. **连接复用**: Browser 操作复用已有连接

## 📄 许可证

与 OpenClaw Dashboard 项目保持一致。

## 📞 支持

- 文档：https://docs.openclaw.ai/cli
- GitHub: https://github.com/openclaw-ai/openclaw
- 问题反馈：https://github.com/openclaw-ai/openclaw/issues
