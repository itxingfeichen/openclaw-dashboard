/**
 * Export Service
 * 数据导出服务，支持多格式导出、自定义字段、批量导出、异步导出
 * 
 * Features:
 * - 多格式支持：CSV, JSON, XLSX
 * - 自定义字段选择
 * - 数据过滤
 * - 批量导出
 * - 异步导出（大文件）
 */

import { getDatabase, prepare } from '../database/index.js'
import { mkdirSync, writeFileSync, readFileSync, existsSync, createWriteStream } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { createReadStream } from 'fs'
import { pipeline } from 'stream/promises'

// 导出目录
const EXPORT_DIR = process.env.EXPORT_DIR || join(process.cwd(), 'data', 'exports')

// 导出格式枚举
export const ExportFormat = {
  JSON: 'json',
  CSV: 'csv',
  XLSX: 'xlsx'
}

// 导出类型枚举
export const ExportType = {
  AGENTS: 'agents',
  TASKS: 'tasks',
  LOGS: 'logs',
  CONFIG: 'config'
}

// 导出状态枚举
export const ExportStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
}

// 各类型数据的默认字段
export const DEFAULT_FIELDS = {
  [ExportType.AGENTS]: ['id', 'name', 'type', 'description', 'status', 'model_name', 'created_at', 'updated_at'],
  [ExportType.TASKS]: ['id', 'task_id', 'title', 'description', 'status', 'priority', 'agent_id', 'assigned_to', 'created_at', 'completed_at'],
  [ExportType.LOGS]: ['id', 'task_id', 'level', 'message', 'context', 'created_at'],
  [ExportType.CONFIG]: ['id', 'key', 'value', 'type', 'description', 'created_at', 'updated_at']
}

// 各类型数据的数据表映射
const TABLE_MAPPING = {
  [ExportType.AGENTS]: 'agents',
  [ExportType.TASKS]: 'tasks',
  [ExportType.LOGS]: 'task_logs',
  [ExportType.CONFIG]: 'configs'
}

/**
 * 确保导出目录存在
 */
function ensureExportDir() {
  if (!existsSync(EXPORT_DIR)) {
    mkdirSync(EXPORT_DIR, { recursive: true })
  }
}

/**
 * 生成唯一的导出 ID
 * @returns {string} 导出 ID
 */
function generateExportId() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `export_${timestamp}_${random}`
}

/**
 * 生成导出文件路径
 * @param {string} exportId - 导出 ID
 * @param {string} format - 文件格式
 * @returns {string} 文件路径
 */
function getExportFilePath(exportId, format) {
  return join(EXPORT_DIR, `${exportId}.${format}`)
}

/**
 * 将数据转换为 CSV 格式
 * @param {Array} data - 数据数组
 * @param {Array} fields - 字段列表
 * @returns {string} CSV 内容
 */
function convertToCSV(data, fields) {
  if (!data || data.length === 0) {
    return ''
  }

  // CSV 头部
  const header = fields.join(',')
  
  // CSV 数据行
  const rows = data.map(row => {
    return fields.map(field => {
      let value = row[field]
      
      // 处理 null/undefined
      if (value === null || value === undefined) {
        value = ''
      }
      
      // 处理对象/数组（JSON 序列化）
      if (typeof value === 'object') {
        value = JSON.stringify(value)
      }
      
      // 转义处理：包含逗号、引号、换行符的字段用引号包裹
      value = String(value)
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = '"' + value.replace(/"/g, '""') + '"'
      }
      
      return value
    }).join(',')
  })
  
  return [header, ...rows].join('\n')
}

/**
 * 将数据转换为 XLSX 格式（简化版，使用 CSV 兼容格式）
 * 注意：完整 XLSX 支持需要安装 xlsx 库
 * @param {Array} data - 数据数组
 * @param {Array} fields - 字段列表
 * @returns {Buffer} XLSX 数据
 */
function convertToXLSX(data, fields) {
  // 简化实现：使用 CSV 格式但保存为 .xlsx 扩展名
  // 生产环境应使用真正的 xlsx 库如 'exceljs' 或 'xlsx'
  const csvContent = convertToCSV(data, fields)
  // 添加 BOM 以支持 Excel 正确识别 UTF-8
  const bom = Buffer.from([0xEF, 0xBB, 0xBF])
  const content = Buffer.from(csvContent, 'utf-8')
  return Buffer.concat([bom, content])
}

