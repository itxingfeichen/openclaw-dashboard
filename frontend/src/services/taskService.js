/**
 * Task API Service
 * Handles all API calls related to Task management
 */

const API_BASE_URL = '/api';

// Mock data for fallback
const mockTasks = [
  {
    id: 'task-001',
    agentId: 'agent-001',
    agentName: 'Data Processor',
    status: 'running',
    type: 'data-processing',
    labels: ['urgent', 'batch'],
    content: 'Process daily data import from CSV files',
    createdAt: '2024-03-14T08:00:00Z',
    startedAt: '2024-03-14T08:05:00Z',
    completedAt: null,
    runtime: 3600,
    tokens: { input: 1500, output: 2300, total: 3800 },
    subtasks: [
      { id: 'sub-001', name: 'Validate input', status: 'done' },
      { id: 'sub-002', name: 'Transform data', status: 'running' },
      { id: 'sub-003', name: 'Export results', status: 'pending' },
    ],
  },
  {
    id: 'task-002',
    agentId: 'agent-002',
    agentName: 'Code Reviewer',
    status: 'done',
    type: 'code-review',
    labels: ['automated'],
    content: 'Review pull request #1234',
    createdAt: '2024-03-14T07:30:00Z',
    startedAt: '2024-03-14T07:35:00Z',
    completedAt: '2024-03-14T07:50:00Z',
    runtime: 900,
    tokens: { input: 5000, output: 1200, total: 6200 },
    subtasks: [
      { id: 'sub-004', name: 'Analyze code', status: 'done' },
      { id: 'sub-005', name: 'Check security', status: 'done' },
      { id: 'sub-006', name: 'Generate report', status: 'done' },
    ],
  },
  {
    id: 'task-003',
    agentId: 'agent-003',
    agentName: 'Customer Support',
    status: 'failed',
    type: 'support',
    labels: ['customer', 'urgent'],
    content: 'Handle customer ticket #5678',
    createdAt: '2024-03-14T06:00:00Z',
    startedAt: '2024-03-14T06:10:00Z',
    completedAt: '2024-03-14T06:15:00Z',
    runtime: 300,
    tokens: { input: 800, output: 0, total: 800 },
    error: 'API timeout',
    subtasks: [
      { id: 'sub-007', name: 'Parse ticket', status: 'done' },
      { id: 'sub-008', name: 'Generate response', status: 'failed' },
    ],
  },
  {
    id: 'task-004',
    agentId: 'agent-004',
    agentName: 'Analytics Engine',
    status: 'running',
    type: 'analytics',
    labels: ['scheduled', 'daily'],
    content: 'Generate daily analytics report',
    createdAt: '2024-03-14T09:00:00Z',
    startedAt: '2024-03-14T09:05:00Z',
    completedAt: null,
    runtime: 1800,
    tokens: { input: 3000, output: 4500, total: 7500 },
    subtasks: [
      { id: 'sub-009', name: 'Collect data', status: 'done' },
      { id: 'sub-010', name: 'Process metrics', status: 'running' },
      { id: 'sub-011', name: 'Create visualization', status: 'pending' },
    ],
  },
  {
    id: 'task-005',
    agentId: 'agent-001',
    agentName: 'Data Processor',
    status: 'done',
    type: 'data-processing',
    labels: ['batch'],
    content: 'Process weekly data export',
    createdAt: '2024-03-13T10:00:00Z',
    startedAt: '2024-03-13T10:05:00Z',
    completedAt: '2024-03-13T10:45:00Z',
    runtime: 2400,
    tokens: { input: 2000, output: 3000, total: 5000 },
    subtasks: [
      { id: 'sub-012', name: 'Extract data', status: 'done' },
      { id: 'sub-013', name: 'Transform', status: 'done' },
      { id: 'sub-014', name: 'Load', status: 'done' },
    ],
  },
  {
    id: 'task-006',
    agentId: 'agent-005',
    agentName: 'Security Monitor',
    status: 'running',
    type: 'security-scan',
    labels: ['automated', 'hourly'],
    content: 'Hourly security scan',
    createdAt: '2024-03-14T10:00:00Z',
    startedAt: '2024-03-14T10:00:00Z',
    completedAt: null,
    runtime: 600,
    tokens: { input: 1000, output: 500, total: 1500 },
    subtasks: [
      { id: 'sub-015', name: 'Scan endpoints', status: 'running' },
      { id: 'sub-016', name: 'Check logs', status: 'pending' },
    ],
  },
  {
    id: 'task-007',
    agentId: 'agent-006',
    agentName: 'Document Parser',
    status: 'done',
    type: 'parsing',
    labels: ['document'],
    content: 'Parse invoice documents',
    createdAt: '2024-03-14T05:00:00Z',
    startedAt: '2024-03-14T05:05:00Z',
    completedAt: '2024-03-14T05:30:00Z',
    runtime: 1500,
    tokens: { input: 4000, output: 2000, total: 6000 },
    subtasks: [
      { id: 'sub-017', name: 'OCR processing', status: 'done' },
      { id: 'sub-018', name: 'Extract fields', status: 'done' },
    ],
  },
  {
    id: 'task-008',
    agentId: 'agent-002',
    agentName: 'Code Reviewer',
    status: 'failed',
    type: 'code-review',
    labels: ['automated'],
    content: 'Review pull request #1235',
    createdAt: '2024-03-14T04:00:00Z',
    startedAt: '2024-03-14T04:05:00Z',
    completedAt: '2024-03-14T04:06:00Z',
    runtime: 60,
    tokens: { input: 5000, output: 0, total: 5000 },
    error: 'Repository not accessible',
    subtasks: [
      { id: 'sub-019', name: 'Fetch code', status: 'failed' },
    ],
  },
  {
    id: 'task-009',
    agentId: 'agent-008',
    agentName: 'Scheduler Pro',
    status: 'done',
    type: 'scheduling',
    labels: ['recurring'],
    content: 'Send daily reminders',
    createdAt: '2024-03-14T08:00:00Z',
    startedAt: '2024-03-14T08:00:00Z',
    completedAt: '2024-03-14T08:01:00Z',
    runtime: 60,
    tokens: { input: 200, output: 300, total: 500 },
    subtasks: [
      { id: 'sub-020', name: 'Load schedule', status: 'done' },
      { id: 'sub-021', name: 'Send notifications', status: 'done' },
    ],
  },
  {
    id: 'task-010',
    agentId: 'agent-011',
    agentName: 'Translation Bot',
    status: 'running',
    type: 'translation',
    labels: ['urgent', 'multi-language'],
    content: 'Translate documentation to Spanish',
    createdAt: '2024-03-14T09:30:00Z',
    startedAt: '2024-03-14T09:35:00Z',
    completedAt: null,
    runtime: 2700,
    tokens: { input: 10000, output: 9500, total: 19500 },
    subtasks: [
      { id: 'sub-022', name: 'Parse document', status: 'done' },
      { id: 'sub-023', name: 'Translate content', status: 'running' },
      { id: 'sub-024', name: 'Format output', status: 'pending' },
    ],
  },
];

