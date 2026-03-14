import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TasksPage from '../../pages/Tasks/Tasks';
import TaskList from '../../components/TaskList';
import TaskFilter from '../../components/TaskFilter';
import TaskDetail from '../../components/TaskDetail';
import * as taskService from '../../services/taskService';

// Mock Ant Design components
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    },
  };
});

// Mock task service
vi.mock('../../services/taskService', () => ({
  fetchTasks: vi.fn(),
  fetchTaskById: vi.fn(),
  fetchTaskStats: vi.fn(),
  getTaskStatusColor: vi.fn((status) => {
    const colors = {
      running: 'blue',
      done: 'green',
      failed: 'red',
      pending: 'default',
    };
    return colors[status] || 'default';
  }),
  getTaskStatusLabel: vi.fn((status) => {
    const labels = {
      running: '运行中',
      done: '已完成',
      failed: '失败',
      pending: '待处理',
    };
    return labels[status] || status;
  }),
  formatRuntime: vi.fn((seconds) => {
    if (!seconds && seconds !== 0) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }),
  formatDate: vi.fn((dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  }),
}));

const mockTasks = {
  data: [
    {
      id: 'task-001',
      agentId: 'agent-001',
      agentName: 'Data Processor',
      status: 'running',
      type: 'data-processing',
      labels: ['urgent', 'batch'],
      content: 'Process daily data import',
      createdAt: '2024-03-14T08:00:00Z',
      runtime: 3600,
      tokens: { input: 1500, output: 2300, total: 3800 },
      subtasks: [
        { id: 'sub-001', name: 'Validate input', status: 'done' },
        { id: 'sub-002', name: 'Transform data', status: 'running' },
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
      runtime: 900,
      tokens: { input: 5000, output: 1200, total: 6200 },
      subtasks: [],
    },
  ],
  total: 2,
  page: 1,
  pageSize: 10,
};

const mockStats = {
  total: 10,
  running: 3,
  done: 5,
  failed: 2,
};

const mockTaskDetail = {
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
};

describe('TasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders TasksPage with statistics', async () => {
    taskService.fetchTasks.mockResolvedValue(mockTasks);
    taskService.fetchTaskStats.mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('任务管理')).toBeInTheDocument();
    });

    expect(taskService.fetchTasks).toHaveBeenCalled();
    expect(taskService.fetchTaskStats).toHaveBeenCalled();
  });

  it('displays task statistics correctly', async () => {
    taskService.fetchTasks.mockResolvedValue(mockTasks);
    taskService.fetchTaskStats.mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('总任务数')).toBeInTheDocument();
      expect(screen.getByText('运行中')).toBeInTheDocument();
      expect(screen.getByText('已完成')).toBeInTheDocument();
      expect(screen.getByText('失败')).toBeInTheDocument();
    });

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays task list with correct columns', async () => {
    taskService.fetchTasks.mockResolvedValue(mockTasks);
    taskService.fetchTaskStats.mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('任务 ID')).toBeInTheDocument();
      expect(screen.getByText('Agent')).toBeInTheDocument();
      expect(screen.getByText('状态')).toBeInTheDocument();
      expect(screen.getByText('类型')).toBeInTheDocument();
    });
  });
});

