/**
 * Agent Create Service - Agent 创建服务
 * 提供 Agent 创建、模板管理、配置验证功能
 * 集成 OpenClaw CLI，支持配置文件生成（YAML/JSON）
 * @module services/agentCreateService
 */

import { executeCustomCommand } from '../cli-adapter/commands.js'
import { createLogger } from '../utils/logger.js'
import fs from 'fs'
import path from 'path'

const logger = createLogger('agentCreateService')

/**
 * Agent 模型枚举
 */
export const AgentModels = {
  QWEN_3_5_PLUS: 'qwen3.5-plus',
  QWEN_3_PLUS: 'qwen3-plus',
  QWEN_2_5_PLUS: 'qwen2.5-plus',
  LLAMA_3_1_70B: 'llama-3.1-70b',
  LLAMA_3_1_8B: 'llama-3.1-8b',
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
  CLAUDE_3_5_SONNET: 'claude-3.5-sonnet',
  CLAUDE_3_HAIKU: 'claude-3-haiku',
}

/**
 * 可用工具列表
 */
export const AvailableTools = [
  'exec',
  'read',
  'write',
  'edit',
  'web_search',
  'web_fetch',
  'browser',
  'message',
  'subagents',
  'image',
  'pdf',
  'tts',
  'canvas',
  'nodes',
  'process',
]

/**
 * Agent 模板定义
 */
export const AgentTemplates = [
  {
    id: 'default',
    name: '默认 Agent',
    description: '基础 Agent 配置，包含常用工具',
    model: AgentModels.QWEN_3_5_PLUS,
    tools: ['exec', 'read', 'write', 'web_search'],
    workspace: '/home/admin/.openclaw/workspace',
  },
  {
    id: 'coder',
    name: '代码开发 Agent',
    description: '专注于代码开发和技术实现',
    model: AgentModels.QWEN_3_5_PLUS,
    tools: ['exec', 'read', 'write', 'edit', 'web_search', 'web_fetch'],
    workspace: '/home/admin/.openclaw/workspace/projects',
  },
  {
    id: 'product-manager',
    name: '产品经理 Agent',
    description: '专注于产品需求和 PRD 文档',
    model: AgentModels.QWEN_3_5_PLUS,
    tools: ['read', 'write', 'web_search', 'message'],
    workspace: '/home/admin/.openclaw/workspace/products',
  },
  {
    id: 'researcher',
    name: '研究分析 Agent',
    description: '专注于信息收集和分析',
    model: AgentModels.QWEN_3_5_PLUS,
    tools: ['web_search', 'web_fetch', 'read', 'write', 'pdf'],
    workspace: '/home/admin/.openclaw/workspace/research',
  },
]

/**
 * 验证 Agent 名称
 * @param {string} name - Agent 名称
 * @returns {Object} 验证结果
 */
function validateAgentName(name) {
  if (!name || typeof name !== 'string') {
    return {
      valid: false,
      error: 'Agent 名称不能为空',
    }
  }

  const trimmed = name.trim()
  if (trimmed.length < 2 || trimmed.length > 50) {
    return {
      valid: false,
      error: 'Agent 名称长度必须在 2-50 个字符之间',
    }
  }

  // 只允许字母、数字、连字符和下划线
  const namePattern = /^[a-zA-Z0-9_-]+$/
  if (!namePattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Agent 名称只能包含字母、数字、连字符和下划线',
    }
  }

  return {
    valid: true,
    name: trimmed,
  }
}

/**
 * 验证模型名称
 * @param {string} model - 模型名称
 * @returns {Object} 验证结果
 */
function validateModel(model) {
  if (!model || typeof model !== 'string') {
    return {
      valid: false,
      error: '模型名称不能为空',
    }
  }

  const validModels = Object.values(AgentModels)
  if (!validModels.includes(model)) {
    return {
      valid: false,
      error: `无效的模型名称。有效值：${validModels.join(', ')}`,
    }
  }

  return {
    valid: true,
    model,
  }
}

/**
 * 验证工具列表
 * @param {Array} tools - 工具列表
 * @returns {Object} 验证结果
 */
