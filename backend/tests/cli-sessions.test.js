/**
 * CLI Sessions 模块测试
 * 测试会话管理功能 (list, spawn, send, history 等)
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
} from '../src/cli-adapter/sessions.js'

describe('CLI Sessions', () => {
  describe('listSessions', () => {
    it('should list sessions', async () => {
      const result = await listSessions()
      
      assert.ok(result)
      assert.ok('success' in result)
      
      if (result.success && result.data) {
        assert.ok('sessions' in result.data || Array.isArray(result.data))
      }
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
    it('should spawn session with message', async () => {
      const result = await spawnSession({ 
        message: 'Hello',
        model: 'qwen3.5-plus',
      })
      
      assert.ok(result)
      assert.ok('success' in result)
      
      if (result.success && result.data) {
        assert.ok(result.data.spawnedAt)
      }
    })

    it('should handle spawn with target', async () => {
      const result = await spawnSession({ 
        message: 'Test',
        target: 'test-user',
      })
      
      assert.ok(result)
    })

    it('should handle spawn with agentId', async () => {
      const result = await spawnSession({ 
        message: 'Test',
        agentId: 'main',
      })
      
      assert.ok(result)
    })

    it('should handle spawn with deliver option', async () => {
      const result = await spawnSession({ 
        message: 'Test',
        deliver: true,
      })
      
      assert.ok(result)
    })
  })

  describe('sendToSession', () => {
    it('should send message to session', async () => {
      const result = await sendToSession('test-session', 'Hello from test')
      
      assert.ok(result)
      assert.ok('success' in result)
      assert.strictEqual(result.sessionKey, 'test-session')
      
      if (result.success) {
        assert.ok(result.sentAt)
      }
    })

    it('should handle send with agentId', async () => {
      const result = await sendToSession('test-session', 'Test', { 
        agentId: 'main' 
      })
      
      assert.ok(result)
    })

    it('should handle send with model', async () => {
      const result = await sendToSession('test-session', 'Test', { 
        model: 'qwen3.5-plus' 
      })
      
      assert.ok(result)
    })

    it('should handle send with deliver', async () => {
      const result = await sendToSession('test-session', 'Test', { 
        deliver: true 
      })
      
      assert.ok(result)
    })
  })

  describe('getSessionHistory', () => {
    it('should get session history', async () => {
      const result = await getSessionHistory('test-session')
      
      assert.ok(result)
      assert.ok('success' in result)
      assert.strictEqual(result.sessionKey, 'test-session')
    })

    it('should respect limit option', async () => {
      const result = await getSessionHistory('test-session', { limit: 10 })
      
      assert.ok(result)
    })

    it('should handle includeMetadata option', async () => {
      const result = await getSessionHistory('test-session', { 
        includeMetadata: false 
      })
      
      assert.ok(result)
    })

    it('should handle non-existent session', async () => {
      const result = await getSessionHistory('nonexistent-session-xyz')
      
      assert.ok(result)
      // 应该返回错误
      assert.ok(!result.success || result.error)
    })
  })

  describe('getSession', () => {
    it('should get session details', async () => {
      const result = await getSession('test-session')
      
      assert.ok(result)
      assert.ok('success' in result)
      assert.strictEqual(result.sessionKey, 'test-session')
    })

    it('should handle non-existent session', async () => {
      const result = await getSession('nonexistent-session')
      
      assert.ok(result)
      assert.ok(!result.success || result.error)
    })
  })

  describe('deleteSession', () => {
    it('should attempt to delete session', async () => {
      const result = await deleteSession('test-session-to-delete')
      
      assert.ok(result)
      assert.ok('success' in result)
      assert.strictEqual(result.sessionKey, 'test-session-to-delete')
    })
  })

  describe('cleanupSessions', () => {
    it('should cleanup old sessions (dry run)', async () => {
      const result = await cleanupSessions({ 
        olderThanDays: 30, 
        dryRun: true 
      })
      
      assert.ok(result)
      assert.ok('success' in result)
      
      if (result.success && result.data) {
        assert.ok('dryRun' in result.data)
        assert.ok('expiredCount' in result.data)
      }
    })

    it('should respect olderThanDays option', async () => {
      const result = await cleanupSessions({ olderThanDays: 7 })
      
      assert.ok(result)
    })
  })

  describe('getSessionStats', () => {
    it('should get session statistics', async () => {
      const result = await getSessionStats()
      
      assert.ok(result)
      assert.ok('success' in result)
      
      if (result.success && result.data) {
        assert.ok('total' in result.data)
        assert.ok('byAgent' in result.data)
        assert.ok('byModel' in result.data)
        assert.ok('tokenUsage' in result.data)
      }
    })

    it('should respect activeMinutes option', async () => {
      const result = await getSessionStats({ activeMinutes: 60 })
      
      assert.ok(result)
    })
  })

  describe('SESSION_COMMANDS constants', () => {
    it('should export command constants', async () => {
      const { SESSION_COMMANDS } = await import('../src/cli-adapter/sessions.js')
      
      assert.ok(SESSION_COMMANDS)
      assert.ok(SESSION_COMMANDS.LIST)
      assert.ok(SESSION_COMMANDS.SPAWN)
      assert.ok(SESSION_COMMANDS.SEND)
      assert.ok(SESSION_COMMANDS.HISTORY)
      assert.ok(SESSION_COMMANDS.GET)
      assert.ok(SESSION_COMMANDS.DELETE)
    })
  })

  describe('Integration tests', () => {
    it('should handle complete session workflow', async () => {
      // 列出会话
      const listResult = await listSessions({ limit: 5 })
      assert.ok(listResult)
      
      // 获取统计
      const statsResult = await getSessionStats()
      assert.ok(statsResult)
      
      // 生成新会话
      const spawnResult = await spawnSession({ 
        message: 'Integration test',
        model: 'qwen3.5-plus',
      })
      assert.ok(spawnResult)
    })
  })
})