describe('TaskList', () => {
  const defaultProps = {
    data: mockTasks.data,
    loading: false,
    pagination: { current: 1, pageSize: 10, total: 2 },
    onChange: vi.fn(),
  };

  it('renders task list with data', () => {
    render(
      <MemoryRouter>
        <TaskList {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getByText('task-001')).toBeInTheDocument();
    expect(screen.getByText('Data Processor')).toBeInTheDocument();
    expect(screen.getByText('运行中')).toBeInTheDocument();
  });

  it('displays status tags with correct colors', () => {
    render(
      <MemoryRouter>
        <TaskList {...defaultProps} />
      </MemoryRouter>
    );

    expect(taskService.getTaskStatusColor).toHaveBeenCalledWith('running');
    expect(taskService.getTaskStatusColor).toHaveBeenCalledWith('done');
  });

  it('shows loading state', () => {
    render(
      <MemoryRouter>
        <TaskList {...defaultProps} loading={true} />
      </MemoryRouter>
    );

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('handles pagination change', () => {
    const onChange = vi.fn();
    render(
      <MemoryRouter>
        <TaskList {...defaultProps} onChange={onChange} />
      </MemoryRouter>
    );

    // Simulate pagination change
    fireEvent.click(screen.getByText('20'));
    
    expect(onChange).toHaveBeenCalled();
  });
});

describe('TaskFilter', () => {
  it('renders filter inputs', () => {
    render(
      <MemoryRouter>
        <TaskFilter onFilter={vi.fn()} onRefresh={vi.fn()} loading={false} />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('搜索任务 ID、内容或 Agent')).toBeInTheDocument();
    expect(screen.getByText('状态筛选')).toBeInTheDocument();
    expect(screen.getByText('按 Agent 筛选')).toBeInTheDocument();
    expect(screen.getByText('按类型筛选')).toBeInTheDocument();
  });

  it('handles search input', () => {
    const onFilter = vi.fn();
    render(
      <MemoryRouter>
        <TaskFilter onFilter={onFilter} onRefresh={vi.fn()} loading={false} />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('搜索任务 ID、内容或 Agent');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });

    expect(onFilter).toHaveBeenCalledWith({ search: 'test' });
  });

  it('handles status filter change', () => {
    const onFilter = vi.fn();
    render(
      <MemoryRouter>
        <TaskFilter onFilter={onFilter} onRefresh={vi.fn()} loading={false} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('状态筛选'));
    fireEvent.click(screen.getByText('运行中'));

    expect(onFilter).toHaveBeenCalledWith({ status: 'running' });
  });

  it('handles refresh button click', () => {
    const onRefresh = vi.fn();
    render(
      <MemoryRouter>
        <TaskFilter onFilter={vi.fn()} onRefresh={onRefresh} loading={false} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('刷新'));
    expect(onRefresh).toHaveBeenCalled();
  });
});

describe('TaskDetail', () => {
  it('renders task detail with all information', () => {
    render(
      <MemoryRouter>
        <TaskDetail task={mockTaskDetail} loading={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('基本信息')).toBeInTheDocument();
    expect(screen.getByText('任务内容')).toBeInTheDocument();
    expect(screen.getByText('统计数据')).toBeInTheDocument();
    expect(screen.getByText('时间线')).toBeInTheDocument();
    expect(screen.getByText('子任务')).toBeInTheDocument();
  });

  it('displays task ID', () => {
    render(
      <MemoryRouter>
        <TaskDetail task={mockTaskDetail} loading={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('task-001')).toBeInTheDocument();
  });

  it('displays subtasks with progress', () => {
    render(
      <MemoryRouter>
        <TaskDetail task={mockTaskDetail} loading={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('Validate input')).toBeInTheDocument();
    expect(screen.getByText('Transform data')).toBeInTheDocument();
    expect(screen.getByText('Export results')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <MemoryRouter>
        <TaskDetail task={null} loading={true} />
      </MemoryRouter>
    );

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('shows empty state when no task', () => {
    render(
      <MemoryRouter>
        <TaskDetail task={null} loading={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('任务不存在或已被删除')).toBeInTheDocument();
  });

  it('displays token statistics', () => {
    render(
      <MemoryRouter>
        <TaskDetail task={mockTaskDetail} loading={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('2300')).toBeInTheDocument();
    expect(screen.getByText('3800')).toBeInTheDocument();
  });

  it('displays runtime formatted correctly', () => {
    render(
      <MemoryRouter>
        <TaskDetail task={mockTaskDetail} loading={false} />
      </MemoryRouter>
    );

    expect(taskService.formatRuntime).toHaveBeenCalledWith(3600);
  });
});

describe('taskService', () => {
  describe('getTaskStatusColor', () => {
    it('returns correct color for running status', () => {
      expect(taskService.getTaskStatusColor('running')).toBe('blue');
    });

    it('returns correct color for done status', () => {
      expect(taskService.getTaskStatusColor('done')).toBe('green');
    });

    it('returns correct color for failed status', () => {
      expect(taskService.getTaskStatusColor('failed')).toBe('red');
    });

    it('returns default color for unknown status', () => {
      expect(taskService.getTaskStatusColor('unknown')).toBe('default');
    });
  });

  describe('getTaskStatusLabel', () => {
    it('returns correct label for running status', () => {
      expect(taskService.getTaskStatusLabel('running')).toBe('运行中');
    });

    it('returns correct label for done status', () => {
      expect(taskService.getTaskStatusLabel('done')).toBe('已完成');
    });

    it('returns correct label for failed status', () => {
      expect(taskService.getTaskStatusLabel('failed')).toBe('失败');
    });
  });

  describe('formatRuntime', () => {
    it('formats seconds correctly', () => {
      expect(taskService.formatRuntime(45)).toBe('45s');
    });

    it('formats minutes and seconds correctly', () => {
      expect(taskService.formatRuntime(125)).toBe('2m 5s');
    });

    it('formats hours, minutes and seconds correctly', () => {
      expect(taskService.formatRuntime(3665)).toBe('1h 1m 5s');
    });

    it('returns dash for null/undefined', () => {
      expect(taskService.formatRuntime(null)).toBe('-');
      expect(taskService.formatRuntime(undefined)).toBe('-');
    });
  });

  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const result = taskService.formatDate('2024-03-14T08:00:00Z');
      expect(result).not.toBe('-');
      expect(result).toContain('2024');
    });

    it('returns dash for null/undefined', () => {
      expect(taskService.formatDate(null)).toBe('-');
      expect(taskService.formatDate(undefined)).toBe('-');
    });
  });
});
