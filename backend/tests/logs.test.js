/**
 * Logs API 测试
 * 测试日志服务的核心功能和 API 路由
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import fs from 'fs'
import path from 'path'
import express from 'express'
import logRoutes from '../src/routes/logs.js'
import {
  parseLogLine,
  filterByLevel,
  filterByTime,
  searchLog,
  readLogs,
  searchLogs,
  getLogSources,
  getLogStats,
  LogLevel,
  registerLogSource,
  clearDynamicLogSources,
} from '../src/services/logService.js'

// 测试用日志文件路径
const TEST_LOG_DIR = '/home/admin/openclaw-dashboard/backend/logs/test'
const TEST_LOG_FILE = path.join(TEST_LOG_DIR, 'test.log')

/**
 * 创建测试日志文件
 */
function createTestLogFile() {
  if (!fs.existsSync(TEST_LOG_DIR)) {
    fs.mkdirSync(TEST_LOG_DIR, { recursive: true })
  }

  const testLogs = [
    '[2026-03-14T00:00:00.000Z] [INFO] Application started',
    '[2026-03-14T00:01:00.000Z] [DEBUG] Loading configuration',
    '[2026-03-14T00:02:00.000Z] [INFO] Server started {"port":8080}',
    '[2026-03-14T00:03:00.000Z] [WARN] High memory usage {"usage":85}',
    '[2026-03-14T00:04:00.000Z] [ERROR] Database connection failed {"retry":3}',
    '[2026-03-14T00:05:00.000Z] [INFO] Database reconnected',
    '[2026-03-14T00:06:00.000Z] [DEBUG] Processing request {"id":123}',
    '[2026-03-14T00:07:00.000Z] [INFO] Request completed {"duration":150}',
    '[2026-03-14T00:08:00.000Z] [WARN] Slow query detected {"duration":2000}',
    '[2026-03-14T00:09:00.000Z] [ERROR] Authentication failed {"user":"test"}',
  ]

  fs.writeFileSync(TEST_LOG_FILE, testLogs.join('\n'))
}

/**
 * 删除测试日志文件
 */
function removeTestLogFile() {
  if (fs.existsSync(TEST_LOG_FILE)) {
    fs.unlinkSync(TEST_LOG_FILE)
  }
  if (fs.existsSync(TEST_LOG_DIR)) {
    fs.rmdirSync(TEST_LOG_DIR)
  }
}