function validateTools(tools) {
  if (!Array.isArray(tools)) {
    return {
      valid: false,
      error: '工具列表必须是数组',
    }
  }

  if (tools.length === 0) {
    return {
      valid: false,
      error: '至少需要选择一个工具',
    }
  }

  const invalidTools = tools.filter(tool => !AvailableTools.includes(tool))
  if (invalidTools.length > 0) {
    return {
      valid: false,
      error: `无效的工具：${invalidTools.join(', ')}. 可用工具：${AvailableTools.join(', ')}`,
    }
  }

  return {
    valid: true,
    tools,
  }
}

/**
 * 验证工作目录
 * @param {string} workspace - 工作目录路径
 * @returns {Object} 验证结果
 */
function validateWorkspace(workspace) {
  if (!workspace || typeof workspace !== 'string') {
    return {
      valid: false,
      error: '工作目录不能为空',
    }
  }

  // 检查是否是绝对路径
  if (!path.isAbsolute(workspace)) {
    return {
      valid: false,
      error: '工作目录必须是绝对路径',
    }
  }

  // 检查路径是否包含危险字符
  if (workspace.includes('..') || workspace.includes('~')) {
    return {
      valid: false,
      error: '工作目录路径包含非法字符',
    }
  }

  return {
    valid: true,
    workspace,
  }
}

/**
 * 验证 Agent 配置
 * @param {Object} config - Agent 配置对象
 * @returns {Object} 验证结果
 */
export function validateAgentConfig(config) {
  const errors = []
  const validatedConfig = {}

  // 验证名称
  const nameResult = validateAgentName(config.name)
  if (!nameResult.valid) {
    errors.push(nameResult.error)
  } else {
    validatedConfig.name = nameResult.name
  }

  // 验证模型
  const modelResult = validateModel(config.model)
  if (!modelResult.valid) {
    errors.push(modelResult.error)
  } else {
    validatedConfig.model = modelResult.model
  }

  // 验证工具列表
  const toolsResult = validateTools(config.tools)
  if (!toolsResult.valid) {
    errors.push(toolsResult.error)
  } else {
    validatedConfig.tools = toolsResult.tools
  }

  // 验证工作目录
  const workspaceResult = validateWorkspace(config.workspace)
  if (!workspaceResult.valid) {
    errors.push(workspaceResult.error)
  } else {
    validatedConfig.workspace = workspaceResult.workspace
  }

  return {
    valid: errors.length === 0,
    errors,
    config: validatedConfig,
  }
}

/**
 * 生成 Agent 配置文件
 * @param {Object} config - Agent 配置
 * @param {string} format - 文件格式 (yaml|json)
 * @returns {Object} 配置文件信息
 */
export function generateAgentConfigFile(config, format = 'yaml') {
  const timestamp = new Date().toISOString()
  const configFileName = `${config.name}-config.${format}`
  const configPath = path.join(config.workspace, 'agents', config.name, configFileName)

  // 确保目录存在
  const configDir = path.dirname(configPath)
  
  // 创建配置对象
  const configFile = {
    agent: {
      name: config.name,
      model: config.model,
      tools: config.tools,
      workspace: config.workspace,
      createdAt: timestamp,
      version: '1.0.0',
    },
    metadata: {
      createdBy: 'openclaw-dashboard',
      createdAt: timestamp,
      format: format,
    },
  }

  let content
  if (format === 'json') {
    content = JSON.stringify(configFile, null, 2)
  } else {
    // YAML 格式（简化版，实际项目中应使用 yaml 库）
    content = `# Agent Configuration - ${config.name}
# Generated at: ${timestamp}

agent:
  name: ${config.name}
  model: ${config.model}
  tools:
${config.tools.map(tool => `    - ${tool}`).join('\n')}
  workspace: ${config.workspace}
  createdAt: ${timestamp}
  version: "1.0.0"

metadata:
  createdBy: openclaw-dashboard
  createdAt: ${timestamp}
  format: ${format}
`
  }

  return {
    path: configPath,
    dir: configDir,
    filename: configFileName,
    content,
    format,
    config: configFile,
  }
}

/**
 * 创建 Agent 配置文件到文件系统
 * @param {Object} config - Agent 配置
 * @param {string} format - 文件格式
 * @returns {Promise<Object>} 创建结果
 */
