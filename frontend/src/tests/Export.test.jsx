import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExportPage from '../pages/Export/Export';
import ExportConfig from '../components/ExportConfig';
import ExportHistory from '../components/ExportHistory';
import ExportProgress from '../components/ExportProgress';
import {
  EXPORT_TYPES,
  EXPORT_FORMATS,
  initiateExport,
  getExportProgress,
  getExportHistory,
  downloadExport,
  cancelExport,
} from '../services/exportService';

// Mock Ant Design components
jest.mock('antd', () => {
  const actualAntd = jest.requireActual('antd');
  return {
    ...actualAntd,
    message: {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warning: jest.fn(),
    },
  };
});

// Mock export service
jest.mock('../services/exportService', () => ({
  EXPORT_TYPES: {
    AGENT: 'agent',
    TASK: 'task',
    LOG: 'log',
    CONFIG: 'config',
  },
  EXPORT_FORMATS: {
    CSV: 'csv',
    JSON: 'json',
    XLSX: 'xlsx',
  },
  AVAILABLE_FIELDS: {
    agent: [
      { key: 'id', label: 'Agent ID' },
      { key: 'name', label: '名称' },
      { key: 'status', label: '状态' },
    ],
    task: [
      { key: 'id', label: '任务 ID' },
      { key: 'status', label: '状态' },
      { key: 'content', label: '内容' },
    ],
    log: [
      { key: 'id', label: '日志 ID' },
      { key: 'level', label: '级别' },
      { key: 'message', label: '消息' },
    ],
    config: [
      { key: 'key', label: '配置键' },
      { key: 'value', label: '配置值' },
      { key: 'type', label: '类型' },
    ],
  },
  initiateExport: jest.fn(),
  getExportProgress: jest.fn(),
  getExportHistory: jest.fn(),
  downloadExport: jest.fn(),
  cancelExport: jest.fn(),
  deleteExportRecord: jest.fn(),
}));

describe('ExportConfig Component', () => {
  const mockOnConfigChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders data type selection', () => {
    render(<ExportConfig onConfigChange={mockOnConfigChange} />);
    
    expect(screen.getByText('数据类型')).toBeInTheDocument();
    expect(screen.getByText('Agent 数据')).toBeInTheDocument();
    expect(screen.getByText('任务数据')).toBeInTheDocument();
    expect(screen.getByText('日志数据')).toBeInTheDocument();
    expect(screen.getByText('配置数据')).toBeInTheDocument();
  });

  test('renders export format selection', () => {
    render(<ExportConfig onConfigChange={mockOnConfigChange} />);
    
    expect(screen.getByText('导出格式')).toBeInTheDocument();
    expect(screen.getByText(/CSV - 逗号分隔值/)).toBeInTheDocument();
    expect(screen.getByText(/JSON - JavaScript 对象/)).toBeInTheDocument();
    expect(screen.getByText(/XLSX - Excel 表格/)).toBeInTheDocument();
  });

  test('renders field configuration section', () => {
    render(<ExportConfig onConfigChange={mockOnConfigChange} />);
    
    expect(screen.getByText('字段配置')).toBeInTheDocument();
    expect(screen.getByText('全选')).toBeInTheDocument();
    expect(screen.getByText('取消全选')).toBeInTheDocument();
  });

  test('handles data type change', async () => {
    render(<ExportConfig onConfigChange={mockOnConfigChange} />);
    
    const typeSelect = screen.getByPlaceholderText('选择要导出的数据类型');
    fireEvent.mouseDown(typeSelect);
    
    await waitFor(() => {
      const taskOption = screen.getByText('任务数据');
      fireEvent.click(taskOption);
    });

    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'task',
      })
    );
  });

  test('handles format change', async () => {
    render(<ExportConfig onConfigChange={mockOnConfigChange} />);
    
    const formatSelect = screen.getByPlaceholderText('选择导出文件格式');
    fireEvent.mouseDown(formatSelect);
    
    await waitFor(() => {
      const jsonOption = screen.getByText('JSON - JavaScript 对象');
      fireEvent.click(jsonOption);
    });

    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'json',
      })
    );
  });

  test('handles field selection', () => {
    render(<ExportConfig onConfigChange={mockOnConfigChange} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    
    fireEvent.click(checkboxes[0]);
    
    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: expect.arrayContaining([expect.any(String)]),
      })
    );
  });

  test('handles select all fields', () => {
    render(<ExportConfig onConfigChange={mockOnConfigChange} />);
    
    const selectAllButton = screen.getByText('全选');
    fireEvent.click(selectAllButton);
    
    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: expect.any(Array),
      })
    );
  });

  test('shows filter conditions for task type', () => {
    render(<ExportConfig onConfigChange={mockOnConfigChange} initialConfig={{ type: 'task' }} />);
    
    expect(screen.getByText('数据过滤')).toBeInTheDocument();
    expect(screen.getByText('状态筛选')).toBeInTheDocument();
    expect(screen.getByText('时间范围')).toBeInTheDocument();
  });
});

