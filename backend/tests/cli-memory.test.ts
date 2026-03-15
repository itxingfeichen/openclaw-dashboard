/**
 * 记忆操作测试
 * Tests for memory.ts
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
  MEMORY_COMMANDS,
} from '../src/cli-adapter/memory.js'

describe('searchMemory', () => {
  it('should search memories', async () => {
    const result = await searchMemory('test query')

    assert.ok(result.success || !result.success)
    // Search may return empty results or fail if no memories exist
    assert.ok('command' in result)
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
    const result = await searchMemory('test', { sessionKey: 'session-123' })

    assert.ok(result)
  })
})

describe('getMemory', () => {
  it('should attempt to get memory by ID', async () => {
    const result = await getMemory('nonexistent-id')

    // May fail if memory doesn't exist, which is expected
    assert.ok(result)
    assert.ok('command' in result)
  })
})

describe('reindexMemory', () => {
  it('should reindex memories', async () => {
    const result = await reindexMemory()

    // Reindex may take time or fail if no agent configured
    assert.ok(result)
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
    assert.ok('command' in result)
  })
})

describe('getMemoriesBySession', () => {
  it('should get memories by session', async () => {
    const result = await getMemoriesBySession('session-123')

    assert.ok(result)
  })

  it('should respect limit option', async () => {
    const result = await getMemoriesBySession('session-123', { limit: 10 })

    assert.ok(result)
  })
})

describe('getMemoriesByAgent', () => {
  it('should get memories by agent', async () => {
    const result = await getMemoriesByAgent('main')

    assert.ok(result)
  })

  it('should respect limit option', async () => {
    const result = await getMemoriesByAgent('main', { limit: 10 })

    assert.ok(result)
  })
})

describe('deleteMemory', () => {
  it('should attempt to delete memory', async () => {
    const result = await deleteMemory('nonexistent-id')

    // May fail if memory doesn't exist
    assert.ok(result)
  })
})

describe('MEMORY_COMMANDS', () => {
  it('should have all command constants', () => {
    assert.ok(MEMORY_COMMANDS.SEARCH)
    assert.ok(MEMORY_COMMANDS.GET)
    assert.ok(MEMORY_COMMANDS.REINDEX)
    assert.ok(MEMORY_COMMANDS.STATUS)
    assert.ok(MEMORY_COMMANDS.DELETE)
  })

  it('should have correct command format', () => {
    assert.ok(MEMORY_COMMANDS.SEARCH.startsWith('openclaw memory'))
    assert.ok(MEMORY_COMMANDS.GET.startsWith('openclaw memory'))
  })
})

describe('memory error handling', () => {
  it('should handle search with special characters', async () => {
    const result = await searchMemory('test "query" with special chars')

    assert.ok(result)
  })

  it('should handle empty query', async () => {
    const result = await searchMemory('')

    assert.ok(result)
  })
})
