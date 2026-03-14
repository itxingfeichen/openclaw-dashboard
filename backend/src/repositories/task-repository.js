/**
 * Task Repository
 * Data access layer for task management
 */

import { getDatabase } from '../database/index.js';

/**
 * Create a new task
 * @param {Object} taskData - Task data
 * @param {string} taskData.taskId - Unique task ID (e.g., "T1.3")
 * @param {string} taskData.title - Task title
 * @param {string} [taskData.description] - Task description
 * @param {string} [taskData.priority='normal'] - Task priority
 * @param {number} [taskData.agentId] - Agent ID assigned to task
 * @param {string} [taskData.parentTaskId] - Parent task ID
 * @param {number} [taskData.assignedTo] - User ID assigned to task
 * @param {string} [taskData.dueDate] - Due date
 * @param {Object} [taskData.metadata] - Additional metadata
 * @returns {Object} Created task
 */
export function createTask(taskData) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO tasks (task_id, title, description, priority, agent_id, parent_task_id, assigned_to, due_date, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    taskData.taskId,
    taskData.title,
    taskData.description || null,
    taskData.priority || 'normal',
    taskData.agentId || null,
    taskData.parentTaskId || null,
    taskData.assignedTo || null,
    taskData.dueDate || null,
    taskData.metadata ? JSON.stringify(taskData.metadata) : null
  );
  
  return getTaskById(result.lastInsertRowid);
}

/**
 * Get task by ID
 * @param {number} id - Task ID
 * @returns {Object|null} Task object or null
 */
export function getTaskById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  const task = stmt.get(id);
  return task ? parseTaskMetadata(task) : null;
}

/**
 * Get task by task_id (custom ID)
 * @param {string} taskId - Custom task ID (e.g., "T1.3")
 * @returns {Object|null} Task object or null
 */
export function getTaskByTaskId(taskId) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM tasks WHERE task_id = ?');
  const task = stmt.get(taskId);
  return task ? parseTaskMetadata(task) : null;
}

/**
 * Parse task metadata JSON
 * @param {Object} task - Task object
 * @returns {Object} Task with parsed metadata
 */
function parseTaskMetadata(task) {
  if (task && task.metadata) {
    try {
      task.metadata = JSON.parse(task.metadata);
    } catch (e) {
      task.metadata = null;
    }
  }
  return task;
}

/**
 * Get all tasks with optional filtering
 * @param {Object} [filters] - Filter options
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.priority] - Filter by priority
 * @param {number} [filters.agentId] - Filter by agent ID
 * @param {number} [filters.assignedTo] - Filter by assigned user
 * @param {string} [filters.parentTaskId] - Filter by parent task ID
 * @param {number} [filters.limit=100] - Max results
 * @param {number} [filters.offset=0] - Offset
 * @returns {Object[]} Array of tasks
 */
export function getAllTasks(filters = {}) {
  const db = getDatabase();
  
  let where = [];
  let params = [];
  
  if (filters.status) {
    where.push('status = ?');
    params.push(filters.status);
  }
  
  if (filters.priority) {
    where.push('priority = ?');
    params.push(filters.priority);
  }
  
  if (filters.agentId) {
    where.push('agent_id = ?');
    params.push(filters.agentId);
  }
  
  if (filters.assignedTo) {
    where.push('assigned_to = ?');
    params.push(filters.assignedTo);
  }
  
  if (filters.parentTaskId) {
    where.push('parent_task_id = ?');
    params.push(filters.parentTaskId);
  }
  
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  
  const stmt = db.prepare(`
    SELECT * FROM tasks
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const tasks = stmt.all(...params, filters.limit || 100, filters.offset || 0);
  return tasks.map(parseTaskMetadata);
}

/**
 * Get total task count
 * @param {Object} [filters] - Filter options
 * @returns {number} Total count
 */
export function getTaskCount(filters = {}) {
  const db = getDatabase();
  
  let where = [];
  let params = [];
  
  if (filters.status) {
    where.push('status = ?');
    params.push(filters.status);
  }
  
  if (filters.priority) {
    where.push('priority = ?');
    params.push(filters.priority);
  }
  
  if (filters.agentId) {
    where.push('agent_id = ?');
    params.push(filters.agentId);
  }
  
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM tasks ${whereClause}`);
  const result = stmt.get(...params);
  return result.count;
}

/**
 * Update task
 * @param {number} id - Task ID
 * @param {Object} taskData - Task data to update
 * @returns {Object|null} Updated task or null
 */
