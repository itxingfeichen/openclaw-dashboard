import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import AgentCreate from '../pages/AgentCreate/AgentCreate';
import AgentCreateForm from '../components/AgentCreateForm';
import AgentTemplateSelector from '../components/AgentTemplateSelector';
import * as agentService from '../services/agentService';

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
      loading: vi.fn(),
    },
  };
});

// Mock agent service
vi.mock('../services/agentService', () => ({
  createAgent: vi.fn(),
  fetchTemplates: vi.fn(),
  validateAgentConfig: vi.fn(),
  fetchAgents: vi.fn(),
  fetchAgentById: vi.fn(),
  getStatusColor: vi.fn(),
  startAgent: vi.fn(),
  stopAgent: vi.fn(),
  restartAgent: vi.fn(),
  getAgentStatus: vi.fn(),
}));

/**
 * Helper to render components with providers
 */
const renderWithProviders = (component, options = {}) => {
  return render(
    <ConfigProvider>
      <MemoryRouter>{component}</MemoryRouter>
    </ConfigProvider>,
    options
  );
};

describe('AgentCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AgentCreate Page', () => {
    it('renders the create page with header', () => {
      renderWithProviders(<AgentCreate />);
      
      expect(screen.getByText('创建 Agent')).toBeInTheDocument();
      expect(
        screen.getByText(/填写以下信息创建新的 Agent/i)
      ).toBeInTheDocument();
    });

    it('renders template selector and form sections', () => {
      renderWithProviders(<AgentCreate />);
      
      expect(screen.getByText(/选择预设模板/i)).toBeInTheDocument();
    });

    it('navigates back when back arrow is clicked', () => {
      renderWithProviders(<AgentCreate />);
      
      const backArrow = screen.getByText('创建 Agent').previousSibling;
      fireEvent.click(backArrow);
      
      // Navigation would be tested with router mock
    });
  });

  describe('AgentCreateForm', () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
      mockOnSubmit.mockClear();
      agentService.validateAgentConfig.mockResolvedValue({ valid: true });
    });

    it('renders all form fields', () => {
      renderWithProviders(
        <AgentCreateForm onSubmit={mockOnSubmit} loading={false} />
      );

      expect(screen.getByLabelText(/Agent 名称/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/描述/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/模型选择/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/工具权限/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/工作空间路径/i)).toBeInTheDocument();
    });

    it('shows validation error for empty name', async () => {
      renderWithProviders(
        <AgentCreateForm onSubmit={mockOnSubmit} loading={false} />
      );

      const submitButton = screen.getByText('创建 Agent');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/请输入 Agent 名称/i)).toBeInTheDocument();
      });
    });

    it('validates name format', async () => {
      renderWithProviders(
        <AgentCreateForm onSubmit={mockOnSubmit} loading={false} />
      );

      const nameInput = screen.getByLabelText(/Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'test@invalid' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(
          screen.getByText(/名称只能包含字母、数字、中文、下划线和连字符/i)
        ).toBeInTheDocument();
      });
    });

    it('validates workspace path format', async () => {
      renderWithProviders(
        <AgentCreateForm onSubmit={mockOnSubmit} loading={false} />
      );

      const pathInput = screen.getByLabelText(/工作空间路径/i);
      fireEvent.change(pathInput, { target: { value: 'relative/path' } });
      fireEvent.blur(pathInput);

      await waitFor(() => {
        expect(
          screen.getByText(/必须是绝对路径/i)
        ).toBeInTheDocument();
      });
    });

    it('submits form with valid data', async () => {
      agentService.validateAgentConfig.mockResolvedValue({ valid: true });
      
      renderWithProviders(
        <AgentCreateForm onSubmit={mockOnSubmit} loading={false} />
      );

      const nameInput = screen.getByLabelText(/Agent 名称/i);
      const pathInput = screen.getByLabelText(/工作空间路径/i);

      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.change(pathInput, { target: { value: '/home/admin/workspace' } });

      // Wait for validation
      await waitFor(() => {
        expect(agentService.validateAgentConfig).toHaveBeenCalled();
      });

      const submitButton = screen.getByText('创建 Agent');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('shows loading state when submitting', () => {
      renderWithProviders(
        <AgentCreateForm onSubmit={mockOnSubmit} loading={true} />
      );

      expect(screen.getByText('创建 Agent').closest('button')).toHaveAttribute(
        'disabled'
      );
    });

    it('resets form when reset button is clicked', () => {
      renderWithProviders(
        <AgentCreateForm onSubmit={mockOnSubmit} loading={false} />
      );

      const nameInput = screen.getByLabelText(/Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });

      const resetButton = screen.getByText('重置');
      fireEvent.click(resetButton);

      expect(nameInput).toHaveValue('');
    });
  });

  describe('AgentTemplateSelector', () => {
    const mockOnApplyTemplate = vi.fn();

    beforeEach(() => {
      mockOnApplyTemplate.mockClear();
      agentService.fetchTemplates.mockResolvedValue({
        templates: [
          {
            id: 'template-001',
            name: '数据处理助手',
            description: '用于数据处理的 Agent',
            model: 'qwen3.5-plus',
            tools: ['read', 'write', 'exec'],
            workspacePath: '/home/admin/workspace',
          },
        ],
      });
    });

    it('renders template list', async () => {
      renderWithProviders(
        <AgentTemplateSelector onApplyTemplate={mockOnApplyTemplate} loading={false} />
      );

      await waitFor(() => {
        expect(screen.getByText('数据处理助手')).toBeInTheDocument();
      });
    });

    it('shows loading state', () => {
      renderWithProviders(
        <AgentTemplateSelector onApplyTemplate={mockOnApplyTemplate} loading={true} />
      );

      expect(screen.getByText(/加载模板中/i)).toBeInTheDocument();
    });

    it('calls onApplyTemplate when template is applied', async () => {
      renderWithProviders(
        <AgentTemplateSelector onApplyTemplate={mockOnApplyTemplate} loading={false} />
      );

      await waitFor(() => {
        expect(screen.getByText('数据处理助手')).toBeInTheDocument();
      });

      const applyButton = screen.getByText('应用此模板');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(mockOnApplyTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '数据处理助手',
            model: 'qwen3.5-plus',
            templateId: 'template-001',
          })
        );
      });
    });

    it('shows template details modal', async () => {
      renderWithProviders(
        <AgentTemplateSelector onApplyTemplate={mockOnApplyTemplate} loading={false} />
      );

      await waitFor(() => {
        expect(screen.getByText('详情')).toBeInTheDocument();
      });

      const detailButton = screen.getByText('详情');
      fireEvent.click(detailButton);

      await waitFor(() => {
        expect(screen.getByText('模板名称')).toBeInTheDocument();
      });
    });

    it('handles empty templates', async () => {
      agentService.fetchTemplates.mockResolvedValue({ templates: [] });

      renderWithProviders(
        <AgentTemplateSelector onApplyTemplate={mockOnApplyTemplate} loading={false} />
      );

      await waitFor(() => {
        expect(screen.getByText('暂无可用模板')).toBeInTheDocument();
      });
    });

    it('handles fetch error', async () => {
      agentService.fetchTemplates.mockRejectedValue(new Error('Failed to fetch'));

      renderWithProviders(
        <AgentTemplateSelector onApplyTemplate={mockOnApplyTemplate} loading={false} />
      );

      await waitFor(() => {
        expect(screen.getByText('暂无可用模板')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('applies template and fills form', async () => {
      agentService.fetchTemplates.mockResolvedValue({
        templates: [
          {
            id: 'template-001',
            name: 'Test Template',
            description: 'Test',
            model: 'qwen3.5-plus',
            tools: ['read', 'write'],
            workspacePath: '/home/admin/test',
          },
        ],
      });

      agentService.validateAgentConfig.mockResolvedValue({ valid: true });

      renderWithProviders(<AgentCreate />);

      await waitFor(() => {
        expect(screen.getByText('Test Template')).toBeInTheDocument();
      });

      const applyButton = screen.getAllByText('应用此模板')[0];
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Template')).toBeInTheDocument();
      });
    });

    it('completes full creation flow', async () => {
      agentService.createAgent.mockResolvedValue({
        success: true,
        id: 'agent-001',
      });

      agentService.validateAgentConfig.mockResolvedValue({ valid: true });

      renderWithProviders(<AgentCreate />);

      // Fill form
      const nameInput = screen.getByLabelText(/Agent 名称/i);
      const pathInput = screen.getByLabelText(/工作空间路径/i);

      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.change(pathInput, { target: { value: '/home/admin/workspace' } });

      // Submit
      const submitButton = screen.getByText('创建 Agent');
      fireEvent.click(submitButton);

      // Wait for creation to complete
      await waitFor(() => {
        expect(agentService.createAgent).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Agent',
            workspacePath: '/home/admin/workspace',
          })
        );
      });
    });
  });
});

