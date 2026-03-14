import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkillInstall from '../components/SkillInstall';
import * as skillService from '../services/skillService';

// Mock the skillService
jest.mock('../services/skillService', () => ({
  installSkill: jest.fn(),
}));

// Mock antd Modal
jest.mock('antd', () => {
  const actualAntd = jest.requireActual('antd');
  return {
    ...actualAntd,
    Modal: ({ children, visible, onCancel, footer, ...props }) => {
      if (!visible) return null;
      return (
        <div data-testid="modal" {...props}>
          <button onClick={onCancel} data-testid="modal-cancel">
            Cancel
          </button>
          {children}
          {footer && <div data-testid="modal-footer">{footer}</div>}
        </div>
      );
    },
  };
});

// Mock child components
jest.mock('../components/RiskWarning', () => ({ skill, visible }) => {
  if (!visible) return null;
  return <div data-testid="risk-warning">Risk Warning for {skill?.displayName}</div>;
});

jest.mock('../components/InstallProgress', () => ({
  skillName,
  skillDisplayName,
  progress,
  status,
}) => (
  <div data-testid="install-progress">
    <span data-testid="progress-skill">{skillDisplayName}</span>
    <span data-testid="progress-value">{progress}%</span>
    <span data-testid="progress-status">{status}</span>
  </div>
));

describe('SkillInstall Component', () => {
  const mockSkill = {
    id: 'test-skill-001',
    name: 'test-skill',
    displayName: 'Test Skill',
    description: 'A test skill for unit testing',
    version: '1.0.0',
    author: 'Test Author',
    source: 'skillhub',
    category: 'tool',
    categories: ['tool', 'official'],
    downloads: 1000,
    rating: 4.5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    tags: ['test', 'demo'],
  };

  const mockOnClose = jest.fn();
  const mockOnInstallComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when visible is false', () => {
    render(
      <SkillInstall
        skill={mockSkill}
        visible={false}
        onClose={mockOnClose}
        onInstallComplete={mockOnInstallComplete}
      />
    );

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should render when visible is true', () => {
    render(
      <SkillInstall
        skill={mockSkill}
        visible={true}
        onClose={mockOnClose}
        onInstallComplete={mockOnInstallComplete}
      />
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('技能安装')).toBeInTheDocument();
    expect(screen.getByText('安装 Test Skill')).toBeInTheDocument();
  });

  it('should display skill information', () => {
    render(
      <SkillInstall
        skill={mockSkill}
        visible={true}
        onClose={mockOnClose}
        onInstallComplete={mockOnInstallComplete}
      />
    );

    expect(screen.getByText('Test Skill')).toBeInTheDocument();
    expect(screen.getByText('版本 1.0.0')).toBeInTheDocument();
    expect(screen.getByText('A test skill for unit testing')).toBeInTheDocument();
  });

  it('should display risk warning', () => {
    render(
      <SkillInstall
        skill={mockSkill}
        visible={true}
        onClose={mockOnClose}
        onInstallComplete={mockOnInstallComplete}
      />
    );

    expect(screen.getByTestId('risk-warning')).toBeInTheDocument();
  });

  it('should disable install button when risk agreement is not checked', () => {
    render(
      <SkillInstall
        skill={mockSkill}
        visible={true}
        onClose={mockOnClose}
        onInstallComplete={mockOnInstallComplete}
      />
    );

    const installButton = screen.getByText('确认安装').closest('button');
    expect(installButton).toBeDisabled();
  });

  it('should enable install button when risk agreement is checked', () => {
    render(
      <SkillInstall
        skill={mockSkill}
        visible={true}
        onClose={mockOnClose}
        onInstallComplete={mockOnInstallComplete}
      />
    );

    const checkbox = screen.getByLabelText(/我已了解上述风险/i);
    fireEvent.click(checkbox);

    const installButton = screen.getByText('确认安装').closest('button');
    expect(installButton).not.toBeDisabled();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <SkillInstall
        skill={mockSkill}
        visible={true}
        onClose={mockOnClose}
        onInstallComplete={mockOnInstallComplete}
      />
    );

    const cancelButton = screen.getByText('取消').closest('button');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call installSkill and onInstallComplete when install is successful', async () => {
    skillService.installSkill.mockResolvedValue({ success: true });

    render(
      <SkillInstall
        skill={mockSkill}
        visible={true}
        onClose={mockOnClose}
        onInstallComplete={mockOnInstallComplete}
      />
    );

    // Check the risk agreement
    const checkbox = screen.getByLabelText(/我已了解上述风险/i);
    fireEvent.click(checkbox);

    // Click install button
    const installButton = screen.getByText('确认安装').closest('button');
    fireEvent.click(installButton);

    // Wait for installation to complete
    await waitFor(() => {
      expect(skillService.installSkill).toHaveBeenCalledWith(mockSkill.id, mockSkill.source);
    });

    await waitFor(() => {
      expect(mockOnInstallComplete).toHaveBeenCalledWith(mockSkill.id, true);
    });
  });

  it('should handle installation error', async () => {
    const errorMessage = 'Network error';
    skillService.installSkill.mockRejectedValue(new Error(errorMessage));

    render(
      <SkillInstall
        skill={mockSkill}
        visible={true}
        onClose={mockOnClose}
        onInstallComplete={mockOnInstallComplete}
      />
    );

    // Check the risk agreement
    const checkbox = screen.getByLabelText(/我已了解上述风险/i);
    fireEvent.click(checkbox);

    // Click install button
    const installButton = screen.getByText('确认安装').closest('button');
    fireEvent.click(installButton);

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('install-progress')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('progress-status').textContent).toBe('error');
    });
  });

  it('should show progress during installation', async () => {
    skillService.installSkill.mockImplementation(() => {
      return new Promise(resolve => setTimeout(() => resolve({ success: true }), 100));
    });

    render(
      <SkillInstall
        skill={mockSkill}
        visible={true}
        onClose={mockOnClose}
        onInstallComplete={mockOnInstallComplete}
      />
    );

    // Check the risk agreement
    const checkbox = screen.getByLabelText(/我已了解上述风险/i);
    fireEvent.click(checkbox);

    // Click install button
    const installButton = screen.getByText('确认安装').closest('button');
    fireEvent.click(installButton);

    // Wait for progress to appear
    await waitFor(() => {
      expect(screen.getByTestId('install-progress')).toBeInTheDocument();
    });

    expect(screen.getByTestId('progress-skill').textContent).toBe('Test Skill');
  });

  it('should call onClose after successful installation', async () => {
    skillService.installSkill.mockResolvedValue({ success: true });

    // Use fake timers
    jest.useFakeTimers();

    render(
      <SkillInstall
        skill={mockSkill}
        visible={true}
        onClose={mockOnClose}
        onInstallComplete={mockOnInstallComplete}
      />
    );

    // Check the risk agreement
    const checkbox = screen.getByLabelText(/我已了解上述风险/i);
    fireEvent.click(checkbox);

    // Click install button
    const installButton = screen.getByText('确认安装').closest('button');
    fireEvent.click(installButton);

    // Fast-forward time
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });

  it('should not render without skill', () => {
    const { container } = render(
      <SkillInstall
        skill={null}
        visible={true}
        onClose={mockOnClose}
        onInstallComplete={mockOnInstallComplete}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should reset state when skill changes', () => {
    const { rerender } = render(
      <SkillInstall
        skill={mockSkill}
        visible={true}
        onClose={mockOnClose}
        onInstallComplete={mockOnInstallComplete}
      />
    );

    // Check the risk agreement
    const checkbox = screen.getByLabelText(/我已了解上述风险/i);
    fireEvent.click(checkbox);

    const anotherSkill = {
      ...mockSkill,
      id: 'another-skill',
      displayName: 'Another Skill',
    };

    rerender(
      <SkillInstall
        skill={anotherSkill}
        visible={true}
        onClose={mockOnClose}
        onInstallComplete={mockOnInstallComplete}
      />
    );

    // State should be reset, checkbox should be unchecked
    const installButton = screen.getByText('确认安装').closest('button');
    expect(installButton).toBeDisabled();
  });
});

