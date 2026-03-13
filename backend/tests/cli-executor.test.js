/**
 * CLI 执行器测试
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { executeCli, executeCliBatch } from '../src/cli-adapter/executor.js'

describe('CLI Executor', () => {
  describe('executeCli', () => {
    it('should execute simple command successfully', async () => {
      const result = await executeCli('echo "test"')
      assert.strictEqual(result.success, true)
      assert.ok(result.data.includes('test'))
      assert.strictEqual(result.error, null)
    })

    it('should parse JSON output', async () => {
      const result = await executeCli('echo \'{"key": "value"}\'')
      assert.strictEqual(result.success, true)
      assert.strictEqual(typeof result.data, 'object')
      assert.strictEqual(result.data.key, 'value')
    })

    it('should handle command failure', async () => {
      const result = await executeCli('exit 1', { retries: 0 })
      assert.strictEqual(result.success, false)
      assert.strictEqual(result.data, null)
      assert.ok(result.error)
    })

    it('should respect timeout', async () => {
      const startTime = Date.now()
      const result = await executeCli('sleep 5', { timeout: 1000, retries: 0 })
      const duration = Date.now() - startTime
      
      assert.strictEqual(result.success, false)
      assert.ok(duration < 3000) // Should timeout around 1 second
    })

    it('should retry on failure', async () => {
      const result = await executeCli('echo "test"', { retries: 2 })
      assert.strictEqual(result.success, true)
    })

    it('should handle non-JSON output when parseJson is true', async () => {
      const result = await executeCli('echo "plain text"', { parseJson: true })
      assert.strictEqual(result.success, true)
      assert.ok(typeof result.data === 'string')
    })

    it('should skip JSON parsing when parseJson is false', async () => {
      const result = await executeCli('echo \'{"key": "value"}\'', { parseJson: false })
      assert.strictEqual(result.success, true)
      assert.strictEqual(typeof result.data, 'string')
      assert.ok(result.data.includes('{'))
    })
  })

  describe('executeCliBatch', () => {
    it('should execute multiple commands', async () => {
      const commands = ['echo "one"', 'echo "two"', 'echo "three"']
      const results = await executeCliBatch(commands)
      
      assert.strictEqual(results.length, 3)
      assert.strictEqual(results[0].success, true)
      assert.strictEqual(results[1].success, true)
      assert.strictEqual(results[2].success, true)
    })

    it('should continue on individual command failure', async () => {
      const commands = ['echo "success"', 'exit 1', 'echo "also success"']
      const results = await executeCliBatch(commands, { retries: 0 })
      
      assert.strictEqual(results.length, 3)
      assert.strictEqual(results[0].success, true)
      assert.strictEqual(results[1].success, false)
      assert.strictEqual(results[2].success, true)
    })
  })
})
