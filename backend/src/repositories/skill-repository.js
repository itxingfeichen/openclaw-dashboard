/**
 * Skill Repository
 * Data access layer for skill management
 */

import { getDatabase } from '../database/index.js';

/**
 * Create or update a skill
 * @param {Object} skillData - Skill data
 * @param {string} skillData.name - Skill name
 * @param {string} [skillData.version] - Skill version
 * @param {string} [skillData.description] - Skill description
 * @param {string} [skillData.source='skillhub'] - Skill source
 * @param {string} [skillData.location] - Installation location
 * @param {string} [skillData.author] - Skill author
 * @param {string} [skillData.license] - License type
 * @param {Array} [skillData.dependencies] - Dependencies
 * @param {Object} [skillData.configSchema] - Configuration schema
 * @returns {Object} Created/updated skill
 */
export function upsertSkill(skillData) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO skills (name, version, description, source, location, author, license, dependencies, config_schema)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      version = excluded.version,
      description = excluded.description,
      source = excluded.source,
      location = excluded.location,
      author = excluded.author,
      license = excluded.license,
      dependencies = excluded.dependencies,
      config_schema = excluded.config_schema,
      updated_at = CURRENT_TIMESTAMP
  `);
  
  stmt.run(
    skillData.name,
    skillData.version || null,
    skillData.description || null,
    skillData.source || 'skillhub',
    skillData.location || null,
    skillData.author || null,
    skillData.license || null,
    skillData.dependencies ? JSON.stringify(skillData.dependencies) : null,
    skillData.configSchema ? JSON.stringify(skillData.configSchema) : null
  );
  
  return getSkillByName(skillData.name);
}

/**
 * Get skill by ID
 * @param {number} id - Skill ID
 * @returns {Object|null} Skill object or null
 */
export function getSkillById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM skills WHERE id = ?');
  const skill = stmt.get(id);
  return skill ? parseSkillFields(skill) : null;
}

/**
 * Get skill by name
 * @param {string} name - Skill name
 * @returns {Object|null} Skill object or null
 */
export function getSkillByName(name) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM skills WHERE name = ?');
  const skill = stmt.get(name);
  return skill ? parseSkillFields(skill) : null;
}

/**
 * Parse skill JSON fields
 * @param {Object} skill - Skill object
 * @returns {Object} Skill with parsed fields
 */
function parseSkillFields(skill) {
  if (skill) {
    if (skill.dependencies) {
      try {
        skill.dependencies = JSON.parse(skill.dependencies);
      } catch (e) {
        skill.dependencies = null;
      }
    }
    if (skill.configSchema) {
      try {
        skill.configSchema = JSON.parse(skill.configSchema);
      } catch (e) {
        skill.configSchema = null;
      }
    }
  }
  return skill;
}

/**
 * Get all skills with optional filtering
 * @param {Object} [filters] - Filter options
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.source] - Filter by source
 * @param {boolean} [filters.installed] - Filter by installed status
 * @param {number} [filters.limit=100] - Max results
 * @param {number} [filters.offset=0] - Offset
 * @returns {Object[]} Array of skills
 */
export function getAllSkills(filters = {}) {
  const db = getDatabase();
  
  let where = [];
  let params = [];
  
  if (filters.status) {
    where.push('status = ?');
    params.push(filters.status);
  }
  
  if (filters.source) {
    where.push('source = ?');
    params.push(filters.source);
  }
  
  if (filters.installed !== undefined) {
    if (filters.installed) {
      where.push('status = ?');
      params.push('installed');
    } else {
      where.push('status != ?');
      params.push('installed');
    }
  }
  
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  
  const stmt = db.prepare(`
    SELECT * FROM skills
    ${whereClause}
    ORDER BY name ASC
    LIMIT ? OFFSET ?
  `);
  
  const skills = stmt.all(...params, filters.limit || 100, filters.offset || 0);
  return skills.map(parseSkillFields);
}

/**
 * Get total skill count
 * @param {Object} [filters] - Filter options
 * @returns {number} Total count
 */
export function getSkillCount(filters = {}) {
  const db = getDatabase();
  
  let where = [];
  let params = [];
  
  if (filters.status) {
    where.push('status = ?');
    params.push(filters.status);
  }
  
  if (filters.source) {
    where.push('source = ?');
    params.push(filters.source);
  }
  
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM skills ${whereClause}`);
  const result = stmt.get(...params);
  return result.count;
}

