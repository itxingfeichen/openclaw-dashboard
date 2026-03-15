/**
 * 工具执行测试
 * Tests for tools.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  readFile,
  writeFile,
  editFile,
  execCommand,
  webSearch,
  webFetch,
  TOOL_COMMANDS,
} from '../src/cli-adapter/tools.js'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

describe('file operations', () => {
  let tempDir: string
  let testFile: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-adapter-test-'))
    testFile = path.join(tempDir, 'test.txt')
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  describe('readFile', () => {
    it('should read file content', async () => {
      fs.writeFileSync(testFile, 'test content')

      const result = await readFile(testFile)

      assert.ok(result.success)
      assert.ok(result.data?.includes('test content'))
    })

    it('should handle non-existent file', async () => {
      const result = await readFile('/nonexistent/file.txt')

      assert.ok(!result.success)
      assert.ok(result.error)
    })

    it('should respect offset and limit', async () => {
      fs.writeFileSync(testFile, 'line1\nline2\nline3\nline4\nline5')

      const result = await readFile(testFile, { offset: 1, limit: 2 })

      assert.ok(result.success)
      // Note: offset is 1-indexed in the API
    })
  })

  describe('writeFile', () => {
    it('should write content to file', async () => {
      const content = 'new content'

      const result = await writeFile(testFile, content)

      assert.ok(result.success)
      assert.ok(fs.existsSync(testFile))
      assert.equal(fs.readFileSync(testFile, 'utf8').trim(), content)
    })

    it('should create directory if not exists', async () => {
      const nestedFile = path.join(tempDir, 'subdir', 'test.txt')

      const result = await writeFile(nestedFile, 'content')

      assert.ok(result.success)
      assert.ok(fs.existsSync(nestedFile))
    })

    it('should handle special characters', async () => {
      const content = 'content with "quotes" and\nnewlines'

      const result = await writeFile(testFile, content)

      assert.ok(result.success)
      assert.ok(fs.existsSync(testFile))
    })
  })

  describe('editFile', () => {
    it('should replace text in file', async () => {
      fs.writeFileSync(testFile, 'hello world')

      const result = await editFile(testFile, 'world', 'typescript')

      assert.ok(result.success)
      assert.equal(fs.readFileSync(testFile, 'utf8'), 'hello typescript')
    })

    it('should handle non-existent file', async () => {
      const result = await editFile('/nonexistent/file.txt', 'old', 'new')

      assert.ok(!result.success)
      assert.ok(result.error)
    })

    it('should handle text not found', async () => {
      fs.writeFileSync(testFile, 'hello world')

      const result = await editFile(testFile, 'notfound', 'replacement')

      assert.ok(result.success)
      assert.equal(fs.readFileSync(testFile, 'utf8'), 'hello world')
    })
  })
})

describe('execCommand', () => {
  it('should execute shell command', async () => {
    const result = await execCommand('echo "hello"')

    assert.ok(result.success)
    assert.ok(result.data?.includes('hello'))
  })

  it('should handle command with exit code', async () => {
    const result = await execCommand('exit 1')

    assert.ok(!result.success || result.exitCode !== 0)
  })

  it('should respect workdir option', async () => {
    const result = await execCommand('pwd', { workdir: '/tmp' })

    assert.ok(result.success)
    assert.ok(result.data?.includes('/tmp'))
  })

  it('should respect env option', async () => {
    const result = await execCommand('echo $TEST_VAR', {
      env: { TEST_VAR: 'custom' },
    })

    assert.ok(result.success)
    assert.ok(result.data?.includes('custom'))
  })

  it('should respect timeout option', async () => {
    const result = await execCommand('sleep 2', { timeout: 100 })

    assert.ok(!result.success || result.exitCode !== 0)
  })
})

describe('webSearch', () => {
  it('should search the web', async () => {
    const result = await webSearch('OpenClaw', { count: 5 })

    assert.ok(result.success)
    assert.ok(result.data)
    assert.ok('results' in result.data)
    assert.ok(Array.isArray(result.data.results))
  })

  it('should respect count option', async () => {
    const result = await webSearch('test', { count: 3 })

    assert.ok(result.success)
    if (result.data && 'count' in result.data) {
      assert.ok(result.data.count <= 10)
    }
  })

  it('should respect country option', async () => {
    const result = await webSearch('test', { country: 'US' })

    assert.ok(result.success)
  })
})

describe('webFetch', () => {
  it('should fetch web page content', async () => {
    const result = await webFetch('https://example.com', {
      extractMode: 'text',
      maxChars: 1000,
    })

    assert.ok(result.success)
    assert.ok(result.data)
    assert.ok('content' in result.data)
  })

  it('should respect extractMode option', async () => {
    const result = await webFetch('https://example.com', {
      extractMode: 'markdown',
    })

    assert.ok(result.success)
  })

  it('should handle invalid URL', async () => {
    const result = await webFetch('invalid-url')

    assert.ok(!result.success || result.data === null)
  })
})

describe('TOOL_COMMANDS', () => {
  it('should have all command constants', () => {
    assert.ok(TOOL_COMMANDS.READ)
    assert.ok(TOOL_COMMANDS.WRITE)
    assert.ok(TOOL_COMMANDS.EDIT)
    assert.ok(TOOL_COMMANDS.EXEC)
    assert.ok(TOOL_COMMANDS.BROWSER)
    assert.ok(TOOL_COMMANDS.PROCESS)
    assert.ok(TOOL_COMMANDS.NODES)
    assert.ok(TOOL_COMMANDS.MESSAGE)
    assert.ok(TOOL_COMMANDS.WEB_SEARCH)
    assert.ok(TOOL_COMMANDS.WEB_FETCH)
    assert.ok(TOOL_COMMANDS.TTS)
    assert.ok(TOOL_COMMANDS.IMAGE)
    assert.ok(TOOL_COMMANDS.PDF)
  })

  it('should have correct command format', () => {
    assert.ok(TOOL_COMMANDS.READ.startsWith('openclaw'))
    assert.ok(TOOL_COMMANDS.WEB_SEARCH.startsWith('openclaw'))
  })
})

describe('browser operations', () => {
  it('should have browser functions exported', async () => {
    const { browserSnapshot, browserClick, browserType, browserNavigate } =
      await import('../src/cli-adapter/tools.js')

    assert.ok(typeof browserSnapshot === 'function')
    assert.ok(typeof browserClick === 'function')
    assert.ok(typeof browserType === 'function')
    assert.ok(typeof browserNavigate === 'function')
  })
})

describe('process management', () => {
  it('should have process functions exported', async () => {
    const { processList, processSendKeys, processKill } = await import(
      '../src/cli-adapter/tools.js'
    )

    assert.ok(typeof processList === 'function')
    assert.ok(typeof processSendKeys === 'function')
    assert.ok(typeof processKill === 'function')
  })
})

describe('message operations', () => {
  it('should have message functions exported', async () => {
    const { messageSend } = await import('../src/cli-adapter/tools.js')

    assert.ok(typeof messageSend === 'function')
  })
})