describe('ExportProgress Component', () => {
  const mockJobId = 'export-job-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', async () => {
    getExportProgress.mockResolvedValue({
      status: 'processing',
      percentage: 0,
      totalRecords: 100,
      processedRecords: 0,
    });

    await act(async () => {
      render(<ExportProgress jobId={mockJobId} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/正在导出|等待开始/i)).toBeInTheDocument();
    });
  });

  test('renders completed state', async () => {
    getExportProgress.mockResolvedValue({
      status: 'completed',
      percentage: 100,
      totalRecords: 100,
      processedRecords: 100,
    });

    await act(async () => {
      render(<ExportProgress jobId={mockJobId} />);
    });

    await waitFor(() => {
      expect(screen.getByText('导出完成')).toBeInTheDocument();
    });
  });

  test('renders failed state', async () => {
    getExportProgress.mockResolvedValue({
      status: 'failed',
      percentage: 45,
      totalRecords: 100,
      processedRecords: 45,
    });

    await act(async () => {
      render(<ExportProgress jobId={mockJobId} />);
    });

    await waitFor(() => {
      expect(screen.getByText('导出失败')).toBeInTheDocument();
    });
  });

  test('displays progress statistics', async () => {
    getExportProgress.mockResolvedValue({
      status: 'processing',
      percentage: 50,
      totalRecords: 200,
      processedRecords: 100,
      estimatedTime: 120,
    });

    await act(async () => {
      render(<ExportProgress jobId={mockJobId} />);
    });

    await waitFor(() => {
      expect(screen.getByText('总记录数')).toBeInTheDocument();
      expect(screen.getByText('已处理')).toBeInTheDocument();
      expect(screen.getByText('剩余时间')).toBeInTheDocument();
    });
  });

  test('shows download button when completed', async () => {
    getExportProgress.mockResolvedValue({
      status: 'completed',
      percentage: 100,
      totalRecords: 100,
      processedRecords: 100,
    });

    await act(async () => {
      render(<ExportProgress jobId={mockJobId} />);
    });

    await waitFor(() => {
      expect(screen.getByText('下载导出文件')).toBeInTheDocument();
    });
  });

  test('shows cancel button when processing', async () => {
    getExportProgress.mockResolvedValue({
      status: 'processing',
      percentage: 50,
      totalRecords: 100,
      processedRecords: 50,
    });

    await act(async () => {
      render(<ExportProgress jobId={mockJobId} />);
    });

    await waitFor(() => {
      expect(screen.getByText('取消导出')).toBeInTheDocument();
    });
  });
});