/**
 * 从数据库查询数据
 * @param {string} type - 导出类型
 * @param {Array} fields - 字段列表
 * @param {Object} filters - 过滤条件
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} 数据数组
 */
async function queryData(type, fields, filters = {}, options = {}) {
  const db = await getDatabase()
  const tableName = TABLE_MAPPING[type]
  
  if (!tableName) {
    throw new Error(`未知的导出类型：${type}`)
  }
  
  // 构建 SELECT 语句
  const selectFields = fields.map(f => f.replace(/[^a-zA-Z0-9_]/g, '')).join(', ')
  
  // 构建 WHERE 子句
  const whereClauses = []
  const params = []
  
  if (filters && typeof filters === 'object') {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        whereClauses.push(`${key} = ?`)
        params.push(value)
      }
    })
  }
  
  // 构建 ORDER BY
  const orderBy = options.orderBy || 'created_at'
  const orderDirection = options.orderDirection || 'DESC'
  
  // 构建 LIMIT/OFFSET
  const limit = options.limit || 10000
  const offset = options.offset || 0
  
  let sql = `SELECT ${selectFields} FROM ${tableName}`
  
  if (whereClauses.length > 0) {
    sql += ` WHERE ${whereClauses.join(' AND ')}`
  }
  
  sql += ` ORDER BY ${orderBy} ${orderDirection}`
  sql += ` LIMIT ? OFFSET ?`
  
  params.push(limit, offset)
  
  const stmt = db.prepare(sql)
  const rows = stmt.all(...params)
  
  return rows
}

/**
 * 获取 Agent 数据
 * @param {Array} fields - 字段列表
 * @param {Object} filters - 过滤条件
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} Agent 数据
 */
export async function getAgentsData(fields = null, filters = {}, options = {}) {
  const selectedFields = fields || DEFAULT_FIELDS[ExportType.AGENTS]
  return await queryData(ExportType.AGENTS, selectedFields, filters, options)
}

/**
 * 获取任务数据
 * @param {Array} fields - 字段列表
 * @param {Object} filters - 过滤条件
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} 任务数据
 */
export async function getTasksData(fields = null, filters = {}, options = {}) {
  const selectedFields = fields || DEFAULT_FIELDS[ExportType.TASKS]
  return await queryData(ExportType.TASKS, selectedFields, filters, options)
}

/**
 * 获取日志数据
 * @param {Array} fields - 字段列表
 * @param {Object} filters - 过滤条件
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} 日志数据
 */
export async function getLogsData(fields = null, filters = {}, options = {}) {
  const selectedFields = fields || DEFAULT_FIELDS[ExportType.LOGS]
  return await queryData(ExportType.LOGS, selectedFields, filters, options)
}

/**
 * 获取配置数据
 * @param {Array} fields - 字段列表
 * @param {Object} filters - 过滤条件
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} 配置数据
 */
export async function getConfigData(fields = null, filters = {}, options = {}) {
  const selectedFields = fields || DEFAULT_FIELDS[ExportType.CONFIG]
  return await queryData(ExportType.CONFIG, selectedFields, filters, options)
}

/**
 * 导出数据到文件
 * @param {string} type - 导出类型
 * @param {string} format - 导出格式
 * @param {Array} fields - 字段列表
 * @param {Object} filters - 过滤条件
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 导出结果
 */
export async function exportDataToFile(type, format, fields = null, filters = {}, options = {}) {
  ensureExportDir()
  
  const exportId = generateExportId()
  const data = await queryData(type, fields || DEFAULT_FIELDS[type], filters, options)
  const filePath = getExportFilePath(exportId, format)
  
  let content
  let mimeType
  
  switch (format) {
    case ExportFormat.JSON:
      content = JSON.stringify(data, null, 2)
      mimeType = 'application/json'
      break
    case ExportFormat.CSV:
      content = convertToCSV(data, fields || DEFAULT_FIELDS[type])
      mimeType = 'text/csv'
      break
    case ExportFormat.XLSX:
      content = convertToXLSX(data, fields || DEFAULT_FIELDS[type])
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      break
    default:
      throw new Error(`不支持的导出格式：${format}`)
  }
  
  writeFileSync(filePath, content)
  
  return {
    exportId,
    filePath,
    format,
    type,
    recordCount: data.length,
    mimeType,
    createdAt: new Date().toISOString()
  }
}

