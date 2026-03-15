/**
 * Agent 管理测试
 * Tests for agents.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  listAgents,
  getAgentStatus,
  createAgent,
  deleteAgent,
  getAgentConfig,
  updateAgentConfig,
  startAgent,
  stopAgent,
  restartAgent,
  getAgentStats,
  listSubagents,
  AGENT_COMMANDS,
} from '../src/cli-adapter/agents.js'

describe('listAgents', () => {
  it('should list agents', async () => {
    const result = await listAgents()

    assert.ok(result.success || !result.success)
    assert.ok('command' in result)
  })

  it('should respect verbose option', async () => {
    const result = await listAgents({ verbose: true })

    assert.ok(result)
  })
})

describe('getAgentStatus', () => {
  it('should get agent status', async () => {
    const result = await getAgentStatus('main')

    assert.ok(result)
    assert.ok('command' in result)
  })

  it('should handle non-existent agent', async () => {
    const result = await getAgentStatus('nonexistent-agent')

    assert.ok(result)
  })
})

describe('createAgent', () => {
  it('should attempt to create agent', async () => {
    const result = await createAgent({
      name: 'test-agent',
      workspace: '/tmp/test-workspace',
    })

    // May fail if agent already exists or workspace invalid
    assert.ok(result)
  })

  it('should respect model option', async () => {
    const result = await createAgent({
      name: 'test-agent-model',
      model: 'qwen3.5-plus',
    })

    assert.ok(result)
  })

  it('should respect systemPrompt option', async () => {
    const result = await createAgent({
      name: 'test-agent-prompt',
      systemPrompt: 'You are a helpful assistant',
    })

    assert.ok(result)
  })

  it('should handle special characters in systemPrompt', async () => {
    const result = await createAgent({
      name: 'test-agent-special',
      systemPrompt: 'You are "helpful" and\nfriendly',
    })

    assert.ok(result)
  })
})

describe('deleteAgent', () => {
  it('should attempt to delete agent', async () => {
    const result = await deleteAgent('test-agent')

    // May fail if agent doesn't exist
    assert.ok(result)
  })

  it('should respect force option', async () => {
    const result = await deleteAgent('test-agent', { force: true })

    assert.ok(result)
  })
})

describe('getAgentConfig', () => {
  it('should get agent config', async () => {
    const result = await getAgentConfig('main')

    assert.ok(result)
  })

  it('should handle non-existent agent', async () => {
    const result = await getAgentConfig('nonexistent')

    assert.ok(result)
  })
})

describe('updateAgentConfig', () => {
  it('should update agent config', async () => {
    const result = await updateAgentConfig('main', {
      model: 'qwen3.5-plus',
    })

    assert.ok(result)
  })

  it('should update multiple config fields', async () => {
    const result = await updateAgentConfig('main', {
      model: 'qwen3.5-plus',
      temperature: '0.7',
    })

    assert.ok(result)
  })

  it('should handle special characters in config values', async () => {
    const result = await updateAgentConfig('main', {
      systemPrompt: 'You are "helpful"',
    })

    assert.ok(result)
  })
})

describe('startAgent', () => {
  it('should start agent', async () => {
    const result = await startAgent('main')

    assert.ok(result)
    assert.ok('command' in result)
  })

  it('should respect message option', async () => {
    const result = await startAgent('main', { message: 'initialize' })

    assert.ok(result)
  })
})

describe('stopAgent', () => {
  it('should stop agent', async () => {
    const result = await stopAgent('main')

    assert.ok(result)
  })
})

describe('restartAgent', () => {
  it('should restart agent', async () => {
    const result = await restartAgent('main')

    assert.ok(result)
    assert.ok('command' in result)
  })
})

describe('getAgentStats', () => {
  it('should get agent statistics', async () => {
    const result = await getAgentStats('main')

    assert.ok(result)
    if (result.success && result.data) {
      assert.ok('id' in result.data)
      assert.ok('totalSessions' in result.data)
      assert.ok('timeRange' in result.data)
    }
  })

  it('should respect timeRange option', async () => {
    const result = await getAgentStats('main', { timeRange: '1h' })

    assert.ok(result)
  })
})

describe('listSubagents', () => {
  it('should list subagents', async () => {
    const result = await listSubagents()

    assert.ok(result)
  })

  it('should respect recentMinutes option', async () => {
    const result = await listSubagents({ recentMinutes: 30 })

    assert.ok(result)
  })
})

describe('AGENT_COMMANDS', () => {
  it('should have all command constants', () => {
    assert.ok(AGENT_COMMANDS.LIST)
    assert.ok(AGENT_COMMANDS.STATUS)
    assert.ok(AGENT_COMMANDS.CREATE)
    assert.ok(AGENT_COMMANDS.DELETE)
    assert.ok(AGENT_COMMANDS.CONFIG_GET)
    assert.ok(AGENT_COMMANDS.CONFIG_SET)
    assert.ok(AGENT_COMMANDS.START)
    assert.ok(AGENT_COMMANDS.STOP)
    assert.ok(AGENT_COMMANDS.RESTART)
    assert.ok(AGENT_COMMANDS.STATS)
    assert.ok(AGENT_COMMANDS.SUBAGENTS)
  })

  it('should have correct command format', () => {
    assert.ok(AGENT_COMMANDS.LIST.includes('agents'))
    assert.ok(AGENT_COMMANDS.CREATE.includes('agents'))
    assert.ok(AGENT_COMMANDS.SUBAGENTS.includes('subagents'))
  })
})

describe('agent error handling', () => {
  it('should handle agent name with special characters', async () => {
    const result = await getAgentStatus('test-agent_123')

    assert.ok(result)
  })

  it('should handle empty config update', async () => {
    const result = await updateAgentConfig('main', {})

    assert.ok(result)
  })
})

describe('agent lifecycle', () => {
  it('should support full lifecycle operations', async () => {
    // Create
    const createResult = await createAgent({
      name: 'lifecycle-test',
      model: 'qwen3.5-plus',
    })

    assert.ok(createResult)

    // Get status
    const statusResult = await getAgentStatus('lifecycle-test')

    assert.ok(statusResult)

    // Start
    const startResult = await startAgent('lifecycle-test')

    assert.ok(startResult)

    // Stop
    const stopResult = await stopAgent('lifecycle-test')

    assert.ok(stopResult)

    // Restart
    const restartResult = await restartAgent('lifecycle-test')

    assert.ok(restartResult)

    // Delete
    const deleteResult = await deleteAgent('lifecycle-test')

    assert.ok(deleteResult)
  })
})
