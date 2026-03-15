/**
 * Skill Installation Service
 * Handles skill installation, updates, and registry integration (skillhub/clawhub)
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { EventEmitter } from 'events'
import * as skillRepository from '../repositories/skill-repository.js'
import AppError from '../errors/AppError.js'
import {
  ERR_INVALID_REQUEST,
  ERR_NOT_FOUND,
  ERR_EXTERNAL_SERVICE,
  ERR_EXTERNAL_TIMEOUT,
  ERR_AUTH_PERMISSION_DENIED,
  ERR_RESOURCE_EXISTS,
  ERR_OPERATION_NOT_ALLOWED
} from '../errors/error-codes.js'

const execAsync = promisify(exec)

// Registry configuration
export const REGISTRIES = {
  SKILLHUB: {
    name: 'skillhub',
    command: 'skillhub',
    priority: 1, // Higher priority = tried first
    description: '国内技能注册表'
  },
  CLAWHUB: {
    name: 'clawhub',
    command: 'clawhub',
    priority: 2,
    description: '公共技能注册表'
  }
}

// Risk levels for skills
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

// Installation status
export const INSTALL_STATUS = {
  PENDING: 'pending',
  DOWNLOADING: 'downloading',
  INSTALLING: 'installing',
  SUCCESS: 'success',
  FAILED: 'failed',
  ROLLING_BACK: 'rolling_back'
}

/**
 * Skill Installation Event Emitter
 * Emits progress events for real-time updates
 */
class SkillInstallEmitter extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(100) // Allow multiple concurrent installations
  }

  /**
   * Emit installation progress
   * @param {string} skillName - Skill name
   * @param {Object} data - Progress data
   */
  emitProgress(skillName, data) {
    this.emit(`install:${skillName}:progress`, data)
    this.emit(`install:*:progress`, { skillName, ...data })
  }

  /**
   * Emit installation completion
   * @param {string} skillName - Skill name
   * @param {Object} result - Installation result
   */
  emitComplete(skillName, result) {
    this.emit(`install:${skillName}:complete`, result)
    this.emit(`install:*:complete`, { skillName, ...result })
  }
}

export const skillInstallEmitter = new SkillInstallEmitter()

/**
 * Get progress callback function
 * @param {string} skillName - Skill name
 * @param {Function} onProgress - Progress callback
 * @returns {Function} Bound progress callback
 */
export function createProgressCallback(skillName, onProgress) {
  return (data) => {
    if (onProgress) {
      onProgress({ skillName, ...data })
    }
  }
}

/**
 * Search for skills in registries
 * Policy: Try skillhub first, fallback to clawhub
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {number} [options.limit=10] - Max results
 * @param {string} [options.source] - Force specific source
 * @returns {Promise<Object>} Search results
 */
export async function searchSkills(query, options = {}) {
  const { limit = 10, source } = options
  
  // Validate query
  if (!query || typeof query !== 'string' || query.trim() === '') {
    throw new AppError(
      ERR_INVALID_REQUEST,
      '搜索关键词不能为空'
    )
  }
  
  const results = {
    query,
    total: 0,
    skills: [],
    sources: []
  }

  // If source is specified, use only that registry
  if (source) {
    const registry = Object.values(REGISTRIES).find(r => r.name === source)
    if (!registry) {
      throw new AppError(
        ERR_INVALID_REQUEST,
        `无效的注册表来源：${source}`
      )
    }
    return await searchInRegistry(registry, query, limit)
  }

  // Try skillhub first (domestic registry)
  try {
    const skillhubResults = await searchInRegistry(REGISTRIES.SKILLHUB, query, limit)
    if (skillhubResults.skills.length > 0) {
      results.skills.push(...skillhubResults.skills)
      results.sources.push('skillhub')
    }
  } catch (error) {
    console.warn('skillhub search failed, falling back to clawhub:', error.message)
  }

  // If skillhub returned no results or failed, try clawhub
  if (results.skills.length === 0) {
    try {
      const clawhubResults = await searchInRegistry(REGISTRIES.CLAWHUB, query, limit)
      results.skills.push(...clawhubResults.skills)
      results.sources.push('clawhub')
    } catch (error) {
      console.warn('clawhub search failed:', error.message)
      if (results.skills.length === 0) {
        throw new AppError(
          ERR_EXTERNAL_SERVICE,
          '所有技能注册表都无法访问'
        )
      }
    }
  }

  results.total = results.skills.length
  return results
}

