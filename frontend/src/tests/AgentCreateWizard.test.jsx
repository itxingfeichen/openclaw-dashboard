import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import AgentCreateWizard from '../../pages/AgentCreateWizard/AgentCreateWizard';
import WizardSteps from '../../components/WizardSteps';
import ToolPermissionConfig from '../../components/ToolPermissionConfig';
import WorkspaceConfig from '../../components/WorkspaceConfig';
import * as agentService from '../../services/agentService';

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
vi.mock('../../services/agentService', () => ({
  createAgent: vi.fn(),
  validateAgentConfig: vi.fn(),
  fetchTemplates: vi.fn(),
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

describe('AgentCreateWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agentService.validateAgentConfig.mockResolvedValue({ valid: true });
    agentService.createAgent.mockResolvedValue({ success: true, id: 'agent-001' });
  });

  describe('Wizard Navigation', () => {
    it('renders all wizard steps', () => {
      renderWithProviders(<AgentCreateWizard />);
      
      expect(screen.getByText('创建 Agent - 向导模式')).toBeInTheDocument();
      expect(screen.getByText('基本信息')).toBeInTheDocument();
      expect(screen.getByText('模型配置')).toBeInTheDocument();
      expect(screen.getByText('工具权限')).toBeInTheDocument();
      expect(screen.getByText('工作空间')).toBeInTheDocument();
      expect(screen.getByText('配置预览')).toBeInTheDocument();
    });

    it('starts at step 1 (Basic Info)', () => {
      renderWithProviders(<AgentCreateWizard />);
      
      expect(screen.getByText('基本信息')).toBeInTheDocument();
      expect(screen.getByText(/填写 Agent 名称和描述/i)).toBeInTheDocument();
    });

    it('navigates to next step', async () => {
      renderWithProviders(<AgentCreateWizard />);
      
      // Fill in basic info
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(agentService.validateAgentConfig).toHaveBeenCalled();
      });

      // Click next
      const nextButton = screen.getByText('下一步');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('模型配置')).toBeInTheDocument();
      });
    });

    it('navigates to previous step', async () => {
      renderWithProviders(<AgentCreateWizard />);
      
      // Go to step 2
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(agentService.validateAgentConfig).toHaveBeenCalled();
      });

      const nextButton = screen.getByText('下一步');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('模型配置')).toBeInTheDocument();
      });

      // Go back
      const prevButton = screen.getByText('上一步');
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('基本信息')).toBeInTheDocument();
      });
    });

    it('disables previous button on first step', () => {
      renderWithProviders(<AgentCreateWizard />);
      
      const prevButton = screen.getByText('上一步');
      expect(prevButton).toBeDisabled();
    });
  });

  describe('Step 1: Basic Info', () => {
    it('validates agent name format', async () => {
      renderWithProviders(<AgentCreateWizard />);
      
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'test@invalid' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(
          screen.getByText(/名称只能包含字母、数字、中文、下划线和连字符/i)
        ).toBeInTheDocument();
      });
    });

    it('validates name length', async () => {
      renderWithProviders(<AgentCreateWizard />);
      
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'T' } });
      fireEvent.blur(nameInput);

      // Name validation happens on blur
      await waitFor(() => {
        expect(screen.getByText(/名称至少 2 个字符/i)).toBeInTheDocument();
      });
    });

    it('shows validation status for valid name', async () => {
      agentService.validateAgentConfig.mockResolvedValue({ valid: true });
      
      renderWithProviders(<AgentCreateWizard />);
      
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Valid Agent Name' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText('名称可用')).toBeInTheDocument();
      });
    });

    it('allows description to be optional', () => {
      renderWithProviders(<AgentCreateWizard />);
      
      const descriptionInput = screen.getByPlaceholderText(/简要描述 Agent 的用途和功能/i);
      expect(descriptionInput).toBeInTheDocument();
      // No required validation for description
    });
  });

  describe('Step 2: Model Selection', () => {
    it('renders model selection dropdown', async () => {
      renderWithProviders(<AgentCreateWizard />);
      
      // Navigate to step 2
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(agentService.validateAgentConfig).toHaveBeenCalled();
      });

      const nextButton = screen.getByText('下一步');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('AI 模型')).toBeInTheDocument();
      });

      expect(screen.getByText('Qwen 3.5 Plus')).toBeInTheDocument();
      expect(screen.getByText('Claude 3.5 Sonnet')).toBeInTheDocument();
    });

    it('requires model selection', async () => {
      renderWithProviders(<AgentCreateWizard />);
      
      // Navigate to step 2
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        const nextButton = screen.getByText('下一步');
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(screen.getByText('模型配置')).toBeInTheDocument();
      });

      // Try to proceed without selection
      const nextButton = screen.getAllByText('下一步')[0];
      fireEvent.click(nextButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/请选择模型/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: Tool Permissions', () => {
    it('renders tool permission config', async () => {
      renderWithProviders(<AgentCreateWizard />);
      
      // Navigate to step 3
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        const nextButton = screen.getByText('下一步');
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const nextButton2 = screen.getAllByText('下一步')[0];
        fireEvent.click(nextButton2);
      });

      await waitFor(() => {
        expect(screen.getByText('工具权限配置')).toBeInTheDocument();
      });

      expect(screen.getByText('文件读取')).toBeInTheDocument();
      expect(screen.getByText('命令执行')).toBeInTheDocument();
    });

    it('requires at least one tool selection', async () => {
      renderWithProviders(<AgentCreateWizard />);
      
      // Navigate to step 3
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        const nextButton = screen.getByText('下一步');
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const nextButton2 = screen.getAllByText('下一步')[0];
        fireEvent.click(nextButton2);
      });

      await waitFor(() => {
        expect(screen.getByText('工具权限配置')).toBeInTheDocument();
      });

      // Try to proceed without selection (default has read/write selected)
      // Uncheck all
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(cb => {
        if (cb.checked) {
          fireEvent.click(cb);
        }
      });

      const nextButton3 = screen.getAllByText('下一步')[0];
      fireEvent.click(nextButton3);

      await waitFor(() => {
        expect(screen.getByText(/请至少选择一个工具/i)).toBeInTheDocument();
      });
    });

    it('shows risk warning for high-risk tools', async () => {
      renderWithProviders(<AgentCreateWizard />);
      
      // Navigate to step 3
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        const nextButton = screen.getByText('下一步');
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const nextButton2 = screen.getAllByText('下一步')[0];
        fireEvent.click(nextButton2);
      });

      await waitFor(() => {
        expect(screen.getByText('工具权限配置')).toBeInTheDocument();
      });

      // Select exec tool (high risk)
      const execTool = screen.getByText('命令执行').closest('.tool-item');
      fireEvent.click(execTool);

      await waitFor(() => {
        expect(screen.getByText('高风险工具提示')).toBeInTheDocument();
      });
    });
  });

  describe('Step 4: Workspace Config', () => {
    it('renders workspace presets', async () => {
      renderWithProviders(<AgentCreateWizard />);
      
      // Navigate to step 4
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        const nextButton = screen.getByText('下一步');
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const nextButton2 = screen.getAllByText('下一步')[0];
        fireEvent.click(nextButton2);
      });

      await waitFor(() => {
        const nextButton3 = screen.getAllByText('下一步')[0];
        fireEvent.click(nextButton3);
      });

      await waitFor(() => {
        expect(screen.getByText('选择预设工作空间')).toBeInTheDocument();
      });

      expect(screen.getByText('默认工作空间')).toBeInTheDocument();
      expect(screen.getByText('项目目录')).toBeInTheDocument();
    });

    it('validates workspace path format', async () => {
      renderWithProviders(<AgentCreateWizard />);
      
      // Navigate to step 4
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        const nextButton = screen.getByText('下一步');
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const nextButton2 = screen.getAllByText('下一步')[0];
        fireEvent.click(nextButton2);
      });

      await waitFor(() => {
        const nextButton3 = screen.getAllByText('下一步')[0];
        fireEvent.click(nextButton3);
      });

      await waitFor(() => {
        expect(screen.getByText('工作空间配置')).toBeInTheDocument();
      });

      // Enter invalid path
      const pathInput = screen.getByPlaceholderText(/\/home\/admin\/.openclaw\/workspace/i);
      fireEvent.change(pathInput, { target: { value: 'relative/path' } });

      await waitFor(() => {
        expect(screen.getByText(/必须是绝对路径/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 5: Preview', () => {
    it('shows configuration preview', async () => {
      renderWithProviders(<AgentCreateWizard />);
      
      // Fill all steps
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        const nextButton = screen.getByText('下一步');
        fireEvent.click(nextButton);
      });

      // Step 2: Select model
      await waitFor(() => {
        const modelSelect = screen.getByText('Qwen 3.5 Plus');
        fireEvent.click(modelSelect);
      });

      await waitFor(() => {
        const nextButton2 = screen.getAllByText('下一步')[0];
        fireEvent.click(nextButton2);
      });

      // Step 3: Tools (already has defaults)
      await waitFor(() => {
        const nextButton3 = screen.getAllByText('下一步')[0];
        fireEvent.click(nextButton3);
      });

      // Step 4: Workspace
      await waitFor(() => {
        const nextButton4 = screen.getAllByText('下一步')[0];
        fireEvent.click(nextButton4);
      });

      await waitFor(() => {
        expect(screen.getByText('配置预览')).toBeInTheDocument();
      });

      expect(screen.getByText('Agent 配置预览')).toBeInTheDocument();
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    });

    it('allows going back to edit configuration', async () => {
      renderWithProviders(<AgentCreateWizard />);
      
      // Navigate to preview step
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.blur(nameInput);

      for (let i = 0; i < 4; i++) {
        await waitFor(() => {
          const nextButton = screen.getAllByText('下一步')[i] || screen.getByText('下一步');
          fireEvent.click(nextButton);
        });
      }

      await waitFor(() => {
        expect(screen.getByText('配置预览')).toBeInTheDocument();
      });

      // Go back
      const prevButton = screen.getByText('上一步');
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('工作空间配置')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      agentService.createAgent.mockResolvedValue({ success: true, id: 'agent-001' });
      
      renderWithProviders(<AgentCreateWizard />);
      
      // Fill all steps
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        const nextButton = screen.getByText('下一步');
        fireEvent.click(nextButton);
      });

      // Navigate through remaining steps
      for (let i = 0; i < 3; i++) {
        await waitFor(() => {
          const nextButton = screen.getAllByText('下一步')[i];
          fireEvent.click(nextButton);
        });
      }

      // Submit
      await waitFor(() => {
        const submitButton = screen.getByText('创建 Agent');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(agentService.createAgent).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Agent',
          })
        );
      });
    });

    it('shows creation progress', async () => {
      agentService.createAgent.mockResolvedValue({ success: true, id: 'agent-001' });
      
      renderWithProviders(<AgentCreateWizard />);
      
      // Fill and submit
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        const nextButton = screen.getByText('下一步');
        fireEvent.click(nextButton);
      });

      for (let i = 0; i < 3; i++) {
        await waitFor(() => {
          const nextButton = screen.getAllByText('下一步')[i];
          fireEvent.click(nextButton);
        });
      }

      await waitFor(() => {
        const submitButton = screen.getByText('创建 Agent');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('正在创建 Agent...')).toBeInTheDocument();
      });

      expect(screen.getByText('验证配置')).toBeInTheDocument();
      expect(screen.getByText('创建 Agent')).toBeInTheDocument();
    });

    it('shows success state after creation', async () => {
      agentService.createAgent.mockResolvedValue({ success: true, id: 'agent-001' });
      
      renderWithProviders(<AgentCreateWizard />);
      
      // Fill and submit
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        const nextButton = screen.getByText('下一步');
        fireEvent.click(nextButton);
      });

      for (let i = 0; i < 3; i++) {
        await waitFor(() => {
          const nextButton = screen.getAllByText('下一步')[i];
          fireEvent.click(nextButton);
        });
      }

      await waitFor(() => {
        const submitButton = screen.getByText('创建 Agent');
        fireEvent.click(submitButton);
      });

      await waitFor(
        () => {
          expect(screen.getByText('创建成功！')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('handles creation error', async () => {
      agentService.createAgent.mockRejectedValue(new Error('Creation failed'));
      
      renderWithProviders(<AgentCreateWizard />);
      
      // Fill and submit
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        const nextButton = screen.getByText('下一步');
        fireEvent.click(nextButton);
      });

      for (let i = 0; i < 3; i++) {
        await waitFor(() => {
          const nextButton = screen.getAllByText('下一步')[i];
          fireEvent.click(nextButton);
        });
      }

      await waitFor(() => {
        const submitButton = screen.getByText('创建 Agent');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/创建失败/i)).toBeInTheDocument();
      });
    });
  });

  describe('Reset Functionality', () => {
    it('resets form when reset button is clicked', async () => {
      renderWithProviders(<AgentCreateWizard />);
      
      // Fill form
      const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
      fireEvent.change(nameInput, { target: { value: 'Test Agent' } });

      // Click reset
      const resetButton = screen.getByText('重置');
      fireEvent.click(resetButton);

      expect(nameInput).toHaveValue('');
    });
  });

  describe('WizardSteps Component', () => {
    it('renders step indicators', () => {
      renderWithProviders(
        <WizardSteps current={0} steps={[]} onStepChange={() => {}} />
      );

      expect(screen.getByText('创建进度')).toBeInTheDocument();
      expect(screen.getByText('步骤 1 / 5')).toBeInTheDocument();
    });

    it('allows clicking on completed steps', () => {
      const onStepChange = vi.fn();
      renderWithProviders(
        <WizardSteps current={2} steps={[]} onStepChange={onStepChange} />
      );

      const stepDots = screen.getAllByRole('button', { name: '' });
      fireEvent.click(stepDots[0]);

      expect(onStepChange).toHaveBeenCalledWith(0);
    });

    it('disables future steps', () => {
      renderWithProviders(
        <WizardSteps current={0} steps={[]} onStepChange={() => {}} />
      );

      const stepDots = screen.getAllByRole('button', { name: '' });
      expect(stepDots[1]).toBeDisabled();
    });
  });

  describe('ToolPermissionConfig Component', () => {
    it('renders tool categories', () => {
      renderWithProviders(
        <ToolPermissionConfig value={[]} onChange={() => {}} />
      );

      expect(screen.getByText('文件操作')).toBeInTheDocument();
      expect(screen.getByText('系统操作')).toBeInTheDocument();
      expect(screen.getByText('网络访问')).toBeInTheDocument();
    });

    it('handles tool selection', () => {
      const onChange = vi.fn();
      renderWithProviders(
        <ToolPermissionConfig value={[]} onChange={onChange} />
      );

      const toolItem = screen.getByText('文件读取').closest('.tool-item');
      fireEvent.click(toolItem);

      expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(['read']));
    });

    it('handles quick select buttons', () => {
      const onChange = vi.fn();
      renderWithProviders(
        <ToolPermissionConfig value={[]} onChange={onChange} />
      );

      const basicButton = screen.getByText('基础权限');
      fireEvent.click(basicButton);

      expect(onChange).toHaveBeenCalledWith(['read', 'write', 'web_search']);
    });
  });

  describe('WorkspaceConfig Component', () => {
    it('renders workspace presets', () => {
      renderWithProviders(
        <WorkspaceConfig value="" onChange={() => {}} />
      );

      expect(screen.getByText('默认工作空间')).toBeInTheDocument();
      expect(screen.getByText('项目目录')).toBeInTheDocument();
      expect(screen.getByText('产品目录')).toBeInTheDocument();
    });

    it('handles preset selection', () => {
      const onChange = vi.fn();
      renderWithProviders(
        <WorkspaceConfig value="" onChange={onChange} />
      );

      const presetCard = screen.getByText('默认工作空间').closest('.ant-card');
      fireEvent.click(presetCard);

      expect(onChange).toHaveBeenCalledWith('/home/admin/.openclaw/workspace');
    });

    it('validates custom path', () => {
      const onChange = vi.fn();
      renderWithProviders(
        <WorkspaceConfig value="" onChange={onChange} />
      );

      const pathInput = screen.getByPlaceholderText(/\/home\/admin\/.openclaw\/workspace/i);
      fireEvent.change(pathInput, { target: { value: '/custom/path' } });

      expect(onChange).toHaveBeenCalledWith('/custom/path');
    });
  });
});

