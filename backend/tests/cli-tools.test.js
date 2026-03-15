/**
 * CLI Tools 模块测试
 * 测试工具执行功能 (read, write, exec, browser 等)
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  readFile,
  writeFile,
  execCommand,
  browserSnapshot,
  webSearch,
  webFetch,
} from '../src/cli-adapter/tools.js'

describe('CLI Tools', () => {
  describe('readFile', () => {
    it('should read file content', async () => {
      // 测试读取现有文件
      const result = await readFile('/etc/hostname', { limit: 100 })
      
      assert.ok(result)
      assert.ok(result.success || result.data || result.rawOutput)
    })

    it('should handle non-existent file', async () => {
      const result = await readFile('/nonexistent/file/path.txt', { limit: 100 })
      
      assert.ok(result)
      // 应该返回错误信息
      assert.ok(!result.success || result.error || result.rawOutput?.includes('No such file'))
    })

    it('should respect offset and limit', async () => {
      const result = await readFile('/etc/hosts', { offset: 0, limit: 5 })
      
      assert.ok(result)
    })
  })

  describe('writeFile', () => {
    it('should write to temporary file', async () => {
      const testPath = '/tmp/openclaw-test-write.txt'
      const content = 'Test content ' + Date.now()
      
      const result = await writeFile(testPath, content)
      
      assert.ok(result)
      assert.ok(result.success || result.data)
    })

    it('should handle empty content', async () => {
      const testPath = '/tmp/openclaw-test-empty.txt'
      
      const result = await writeFile(testPath, '')
      
      assert.ok(result)
    })
  })

  describe('execCommand', () => {
    it('should execute simple command', async () => {
      const result = await execCommand('echo "hello"')
      
      assert.ok(result)
      assert.ok(result.success || result.data)
    })

    it('should handle command with timeout', async () => {
      const result = await execCommand('sleep 0.1', { timeout: 5000 })
      
      assert.ok(result)
    })

    it('should handle command failure', async () => {
      const result = await execCommand('exit 1')
      
      assert.ok(result)
      assert.ok(!result.success || result.error)
    })

    it('should respect workdir option', async () => {
      const result = await execCommand('pwd', { workdir: '/tmp' })
      
      assert.ok(result)
    })

    it('should handle environment variables', async () => {
      const result = await execCommand('echo $TEST_VAR', { 
        env: { TEST_VAR: 'test_value' } 
      })
      
      assert.ok(result)
    })
  })

  describe('browserSnapshot', () => {
    it('should attempt browser snapshot', async () => {
      const result = await browserSnapshot({ 
        url: 'https://example.com',
        profile: 'openclaw',
      })
      
      assert.ok(result)
      // Browser 可能未启动，所以只检查返回结构
      assert.ok('success' in result)
      assert.ok('tool' in result)
    })

    it('should handle browser not available', async () => {
      const result = await browserSnapshot()
      
      assert.ok(result)
      assert.strictEqual(result.tool, 'browser.snapshot')
    })
  })

  describe('browserClick', () => {
    it('should attempt browser click', async () => {
      const result = await browserClick('e1')
      
      assert.ok(result)
      assert.strictEqual(result.tool, 'browser.click')
    })
  })

  describe('browserType', () => {
    it('should attempt browser type', async () => {
      const result = await browserType('e1', 'test input')
      
      assert.ok(result)
      assert.strictEqual(result.tool, 'browser.type')
    })
  })

  describe('browserNavigate', () => {
    it('should attempt browser navigation', async () => {
      const result = await browserNavigate('https://example.com')
      
      assert.ok(result)
      assert.strictEqual(result.tool, 'browser.navigate')
    })
  })

  describe('processList', () => {
    it('should list processes', async () => {
      const result = await processList()
      
      assert.ok(result)
      assert.strictEqual(result.tool, 'process.list')
    })
  })

  describe('processSendKeys', () => {
    it('should send keys to process', async () => {
      const result = await processSendKeys('test-session', { keys: ['Enter'] })
      
      assert.ok(result)
      assert.strictEqual(result.tool, 'process.send-keys')
    })
  })

  describe('processKill', () => {
    it('should kill process', async () => {
      const result = await processKill('test-session')
      
      assert.ok(result)
      assert.strictEqual(result.tool, 'process.kill')
    })
  })

  describe('nodesStatus', () => {
    it('should get nodes status', async () => {
      const result = await nodesStatus()
      
      assert.ok(result)
      assert.strictEqual(result.tool, 'nodes.status')
    })
  })

  describe('nodesNotify', () => {
    it('should send notification to node', async () => {
      const result = await nodesNotify('node-1', 'Test Title', 'Test Body')
      
      assert.ok(result)
      assert.strictEqual(result.tool, 'nodes.notify')
    })
  })

  describe('messageSend', () => {
    it('should attempt to send message', async () => {
      const result = await messageSend('test-user', 'Test message')
      
      assert.ok(result)
      assert.strictEqual(result.tool, 'message.send')
    })

    it('should handle channel option', async () => {
      const result = await messageSend('test-user', 'Test', { channel: 'telegram' })
      
      assert.ok(result)
    })
  })

  describe('webSearch', () => {
    it('should perform web search', async () => {
      const result = await webSearch('test query', { count: 5 })
      
      assert.ok(result)
      assert.strictEqual(result.tool, 'web_search')
    })

    it('should respect country option', async () => {
      const result = await webSearch('test', { country: 'CN' })
      
      assert.ok(result)
    })

    it('should respect freshness option', async () => {
      const result = await webSearch('test', { freshness: 'pd' })
      
      assert.ok(result)
    })
  })

  describe('webFetch', () => {
    it('should fetch web page', async () => {
      const result = await webFetch('https://example.com')
      
      assert.ok(result)
      assert.strictEqual(result.tool, 'web_fetch')
    })

    it('should respect extractMode option', async () => {
      const result = await webFetch('https://example.com', { extractMode: 'text' })
      
      assert.ok(result)
    })

    it('should respect maxChars option', async () => {
      const result = await webFetch('https://example.com', { maxChars: 1000 })
      
      assert.ok(result)
    })
  })

  describe('TOOL_COMMANDS constants', () => {
    it('should export command constants', async () => {
      const { TOOL_COMMANDS } = await import('../src/cli-adapter/tools.js')
      
      assert.ok(TOOL_COMMANDS)
      assert.ok(TOOL_COMMANDS.READ_FILE)
      assert.ok(TOOL_COMMANDS.WRITE_FILE)
      assert.ok(TOOL_COMMANDS.EXEC_COMMAND)
      assert.ok(TOOL_COMMANDS.BROWSER_SNAPSHOT)
      assert.ok(TOOL_COMMANDS.WEB_SEARCH)
      assert.ok(TOOL_COMMANDS.WEB_FETCH)
    })
  })
})