/**
 * Search in a specific registry
 * @param {Object} registry - Registry configuration
 * @param {string} query - Search query
 * @param {number} limit - Max results
 * @returns {Promise<Object>} Search results
 */
async function searchInRegistry(registry, query, limit) {
  try {
    const { stdout } = await execAsync(`${registry.command} search "${query}" --limit ${limit} --json`, {
      timeout: 30000 // 30 second timeout
    })

    const data = JSON.parse(stdout)
    const skills = (data.skills || data.results || []).map(skill => ({
      ...skill,
      source: registry.name,
      available: true
    }))

    return {
      source: registry.name,
      total: skills.length,
      skills
    }
  } catch (error) {
    if (error.code === 'ETIMEDOUT') {
      throw new AppError(
        ERR_EXTERNAL_TIMEOUT,
        `${registry.name} 搜索超时`
      )
    }
    throw new AppError(
      ERR_EXTERNAL_SERVICE,
      `${registry.name} 搜索失败：${error.message}`
    )
  }
}

/**
 * Get skill details from registry
 * @param {string} skillName - Skill name
 * @param {string} [source] - Registry source (optional, will auto-detect if not specified)
 * @returns {Promise<Object>} Skill details
 */
export async function getSkillDetails(skillName, source) {
  const registries = source 
    ? [Object.values(REGISTRIES).find(r => r.name === source)]
    : Object.values(REGISTRIES).sort((a, b) => a.priority - b.priority)

  for (const registry of registries) {
    if (!registry) continue
    
    try {
      const { stdout } = await execAsync(`${registry.command} show "${skillName}" --json`, {
        timeout: 30000
      })

      const data = JSON.parse(stdout)
      return {
        ...data,
        source: registry.name,
        available: true
      }
    } catch (error) {
      console.warn(`${registry.name} get details failed:`, error.message)
      // Continue to next registry
    }
  }

  throw new AppError(
    ERR_NOT_FOUND,
    `技能 ${skillName} 在所有注册表中都未找到`
  )
}

/**
 * Assess skill installation risk
 * @param {Object} skillInfo - Skill information
 * @returns {Object} Risk assessment
 */
export function assessRisk(skillInfo) {
  const riskFactors = []
  let riskLevel = RISK_LEVELS.LOW
  let score = 0

  // Check permissions requested
  if (skillInfo.permissions) {
    const dangerousPermissions = ['exec', 'write', 'browser', 'nodes']
    const requested = skillInfo.permissions.filter(p => dangerousPermissions.includes(p))
    
    if (requested.length > 0) {
      riskFactors.push({
        type: 'permissions',
        level: RISK_LEVELS.MEDIUM,
        message: `请求敏感权限：${requested.join(', ')}`,
        permissions: requested
      })
      score += 20 * requested.length
    }
  }

  // Check external dependencies
  if (skillInfo.dependencies && skillInfo.dependencies.length > 5) {
    riskFactors.push({
      type: 'dependencies',
      level: RISK_LEVELS.LOW,
      message: `依赖较多 (${skillInfo.dependencies.length} 个)`,
      count: skillInfo.dependencies.length
    })
    score += 10
  }

  // Check network access
  if (skillInfo.networkAccess) {
    riskFactors.push({
      type: 'network',
      level: RISK_LEVELS.MEDIUM,
      message: '需要网络访问权限',
      urls: skillInfo.networkAccess
    })
    score += 15
  }

  // Check author verification
  if (!skillInfo.author || skillInfo.author === 'unknown') {
    riskFactors.push({
      type: 'author',
      level: RISK_LEVELS.MEDIUM,
      message: '作者信息未知'
    })
    score += 20
  }

  // Check license
  if (!skillInfo.license || skillInfo.license === 'UNKNOWN') {
    riskFactors.push({
      type: 'license',
      level: RISK_LEVELS.LOW,
      message: '许可证信息缺失'
    })
    score += 5
  }

  // Check if skill is from trusted source
  if (skillInfo.source === 'clawhub') {
    riskFactors.push({
      type: 'source',
      level: RISK_LEVELS.LOW,
      message: '来自公共注册表（未审核）'
    })
    score += 10
  }

  // Determine overall risk level
  if (score >= 60) {
    riskLevel = RISK_LEVELS.CRITICAL
  } else if (score >= 40) {
    riskLevel = RISK_LEVELS.HIGH
  } else if (score >= 20) {
    riskLevel = RISK_LEVELS.MEDIUM
  }

  return {
    level: riskLevel,
    score,
    factors: riskFactors,
    summary: getRiskSummary(riskLevel, riskFactors),
    recommendations: getRiskRecommendations(riskLevel, riskFactors)
  }
}

