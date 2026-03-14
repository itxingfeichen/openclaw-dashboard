/**
 * Agent API Service
 * Handles all API calls related to Agent management
 */

const API_BASE_URL = '/api';

// Mock data for fallback
const mockAgents = [
  {
    id: 'agent-001',
    name: 'Data Processor',
    status: 'active',
    description: 'Handles data processing and transformation tasks',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-03-10T14:20:00Z',
    version: '1.2.0',
    capabilities: ['data-processing', 'etl', 'validation'],
  },
  {
    id: 'agent-002',
    name: 'Code Reviewer',
    status: 'active',
    description: 'Automated code review and quality analysis',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-03-12T11:45:00Z',
    version: '2.0.1',
    capabilities: ['code-review', 'static-analysis', 'security-scan'],
  },
  {
    id: 'agent-003',
    name: 'Customer Support',
    status: 'inactive',
    description: 'Customer service and support automation',
    createdAt: '2024-01-20T15:45:00Z',
    updatedAt: '2024-02-28T16:30:00Z',
    version: '1.0.5',
    capabilities: ['chat', 'ticket-management', 'faq'],
  },
  {
    id: 'agent-004',
    name: 'Analytics Engine',
    status: 'active',
    description: 'Business analytics and reporting',
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-13T09:15:00Z',
    version: '1.1.0',
    capabilities: ['analytics', 'reporting', 'dashboard'],
  },
  {
    id: 'agent-005',
    name: 'Security Monitor',
    status: 'unknown',
    description: 'Security monitoring and threat detection',
    createdAt: '2024-02-15T12:00:00Z',
    updatedAt: '2024-03-05T10:00:00Z',
    version: '1.3.2',
    capabilities: ['security', 'monitoring', 'alerting'],
  },
  {
    id: 'agent-006',
    name: 'Document Parser',
    status: 'active',
    description: 'Document parsing and information extraction',
    createdAt: '2024-01-10T14:30:00Z',
    updatedAt: '2024-03-11T13:20:00Z',
    version: '2.1.0',
    capabilities: ['parsing', 'ocr', 'extraction'],
  },
  {
    id: 'agent-007',
    name: 'Email Handler',
    status: 'inactive',
    description: 'Email management and automation',
    createdAt: '2024-02-20T11:15:00Z',
    updatedAt: '2024-03-01T09:45:00Z',
    version: '1.0.0',
    capabilities: ['email', 'automation', 'templates'],
  },
  {
    id: 'agent-008',
    name: 'Scheduler Pro',
    status: 'active',
    description: 'Task scheduling and calendar management',
    createdAt: '2024-03-05T16:00:00Z',
    updatedAt: '2024-03-13T08:30:00Z',
    version: '1.2.3',
    capabilities: ['scheduling', 'calendar', 'reminders'],
  },
  {
    id: 'agent-009',
    name: 'Image Analyzer',
    status: 'unknown',
    description: 'Image analysis and recognition',
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-03-08T15:00:00Z',
    version: '1.4.0',
    capabilities: ['image-recognition', 'ocr', 'classification'],
  },
  {
    id: 'agent-010',
    name: 'Voice Assistant',
    status: 'active',
    description: 'Voice recognition and response',
    createdAt: '2024-01-25T13:30:00Z',
    updatedAt: '2024-03-12T17:00:00Z',
    version: '2.0.0',
    capabilities: ['voice', 'tts', 'stt'],
  },
  {
    id: 'agent-011',
    name: 'Translation Bot',
    status: 'active',
    description: 'Multi-language translation service',
    createdAt: '2024-02-05T09:30:00Z',
    updatedAt: '2024-03-10T12:00:00Z',
    version: '1.5.0',
    capabilities: ['translation', 'localization', 'nlp'],
  },
  {
    id: 'agent-012',
    name: 'Backup Manager',
    status: 'inactive',
    description: 'Automated backup and recovery',
    createdAt: '2024-01-30T11:00:00Z',
    updatedAt: '2024-02-25T14:30:00Z',
    version: '1.1.2',
    capabilities: ['backup', 'recovery', 'storage'],
  },
];

/**
 * Fetch all agents with optional pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @param {string} params.search - Search keyword
 * @param {string} params.status - Filter by status
 * @param {string} params.sortBy - Sort field
 * @param {string} params.sortOrder - Sort order (asc/desc)
 */
