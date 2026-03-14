import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfigHistory from '../pages/ConfigHistory/ConfigHistory';
import VersionList from '../components/VersionList';
import VersionCompare from '../components/VersionCompare';

// Mock fetch
global.fetch = jest.fn();

// Mock Ant Design Modal
jest.mock('antd', () => {
  const actualAntd = jest.requireActual('antd');
  return {
    ...actualAntd,
    Modal: {
      ...actualAntd.Modal,
      success: jest.fn((config) => {
        if (config.onOk) config.onOk();
      }),
      error: jest.fn(),
      confirm: jest.fn((config) => {
        if (config.onOk) config.onOk();
      }),
    },
  };
});

describe('ConfigHistory Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockVersions = [
    {
      versionId: 'v1.0.0',
      timestamp: '2024-03-01T10:00:00Z',
      author: 'admin',
      description: '初始版本配置',
      changes: [
        { path: 'agent.model', old: null, new: 'qwen3.5-plus', type: 'add' },
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
      status: 'current',
    },
  ];

  describe('VersionList Component', () => {
    const mockHandlers = {
      onSelectVersion: jest.fn(),
      onViewDetails: jest.fn(),
      onCompare: jest.fn(),
      onRollback: jest.fn(),
    };

    test('renders version list with versions', () => {
      render(<VersionList versions={mockVersions} {...mockHandlers} />);
      
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
      expect(screen.getByText('v1.1.0')).toBeInTheDocument();
      expect(screen.getByText('v1.2.0')).toBeInTheDocument();
    });

    test('displays version descriptions', () => {
      render(<VersionList versions={mockVersions} {...mockHandlers} />);
      
      expect(screen.getByText('初始版本配置')).toBeInTheDocument();
      expect(screen.getByText('添加工具权限配置')).toBeInTheDocument();
      expect(screen.getByText('更新模型配置')).toBeInTheDocument();
    });

    test('displays version authors', () => {
      render(<VersionList versions={mockVersions} {...mockHandlers} />);
      
      expect(screen.getAllByText('admin').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('developer')).toBeInTheDocument();
    });

    test('displays status tags correctly', () => {
      render(<VersionList versions={mockVersions} {...mockHandlers} />);
      
      expect(screen.getAllByText('稳定').length).toBe(2);
      expect(screen.getByText('当前版本')).toBeInTheDocument();
    });

    test('displays change count', () => {
      render(<VersionList versions={mockVersions} {...mockHandlers} />);
      
      expect(screen.getAllByText('共 1 处变更').length).toBe(3);
    });

    test('renders action buttons for each version', () => {
      render(<VersionList versions={mockVersions} {...mockHandlers} />);
      
      // Each version should have detail button
      const detailButtons = screen.getAllByText('详情');
      expect(detailButtons.length).toBe(3);
      
      // Current version should not have rollback button
      const rollbackButtons = screen.getAllByText('回滚');
      expect(rollbackButtons.length).toBe(2);
    });

    test('calls onViewDetails when detail button is clicked', () => {
      render(<VersionList versions={mockVersions} {...mockHandlers} />);
      
      const detailButtons = screen.getAllByText('详情');
      fireEvent.click(detailButtons[0]);
      
      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith(mockVersions[0]);
    });

    test('calls onRollback when rollback button is clicked', () => {
      render(<VersionList versions={mockVersions} {...mockHandlers} />);
      
      const rollbackButtons = screen.getAllByText('回滚');
      fireEvent.click(rollbackButtons[0]);
      
      expect(mockHandlers.onRollback).toHaveBeenCalled();
    });

    test('calls onSelectVersion when version item is clicked', () => {
      render(<VersionList versions={mockVersions} {...mockHandlers} />);
      
      const versionItems = screen.getAllByText(/v\d+\.\d+\.\d+/);
      fireEvent.click(versionItems[0]);
      
      expect(mockHandlers.onSelectVersion).toHaveBeenCalled();
    });

    test('renders loading state', () => {
      render(<VersionList loading={true} {...mockHandlers} />);
      
      expect(screen.getByText('加载版本历史...')).toBeInTheDocument();
    });

    test('renders empty state when no versions', () => {
      render(<VersionList versions={[]} {...mockHandlers} />);
      
      expect(screen.getByText('暂无版本历史')).toBeInTheDocument();
    });

    test('disables compare button when no version selected', () => {
      render(<VersionList versions={mockVersions} selectedVersion={null} {...mockHandlers} />);
      
      const compareButtons = screen.getAllByText('对比');
      compareButtons.forEach(btn => {
        expect(btn).toBeDisabled();
      });
    });
  });

  describe('VersionCompare Component', () => {
    const mockCompareResult = {
      from: mockVersions[0],
      to: mockVersions[1],
      diff: [
        {
          path: 'agent.tools',
          oldValue: ['read', 'write'],
          newValue: ['read', 'write', 'exec'],
          type: 'modify',
        },
        {
          path: 'agent.workspacePath',
          oldValue: null,
          newValue: '/home/admin/.openclaw/workspace',
          type: 'add',
        },
      ],
    };

    test('renders comparison modal when visible', () => {
      render(
        <VersionCompare
          visible={true}
          versions={mockVersions}
          selectedVersion={mockVersions[1]}
          onClose={jest.fn()}
        />
      );
      
      expect(screen.getByText('版本对比')).toBeInTheDocument();
    });

    test('renders version selectors', async () => {
      render(
        <VersionCompare
          visible={true}
          versions={mockVersions}
          selectedVersion={mockVersions[1]}
          onClose={jest.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('从版本')).toBeInTheDocument();
        expect(screen.getByText('到版本')).toBeInTheDocument();
      });
    });

    test('displays close button', () => {
      const onClose = jest.fn();
      render(
        <VersionCompare
          visible={true}
          versions={mockVersions}
          selectedVersion={mockVersions[1]}
          onClose={onClose}
        />
      );
      
      expect(screen.getByText('关闭')).toBeInTheDocument();
    });

    test('renders loading state during comparison', async () => {
      fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(
        <VersionCompare
          visible={true}
          versions={mockVersions}
          selectedVersion={mockVersions[1]}
          onClose={jest.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('正在对比版本...')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('renders error state when comparison fails', async () => {
      fetch.mockImplementation(() => Promise.reject(new Error('Comparison failed')));
      
      render(
        <VersionCompare
          visible={true}
          versions={mockVersions}
          selectedVersion={mockVersions[1]}
          onClose={jest.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('对比失败')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('renders diff table with changes', async () => {
      fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCompareResult),
        })
      );
      
      render(
        <VersionCompare
          visible={true}
          versions={mockVersions}
          selectedVersion={mockVersions[1]}
          onClose={jest.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('配置路径')).toBeInTheDocument();
        expect(screen.getByText('旧值')).toBeInTheDocument();
        expect(screen.getByText('新值')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('displays change type tags', async () => {
      fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCompareResult),
        })
      );
      
      render(
        <VersionCompare
          visible={true}
          versions={mockVersions}
          selectedVersion={mockVersions[1]}
          onClose={jest.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('修改')).toBeInTheDocument();
        expect(screen.getByText('新增')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('displays summary statistics', async () => {
      fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCompareResult),
        })
      );
      
      render(
        <VersionCompare
          visible={true}
          versions={mockVersions}
          selectedVersion={mockVersions[1]}
          onClose={jest.fn()}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText(/新增：\d+/)).toBeInTheDocument();
        expect(screen.getByText(/修改：\d+/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(
        <VersionCompare
          visible={true}
          versions={mockVersions}
          selectedVersion={mockVersions[1]}
          onClose={onClose}
        />
      );
      
      fireEvent.click(screen.getByText('关闭'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('ConfigHistory Page Integration', () => {
    test('renders ConfigHistory page', () => {
      fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockVersions, total: 3 }),
        })
      );
      
      render(<ConfigHistory />);
      
      expect(screen.getByText('配置版本历史')).toBeInTheDocument();
    });

    test('fetches version history on mount', async () => {
      fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockVersions, total: 3 }),
        })
      );
      
      render(<ConfigHistory />);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/config/history?page=1&pageSize=10');
      }, { timeout: 2000 });
    });

    test('fetches current config on mount', async () => {
      fetch.mockImplementation((url) => {
        if (url.includes('/config/current')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ versionId: 'v1.2.0' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockVersions, total: 3 }),
        });
      });
      
      render(<ConfigHistory />);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/config/current');
      }, { timeout: 2000 });
    });

    test('displays error alert when fetch fails', async () => {
      fetch.mockImplementation(() => Promise.reject(new Error('Network error')));
      
      render(<ConfigHistory />);
      
      await waitFor(() => {
        expect(screen.getByText('加载失败')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('renders refresh button', () => {
      fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockVersions, total: 3 }),
        })
      );
      
      render(<ConfigHistory />);
      
      expect(screen.getByText('刷新')).toBeInTheDocument();
    });

    test('displays version count', async () => {
      fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockVersions, total: 3 }),
        })
      );
      
      render(<ConfigHistory />);
      
      await waitFor(() => {
        expect(screen.getByText(/共 \d+ 个版本/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Rollback Functionality', () => {
    test('opens rollback confirmation modal', async () => {
      fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockVersions, total: 3 }),
        })
      );
      
      render(<ConfigHistory />);
      
      await waitFor(() => {
        const rollbackButtons = screen.queryAllByText('回滚');
        if (rollbackButtons.length > 0) {
          fireEvent.click(rollbackButtons[0]);
          expect(screen.getByText('确认回滚')).toBeInTheDocument();
        }
      }, { timeout: 2000 });
    });

    test('displays rollback warning', async () => {
      fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockVersions, total: 3 }),
        })
      );
      
      render(<ConfigHistory />);
      
      await waitFor(() => {
        const rollbackButtons = screen.queryAllByText('回滚');
        if (rollbackButtons.length > 0) {
          fireEvent.click(rollbackButtons[0]);
          expect(screen.getByText('回滚操作将覆盖当前配置，请确保已备份重要数据。')).toBeInTheDocument();
        }
      }, { timeout: 2000 });
    });
  });
});
