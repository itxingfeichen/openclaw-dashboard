# CLI 适配层 (CLI Adapter)

OpenClaw CLI 命令封装模块，提供稳定的 API 接口供前端调用。

## 📁 目录结构

```
cli-adapter/
├── index.js          # 模块入口，导出所有功能
├── executor.js       # CLI 命令执行器
├── schema.js         # Schema 校验模块
├── commands.js       # CLI 命令封装
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
  getStatus,
  getAgentsList,
  getSessionsList,
  getCronList,
  getConfig,
} from './src/cli-adapter/index.js'

// 获取系统状态
const status = await getStatus()

// 获取 Agent 列表
const agents = await getAgentsList()

// 获取会话列表
const sessions = await getSessionsList()

// 获取定时任务列表
const cron = await getCronList()

// 获取配置
const config = await getConfig()
const specificConfig = await getConfig('some.key')
```

## 📖 API 文档

### 命令执行器 (executor.js)

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

**示例：**
```javascript
import { executeCli } from './cli-adapter/executor.js'

const result = await executeCli('openclaw status', {
  timeout: 30000,
  retries: 1,
})

if (result.success) {
  console.log('Status:', result.data)
} else {
  console.error('Error:', result.error)
}
```

#### `executeCliBatch(commands, options)`

批量执行多个 CLI 命令。

**参数：**
- `commands` (string[]): 命令列表
- `options` (object): 执行选项（同 executeCli）

**返回：** `Promise<CliResult[]>`

### CLI 命令封装 (commands.js)

提供预定义的 CLI 命令接口：

| 函数 | 描述 | 对应命令 |
|------|------|----------|
| `getStatus()` | 获取系统状态 | `openclaw status` |
| `getAgentsList()` | 获取 Agent 列表 | `openclaw agents list` |
| `getSessionsList()` | 获取会话列表 | `openclaw sessions list` |
| `getCronList()` | 获取定时任务列表 | `openclaw cron list` |
| `getConfig(key)` | 获取配置信息 | `openclaw config get [key]` |
| `executeCustomCommand(cmd, opts)` | 执行自定义命令 | 任意 |

### Schema 校验 (schema.js)

验证 CLI 输出格式是否符合预期。

```javascript
import { validateCliOutput, formatValidationError } from './cli-adapter/schema.js'

const validation = validateCliOutput('openclaw agents list', data)

if (!validation.valid) {
  console.warn(formatValidationError(validation, 'openclaw agents list'))
}
```

### 支持的 Schema

| 命令 | 必需字段 | 可选字段 |
|------|---------|---------|
| `openclaw status` | `status` | `version`, `uptime`, `timestamp`, `gateway`, `agents`, `sessions`, `node` |
| `openclaw agents list` | `agents` | `count`, `timestamp` |
| `openclaw sessions list` | `sessions` | `count`, `timestamp` |
| `openclaw cron list` | `tasks` | `count`, `timestamp` |
| `openclaw config get` | - | `config`, `settings` |

## 🌐 HTTP API 路由

CLI 适配层提供以下 HTTP 端点：

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/status` | GET | 获取系统状态 |
| `/api/agents` | GET | 获取 Agent 列表 |
| `/api/sessions` | GET | 获取会话列表 |
| `/api/cron` | GET | 获取定时任务列表 |
| `/api/config` | GET | 获取配置信息（支持 `?key=` 参数） |

### 响应格式

**成功响应：**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-03-13T00:00:00.000Z"
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
  "timestamp": "2026-03-13T00:00:00.000Z"
}
```

### 错误状态码

| 状态码 | 描述 |
|--------|------|
| 200 | 成功 |
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

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

### 测试文件

- `tests/cli-executor.test.js` - CLI 执行器测试
- `tests/cli-schema.test.js` - Schema 校验测试
- `tests/cli-routes.test.js` - API 路由测试

### 测试覆盖率

目标覆盖率：> 80%

查看覆盖率报告：
```bash
npm run test:coverage
```

## ⚙️ 配置

### 超时控制

默认超时时间为 30 秒，可通过 `timeout` 选项自定义：

```javascript
const result = await executeCli('openclaw status', {
  timeout: 60000, // 60 秒超时
})
```

### 重试机制

支持自动重试，适用于偶发性失败：

```javascript
const result = await executeCli('openclaw agents list', {
  retries: 3, // 最多重试 3 次
})
```

### JSON 解析

默认自动解析 JSON 输出，可禁用：

```javascript
const result = await executeCli('echo "plain text"', {
  parseJson: false, // 不解析 JSON
})
```

## 🔒 安全注意事项

1. **命令注入防护**: 不要直接拼接用户输入到命令中
2. **超时控制**: 始终设置合理的超时时间，防止命令挂起
3. **错误处理**: 始终检查 `result.success` 再使用 `result.data`
4. **权限控制**: 确保运行 OpenClaw CLI 的用户有足够权限

## 📝 最佳实践

1. **使用预定义命令**: 优先使用 `commands.js` 中的封装函数
2. **处理错误**: 始终使用 try-catch 或检查 `success` 字段
3. **日志记录**: 记录 CLI 执行结果便于排查问题
4. **Schema 校验**: 对关键数据进行格式验证

## 🔄 扩展

### 添加新命令

1. 在 `commands.js` 中添加命令常量：
```javascript
const CLI_COMMANDS = {
  // ... existing commands
  NEW_COMMAND: 'openclaw new command',
}
```

2. 创建封装函数：
```javascript
export async function getNewCommand() {
  const result = await executeCli(CLI_COMMANDS.NEW_COMMAND, {
    timeout: 30000,
    retries: 1,
  })
  
  if (!result.success) {
    throw new Error(`获取新命令失败：${result.error}`)
  }
  
  return result.data
}
```

3. 在 `schema.js` 中添加 Schema 定义（可选）

4. 在 `index.js` 中导出新函数

5. 在 `routes/cli.js` 中添加 API 路由（如需 HTTP 访问）

6. 编写测试用例

## 📄 许可证

与 OpenClaw Dashboard 项目保持一致。