export async function fetchAgents(params = {}) {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  try {
    // Try to fetch from API
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(search && { search }),
      ...(status && { status }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
    });

    const response = await fetch(`${API_BASE_URL}/agents?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    
    // Fallback to mock data with client-side filtering
    let filteredData = [...mockAgents];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(
        agent =>
          agent.name.toLowerCase().includes(searchLower) ||
          agent.id.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (status) {
      filteredData = filteredData.filter(agent => agent.status === status);
    }
    
    // Apply sorting
    filteredData.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
        default:
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
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
 * Fetch a single agent by ID
 * @param {string} id - Agent ID
 */
export async function fetchAgentById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/agents/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    
    // Fallback to mock data
    const agent = mockAgents.find(a => a.id === id);
    if (!agent) {
      throw new Error(`Agent with id ${id} not found`);
    }
    
    return agent;
  }
}

/**
 * Get status badge color
 * @param {string} status - Agent status
 */
export function getStatusColor(status) {
  switch (status) {
    case 'active':
    case 'running':
      return 'success';
    case 'inactive':
    case 'stopped':
      return 'default';
    case 'unknown':
      return 'warning';
    default:
      return 'default';
  }
}

/**
 * Start an agent
 * @param {string} id - Agent ID
 */
export async function startAgent(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/agents/${id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to start agent:', error);
    throw error;
  }
}

/**
 * Stop an agent
 * @param {string} id - Agent ID
 */
export async function stopAgent(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/agents/${id}/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to stop agent:', error);
    throw error;
  }
}

/**
 * Restart an agent
 * @param {string} id - Agent ID
 */
export async function restartAgent(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/agents/${id}/restart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to restart agent:', error);
    throw error;
  }
}

/**
 * Get agent status
 * @param {string} id - Agent ID
 */
export async function getAgentStatus(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/agents/${id}/status`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get agent status:', error);
    throw error;
  }
}

/**
 * Create a new agent
 * @param {Object} agentData - Agent creation data
 * @param {string} agentData.name - Agent name
 * @param {string} agentData.model - Model selection
 * @param {string[]} agentData.tools - Tool permissions
 * @param {string} agentData.workspacePath - Workspace path
 * @param {string} [agentData.templateId] - Optional template ID
 */
export async function createAgent(agentData) {
  try {
    const response = await fetch(`${API_BASE_URL}/agents/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create agent:', error);
    throw error;
  }
}

/**
 * Fetch available agent templates
 */
export async function fetchTemplates() {
  try {
    const response = await fetch(`${API_BASE_URL}/agents/templates`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API fetch failed, using mock templates:', error);
    
    // Mock templates for fallback
    return {
      templates: [
        {
          id: 'template-001',
          name: '数据处理助手',
          description: '用于数据处理和转换的通用 Agent',
          model: 'qwen3.5-plus',
          tools: ['exec', 'read', 'write', 'web_search'],
          workspacePath: '/home/admin/.openclaw/workspace/data-agents',
        },
        {
          id: 'template-002',
          name: '代码开发助手',
          description: '专注于代码开发和技术任务的 Agent',
          model: 'qwencode/qwen3.5-plus',
          tools: ['exec', 'read', 'write', 'edit', 'browser'],
          workspacePath: '/home/admin/.openclaw/workspace/projects',
        },
        {
          id: 'template-003',
          name: '产品管理助手',
          description: '用于产品需求分析和文档管理的 Agent',
          model: 'qwen3.5-plus',
          tools: ['read', 'write', 'web_search', 'message'],
          workspacePath: '/home/admin/.openclaw/workspace/products',
        },
        {
          id: 'template-004',
          name: '客服助手',
          description: '用于客户服务和消息回复的 Agent',
          model: 'qwen3.5-plus',
          tools: ['read', 'write', 'message', 'tts'],
          workspacePath: '/home/admin/.openclaw/workspace/support',
        },
      ],
    };
  }
}

/**
 * Validate agent configuration
 * @param {Object} configData - Configuration to validate
 * @param {string} configData.name - Agent name
 * @param {string} configData.workspacePath - Workspace path
 */
export async function validateAgentConfig(configData) {
  try {
    const response = await fetch(`${API_BASE_URL}/agents/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to validate agent config:', error);
    throw error;
  }
}

export default {
  fetchAgents,
  fetchAgentById,
  getStatusColor,
  startAgent,
  stopAgent,
  restartAgent,
  getAgentStatus,
  createAgent,
  fetchTemplates,
  validateAgentConfig,
};
