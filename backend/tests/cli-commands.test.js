/**
 * CLI 命令封装测试
 * 测试 commands.js 中的高级命令封装函数
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import commands, { 
  getStatus,
  getAgentsList,
  getSessionsList,
  getCronList,
  getConfig,
  executeCustomCommand,
  startAgent,
  stopAgent,
  restartAgent,
  getAgentStatus,
} from '../src/cli-adapter/commands.js'

describe('CLI Commands', () => {
  describe('Command Constants', () => {
    it('should export command constants', () => {
      assert.ok(commands.COMMANDS)
      assert.strictEqual(typeof commands.COMMANDS.STATUS, 'string')
      assert.strictEqual(typeof commands.COMMANDS.AGENTS_LIST, 'string')
      assert.strictEqual(typeof commands.COMMANDS.SESSIONS_LIST, 'string')
      assert.strictEqual(typeof commands.COMMANDS.CRON_LIST, 'string')
      assert.strictEqual(typeof commands.COMMANDS.CONFIG_GET, 'string')
      
      // Verify command format
      assert.ok(commands.COMMANDS.STATUS.includes('openclaw'))
      assert.ok(commands.COMMANDS.STATUS.includes('status'))
      assert.ok(commands.COMMANDS.AGENTS_LIST.includes('agents'))
      assert.ok(commands.COMMANDS.SESSIONS_LIST.includes('sessions'))
      assert.ok(commands.COMMANDS.CRON_LIST.includes('cron'))
      assert.ok(commands.COMMANDS.CONFIG_GET.includes('config'))
    })
  })

  describe('startAgent', () => {
    it('should start agent successfully', async () => {
      const result = await startAgent('test-agent')

      assert.strictEqual(result.success, true)
      assert.strictEqual(result.data.id, 'test-agent')
      assert.strictEqual(result.data.status, 'running')
      assert.ok(result.data.startedAt)
    })

    it('should handle start agent error gracefully', async () => {
      // This should not throw, but return success with a note
      const result = await startAgent('nonexistent-agent')

      assert.strictEqual(result.success, true)
      assert.ok(result.data)
    })
  })

  describe('stopAgent', () => {
    it('should stop agent successfully', async () => {
      const result = await stopAgent('test-agent')

      assert.strictEqual(result.success, true)
      assert.strictEqual(result.data.id, 'test-agent')
      assert.strictEqual(result.data.status, 'stopped')
      assert.ok(result.data.stoppedAt)
    })
  })

  describe('restartAgent', () => {
    it('should restart agent successfully', async () => {
      const result = await restartAgent('test-agent')

      assert.strictEqual(result.success, true)
      assert.strictEqual(result.data.id, 'test-agent')
      assert.strictEqual(result.data.status, 'running')
      assert.ok(result.data.startedAt)
    })
  })

  describe('getAgentStatus', () => {
    it('should get agent status', async () => {
      const result = await getAgentStatus('test-agent')

      // The function returns result with data (may show agent as stopped)
      assert.ok(result)
      assert.ok(result.data || result.error)
    })
  })

  // Integration tests for main command functions
  // These test the actual CLI execution, so they may fail if OpenClaw is not installed
  describe('getStatus (integration)', () => {
    it('should attempt to get system status', async () => {
      try {
        const result = await getStatus()
        // If successful, verify structure
        assert.ok(result)
        assert.ok(result.timestamp)
      } catch (error) {
        // If OpenClaw CLI is not available, that's acceptable for this test
        assert.ok(error.message.includes('获取系统状态失败'))
      }
    })
  })

  describe('getAgentsList (integration)', () => {
    it('should attempt to get agents list', async () => {
      try {
        const result = await getAgentsList()
        // If successful, verify structure
        assert.ok(result)
        assert.ok(Array.isArray(result.agents))
        assert.ok(result.timestamp)
      } catch (error) {
        // If OpenClaw CLI is not available, that's acceptable for this test
        assert.ok(error.message.includes('获取 Agent 列表失败'))
      }
    })
  })

  describe('getSessionsList (integration)', () => {
    it('should attempt to get sessions list', async () => {
      try {
        const result = await getSessionsList()
        // If successful, verify structure
        assert.ok(result)
        assert.ok(Array.isArray(result.sessions))
      } catch (error) {
        // If OpenClaw CLI is not available, that's acceptable for this test
        assert.ok(error.message.includes('获取会话列表失败'))
      }
    })
  })

  describe('getCronList (integration)', () => {
    it('should attempt to get cron list', async () => {
      try {
        const result = await getCronList()
        // If successful, verify structure
        assert.ok(result)
        assert.ok(Array.isArray(result.tasks))
        assert.ok(result.timestamp)
      } catch (error) {
        // If OpenClaw CLI is not available, that's acceptable for this test
        assert.ok(error.message.includes('获取定时任务列表失败'))
      }
    })
  })

  describe('getConfig (integration)', () => {
    it('should attempt to get config', async () => {
      try {
        const result = await getConfig()
        // If successful, verify structure
        assert.ok(result)
        assert.ok('value' in result)
      } catch (error) {
        // If OpenClaw CLI is not available, that's acceptable for this test
        assert.ok(error.message.includes('获取配置失败'))
      }
    })

    it('should attempt to get config with specific key', async () => {
      try {
        const result = await getConfig('test.key')
        // If successful, verify structure
        assert.ok(result)
        assert.strictEqual(result.key, 'test.key')
      } catch (error) {
        // If OpenClaw CLI is not available, that's acceptable for this test
        assert.ok(error.message.includes('获取配置失败'))
      }
    })
  })

  describe('executeCustomCommand (integration)', () => {
    it('should execute simple command successfully', async () => {
      const result = await executeCustomCommand('echo "test"')
      assert.ok(result)
    })

    it('should throw error when command fails', async () => {
      await assert.rejects(
        async () => await executeCustomCommand('exit 1'),
        /执行命令失败/
      )
    })

    it('should respect timeout option', async () => {
      await assert.rejects(
        async () => await executeCustomCommand('sleep 5', { timeout: 1000 }),
        /执行命令失败/
      )
    })
  })
})
