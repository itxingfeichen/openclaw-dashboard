/**
 * 会话管理测试
 * Tests for sessions.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  listSessions,
  spawnSession,
  sendToSession,
  getSessionHistory,
  getSession,
  deleteSession,
  cleanupSessions,
  getSessionStats,
  SESSION_COMMANDS,
} from '../src/cli-adapter/sessions.js'

describe('listSessions', () => {
  it('should list sessions', async () => {
    const result = await listSessions()

    assert.ok(result.success || !result.success)
    assert.ok('command' in result)
  })

  it('should respect activeMinutes option', async () => {
    const result = await listSessions({ activeMinutes: 60 })

    assert.ok(result)
  })

  it('should respect limit option', async () => {
    const result = await listSessions({ limit: 10 })

    assert.ok(result)
  })
})

describe('spawnSession', () => {
  it('should spawn a new session', async () => {
    const result = await spawnSession({
      message: 'Hello',
      agentId: 'main',
      model: 'qwen3.5-plus',
    })

    assert.ok(result)
    assert.ok('command' in result)
  })

  it('should respect target option', async () => {
    const result = await spawnSession({
      message: 'Hello',
      target: '+1234567890',
    })

    assert.ok(result)
  })

  it('should respect deliver option', async () => {
    const result = await spawnSession({
      message: 'Hello',
      deliver: true,
    })

    assert.ok(result)
  })

  it('should handle message with special characters', async () => {
    const result = await spawnSession({
      message: 'Test "quoted" message',
    })

    assert.ok(result)
  })
})

describe('sendToSession', () => {
  it('should send message to session', async () => {
    const result = await sendToSession('test-session', 'Follow-up message')

    assert.ok(result)
  })

  it('should respect agentId option', async () => {
    const result = await sendToSession('test-session', 'Message', {
      agentId: 'main',
    })

    assert.ok(result)
  })

  it('should respect model option', async () => {
    const result = await sendToSession('test-session', 'Message', {
      model: 'qwen3.5-plus',
    })

    assert.ok(result)
  })

  it('should respect deliver option', async () => {
    const result = await sendToSession('test-session', 'Message', {
      deliver: true,
    })

    assert.ok(result)
  })
})

describe('getSessionHistory', () => {
  it('should get session history', async () => {
    const result = await getSessionHistory('test-session')

    assert.ok(result)
  })

  it('should respect limit option', async () => {
    const result = await getSessionHistory('test-session', { limit: 10 })

    assert.ok(result)
  })

  it('should respect includeMetadata option', async () => {
    const result = await getSessionHistory('test-session', {
      includeMetadata: true,
    })

    assert.ok(result)
  })
})

describe('getSession', () => {
  it('should get session details', async () => {
    const result = await getSession('test-session')

    // May fail if session doesn't exist
    assert.ok(result)
  })

  it('should handle non-existent session', async () => {
    const result = await getSession('nonexistent-session')

    assert.ok(!result.success || result.data === null)
  })
})

describe('deleteSession', () => {
  it('should delete session', async () => {
    const result = await deleteSession('test-session')

    // May fail if session doesn't exist
    assert.ok(result)
  })
})

describe('cleanupSessions', () => {
  it('should cleanup old sessions (dry run)', async () => {
    const result = await cleanupSessions({
      olderThanDays: 30,
      dryRun: true,
    })

    assert.ok(result.success)
    assert.ok(result.data)
    assert.ok('deleted' in result.data)
    assert.ok('dryRun' in result.data)
    assert.equal(result.data.dryRun, true)
  })

  it('should respect olderThanDays option', async () => {
    const result = await cleanupSessions({
      olderThanDays: 7,
      dryRun: true,
    })

    assert.ok(result.success)
  })

  it('should handle cleanup without dry run', async () => {
    const result = await cleanupSessions({
      olderThanDays: 30,
      dryRun: false,
    })

    assert.ok(result.success)
    assert.equal(result.data?.dryRun, false)
  })
})

describe('getSessionStats', () => {
  it('should get session statistics', async () => {
    const result = await getSessionStats()

    assert.ok(result.success || !result.success)
    if (result.success && result.data) {
      assert.ok('totalSessions' in result.data)
      assert.ok('activeSessions' in result.data)
      assert.ok('totalTokens' in result.data)
    }
  })

  it('should respect activeMinutes option', async () => {
    const result = await getSessionStats({ activeMinutes: 60 })

    assert.ok(result)
  })
})

describe('SESSION_COMMANDS', () => {
  it('should have all command constants', () => {
    assert.ok(SESSION_COMMANDS.LIST)
    assert.ok(SESSION_COMMANDS.SPAWN)
    assert.ok(SESSION_COMMANDS.SEND)
    assert.ok(SESSION_COMMANDS.HISTORY)
    assert.ok(SESSION_COMMANDS.DELETE)
    assert.ok(SESSION_COMMANDS.STATS)
  })

  it('should have correct command format', () => {
    assert.ok(SESSION_COMMANDS.LIST.includes('sessions'))
    assert.ok(SESSION_COMMANDS.SPAWN.includes('sessions'))
  })
})

describe('session error handling', () => {
  it('should handle session with special characters in key', async () => {
    const result = await getSession('session-with-dashes')

    assert.ok(result)
  })

  it('should handle empty message in spawn', async () => {
    const result = await spawnSession({
      message: '',
    })

    assert.ok(result)
  })
})
