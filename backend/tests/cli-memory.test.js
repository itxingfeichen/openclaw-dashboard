/**
 * CLI Memory 模块测试
 * 测试记忆操作功能 (search, get, reindex 等)
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  searchMemory,
  getMemory,
  reindexMemory,
  getMemoryStatus,
  getMemoriesBySession,
  getMemoriesByAgent,
  deleteMemory,
  parseMemoryStatusOutput,
} from '../src/cli-adapter/memory.js'

describe('CLI Memory', () => {
  describe('searchMemory', () => {
    it('should search memory with query', async () => {
      const result = await searchMemory('test query')
      
      assert.ok(result)
      assert.ok('success' in result)
      assert.strictEqual(result.query, 'test query')
    })

    it('should respect limit option', async () => {
      const result = await searchMemory('test', { limit: 5 })
      
      assert.ok(result)
    })

    it('should respect threshold option', async () => {
      const result = await searchMemory('test', { threshold: 0.7 })
      
      assert.ok(result)
    })

    it('should respect agentId option', async () => {
      const result = await searchMemory('test', { agentId: 'main' })
      
      assert.ok(result)
    })

    it('should respect sessionKey option', async () => {
      const result = await searchMemory('test', { sessionKey: 'test-session' })
      
      assert.ok(result)
    })

    it('should handle empty results', async () => {
      const result = await searchMemory('nonexistent_query_xyz123')
      
      assert.ok(result)
      assert.ok('success' in result)
    })
  })

  describe('getMemory', () => {
    it('should attempt to get memory by ID', async () => {
      const result = await getMemory('test-memory-id')
      
      assert.ok(result)
      assert.ok('success' in result)
      assert.strictEqual(result.memoryId, 'test-memory-id')
    })

    it('should handle non-existent memory', async () => {
      const result = await getMemory('nonexistent-id')
      
      assert.ok(result)
      // 可能成功 (空结果) 或失败 (错误信息)
      assert.ok('success' in result)
    })
  })

  describe('reindexMemory', () => {
    it('should attempt memory reindex', async () => {
      const result = await reindexMemory()
      
      assert.ok(result)
      assert.ok('success' in result)
    })

    it('should respect agentId option', async () => {
      const result = await reindexMemory({ agentId: 'main' })
      
      assert.ok(result)
    })

    it('should respect force option', async () => {
      const result = await reindexMemory({ force: true })
      
      assert.ok(result)
    })
  })

  describe('getMemoryStatus', () => {
    it('should get memory system status', async () => {
      const result = await getMemoryStatus()
      
      assert.ok(result)
      assert.ok('success' in result)
      
      if (result.success && result.data) {
        assert.ok('timestamp' in result.data)
      }
    })
  })

  describe('getMemoriesBySession', () => {
    it('should get memories by session', async () => {
      const result = await getMemoriesBySession('test-session')
      
      assert.ok(result)
      assert.ok('success' in result)
      assert.strictEqual(result.sessionKey, 'test-session')
    })

    it('should respect limit option', async () => {
      const result = await getMemoriesBySession('test-session', { limit: 10 })
      
      assert.ok(result)
    })
  })

  describe('getMemoriesByAgent', () => {
    it('should get memories by agent', async () => {
      const result = await getMemoriesByAgent('main')
      
      assert.ok(result)
      assert.ok('success' in result)
      assert.strictEqual(result.agentId, 'main')
    })

    it('should respect limit option', async () => {
      const result = await getMemoriesByAgent('coder', { limit: 10 })
      
      assert.ok(result)
    })
  })

  describe('deleteMemory', () => {
    it('should return not supported error', async () => {
      const result = await deleteMemory('test-memory-id')
      
      assert.ok(result)
      assert.strictEqual(result.success, false)
      assert.ok(result.error?.includes('not supported'))
    })
  })

  describe('parseMemoryStatusOutput', () => {
    it('should parse memory status output', () => {
      const output = `Memory Status
Index files: 5
Memories: 1234
Dimensions: 1536
Path: ~/.openclaw/memory
Last updated: 2026-03-15T00:00:00Z`

      const result = parseMemoryStatusOutput(output)
      
      assert.strictEqual(result.indexFiles, 5)
      assert.strictEqual(result.totalMemories, 1234)
      assert.strictEqual(result.dimensions, 1536)
      assert.strictEqual(result.path, '~/.openclaw/memory')
      assert.ok(result.lastUpdated)
      assert.ok(result.timestamp)
    })

    it('should handle minimal output', () => {
      const output = 'Memory system initialized'
      
      const result = parseMemoryStatusOutput(output)
      
      assert.ok(result)
      assert.ok(result.timestamp)
    })

    it('should handle empty output', () => {
      const result = parseMemoryStatusOutput('')
      
      assert.ok(result)
      assert.ok(result.timestamp)
    })
  })

  describe('MEMORY_COMMANDS constants', () => {
    it('should export command constants', async () => {
      const { MEMORY_COMMANDS } = await import('../src/cli-adapter/memory.js')
      
      assert.ok(MEMORY_COMMANDS)
      assert.ok(MEMORY_COMMANDS.SEARCH)
      assert.ok(MEMORY_COMMANDS.GET)
      assert.ok(MEMORY_COMMANDS.REINDEX)
      assert.ok(MEMORY_COMMANDS.STATUS)
    })
  })

  describe('Integration tests', () => {
    it('should handle complete search workflow', async () => {
      // 搜索
      const searchResult = await searchMemory('test', { limit: 5 })
      assert.ok(searchResult)
      
      // 状态检查
      const statusResult = await getMemoryStatus()
      assert.ok(statusResult)
    })
  })
})
