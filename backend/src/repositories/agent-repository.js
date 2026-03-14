/**
 * Agent Repository
 * Data access layer for agent management
 */

import { getDatabase, prepare } from '../database/index.js';

/**
 * Create a new agent
 * @param {Object} agentData - Agent data
 * @param {string} agentData.name - Agent name
 * @param {string} [agentData.type='custom'] - Agent type
 * @param {string} [agentData.description] - Agent description
 * @param {string} [agentData.configPath] - Configuration file path
 * @param {string} [agentData.workspacePath] - Workspace path
 * @param {string} [agentData.modelName] - Model name
 * @param {number} [agentData.createdBy] - User ID who created the agent
 * @returns {Object} Created agent
 */
export function createAgent(agentData) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO agents (name, type, description, config_path, workspace_path, model_name, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    agentData.name,
    agentData.type || 'custom',
    agentData.description || null,
    agentData.configPath || null,
    agentData.workspacePath || null,
    agentData.modelName || null,
    agentData.createdBy || null
  );
  
  return getAgentById(result.lastInsertRowid);
}

/**
 * Get agent by ID
 * @param {number} id - Agent ID
 * @returns {Object|null} Agent object or null
 */
export function getAgentById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM agents WHERE id = ?');
  return stmt.get(id) || null;
}

/**
 * Get agent by name
 * @param {string} name - Agent name
 * @returns {Object|null} Agent object or null
 */
export function getAgentByName(name) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM agents WHERE name = ?');
  return stmt.get(name) || null;
}

/**
 * Get all agents with optional filtering
 * @param {Object} [filters] - Filter options
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.type] - Filter by type
 * @param {number} [filters.limit=100] - Max results
 * @param {number} [filters.offset=0] - Offset
 * @returns {Object[]} Array of agents
 */
export function getAllAgents(filters = {}) {
  const db = getDatabase();
  
  let where = [];
  let params = [];
  
  if (filters.status) {
    where.push('status = ?');
    params.push(filters.status);
  }
  
  if (filters.type) {
    where.push('type = ?');
    params.push(filters.type);
  }
  
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  
  const stmt = db.prepare(`
    SELECT * FROM agents
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  return stmt.all(...params, filters.limit || 100, filters.offset || 0);
}

/**
 * Get total agent count
 * @param {Object} [filters] - Filter options
 * @returns {number} Total count
 */
export function getAgentCount(filters = {}) {
  const db = getDatabase();
  
  let where = [];
  let params = [];
  
  if (filters.status) {
    where.push('status = ?');
    params.push(filters.status);
  }
  
  if (filters.type) {
    where.push('type = ?');
    params.push(filters.type);
  }
  
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM agents ${whereClause}`);
  const result = stmt.get(...params);
  return result.count;
}

/**
 * Update agent
 * @param {number} id - Agent ID
 * @param {Object} agentData - Agent data to update
 * @returns {Object|null} Updated agent or null
 */
export function updateAgent(id, agentData) {
  const db = getDatabase();
  
  const fields = [];
  const values = [];
  
  if (agentData.description !== undefined) {
    fields.push('description = ?');
    values.push(agentData.description);
  }
  if (agentData.status !== undefined) {
    fields.push('status = ?');
    values.push(agentData.status);
  }
  if (agentData.configPath !== undefined) {
    fields.push('config_path = ?');
    values.push(agentData.configPath);
  }
  if (agentData.workspacePath !== undefined) {
    fields.push('workspace_path = ?');
    values.push(agentData.workspacePath);
  }
  if (agentData.toolsEnabled !== undefined) {
    fields.push('tools_enabled = ?');
    values.push(JSON.stringify(agentData.toolsEnabled));
  }
  if (agentData.skillsInstalled !== undefined) {
    fields.push('skills_installed = ?');
    values.push(JSON.stringify(agentData.skillsInstalled));
  }
  if (agentData.modelName !== undefined) {
    fields.push('model_name = ?');
    values.push(agentData.modelName);
  }
  if (agentData.maxTokens !== undefined) {
    fields.push('max_tokens = ?');
    values.push(agentData.maxTokens);
  }
  if (agentData.temperature !== undefined) {
    fields.push('temperature = ?');
    values.push(agentData.temperature);
  }
  if (agentData.lastActivityAt !== undefined) {
    fields.push('last_activity_at = ?');
    values.push(agentData.lastActivityAt);
  }
  
  if (fields.length === 0) {
    return getAgentById(id);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE agents SET ${fields.join(', ')} WHERE id = ?
  `);
  
  stmt.run(...values);
  return getAgentById(id);
}

/**
 * Delete agent
 * @param {number} id - Agent ID
 * @returns {boolean} Success status
 */
export function deleteAgent(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM agents WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Update agent status
 * @param {number} id - Agent ID
 * @param {string} status - New status
 * @returns {Object|null} Updated agent or null
 */
export function updateAgentStatus(id, status) {
  return updateAgent(id, { status });
}

/**
 * Record agent activity
 * @param {number} id - Agent ID
 * @returns {Object|null} Updated agent or null
 */
export function recordActivity(id) {
  return updateAgent(id, { lastActivityAt: new Date().toISOString() });
}

/**
 * Get subagents by parent agent ID
 * @param {number} parentAgentId - Parent agent ID
 * @returns {Object[]} Array of subagents
 */
export function getSubagents(parentAgentId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM agents 
    WHERE parent_agent_id = ? 
    ORDER BY created_at DESC
  `);
  return stmt.all(parentAgentId);
}