/**
 * Get risk summary message
 * @param {string} riskLevel - Risk level
 * @param {Array} riskFactors - Risk factors
 * @returns {string} Summary message
 */
function getRiskSummary(riskLevel, riskFactors) {
  switch (riskLevel) {
    case RISK_LEVELS.CRITICAL:
      return '⚠️ 高风险：建议仔细审查权限和来源'
    case RISK_LEVELS.HIGH:
      return '⚠️ 中高风险：存在多个风险因素'
    case RISK_LEVELS.MEDIUM:
      return '⚠️ 中等风险：请注意相关权限'
    case RISK_LEVELS.LOW:
      return '✅ 低风险：可以安全安装'
    default:
      return '未知风险等级'
  }
}

/**
 * Get risk recommendations
 * @param {string} riskLevel - Risk level
 * @param {Array} riskFactors - Risk factors
 * @returns {string[]} Recommendations
 */
function getRiskRecommendations(riskLevel, riskFactors) {
  const recommendations = []

  if (riskLevel === RISK_LEVELS.CRITICAL || riskLevel === RISK_LEVELS.HIGH) {
    recommendations.push('建议在测试环境中先安装验证')
    recommendations.push('审查技能源代码（如果可用）')
  }

  const permFactor = riskFactors.find(f => f.type === 'permissions')
  if (permFactor) {
    recommendations.push(`注意技能将拥有以下权限：${permFactor.permissions?.join(', ')}`)
  }

  const authorFactor = riskFactors.find(f => f.type === 'author')
  if (authorFactor) {
    recommendations.push('建议确认作者可信度')
  }

  return recommendations
}

/**
 * Install a skill
 * @param {Object} options - Installation options
 * @param {string} options.skillName - Skill name to install
 * @param {string} [options.version] - Specific version (optional, latest if not specified)
 * @param {string} [options.source] - Registry source (optional, auto-detect if not specified)
 * @param {boolean} [options.skipRiskCheck] - Skip risk assessment (not recommended)
 * @param {Function} [options.onProgress] - Progress callback
 * @param {Object} [options.config] - Skill configuration
 * @returns {Promise<Object>} Installation result
 */
