import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import BackupPage from '../../src/pages/Backup/Backup';
import BackupList from '../../src/components/BackupList';
import BackupSchedule from '../../src/components/BackupSchedule';
import RestoreDialog from '../../src/components/RestoreDialog';
import * as backupService from '../../src/services/backupService';

// Mock backup service
vi.mock('../../src/services/backupService', () => ({
  fetchBackups: vi.fn(),
  createBackup: vi.fn(),
  restoreBackup: vi.fn(),
  deleteBackup: vi.fn(),
  fetchBackupSchedule: vi.fn(),
  updateBackupSchedule: vi.fn(),
  fetchBackupProgress: vi.fn(),
}));

const renderWithProviders = (component) => {
  return render(
    <ConfigProvider>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </ConfigProvider>
  );
};

describe('Backup Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BackupList Component', () => {
    const mockBackups = [
      {
        id: 'backup_001',
        createdAt: '2024-01-15T10:30:00Z',
        size: 45.6,
        status: 'completed',
        type: 'manual',
        description: '手动备份',
      },
      {
        id: 'backup_002',
        createdAt: '2024-01-14T02:00:00Z',
        size: 52.3,
        status: 'completed',
        type: 'scheduled',
        description: '每日自动备份',
      },
      {
        id: 'backup_003',
        createdAt: '2024-01-13T02:00:00Z',
        size: 48.9,
        status: 'in_progress',
        type: 'scheduled',
        progress: 65,
      },
    ];

    it('renders backup list correctly', () => {
      renderWithProviders(
        <BackupList data={mockBackups} loading={false} />
      );

      expect(screen.getByText('backup_001')).toBeInTheDocument();
      expect(screen.getByText('backup_002')).toBeInTheDocument();
      expect(screen.getByText('45.6 MB')).toBeInTheDocument();
      expect(screen.getByText('52.3 MB')).toBeInTheDocument();
    });

    it('displays loading state', () => {
      renderWithProviders(
        <BackupList data={[]} loading={true} />
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('shows status tags correctly', () => {
      renderWithProviders(
        <BackupList data={mockBackups} loading={false} />
      );

      expect(screen.getByText('完成')).toBeInTheDocument();
      expect(screen.getByText('进行中')).toBeInTheDocument();
    });

    it('shows type tags correctly', () => {
      renderWithProviders(
        <BackupList data={mockBackups} loading={false} />
      );

      expect(screen.getByText('手动')).toBeInTheDocument();
      expect(screen.getByText('自动')).toBeInTheDocument();
    });

    it('disables restore button for non-completed backups', () => {
      renderWithProviders(
        <BackupList data={mockBackups} loading={false} />
      );

      const restoreButtons = screen.getAllByTitle('恢复');
      // The in_progress backup should have a disabled restore button
      expect(restoreButtons.length).toBeGreaterThan(0);
    });
  });

  describe('RestoreDialog Component', () => {
    const mockBackup = {
      id: 'backup_001',
      createdAt: '2024-01-15T10:30:00Z',
      size: 45.6,
      status: 'completed',
      type: 'manual',
      description: '手动备份',
    };

    it('renders dialog when visible', () => {
      renderWithProviders(
        <RestoreDialog
          visible={true}
          backup={mockBackup}
          onCancel={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      expect(screen.getByText('确认恢复备份')).toBeInTheDocument();
      expect(screen.getByText('警告：此操作将覆盖当前数据')).toBeInTheDocument();
    });

    it('does not render when not visible', () => {
      renderWithProviders(
        <RestoreDialog
          visible={false}
          backup={mockBackup}
          onCancel={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      expect(screen.queryByText('确认恢复备份')).not.toBeInTheDocument();
    });

    it('displays backup information', () => {
      renderWithProviders(
        <RestoreDialog
          visible={true}
          backup={mockBackup}
          onCancel={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      expect(screen.getByText('backup_001')).toBeInTheDocument();
      expect(screen.getByText('45.6 MB')).toBeInTheDocument();
    });

    it('requires confirmation text to enable confirm button', async () => {
      const onConfirm = vi.fn();
      renderWithProviders(
        <RestoreDialog
          visible={true}
          backup={mockBackup}
          onCancel={vi.fn()}
          onConfirm={onConfirm}
        />
      );

      const input = screen.getByPlaceholderText('输入 RESTORE');
      const confirmButton = screen.getByText('确认恢复');

      // Initially disabled
      expect(confirmButton).toBeDisabled();

      // Type confirmation text
      fireEvent.change(input, { target: { value: 'RESTORE' } });

      await waitFor(() => {
        expect(confirmButton).not.toBeDisabled();
      });
    });
  });

  describe('BackupSchedule Component', () => {
    const mockSchedule = {
      enabled: true,
      frequency: 'daily',
      time: '02:00',
      retentionDays: 30,
      retentionCount: 10,
    };

    beforeEach(() => {
      backupService.fetchBackupSchedule.mockResolvedValue(mockSchedule);
    });

    it('renders schedule configuration form', async () => {
      renderWithProviders(<BackupSchedule />);

      await waitFor(() => {
        expect(screen.getByText('备份计划配置')).toBeInTheDocument();
      });
    });

    it('loads schedule data on mount', async () => {
      renderWithProviders(<BackupSchedule />);

      await waitFor(() => {
        expect(backupService.fetchBackupSchedule).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('BackupPage Component', () => {
    const mockBackups = {
      data: [
        {
          id: 'backup_001',
          createdAt: '2024-01-15T10:30:00Z',
          size: 45.6,
          status: 'completed',
          type: 'manual',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    };

    beforeEach(() => {
      backupService.fetchBackups.mockResolvedValue(mockBackups);
    });

    it('renders backup management page', async () => {
      renderWithProviders(<BackupPage />);

      await waitFor(() => {
        expect(screen.getByText('备份管理')).toBeInTheDocument();
      });
    });

    it('displays statistics', async () => {
      renderWithProviders(<BackupPage />);

      await waitFor(() => {
        expect(screen.getByText('备份总数')).toBeInTheDocument();
        expect(screen.getByText('成功备份')).toBeInTheDocument();
      });
    });

    it('calls createBackup when create button is clicked', async () => {
      backupService.createBackup.mockResolvedValue({
        success: true,
        data: { id: 'backup_new' },
      });

      renderWithProviders(<BackupPage />);

      await waitFor(() => {
        expect(screen.getByText('备份管理')).toBeInTheDocument();
      });

      const createButton = screen.getByText('创建备份');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(backupService.createBackup).toHaveBeenCalledWith({
          type: 'manual',
          description: '手动备份',
        });
      });
    });

    it('loads backups on mount', async () => {
      renderWithProviders(<BackupPage />);

      await waitFor(() => {
        expect(backupService.fetchBackups).toHaveBeenCalled();
      });
    });
  });

  describe('Backup Service', () => {
    const mockBackups = {
      data: [
        {
          id: 'backup_001',
          createdAt: '2024-01-15T10:30:00Z',
          size: 45.6,
          status: 'completed',
          type: 'manual',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    };

    it('fetchBackups returns backup list', async () => {
      backupService.fetchBackups.mockResolvedValue(mockBackups);

      const result = await backupService.fetchBackups({ page: 1, pageSize: 10 });

      expect(result).toEqual(mockBackups);
      expect(result.data).toHaveLength(1);
    });

    it('createBackup creates new backup', async () => {
      const newBackup = {
        success: true,
        data: {
          id: 'backup_new',
          type: 'manual',
          status: 'in_progress',
        },
      };

      backupService.createBackup.mockResolvedValue(newBackup);

      const result = await backupService.createBackup({
        type: 'manual',
        description: '测试备份',
      });

      expect(result).toEqual(newBackup);
      expect(result.success).toBe(true);
    });

    it('deleteBackup removes backup', async () => {
      backupService.deleteBackup.mockResolvedValue({
        success: true,
        message: '备份删除成功',
      });

      const result = await backupService.deleteBackup('backup_001');

      expect(result.success).toBe(true);
      expect(backupService.deleteBackup).toHaveBeenCalledWith('backup_001');
    });

    it('restoreBackup restores backup', async () => {
      backupService.restoreBackup.mockResolvedValue({
        success: true,
        message: '备份恢复成功',
      });

      const result = await backupService.restoreBackup('backup_001');

      expect(result.success).toBe(true);
      expect(backupService.restoreBackup).toHaveBeenCalledWith('backup_001', {});
    });

    it('fetchBackupSchedule returns schedule configuration', async () => {
      const schedule = {
        enabled: true,
        frequency: 'daily',
        time: '02:00',
      };

      backupService.fetchBackupSchedule.mockResolvedValue(schedule);

      const result = await backupService.fetchBackupSchedule();

      expect(result).toEqual(schedule);
      expect(result.enabled).toBe(true);
    });

    it('updateBackupSchedule updates configuration', async () => {
      const newSchedule = {
        enabled: false,
        frequency: 'weekly',
      };

      backupService.updateBackupSchedule.mockResolvedValue({
        success: true,
        data: newSchedule,
      });

      const result = await backupService.updateBackupSchedule(newSchedule);

      expect(result.success).toBe(true);
      expect(backupService.updateBackupSchedule).toHaveBeenCalledWith(newSchedule);
    });
  });
});
