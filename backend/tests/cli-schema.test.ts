/**
 * Schema 校验测试
 * Tests for schema.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  validateCliOutput,
  formatValidationError,
  getSchemas,
  registerSchema,
} from '../src/cli-adapter/schema.js'

describe('validateCliOutput', () => {
  describe('openclaw status', () => {
    it('should validate correct status response', () => {
      const data = {
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      }

      const result = validateCliOutput('openclaw status', data)

      assert.ok(result.valid)
      assert.equal(result.errors.length, 0)
    })

    it('should fail when missing required field', () => {
      const data = {
        version: '1.0.0',
        // missing 'status'
      }

      const result = validateCliOutput('openclaw status', data)

      assert.ok(!result.valid)
      assert.ok(result.errors.some((e) => e.includes('status')))
    })
  })

  describe('openclaw agents list', () => {
    it('should validate correct agents list response', () => {
      const data = {
        agents: [
          {
            id: 'main',
            name: 'main',
            status: 'active',
          },
        ],
        count: 1,
        timestamp: new Date().toISOString(),
      }

      const result = validateCliOutput('openclaw agents list', data)

      assert.ok(result.valid)
      assert.equal(result.errors.length, 0)
    })

    it('should fail when agents array item missing required field', () => {
      const data = {
        agents: [
          {
            id: 'main',
            // missing 'name' and 'status'
          },
        ],
        count: 1,
      }

      const result = validateCliOutput('openclaw agents list', data)

      assert.ok(!result.valid)
      assert.ok(result.errors.some((e) => e.includes('name')))
      assert.ok(result.errors.some((e) => e.includes('status')))
    })

    it('should fail when agents is not an array', () => {
      const data = {
        agents: { id: 'main', name: 'main', status: 'active' },
        count: 1,
      }

      const result = validateCliOutput('openclaw agents list', data)

      assert.ok(!result.valid)
      assert.ok(result.errors.some((e) => e.includes('array')))
    })
  })

  describe('openclaw sessions --json', () => {
    it('should validate correct sessions list response', () => {
      const data = {
        sessions: [
          {
            key: 'session-123',
            updatedAt: new Date().toISOString(),
            agentId: 'main',
          },
        ],
        count: 1,
        timestamp: new Date().toISOString(),
      }

      const result = validateCliOutput('openclaw sessions --json', data)

      assert.ok(result.valid)
      assert.equal(result.errors.length, 0)
    })

    it('should fail when session missing required key field', () => {
      const data = {
        sessions: [
          {
            // missing 'key'
            updatedAt: new Date().toISOString(),
          },
        ],
        count: 1,
      }

      const result = validateCliOutput('openclaw sessions --json', data)

      assert.ok(!result.valid)
      assert.ok(result.errors.some((e) => e.includes('key')))
    })
  })

  describe('openclaw cron list', () => {
    it('should validate correct cron list response', () => {
      const data = {
        tasks: [
          {
            id: 'task-123',
            schedule: '0 * * * *',
            enabled: true,
            name: 'Test Task',
          },
        ],
        count: 1,
        timestamp: new Date().toISOString(),
      }

      const result = validateCliOutput('openclaw cron list', data)

      assert.ok(result.valid)
      assert.equal(result.errors.length, 0)
    })

    it('should fail when task missing required fields', () => {
      const data = {
        tasks: [
          {
            id: 'task-123',
            // missing 'schedule' and 'enabled'
          },
        ],
        count: 1,
      }

      const result = validateCliOutput('openclaw cron list', data)

      assert.ok(!result.valid)
      assert.ok(result.errors.some((e) => e.includes('schedule')))
      assert.ok(result.errors.some((e) => e.includes('enabled')))
    })
  })

  describe('unknown command', () => {
    it('should pass validation for unknown commands', () => {
      const data = { any: 'data' }

      const result = validateCliOutput('openclaw unknown-command', data)

      assert.ok(result.valid)
      assert.equal(result.errors.length, 0)
    })
  })

  describe('edge cases', () => {
    it('should fail when data is null', () => {
      const result = validateCliOutput('openclaw status', null as any)

      assert.ok(!result.valid)
      assert.ok(result.errors.some((e) => e.includes('object')))
    })

    it('should fail when data is not an object', () => {
      const result = validateCliOutput('openclaw status', 'string' as any)

      assert.ok(!result.valid)
      assert.ok(result.errors.some((e) => e.includes('object')))
    })

    it('should pass with empty object when no required fields', () => {
      const data = {}

      const result = validateCliOutput('openclaw config get', data)

      assert.ok(result.valid)
    })
  })
})

describe('formatValidationError', () => {
  it('should format validation errors nicely', () => {
    const result = {
      valid: false,
      errors: ['Missing required field: status', 'Field must be an array'],
    }

    const formatted = formatValidationError(result, 'openclaw status')

    assert.ok(formatted.includes('CLI 输出格式验证失败'))
    assert.ok(formatted.includes('openclaw status'))
    assert.ok(formatted.includes('Missing required field: status'))
  })

  it('should return success message for valid result', () => {
    const result = {
      valid: true,
      errors: [],
    }

    const formatted = formatValidationError(result, 'openclaw status')

    assert.equal(formatted, '验证通过')
  })
})

describe('getSchemas', () => {
  it('should return all registered schemas', () => {
    const schemas = getSchemas()

    assert.ok(typeof schemas === 'object')
    assert.ok('openclaw status' in schemas)
    assert.ok('openclaw agents list' in schemas)
    assert.ok('openclaw sessions --json' in schemas)
    assert.ok('openclaw cron list' in schemas)
  })

  it('should return schemas with required and optional fields', () => {
    const schemas = getSchemas()
    const statusSchema = schemas['openclaw status']

    assert.ok(statusSchema)
    assert.ok(Array.isArray(statusSchema.required))
    assert.ok(Array.isArray(statusSchema.optional))
  })
})

describe('registerSchema', () => {
  it('should register new schema', () => {
    const newSchema = {
      required: ['id', 'name'],
      optional: ['description'],
    }

    registerSchema('openclaw test-command', newSchema)

    const schemas = getSchemas()
    assert.ok('openclaw test-command' in schemas)
    assert.deepStrictEqual(schemas['openclaw test-command'], newSchema)
  })

  it('should overwrite existing schema', () => {
    const newSchema = {
      required: ['new_field'],
      optional: [],
    }

    registerSchema('openclaw config get', newSchema)

    const schemas = getSchemas()
    assert.deepStrictEqual(schemas['openclaw config get'], newSchema)
  })
})