export async function installSkill(options) {
  const {
    skillName,
    version,
    source,
    skipRiskCheck = false,
    onProgress,
    config
  } = options

  if (!skillName) {
    throw new AppError(ERR_INVALID_REQUEST, '技能名称不能为空')
  }

  // Emit start event
  skillInstallEmitter.emitProgress(skillName, {
    status: INSTALL_STATUS.PENDING,
    progress: 0,
    message: '准备安装...'
  })

  try {
    // Get skill details
    skillInstallEmitter.emitProgress(skillName, {
      status: INSTALL_STATUS.DOWNLOADING,
      progress: 10,
      message: '获取技能信息...'
    })

    const skillInfo = await getSkillDetails(skillName, source)
    
    // Risk assessment
    let riskAssessment = { level: RISK_LEVELS.UNKNOWN }
    if (!skipRiskCheck) {
      riskAssessment = assessRisk(skillInfo)
      
      // Block critical risk installations
      if (riskAssessment.level === RISK_LEVELS.CRITICAL) {
        throw new AppError(
          ERR_OPERATION_NOT_ALLOWED,
          `技能风险过高：${riskAssessment.summary}`
        )
      }
    }

    // Save to database before installation
    skillRepository.upsertSkill({
      name: skillName,
      version: version || skillInfo.version,
      description: skillInfo.description,
      source: skillInfo.source,
      author: skillInfo.author,
      license: skillInfo.license,
      dependencies: skillInfo.dependencies,
      configSchema: skillInfo.configSchema,
      status: 'installing'
    })

    // Execute installation command
    skillInstallEmitter.emitProgress(skillName, {
      status: INSTALL_STATUS.INSTALLING,
      progress: 40,
      message: `正在安装 ${skillName}...`,
      riskAssessment
    })

    const installCommand = version
      ? `${skillInfo.source} install "${skillName}@${version}"`
      : `${skillInfo.source} install "${skillName}"`

    const { stdout, stderr } = await execAsync(installCommand, {
      timeout: 300000, // 5 minute timeout for installation
      env: { ...process.env, FORCE_COLOR: '0' } // Disable colors for cleaner output
    })

    // Parse installation result
    const installResult = parseInstallOutput(stdout, stderr)

    if (!installResult.success) {
      throw new AppError(
        ERR_INTERNAL,
        installResult.error || '安装失败'
      )
    }

    // Update database with installation success
    const installedSkill = skillRepository.markSkillInstalled(
      skillName,
      installResult.version || version || skillInfo.version,
      installResult.location
    )

    // Apply configuration if provided
    if (config && installedSkill) {
      // Configuration application would happen here
      // This is a placeholder for future implementation
    }

    skillInstallEmitter.emitProgress(skillName, {
      status: INSTALL_STATUS.SUCCESS,
      progress: 100,
      message: '安装成功',
      version: installResult.version,
      location: installResult.location
    })

    skillInstallEmitter.emitComplete(skillName, {
      success: true,
      skill: installedSkill,
      riskAssessment,
      installResult
    })

    return {
      success: true,
      data: {
        skill: installedSkill,
        riskAssessment,
        installResult,
        installedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    // Update database with error status
    try {
      skillRepository.markSkillError(skillName)
    } catch (dbError) {
      console.error('Failed to update skill status in database:', dbError)
    }

    skillInstallEmitter.emitProgress(skillName, {
      status: INSTALL_STATUS.FAILED,
      progress: 0,
      message: `安装失败：${error.message}`,
      error: error.message
    })

    skillInstallEmitter.emitComplete(skillName, {
      success: false,
      error: error.message
    })

    throw error
  }
}

/**
 * Parse installation command output
 * @param {string} stdout - Standard output
 * @param {string} stderr - Standard error
 * @returns {Object} Parsed result
 */
function parseInstallOutput(stdout, stderr) {
  // Try to parse JSON output first
  try {
    const jsonMatch = stdout.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0])
      return {
        success: data.success !== false,
        version: data.version,
        location: data.location || data.path,
        error: data.error
      }
    }
  } catch (e) {
    // Not JSON, parse text output
  }

  // Parse text output
  const versionMatch = stdout.match(/version[:\s]+([0-9.]+)/i)
  const locationMatch = stdout.match(/(?:installed|location)[:\s]+([^\n]+)/i)
  const successMatch = stdout.match(/success|installed|complete/i)

  return {
    success: successMatch !== null && !stderr.includes('error'),
    version: versionMatch ? versionMatch[1] : null,
    location: locationMatch ? locationMatch[1].trim() : null,
    error: stderr || null
  }
}