/**
 * 异步导出数据（适用于大数据量）
 * @param {string} type - 导出类型
 * @param {string} format - 导出格式
 * @param {Array} fields - 字段列表
 * @param {Object} filters - 过滤条件
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 导出结果
 */
export async function exportDataAsync(type, format, fields = null, filters = {}, options = {}) {
  ensureExportDir()
  
  const exportId = generateExportId()
  const filePath = getExportFilePath(exportId, format)
  
  // 创建导出记录
  const exportRecord = {
    exportId,
    type,
    format,
    status: ExportStatus.PENDING,
    filePath,
    fields: fields || DEFAULT_FIELDS[type],
    filters,
    options,
    createdAt: new Date().toISOString(),
    completedAt: null,
    errorMessage: null,
    recordCount: 0
  }
  
  // 保存导出元数据
  const metadataPath = filePath + '.meta.json'
  writeFileSync(metadataPath, JSON.stringify(exportRecord, null, 2))
  
  // 异步处理导出
  const processExport = async () => {
    try {
      // 更新状态为处理中
      exportRecord.status = ExportStatus.PROCESSING
      writeFileSync(metadataPath, JSON.stringify(exportRecord, null, 2))
      
      // 分批查询和写入数据（避免内存溢出）
      const batchSize = options.batchSize || 1000
      let offset = 0
      let totalRecords = 0
      let isFirstBatch = true
      
      const selectedFields = fields || DEFAULT_FIELDS[type]
      
      // 对于 CSV 和 XLSX，需要特殊处理
      if (format === ExportFormat.CSV || format === ExportFormat.XLSX) {
        const writeStream = createWriteStream(filePath)
        
        while (true) {
          const batchOptions = { ...options, limit: batchSize, offset }
          const batch = queryData(type, selectedFields, filters, batchOptions)
          
          if (batch.length === 0) {
            break
          }
          
          if (isFirstBatch && format === ExportFormat.CSV) {
            // 写入 CSV 头部
            const header = selectedFields.join(',')
            writeStream.write(header + '\n')
            isFirstBatch = false
          }
          
          // 写入数据行
          batch.forEach(row => {
            const values = selectedFields.map(field => {
              let value = row[field]
              if (value === null || value === undefined) {
                value = ''
              }
              if (typeof value === 'object') {
                value = JSON.stringify(value)
              }
              value = String(value)
              if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = '"' + value.replace(/"/g, '""') + '"'
              }
              return value
            })
            writeStream.write(values.join(',') + '\n')
          })
          
          totalRecords += batch.length
          offset += batchSize
        }
        
        writeStream.end()
        
        // 等待流完成
        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve)
          writeStream.on('error', reject)
        })
        
        // 对于 XLSX，添加 BOM
        if (format === ExportFormat.XLSX) {
          const existingContent = readFileSync(filePath)
          const bom = Buffer.from([0xEF, 0xBB, 0xBF])
          writeFileSync(filePath, Buffer.concat([bom, existingContent]))
        }
      } else {
        // JSON 格式：一次性查询所有数据
        const data = queryData(type, selectedFields, filters, { ...options, limit: options.limit || 100000 })
        const content = JSON.stringify(data, null, 2)
        writeFileSync(filePath, content)
        totalRecords = data.length
      }
      
      // 更新导出记录
      exportRecord.status = ExportStatus.COMPLETED
      exportRecord.completedAt = new Date().toISOString()
      exportRecord.recordCount = totalRecords
      writeFileSync(metadataPath, JSON.stringify(exportRecord, null, 2))
      
      return {
        exportId,
        status: ExportStatus.COMPLETED,
        recordCount: totalRecords,
        filePath,
        format: exportRecord.format,
        type: exportRecord.type
      }
    } catch (error) {
      exportRecord.status = ExportStatus.FAILED
      exportRecord.errorMessage = error.message
      exportRecord.completedAt = new Date().toISOString()
      writeFileSync(metadataPath, JSON.stringify(exportRecord, null, 2))
      
      throw error
    }
  }
  
  // 启动异步处理
  processExport().catch(console.error)
  
  return {
    exportId,
    status: ExportStatus.PENDING,
    message: '导出任务已创建，正在后台处理'
  }
}

/**
 * 获取导出历史
 * @param {Object} options - 查询选项
 * @returns {Array} 导出历史记录
 */