/**
 * Update skill
 * @param {number} id - Skill ID
 * @param {Object} skillData - Skill data to update
 * @returns {Object|null} Updated skill or null
 */
export function updateSkill(id, skillData) {
  const db = getDatabase();
  
  const fields = [];
  const values = [];
  
  if (skillData.version !== undefined) {
    fields.push('version = ?');
    values.push(skillData.version);
  }
  if (skillData.description !== undefined) {
    fields.push('description = ?');
    values.push(skillData.description);
  }
  if (skillData.status !== undefined) {
    fields.push('status = ?');
    values.push(skillData.status);
  }
  if (skillData.installedVersion !== undefined) {
    fields.push('installed_version = ?');
    values.push(skillData.installedVersion);
  }
  if (skillData.latestVersion !== undefined) {
    fields.push('latest_version = ?');
    values.push(skillData.latestVersion);
  }
  if (skillData.location !== undefined) {
    fields.push('location = ?');
    values.push(skillData.location);
  }
  if (skillData.author !== undefined) {
    fields.push('author = ?');
    values.push(skillData.author);
  }
  if (skillData.license !== undefined) {
    fields.push('license = ?');
    values.push(skillData.license);
  }
  if (skillData.dependencies !== undefined) {
    fields.push('dependencies = ?');
    values.push(JSON.stringify(skillData.dependencies));
  }
  if (skillData.configSchema !== undefined) {
    fields.push('config_schema = ?');
    values.push(JSON.stringify(skillData.configSchema));
  }
  if (skillData.installedAt !== undefined) {
    fields.push('installed_at = ?');
    values.push(skillData.installedAt);
  }
  
  if (fields.length === 0) {
    return getSkillById(id);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE skills SET ${fields.join(', ')} WHERE id = ?
  `);
  
  stmt.run(...values);
  return getSkillById(id);
}

/**
 * Delete skill
 * @param {number} id - Skill ID
 * @returns {boolean} Success status
 */
export function deleteSkill(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM skills WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Mark skill as installed
 * @param {string} name - Skill name
 * @param {string} version - Installed version
 * @param {string} location - Installation location
 * @returns {Object|null} Updated skill or null
 */
export function markSkillInstalled(name, version, location) {
  return updateSkillByName(name, {
    status: 'installed',
    installedVersion: version,
    location,
    installedAt: new Date().toISOString()
  });
}

/**
 * Update skill by name
 * @param {string} name - Skill name
 * @param {Object} skillData - Skill data to update
 * @returns {Object|null} Updated skill or null
 */
export function updateSkillByName(name, skillData) {
  const skill = getSkillByName(name);
  if (!skill) {
    return null;
  }
  return updateSkill(skill.id, skillData);
}

/**
 * Mark skill as updating
 * @param {string} name - Skill name
 * @returns {Object|null} Updated skill or null
 */
export function markSkillUpdating(name) {
  return updateSkillByName(name, { status: 'updating' });
}

/**
 * Mark skill as error
 * @param {string} name - Skill name
 * @returns {Object|null} Updated skill or null
 */
export function markSkillError(name) {
  return updateSkillByName(name, { status: 'error' });
}

/**
 * Uninstall skill
 * @param {string} name - Skill name
 * @returns {Object|null} Updated skill or null
 */
export function uninstallSkill(name) {
  return updateSkillByName(name, {
    status: 'available',
    installedVersion: null,
    location: null,
    installedAt: null
  });
}

/**
 * Check for skill updates
 * @param {string} name - Skill name
 * @param {string} latestVersion - Latest available version
 * @returns {Object|null} Updated skill or null
 */
export function checkSkillUpdate(name, latestVersion) {
  return updateSkillByName(name, { latestVersion });
}

/**
 * Get installed skills
 * @returns {Object[]} Array of installed skills
 */
export function getInstalledSkills() {
  return getAllSkills({ status: 'installed' });
}

/**
 * Get skills needing updates
 * @returns {Object[]} Array of skills with available updates
 */
export function getSkillsNeedingUpdates() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM skills 
    WHERE status = 'installed' 
    AND latest_version IS NOT NULL 
    AND installed_version != latest_version
    ORDER BY name ASC
  `);
  const skills = stmt.all();
  return skills.map(parseSkillFields);
}

