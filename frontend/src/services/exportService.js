/**
 * Export API Service
 * Handles all API calls related to data export functionality
 */

const API_BASE_URL = '/api';

/**
 * Export data types
 */
export const EXPORT_TYPES = {
  AGENT: 'agent',
  TASK: 'task',
  LOG: 'log',
  CONFIG: 'config',
};

/**
 * Export formats
 */
export const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  XLSX: 'xlsx',
};

/**
 * Available fields for each export type
 */
export const AVAILABLE_FIELDS = {
  [EXPORT_TYPES.AGENT]: [
    { key: 'id', label: 'Agent ID' },
    { key: 'name', label: '名称' },
    { key: 'status', label: '状态' },
    { key: 'type', label: '类型' },
    { key: 'description', label: '描述' },
    { key: 'createdAt', label: '创建时间' },
    { key: 'updatedAt', label: '更新时间' },
    { key: 'tokens', label: 'Token 使用' },
    { key: 'tasks', label: '任务数' },
  ],
  [EXPORT_TYPES.TASK]: [
    { key: 'id', label: '任务 ID' },
    { key: 'agentId', label: 'Agent ID' },
    { key: 'agentName', label: 'Agent 名称' },
    { key: 'status', label: '状态' },
    { key: 'type', label: '类型' },
    { key: 'content', label: '内容' },
    { key: 'createdAt', label: '创建时间' },
    { key: 'startedAt', label: '开始时间' },
    { key: 'completedAt', label: '完成时间' },
    { key: 'runtime', label: '运行时长' },
    { key: 'tokens', label: 'Token 使用' },
  ],
  [EXPORT_TYPES.LOG]: [
    { key: 'id', label: '日志 ID' },
    { key: 'level', label: '级别' },
    { key: 'message', label: '消息' },
    { key: 'source', label: '来源' },
    { key: 'timestamp', label: '时间' },
    { key: 'context', label: '上下文' },
  ],
  [EXPORT_TYPES.CONFIG]: [
    { key: 'key', label: '配置键' },
    { key: 'value', label: '配置值' },
    { key: 'type', label: '类型' },
    { key: 'description', label: '描述' },
    { key: 'updatedAt', label: '更新时间' },
    { key: 'updatedBy', label: '更新人' },
  ],
};

/**
 * Initiate a data export
 * @param {Object} params - Export parameters
 * @param {string} params.type - Data type (agent/task/log/config)
 * @param {string} params.format - Export format (csv/json/xlsx)
 * @param {Array} params.fields - Selected fields
 * @param {Object} params.filters - Filter conditions
 * @returns {Promise<Object>} Export job information
 */
export const initiateExport = async (params) => {
  try {
    const response = await fetch(`${API_BASE_URL}/export/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Export initiation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to initiate export:', error);
    throw error;
  }
};

/**
 * Get export progress
 * @param {string} jobId - Export job ID
 * @returns {Promise<Object>} Progress information
 */
export const getExportProgress = async (jobId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/export/progress/${jobId}`);

    if (!response.ok) {
      throw new Error('Failed to get progress');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get export progress:', error);
    throw error;
  }
};

/**
 * Get export history
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Page size
 * @returns {Promise<Object>} Export history list
 */
export const getExportHistory = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/export/history?${queryParams}`);

    if (!response.ok) {
      throw new Error('Failed to get export history');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get export history:', error);
    throw error;
  }
};

/**
 * Download exported file
 * @param {string} fileId - File ID
 * @param {string} filename - Filename for download
 */
export const downloadExport = async (fileId, filename) => {
  try {
    const response = await fetch(`${API_BASE_URL}/export/download/${fileId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download export:', error);
    throw error;
  }
};

/**
 * Cancel an export job
 * @param {string} jobId - Job ID to cancel
 * @returns {Promise<Object>} Cancellation result
 */
export const cancelExport = async (jobId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/export/cancel/${jobId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Cancellation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to cancel export:', error);
    throw error;
  }
};

/**
 * Delete export history record
 * @param {string} recordId - Record ID to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteExportRecord = async (recordId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/export/history/${recordId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Deletion failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to delete export record:', error);
    throw error;
  }
};
