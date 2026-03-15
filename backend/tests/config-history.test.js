/**
 * Config History API Tests
 * 测试配置版本历史管理功能（Git 集成、版本对比、回滚）
 */

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import fs from 'fs/promises'
import path from 'path'

// Import service module
import * as configHistoryService from '../src/services/configHistoryService.js'

// Test configuration
const TEST_AGENT_ID = 'test-agent-history'
const TEST_WORKSPACE = '/home/admin/.openclaw/workspace'
const TEST_CONFIG_DIR = path.join(TEST_WORKSPACE, 'agents', TEST_AGENT_ID)
const TEST_CONFIG_PATH = path.join(TEST_CONFIG_DIR, `${TEST_AGENT_ID}-config.yaml`)

/**
 * 创建测试配置
 */
async function createTestConfig(config = {}) {
  const defaultConfig = {
    agent: {
      name: TEST_AGENT_ID,
      model: 'qwen3.5-plus',
      tools: ['exec', 'read', 'write'],
      workspace: TEST_WORKSPACE,
    },
    metadata: {
      createdBy: 'test',
      createdAt: new Date().toISOString(),
    },
  }
  
  const mergedConfig = { ...defaultConfig, ...config }
  
  await fs.mkdir(TEST_CONFIG_DIR, { recursive: true })
  await fs.writeFile(
    TEST_CONFIG_PATH,
    `agent:
  name: ${mergedConfig.agent.name}
  model: ${mergedConfig.agent.model}
  tools:
    - ${mergedConfig.agent.tools.join('\n    - ')}
  workspace: ${mergedConfig.agent.workspace}
metadata:
  createdBy: ${mergedConfig.metadata.createdBy}
  createdAt: ${mergedConfig.metadata.createdAt}
`,
    'utf-8'
  )
  
  return mergedConfig
}

/**
 * 清理测试配置
 */
async function cleanupTestConfig() {
  try {
    await fs.rm(TEST_CONFIG_DIR, { recursive: true, force: true })
  } catch (error) {
    // Ignore cleanup errors
  }
}