export function updateTask(id, taskData) {
  const db = getDatabase();
  
  const fields = [];
  const values = [];
  
  if (taskData.title !== undefined) {
    fields.push('title = ?');
    values.push(taskData.title);
  }
  if (taskData.description !== undefined) {
    fields.push('description = ?');
    values.push(taskData.description);
  }
  if (taskData.status !== undefined) {
    fields.push('status = ?');
    values.push(taskData.status);
  }
  if (taskData.priority !== undefined) {
    fields.push('priority = ?');
    values.push(taskData.priority);
  }
  if (taskData.agentId !== undefined) {
    fields.push('agent_id = ?');
    values.push(taskData.agentId);
  }
  if (taskData.assignedTo !== undefined) {
    fields.push('assigned_to = ?');
    values.push(taskData.assignedTo);
  }
  if (taskData.progress !== undefined) {
    fields.push('progress = ?');
    values.push(taskData.progress);
  }
  if (taskData.startedAt !== undefined) {
    fields.push('started_at = ?');
    values.push(taskData.startedAt);
  }
  if (taskData.completedAt !== undefined) {
    fields.push('completed_at = ?');
    values.push(taskData.completedAt);
  }
  if (taskData.dueDate !== undefined) {
    fields.push('due_date = ?');
    values.push(taskData.dueDate);
  }
  if (taskData.metadata !== undefined) {
    fields.push('metadata = ?');
    values.push(JSON.stringify(taskData.metadata));
  }
  if (taskData.errorMessage !== undefined) {
    fields.push('error_message = ?');
    values.push(taskData.errorMessage);
  }
  
  if (fields.length === 0) {
    return getTaskById(id);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE tasks SET ${fields.join(', ')} WHERE id = ?
  `);
  
  stmt.run(...values);
  return getTaskById(id);
}

/**
 * Delete task
 * @param {number} id - Task ID
 * @returns {boolean} Success status
 */
export function deleteTask(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Update task status
 * @param {number} id - Task ID
 * @param {string} status - New status
 * @returns {Object|null} Updated task or null
 */
export function updateTaskStatus(id, status) {
  const updates = { status };
  
  if (status === 'running' && !updates.startedAt) {
    updates.startedAt = new Date().toISOString();
  }
  
  if (['completed', 'failed', 'cancelled'].includes(status) && !updates.completedAt) {
    updates.completedAt = new Date().toISOString();
    updates.progress = status === 'completed' ? 100 : updates.progress;
  }
  
  return updateTask(id, updates);
}

/**
 * Update task progress
 * @param {number} id - Task ID
 * @param {number} progress - Progress percentage (0-100)
 * @returns {Object|null} Updated task or null
 */
export function updateTaskProgress(id, progress) {
  return updateTask(id, { progress });
}

/**
 * Start task
 * @param {number} id - Task ID
 * @returns {Object|null} Updated task or null
 */
export function startTask(id) {
  return updateTaskStatus(id, 'running');
}

/**
 * Complete task
 * @param {number} id - Task ID
 * @returns {Object|null} Updated task or null
 */
export function completeTask(id) {
  return updateTaskStatus(id, 'completed');
}

/**
 * Fail task
 * @param {number} id - Task ID
 * @param {string} errorMessage - Error message
 * @returns {Object|null} Updated task or null
 */
export function failTask(id, errorMessage) {
  return updateTask(id, { status: 'failed', errorMessage, completedAt: new Date().toISOString() });
}

/**
 * Cancel task
 * @param {number} id - Task ID
 * @returns {Object|null} Updated task or null
 */
export function cancelTask(id) {
  return updateTaskStatus(id, 'cancelled');
}

/**
 * Pause task
 * @param {number} id - Task ID
 * @returns {Object|null} Updated task or null
 */
export function pauseTask(id) {
  return updateTaskStatus(id, 'paused');
}

/**
 * Resume task
 * @param {number} id - Task ID
 * @returns {Object|null} Updated task or null
 */
export function resumeTask(id) {
  return updateTaskStatus(id, 'running');
}

/**
 * Add task log
 * @param {string} taskId - Task ID (custom ID)
 * @param {string} message - Log message
 * @param {string} [level='info'] - Log level
 * @param {Object} [context] - Additional context
 * @returns {Object} Created log entry
 */
export function addTaskLog(taskId, message, level = 'info', context = null) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO task_logs (task_id, level, message, context)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    taskId,
    level,
    message,
    context ? JSON.stringify(context) : null
  );
  
  return getTaskLogById(result.lastInsertRowid);
}

/**
 * Get task log by ID
 * @param {number} id - Log ID
 * @returns {Object|null} Log entry or null
 */
export function getTaskLogById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM task_logs WHERE id = ?');
  const log = stmt.get(id);
  return log ? parseLogContext(log) : null;
}

/**
 * Parse log context JSON
 * @param {Object} log - Log object
 * @returns {Object} Log with parsed context
 */
function parseLogContext(log) {
  if (log && log.context) {
    try {
      log.context = JSON.parse(log.context);
    } catch (e) {
      log.context = null;
    }
  }
  return log;
}

/**
 * Get logs for a task
 * @param {string} taskId - Task ID (custom ID)
 * @param {Object} [filters] - Filter options
 * @param {string} [filters.level] - Filter by log level
 * @param {number} [filters.limit=100] - Max results
 * @param {number} [filters.offset=0] - Offset
 * @returns {Object[]} Array of log entries
 */
export function getTaskLogs(taskId, filters = {}) {
  const db = getDatabase();
  
  let where = 'WHERE task_id = ?';
  let params = [taskId];
  
  if (filters.level) {
    where += ' AND level = ?';
    params.push(filters.level);
  }
  
  const stmt = db.prepare(`
    SELECT * FROM task_logs
    ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const logs = stmt.all(...params, filters.limit || 100, filters.offset || 0);
  return logs.map(parseLogContext);
}

/**
 * Get task logs count
 * @param {string} taskId - Task ID
 * @returns {number} Log count
 */
export function getTaskLogsCount(taskId) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM task_logs WHERE task_id = ?');
  const result = stmt.get(taskId);
  return result.count;
}

