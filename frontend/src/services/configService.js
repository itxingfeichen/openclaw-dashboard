/**
 * Configuration Version History API Service
 * Handles all API calls related to configuration version management
 */

const API_BASE_URL = '/api';

/**
 * Mock version history data for fallback
 */
const mockVersions = [
  {
    versionId: 'v1.0.0',
    timestamp: '2024-03-01T10:00:00Z',
    author: 'admin',
    description: '初始版本配置',
    changes: [
      { path: 'agent.model', old: null, new: 'qwen3.5-plus', type: 'add' },
      { path: 'agent.tools', old: null, new: ['read', 'write'], type: 'add' },
    ],
    status: 'stable',
  },
  {
    versionId: 'v1.1.0',
    timestamp: '2024-03-05T14:30:00Z',
    author: 'admin',
    description: '添加工具权限配置',
    changes: [
      { path: 'agent.tools', old: ['read', 'write'], new: ['read', 'write', 'exec'], type: 'modify' },
      { path: 'agent.workspacePath', old: null, new: '/home/admin/.openclaw/workspace', type: 'add' },
    ],
    status: 'stable',
  },
  {
    versionId: 'v1.2.0',
    timestamp: '2024-03-08T09:15:00Z',
    author: 'developer',
    description: '更新模型配置',
    changes: [
      { path: 'agent.model', old: 'qwen3.5-plus', new: 'qwencode/qwen3.5-plus', type: 'modify' },
    ],
    status: 'stable',
  },
  {
    versionId: 'v1.2.1',
    timestamp: '2024-03-10T11:45:00Z',
    author: 'admin',
    description: '修复工具权限问题',
    changes: [
      { path: 'agent.tools', old: ['read', 'write', 'exec'], new: ['read', 'write', 'exec', 'edit'], type: 'modify' },
    ],
    status: 'stable',
  },
  {
    versionId: 'v1.3.0-beta',
    timestamp: '2024-03-12T16:20:00Z',
    author: 'admin',
    description: '添加浏览器自动化支持',
    changes: [
      { path: 'agent.tools', old: ['read', 'write', 'exec', 'edit'], new: ['read', 'write', 'exec', 'edit', 'browser'], type: 'modify' },
      { path: 'agent.capabilities.browser', old: null, new: true, type: 'add' },
    ],
    status: 'current',
  },
];

/**
 * Fetch configuration version history
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @param {string} params.status - Filter by status
 */
export async function fetchVersionHistory(params = {}) {
  const {
    page = 1,
    pageSize = 10,
    status = '',
  } = params;

  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(status && { status }),
    });

    const response = await fetch(`${API_BASE_URL}/config/history?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    
    // Fallback to mock data with client-side filtering
    let filteredData = [...mockVersions];
    
    // Apply status filter
    if (status) {
      filteredData = filteredData.filter(version => version.status === status);
    }
    
    // Apply sorting (newest first)
    filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    return {
      data: paginatedData,
      total: filteredData.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredData.length / pageSize),
    };
  }
}

/**
 * Fetch a specific version details
 * @param {string} versionId - Version ID
 */
export async function fetchVersionDetails(versionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/config/history/${versionId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    
    // Fallback to mock data
    const version = mockVersions.find(v => v.versionId === versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }
    
    return version;
  }
}

/**
 * Compare two versions
 * @param {string} versionId1 - First version ID
 * @param {string} versionId2 - Second version ID
 */
export async function compareVersions(versionId1, versionId2) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/config/compare?from=${versionId1}&to=${versionId2}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    
    // Fallback to mock comparison
    const version1 = mockVersions.find(v => v.versionId === versionId1);
    const version2 = mockVersions.find(v => v.versionId === versionId2);
    
    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }
    
    return {
      from: version1,
      to: version2,
      diff: generateDiff(version1, version2),
    };
  }
}

/**
 * Generate diff between two versions (client-side fallback)
 */
function generateDiff(version1, version2) {
  const allChanges = [...(version1.changes || []), ...(version2.changes || [])];
  const uniquePaths = [...new Set(allChanges.map(c => c.path))];
  
  return uniquePaths.map(path => {
    const change1 = version1.changes?.find(c => c.path === path);
    const change2 = version2.changes?.find(c => c.path === path);
    
    return {
      path,
      oldValue: change1?.new || change1?.old || null,
      newValue: change2?.new || change2?.old || null,
      type: change1 && !change2 ? 'removed' : !change1 && change2 ? 'added' : 'modified',
    };
  });
}

/**
 * Rollback to a specific version
 * @param {string} versionId - Version ID to rollback to
 * @param {Function} onProgress - Progress callback
 */
export async function rollbackToVersion(versionId, onProgress) {
  try {
    // Start rollback
    if (onProgress) onProgress({ stage: 'validating', progress: 10 });
    
    const validateResponse = await fetch(
      `${API_BASE_URL}/config/rollback/${versionId}/validate`,
      { method: 'POST' }
    );
    
    if (!validateResponse.ok) {
      throw new Error('Rollback validation failed');
    }
    
    if (onProgress) onProgress({ stage: 'applying', progress: 40 });
    
    const rollbackResponse = await fetch(
      `${API_BASE_URL}/config/rollback/${versionId}`,
      { method: 'POST' }
    );
    
    if (!rollbackResponse.ok) {
      throw new Error('Rollback failed');
    }
    
    if (onProgress) onProgress({ stage: 'verifying', progress: 80 });
    
    const result = await rollbackResponse.json();
    
    if (onProgress) onProgress({ stage: 'complete', progress: 100 });
    
    return result;
  } catch (error) {
    console.error('Rollback failed:', error);
    if (onProgress) onProgress({ stage: 'error', progress: 0, error: error.message });
    throw error;
  }
}

/**
 * Get current configuration
 */
export async function getCurrentConfig() {
  try {
    const response = await fetch(`${API_BASE_URL}/config/current`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    
    return {
      versionId: 'v1.3.0-beta',
      config: {
        agent: {
          model: 'qwencode/qwen3.5-plus',
          tools: ['read', 'write', 'exec', 'edit', 'browser'],
          workspacePath: '/home/admin/.openclaw/workspace',
          capabilities: {
            browser: true,
          },
        },
      },
    };
  }
}

export default {
  fetchVersionHistory,
  fetchVersionDetails,
  compareVersions,
  rollbackToVersion,
  getCurrentConfig,
};
