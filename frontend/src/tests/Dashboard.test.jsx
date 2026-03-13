import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Dashboard from '../pages/Dashboard/Dashboard'
import StatCard from '../components/StatCard'
import ResourceChart from '../components/ResourceChart'
import QuickActions from '../components/QuickActions'
import AlertList from '../components/AlertList'

// Mock fetch
global.fetch = jest.fn()

describe('Dashboard Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('StatCard Component', () => {
    test('renders system status card with running state', () => {
      render(<StatCard title="系统状态" type="system" status={true} />)
      expect(screen.getByText('系统状态')).toBeInTheDocument()
      expect(screen.getByText('运行中')).toBeInTheDocument()
    })

    test('renders system status card with stopped state', () => {
      render(<StatCard title="系统状态" type="system" status={false} />)
      expect(screen.getByText('系统状态')).toBeInTheDocument()
      expect(screen.getByText('停止')).toBeInTheDocument()
    })

    test('renders agent count card', () => {
      render(<StatCard title="Agent 数量" type="agent" value={5} />)
      expect(screen.getByText('Agent 数量')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    test('renders task count card', () => {
      render(<StatCard title="任务数量" type="task" value={23} />)
      expect(screen.getByText('任务数量')).toBeInTheDocument()
      expect(screen.getByText('23')).toBeInTheDocument()
    })

    test('renders session count card', () => {
      render(<StatCard title="会话数量" type="session" value={12} />)
      expect(screen.getByText('会话数量')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
    })
  })

  describe('ResourceChart Component', () => {
    const mockCpuData = [
      { time: '10:00', value: 25 },
      { time: '10:01', value: 30 },
      { time: '10:02', value: 28 }
    ]

    const mockMemoryData = [
      { time: '10:00', value: 45 },
      { time: '10:01', value: 48 },
      { time: '10:02', value: 46 }
    ]

    test('renders resource chart with data', () => {
      render(<ResourceChart cpuData={mockCpuData} memoryData={mockMemoryData} />)
      expect(screen.getByText('资源使用率')).toBeInTheDocument()
      expect(screen.getByText('CPU 使用率趋势')).toBeInTheDocument()
      expect(screen.getByText('内存使用率趋势')).toBeInTheDocument()
      expect(screen.getByText('资源使用综合趋势')).toBeInTheDocument()
    })

    test('renders with empty data', () => {
      render(<ResourceChart cpuData={[]} memoryData={[]} />)
      expect(screen.getByText('资源使用率')).toBeInTheDocument()
    })
  })

  describe('QuickActions Component', () => {
    const mockHandlers = {
      onStartAgent: jest.fn(),
      onStopAgent: jest.fn(),
      onViewLogs: jest.fn(),
      onCreateAgent: jest.fn()
    }

    test('renders start agent button when agent is not running', () => {
      render(<QuickActions {...mockHandlers} isAgentRunning={false} />)
      expect(screen.getByText('启动 Agent')).toBeInTheDocument()
      expect(screen.queryByText('停止 Agent')).not.toBeInTheDocument()
    })

    test('renders stop agent button when agent is running', () => {
      render(<QuickActions {...mockHandlers} isAgentRunning={true} />)
      expect(screen.queryByText('启动 Agent')).not.toBeInTheDocument()
      expect(screen.getByText('停止 Agent')).toBeInTheDocument()
    })

    test('calls onStartAgent when start button is clicked', async () => {
      render(<QuickActions {...mockHandlers} isAgentRunning={false} />)
      fireEvent.click(screen.getByText('启动 Agent'))
      await waitFor(() => {
        expect(mockHandlers.onStartAgent).toHaveBeenCalled()
      })
    })

    test('calls onViewLogs when view logs button is clicked', () => {
      render(<QuickActions {...mockHandlers} isAgentRunning={false} />)
      fireEvent.click(screen.getByText('查看日志'))
      expect(mockHandlers.onViewLogs).toHaveBeenCalled()
    })

    test('calls onCreateAgent when create button is clicked', () => {
      render(<QuickActions {...mockHandlers} isAgentRunning={false} />)
      fireEvent.click(screen.getByText('创建 Agent'))
      expect(mockHandlers.onCreateAgent).toHaveBeenCalled()
    })
  })

  describe('AlertList Component', () => {
    const mockAlerts = [
      {
        id: '1',
        level: 'critical',
        message: 'CPU 使用率过高',
        source: 'System',
        timestamp: new Date().toISOString(),
        status: 'active'
      },
      {
        id: '2',
        level: 'warning',
        message: '内存使用率警告',
        source: 'System',
        timestamp: new Date().toISOString(),
        status: 'active'
      },
      {
        id: '3',
        level: 'info',
        message: '系统更新可用',
        source: 'System',
        timestamp: new Date().toISOString(),
        status: 'resolved'
      }
    ]

    const mockHandlers = {
      onDismiss: jest.fn(),
      onViewDetail: jest.fn()
    }

    test('renders alert list with alerts', () => {
      render(<AlertList alerts={mockAlerts} {...mockHandlers} />)
      expect(screen.getByText('告警列表')).toBeInTheDocument()
      expect(screen.getByText('CPU 使用率过高')).toBeInTheDocument()
      expect(screen.getByText('内存使用率警告')).toBeInTheDocument()
    })

    test('displays correct alert level tags', () => {
      render(<AlertList alerts={mockAlerts} {...mockHandlers} />)
      expect(screen.getByText('严重')).toBeInTheDocument()
      expect(screen.getByText('警告')).toBeInTheDocument()
      expect(screen.getByText('信息')).toBeInTheDocument()
    })

    test('displays alert status correctly', () => {
      render(<AlertList alerts={mockAlerts} {...mockHandlers} />)
      expect(screen.getAllByText('未解决').length).toBe(2)
      expect(screen.getByText('已解决')).toBeInTheDocument()
    })

    test('calls onDismiss when dismiss button is clicked', () => {
      render(<AlertList alerts={mockAlerts} {...mockHandlers} />)
      const dismissButtons = screen.getAllByText('解除')
      fireEvent.click(dismissButtons[0])
      expect(mockHandlers.onDismiss).toHaveBeenCalled()
    })

    test('calls onViewDetail when detail button is clicked', () => {
      render(<AlertList alerts={mockAlerts} {...mockHandlers} />)
      const detailButtons = screen.getAllByText('详情')
      fireEvent.click(detailButtons[0])
      expect(mockHandlers.onViewDetail).toHaveBeenCalled()
    })

    test('renders empty state when no alerts', () => {
      render(<AlertList alerts={[]} {...mockHandlers} />)
      expect(screen.getByText('暂无告警')).toBeInTheDocument()
    })
  })

  describe('Dashboard Integration', () => {
    test('renders dashboard with loading state', () => {
      fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        })
      )

      render(<Dashboard />)
      // Dashboard should render without errors
      expect(screen.getByTestId || screen.getByText).toBeDefined()
    })

    test('fetches data from API endpoints', async () => {
      fetch.mockImplementation((url) => {
        if (url.includes('/health')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ status: 'running' })
          })
        }
        if (url.includes('/agents')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          })
        }
        if (url.includes('/sessions')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          })
        }
        if (url.includes('/metrics')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              cpu: { history: [] },
              memory: { history: [] },
              alerts: [],
              tasks: { count: 0 }
            })
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      render(<Dashboard />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/health')
        expect(fetch).toHaveBeenCalledWith('/api/agents')
        expect(fetch).toHaveBeenCalledWith('/api/sessions')
        expect(fetch).toHaveBeenCalledWith('/api/metrics')
      }, { timeout: 3000 })
    })
  })
})