/**
 * Clear old task logs
 * @param {string} taskId - Task ID
 * @param {number} [olderThanDays=30] - Delete logs older than this many days
 * @returns {number} Number of deleted logs
 */
export function clearOldTaskLogs(taskId, olderThanDays = 30) {
  const db = getDatabase();
  const stmt = db.prepare(`
    DELETE FROM task_logs 
    WHERE task_id = ? AND created_at < datetime('now', ?)
  `);
  const result = stmt.run(taskId, `-${olderThanDays} days`);
  return result.changes;
}

/**
 * Get subtasks
 * @param {string} parentTaskId - Parent task ID
 * @returns {Object[]} Array of subtasks
 */
export function getSubtasks(parentTaskId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM tasks 
    WHERE parent_task_id = ? 
    ORDER BY created_at DESC
  `);
  const tasks = stmt.all(parentTaskId);
  return tasks.map(parseTaskMetadata);
}

/**
 * Get tasks by status
 * @param {string} status - Task status
 * @returns {Object[]} Array of tasks
 */
export function getTasksByStatus(status) {
  return getAllTasks({ status });
}

/**
 * Get running tasks
 * @returns {Object[]} Array of running tasks
 */
export function getRunningTasks() {
  return getTasksByStatus('running');
}

/**
 * Get overdue tasks
 * @returns {Object[]} Array of overdue tasks
 */
export function getOverdueTasks() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM tasks 
    WHERE due_date < datetime('now') 
    AND status NOT IN ('completed', 'cancelled')
    ORDER BY due_date ASC
  `);
  const tasks = stmt.all();
  return tasks.map(parseTaskMetadata);
}

/**
 * Search tasks by title or description
 * @param {string} query - Search query
 * @param {number} [limit=10] - Max results
 * @returns {Object[]} Array of tasks
 */
export function searchTasks(query, limit = 10) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM tasks
    WHERE title LIKE ? OR description LIKE ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  const searchPattern = `%${query}%`;
  const tasks = stmt.all(searchPattern, searchPattern, limit);
  return tasks.map(parseTaskMetadata);
}

/**
 * Get task statistics
 * @returns {Object} Task statistics
 */
export function getTaskStats() {
  const db = getDatabase();
  
  const statusStats = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM tasks 
    GROUP BY status
  `).all();
  
  const priorityStats = db.prepare(`
    SELECT priority, COUNT(*) as count 
    FROM tasks 
    GROUP BY priority
  `).all();
  
  const today = new Date().toISOString().split('T')[0];
  const completedToday = db.prepare(`
    SELECT COUNT(*) as count FROM tasks 
    WHERE status = 'completed' AND date(completed_at) = ?
  `).get(today);
  
  return {
    byStatus: statusStats.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {}),
    byPriority: priorityStats.reduce((acc, row) => {
      acc[row.priority] = row.count;
      return acc;
    }, {}),
    completedToday: completedToday.count,
    total: statusStats.reduce((sum, row) => sum + row.count, 0)
  };
}

export default {
  createTask,
  getTaskById,
  getTaskByTaskId,
  getAllTasks,
  getTaskCount,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskProgress,
  startTask,
  completeTask,
  failTask,
  cancelTask,
  pauseTask,
  resumeTask,
  addTaskLog,
  getTaskLogById,
  getTaskLogs,
  getTaskLogsCount,
  clearOldTaskLogs,
  getSubtasks,
  getTasksByStatus,
  getRunningTasks,
  getOverdueTasks,
  searchTasks,
  getTaskStats
};