describe('SkillInstall Component - Risk Levels', () => {
  it('should handle high-risk skill from clawhub', () => {
    const highRiskSkill = {
      id: 'risky-skill',
      name: 'risky-skill',
      displayName: 'Risky Skill',
      description: 'A risky skill',
      version: '1.0.0',
      author: 'Unknown',
      source: 'clawhub',
      category: 'security',
      categories: ['security', 'community'],
      downloads: 50,
      rating: 3.5,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-03-01T00:00:00Z',
      tags: ['risky'],
    };

    render(
      <SkillInstall
        skill={highRiskSkill}
        visible={true}
        onClose={jest.fn()}
        onInstallComplete={jest.fn()}
      />
    );

    expect(screen.getByTestId('risk-warning')).toBeInTheDocument();
  });

  it('should handle low-risk official skill', () => {
    const lowRiskSkill = {
      id: 'safe-skill',
      name: 'safe-skill',
      displayName: 'Safe Skill',
      description: 'A safe official skill',
      version: '2.0.0',
      author: 'OpenClaw Team',
      source: 'skillhub',
      category: 'official',
      categories: ['official'],
      downloads: 5000,
      rating: 4.9,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-03-01T00:00:00Z',
      tags: ['safe'],
    };

    render(
      <SkillInstall
        skill={lowRiskSkill}
        visible={true}
        onClose={jest.fn()}
        onInstallComplete={jest.fn()}
      />
    );

    expect(screen.getByTestId('risk-warning')).toBeInTheDocument();
  });
});
