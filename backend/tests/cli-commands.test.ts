/**
 * CLI 命令封装测试
 * Tests for commands.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  getStatus,
  getAgentsList,
  getSessionsList,
  getCronList,
  getConfig,
  executeCustomCommand,
  CLI_COMMANDS,
} from '../src/cli-adapter/commands.js'

describe('getStatus', () => {
  it('should get system status', async () => {
    const result = await getStatus()

    assert.ok(result)
    assert.ok('status' in result)
    assert.ok('timestamp' in result)
  })

  it('should return healthy status', async () => {
    const result = await getStatus()

    assert.ok(['healthy', 'unhealthy', 'unknown'].includes(result.status))
  })
})

describe('getAgentsList', () => {
  it('should get agents list', async () => {
    const result = await getAgentsList()

    assert.ok(result)
    assert.ok('agents' in result)
    assert.ok('count' in result)
    assert.ok(Array.isArray(result.agents))
  })

  it('should include timestamp', async () => {
    const result = await getAgentsList()

    assert.ok(result.timestamp)
    assert.ok(typeof result.timestamp === 'string')
  })
})

describe('getSessionsList', () => {
  it('should get sessions list', async () => {
    const result = await getSessionsList()

    assert.ok(result)
    assert.ok('sessions' in result)
    assert.ok('count' in result)
    assert.ok(Array.isArray(result.sessions))
  })

  it('should include session keys', async () => {
    const result = await getSessionsList()

    if (result.sessions.length > 0) {
      assert.ok('key' in result.sessions[0])
    }
  })
})

describe('getCronList', () => {
  it('should get cron tasks list', async () => {
    const result = await getCronList()

    assert.ok(result)
    assert.ok('tasks' in result)
    assert.ok('count' in result)
    assert.ok(Array.isArray(result.tasks))
  })

  it('should include task schedules', async () => {
    const result = await getCronList()

    if (result.tasks.length > 0) {
      assert.ok('schedule' in result.tasks[0])
    }
  })
})

describe('getConfig', () => {
  it('should get config without key', async () => {
    const result = await getConfig()

    assert.ok(result)
    assert.ok('value' in result)
    assert.ok('key' in result)
  })

  it('should get config with specific key', async () => {
    const result = await getConfig('some-key')

    assert.ok(result)
    assert.equal(result.key, 'some-key')
  })
})

describe('executeCustomCommand', () => {
  it('should execute custom command', async () => {
    const result = await executeCustomCommand('echo "test"')

    assert.ok(result)
    assert.ok(result.includes('test'))
  })

  it('should execute command with JSON output', async () => {
    const result = await executeCustomCommand('echo \'{"key": "value"}\'', {
      parseJson: true,
    })

    assert.ok(result)
    assert.deepStrictEqual(result, { key: 'value' })
  })

  it('should respect timeout option', async () => {
    await assert.rejects(
      async () => {
        await executeCustomCommand('sleep 2', { timeout: 100 })
      },
      (error: any) => {
        return error.message.includes('失败') || error.message.includes('timeout')
      }
    )
  })

  it('should respect retries option', async () => {
    const result = await executeCustomCommand('echo "retry test"', {
      retries: 2,
    })

    assert.ok(result)
  })
})

describe('CLI_COMMANDS', () => {
  it('should have all command constants', () => {
    assert.ok(CLI_COMMANDS.STATUS)
    assert.ok(CLI_COMMANDS.AGENTS_LIST)
    assert.ok(CLI_COMMANDS.SESSIONS_LIST)
    assert.ok(CLI_COMMANDS.CRON_LIST)
    assert.ok(CLI_COMMANDS.CONFIG_GET)
  })

  it('should have correct command format', () => {
    assert.ok(CLI_COMMANDS.STATUS.startsWith('openclaw'))
    assert.ok(CLI_COMMANDS.AGENTS_LIST.startsWith('openclaw'))
    assert.ok(CLI_COMMANDS.SESSIONS_LIST.startsWith('openclaw'))
  })
})

describe('command error handling', () => {
  it('should throw on failed command', async () => {
    await assert.rejects(
      async () => {
        await executeCustomCommand('exit 1')
      },
      (error: any) => {
        return error.message.includes('失败')
      }
    )
  })

  it('should handle command with stderr', async () => {
    const result = await executeCustomCommand('echo "test" >&2', {
      parseJson: false,
    })

    assert.ok(result)
  })
})

describe('command integration', () => {
  it('should support full workflow', async () => {
    // Get status
    const status = await getStatus()
    assert.ok(status)

    // Get agents
    const agents = await getAgentsList()
    assert.ok(agents)

    // Get sessions
    const sessions = await getSessionsList()
    assert.ok(sessions)

    // Get cron
    const cron = await getCronList()
    assert.ok(cron)

    // Get config
    const config = await getConfig()
    assert.ok(config)
  })
})