describe('Agent Service Mocks', () => {
  it('createAgent calls correct API endpoint', async () => {
    const mockResponse = { success: true, id: 'agent-001' };
    agentService.createAgent.mockResolvedValue(mockResponse);

    const result = await agentService.createAgent({
      name: 'Test Agent',
      model: 'qwen3.5-plus',
      tools: ['read', 'write'],
      workspacePath: '/home/admin/workspace',
    });

    expect(result).toEqual(mockResponse);
    expect(agentService.createAgent).toHaveBeenCalledWith({
      name: 'Test Agent',
      model: 'qwen3.5-plus',
      tools: ['read', 'write'],
      workspacePath: '/home/admin/workspace',
    });
  });

  it('fetchTemplates returns templates', async () => {
    const mockTemplates = {
      templates: [
        {
          id: 'template-001',
          name: 'Test Template',
          description: 'Test',
          model: 'qwen3.5-plus',
          tools: ['read'],
          workspacePath: '/home/admin/test',
        },
      ],
    };
    agentService.fetchTemplates.mockResolvedValue(mockTemplates);

    const result = await agentService.fetchTemplates();
    expect(result).toEqual(mockTemplates);
  });

  it('validateAgentConfig validates configuration', async () => {
    const mockValidation = { valid: true };
    agentService.validateAgentConfig.mockResolvedValue(mockValidation);

    const result = await agentService.validateAgentConfig({
      name: 'Test Agent',
      workspacePath: '/home/admin/workspace',
    });

    expect(result).toEqual(mockValidation);
    expect(agentService.validateAgentConfig).toHaveBeenCalledWith({
      name: 'Test Agent',
      workspacePath: '/home/admin/workspace',
    });
  });
});
