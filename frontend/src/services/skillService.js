/**
 * Skill API Service
 * Handles all API calls related to Skill management and marketplace
 */

const API_BASE_URL = '/api';

// Mock data for fallback
const mockSkills = [
  {
    id: 'skill-001',
    name: 'weather',
    displayName: '天气查询',
    description: '通过 wttr.in 或 Open-Meteo 获取当前天气和预报',
    version: '1.2.0',
    author: 'OpenClaw Team',
    source: 'skillhub',
    category: 'tool',
    categories: ['tool', 'official'],
    downloads: 1250,
    rating: 4.8,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-03-10T14:20:00Z',
    tags: ['weather', 'forecast', 'api'],
    installed: true,
  },
  {
    id: 'skill-002',
    name: 'github-mcp',
    displayName: 'GitHub MCP',
    description: 'GitHub MCP 服务器，用于仓库管理、文件操作、PR/issue 跟踪',
    version: '2.0.1',
    author: 'OpenClaw Team',
    source: 'skillhub',
    category: 'official',
    categories: ['official', 'tool'],
    downloads: 3420,
    rating: 4.9,
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-03-12T11:45:00Z',
    tags: ['github', 'git', 'repository'],
    installed: true,
  },
  {
    id: 'skill-003',
    name: 'feishu-doc',
    displayName: '飞书文档',
    description: '飞书文档读写操作',
    version: '1.0.5',
    author: 'OpenClaw Team',
    source: 'skillhub',
    category: 'official',
    categories: ['official', 'tool'],
    downloads: 890,
    rating: 4.5,
    createdAt: '2024-01-20T15:45:00Z',
    updatedAt: '2024-02-28T16:30:00Z',
    tags: ['feishu', 'document', 'cloud'],
    installed: false,
  },
  {
    id: 'skill-004',
    name: 'mermaid-diagrams',
    displayName: 'Mermaid 图表',
    description: '使用 Mermaid 语法创建软件图表',
    version: '1.1.0',
    author: 'Community',
    source: 'clawhub',
    category: 'tool',
    categories: ['tool', 'community'],
    downloads: 567,
    rating: 4.6,
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-13T09:15:00Z',
    tags: ['diagram', 'mermaid', 'visualization'],
    installed: true,
  },
  {
    id: 'skill-005',
    name: 'healthcheck',
    displayName: '健康检查',
    description: '主机安全加固和风险容忍度配置',
    version: '1.3.2',
    author: 'OpenClaw Team',
    source: 'skillhub',
    category: 'official',
    categories: ['official', 'security'],
    downloads: 2100,
    rating: 4.7,
    createdAt: '2024-02-15T12:00:00Z',
    updatedAt: '2024-03-05T10:00:00Z',
    tags: ['security', 'health', 'audit'],
    installed: false,
  },
  {
    id: 'skill-006',
    name: 'skill-creator',
    displayName: '技能创建器',
    description: '创建或更新 AgentSkills',
    version: '2.1.0',
    author: 'OpenClaw Team',
    source: 'skillhub',
    category: 'official',
    categories: ['official', 'tool'],
    downloads: 1800,
    rating: 4.8,
    createdAt: '2024-01-10T14:30:00Z',
    updatedAt: '2024-03-11T13:20:00Z',
    tags: ['skill', 'creator', 'development'],
    installed: true,
  },
  {
    id: 'skill-007',
    name: 'qqbot-cron',
    displayName: 'QQBot 定时提醒',
    description: 'QQBot 定时提醒技能，支持一次性和周期性提醒',
    version: '1.0.0',
    author: 'Community',
    source: 'clawhub',
    category: 'tool',
    categories: ['tool', 'community'],
    downloads: 450,
    rating: 4.3,
    createdAt: '2024-02-20T11:15:00Z',
    updatedAt: '2024-03-01T09:45:00Z',
    tags: ['qqbot', 'cron', 'reminder'],
    installed: false,
  },
  {
    id: 'skill-008',
    name: 'find-skills',
    displayName: '技能发现',
    description: '帮助用户发现和安装 agent skills',
    version: '1.2.3',
    author: 'OpenClaw Team',
    source: 'skillhub',
    category: 'official',
    categories: ['official', 'tool'],
    downloads: 980,
    rating: 4.6,
    createdAt: '2024-03-05T16:00:00Z',
    updatedAt: '2024-03-13T08:30:00Z',
    tags: ['discovery', 'search', 'install'],
    installed: true,
  },
  {
    id: 'skill-009',
    name: 'python-helper',
    displayName: 'Python 助手',
    description: 'Python 代码执行和调试辅助',
    version: '1.4.0',
    author: 'Community',
    source: 'clawhub',
    category: 'language',
    categories: ['language', 'community'],
    downloads: 2300,
    rating: 4.7,
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-03-08T15:00:00Z',
    tags: ['python', 'code', 'execution'],
    installed: false,
  },
  {
    id: 'skill-010',
    name: 'image-analyzer',
    displayName: '图像分析',
    description: '图像识别和分析技能',
    version: '2.0.0',
    author: 'OpenClaw Team',
    source: 'skillhub',
    category: 'tool',
    categories: ['tool', 'official'],
    downloads: 1560,
    rating: 4.8,
    createdAt: '2024-01-25T13:30:00Z',
    updatedAt: '2024-03-12T17:00:00Z',
    tags: ['image', 'vision', 'analysis'],
    installed: true,
  },
  {
    id: 'skill-011',
    name: 'translation-pro',
    displayName: '翻译专家',
    description: '多语言翻译服务',
    version: '1.5.0',
    author: 'Community',
    source: 'clawhub',
    category: 'language',
    categories: ['language', 'community'],
    downloads: 3100,
    rating: 4.9,
    createdAt: '2024-02-05T09:30:00Z',
    updatedAt: '2024-03-10T12:00:00Z',
    tags: ['translation', 'language', 'nlp'],
    installed: false,
  },
  {
    id: 'skill-012',
    name: 'data-processor',
    displayName: '数据处理',
    description: '数据处理和转换工具',
    version: '1.1.2',
    author: 'Community',
    source: 'clawhub',
    category: 'tool',
    categories: ['tool', 'community'],
    downloads: 780,
    rating: 4.4,
    createdAt: '2024-01-30T11:00:00Z',
    updatedAt: '2024-02-25T14:30:00Z',
    tags: ['data', 'processing', 'etl'],
    installed: false,
  },
];