describe('Integration Tests', () => {
  it('completes full wizard flow', async () => {
    agentService.createAgent.mockResolvedValue({ success: true, id: 'agent-001' });
    agentService.validateAgentConfig.mockResolvedValue({ valid: true });

    renderWithProviders(<AgentCreateWizard />);

    // Step 1: Basic Info
    const nameInput = screen.getByPlaceholderText(/请输入 Agent 名称/i);
    fireEvent.change(nameInput, { target: { value: 'Integration Test Agent' } });
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(agentService.validateAgentConfig).toHaveBeenCalled();
    });

    const nextButton = screen.getByText('下一步');
    fireEvent.click(nextButton);

    // Step 2: Model (keep default)
    await waitFor(() => {
      const nextButton2 = screen.getAllByText('下一步')[0];
      fireEvent.click(nextButton2);
    });

    // Step 3: Tools (keep defaults)
    await waitFor(() => {
      const nextButton3 = screen.getAllByText('下一步')[0];
      fireEvent.click(nextButton3);
    });

    // Step 4: Workspace (keep default)
    await waitFor(() => {
      const nextButton4 = screen.getAllByText('下一步')[0];
      fireEvent.click(nextButton4);
    });

    // Step 5: Preview & Submit
    await waitFor(() => {
      const submitButton = screen.getByText('创建 Agent');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(agentService.createAgent).toHaveBeenCalledWith({
        name: 'Integration Test Agent',
        description: '',
        model: 'qwen3.5-plus',
        tools: expect.arrayContaining(['read', 'write']),
        workspacePath: '/home/admin/.openclaw/workspace',
      });
    });

    await waitFor(
      () => {
        expect(screen.getByText('创建成功！')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});