export function getExportHistory(options = {}) {
  ensureExportDir()
  
  const history = []
  
  // 扫描导出目录中的所有元数据文件
  const files = readdirSync(EXPORT_DIR)
  
  files.forEach(file => {
    if (file.endsWith('.meta.json')) {
      try {
        const metadataPath = join(EXPORT_DIR, file)
        const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'))
        history.push(metadata)
      } catch (e) {
        // 忽略解析错误的文件
      }
    }
  })
  
  // 按创建时间排序
  history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  
  // 应用分页
  const limit = options.limit || 50
  const offset = options.offset || 0
  
  return history.slice(offset, offset + limit)
}

/**
 * 下载导出文件
 * @param {string} exportId - 导出 ID
 * @returns {Object} 文件信息
 */
export function downloadExportFile(exportId) {
  ensureExportDir()
  
  // 查找导出文件
  const files = readdirSync(EXPORT_DIR)
  
  // 查找匹配的导出文件
  let exportFile = null
  let format = null
  
  for (const file of files) {
    if (file.startsWith(exportId + '.') && !file.endsWith('.meta.json')) {
      exportFile = join(EXPORT_DIR, file)
      format = file.split('.').pop()
      break
    }
  }
  
  if (!exportFile || !existsSync(exportFile)) {
    throw new Error(`导出文件不存在：${exportId}`)
  }
  
  // 读取元数据
  const metadataPath = exportFile + '.meta.json'
  let metadata = null
  if (existsSync(metadataPath)) {
    metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'))
  }
  
  const mimeType = metadata?.mimeType || getMimeType(format)
  const filename = `${exportId}.${format}`
  
  return {
    exportId,
    filePath: exportFile,
    filename,
    mimeType,
    format,
    size: existsSync(exportFile) ? require('fs').statSync(exportFile).size : 0,
    metadata
  }
}

/**
 * 获取文件 MIME 类型
 * @param {string} format - 文件格式
 * @returns {string} MIME 类型
 */
function getMimeType(format) {
  const mimeTypes = {
    [ExportFormat.JSON]: 'application/json',
    [ExportFormat.CSV]: 'text/csv',
    [ExportFormat.XLSX]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
  return mimeTypes[format] || 'application/octet-stream'
}

/**
 * 删除导出文件
 * @param {string} exportId - 导出 ID
 * @returns {boolean} 是否删除成功
 */
export function deleteExportFile(exportId) {
  ensureExportDir()
  
  const files = readdirSync(EXPORT_DIR)
  
  let deleted = false
  
  files.forEach(file => {
    if (file.startsWith(exportId)) {
      try {
        unlinkSync(join(EXPORT_DIR, file))
        deleted = true
      } catch (e) {
        console.error(`删除文件失败：${file}`, e)
      }
    }
  })
  
  return deleted
}

/**
 * 清理过期的导出文件
 * @param {number} maxAge - 最大保留时间（毫秒）
 * @returns {Object} 清理结果
 */
export function cleanupExpiredExports(maxAge = 7 * 24 * 60 * 60 * 1000) {
  ensureExportDir()
  
  const files = readdirSync(EXPORT_DIR)
  
  const now = Date.now()
  let deletedCount = 0
  let freedSpace = 0
  
  files.forEach(file => {
    if (file.endsWith('.meta.json')) {
      const filePath = join(EXPORT_DIR, file)
      const dataFile = filePath.replace('.meta.json', '')
      
      try {
        const stats = statSync(filePath)
        const fileAge = now - stats.mtimeMs
        
        if (fileAge > maxAge) {
          // 删除元数据文件
          unlinkSync(filePath)
          deletedCount++
          freedSpace += stats.size
          
          // 删除数据文件
          if (existsSync(dataFile)) {
            const dataStats = statSync(dataFile)
            unlinkSync(dataFile)
            freedSpace += dataStats.size
          }
        }
      } catch (e) {
        console.error(`清理文件失败：${file}`, e)
      }
    }
  })
  
  return {
    deletedCount,
    freedSpace,
    maxAge
  }
}

const exportService = {
  ExportFormat,
  ExportType,
  ExportStatus,
  DEFAULT_FIELDS,
  getAgentsData,
  getTasksData,
  getLogsData,
  getConfigData,
  exportDataToFile,
  exportDataAsync,
  getExportHistory,
  downloadExportFile,
  deleteExportFile,
  cleanupExpiredExports
}

export default exportService
