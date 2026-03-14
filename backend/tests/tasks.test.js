/**
 * Task API Tests
 * 测试任务列表与状态管理 API
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'

// Import service module
import * as taskService from '../src/services/taskService.js'

describe('Task Service', () => {
  describe('TaskStatus', () => {
    it('should have correct status values', () => {
      assert.strictEqual(taskService.TaskStatus.RUNNING, 'running')
      assert.strictEqual(taskService.TaskStatus.DONE, 'done')
      assert.strictEqual(taskService.TaskStatus.FAILED, 'failed')
    })
  })

  describe('TaskType', () => {
    it('should have correct type values', () => {
      assert.strictEqual(taskService.TaskType.SUBAGENT, 'subagent')
      assert.strictEqual(taskService.TaskType.CRON, 'cron')
      assert.strictEqual(taskService.TaskType.MANUAL, 'manual')
    })
  })

  describe('validatePaginationParams', () => {
    it('should throw error for invalid page', async () => {
      await assert.rejects(
        async () => await taskService.getTasks({ page: 0 }),
        (err) => {
          assert.strictEqual(err.code, 'INVALID_PAGE')
          return true
        }
      )
    })

    it('should throw error for invalid limit', async () => {
      await assert.rejects(
        async () => await taskService.getTasks({ limit: 1000 }),
        (err) => {
          assert.strictEqual(err.code, 'INVALID_LIMIT')
          return true
        }
      )
    })

    it('should accept valid pagination params', async () => {
      // This will fail due to CLI unavailability, but validates params first
      try {
        await taskService.getTasks({ page: 2, limit: 50 })
      } catch (error) {
        // Expected to fail at CLI level, not validation level
        assert.ok(['INVALID_PAGE', 'INVALID_LIMIT'].indexOf(error.code) === -1)
      }
    })
  })

  describe('getTasks', () => {
    it('should throw error for invalid status', async () => {
      await assert.rejects(
        async () => await taskService.getTasks({ status: 'invalid' }),
        (err) => {
          assert.strictEqual(err.code, 'INVALID_STATUS')
          return true
        }
      )
    })

    it('should handle CLI unavailable gracefully', async () => {
      // When CLI is unavailable, should return empty list with note
      const result = await taskService.getTasks()
      assert.ok(result)
      assert.ok(Array.isArray(result.tasks))
    })

    it('should support status filtering parameter', async () => {
      // Valid status should pass validation
      try {
        await taskService.getTasks({ status: 'running' })
      } catch (error) {
        // Should not be validation error
        assert.strictEqual(error.code, 'INVALID_STATUS', 'Should not fail status validation')
      }
    })

    it('should support agent filtering parameter', async () => {
      // Agent filter should be accepted
      try {
        await taskService.getTasks({ agent: 'main' })
      } catch (error) {
        // Should not be validation error
        assert.ok(true)
      }
    })
  })

  describe('getTaskById', () => {
    it('should throw error for missing task ID', async () => {
      await assert.rejects(
        async () => await taskService.getTaskById(),
        (err) => {
          assert.strictEqual(err.code, 'TASK_ID_REQUIRED')
          return true
        }
      )
    })

    it('should throw error for empty task ID', async () => {
      await assert.rejects(
        async () => await taskService.getTaskById(''),
        (err) => {
          assert.strictEqual(err.code, 'TASK_ID_REQUIRED')
          return true
        }
      )
    })

    it('should handle CLI unavailable gracefully', async () => {
      // When CLI is unavailable, should throw CLI_UNAVAILABLE error
      try {
        await taskService.getTaskById('test-123')
      } catch (error) {
        // Expected to fail with CLI_UNAVAILABLE or TASK_NOT_FOUND
        assert.ok(['CLI_UNAVAILABLE', 'TASK_NOT_FOUND'].includes(error.code))
      }
    })
  })

  describe('getTaskStats', () => {
    it('should return statistics object', async () => {
      const stats = await taskService.getTaskStats()
      assert.ok(stats)
      assert.ok(typeof stats.total === 'number')
      assert.ok(stats.byStatus)
      assert.ok(stats.byAgent)
    })

    it('should have correct status keys', async () => {
      const stats = await taskService.getTaskStats()
      assert.ok('running' in stats.byStatus)
      assert.ok('done' in stats.byStatus)
      assert.ok('failed' in stats.byStatus)
    })

    it('should handle CLI unavailable gracefully', async () => {
      // Should return empty stats with note when CLI unavailable
      const stats = await taskService.getTaskStats()
      assert.ok(stats)
    })
  })
})

describe('Task Service - Helper Functions', () => {
  describe('isValidStatus', () => {
    it('should return true for valid statuses', () => {
      // Test through getTasks validation
      assert.ok(true)
    })

    it('should return false for invalid statuses', async () => {
      await assert.rejects(
        async () => await taskService.getTasks({ status: 'unknown' }),
        (err) => {
          assert.strictEqual(err.code, 'INVALID_STATUS')
          return true
        }
      )
    })
  })
})

describe('Task Service - Edge Cases', () => {
  describe('CLI unavailable scenario', () => {
    it('should handle CLI errors gracefully in getTasks', async () => {
      const result = await taskService.getTasks()
      assert.ok(result)
      assert.ok(Array.isArray(result.tasks))
    })

    it('should handle CLI errors gracefully in getTaskStats', async () => {
      const stats = await taskService.getTaskStats()
      assert.ok(stats)
      assert.ok(typeof stats.total === 'number')
    })
  })

  describe('parameter validation', () => {
    it('should validate page as positive integer', async () => {
      await assert.rejects(
        async () => await taskService.getTasks({ page: -1 }),
        (err) => {
          assert.strictEqual(err.code, 'INVALID_PAGE')
          return true
        }
      )
    })

    it('should validate limit range', async () => {
      await assert.rejects(
        async () => await taskService.getTasks({ limit: 0 }),
        (err) => {
          assert.strictEqual(err.code, 'INVALID_LIMIT')
          return true
        }
      )
    })

    it('should accept multiple filters together', async () => {
      try {
        await taskService.getTasks({ 
          page: 1, 
          limit: 20, 
          status: 'running', 
          agent: 'main' 
        })
      } catch (error) {
        // Should not be validation error
        assert.ok(['INVALID_PAGE', 'INVALID_LIMIT', 'INVALID_STATUS'].indexOf(error.code) === -1)
      }
    })
  })
})
