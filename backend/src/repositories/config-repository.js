/**
 * Config Repository
 * Data access layer for configuration storage
 */

import { getDatabase, prepare } from '../database/index.js';

/**
 * Create a new configuration
 * @param {Object} configData - Configuration data
 * @param {string} configData.key - Configuration key
 * @param {string} configData.value - Configuration value
 * @param {string} [configData.type='string'] - Value type
 * @param {string} [configData.description] - Description
 * @param {boolean} [configData.isSensitive=false] - Is sensitive data
 * @param {number} [configData.createdBy] - Creator user ID
 * @returns {Object} Created config
 */
export function createConfig(configData) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO configs (key, value, type, description, is_sensitive, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    configData.key,
    configData.value,
    configData.type || 'string',
    configData.description || null,
    configData.isSensitive ? 1 : 0,
    configData.createdBy || null
  );
  
  return getConfigById(result.lastInsertRowid);
}

/**
 * Get configuration by ID
 * @param {number} id - Config ID
 * @returns {Object|null} Config object or null
 */
export function getConfigById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM configs WHERE id = ?');
  return stmt.get(id) || null;
}

/**
 * Get configuration by key
 * @param {string} key - Configuration key
 * @returns {Object|null} Config object or null
 */
export function getConfigByKey(key) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM configs WHERE key = ?');
  return stmt.get(key) || null;
}

/**
 * Get configuration value by key
 * @param {string} key - Configuration key
 * @param {any} [defaultValue=null] - Default value if not found
 * @returns {any} Configuration value
 */
export function getConfigValue(key, defaultValue = null) {
  const config = getConfigByKey(key);
  if (!config) {
    return defaultValue;
  }
  
  // Parse value based on type
  switch (config.type) {
    case 'number':
      return Number(config.value);
    case 'boolean':
      return config.value === 'true';
    case 'json':
      try {
        return JSON.parse(config.value);
      } catch {
        return config.value;
      }
    default:
      return config.value;
  }
}

/**
 * Get all configurations (excluding sensitive by default)
 * @param {Object} [options] - Query options
 * @param {boolean} [options.includeSensitive=false] - Include sensitive configs
 * @param {number} [options.limit=100] - Max results
 * @param {number} [options.offset=0] - Offset
 * @returns {Object[]} Array of configs
 */
export function getAllConfigs(options = {}) {
  const { includeSensitive = false, limit = 100, offset = 0 } = options;
  
  const db = getDatabase();
  const whereClause = includeSensitive ? '' : 'WHERE is_sensitive = 0';
  
  const stmt = db.prepare(`
    SELECT id, key, value, type, description, is_sensitive, created_at, updated_at, created_by
    FROM configs
    ${whereClause}
    ORDER BY key ASC
    LIMIT ? OFFSET ?
  `);
  
  return stmt.all(limit, offset);
}

/**
 * Get total config count
 * @param {boolean} [includeSensitive=false] - Include sensitive configs
 * @returns {number} Total count
 */
export function getConfigCount(includeSensitive = false) {
  const db = getDatabase();
  const whereClause = includeSensitive ? '' : 'WHERE is_sensitive = 0';
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM configs ${whereClause}`);
  const result = stmt.get();
  return result.count;
}

/**
 * Update configuration
 * @param {number} id - Config ID
 * @param {Object} configData - Config data to update
 * @returns {Object|null} Updated config or null
 */
export function updateConfig(id, configData) {
  const db = getDatabase();
  
  const fields = [];
  const values = [];
  
  if (configData.value !== undefined) {
    fields.push('value = ?');
    values.push(configData.value);
  }
  if (configData.type !== undefined) {
    fields.push('type = ?');
    values.push(configData.type);
  }
  if (configData.description !== undefined) {
    fields.push('description = ?');
    values.push(configData.description);
  }
  if (configData.isSensitive !== undefined) {
    fields.push('is_sensitive = ?');
    values.push(configData.isSensitive ? 1 : 0);
  }
  
  if (fields.length === 0) {
    return getConfigById(id);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE configs SET ${fields.join(', ')} WHERE id = ?
  `);
  
  stmt.run(...values);
  return getConfigById(id);
}

/**
 * Update configuration by key
 * @param {string} key - Configuration key
 * @param {Object} configData - Config data to update
 * @returns {Object|null} Updated config or null
 */
export function updateConfigByKey(key, configData) {
  const config = getConfigByKey(key);
  if (!config) {
    return null;
  }
  return updateConfig(config.id, configData);
}

/**
 * Delete configuration
 * @param {number} id - Config ID
 * @returns {boolean} Success status
 */
export function deleteConfig(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM configs WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Delete configuration by key
 * @param {string} key - Configuration key
 * @returns {boolean} Success status
 */
export function deleteConfigByKey(key) {
  const config = getConfigByKey(key);
  if (!config) {
    return false;
  }
  return deleteConfig(config.id);
}

/**
 * Set configuration (create or update)
 * @param {string} key - Configuration key
 * @param {any} value - Configuration value
 * @param {Object} [options] - Additional options
 * @returns {Object} Config object
 */
export function setConfig(key, value, options = {}) {
  const existing = getConfigByKey(key);
  
  if (existing) {
    return updateConfig(existing.id, { value, ...options });
  } else {
    return createConfig({ key, value, ...options });
  }
}

/**
 * Get multiple configurations by keys
 * @param {string[]} keys - Array of keys
 * @returns {Object} Map of key -> config
 */
export function getConfigsByKeys(keys) {
  const db = getDatabase();
  const placeholders = keys.map(() => '?').join(',');
  const stmt = db.prepare(`
    SELECT * FROM configs WHERE key IN (${placeholders})
  `);
  const rows = stmt.all(...keys);
  
  const result = {};
  rows.forEach(row => {
    result[row.key] = row;
  });
  
  return result;
}

/**
 * Search configurations by key or description
 * @param {string} query - Search query
 * @param {number} [limit=10] - Max results
 * @returns {Object[]} Array of configs
 */
export function searchConfigs(query, limit = 10) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, key, value, type, description, is_sensitive, created_at
    FROM configs
    WHERE key LIKE ? OR description LIKE ?
    ORDER BY key ASC
    LIMIT ?
  `);
  const searchPattern = `%${query}%`;
  return stmt.all(searchPattern, searchPattern, limit);
}

export default {
  createConfig,
  getConfigById,
  getConfigByKey,
  getConfigValue,
  getAllConfigs,
  getConfigCount,
  updateConfig,
  updateConfigByKey,
  deleteConfig,
  deleteConfigByKey,
  setConfig,
  getConfigsByKeys,
  searchConfigs
};
