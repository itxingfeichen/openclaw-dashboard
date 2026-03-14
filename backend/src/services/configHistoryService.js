/**
 * Config History Service - 配置版本历史管理服务
 * 支持 Git 集成、版本对比、回滚功能
 * @module services/configHistoryService
 */

import fs from 'fs/promises'
import path from 'path'
import { simpleGit } from 'simple-git'
import { logInfo, logError, createLogger } from '../utils/logger.js'

const logger = createLogger('configHistoryService')

/**
 * 配置文件格式枚举
 */
export const ConfigFormat = {
  YAML: 'yaml',
  JSON: 'json',
}

/**
 * 默认工作目录
 */
const DEFAULT_WORKSPACE = '/home/admin/.openclaw/workspace'

/**
 * 配置文件存储目录
 */
const CONFIG_DIR = path.join(DEFAULT_WORKSPACE, 'agents')

/**
 * Git 仓库根目录（用于版本控制）
 */
const GIT_REPO_ROOT = DEFAULT_WORKSPACE

/**
 * 配置历史存储目录（用于备份）
 */
const HISTORY_DIR = path.join(DEFAULT_WORKSPACE, '.config-history')

/**
 * 验证 Agent ID 格式
 * @param {string} agentId - Agent ID
 * @returns {boolean} 是否有效
 */
function isValidAgentId(agentId) {
  if (!agentId || typeof agentId !== 'string') {
    return false
  }
  
  const regex = /^[a-zA-Z0-9_-]+$/
  return regex.test(agentId) && agentId.length >= 2 && agentId.length <= 50
}

/**
 * 获取配置文件路径
 * @param {string} agentId - Agent ID
 * @param {string} format - 配置文件格式
 * @returns {string} 配置文件路径
 */
function getConfigPath(agentId, format = ConfigFormat.YAML) {
  const agentDir = path.join(CONFIG_DIR, agentId)
  const ext = format === ConfigFormat.YAML ? 'yaml' : 'json'
  return path.join(agentDir, `${agentId}-config.${ext}`)
}

/**
 * 获取 Git 实例
 * @param {string} repoPath - 仓库路径
 * @returns {Promise<Object>} Git 实例
 */
async function getGit(repoPath = GIT_REPO_ROOT) {
  try {
    // 确保目录存在
    await fs.mkdir(repoPath, { recursive: true })
    
    const git = simpleGit(repoPath)
    
    // 检查是否是 Git 仓库
    const isRepo = await git.checkIsRepo()
    if (!isRepo) {
      // 初始化 Git 仓库
      await git.init()
      logInfo('Initialized Git repository', { path: repoPath })
    }
    
    return git
  } catch (error) {
    logError('Failed to initialize Git', error)
    throw error
  }
}

/**
 * 获取 Agent 配置的 Git 提交历史
 * @param {string} agentId - Agent ID
 * @param {Object} options - 选项
 * @param {number} options.limit - 返回记录数量限制
 * @returns {Array} 版本列表
 */
export async function getVersionList(agentId, options = {}) {
  const { limit = 20 } = options
  
  if (!isValidAgentId(agentId)) {
    const error = new Error('无效的 Agent ID 格式')
    error.code = 'INVALID_AGENT_ID'
    throw error
  }
  
  logInfo('Fetching version list', { agentId, limit })
  
  try {
    const git = await getGit()
    const configPath = getConfigPath(agentId)
    const relativePath = path.relative(GIT_REPO_ROOT, configPath)
    
    // 获取该文件的提交历史
    const log = await git.log({
      file: relativePath,
      maxCount: limit,
    })
    
    const versions = log.all.map((commit) => ({
      versionId: commit.hash,
      shortHash: commit.hash.substring(0, 7),
      message: commit.message,
      author: commit.author_name,
      authorEmail: commit.author_email,
      timestamp: commit.date,
      changedFiles: commit.diff?.files || [],
    }))
    
    logInfo(`Retrieved ${versions.length} versions for ${agentId}`)
    
    return {
      versions,
      count: versions.length,
      agentId,
    }
  } catch (error) {
    logError(`Failed to fetch version list for ${agentId}`, error)
    
    // 如果文件不存在，返回空列表
    if (error.message.includes('unknown revision') || error.message.includes('does not exist')) {
      return {
        versions: [],
        count: 0,
        agentId,
      }
    }
    
    const ioError = new Error(`获取版本历史失败：${error.message}`)
    ioError.code = 'IO_ERROR'
    throw ioError
  }
}