/**
 * Add skill to agent
 * @param {number} agentId - Agent ID
 * @param {number} skillId - Skill ID
 * @param {Object} [config] - Skill configuration
 * @returns {Object} Created agent-skill mapping
 */
export function addSkillToAgent(agentId, skillId, config = null) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO agent_skills (agent_id, skill_id, enabled, config_json)
    VALUES (?, ?, 1, ?)
  `);
  
  stmt.run(agentId, skillId, config ? JSON.stringify(config) : null);
  
  return getAgentSkill(agentId, skillId);
}

/**
 * Get agent-skill mapping
 * @param {number} agentId - Agent ID
 * @param {number} skillId - Skill ID
 * @returns {Object|null} Agent-skill mapping or null
 */
export function getAgentSkill(agentId, skillId) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM agent_skills WHERE agent_id = ? AND skill_id = ?');
  return stmt.get(agentId, skillId) || null;
}

/**
 * Get all skills for agent
 * @param {number} agentId - Agent ID
 * @returns {Object[]} Array of agent skills with skill details
 */
export function getAgentSkills(agentId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT ag.*, s.name as skill_name, s.description, s.version, s.status as skill_status
    FROM agent_skills ag
    JOIN skills s ON ag.skill_id = s.id
    WHERE ag.agent_id = ?
    ORDER BY s.name ASC
  `);
  return stmt.all(agentId);
}

/**
 * Enable/disable agent skill
 * @param {number} agentId - Agent ID
 * @param {number} skillId - Skill ID
 * @param {boolean} enabled - Enabled status
 * @returns {Object|null} Updated agent-skill mapping or null
 */
export function setAgentSkillEnabled(agentId, skillId, enabled) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE agent_skills 
    SET enabled = ? 
    WHERE agent_id = ? AND skill_id = ?
  `);
  stmt.run(enabled ? 1 : 0, agentId, skillId);
  return getAgentSkill(agentId, skillId);
}

/**
 * Remove skill from agent
 * @param {number} agentId - Agent ID
 * @param {number} skillId - Skill ID
 * @returns {boolean} Success status
 */
export function removeSkillFromAgent(agentId, skillId) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM agent_skills WHERE agent_id = ? AND skill_id = ?');
  const result = stmt.run(agentId, skillId);
  return result.changes > 0;
}

/**
 * Search skills by name or description
 * @param {string} query - Search query
 * @param {number} [limit=10] - Max results
 * @returns {Object[]} Array of skills
 */
export function searchSkills(query, limit = 10) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM skills
    WHERE name LIKE ? OR description LIKE ?
    ORDER BY name ASC
    LIMIT ?
  `);
  const searchPattern = `%${query}%`;
  const skills = stmt.all(searchPattern, searchPattern, limit);
  return skills.map(parseSkillFields);
}

/**
 * Get skill statistics
 * @returns {Object} Skill statistics
 */
export function getSkillStats() {
  const db = getDatabase();
  
  const statusStats = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM skills 
    GROUP BY status
  `).all();
  
  const sourceStats = db.prepare(`
    SELECT source, COUNT(*) as count 
    FROM skills 
    GROUP BY source
  `).all();
  
  const updatesAvailable = db.prepare(`
    SELECT COUNT(*) as count FROM skills 
    WHERE status = 'installed' 
    AND latest_version IS NOT NULL 
    AND installed_version != latest_version
  `).get();
  
  return {
    byStatus: statusStats.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {}),
    bySource: sourceStats.reduce((acc, row) => {
      acc[row.source] = row.count;
      return acc;
    }, {}),
    updatesAvailable: updatesAvailable.count,
    total: statusStats.reduce((sum, row) => sum + row.count, 0)
  };
}

export default {
  upsertSkill,
  getSkillById,
  getSkillByName,
  getAllSkills,
  getSkillCount,
  updateSkill,
  deleteSkill,
  markSkillInstalled,
  updateSkillByName,
  markSkillUpdating,
  markSkillError,
  uninstallSkill,
  checkSkillUpdate,
  getInstalledSkills,
  getSkillsNeedingUpdates,
  addSkillToAgent,
  getAgentSkill,
  getAgentSkills,
  setAgentSkillEnabled,
  removeSkillFromAgent,
  searchSkills,
  getSkillStats
};
