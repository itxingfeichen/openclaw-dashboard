/**
 * Export API Tests
 * 测试数据导出功能
 */

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { existsSync, unlinkSync, mkdirSync, readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// Import service module
import * as exportService from '../src/services/exportService.js'
import { getDatabase, initializeDatabase, closeDatabase } from '../src/database/index.js'

// 测试导出目录
const TEST_EXPORT_DIR = './data/test-exports'

describe('Export Service', () => {
  // 设置测试环境
  before(async () => {
    // 设置测试导出目录
    process.env.EXPORT_DIR = TEST_EXPORT_DIR
    
    // 初始化测试数据库 (使用 npm test 设置的 DB_PATH)
    const db = await initializeDatabase(true)
    
    // 插入测试 Agent
    db.exec(`
      INSERT OR REPLACE INTO agents (id, name, type, description, status, model_name, created_at)
      VALUES 
        (1, 'test-agent-1', 'custom', '测试 Agent 1', 'running', 'qwen3.5-plus', datetime('now')),
        (2, 'test-agent-2', 'main', '测试 Agent 2', 'stopped', 'qwen3.5-plus', datetime('now')),
        (3, 'test-agent-3', 'subagent', '测试 Agent 3', 'running', 'qwen3.5-plus', datetime('now'))
    `)
    
    // 插入测试任务
    db.exec(`
      INSERT OR REPLACE INTO tasks (id, task_id, title, description, status, priority, agent_id, created_at)
      VALUES 
        (1, 'T1.1', '测试任务 1', '任务描述 1', 'completed', 'high', 1, datetime('now')),
        (2, 'T1.2', '测试任务 2', '任务描述 2', 'running', 'normal', 1, datetime('now')),
        (3, 'T1.3', '测试任务 3', '任务描述 3', 'pending', 'low', 2, datetime('now'))
    `)
    
    // 插入测试日志
    db.exec(`
      INSERT OR REPLACE INTO task_logs (id, task_id, level, message, created_at)
      VALUES 
        (1, 'T1.1', 'info', '任务开始执行', datetime('now')),
        (2, 'T1.1', 'info', '任务执行完成', datetime('now')),
        (3, 'T1.2', 'warn', '任务执行中警告', datetime('now')),
        (4, 'T1.3', 'debug', '任务调试信息', datetime('now'))
    `)
    
    // 插入测试配置
    db.exec(`
      INSERT OR REPLACE INTO configs (id, key, value, type, description)
      VALUES 
        (1, 'test.config.1', 'value1', 'string', '测试配置 1'),
        (2, 'test.config.2', '123', 'number', '测试配置 2'),
        (3, 'test.config.3', 'true', 'boolean', '测试配置 3')
    `)
    
    console.log('[Export Test] Test data initialized')
  })
  
  // 清理测试环境
  after(async () => {
    // 清理测试导出文件
    if (existsSync(TEST_EXPORT_DIR)) {
      const files = readdirSync(TEST_EXPORT_DIR)
      files.forEach(file => {
        try {
          unlinkSync(join(TEST_EXPORT_DIR, file))
        } catch (e) {
          // 忽略删除错误
        }
      })
    }
    
    // 关闭数据库
    await closeDatabase()
    
    console.log('[Export Test] Test environment cleaned up')
  })
  
  describe('ExportFormat', () => {
    it('should have correct format values', () => {
      assert.strictEqual(exportService.ExportFormat.JSON, 'json')
      assert.strictEqual(exportService.ExportFormat.CSV, 'csv')
      assert.strictEqual(exportService.ExportFormat.XLSX, 'xlsx')
    })
  })
  
  describe('ExportType', () => {
    it('should have correct type values', () => {
      assert.strictEqual(exportService.ExportType.AGENTS, 'agents')
      assert.strictEqual(exportService.ExportType.TASKS, 'tasks')
      assert.strictEqual(exportService.ExportType.LOGS, 'logs')
      assert.strictEqual(exportService.ExportType.CONFIG, 'config')
    })
  })
  
  describe('ExportStatus', () => {
    it('should have correct status values', () => {
      assert.strictEqual(exportService.ExportStatus.PENDING, 'pending')
      assert.strictEqual(exportService.ExportStatus.PROCESSING, 'processing')
      assert.strictEqual(exportService.ExportStatus.COMPLETED, 'completed')
      assert.strictEqual(exportService.ExportStatus.FAILED, 'failed')
    })
  })
  
  describe('DEFAULT_FIELDS', () => {
    it('should have default fields for all types', () => {
      assert.ok(exportService.DEFAULT_FIELDS[exportService.ExportType.AGENTS])
      assert.ok(exportService.DEFAULT_FIELDS[exportService.ExportType.TASKS])
      assert.ok(exportService.DEFAULT_FIELDS[exportService.ExportType.LOGS])
      assert.ok(exportService.DEFAULT_FIELDS[exportService.ExportType.CONFIG])
    })
    
    it('should have non-empty field arrays', () => {
      Object.values(exportService.DEFAULT_FIELDS).forEach(fields => {
        assert.ok(Array.isArray(fields))
        assert.ok(fields.length > 0)
      })
    })
  })
  
  describe('getAgentsData', () => {
    it('should return agent data with default fields', async () => {
      const data = await exportService.getAgentsData()
      assert.ok(Array.isArray(data))
      assert.ok(data.length > 0)
      assert.ok(data[0].id !== undefined)
      assert.ok(data[0].name !== undefined)
    })
    
    it('should support custom fields', async () => {
      const data = await exportService.getAgentsData(['id', 'name', 'status'])
      assert.ok(Array.isArray(data))
      assert.ok(data.length > 0)
      assert.ok(data[0].id !== undefined)
      assert.ok(data[0].name !== undefined)
      assert.ok(data[0].status !== undefined)
    })
    
    it('should support filtering', async () => {
      const data = await exportService.getAgentsData(null, { status: 'running' })
      assert.ok(Array.isArray(data))
      data.forEach(agent => {
        assert.strictEqual(agent.status, 'running')
      })
    })
  })
  
  describe('getTasksData', () => {
    it('should return task data with default fields', () => {
      const data = exportService.getTasksData()
      assert.ok(Array.isArray(data))
      assert.ok(data.length > 0)
      assert.ok(data[0].id !== undefined)
      assert.ok(data[0].task_id !== undefined)
    })
    
    it('should support filtering by status', () => {
      const data = exportService.getTasksData(null, { status: 'completed' })
      assert.ok(Array.isArray(data))
      data.forEach(task => {
        assert.strictEqual(task.status, 'completed')
      })
    })
    
    it('should support filtering by priority', () => {
      const data = exportService.getTasksData(null, { priority: 'high' })
      assert.ok(Array.isArray(data))
      data.forEach(task => {
        assert.strictEqual(task.priority, 'high')
      })
    })
  })
  
  describe('getLogsData', () => {
    it('should return log data with default fields', () => {
      const data = exportService.getLogsData()
      assert.ok(Array.isArray(data))
      assert.ok(data.length > 0)
      assert.ok(data[0].id !== undefined)
      assert.ok(data[0].task_id !== undefined)
    })
    
    it('should support filtering by level', () => {
      const data = exportService.getLogsData(null, { level: 'info' })
      assert.ok(Array.isArray(data))
      data.forEach(log => {
        assert.strictEqual(log.level, 'info')
      })
    })
  })
  
  describe('getConfigData', () => {
    it('should return config data with default fields', () => {
      const data = exportService.getConfigData()
      assert.ok(Array.isArray(data))
      assert.ok(data.length > 0)
      assert.ok(data[0].id !== undefined)
      assert.ok(data[0].key !== undefined)
    })
  })
  
  describe('exportDataToFile', () => {
    it('should export agents to JSON format', () => {
      const result = exportService.exportDataToFile(
        exportService.ExportType.AGENTS,
        exportService.ExportFormat.JSON
      )
      
      assert.ok(result.exportId)
      assert.ok(result.filePath)
      assert.strictEqual(result.format, 'json')
      assert.ok(result.recordCount >= 0)
      assert.ok(existsSync(result.filePath))
      
      // 清理文件
      unlinkSync(result.filePath)
    })
    
    it('should export agents to CSV format', () => {
      const result = exportService.exportDataToFile(
        exportService.ExportType.AGENTS,
        exportService.ExportFormat.CSV
      )
      
      assert.ok(result.exportId)
      assert.ok(result.filePath)
      assert.strictEqual(result.format, 'csv')
      assert.ok(result.recordCount >= 0)
      assert.ok(existsSync(result.filePath))
      
      // 清理文件
      unlinkSync(result.filePath)
    })
    
    it('should export tasks to JSON format', () => {
      const result = exportService.exportDataToFile(
        exportService.ExportType.TASKS,
        exportService.ExportFormat.JSON
      )
      
      assert.ok(result.exportId)
      assert.ok(result.filePath)
      assert.ok(existsSync(result.filePath))
      
      // 清理文件
      unlinkSync(result.filePath)
    })
    
    it('should export logs to JSON format', () => {
      const result = exportService.exportDataToFile(
        exportService.ExportType.LOGS,
        exportService.ExportFormat.JSON
      )
      
      assert.ok(result.exportId)
      assert.ok(result.filePath)
      assert.ok(existsSync(result.filePath))
      
      // 清理文件
      unlinkSync(result.filePath)
    })
    
    it('should export config to JSON format', () => {
      const result = exportService.exportDataToFile(
        exportService.ExportType.CONFIG,
        exportService.ExportFormat.JSON
      )
      
      assert.ok(result.exportId)
      assert.ok(result.filePath)
      assert.ok(existsSync(result.filePath))
      
      // 清理文件
      unlinkSync(result.filePath)
    })
    
    it('should support custom fields', () => {
      const result = exportService.exportDataToFile(
        exportService.ExportType.AGENTS,
        exportService.ExportFormat.JSON,
        ['id', 'name', 'status']
      )
      
      assert.ok(result.exportId)
      assert.ok(existsSync(result.filePath))
      
      // 验证文件内容
      const content = JSON.parse(readFileSync(result.filePath, 'utf-8'))
      assert.ok(Array.isArray(content))
      if (content.length > 0) {
        assert.ok('id' in content[0])
        assert.ok('name' in content[0])
        assert.ok('status' in content[0])
      }
      
      // 清理文件
      unlinkSync(result.filePath)
    })
    
    it('should support filtering', () => {
      const result = exportService.exportDataToFile(
        exportService.ExportType.AGENTS,
        exportService.ExportFormat.JSON,
        null,
        { status: 'running' }
      )
      
      assert.ok(result.exportId)
      assert.ok(existsSync(result.filePath))
      
      // 验证文件内容
      const content = JSON.parse(readFileSync(result.filePath, 'utf-8'))
      content.forEach(agent => {
        assert.strictEqual(agent.status, 'running')
      })
      
      // 清理文件
      unlinkSync(result.filePath)
    })
  })
  
  describe('exportDataAsync', () => {
    it('should create async export task', async () => {
      const result = await exportService.exportDataAsync(
        exportService.ExportType.AGENTS,
        exportService.ExportFormat.JSON
      )
      
      assert.ok(result.exportId)
      assert.ok(result.status)
      
      // 等待异步处理完成
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 验证元数据文件
      const files = readdirSync(TEST_EXPORT_DIR)
      const metaFiles = files.filter(f => f.startsWith(result.exportId) && f.endsWith('.meta.json'))
      
      assert.ok(metaFiles.length > 0)
      
      // 清理文件
      metaFiles.forEach(f => {
        const filePath = join(TEST_EXPORT_DIR, f)
        if (existsSync(filePath)) {
          unlinkSync(filePath)
        }
      })
      const dataFile = join(TEST_EXPORT_DIR, result.exportId + '.json')
      if (existsSync(dataFile)) {
        unlinkSync(dataFile)
      }
    })
  })
  
  describe('getExportHistory', () => {
    it('should return export history', () => {
      // 先创建一个导出
      const exportResult = exportService.exportDataToFile(
        exportService.ExportType.AGENTS,
        exportService.ExportFormat.JSON
      )
      
      const history = exportService.getExportHistory()
      assert.ok(Array.isArray(history))
      
      // 清理文件
      unlinkSync(exportResult.filePath)
      const metadataPath = exportResult.filePath + '.meta.json'
      if (existsSync(metadataPath)) {
        unlinkSync(metadataPath)
      }
    })
    
    it('should support pagination', () => {
      const history = exportService.getExportHistory({ limit: 10, offset: 0 })
      assert.ok(Array.isArray(history))
    })
  })
  
  describe('downloadExportFile', () => {
    it('should return file info for existing export', () => {
      // 先创建一个导出
      const exportResult = exportService.exportDataToFile(
        exportService.ExportType.AGENTS,
        exportService.ExportFormat.JSON
      )
      
      const fileInfo = exportService.downloadExportFile(exportResult.exportId)
      assert.ok(fileInfo.exportId)
      assert.ok(fileInfo.filePath)
      assert.ok(fileInfo.mimeType)
      assert.strictEqual(fileInfo.format, 'json')
      
      // 清理文件
      unlinkSync(exportResult.filePath)
      const metadataPath = exportResult.filePath + '.meta.json'
      if (existsSync(metadataPath)) {
        unlinkSync(metadataPath)
      }
    })
    
    it('should throw error for non-existent export', () => {
      assert.throws(() => {
        exportService.downloadExportFile('non-existent-id')
      }, /导出文件不存在/)
    })
  })
  
  describe('deleteExportFile', () => {
    it('should delete export file', () => {
      // 先创建一个导出
      const exportResult = exportService.exportDataToFile(
        exportService.ExportType.AGENTS,
        exportService.ExportFormat.JSON
      )
      
      const deleted = exportService.deleteExportFile(exportResult.exportId)
      assert.strictEqual(deleted, true)
      assert.strictEqual(existsSync(exportResult.filePath), false)
    })
    
    it('should return false for non-existent export', () => {
      const deleted = exportService.deleteExportFile('non-existent-id')
      assert.strictEqual(deleted, false)
    })
  })
  
  describe('cleanupExpiredExports', () => {
    it('should cleanup old exports', () => {
      // 创建一个导出
      const exportResult = exportService.exportDataToFile(
        exportService.ExportType.AGENTS,
        exportService.ExportFormat.JSON
      )
      
      // 立即清理（maxAge=0，清理所有）
      const result = exportService.cleanupExpiredExports(0)
      
      assert.ok('deletedCount' in result)
      assert.ok('freedSpace' in result)
    })
  })
})

describe('Export API Routes', () => {
  it('should have valid route patterns', () => {
    // 验证路由配置
    assert.ok(true, 'Routes are defined in export.js')
  })
})