describe('Log Service', () => {
  before(() => {
    // 注册测试日志源
    registerLogSource('test', {
      name: 'Test Log',
      path: TEST_LOG_FILE,
      description: 'Test log file',
    })
  })

  after(() => {
    // 清理动态日志源
    clearDynamicLogSources()
  })

  describe('parseLogLine', () => {
    it('should parse standard log line', () => {
      const line = '[2026-03-14T00:00:00.000Z] [INFO] Application started'
      const result = parseLogLine(line)

      assert.strictEqual(result.timestamp, '2026-03-14T00:00:00.000Z')
      assert.strictEqual(result.level, 'INFO')
      assert.strictEqual(result.message, 'Application started')
      assert.strictEqual(result.context, null)
    })

    it('should parse log line with JSON context', () => {
      const line = '[2026-03-14T00:00:00.000Z] [INFO] Server started {"port":8080}'
      const result = parseLogLine(line)

      assert.strictEqual(result.timestamp, '2026-03-14T00:00:00.000Z')
      assert.strictEqual(result.level, 'INFO')
      assert.strictEqual(result.message, 'Server started')
      assert.deepStrictEqual(result.context, { port: 8080 })
    })

    it('should handle unparseable lines', () => {
      const line = 'This is not a standard log line'
      const result = parseLogLine(line)

      assert.strictEqual(result.timestamp, null)
      assert.strictEqual(result.level, 'UNKNOWN')
      assert.strictEqual(result.message, 'This is not a standard log line')
    })

    it('should handle empty lines', () => {
      assert.strictEqual(parseLogLine(''), null)
      assert.strictEqual(parseLogLine('   '), null)
    })
  })

  describe('filterByLevel', () => {
    it('should pass all levels when no filter', () => {
      assert.strictEqual(filterByLevel('INFO', undefined), true)
      assert.strictEqual(filterByLevel('ERROR', undefined), true)
    })

    it('should filter by level', () => {
      assert.strictEqual(filterByLevel('ERROR', 'ERROR'), true)
      assert.strictEqual(filterByLevel('WARN', 'ERROR'), false)
      assert.strictEqual(filterByLevel('INFO', 'WARN'), false)
      assert.strictEqual(filterByLevel('ERROR', 'WARN'), true)
      assert.strictEqual(filterByLevel('DEBUG', 'INFO'), false)
    })

    it('should handle unknown levels', () => {
      assert.strictEqual(filterByLevel('UNKNOWN', 'INFO'), true)
      assert.strictEqual(filterByLevel('INFO', 'UNKNOWN'), true)
    })
  })

  describe('filterByTime', () => {
    it('should pass all logs when no time filter', () => {
      const timestamp = '2026-03-14T00:00:00.000Z'
      assert.strictEqual(filterByTime(timestamp, undefined, undefined), true)
    })

    it('should filter by from time', () => {
      const timestamp = '2026-03-14T00:05:00.000Z'
      assert.strictEqual(filterByTime(timestamp, '2026-03-14T00:00:00.000Z', undefined), true)
      assert.strictEqual(filterByTime(timestamp, '2026-03-14T00:10:00.000Z', undefined), false)
    })

    it('should filter by to time', () => {
      const timestamp = '2026-03-14T00:05:00.000Z'
      assert.strictEqual(filterByTime(timestamp, undefined, '2026-03-14T00:10:00.000Z'), true)
      assert.strictEqual(filterByTime(timestamp, undefined, '2026-03-14T00:00:00.000Z'), false)
    })

    it('should filter by time range', () => {
      const timestamp = '2026-03-14T00:05:00.000Z'
      assert.strictEqual(
        filterByTime(timestamp, '2026-03-14T00:00:00.000Z', '2026-03-14T00:10:00.000Z'),
        true
      )
      assert.strictEqual(
        filterByTime(timestamp, '2026-03-14T00:06:00.000Z', '2026-03-14T00:10:00.000Z'),
        false
      )
    })

    it('should handle null timestamps', () => {
      assert.strictEqual(filterByTime(null, '2026-03-14T00:00:00.000Z', undefined), true)
    })
  })

  describe('searchLog', () => {
    it('should match substring', () => {
      assert.strictEqual(searchLog('Application started', 'start'), true)
      assert.strictEqual(searchLog('Application started', 'APPLICATION'), true)
    })

    it('should return true for empty query', () => {
      assert.strictEqual(searchLog('Any message', ''), true)
    })

    it('should not match unrelated text', () => {
      assert.strictEqual(searchLog('Application started', 'database'), false)
    })
  })

  describe('readLogs', () => {
    before(createTestLogFile)
    after(removeTestLogFile)

    it('should read logs with pagination', async () => {
      const result = await readLogs('test', { page: 1, limit: 5 })
      
      assert.strictEqual(result.source, 'test')
      assert.strictEqual(result.logs.length, 5)
      assert.strictEqual(result.pagination.page, 1)
      assert.strictEqual(result.pagination.limit, 5)
      assert.strictEqual(result.pagination.total, 10)
      assert.strictEqual(result.pagination.totalPages, 2)
      assert.strictEqual(result.pagination.hasNext, true)
      assert.strictEqual(result.pagination.hasPrev, false)
    })

    it('should filter by level', async () => {
      const result = await readLogs('test', { level: 'ERROR' })
      
      assert.ok(result.logs.every(log => log.level === 'ERROR'))
      assert.strictEqual(result.logs.length, 2)
    })

    it('should filter by time range', async () => {
      const result = await readLogs('test', {
        from: '2026-03-14T00:02:00.000Z',
        to: '2026-03-14T00:05:00.000Z',
      })
      
      assert.ok(result.logs.length > 0)
      result.logs.forEach(log => {
        if (log.timestamp) {
          const logTime = new Date(log.timestamp).getTime()
          const fromTime = new Date('2026-03-14T00:02:00.000Z').getTime()
          const toTime = new Date('2026-03-14T00:05:00.000Z').getTime()
          assert.ok(logTime >= fromTime && logTime <= toTime)
        }
      })
    })

    it('should handle unknown source', async () => {
      try {
        await readLogs('nonexistent')
        assert.fail('Should throw error')
      } catch (error) {
        assert.strictEqual(error.code, 'LOG_SOURCE_NOT_FOUND')
      }
    })
  })

  describe('searchLogs', () => {
    before(createTestLogFile)
    after(removeTestLogFile)

    it('should search logs by keyword', async () => {
      const result = await searchLogs('test', 'database')
      
      assert.strictEqual(result.query, 'database')
      assert.ok(result.logs.length > 0)
      result.logs.forEach(log => {
        assert.ok(
          log.message.toLowerCase().includes('database') ||
          log.raw.toLowerCase().includes('database')
        )
      })
    })

    it('should handle case-insensitive search', async () => {
      const result1 = await searchLogs('test', 'DATABASE')
      const result2 = await searchLogs('test', 'database')
      
      assert.strictEqual(result1.logs.length, result2.logs.length)
    })

    it('should require search query', async () => {
      try {
        await searchLogs('test', '')
        assert.fail('Should throw error')
      } catch (error) {
        assert.strictEqual(error.code, 'SEARCH_QUERY_REQUIRED')
      }
    })
  })

  describe('getLogStats', () => {
    before(createTestLogFile)
    after(removeTestLogFile)

    it('should return log statistics', async () => {
      const stats = await getLogStats('test')
      
      assert.strictEqual(stats.total, 10)
      assert.ok(stats.byLevel.INFO > 0)
      assert.ok(stats.byLevel.DEBUG > 0)
      assert.ok(stats.byLevel.WARN > 0)
      assert.ok(stats.byLevel.ERROR > 0)
    })
  })
})