/**
 * Update a skill
 * @param {Object} options - Update options
 * @param {string} options.skillName - Skill name to update
 * @param {string} [options.version] - Target version (optional, latest if not specified)
 * @param {string} [options.source] - Registry source
 * @param {Function} [options.onProgress] - Progress callback
 * @returns {Promise<Object>} Update result
 */
export async function updateSkill(options) {
  const { skillName, version, source, onProgress } = options

  if (!skillName) {
    throw new AppError(ERR_INVALID_REQUEST, '技能名称不能为空')
  }

  // Get current installed version
  const currentSkill = skillRepository.getSkillByName(skillName)
  if (!currentSkill || currentSkill.status !== 'installed') {
    throw new AppError(
      ERR_NOT_FOUND,
      `技能 ${skillName} 未安装或不存在`
    )
  }

  skillInstallEmitter.emitProgress(skillName, {
    status: INSTALL_STATUS.PENDING,
    progress: 0,
    message: '准备更新...',
    currentVersion: currentSkill.installedVersion
  })

  try {
    // Get latest version info
    skillInstallEmitter.emitProgress(skillName, {
      status: INSTALL_STATUS.DOWNLOADING,
      progress: 10,
      message: '检查最新版本...'
    })

    const skillInfo = await getSkillDetails(skillName, source || currentSkill.source)
    const targetVersion = version || skillInfo.version

    // Check if update is needed
    if (currentSkill.installedVersion === targetVersion && !version) {
      return {
        success: true,
        data: {
          skill: currentSkill,
          message: '已是最新版本',
          noUpdateNeeded: true
        }
      }
    }

    // Mark as updating
    skillRepository.markSkillUpdating(skillName)

    skillInstallEmitter.emitProgress(skillName, {
      status: INSTALL_STATUS.INSTALLING,
      progress: 40,
      message: `正在更新 ${skillName} ${currentSkill.installedVersion} → ${targetVersion}...`
    })

    // Execute update command
    const updateCommand = version
      ? `${skillInfo.source} update "${skillName}@${version}"`
      : `${skillInfo.source} update "${skillName}"`

    const { stdout, stderr } = await execAsync(updateCommand, {
      timeout: 300000,
      env: { ...process.env, FORCE_COLOR: '0' }
    })

    const updateResult = parseInstallOutput(stdout, stderr)

    if (!updateResult.success) {
      throw new AppError(
        ERR_INTERNAL,
        updateResult.error || '更新失败'
      )
    }

    // Update database
    const updatedSkill = skillRepository.updateSkillByName(skillName, {
      status: 'installed',
      installedVersion: targetVersion,
      latestVersion: targetVersion,
      location: updateResult.location || currentSkill.location
    })

    skillInstallEmitter.emitProgress(skillName, {
      status: INSTALL_STATUS.SUCCESS,
      progress: 100,
      message: '更新成功',
      version: targetVersion
    })

    skillInstallEmitter.emitComplete(skillName, {
      success: true,
      skill: updatedSkill
    })

    return {
      success: true,
      data: {
        skill: updatedSkill,
        fromVersion: currentSkill.installedVersion,
        toVersion: targetVersion,
        updatedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    skillRepository.markSkillError(skillName)

    skillInstallEmitter.emitProgress(skillName, {
      status: INSTALL_STATUS.FAILED,
      progress: 0,
      message: `更新失败：${error.message}`
    })

    skillInstallEmitter.emitComplete(skillName, {
      success: false,
      error: error.message
    })

    throw error
  }
}

/**
 * Check for available updates for installed skills
 * @returns {Promise<Object[]>} List of skills with available updates
 */
export async function checkAvailableUpdates() {
  const installedSkills = skillRepository.getInstalledSkills()
  const updates = []

  for (const skill of installedSkills) {
    try {
      const skillInfo = await getSkillDetails(skill.name, skill.source)
      
      if (skillInfo.version && skillInfo.version !== skill.installedVersion) {
        const riskAssessment = assessRisk(skillInfo)
        
        updates.push({
          name: skill.name,
          currentVersion: skill.installedVersion,
          latestVersion: skillInfo.version,
          source: skill.source,
          description: skillInfo.description,
          riskAssessment,
          publishedAt: skillInfo.publishedAt
        })

        // Update database with latest version info
        skillRepository.checkSkillUpdate(skill.name, skillInfo.version)
      }
    } catch (error) {
      console.warn(`Failed to check updates for ${skill.name}:`, error.message)
      // Continue checking other skills
    }
  }

  return updates
}

/**
 * Get installation history
 * @param {Object} options - Query options
 * @param {string} [options.skillName] - Filter by skill name
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.limit=50] - Max results
 * @param {number} [options.offset=0] - Offset
 * @returns {Object[]} Installation history records
 */
export function getInstallationHistory(options = {}) {
  const { skillName, status, limit = 50, offset = 0 } = options
  
  // Query from database
  const filters = {}
  if (status) {
    filters.status = status
  }
  
  let skills = skillRepository.getAllSkills({
    ...filters,
    limit,
    offset
  })

  // Filter by skill name if specified
  if (skillName) {
    skills = skills.filter(s => s.name.toLowerCase().includes(skillName.toLowerCase()))
  }

  return skills.map(skill => ({
    name: skill.name,
    version: skill.installedVersion,
    source: skill.source,
    status: skill.status,
    installedAt: skill.installed_at,
    updatedAt: skill.updated_at,
    author: skill.author,
    license: skill.license
  }))
}

/**
 * Batch install multiple skills
 * @param {Object[]} skills - Array of skill installation requests
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object[]>} Installation results
 */
export async function batchInstall(skills, onProgress) {
  const results = []
  const total = skills.length

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i]
    
    if (onProgress) {
      onProgress({
        batch: true,
        current: i + 1,
        total,
        skillName: skill.skillName,
        status: 'processing'
      })
    }

    try {
      const result = await installSkill({
        ...skill,
        onProgress: (data) => {
          if (onProgress) {
            onProgress({
              batch: true,
              current: i + 1,
              total,
              ...data
            })
          }
        }
      })

      results.push({
        skillName: skill.skillName,
        success: true,
        data: result.data
      })
    } catch (error) {
      results.push({
        skillName: skill.skillName,
        success: false,
        error: error.message
      })
    }
  }

  return results
}

