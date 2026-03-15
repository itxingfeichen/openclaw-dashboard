/**
 * CLI 输出 Schema 校验
 * 验证 CLI 命令输出格式，提供友好的错误提示
 */

import type { ValidationResult, SchemaDefinition } from './types.js'

/**
 * Schema 映射表
 */
const schemaMap: Record<string, SchemaDefinition> = {
  'openclaw status': {
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
  },
  'openclaw agents list': {
    required: ['agents'],
    optional: ['count', 'timestamp'],
    nested: {
      agents: {
        type: 'array',
        itemSchema: {
          required: ['id', 'name', 'status'],
          optional: [
            'type',
            'description',
            'createdAt',
            'updatedAt',
            'workspace',
            'agentDir',
            'model',
            'routingRules',
          ],
        },
      },
    },
  },
  'openclaw sessions --json': {
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
  },
  'openclaw cron list': {
    required: ['tasks'],
    optional: ['count', 'timestamp'],
    nested: {
      tasks: {
        type: 'array',
        itemSchema: {
          required: ['id', 'schedule', 'enabled'],
          optional: [
            'name',
            'description',
            'command',
            'lastRun',
            'nextRun',
            'status',
            'target',
            'agentId',
            'model',
          ],
        },
      },
    },
  },
  'openclaw config get': {
    required: [],
    optional: ['config', 'settings', 'value', 'key'],
  },
}

/**
 * 验证数据结构
 * @param data - 要验证的数据
 * @param schema - Schema 定义
 * @returns 验证结果
 */
function validateSchema(
  data: any,
  schema: SchemaDefinition
): ValidationResult {
  const errors: string[] = []

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
          } else if (nestedSchema.itemSchema) {
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
 * @param command - 执行的命令
 * @param data - CLI 输出数据
 * @returns 验证结果
 */
export function validateCliOutput(
  command: string,
  data: any
): ValidationResult {
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
 * @param result - 验证结果
 * @param command - 执行的命令
 * @returns 友好的错误消息
 */
export function formatValidationError(
  result: ValidationResult,
  command: string
): string {
  if (result.valid) {
    return '验证通过'
  }

  const errorMessages = result.errors.join('; ')
  return `CLI 输出格式验证失败 (${command}): ${errorMessages}`
}

/**
 * 获取所有已注册的 Schema
 */
export function getSchemas(): Record<string, SchemaDefinition> {
  return { ...schemaMap }
}

/**
 * 注册新的 Schema
 * @param command - 命令字符串
 * @param schema - Schema 定义
 */
export function registerSchema(
  command: string,
  schema: SchemaDefinition
): void {
  schemaMap[command] = schema
}

const schemaDefault = {
  validateCliOutput,
  formatValidationError,
  getSchemas,
  registerSchema,
  schemas: schemaMap,
}

export default schemaDefault
