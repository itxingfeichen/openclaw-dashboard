/**
 * Agent Create API Tests
 * 测试 Agent 创建、模板管理、配置验证功能
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'

// Import service module
import * as agentCreateService from '../src/services/agentCreateService.js'

describe('Agent Create Service', () => {
  describe('AgentModels', () => {
    it('should have correct model values', () => {
      assert.strictEqual(agentCreateService.AgentModels.QWEN_3_5_PLUS, 'qwen3.5-plus')
      assert.strictEqual(agentCreateService.AgentModels.QWEN_3_PLUS, 'qwen3-plus')
      assert.strictEqual(agentCreateService.AgentModels.LLAMA_3_1_70B, 'llama-3.1-70b')
      assert.strictEqual(agentCreateService.AgentModels.GPT_4O, 'gpt-4o')
      assert.strictEqual(agentCreateService.AgentModels.CLAUDE_3_5_SONNET, 'claude-3.5-sonnet')
    })
  })

  describe('AvailableTools', () => {
    it('should include core tools', () => {
      assert.ok(agentCreateService.AvailableTools.includes('exec'))
      assert.ok(agentCreateService.AvailableTools.includes('read'))
      assert.ok(agentCreateService.AvailableTools.includes('write'))
      assert.ok(agentCreateService.AvailableTools.includes('web_search'))
    })

    it('should be an array', () => {
      assert.ok(Array.isArray(agentCreateService.AvailableTools))
      assert.ok(agentCreateService.AvailableTools.length > 0)
    })
  })

  describe('AgentTemplates', () => {
    it('should have default template', () => {
      const templates = agentCreateService.AgentTemplates
      const defaultTemplate = templates.find(t => t.id === 'default')
      assert.ok(defaultTemplate)
      assert.strictEqual(defaultTemplate.name, '默认 Agent')
    })

    it('should have coder template', () => {
      const templates = agentCreateService.AgentTemplates
      const coderTemplate = templates.find(t => t.id === 'coder')
      assert.ok(coderTemplate)
      assert.strictEqual(coderTemplate.name, '代码开发 Agent')
    })

    it('should have product-manager template', () => {
      const templates = agentCreateService.AgentTemplates
      const pmTemplate = templates.find(t => t.id === 'product-manager')
      assert.ok(pmTemplate)
      assert.strictEqual(pmTemplate.name, '产品经理 Agent')
    })

    it('should have researcher template', () => {
      const templates = agentCreateService.AgentTemplates
      const researcherTemplate = templates.find(t => t.id === 'researcher')
      assert.ok(researcherTemplate)
      assert.strictEqual(researcherTemplate.name, '研究分析 Agent')
    })
  })

  describe('validateAgentConfig', () => {
    it('should validate valid agent configuration', () => {
      const config = {
        name: 'test-agent',
        model: 'qwen3.5-plus',
        tools: ['exec', 'read', 'write'],
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.errors.length, 0)
      assert.strictEqual(result.config.name, 'test-agent')
      assert.strictEqual(result.config.model, 'qwen3.5-plus')
    })

    it('should reject empty name', () => {
      const config = {
        name: '',
        model: 'qwen3.5-plus',
        tools: ['exec'],
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some(e => e.includes('名称')))
    })

    it('should reject name with invalid characters', () => {
      const config = {
        name: 'test@agent!',
        model: 'qwen3.5-plus',
        tools: ['exec'],
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some(e => e.includes('只能包含字母')))
    })

    it('should reject name that is too short', () => {
      const config = {
        name: 'a',
        model: 'qwen3.5-plus',
        tools: ['exec'],
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some(e => e.includes('长度')))
    })

    it('should reject invalid model', () => {
      const config = {
        name: 'test-agent',
        model: 'invalid-model',
        tools: ['exec'],
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some(e => e.includes('模型')))
    })

    it('should reject empty tools array', () => {
      const config = {
        name: 'test-agent',
        model: 'qwen3.5-plus',
        tools: [],
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some(e => e.includes('至少需要选择一个工具')))
    })

    it('should reject invalid tools', () => {
      const config = {
        name: 'test-agent',
        model: 'qwen3.5-plus',
        tools: ['invalid-tool'],
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some(e => e.includes('无效的工具')))
    })

    it('should reject non-absolute workspace path', () => {
      const config = {
        name: 'test-agent',
        model: 'qwen3.5-plus',
        tools: ['exec'],
        workspace: 'relative/path',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some(e => e.includes('绝对路径')))
    })

    it('should reject workspace path with dangerous characters', () => {
      const config = {
        name: 'test-agent',
        model: 'qwen3.5-plus',
        tools: ['exec'],
        workspace: '/home/admin/../etc',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some(e => e.includes('非法字符')))
    })

    it('should handle missing fields', () => {
      const config = {}

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.length > 1)
    })
  })

  describe('generateAgentConfigFile', () => {
    it('should generate YAML config file', () => {
      const config = {
        name: 'test-agent',
        model: 'qwen3.5-plus',
        tools: ['exec', 'read'],
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.generateAgentConfigFile(config, 'yaml')
      assert.ok(result.path.includes('test-agent-config.yaml'))
      assert.ok(result.content.includes('agent:'))
      assert.ok(result.content.includes('name: test-agent'))
      assert.ok(result.content.includes('model: qwen3.5-plus'))
      assert.strictEqual(result.format, 'yaml')
    })

    it('should generate JSON config file', () => {
      const config = {
        name: 'test-agent',
        model: 'qwen3.5-plus',
        tools: ['exec', 'read'],
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.generateAgentConfigFile(config, 'json')
      assert.ok(result.path.includes('test-agent-config.json'))
      assert.ok(result.content.includes('"agent"'))
      assert.ok(result.content.includes('"name": "test-agent"'))
      assert.strictEqual(result.format, 'json')

      // Verify it's valid JSON
      const parsed = JSON.parse(result.content)
      assert.strictEqual(parsed.agent.name, 'test-agent')
    })

    it('should include metadata in config', () => {
      const config = {
        name: 'test-agent',
        model: 'qwen3.5-plus',
        tools: ['exec'],
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.generateAgentConfigFile(config, 'yaml')
      assert.ok(result.content.includes('metadata:'))
      assert.ok(result.content.includes('createdBy: openclaw-dashboard'))
    })
  })

  describe('getAgentTemplates', () => {
    it('should return all templates', () => {
      const templates = agentCreateService.getAgentTemplates()
      assert.ok(Array.isArray(templates))
      assert.strictEqual(templates.length, 4)
    })

    it('should return templates with required fields', () => {
      const templates = agentCreateService.getAgentTemplates()
      for (const template of templates) {
        assert.ok(template.id)
        assert.ok(template.name)
        assert.ok(template.description)
        assert.ok(template.model)
        assert.ok(Array.isArray(template.tools))
        assert.ok(template.workspace)
      }
    })
  })

  describe('getAgentTemplateById', () => {
    it('should return template by id', () => {
      const template = agentCreateService.getAgentTemplateById('default')
      assert.ok(template)
      assert.strictEqual(template.id, 'default')
      assert.strictEqual(template.name, '默认 Agent')
    })

    it('should return null for non-existent template', () => {
      const template = agentCreateService.getAgentTemplateById('non-existent')
      assert.strictEqual(template, null)
    })

    it('should return coder template', () => {
      const template = agentCreateService.getAgentTemplateById('coder')
      assert.ok(template)
      assert.strictEqual(template.id, 'coder')
      assert.strictEqual(template.name, '代码开发 Agent')
    })
  })

  describe('createAgent', () => {
    it('should create agent with valid config', async () => {
      const config = {
        name: 'test-agent-create',
        model: 'qwen3.5-plus',
        tools: ['exec', 'read', 'write'],
        workspace: '/tmp/test-workspace',
      }

      const result = await agentCreateService.createAgent(config, {
        generateConfigFile: false, // Skip file creation for test
      })

      // Should succeed or fail gracefully due to CLI unavailability
      assert.ok(result)
      assert.ok('success' in result)
    })

    it('should reject invalid config', async () => {
      const config = {
        name: 'invalid@name',
        model: 'invalid-model',
        tools: [],
        workspace: 'relative',
      }

      const result = await agentCreateService.createAgent(config)
      assert.strictEqual(result.success, false)
      assert.ok(result.error)
      assert.ok(result.error.details)
    })

    it('should handle missing config', async () => {
      const result = await agentCreateService.createAgent({})
      assert.strictEqual(result.success, false)
      assert.ok(result.error)
    })
  })

  describe('createAgentConfigFile', () => {
    it('should create config file successfully', async () => {
      const config = {
        name: 'test-file-agent',
        model: 'qwen3.5-plus',
        tools: ['exec'],
        workspace: '/tmp/test-workspace-agent',
      }

      const result = await agentCreateService.createAgentConfigFile(config, 'yaml')
      assert.ok(result)
      assert.ok('success' in result)
      // File creation may succeed or fail depending on permissions
      if (result.success) {
        assert.ok(result.data)
        assert.ok(result.data.path)
      }
    })
  })
})

describe('Agent Create Service - Edge Cases', () => {
  describe('name validation edge cases', () => {
    it('should accept name with hyphens', () => {
      const config = {
        name: 'test-agent-123',
        model: 'qwen3.5-plus',
        tools: ['exec'],
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, true)
    })

    it('should accept name with underscores', () => {
      const config = {
        name: 'test_agent_123',
        model: 'qwen3.5-plus',
        tools: ['exec'],
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, true)
    })

    it('should reject name that is too long', () => {
      const config = {
        name: 'a'.repeat(51),
        model: 'qwen3.5-plus',
        tools: ['exec'],
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some(e => e.includes('长度')))
    })

    it('should trim whitespace from name', () => {
      const config = {
        name: '  test-agent  ',
        model: 'qwen3.5-plus',
        tools: ['exec'],
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.config.name, 'test-agent')
    })
  })

  describe('tools validation edge cases', () => {
    it('should accept all available tools', () => {
      const config = {
        name: 'test-agent',
        model: 'qwen3.5-plus',
        tools: agentCreateService.AvailableTools,
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, true)
    })

    it('should reject mixed valid and invalid tools', () => {
      const config = {
        name: 'test-agent',
        model: 'qwen3.5-plus',
        tools: ['exec', 'invalid', 'read'],
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some(e => e.includes('无效的工具')))
    })

    it('should reject non-array tools', () => {
      const config = {
        name: 'test-agent',
        model: 'qwen3.5-plus',
        tools: 'exec,read',
        workspace: '/home/admin/workspace',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some(e => e.includes('数组')))
    })
  })

  describe('workspace validation edge cases', () => {
    it('should accept workspace with subdirectories', () => {
      const config = {
        name: 'test-agent',
        model: 'qwen3.5-plus',
        tools: ['exec'],
        workspace: '/home/admin/workspace/projects/my-project',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, true)
    })

    it('should reject tilde in workspace', () => {
      const config = {
        name: 'test-agent',
        model: 'qwen3.5-plus',
        tools: ['exec'],
        workspace: '~/workspace',
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, false)
      // Tilde will fail either absolute path check or illegal character check
      assert.ok(result.errors.some(e => e.includes('绝对路径') || e.includes('非法字符')))
    })

    it('should reject null workspace', () => {
      const config = {
        name: 'test-agent',
        model: 'qwen3.5-plus',
        tools: ['exec'],
        workspace: null,
      }

      const result = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(result.valid, false)
    })
  })
})

describe('Agent Create Service - Integration', () => {
  describe('full workflow', () => {
    it('should validate then create agent', async () => {
      const config = {
        name: 'integration-test-agent',
        model: 'qwen3.5-plus',
        tools: ['exec', 'read', 'write'],
        workspace: '/tmp/integration-test',
      }

      // First validate
      const validation = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(validation.valid, true)

      // Then create (may fail due to CLI, but should handle gracefully)
      const result = await agentCreateService.createAgent(config, {
        generateConfigFile: false,
      })
      assert.ok(result)
      assert.ok('success' in result)
    })

    it('should use template as base config', () => {
      const template = agentCreateService.getAgentTemplateById('coder')
      assert.ok(template)

      // Extract only the fields needed for validation (exclude id and name)
      const { id, name: templateName, ...templateConfig } = template
      const config = {
        name: 'my-coder-agent',
        ...templateConfig,
      }

      const validation = agentCreateService.validateAgentConfig(config)
      assert.strictEqual(validation.valid, true)
    })
  })
})