/**
 * Category labels mapping
 */
export const CATEGORY_LABELS = {
  official: '官方',
  community: '社区',
  tool: '工具',
  language: '语言',
  security: '安全',
};

/**
 * Source labels mapping
 */
export const SOURCE_LABELS = {
  skillhub: 'SkillHub',
  clawhub: 'ClawHub',
};

/**
 * Fetch all skills with optional pagination and filters
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @param {string} params.search - Search keyword
 * @param {string} params.category - Filter by category
 * @param {string} params.source - Filter by source (skillhub/clawhub)
 * @param {string} params.sortBy - Sort field
 * @param {string} params.sortOrder - Sort order (asc/desc)
 */
export async function fetchSkills(params = {}) {
  const {
    page = 1,
    pageSize = 12,
    search = '',
    category = '',
    source = '',
    sortBy = 'downloads',
    sortOrder = 'desc',
  } = params;

  try {
    // Try to fetch from API
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(search && { search }),
      ...(category && { category }),
      ...(source && { source }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
    });

    const response = await fetch(`${API_BASE_URL}/skills?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    
    // Fallback to mock data with client-side filtering
    let filteredData = [...mockSkills];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(
        skill =>
          skill.name.toLowerCase().includes(searchLower) ||
          skill.displayName.toLowerCase().includes(searchLower) ||
          skill.description.toLowerCase().includes(searchLower) ||
          skill.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply category filter
    if (category) {
      filteredData = filteredData.filter(skill => 
        skill.categories.includes(category)
      );
    }
    
    // Apply source filter
    if (source) {
      filteredData = filteredData.filter(skill => skill.source === source);
    }
    
    // Apply sorting
    filteredData.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'downloads':
          comparison = a.downloads - b.downloads;
          break;
        case 'rating':
          comparison = a.rating - b.rating;
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
 * Fetch a single skill by ID or name
 * @param {string} id - Skill ID or name
 */
export async function fetchSkillById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/skills/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    
    // Fallback to mock data
    const skill = mockSkills.find(s => s.id === id || s.name === id);
    if (!skill) {
      throw new Error(`Skill with id ${id} not found`);
    }
    
    return skill;
  }
}

/**
 * Install a skill
 * @param {string} id - Skill ID
 * @param {string} source - Skill source (skillhub/clawhub)
 */
export async function installSkill(id, source = 'skillhub') {
  try {
    const response = await fetch(`${API_BASE_URL}/skills/install`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, source }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to install skill:', error);
    throw error;
  }
}

/**
 * Uninstall a skill
 * @param {string} id - Skill ID
 */
export async function uninstallSkill(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/skills/uninstall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to uninstall skill:', error);
    throw error;
  }
}

/**
 * Update a skill
 * @param {string} id - Skill ID
 */
export async function updateSkill(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/skills/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to update skill:', error);
    throw error;
  }
}

/**
 * Get installed skills
 */
export async function getInstalledSkills() {
  try {
    const response = await fetch(`${API_BASE_URL}/skills/installed`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    
    // Return mock installed skills
    return {
      skills: mockSkills.filter(s => s.installed),
    };
  }
}

/**
 * Search skills by keyword
 * @param {string} keyword - Search keyword
 * @param {string} source - Optional source filter
 */
export async function searchSkills(keyword, source = '') {
  try {
    const queryParams = new URLSearchParams({
      q: keyword,
      ...(source && { source }),
    });

    const response = await fetch(`${API_BASE_URL}/skills/search?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API search failed, using mock data:', error);
    
    // Fallback to mock data
    const searchLower = keyword.toLowerCase();
    const results = mockSkills.filter(
      skill =>
        skill.name.toLowerCase().includes(searchLower) ||
        skill.displayName.toLowerCase().includes(searchLower) ||
        skill.description.toLowerCase().includes(searchLower) ||
        skill.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
    
    return {
      data: results,
      total: results.length,
    };
  }
}

export default {
  fetchSkills,
  fetchSkillById,
  installSkill,
  uninstallSkill,
  updateSkill,
  getInstalledSkills,
  searchSkills,
  CATEGORY_LABELS,
  SOURCE_LABELS,
};