describe('Config History Service', () => {
  describe('ConfigFormat', () => {
    it('should have correct format values', () => {
      assert.strictEqual(configHistoryService.ConfigFormat.YAML, 'yaml')
      assert.strictEqual(configHistoryService.ConfigFormat.JSON, 'json')
    })
  })

  describe('getVersionList', () => {
    before(async () => {
      await createTestConfig()
      // Commit initial config
      await configHistoryService.commitConfig(TEST_AGENT_ID, 'Initial commit')
    })

    after(async () => {
      await cleanupTestConfig()
    })

    it('should return version list for an agent', async () => {
      const result = await configHistoryService.getVersionList(TEST_AGENT_ID, { limit: 10 })
      
      assert.ok(result)
      assert.ok(Array.isArray(result.versions))
      assert.strictEqual(result.agentId, TEST_AGENT_ID)
      assert.ok(result.count >= 1)
    })

    it('should include version metadata', async () => {
      const result = await configHistoryService.getVersionList(TEST_AGENT_ID)
      
      if (result.versions.length > 0) {
        const version = result.versions[0]
        assert.ok(version.versionId)
        assert.ok(version.shortHash)
        assert.ok(version.message)
        assert.ok(version.timestamp)
      }
    })

    it('should return empty list for non-existent agent', async () => {
      const result = await configHistoryService.getVersionList('non-existent-agent')
      
      assert.strictEqual(result.count, 0)
      assert.deepStrictEqual(result.versions, [])
    })

    it('should reject invalid agent ID', async () => {
      await assert.rejects(
        async () => await configHistoryService.getVersionList(''),
        (err) => {
          assert.strictEqual(err.code, 'INVALID_AGENT_ID')
          return true
        }
      )

      await assert.rejects(
        async () => await configHistoryService.getVersionList('a'),
        (err) => {
          assert.strictEqual(err.code, 'INVALID_AGENT_ID')
          return true
        }
      )
    })
  })

  describe('getVersionDetail', () => {
    let versionId = null

    before(async () => {
      await createTestConfig()
      const commitResult = await configHistoryService.commitConfig(TEST_AGENT_ID, 'Test commit for detail')
      versionId = commitResult.commitHash
    })

    after(async () => {
      await cleanupTestConfig()
    })

    it('should return version detail', async () => {
      const result = await configHistoryService.getVersionDetail(TEST_AGENT_ID, versionId)
      
      assert.ok(result)
      assert.strictEqual(result.versionId, versionId)
      assert.strictEqual(result.agentId, TEST_AGENT_ID)
      assert.ok(result.config)
      assert.ok(result.format)
    })

    it('should include config content', async () => {
      const result = await configHistoryService.getVersionDetail(TEST_AGENT_ID, versionId)
      
      assert.ok(result.config.agent)
      assert.strictEqual(result.config.agent.name, TEST_AGENT_ID)
    })

    it('should reject invalid version ID', async () => {
      await assert.rejects(
        async () => await configHistoryService.getVersionDetail(TEST_AGENT_ID, ''),
        (err) => {
          assert.strictEqual(err.code, 'INVALID_VERSION_ID')
          return true
        }
      )
    })

    it('should reject non-existent version', async () => {
      await assert.rejects(
        async () => await configHistoryService.getVersionDetail(TEST_AGENT_ID, 'nonexistent123456'),
        (err) => {
          assert.strictEqual(err.code, 'VERSION_NOT_FOUND')
          return true
        }
      )
    })
  })

  describe('rollbackToVersion', () => {
    let versionId = null

    before(async () => {
      await createTestConfig()
      const commitResult = await configHistoryService.commitConfig(TEST_AGENT_ID, 'Test commit for rollback')
      versionId = commitResult.commitHash
    })

    after(async () => {
      await cleanupTestConfig()
    })

    it('should rollback to specified version', async () => {
      const result = await configHistoryService.rollbackToVersion(TEST_AGENT_ID, versionId)
      
      assert.ok(result.success)
      assert.strictEqual(result.agentId, TEST_AGENT_ID)
      assert.strictEqual(result.rolledBackTo, versionId)
      assert.ok(result.timestamp)
    })

    it('should reject invalid version ID', async () => {
      await assert.rejects(
        async () => await configHistoryService.rollbackToVersion(TEST_AGENT_ID, ''),
        (err) => {
          assert.strictEqual(err.code, 'INVALID_VERSION_ID')
          return true
        }
      )
    })

    it('should reject non-existent version', async () => {
      await assert.rejects(
        async () => await configHistoryService.rollbackToVersion(TEST_AGENT_ID, 'nonexistent123456'),
        (err) => {
          assert.strictEqual(err.code, 'VERSION_NOT_FOUND')
          return true
        }
      )
    })
  })

  describe('compareVersions', () => {
    let versionId1 = null
    let versionId2 = null

    before(async () => {
      await createTestConfig()
      
      // First commit
      const commit1 = await configHistoryService.commitConfig(TEST_AGENT_ID, 'First commit')
      versionId1 = commit1.commitHash
      
      // Modify config
      await createTestConfig({
        metadata: {
          createdBy: 'test-updated',
          createdAt: new Date().toISOString(),
        },
      })
      
      // Second commit
      const commit2 = await configHistoryService.commitConfig(TEST_AGENT_ID, 'Second commit')
      versionId2 = commit2.commitHash
    })

    after(async () => {
      await cleanupTestConfig()
    })

    it('should compare two versions', async () => {
      const result = await configHistoryService.compareVersions(TEST_AGENT_ID, versionId1, versionId2)
      
      assert.ok(result)
      assert.strictEqual(result.agentId, TEST_AGENT_ID)
      assert.ok(result.version1)
      assert.ok(result.version2)
      assert.ok(result.diff)
    })

    it('should include diff changes', async () => {
      const result = await configHistoryService.compareVersions(TEST_AGENT_ID, versionId1, versionId2)
      
      assert.ok(result.diff.changes)
      assert.ok(Array.isArray(result.diff.changes))
      assert.ok(result.diff.raw !== undefined)
    })

    it('should detect configuration changes', async () => {
      const result = await configHistoryService.compareVersions(TEST_AGENT_ID, versionId1, versionId2)
      
      // Should have detected the metadata change
      const metadataChanges = result.diff.changes.filter(c => c.path.includes('metadata'))
      assert.ok(metadataChanges.length > 0)
    })

    it('should reject missing version parameters', async () => {
      await assert.rejects(
        async () => await configHistoryService.compareVersions(TEST_AGENT_ID, null, versionId2),
        (err) => {
          assert.strictEqual(err.code, 'INVALID_VERSION_ID')
          return true
        }
      )
    })
  })

  describe('commitConfig', () => {
    before(async () => {
      await createTestConfig()
    })

    after(async () => {
      await cleanupTestConfig()
    })

    it('should commit configuration', async () => {
      const result = await configHistoryService.commitConfig(TEST_AGENT_ID, 'Test commit')
      
      assert.ok(result.success)
      assert.strictEqual(result.agentId, TEST_AGENT_ID)
      assert.ok(result.commitHash)
      assert.ok(result.shortHash)
      assert.strictEqual(result.message, 'Test commit')
    })

    it('should use default message if not provided', async () => {
      const result = await configHistoryService.commitConfig(TEST_AGENT_ID)
      
      assert.ok(result.success)
      assert.ok(result.message.includes('Update'))
    })

    it('should reject invalid agent ID', async () => {
      await assert.rejects(
        async () => await configHistoryService.commitConfig('', 'Test'),
        (err) => {
          assert.strictEqual(err.code, 'INVALID_AGENT_ID')
          return true
        }
      )
    })
  })

  describe('Integration Tests', () => {
    const integrationAgentId = 'test-agent-integration'
    const integrationConfigDir = path.join(TEST_WORKSPACE, 'agents', integrationAgentId)
    const integrationConfigPath = path.join(integrationConfigDir, `${integrationAgentId}-config.yaml`)

    before(async () => {
      // Create initial config
      await fs.mkdir(integrationConfigDir, { recursive: true })
      await fs.writeFile(
        integrationConfigPath,
        `agent:
  name: ${integrationAgentId}
  model: qwen3.5-plus
  tools:
    - exec
    - read
  workspace: ${TEST_WORKSPACE}
metadata:
  version: 1
`,
        'utf-8'
      )
    })

    after(async () => {
      try {
        await fs.rm(integrationConfigDir, { recursive: true, force: true })
      } catch (error) {
        // Ignore cleanup errors
      }
    })

    it('should support full version history workflow', async () => {
      // Step 1: Commit initial config
      const commit1 = await configHistoryService.commitConfig(integrationAgentId, 'Initial version')
      assert.ok(commit1.commitHash)
      
      // Step 2: Get version list
      const versions1 = await configHistoryService.getVersionList(integrationAgentId)
      assert.strictEqual(versions1.count, 1)
      
      // Step 3: Modify config
      await fs.writeFile(
        integrationConfigPath,
        `agent:
  name: ${integrationAgentId}
  model: qwen3.5-plus
  tools:
    - exec
    - read
    - write
  workspace: ${TEST_WORKSPACE}
metadata:
  version: 2
`,
        'utf-8'
      )
      
      // Step 4: Commit modified config
      const commit2 = await configHistoryService.commitConfig(integrationAgentId, 'Added write tool')
      assert.ok(commit2.commitHash)
      assert.notStrictEqual(commit1.commitHash, commit2.commitHash)
      
      // Step 5: Get updated version list
      const versions2 = await configHistoryService.getVersionList(integrationAgentId)
      assert.strictEqual(versions2.count, 2)
      
      // Step 6: Compare versions
      const comparison = await configHistoryService.compareVersions(
        integrationAgentId,
        commit1.commitHash,
        commit2.commitHash
      )
      assert.ok(comparison.diff.changes.length > 0)
      
      // Step 7: Get version detail
      const detail = await configHistoryService.getVersionDetail(integrationAgentId, commit2.commitHash)
      assert.strictEqual(detail.config.metadata.version, 2)
      
      // Step 8: Rollback to first version
      const rollback = await configHistoryService.rollbackToVersion(integrationAgentId, commit1.commitHash)
      assert.ok(rollback.success)
      
      // Step 9: Verify rollback
      const detailAfterRollback = await configHistoryService.getVersionDetail(
        integrationAgentId,
        rollback.rolledBackTo
      )
      assert.strictEqual(detailAfterRollback.config.metadata.version, 1)
    })
  })
})