describe('Logs API Routes', () => {
  let app
  let testServer

  before(() => {
    // 注册测试日志源
    registerLogSource('test', {
      name: 'Test Log',
      path: TEST_LOG_FILE,
      description: 'Test log file',
    })
    createTestLogFile()
    app = express()
    app.use(express.json())
    app.use('/api/logs', logRoutes)
    testServer = app.listen(3458)
  })

  after(() => {
    removeTestLogFile()
    if (testServer) {
      testServer.close()
    }
    // 清理动态日志源
    clearDynamicLogSources()
  })

  describe('GET /api/logs/sources', () => {
    it('should return list of log sources', async () => {
      const response = await fetch('http://localhost:3458/api/logs/sources')
      const data = await response.json()

      assert.strictEqual(response.status, 200)
      assert.strictEqual(data.success, true)
      assert.ok(data.data.sources)
      assert.ok(data.data.total >= 0)
    })
  })

  describe('GET /api/logs/:source', () => {
    it('should return logs with pagination', async () => {
      const response = await fetch('http://localhost:3458/api/logs/test?page=1&limit=5')
      const data = await response.json()

      assert.strictEqual(response.status, 200)
      assert.strictEqual(data.success, true)
      assert.ok(data.data.logs)
      assert.strictEqual(data.data.pagination.page, 1)
      assert.strictEqual(data.data.pagination.limit, 5)
    })

    it('should filter by level', async () => {
      const response = await fetch('http://localhost:3458/api/logs/test?level=ERROR')
      const data = await response.json()

      assert.strictEqual(response.status, 200)
      data.data.logs.forEach(log => {
        assert.strictEqual(log.level, 'ERROR')
      })
    })

    it('should return 400 for invalid level', async () => {
      const response = await fetch('http://localhost:3458/api/logs/test?level=INVALID')
      const data = await response.json()

      assert.strictEqual(response.status, 400)
      assert.strictEqual(data.success, false)
    })

    it('should return 400 for invalid page', async () => {
      const response = await fetch('http://localhost:3458/api/logs/test?page=-1')
      const data = await response.json()

      assert.strictEqual(response.status, 400)
      assert.strictEqual(data.success, false)
    })

    it('should return 400 for invalid limit', async () => {
      const response = await fetch('http://localhost:3458/api/logs/test?limit=1000')
      const data = await response.json()

      assert.strictEqual(response.status, 400)
      assert.strictEqual(data.success, false)
    })

    it('should return 404 for unknown source', async () => {
      const response = await fetch('http://localhost:3458/api/logs/nonexistent')
      const data = await response.json()

      assert.strictEqual(response.status, 404)
      assert.strictEqual(data.success, false)
    })
  })

  describe('GET /api/logs/:source/search', () => {
    it('should search logs', async () => {
      const response = await fetch('http://localhost:3458/api/logs/test/search?q=database')
      const data = await response.json()

      assert.strictEqual(response.status, 200)
      assert.strictEqual(data.success, true)
      assert.strictEqual(data.data.query, 'database')
      assert.ok(data.data.logs.length > 0)
    })

    it('should return 400 for missing query', async () => {
      const response = await fetch('http://localhost:3458/api/logs/test/search')
      const data = await response.json()

      assert.strictEqual(response.status, 400)
      assert.strictEqual(data.success, false)
    })

    it('should return 400 for empty query', async () => {
      const response = await fetch('http://localhost:3458/api/logs/test/search?q=')
      const data = await response.json()

      assert.strictEqual(response.status, 400)
      assert.strictEqual(data.success, false)
    })
  })

  describe('GET /api/logs/:source/stats', () => {
    it('should return log statistics', async () => {
      const response = await fetch('http://localhost:3458/api/logs/test/stats')
      const data = await response.json()

      assert.strictEqual(response.status, 200)
      assert.strictEqual(data.success, true)
      assert.ok(data.data.stats)
      assert.ok(data.data.stats.total !== undefined)
      assert.ok(data.data.stats.byLevel)
    })
  })

  describe('Error Handling', () => {
    it('should return JSON error response', async () => {
      const response = await fetch('http://localhost:3458/api/logs/nonexistent')
      
      assert.ok(response.headers.get('content-type').includes('application/json'))
      const data = await response.json()
      assert.ok('success' in data)
      assert.ok('error' in data)
    })
  })
})