/**
 * Fetch all tasks with optional pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @param {string} params.search - Search keyword
 * @param {string} params.status - Filter by status
 * @param {string} params.agentId - Filter by agent
 * @param {string} params.type - Filter by type
 * @param {string} params.sortBy - Sort field
 * @param {string} params.sortOrder - Sort order (asc/desc)
 */
export async function fetchTasks(params = {}) {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    status = '',
    agentId = '',
    type = '',
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
      ...(agentId && { agentId }),
      ...(type && { type }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
    });

    const response = await fetch(`${API_BASE_URL}/tasks?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    
    // Fallback to mock data with client-side filtering
    let filteredData = [...mockTasks];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(
        task =>
          task.content.toLowerCase().includes(searchLower) ||
          task.id.toLowerCase().includes(searchLower) ||
          task.agentName.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (status) {
      filteredData = filteredData.filter(task => task.status === status);
    }
    
    // Apply agent filter
    if (agentId) {
      filteredData = filteredData.filter(task => task.agentId === agentId);
    }
    
    // Apply type filter
    if (type) {
      filteredData = filteredData.filter(task => task.type === type);
    }
    
    // Apply sorting
    filteredData.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'agentName':
          comparison = a.agentName.localeCompare(b.agentName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
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
 * Fetch a single task by ID
 * @param {string} id - Task ID
 */
export async function fetchTaskById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    
    // Fallback to mock data
    const task = mockTasks.find(t => t.id === id);
    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }
    
    return task;
  }
}

/**
 * Fetch task statistics
 */
export async function fetchTaskStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/stats`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API fetch failed, using mock data:', error);
    
    // Fallback to mock data statistics
    const total = mockTasks.length;
    const running = mockTasks.filter(t => t.status === 'running').length;
    const done = mockTasks.filter(t => t.status === 'done').length;
    const failed = mockTasks.filter(t => t.status === 'failed').length;
    
    return {
      total,
      running,
      done,
      failed,
    };
  }
}

/**
 * Get status badge color
 * @param {string} status - Task status
 */
export function getTaskStatusColor(status) {
  switch (status) {
    case 'running':
      return 'blue';
    case 'done':
      return 'green';
    case 'failed':
      return 'red';
    case 'pending':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Get status label
 * @param {string} status - Task status
 */
export function getTaskStatusLabel(status) {
  const labels = {
    running: '运行中',
    done: '已完成',
    failed: '失败',
    pending: '待处理',
  };
  return labels[status] || status;
}

/**
 * Format runtime to human readable string
 * @param {number} seconds - Runtime in seconds
 */
export function formatRuntime(seconds) {
  if (!seconds && seconds !== 0) return '-';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Format date to locale string
 * @param {string} dateStr - ISO date string
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

export default {
  fetchTasks,
  fetchTaskById,
  fetchTaskStats,
  getTaskStatusColor,
  getTaskStatusLabel,
  formatRuntime,
  formatDate,
};