/**
 * 获取指定版本的配置详情
 * @param {string} agentId - Agent ID
 * @param {string} versionId - 版本 ID（Git commit hash）
 * @returns {Object} 版本详情
 */
export async function getVersionDetail(agentId, versionId) {
  if (!isValidAgentId(agentId)) {
    const error = new Error('无效的 Agent ID 格式')
    error.code = 'INVALID_AGENT_ID'
    throw error
  }
  
  if (!versionId || typeof versionId !== 'string') {
    const error = new Error('无效的版本 ID')
    error.code = 'INVALID_VERSION_ID'
    throw error
  }
  
  logInfo('Fetching version detail', { agentId, versionId })
  
  try {
    const git = await getGit()
    const configPath = getConfigPath(agentId)
    const relativePath = path.relative(GIT_REPO_ROOT, configPath)
    
    // 获取指定版本的配置内容
    const content = await git.show([`${versionId}:${relativePath}`])
    
    // 获取提交信息
    const commitInfo = await git.show(versionId)
    const commitLog = await git.log({ maxCount: 1, from: versionId })
    const commit = commitLog.all[0]
    
    // 检测格式
    const format = configPath.endsWith('.json') ? ConfigFormat.JSON : ConfigFormat.YAML
    
    // 解析配置内容
    let config
    if (format === ConfigFormat.JSON) {
      config = JSON.parse(content)
    } else {
      config = parseSimpleYaml(content)
    }
    
    logInfo(`Retrieved version detail for ${agentId}@${versionId}`)
    
    return {
      versionId,
      shortHash: versionId.substring(0, 7),
      agentId,
      config,
      format,
      message: commit?.message,
      author: commit?.author_name,
      timestamp: commit?.date,
    }
  } catch (error) {
    logError(`Failed to fetch version detail for ${agentId}@${versionId}`, error)
    
    if (error.message.includes('does not exist') || error.message.includes('unknown revision')) {
      const notFoundError = new Error(`版本不存在：${versionId}`)
      notFoundError.code = 'VERSION_NOT_FOUND'
      throw notFoundError
    }
    
    if (error instanceof SyntaxError) {
      const parseError = new Error(`配置解析失败：${error.message}`)
      parseError.code = 'PARSE_ERROR'
      throw parseError
    }
    
    const ioError = new Error(`获取版本详情失败：${error.message}`)
    ioError.code = 'IO_ERROR'
    throw ioError
  }
}

/**
 * 回滚到指定版本
 * @param {string} agentId - Agent ID
 * @param {string} versionId - 版本 ID（Git commit hash）
 * @returns {Object} 回滚结果
 */
