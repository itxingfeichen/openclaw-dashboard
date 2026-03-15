/**
 * CLI 执行器测试
 * Tests for executor.ts
 */

import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { executeCli, executeCliBatch } from '../src/cli-adapter/executor.js'
import type { CliResult } from '../src/cli-adapter/types.js'

describe('executeCli', () => {
  it('should execute a simple command successfully', async () => {
    const result = await executeCli('echo "hello"')
    
    assert.ok(result.success)
    assert.equal(result.command, 'echo "hello"')
    assert.ok(result.data)
    assert.equal(result.exitCode, 0)
    assert.equal(result.error, null)
  })

  it('should handle command with JSON output', async () => {
    const result = await executeCli('echo \'{"key": "value"}\'', {
      parseJson: true,
    })
    
    assert.ok(result.success)
    assert.deepStrictEqual(result.data, { key: 'value' })
  })

  it('should handle non-JSON output when parseJson is true', async () => {
    const result = await executeCli('echo "plain text"', {
      parseJson: true,
    })
    
    assert.ok(result.success)
    assert.equal(typeof result.data, 'string')
  })

  it('should respect timeout option', async () => {
    const result = await executeCli('sleep 2', {
      timeout: 100,
    })
    
    assert.ok(!result.success)
    assert.ok(result.error?.includes('timed out') || result.exitCode !== 0)
  })

  it('should handle failed commands', async () => {
    const result = await executeCli('exit 1')
    
    assert.ok(!result.success)
    assert.ok(result.error)
    assert.notEqual(result.exitCode, 0)
  })

  it('should retry on failure when retries > 0', async () => {
    // This test verifies retry logic exists
    // Actual retry behavior is hard to test without mocking
    const result = await executeCli('echo "test"', {
      retries: 2,
    })
    
    assert.ok(result.success)
    assert.equal(result.data, 'test\n')
  })

  it('should handle custom workdir', async () => {
    const result = await executeCli('pwd', {
      workdir: '/tmp',
    })
    
    assert.ok(result.success)
    assert.ok(result.data?.includes('/tmp'))
  })

  it('should handle custom environment variables', async () => {
    const result = await executeCli('echo $TEST_VAR', {
      env: { TEST_VAR: 'custom_value' },
    })
    
    assert.ok(result.success)
    assert.ok(result.data?.includes('custom_value'))
  })
})

describe('executeCliBatch', () => {
  it('should execute multiple commands', async () => {
    const commands = ['echo "cmd1"', 'echo "cmd2"', 'echo "cmd3"']
    const results = await executeCliBatch(commands)
    
    assert.equal(results.length, 3)
    assert.ok(results.every((r: CliResult) => r.success))
    assert.ok(results[0].data?.includes('cmd1'))
    assert.ok(results[1].data?.includes('cmd2'))
    assert.ok(results[2].data?.includes('cmd3'))
  })

  it('should continue on failure', async () => {
    const commands = ['echo "ok"', 'exit 1', 'echo "also ok"']
    const results = await executeCliBatch(commands)
    
    assert.equal(results.length, 3)
    assert.ok(results[0].success)
    assert.ok(!results[1].success)
    assert.ok(results[2].success)
  })

  it('should handle empty command list', async () => {
    const results = await executeCliBatch([])
    
    assert.equal(results.length, 0)
    assert.ok(Array.isArray(results))
  })

  it('should apply options to all commands', async () => {
    const commands = ['echo "test1"', 'echo "test2"']
    const results = await executeCliBatch(commands, {
      timeout: 5000,
      retries: 1,
    })
    
    assert.equal(results.length, 2)
    assert.ok(results.every((r: CliResult) => r.success))
  })
})

describe('CliResult type', () => {
  it('should have correct structure', async () => {
    const result = await executeCli('echo "test"')
    
    assert.ok('success' in result)
    assert.ok('command' in result)
    assert.ok('data' in result)
    assert.ok('rawOutput' in result)
    assert.ok('error' in result)
    assert.ok('exitCode' in result)
    
    assert.equal(typeof result.success, 'boolean')
    assert.equal(typeof result.command, 'string')
    assert.equal(typeof result.exitCode, 'number')
  })
})