/**
 * Get agents by status
 * @param {string} status - Agent status
 * @returns {Object[]} Array of agents
 */
export function getAgentsByStatus(status) {
  return getAllAgents({ status });
}

/**
 * Get running agents count
 * @returns {number} Count of running agents
 */
export function getRunningAgentsCount() {
  return getAgentCount({ status: 'running' });
}

/**
 * Add tool to agent
 * @param {number} agentId - Agent ID
 * @param {string} toolName - Tool name
 * @param {Object} [config] - Tool configuration
 * @returns {Object} Created agent-tool mapping
 */
export function addAgentTool(agentId, toolName, config = null) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO agent_tools (agent_id, tool_name, enabled, config_json, updated_at)
    VALUES (?, ?, 1, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.run(agentId, toolName, config ? JSON.stringify(config) : null);
  
  return getAgentTool(agentId, toolName);
}

/**
 * Get agent tool
 * @param {number} agentId - Agent ID
 * @param {string} toolName - Tool name
 * @returns {Object|null} Agent tool or null
 */
export function getAgentTool(agentId, toolName) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM agent_tools WHERE agent_id = ? AND tool_name = ?');
  return stmt.get(agentId, toolName) || null;
}

/**
 * Get all tools for agent
 * @param {number} agentId - Agent ID
 * @returns {Object[]} Array of agent tools
 */
export function getAgentTools(agentId) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM agent_tools WHERE agent_id = ? ORDER BY tool_name');
  return stmt.all(agentId);
}

/**
 * Enable/disable agent tool
 * @param {number} agentId - Agent ID
 * @param {string} toolName - Tool name
 * @param {boolean} enabled - Enabled status
 * @returns {Object|null} Updated agent tool or null
 */
export function setAgentToolEnabled(agentId, toolName, enabled) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE agent_tools 
    SET enabled = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE agent_id = ? AND tool_name = ?
  `);
  stmt.run(enabled ? 1 : 0, agentId, toolName);
  return getAgentTool(agentId, toolName);
}

/**
 * Remove tool from agent
 * @param {number} agentId - Agent ID
 * @param {string} toolName - Tool name
 * @returns {boolean} Success status
 */
export function removeAgentTool(agentId, toolName) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM agent_tools WHERE agent_id = ? AND tool_name = ?');
  const result = stmt.run(agentId, toolName);
  return result.changes > 0;
}

/**
 * Search agents by name or description
 * @param {string} query - Search query
 * @param {number} [limit=10] - Max results
 * @returns {Object[]} Array of agents
 */
export function searchAgents(query, limit = 10) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM agents
    WHERE name LIKE ? OR description LIKE ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  const searchPattern = `%${query}%`;
  return stmt.all(searchPattern, searchPattern, limit);
}

export default {
  createAgent,
  getAgentById,
  getAgentByName,
  getAllAgents,
  getAgentCount,
  updateAgent,
  deleteAgent,
  updateAgentStatus,
  recordActivity,
  getSubagents,
  getAgentsByStatus,
  getRunningAgentsCount,
  addAgentTool,
  getAgentTool,
  getAgentTools,
  setAgentToolEnabled,
  removeAgentTool,
  searchAgents
};
