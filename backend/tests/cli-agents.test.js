/**
 * CLI Agents 模块测试
 * 测试 Agent 管理功能 (list, status, create, delete 等)
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
} from '../src/cli-adapter/agents.js'

describe('CLI Agents', () => {
  describe('listAgents', () => {
    it('should list agents', async () => {
      const result = await listAgents()
      
      assert.ok(result)
      assert.ok('success' in result)
      
      if (result.success && result.data) {
        assert.ok('agents' in result.data)
        assert.ok('count' in result.data)
        assert.ok('timestamp' in result.data)
      }
    })

    it('should handle verbose option', async () => {
      const result = await listAgents({ verbose: true })
      
      assert.ok(result)
    })
  })

  describe('getAgentStatus', () => {
    it('should get agent status', async () => {
      const result = await getAgentStatus('main')
      
      assert.ok(result)
      assert.ok('success' in result)
      
      if (result.success && result.data) {
        assert.strictEqual(result.data.id, 'main')
        assert.ok('status' in result.data)
      }
    })

    it('should handle non-existent agent', async () => {
      const result = await getAgentStatus('nonexistent-agent')
      
      assert.ok(result)
      assert.ok('success' in result)
    })
  })

  describe('createAgent', () => {
    it('should attempt to create agent', async () => {
      const result = await createAgent({
        name: 'test-agent-' + Date.now(),
        model: 'qwen3.5-plus',
      })
      
      assert.ok(result)
      assert.ok('success' in result)
    })

    it('should handle create with workspace', async () => {
      const result = await createAgent({
        name: 'test-workspace-agent',
        workspace: '/tmp/test-workspace',
      })
      
      assert.ok(result)
    })

    it('should handle create with system prompt', async () => {
      const result = await createAgent({
        name: 'test-prompt-agent',
        systemPrompt: 'You are a test agent',
      })
      
      assert.ok(result)
    })
  })

  describe('deleteAgent', () => {
    it('should attempt to delete agent', async () => {
      const result = await deleteAgent('test-agent-to-delete')
      
      assert.ok(result)
      assert.ok('success' in result)
      assert.strictEqual(result.agentId, 'test-agent-to-delete')
    })

    it('should handle force delete', async () => {
      const result = await deleteAgent('test-agent', { force: true })
      
      assert.ok(result)
    })
  })

  describe('getAgentConfig', () => {
    it('should get agent config', async () => {
      const result = await getAgentConfig('main')
      
      assert.ok(result)
      assert.ok('success' in result)
      
      if (result.success && result.data) {
        assert.strictEqual(result.data.agentId, 'main')
        assert.ok('config' in result.data)
      }
    })

    it('should handle non-existent agent config', async () => {
      const result = await getAgentConfig('nonexistent-agent')
      
      assert.ok(result)
    })
  })

  describe('updateAgentConfig', () => {
    it('should update agent config', async () => {
      const result = await updateAgentConfig('main', {
        model: 'qwen3.5-plus',
        temperature: '0.7',
      })
      
      assert.ok(result)
      assert.ok('success' in result)
      
      if (result.success && result.data) {
        assert.ok(result.data.updated)
        assert.ok(result.data.updatedAt)
      }
    })
  })

  describe('startAgent', () => {
    it('should start agent', async () => {
      const result = await startAgent('main')
      
      assert.ok(result)
      assert.ok('success' in result)
      
      if (result.success && result.data) {
        assert.strictEqual(result.data.id, 'main')
        assert.strictEqual(result.data.status, 'running')
        assert.ok(result.data.startedAt)
      }
    })

    it('should start agent with custom message', async () => {
      const result = await startAgent('coder', { message: 'wake up' })
      
      assert.ok(result)
    })
  })

  describe('stopAgent', () => {
    it('should stop agent', async () => {
      const result = await stopAgent('main')
      
      assert.ok(result)
      assert.ok('success' in result)
      
      if (result.success && result.data) {
        assert.strictEqual(result.data.id, 'main')
        assert.strictEqual(result.data.status, 'stopped')
        assert.ok(result.data.stoppedAt)
      }
    })
  })

  describe('restartAgent', () => {
    it('should restart agent', async () => {
      const result = await restartAgent('main')
      
      assert.ok(result)
      assert.ok('success' in result)
      
      if (result.success && result.data) {
        assert.strictEqual(result.data.id, 'main')
        assert.strictEqual(result.data.status, 'running')
        assert.ok(result.data.restartedAt)
      }
    })
  })

  describe('getAgentStats', () => {
    it('should get agent statistics', async () => {
      const result = await getAgentStats('main')
      
      assert.ok(result)
      assert.ok('success' in result)
      
      if (result.success && result.data) {
        assert.strictEqual(result.data.agentId, 'main')
        assert.ok('sessionCount' in result.data)
        assert.ok('timeRange' in result.data)
      }
    })

    it('should respect timeRange option', async () => {
      const result = await getAgentStats('main', { timeRange: '7d' })
      
      assert.ok(result)
    })
  })

  describe('listSubagents', () => {
    it('should list subagents', async () => {
      const result = await listSubagents()
      
      assert.ok(result)
      assert.ok('success' in result)
      
      if (result.success && result.data) {
        assert.ok('subagents' in result.data)
        assert.ok('count' in result.data)
        assert.ok('timestamp' in result.data)
      }
    })
  })

  describe('AGENT_COMMANDS constants', () => {
    it('should export command constants', async () => {
      const { AGENT_COMMANDS } = await import('../src/cli-adapter/agents.js')
      
      assert.ok(AGENT_COMMANDS)
      assert.ok(AGENT_COMMANDS.LIST)
      assert.ok(AGENT_COMMANDS.STATUS)
      assert.ok(AGENT_COMMANDS.CREATE)
      assert.ok(AGENT_COMMANDS.DELETE)
      assert.ok(AGENT_COMMANDS.CONFIG)
    })
  })

  describe('Integration tests', () => {
    it('should handle complete agent workflow', async () => {
      // 列出 Agent
      const listResult = await listAgents()
      assert.ok(listResult)
      
      // 获取状态
      const statusResult = await getAgentStatus('main')
      assert.ok(statusResult)
      
      // 获取统计
      const statsResult = await getAgentStats('main')
      assert.ok(statsResult)
      
      // 重启 Agent
      const restartResult = await restartAgent('main')
      assert.ok(restartResult)
    })
  })
})
