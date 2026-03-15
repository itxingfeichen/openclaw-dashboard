/**
 * CLI 输出 Schema 校验
 * 验证 CLI 命令输出格式，提供友好的错误提示
 */

/**
 * Schema 验证结果
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - 是否通过验证
 * @property {string[]} errors - 错误列表
 */

/**
 * 基础响应 Schema
 */
const baseResponseSchema = {
  required: [],
  optional: ['timestamp', 'version'],
}

/**
 * Agent 列表响应 Schema
 */
const agentsListSchema = {
  required: ['agents'],
  optional: ['count', 'timestamp'],
  nested: {
    agents: {
      type: 'array',
      itemSchema: {
        required: ['id', 'name', 'status'],
        optional: ['type', 'description', 'createdAt', 'updatedAt'],
      },
    },
  },
}

/**
 * 会话列表响应 Schema
 */
const sessionsListSchema = {
  required: ['sessions'],
  optional: ['count', 'timestamp', 'path', 'activeMinutes'],
  nested: {
    sessions: {
      type: 'array',
      itemSchema: {
        required: ['key'],
        optional: [
          'updatedAt',
          'ageMs',
          'sessionId',
          'systemSent',
          'abortedLastRun',
          'inputTokens',
          'outputTokens',
          'totalTokens',
          'totalTokensFresh',
          'model',
          'modelProvider',
          'contextTokens',
          'agentId',
          'kind',
        ],
      },
    },
  },
}

/**
 * 定时任务列表响应 Schema
 */
const cronListSchema = {
  required: ['tasks'],
  optional: ['count', 'timestamp'],
  nested: {
    tasks: {
      type: 'array',
      itemSchema: {
        required: ['id', 'schedule', 'enabled'],
        optional: ['name', 'description', 'command', 'lastRun', 'nextRun'],
      },
    },
  },
}

/**
 * 系统状态响应 Schema
 */
const statusSchema = {
  required: ['status'],
  optional: [
    'version',
    'uptime',
    'timestamp',
    'gateway',
    'agents',
    'sessions',
    'node',
  ],
}

/**
 * 配置响应 Schema
 */
const configSchema = {
  required: [],
  optional: ['config', 'settings'],
}

/**
 * 工具执行响应 Schema
 */
const toolExecutionSchema = {
  required: ['success', 'tool'],
  optional: ['data', 'error', 'exitCode', 'validation'],
}

/**
 * 记忆搜索响应 Schema
 */
const memorySearchSchema = {
  required: ['success'],
  optional: ['data', 'error', 'query'],
  nested: {
    data: {
      type: 'object',
      itemSchema: {
        required: [],
        optional: ['results', 'count', 'query'],
      },
    },
  },
}

/**
 * 会话列表响应 Schema (增强版)
 */
const sessionsListEnhancedSchema = {
  required: ['sessions'],
  optional: ['count', 'timestamp', 'path', 'activeMinutes'],
  nested: {
    sessions: {
      type: 'array',
      itemSchema: {
        required: ['key'],
        optional: [
          'updatedAt',
          'ageMs',
          'sessionId',
          'systemSent',
          'abortedLastRun',
          'inputTokens',
          'outputTokens',
          'totalTokens',
          'totalTokensFresh',
          'model',
          'modelProvider',
          'contextTokens',
          'agentId',
          'kind',
        ],
      },
    },
  },
}

/**
 * Agent 状态响应 Schema
 */
const agentStatusSchema = {
  required: ['id', 'status'],
  optional: ['pid', 'uptime', 'workspace', 'model', 'startedAt', 'stoppedAt'],
}

/**
 * Schema 映射表
 */
const schemaMap = {
  'openclaw status': statusSchema,
  'openclaw agents list': agentsListSchema,
  'openclaw sessions --json': sessionsListEnhancedSchema,
  'openclaw cron list': cronListSchema,
  'openclaw config get': configSchema,
  // 工具执行
  'openclaw read': toolExecutionSchema,
  'openclaw write': toolExecutionSchema,
  'openclaw edit': toolExecutionSchema,
  'openclaw exec': toolExecutionSchema,
  'openclaw browser snapshot': toolExecutionSchema,
  'openclaw browser act': toolExecutionSchema,
  'openclaw browser navigate': toolExecutionSchema,
  'openclaw process list': toolExecutionSchema,
  'openclaw process send-keys': toolExecutionSchema,
  'openclaw process kill': toolExecutionSchema,
  'openclaw nodes status': toolExecutionSchema,
  'openclaw nodes notify': toolExecutionSchema,
  'openclaw message send': toolExecutionSchema,
  'openclaw web_search': toolExecutionSchema,
  'openclaw web_fetch': toolExecutionSchema,
  // 记忆操作
  'openclaw memory search': memorySearchSchema,
  'openclaw memory get': memorySearchSchema,
  'openclaw memory reindex': toolExecutionSchema,
  'openclaw memory status': toolExecutionSchema,
  // Agent 操作
  'openclaw agents status': agentStatusSchema,
  'openclaw agents create': toolExecutionSchema,
  'openclaw agents delete': toolExecutionSchema,
  'openclaw agents config': toolExecutionSchema,
}

/**
 * 验证数据结构
 * @param {any} data - 要验证的数据
 * @param {Object} schema - Schema 定义
 * @returns {ValidationResult} 验证结果
 */
function validateSchema(data, schema) {
  const errors = []

  if (!data || typeof data !== 'object') {
    errors.push('Response must be an object')
    return { valid: false, errors }
  }

  // 检查必需字段
  for (const field of schema.required) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`)
    }
  }

  // 检查嵌套结构
  if (schema.nested) {
    for (const [key, nestedSchema] of Object.entries(schema.nested)) {
      if (data[key] !== undefined) {
        if (nestedSchema.type === 'array') {
          if (!Array.isArray(data[key])) {
            errors.push(`Field '${key}' must be an array`)
          } else {
            // 验证数组项
            for (let i = 0; i < data[key].length; i++) {
              const item = data[key][i]
              const itemErrors = validateSchema(item, nestedSchema.itemSchema)
              if (!itemErrors.valid) {
                errors.push(
                  ...itemErrors.errors.map((e) => `${key}[${i}]: ${e}`)
                )
              }
            }
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 验证 CLI 输出
 * @param {string} command - 执行的命令
 * @param {any} data - CLI 输出数据
 * @returns {ValidationResult} 验证结果
 */
export function validateCliOutput(command, data) {
  const schema = schemaMap[command]

  if (!schema) {
    // 没有定义 Schema 的命令，只检查基本格式
    return {
      valid: true,
      errors: [],
    }
  }

  return validateSchema(data, schema)
}

/**
 * 格式化验证错误为友好提示
 * @param {ValidationResult} result - 验证结果
 * @param {string} command - 执行的命令
 * @returns {string} 友好的错误消息
 */
export function formatValidationError(result, command) {
  if (result.valid) {
    return '验证通过'
  }

  const errorMessages = result.errors.join('; ')
  return `CLI 输出格式验证失败 (${command}): ${errorMessages}`
}

export default {
  validateCliOutput,
  formatValidationError,
  schemas: schemaMap,
}