describe('ExportHistory Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders history header', async () => {
    getExportHistory.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
    });

    await act(async () => {
      render(<ExportHistory />);
    });

    await waitFor(() => {
      expect(screen.getByText('导出历史')).toBeInTheDocument();
    });
  });

  test('renders filter controls', async () => {
    getExportHistory.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
    });

    await act(async () => {
      render(<ExportHistory />);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索导出 ID')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('数据类型')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('导出格式')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('状态')).toBeInTheDocument();
    });
  });

  test('displays empty state when no history', async () => {
    getExportHistory.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
    });

    await act(async () => {
      render(<ExportHistory />);
    });

    await waitFor(() => {
      expect(screen.getByText('暂无导出记录')).toBeInTheDocument();
    });
  });

  test('renders history records', async () => {
    const mockHistory = {
      data: [
        {
          id: 'export-001',
          type: 'task',
          format: 'csv',
          status: 'completed',
          recordCount: 150,
          fileSize: 25600,
          createdAt: '2024-03-14T08:00:00Z',
        },
      ],
      total: 1,
      page: 1,
    };

    getExportHistory.mockResolvedValue(mockHistory);

    await act(async () => {
      render(<ExportHistory />);
    });

    await waitFor(() => {
      expect(screen.getByText('export-001')).toBeInTheDocument();
    });
  });

  test('handles download action', async () => {
    const mockHistory = {
      data: [
        {
          id: 'export-001',
          type: 'task',
          format: 'csv',
          status: 'completed',
          recordCount: 150,
          fileSize: 25600,
          createdAt: '2024-03-14T08:00:00Z',
        },
      ],
      total: 1,
      page: 1,
    };

    getExportHistory.mockResolvedValue(mockHistory);
    downloadExport.mockResolvedValue();

    await act(async () => {
      render(<ExportHistory />);
    });

    await waitFor(() => {
      const downloadButton = screen.getByText('下载');
      fireEvent.click(downloadButton);
    });

    expect(downloadExport).toHaveBeenCalled();
  });
});

describe('ExportPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders export page header', () => {
    render(<ExportPage />);
    
    expect(screen.getByText('数据导出')).toBeInTheDocument();
    expect(screen.getByText(/配置并导出系统数据/i)).toBeInTheDocument();
  });

  test('renders workflow steps', () => {
    render(<ExportPage />);
    
    expect(screen.getByText('配置导出')).toBeInTheDocument();
    expect(screen.getByText('导出进行中')).toBeInTheDocument();
    expect(screen.getByText('完成')).toBeInTheDocument();
  });

  test('renders export config in step 0', () => {
    render(<ExportPage />);
    
    expect(screen.getByText('数据类型')).toBeInTheDocument();
    expect(screen.getByText('导出格式')).toBeInTheDocument();
    expect(screen.getByText('字段配置')).toBeInTheDocument();
  });

  test('shows start export button', () => {
    render(<ExportPage />);
    
    expect(screen.getByText('开始导出')).toBeInTheDocument();
  });

  test('shows view history button', () => {
    render(<ExportPage />);
    
    expect(screen.getByText('查看历史')).toBeInTheDocument();
  });

  test('handles export initiation', async () => {
    initiateExport.mockResolvedValue({
      id: 'export-job-123',
      status: 'pending',
    });

    render(<ExportPage />);
    
    const startButton = screen.getByText('开始导出');
    fireEvent.click(startButton);

    // Validation should fail without selecting fields
    await waitFor(() => {
      expect(screen.getByText('请至少选择一个字段')).toBeInTheDocument();
    });
  });
});

describe('Export Service Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('initiateExport makes correct API call', async () => {
    const mockResponse = {
      id: 'export-123',
      status: 'pending',
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const params = {
      type: 'task',
      format: 'csv',
      fields: ['id', 'status'],
      filters: { status: 'running' },
    };

    const result = await initiateExport(params);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/export/initiate',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    expect(result).toEqual(mockResponse);
  });

  test('getExportProgress makes correct API call', async () => {
    const mockProgress = {
      status: 'processing',
      percentage: 50,
      totalRecords: 100,
      processedRecords: 50,
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockProgress,
    });

    const result = await getExportProgress('export-123');

    expect(global.fetch).toHaveBeenCalledWith('/api/export/progress/export-123');
    expect(result).toEqual(mockProgress);
  });

  test('getExportHistory makes correct API call with params', async () => {
    const mockHistory = {
      data: [],
      total: 0,
      page: 1,
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockHistory,
    });

    const params = {
      page: 1,
      pageSize: 10,
      type: 'task',
    };

    const result = await getExportHistory(params);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/export/history?')
    );
    expect(result).toEqual(mockHistory);
  });

  test('cancelExport makes correct API call', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const result = await cancelExport('export-123');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/export/cancel/export-123',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});