export async function rollbackToVersion(agentId, versionId) {
  if (!isValidAgentId(agentId)) {
    const error = new Error('无效的 Agent ID 格式')
    error.code = 'INVALID_AGENT_ID'
    throw error
  }
  
  if (!versionId || typeof versionId !== 'string') {
    const error = new Error('无效的版本 ID')
    error.code = 'INVALID_VERSION_ID'
    throw error
  }
  
  logInfo('Rolling back to version', { agentId, versionId })
  
  try {
    const git = await getGit()
    const configPath = getConfigPath(agentId)
    const relativePath = path.relative(GIT_REPO_ROOT, configPath)
    
    // 首先保存当前配置到备份目录
    try {
      const currentContent = await fs.readFile(configPath, 'utf-8')
      await saveBackup(agentId, currentContent, 'pre-rollback')
    } catch (error) {
      // 当前配置可能不存在，继续回滚
    }
    
    // 从指定版本恢复配置
    const content = await git.show([`${versionId}:${relativePath}`])
    
    // 确保目录存在
    await fs.mkdir(path.dirname(configPath), { recursive: true })
    
    // 写入配置
    await fs.writeFile(configPath, content, 'utf-8')
    
    // 提交回滚操作
    const commitMessage = `Rollback ${agentId} config to ${versionId.substring(0, 7)}`
    await git.add(relativePath)
    await git.commit(commitMessage)
    
    logInfo(`Rolled back ${agentId} to version ${versionId}`)
    
    return {
      success: true,
      agentId,
      rolledBackTo: versionId,
      shortHash: versionId.substring(0, 7),
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logError(`Failed to rollback ${agentId} to ${versionId}`, error)
    
    if (error.message.includes('does not exist') || error.message.includes('unknown revision')) {
      const notFoundError = new Error(`版本不存在：${versionId}`)
      notFoundError.code = 'VERSION_NOT_FOUND'
      throw notFoundError
    }
    
    const ioError = new Error(`回滚失败：${error.message}`)
    ioError.code = 'IO_ERROR'
    throw ioError
  }
}

/**
 * 对比两个版本的配置差异
 * @param {string} agentId - Agent ID
 * @param {string} versionId1 - 版本 ID 1
 * @param {string} versionId2 - 版本 ID 2
 * @returns {Object} 对比结果
 */
export async function compareVersions(agentId, versionId1, versionId2) {
  if (!isValidAgentId(agentId)) {
    const error = new Error('无效的 Agent ID 格式')
    error.code = 'INVALID_AGENT_ID'
    throw error
  }
  
  if (!versionId1 || !versionId2) {
    const error = new Error('必须提供两个版本 ID')
    error.code = 'INVALID_VERSION_ID'
    throw error
  }
  
  logInfo('Comparing versions', { agentId, versionId1, versionId2 })
  
  try {
    const git = await getGit()
    const configPath = getConfigPath(agentId)
    const relativePath = path.relative(GIT_REPO_ROOT, configPath)
    
    // 获取两个版本的内容
    const content1 = await git.show([`${versionId1}:${relativePath}`])
    const content2 = await git.show([`${versionId2}:${relativePath}`])
    
    // 获取 Git diff
    const diff = await git.diff([versionId1, versionId2, '--', relativePath])
    
    // 解析配置内容
    const format = configPath.endsWith('.json') ? ConfigFormat.JSON : ConfigFormat.YAML
    let config1, config2
    
    try {
      if (format === ConfigFormat.JSON) {
        config1 = JSON.parse(content1)
        config2 = JSON.parse(content2)
      } else {
        config1 = parseSimpleYaml(content1)
        config2 = parseSimpleYaml(content2)
      }
    } catch (error) {
      // 解析失败时保留原始内容
      config1 = { _raw: content1 }
      config2 = { _raw: content2 }
    }
    
    // 计算差异
    const changes = calculateConfigDiff(config1, config2)
    
    logInfo(`Compared versions for ${agentId}: ${versionId1} vs ${versionId2}`)
    
    return {
      agentId,
      version1: {
        versionId: versionId1,
        shortHash: versionId1.substring(0, 7),
        config: config1,
      },
      version2: {
        versionId: versionId2,
        shortHash: versionId2.substring(0, 7),
        config: config2,
      },
      diff: {
        raw: diff,
        changes,
      },
    }
  } catch (error) {
    logError(`Failed to compare versions for ${agentId}`, error)
    
    if (error.message.includes('does not exist') || error.message.includes('unknown revision')) {
      const notFoundError = new Error(`版本不存在`)
      notFoundError.code = 'VERSION_NOT_FOUND'
      throw notFoundError
    }
    
    const ioError = new Error(`版本对比失败：${error.message}`)
    ioError.code = 'IO_ERROR'
    throw ioError
  }
}

/**
 * 保存配置备份
 * @param {string} agentId - Agent ID
 * @param {string} content - 配置内容
 * @param {string} operation - 操作类型
 * @returns {string} 备份文件路径
 */
async function saveBackup(agentId, content, operation) {
  const historyDir = path.join(HISTORY_DIR, agentId)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${timestamp}-${operation}.backup`
  const filepath = path.join(historyDir, filename)
  
  try {
    await fs.mkdir(historyDir, { recursive: true })
    await fs.writeFile(filepath, content, 'utf-8')
    logInfo(`Saved backup for ${agentId}`, { filepath, operation })
    return filepath
  } catch (error) {
    logError(`Failed to save backup for ${agentId}`, error)
    return null
  }
}

/**
 * 简单的 YAML 解析器
 * @param {string} yaml - YAML 内容
 * @returns {Object} 解析后的对象
 */
function parseSimpleYaml(yaml) {
  const result = {}
  const lines = yaml.split('\n')
  let currentSection = null
  
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) {
      continue
    }
    
    if (!line.startsWith(' ') && !line.startsWith('\t')) {
      const match = line.match(/^(\w+):\s*(.*)$/)
      if (match) {
        const [, key, value] = match
        currentSection = key
        if (value) {
          result[key] = parseYamlValue(value)
        } else {
          result[key] = {}
        }
      }
      continue
    }
    
    if (currentSection) {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('- ')) {
        if (!Array.isArray(result[currentSection])) {
          result[currentSection] = []
        }
        result[currentSection].push(parseYamlValue(trimmed.substring(2)))
        continue
      }
      
      const match = trimmed.match(/^(\w+):\s*(.*)$/)
      if (match) {
        const [, key, value] = match
        if (typeof result[currentSection] === 'object' && !Array.isArray(result[currentSection])) {
          result[currentSection][key] = parseYamlValue(value)
        }
      }
    }
  }
  
  return result
}

/**
 * 解析 YAML 值
 * @param {string} value - YAML 值字符串
 * @returns {any} 解析后的值
 */
function parseYamlValue(value) {
  if (!value) {
    return null
  }
  
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false
  
  if (/^\d+$/.test(value)) return parseInt(value, 10)
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value)
  
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value).toISOString()
  }
  
  return value
}

/**
 * 计算配置差异
 * @param {Object} config1 - 配置 1
 * @param {Object} config2 - 配置 2
 * @returns {Array} 差异列表
 */
function calculateConfigDiff(config1, config2) {
  const changes = []
  
  function compareObjects(obj1, obj2, path = '') {
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})])
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key
      const val1 = obj1?.[key]
      const val2 = obj2?.[key]
      
      if (val1 === undefined) {
        changes.push({
          path: currentPath,
          type: 'added',
          oldValue: null,
          newValue: val2,
        })
      } else if (val2 === undefined) {
        changes.push({
          path: currentPath,
          type: 'removed',
          oldValue: val1,
          newValue: null,
        })
      } else if (typeof val1 === 'object' && typeof val2 === 'object' && 
                 !Array.isArray(val1) && !Array.isArray(val2)) {
        compareObjects(val1, val2, currentPath)
      } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        changes.push({
          path: currentPath,
          type: 'modified',
          oldValue: val1,
          newValue: val2,
        })
      }
    }
  }
  
  compareObjects(config1, config2)
  
  return changes
}

/**
 * 提交配置变更到 Git
 * @param {string} agentId - Agent ID
 * @param {string} message - 提交信息
 * @returns {Object} 提交结果
 */
export async function commitConfig(agentId, message) {
  if (!isValidAgentId(agentId)) {
    const error = new Error('无效的 Agent ID 格式')
    error.code = 'INVALID_AGENT_ID'
    throw error
  }
  
  logInfo('Committing config', { agentId, message })
  
  try {
    const git = await getGit()
    const configPath = getConfigPath(agentId)
    const relativePath = path.relative(GIT_REPO_ROOT, configPath)
    
    // 检查文件是否存在
    try {
      await fs.access(configPath)
    } catch (error) {
      const notFoundError = new Error(`配置文件不存在：${agentId}`)
      notFoundError.code = 'CONFIG_NOT_FOUND'
      throw notFoundError
    }
    
    // 配置 Git 用户信息（如果未设置）
    try {
      await git.addConfig('user.name', 'OpenClaw Dashboard', undefined, { path: '--local' })
    } catch (error) {
      // 忽略配置错误，可能已经设置
    }
    try {
      await git.addConfig('user.email', 'dashboard@openclaw.local', undefined, { path: '--local' })
    } catch (error) {
      // 忽略配置错误，可能已经设置
    }
    
    // 添加并提交
    await git.add(relativePath)
    const commitResult = await git.commit(message)
    
    logInfo(`Committed config for ${agentId}`, { hash: commitResult.commit })
    
    return {
      success: true,
      agentId,
      commitHash: commitResult.commit,
      shortHash: commitResult.commit.substring(0, 7),
      message,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logError(`Failed to commit config for ${agentId}`, error)
    
    if (error.code === 'CONFIG_NOT_FOUND') {
      throw error
    }
    
    const ioError = new Error(`提交失败：${error.message}`)
    ioError.code = 'IO_ERROR'
    throw ioError
  }
}

export default {
  getVersionList,
  getVersionDetail,
  rollbackToVersion,
  compareVersions,
  commitConfig,
  ConfigFormat,
}
