/**
 * CLI API 路由测试
 * 注意：这些测试需要实际的 OpenClaw CLI 可用
 */

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import express from 'express'
import cliRoutes from '../src/routes/cli.js'

describe('CLI API Routes', () => {
  let app
  let testServer

  before(() => {
    app = express()
    app.use(express.json())
    app.use('/api', cliRoutes)
    
    // Start test server
    testServer = app.listen(3457)
  })

  after(() => {
    if (testServer) {
      testServer.close()
    }
  })

  describe('GET /api/status', () => {
    it('should return proper response structure', async () => {
      const response = await fetch('http://localhost:3457/api/status')
      const data = await response.json()
      
      // 验证响应结构
      assert.ok('success' in data)
      assert.ok('timestamp' in data)
      
      // 如果 CLI 可用，验证数据
      if (response.status === 200) {
        assert.strictEqual(data.success, true)
        assert.ok(data.data)
      }
    })
  })

  describe('GET /api/agents', () => {
    it('should return proper response structure', async () => {
      const response = await fetch('http://localhost:3457/api/agents')
      const data = await response.json()
      
      // 验证响应结构
      assert.ok('success' in data)
      assert.ok('timestamp' in data)
      
      // 如果 CLI 可用，验证数据
      if (response.status === 200) {
        assert.strictEqual(data.success, true)
        assert.ok(data.data)
      }
    })
  })

  describe('GET /api/sessions', () => {
    it('should return proper response structure', async () => {
      const response = await fetch('http://localhost:3457/api/sessions')
      const data = await response.json()
      
      // 验证响应结构
      assert.ok('success' in data)
      assert.ok('timestamp' in data)
      
      // 如果 CLI 可用，验证数据
      if (response.status === 200) {
        assert.strictEqual(data.success, true)
        assert.ok(data.data)
      }
    })
  })

  describe('GET /api/cron', () => {
    it('should return proper response structure', async () => {
      const response = await fetch('http://localhost:3457/api/cron')
      const data = await response.json()
      
      // 验证响应结构
      assert.ok('success' in data)
      assert.ok('timestamp' in data)
      
      // 如果 CLI 可用，验证数据
      if (response.status === 200) {
        assert.strictEqual(data.success, true)
        assert.ok(data.data)
      }
    })
  })

  describe('GET /api/config', () => {
    it('should return proper response structure without key', async () => {
      const response = await fetch('http://localhost:3457/api/config')
      const data = await response.json()
      
      // 验证响应结构
      assert.ok('success' in data)
      assert.ok('timestamp' in data)
    })

    it('should accept key query parameter', async () => {
      const response = await fetch('http://localhost:3457/api/config?key=test.key')
      const data = await response.json()
      
      // 验证响应结构
      assert.ok('success' in data)
      assert.ok('timestamp' in data)
    })
  })

  describe('Error Handling', () => {
    it('should return JSON error response', async () => {
      // 测试一个会失败的配置请求
      const response = await fetch('http://localhost:3457/api/config?key=nonexistent.key')
      
      // 应该返回 JSON 格式的错误响应
      assert.ok(response.headers.get('content-type').includes('application/json'))
      const data = await response.json()
      assert.ok('success' in data)
      assert.ok('error' in data || 'data' in data)
    })
  })
})