/**
 * Uninstall a skill
 * @param {string} skillName - Skill name to uninstall
 * @returns {Promise<Object>} Uninstallation result
 */
export async function uninstallSkill(skillName) {
  if (!skillName) {
    throw new AppError(ERR_INVALID_REQUEST, '技能名称不能为空')
  }

  const currentSkill = skillRepository.getSkillByName(skillName)
  if (!currentSkill) {
    throw new AppError(ERR_NOT_FOUND, `技能 ${skillName} 不存在`)
  }

  try {
    // Execute uninstall command
    const { stdout, stderr } = await execAsync(`${currentSkill.source} uninstall "${skillName}"`, {
      timeout: 60000
    })

    // Update database
    skillRepository.uninstallSkill(skillName)

    return {
      success: true,
      data: {
        skillName,
        uninstalledAt: new Date().toISOString()
      }
    }
  } catch (error) {
    throw new AppError(
      ERR_INTERNAL,
      `卸载失败：${error.message}`
    )
  }
}

export default {
  searchSkills,
  getSkillDetails,
  assessRisk,
  installSkill,
  updateSkill,
  checkAvailableUpdates,
  getInstallationHistory,
  batchInstall,
  uninstallSkill,
  skillInstallEmitter,
  createProgressCallback,
  RISK_LEVELS,
  INSTALL_STATUS,
  REGISTRIES
}