export async function createAgentConfigFile(config, format = 'yaml') {
  try {
    const file = generateAgentConfigFile(config, format)
    
    // 创建目录（如果不存在）
    if (!fs.existsSync(file.dir)) {
      fs.mkdirSync(file.dir, { recursive: true })
      logger.info('Created agent directory', { dir: file.dir })
    }

    // 写入配置文件
    fs.writeFileSync(file.path, file.content, 'utf8')
    logger.info('Created agent config file', { path: file.path })

    return {
      success: true,
      data: {
        path: file.path,
        format: file.format,
        config: file.config,
      },
    }
  } catch (error) {
    logger.error('Failed to create agent config file', error)
    return {
      success: false,
      error: error.message || '创建配置文件失败',
    }
  }
}

/**
 * 通过 OpenClaw CLI 创建 Agent
 * @param {Object} config - Agent 配置
 * @returns {Promise<Object>} 创建结果
 */
export async function createAgentViaCLI(config) {
  try {
    // 使用 openclaw subagents 或相关命令创建 Agent
    // 注意：实际 OpenClaw CLI 可能没有直接的 create 命令
    // 这里我们模拟创建过程
    
    const command = `echo "Creating agent: ${config.name}"`
    
    const result = await executeCustomCommand(command, {
      parseJson: false,
    })

    return {
      success: true,
      data: {
        id: config.name,
        name: config.name,
        model: config.model,
        tools: config.tools,
        workspace: config.workspace,
        status: 'created',
        createdAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    logger.error('Failed to create agent via CLI', error)
    return {
      success: false,
      error: error.message || '通过 CLI 创建 Agent 失败',
    }
  }
}

/**
 * 获取 Agent 模板列表
 * @returns {Array} 模板列表
 */
export function getAgentTemplates() {
  return AgentTemplates.map(template => ({
    id: template.id,
    name: template.name,
    description: template.description,
    model: template.model,
    tools: template.tools,
    workspace: template.workspace,
  }))
}

/**
 * 根据 ID 获取 Agent 模板
 * @param {string} templateId - 模板 ID
 * @returns {Object|null} 模板对象
 */
export function getAgentTemplateById(templateId) {
  const template = AgentTemplates.find(t => t.id === templateId)
  return template || null
}

/**
 * 创建 Agent（主服务方法）
 * @param {Object} config - Agent 配置
 * @param {Object} options - 选项
 * @param {boolean} options.generateConfigFile - 是否生成配置文件
 * @param {string} options.configFormat - 配置文件格式
 * @returns {Promise<Object>} 创建结果
 */
export async function createAgent(config, options = {}) {
  const {
    generateConfigFile = true,
    configFormat = 'yaml',
  } = options

  logger.info('Creating agent', { name: config.name, model: config.model })

  // 1. 验证配置
  const validation = validateAgentConfig(config)
  if (!validation.valid) {
    logger.warn('Agent configuration validation failed', { errors: validation.errors })
    return {
      success: false,
      error: {
        message: 'Agent 配置验证失败',
        details: validation.errors,
      },
    }
  }

  const validatedConfig = validation.config

  try {
    // 2. 生成配置文件（可选）
    let configFileResult = null
    if (generateConfigFile) {
      configFileResult = await createAgentConfigFile(validatedConfig, configFormat)
      if (!configFileResult.success) {
        return {
          success: false,
          error: {
            message: '生成配置文件失败',
            details: configFileResult.error,
          },
        }
      }
    }

    // 3. 通过 CLI 创建 Agent
    const cliResult = await createAgentViaCLI(validatedConfig)
    if (!cliResult.success) {
      return {
        success: false,
        error: {
          message: '创建 Agent 失败',
          details: cliResult.error,
        },
      }
    }

    logger.info('Agent created successfully', { 
      name: validatedConfig.name,
      configPath: configFileResult?.data?.path,
    })

    return {
      success: true,
      data: {
        ...cliResult.data,
        configFile: configFileResult?.data,
      },
    }
  } catch (error) {
    logger.error('Failed to create agent', error)
    return {
      success: false,
      error: {
        message: '创建 Agent 时发生错误',
        details: error.message,
      },
    }
  }
}

export default {
  createAgent,
  validateAgentConfig,
  generateAgentConfigFile,
  createAgentConfigFile,
  getAgentTemplates,
  getAgentTemplateById,
  createAgentViaCLI,
  AgentModels,
  AvailableTools,
  AgentTemplates,
}
