/**
 * CLI 解析器测试
 * Tests for parsers.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  parseAgentsOutput,
  parseCronOutput,
  parseStatusOutput,
  parseKeyValueOutput,
} from '../src/cli-adapter/parsers.js'

describe('parseAgentsOutput', () => {
  it('should parse single agent', () => {
    const output = `- main (default)
  Workspace: /home/admin/.openclaw/workspace
  Model: qwen3.5-plus`

    const result = parseAgentsOutput(output)

    assert.equal(result.agents.length, 1)
    assert.equal(result.agents[0].id, 'main')
    assert.equal(result.agents[0].name, 'main')
    assert.equal(result.agents[0].isDefault, true)
    assert.equal(result.agents[0].workspace, '/home/admin/.openclaw/workspace')
    assert.equal(result.agents[0].model, 'qwen3.5-plus')
    assert.equal(result.count, 1)
    assert.ok(result.timestamp)
  })

  it('should parse multiple agents', () => {
    const output = `- main (default)
  Workspace: /home/admin/.openclaw/workspace
  Model: qwen3.5-plus

- product_manager
  Workspace: /home/admin/.openclaw/products
  Model: qwen3.5-plus

- coder
  Workspace: /home/admin/.openclaw/projects
  Model: qwen3.5-plus`

    const result = parseAgentsOutput(output)

    assert.equal(result.agents.length, 3)
    assert.equal(result.agents[0].id, 'main')
    assert.equal(result.agents[1].id, 'product_manager')
    assert.equal(result.agents[2].id, 'coder')
    assert.equal(result.count, 3)
  })

  it('should handle agent without default marker', () => {
    const output = `- main
  Workspace: /home/admin/.openclaw/workspace`

    const result = parseAgentsOutput(output)

    assert.equal(result.agents.length, 1)
    assert.equal(result.agents[0].id, 'main')
    assert.equal(result.agents[0].isDefault, false)
  })

  it('should handle empty output', () => {
    const result = parseAgentsOutput('')

    assert.equal(result.agents.length, 0)
    assert.equal(result.count, 0)
  })

  it('should parse all agent properties', () => {
    const output = `- test-agent
  Workspace: /path/to/workspace
  AgentDir: /path/to/agent
  Model: test-model
  RoutingRules: 5`

    const result = parseAgentsOutput(output)

    assert.equal(result.agents[0].workspace, '/path/to/workspace')
    assert.equal(result.agents[0].agentDir, '/path/to/agent')
    assert.equal(result.agents[0].model, 'test-model')
    assert.equal(result.agents[0].routingRules, 5)
  })
})

describe('parseCronOutput', () => {
  it('should parse cron tasks', () => {
    const output = `ID                                   Name          Schedule      Next            Last            Status    Target          Agent ID
abc12345-6789-0abc-def1-234567890abc  Daily Backup  0 0 * * *     2026-03-15      2026-03-14      active      -               main`

    const result = parseCronOutput(output)

    assert.equal(result.tasks.length, 1)
    assert.equal(result.tasks[0].id, 'abc12345-6789-0abc-def1-234567890abc')
    assert.equal(result.tasks[0].name, 'Daily Backup')
    assert.equal(result.tasks[0].schedule, '0 0 * * *')
    assert.equal(result.tasks[0].enabled, true)
    assert.equal(result.count, 1)
  })

  it('should parse multiple tasks', () => {
    const output = `ID                                   Name          Schedule      Next            Last            Status    Target          Agent ID
abc12345-6789-0abc-def1-234567890abc  Task 1        0 * * * *     2026-03-15      2026-03-15      active      -               main
def23456-7890-1bcd-ef23-456789012bcd  Task 2        0 0 * * *     2026-03-16      2026-03-15      active      user123         main`

    const result = parseCronOutput(output)

    assert.equal(result.tasks.length, 2)
    assert.equal(result.tasks[0].name, 'Task 1')
    assert.equal(result.tasks[1].name, 'Task 2')
    assert.equal(result.tasks[1].target, 'user123')
  })

  it('should handle disabled tasks', () => {
    const output = `ID                                   Name          Schedule      Next            Last            Status      Target    Agent ID
abc12345-6789-0abc-def1-234567890abc  Disabled Task 0 0 * * *     -               -             disabled    -         -`

    const result = parseCronOutput(output)

    assert.equal(result.tasks.length, 1)
    assert.equal(result.tasks[0].enabled, false)
  })

  it('should handle empty output', () => {
    const result = parseCronOutput('')

    assert.equal(result.tasks.length, 0)
    assert.equal(result.count, 0)
  })

  it('should handle malformed lines', () => {
    const output = `ID                                   Name          Schedule
invalid line without enough columns
abc12345-6789-0abc-def1-234567890abc  Task          0 * * * *     2026-03-15      2026-03-14      active      -               main`

    const result = parseCronOutput(output)

    assert.equal(result.tasks.length, 1)
    assert.equal(result.tasks[0].id, 'abc12345-6789-0abc-def1-234567890abc')
  })
})

describe('parseStatusOutput', () => {
  it('should parse status output', () => {
    const output = `OpenClaw Dashboard | http://localhost:3000
Gateway | reachable
Agents | 3
Sessions | 5 active
Version: app 1.0.0`

    const result = parseStatusOutput(output)

    assert.equal(result.status, 'healthy')
    assert.equal(result.dashboard, 'http://localhost:3000')
    assert.ok(result.gateway)
    assert.ok(result.gateway.reachable)
    assert.equal(result.agents?.count, 3)
    assert.equal(result.sessions?.count, 5)
    assert.equal(result.version, '1.0.0')
  })

  it('should handle minimal status output', () => {
    const output = `Gateway | reachable`

    const result = parseStatusOutput(output)

    assert.equal(result.status, 'healthy')
    assert.ok(result.gateway)
    assert.ok(result.gateway.reachable)
  })

  it('should handle empty output', () => {
    const result = parseStatusOutput('')

    assert.equal(result.status, 'healthy')
    assert.ok(result.timestamp)
  })

  it('should detect update available', () => {
    const output = `Update available: 1.0.0 -> 1.1.0`

    const result = parseStatusOutput(output)

    assert.ok(result.update)
    assert.ok(result.update.available)
  })
})

describe('parseKeyValueOutput', () => {
  it('should parse key-value pairs', () => {
    const output = `key1: value1
key2: value2
key3: value with spaces`

    const result = parseKeyValueOutput(output)

    assert.equal(result.key1, 'value1')
    assert.equal(result.key2, 'value2')
    assert.equal(result.key3, 'value with spaces')
  })

  it('should handle empty lines', () => {
    const output = `key1: value1

key2: value2
`

    const result = parseKeyValueOutput(output)

    assert.equal(Object.keys(result).length, 2)
    assert.equal(result.key1, 'value1')
    assert.equal(result.key2, 'value2')
  })

  it('should handle empty output', () => {
    const result = parseKeyValueOutput('')

    assert.equal(Object.keys(result).length, 0)
  })

  it('should trim keys and values', () => {
    const output = `  key1  :   value1  
key2:value2`

    const result = parseKeyValueOutput(output)

    assert.equal(result.key1, 'value1')
    assert.equal(result.key2, 'value2')
  })
})
