/**
 * CLI Schema 校验测试
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  validateCliOutput,
  formatValidationError,
} from '../src/cli-adapter/schema.js'

describe('CLI Schema Validator', () => {
  describe('validateCliOutput', () => {
    it('should validate agents list schema', () => {
      const validData = {
        agents: [
          { id: '1', name: 'Agent 1', status: 'active' },
          { id: '2', name: 'Agent 2', status: 'idle' },
        ],
        count: 2,
      }

      const result = validateCliOutput('openclaw agents list', validData)
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.errors.length, 0)
    })

    it('should reject invalid agents list', () => {
      const invalidData = {
        agents: 'not an array',
      }

      const result = validateCliOutput('openclaw agents list', invalidData)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.length > 0)
    })

    it('should validate sessions list schema', () => {
      const validData = {
        sessions: [
          { id: 'sess1', status: 'active' },
          { id: 'sess2', status: 'completed' },
        ],
      }

      const result = validateCliOutput('openclaw sessions list', validData)
      assert.strictEqual(result.valid, true)
    })

    it('should reject sessions list with invalid items', () => {
      const invalidData = {
        sessions: [
          { sessionId: 'sess1' }, // missing required 'key'
        ],
      }

      const result = validateCliOutput('openclaw sessions --json', invalidData)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('key')))
    })

    it('should validate cron list schema', () => {
      const validData = {
        tasks: [
          { id: 'task1', schedule: '0 * * * *', enabled: true },
          { id: 'task2', schedule: '*/5 * * * *', enabled: false },
        ],
      }

      const result = validateCliOutput('openclaw cron list', validData)
      assert.strictEqual(result.valid, true)
    })

    it('should validate status schema', () => {
      const validData = {
        status: 'healthy',
        version: '1.0.0',
        uptime: 12345,
      }

      const result = validateCliOutput('openclaw status', validData)
      assert.strictEqual(result.valid, true)
    })

    it('should reject status without required field', () => {
      const invalidData = {
        version: '1.0.0',
      }

      const result = validateCliOutput('openclaw status', invalidData)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('status')))
    })

    it('should pass through unknown commands', () => {
      const data = { anything: 'goes' }
      const result = validateCliOutput('unknown command', data)
      assert.strictEqual(result.valid, true)
    })

    it('should reject null data for known commands', () => {
      const result = validateCliOutput('openclaw status', null)
      assert.strictEqual(result.valid, false)
    })

    it('should reject non-object data for known commands', () => {
      const result = validateCliOutput('openclaw status', 'string data')
      assert.strictEqual(result.valid, false)
    })
  })

  describe('formatValidationError', () => {
    it('should format validation errors', () => {
      const result = {
        valid: false,
        errors: ['Missing field: id', 'Invalid type: name'],
      }

      const message = formatValidationError(result, 'test command')
      assert.ok(message.includes('验证失败'))
      assert.ok(message.includes('test command'))
      assert.ok(message.includes('Missing field: id'))
    })

    it('should return success message for valid result', () => {
      const result = { valid: true, errors: [] }
      const message = formatValidationError(result, 'test command')
      assert.strictEqual(message, '验证通过')
    })
  })
})
