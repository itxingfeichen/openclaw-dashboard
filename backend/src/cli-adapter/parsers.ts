/**
 * CLI 文本输出解析器
 * 解析 OpenClaw CLI 的文本格式输出为结构化数据
 */

import type {
  AgentInfo,
  AgentsListResponse,
  CronTask,
  CronListResponse,
  StatusResponse,
} from './types.js'

/**
 * 解析 Agent 列表输出
 * @param output - CLI 原始输出
 * @returns 解析后的 Agent 列表
 */
export function parseAgentsOutput(output: string): AgentsListResponse {
  const agents: AgentInfo[] = []
  const lines = output.split('\n')
  let currentAgent: AgentInfo | null = null

  for (const line of lines) {
    // 匹配 Agent 名称行：- main (default)
    const agentMatch = line.match(/^- (\S+)(?:\s+\(([^)]+)\))?/)
    if (agentMatch) {
      if (currentAgent) {
        agents.push(currentAgent)
      }
      currentAgent = {
        id: agentMatch[1],
        name: agentMatch[1],
        status: 'active',
        isDefault: agentMatch[2] === 'default',
      }
      continue
    }

    // 匹配属性行：  Workspace: /path/to/workspace
    if (currentAgent && line.startsWith('  ')) {
      const propMatch = line.match(/^\s+(\w+):\s*(.+)$/)
      if (propMatch) {
        const [, key, value] = propMatch
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '')

        if (normalizedKey === 'workspace') {
          currentAgent.workspace = value.trim()
        } else if (normalizedKey === 'agentdir') {
          currentAgent.agentDir = value.trim()
        } else if (normalizedKey === 'model') {
          currentAgent.model = value.trim()
        } else if (normalizedKey === 'routingrules') {
          currentAgent.routingRules = parseInt(value, 10) || 0
        }
      }
    }
  }

  // 添加最后一个 Agent
  if (currentAgent) {
    agents.push(currentAgent)
  }

  return {
    agents,
    count: agents.length,
    timestamp: new Date().toISOString(),
  }
}

/**
 * 解析 Cron 任务列表输出
 * @param output - CLI 原始输出
 * @returns 解析后的 Cron 任务列表
 */
export function parseCronOutput(output: string): CronListResponse {
  const tasks: CronTask[] = []
  const lines = output.split('\n')

  // 跳过表头（第一行）
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // 按 2 个或更多空格分割
    const parts = line.split(/\s{2,}/)

    if (parts.length >= 6) {
      // 第一部分：ID + Name（需要用 UUID 分隔）
      const firstPart = parts[0].trim()
      const uuidMatch = firstPart.match(/^([a-f0-9-]{36})\s+(.*)$/)
      let id: string
      let name: string

      if (uuidMatch) {
        id = uuidMatch[1]
        name = uuidMatch[2].trim()
      } else {
        id = firstPart
        name = ''
      }

      // 列映射
      const schedule = parts[1]?.trim() || ''
      const nextRun = parts[2]?.trim() || ''
      const lastRun = parts[3]?.trim() || ''
      const status = parts[4]?.trim() || ''
      const target = parts[5] === '-' ? null : parts[5]?.trim() || null
      const agentId = parts[6] === '-' ? null : parts[6]?.trim() || null

      tasks.push({
        id,
        name,
        schedule,
        nextRun,
        lastRun,
        status,
        target: target === '-' ? null : target,
        agentId: agentId === '-' ? null : agentId,
        model: null,
        enabled: status !== 'disabled' && status !== '-',
      })
    }
  }

  return {
    tasks,
    count: tasks.length,
    timestamp: new Date().toISOString(),
  }
}

/**
 * 解析系统状态输出
 * @param output - CLI 原始输出
 * @returns 解析后的系统状态
 */
export function parseStatusOutput(output: string): StatusResponse {
  const status: StatusResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }

  const lines = output.split('\n')

  for (const line of lines) {
    // Dashboard URL
    const dashboardMatch = line.match(/Dashboard\s*\|\s*(http[^\s]+)/)
    if (dashboardMatch) {
      status.dashboard = dashboardMatch[1].trim()
    }

    // Gateway status
    if (line.includes('Gateway') && line.includes('reachable')) {
      status.gateway = {
        status: 'running',
        reachable: true,
      }
    }

    // Agents count
    const agentsMatch = line.match(/Agents\s*\|\s*(\d+)/)
    if (agentsMatch) {
      status.agents = {
        count: parseInt(agentsMatch[1], 10),
      }
    }

    // Sessions count
    const sessionsMatch = line.match(/Sessions\s*\|\s*(\d+)\s+active/)
    if (sessionsMatch) {
      status.sessions = {
        count: parseInt(sessionsMatch[1], 10),
        active: true,
      }
    }

    // Version
    const versionMatch = line.match(/app\s+(\d+\.\d+\.\d+)/)
    if (versionMatch) {
      status.version = versionMatch[1]
    }

    // Update status
    if (line.includes('Update') && line.includes('available')) {
      status.update = {
        available: true,
      }
    }
  }

  return status
}

/**
 * 解析键值对输出
 * @param output - CLI 原始输出
 * @returns 解析后的键值对
 */
export function parseKeyValueOutput(output: string): Record<string, string> {
  const result: Record<string, string> = {}
  const lines = output.split('\n')

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/)
    if (match) {
      const [, key, value] = match
      result[key.trim()] = value.trim()
    }
  }

  return result
}

const parsersDefault = {
  parseAgentsOutput,
  parseCronOutput,
  parseStatusOutput,
  parseKeyValueOutput,
}

export default parsersDefault
