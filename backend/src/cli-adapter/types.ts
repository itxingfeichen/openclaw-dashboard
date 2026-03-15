/**
 * CLI 适配层类型定义
 * TypeScript types for OpenClaw CLI Adapter
 */

/**
 * CLI 执行结果
 */
export interface CliResult<T = any> {
  success: boolean
  command: string
  data: T | null
  rawOutput: string | null
  error: string | null
  exitCode: number
}

/**
 * CLI 执行选项
 */
export interface CliOptions {
  timeout?: number
  retries?: number
  parseJson?: boolean
  workdir?: string
  env?: Record<string, string>
}

/**
 * Schema 验证结果
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Schema 定义
 */
export interface SchemaDefinition {
  required: string[]
  optional: string[]
  nested?: Record<string, NestedSchema>
}

/**
 * 嵌套 Schema 定义
 */
export interface NestedSchema {
  type: 'array' | 'object'
  itemSchema?: SchemaDefinition
}

/**
 * Agent 信息
 */
export interface AgentInfo {
  id: string
  name: string
  status: string
  type?: string
  description?: string
  workspace?: string
  agentDir?: string
  model?: string
  routingRules?: number
  createdAt?: string
  updatedAt?: string
  isDefault?: boolean
}

/**
 * Agent 列表响应
 */
export interface AgentsListResponse {
  agents: AgentInfo[]
  count: number
  timestamp: string
}

/**
 * Agent 状态
 */
export interface AgentStatus {
  id: string
  status: 'running' | 'stopped' | 'inactive'
  pid?: number
  uptime?: string
  startedAt?: string
  stoppedAt?: string
}

/**
 * Agent 配置
 */
export interface AgentConfig {
  model?: string
  temperature?: string
  systemPrompt?: string
  workspace?: string
  [key: string]: any
}

/**
 * Agent 统计
 */
export interface AgentStats {
  id: string
  totalSessions: number
  activeSessions: number
  totalTokens: number
  timeRange: string
}

/**
 * 会话信息
 */
export interface SessionInfo {
  key: string
  sessionId?: string
  updatedAt?: string
  ageMs?: number
  systemSent?: boolean
  abortedLastRun?: boolean
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  totalTokensFresh?: number
  model?: string
  modelProvider?: string
  contextTokens?: number
  agentId?: string
  kind?: string
  target?: string
  message?: string
}

/**
 * 会话列表响应
 */
export interface SessionsListResponse {
  sessions: SessionInfo[]
  count: number
  timestamp: string
  path?: string
  activeMinutes?: number
}

/**
 * 会话历史消息
 */
export interface SessionMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  toolCalls?: any[]
}

/**
 * 会话历史记录
 */
export interface SessionHistory {
  key: string
  messages: SessionMessage[]
  count: number
  metadata?: {
    createdAt: string
    updatedAt: string
    agentId?: string
    model?: string
  }
}

/**
 * 会话统计
 */
export interface SessionStats {
  totalSessions: number
  activeSessions: number
  totalMessages: number
  totalTokens: number
  timeRange: string
}

/**
 * 会话生成选项
 */
export interface SpawnSessionOptions {
  message: string
  target?: string
  agentId?: string
  model?: string
  deliver?: boolean
}

/**
 * 会话发送选项
 */
export interface SendSessionOptions {
  agentId?: string
  model?: string
  deliver?: boolean
}

/**
 * 会话清理选项
 */
export interface CleanupSessionOptions {
  olderThanDays?: number
  dryRun?: boolean
}

/**
 * 定时任务信息
 */
export interface CronTask {
  id: string
  name: string
  schedule: string
  enabled: boolean
  nextRun?: string
  lastRun?: string
  status: string
  target?: string | null
  agentId?: string | null
  model?: string | null
  command?: string
  description?: string
}

/**
 * 定时任务列表响应
 */
export interface CronListResponse {
  tasks: CronTask[]
  count: number
  timestamp: string
}

/**
 * 系统状态响应
 */
export interface StatusResponse {
  status: 'healthy' | 'unhealthy' | 'unknown'
  version?: string
  uptime?: string
  timestamp: string
  dashboard?: string
  gateway?: {
    status: string
    reachable: boolean
  }
  agents?: {
    count: number
  }
  sessions?: {
    count: number
    active: boolean
  }
  node?: any
  update?: {
    available: boolean
  }
}

/**
 * 文件读取选项
 */
export interface ReadFileOptions {
  offset?: number
  limit?: number
}

/**
 * Shell 执行选项
 */
export interface ExecCommandOptions extends CliOptions {
  workdir?: string
  env?: Record<string, string>
}

/**
 * Browser 快照选项
 */
export interface BrowserSnapshotOptions {
  url?: string
  profile?: 'chrome' | 'openclaw'
  refs?: 'role' | 'aria'
  timeout?: number
}

/**
 * Browser 点击选项
 */
export interface BrowserClickOptions {
  ref?: string
  selector?: string
  doubleClick?: boolean
  timeout?: number
}

/**
 * Browser 输入选项
 */
export interface BrowserTypeOptions {
  ref?: string
  selector?: string
  text: string
  slowly?: boolean
  timeout?: number
}

/**
 * Browser 导航选项
 */
export interface BrowserNavigateOptions {
  url: string
  timeout?: number
  loadState?: 'domcontentloaded' | 'load' | 'networkidle'
}

/**
 * Process 列表项
 */
export interface ProcessInfo {
  sessionId: string
  status: string
  command?: string
  createdAt?: string
}

/**
 * Process 按键选项
 */
export interface ProcessSendKeysOptions {
  keys?: string[]
  text?: string
  literal?: string
}

/**
 * Web 搜索选项
 */
export interface WebSearchOptions {
  count?: number
  country?: string
  freshness?: string
  ui_lang?: string
  search_lang?: string
}

/**
 * Web 搜索响应
 */
export interface WebSearchResponse {
  results: Array<{
    title: string
    url: string
    snippet: string
  }>
  count: number
}

/**
 * Web 抓取选项
 */
export interface WebFetchOptions {
  extractMode?: 'markdown' | 'text'
  maxChars?: number
}

/**
 * Web 抓取响应
 */
export interface WebFetchResponse {
  content: string
  url: string
  title?: string
}

/**
 * Message 发送选项
 */
export interface MessageSendOptions {
  channel?: string
  replyTo?: string
  silent?: boolean
  [key: string]: any
}

/**
 * 记忆信息
 */
export interface MemoryInfo {
  id: string
  content: string
  agentId: string
  sessionKey?: string
  createdAt: string
  updatedAt?: string
  score?: number
}

/**
 * 记忆搜索选项
 */
export interface MemorySearchOptions {
  limit?: number
  threshold?: number
  agentId?: string
  sessionKey?: string
}

/**
 * 记忆搜索响应
 */
export interface MemorySearchResponse {
  memories: MemoryInfo[]
  count: number
  query: string
}

/**
 * 记忆重新索引选项
 */
export interface MemoryReindexOptions {
  agentId?: string
  force?: boolean
}

/**
 * 记忆状态
 */
export interface MemoryStatus {
  status: 'healthy' | 'unhealthy' | 'indexing'
  totalMemories: number
  indexedMemories: number
  lastIndexedAt?: string
}

/**
 * Node 信息
 */
export interface NodeInfo {
  id: string
  name: string
  status: string
  type?: string
  lastSeen?: string
}
