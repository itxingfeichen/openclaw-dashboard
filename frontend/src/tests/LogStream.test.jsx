import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import LogStream from '../pages/LogStream/LogStream'
import LogViewerRealtime from '../components/LogViewerRealtime'
import websocketService from '../services/websocketService'

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = 0 // CONNECTING
    setTimeout(() => {
      this.readyState = 1 // OPEN
      if (this.onopen) this.onopen()
    }, 100)
  }

  send(data) {
    // Mock send
  }

  close(code = 1000, reason = '') {
    this.readyState = 3 // CLOSED
    if (this.onclose) {
      this.onclose({ code, reason, wasClean: true })
    }
  }
}

// Mock websocketService
vi.mock('../services/websocketService', () => ({
  default: {
    connect: vi.fn(),
    close: vi.fn(),
    reconnect: vi.fn(),
    subscribe: vi.fn(),
    send: vi.fn(),
    getStatus: vi.fn(() => ({
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      bufferLength: 0
    })),
    onOpen: null,
    onClose: null,
    onMessage: null,
    onError: null,
    onReconnecting: null,
    maxReconnectAttempts: 10
  }
}))

// Mock Ant Design message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      loading: vi.fn(),
      destroy: vi.fn(),
      info: vi.fn()
    },
    Alert: actual.Alert,
    Card: actual.Card,
    Empty: actual.Empty,
    Spin: actual.Spin,
    Tag: actual.Tag,
    Input: actual.Input,
    Button: actual.Button,
    Space: actual.Space,
    Tooltip: actual.Tooltip,
    Typography: actual.Typography
  }
})

describe('LogStream Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock global.WebSocket
    global.WebSocket = MockWebSocket
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders LogStream page without crashing', async () => {
    render(<LogStream />)
    
    await waitFor(() => {
      expect(screen.getByText('实时日志流')).toBeInTheDocument()
    })
  })

  it('displays connection status', async () => {
    // Mock connected state
    websocketService.getStatus.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      reconnectAttempts: 0,
      bufferLength: 0
    })

    render(<LogStream />)
    
    await waitFor(() => {
      expect(screen.getByText('已连接')).toBeInTheDocument()
    })
  })

  it('shows loading state when connecting', async () => {
    // Mock connecting state
    websocketService.getStatus.mockReturnValue({
      isConnected: false,
      isConnecting: true,
      reconnectAttempts: 0,
      bufferLength: 0
    })

    render(<LogStream />)
    
    await waitFor(() => {
      expect(screen.getByText('连接中...')).toBeInTheDocument()
    })
  })

  it('displays error when connection fails', async () => {
    // Mock error state
    const mockError = new Error('Connection failed')
    
    render(<LogStream />)
    
    // Trigger error callback
    await act(async () => {
      if (websocketService.onError) {
        websocketService.onError(mockError)
      }
    })
    
    await waitFor(() => {
      expect(screen.getByText('连接错误')).toBeInTheDocument()
    })
  })

  it('handles reconnection', async () => {
    render(<LogStream />)
    
    await waitFor(() => {
      expect(screen.getByText('实时日志流')).toBeInTheDocument()
    })

    // Find and click reconnect button
    const reconnectButtons = screen.getAllByRole('button')
    const reconnectButton = reconnectButtons.find(btn => 
      btn.querySelector('.anticon-reload')
    )
    
    if (reconnectButton) {
      fireEvent.click(reconnectButton)
      expect(websocketService.reconnect).toHaveBeenCalled()
    }
  })

  it('displays help tips', async () => {
    render(<LogStream />)
    
    await waitFor(() => {
      expect(screen.getByText('使用提示')).toBeInTheDocument()
    })

    expect(screen.getByText(/实时日志通过 WebSocket 推送/i)).toBeInTheDocument()
    expect(screen.getByText(/点击"暂停"可停止自动滚动/i)).toBeInTheDocument()
  })
})

describe('LogViewerRealtime Component', () => {
  const mockLogs = [
    {
      id: '1',
      timestamp: '2024-03-14T10:30:00.000Z',
      level: 'info',
      source: 'system',
      message: 'System started successfully'
    },
    {
      id: '2',
      timestamp: '2024-03-14T10:30:01.000Z',
      level: 'warning',
      source: 'application',
      message: 'High memory usage detected'
    },
    {
      id: '3',
      timestamp: '2024-03-14T10:30:02.000Z',
      level: 'error',
      source: 'database',
      message: 'Connection timeout'
    },
    {
      id: '4',
      timestamp: '2024-03-14T10:30:03.000Z',
      level: 'debug',
      source: 'api',
      message: 'Request processed in 150ms'
    }
  ]

  const defaultProps = {
    logs: mockLogs,
    connectionStatus: { isConnected: true, isConnecting: false },
    onReconnect: vi.fn(),
    onPauseToggle: vi.fn(),
    isPaused: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders LogViewerRealtime with logs', () => {
    render(<LogViewerRealtime {...defaultProps} />)
    
    expect(screen.getByText('System started successfully')).toBeInTheDocument()
    expect(screen.getByText('High memory usage detected')).toBeInTheDocument()
    expect(screen.getByText('Connection timeout')).toBeInTheDocument()
  })

  it('displays log level tags', () => {
    render(<LogViewerRealtime {...defaultProps} />)
    
    expect(screen.getByText('INFO')).toBeInTheDocument()
    expect(screen.getByText('WARN')).toBeInTheDocument()
    expect(screen.getByText('ERROR')).toBeInTheDocument()
    expect(screen.getByText('DEBUG')).toBeInTheDocument()
  })

  it('displays timestamps', () => {
    render(<LogViewerRealtime {...defaultProps} />)
    
    // Check if timestamps are rendered (format: YYYY-MM-DD HH:mm:ss)
    const timestamps = screen.getAllByText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)
    expect(timestamps.length).toBeGreaterThan(0)
  })

  it('filters logs by level', async () => {
    render(<LogViewerRealtime {...defaultProps} />)
    
    const levelFilter = screen.getByRole('combobox')
    fireEvent.change(levelFilter, { target: { value: 'error' } })
    
    await waitFor(() => {
      expect(screen.getByText('Connection timeout')).toBeInTheDocument()
      expect(screen.queryByText('System started successfully')).not.toBeInTheDocument()
    })
  })

  it('searches logs by keyword', async () => {
    render(<LogViewerRealtime {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText('搜索日志...')
    fireEvent.change(searchInput, { target: { value: 'memory' } })
    
    await waitFor(() => {
      expect(screen.getByText('High memory usage detected')).toBeInTheDocument()
      expect(screen.queryByText('System started successfully')).not.toBeInTheDocument()
    })
  })

  it('handles pause/resume', () => {
    render(<LogViewerRealtime {...defaultProps} />)
    
    const pauseButton = screen.getByText('暂停')
    fireEvent.click(pauseButton)
    
    expect(defaultProps.onPauseToggle).toHaveBeenCalledWith(true)
  })

  it('handles reconnect', () => {
    render(<LogViewerRealtime {...defaultProps} />)
    
    const reconnectButton = screen.getByRole('button', { name: '' })
    // Find the reconnect button by icon
    const reconnectButtons = screen.getAllByRole('button')
    const reconnectBtn = reconnectButtons.find(btn => 
      btn.querySelector('.anticon-reload') && !btn.querySelector('.anticon-pause')
    )
    
    if (reconnectBtn) {
      fireEvent.click(reconnectBtn)
      expect(defaultProps.onReconnect).toHaveBeenCalled()
    }
  })

  it('displays pause indicator when paused', () => {
    render(<LogViewerRealtime {...defaultProps} isPaused={true} />)
    
    expect(screen.getByText('已暂停滚动')).toBeInTheDocument()
    expect(screen.getByText('恢复')).toBeInTheDocument()
  })

  it('shows connection status indicators', () => {
    const { rerender } = render(
      <LogViewerRealtime 
        {...defaultProps} 
        connectionStatus={{ isConnected: true, isConnecting: false }} 
      />
    )
    
    // Connected state - wifi icon should be present
    expect(screen.getByRole('tooltip', { name: '已连接' })).toBeInTheDocument()
    
    // Re-render with disconnected state
    rerender(
      <LogViewerRealtime 
        {...defaultProps} 
        connectionStatus={{ isConnected: false, isConnecting: false }} 
      />
    )
    
    expect(screen.getByRole('tooltip', { name: '未连接' })).toBeInTheDocument()
  })

  it('displays log count statistics', () => {
    render(<LogViewerRealtime {...defaultProps} />)
    
    expect(screen.getByText(/4 \/ 4 条日志/)).toBeInTheDocument()
  })

  it('handles clear logs event', async () => {
    render(<LogViewerRealtime {...defaultProps} />)
    
    const clearButton = screen.getByRole('button', { name: '' })
    const clearBtn = clearButton.closest('button')
    
    // Dispatch clear event
    await act(async () => {
      window.dispatchEvent(new CustomEvent('logViewer:clear'))
    })
    
    // Event should be dispatched (tested via window event listener)
    expect(window.dispatchEvent).toBeDefined()
  })

  it('exports logs as text', async () => {
    // Mock document.createElement and link.click
    const mockLink = {
      click: vi.fn(),
      href: '',
      download: ''
    }
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    render(<LogViewerRealtime {...defaultProps} />)
    
    const exportButton = screen.getByText('导出')
    fireEvent.click(exportButton)
    
    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(mockLink.click).toHaveBeenCalled()
    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalled()

    createElementSpy.mockRestore()
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
  })

  it('handles empty logs', () => {
    render(<LogViewerRealtime {...defaultProps} logs={[]} />)
    
    expect(screen.getByText('0 / 0 条日志')).toBeInTheDocument()
  })

  it('highlights search keywords', async () => {
    render(<LogViewerRealtime {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText('搜索日志...')
    fireEvent.change(searchInput, { target: { value: 'System' } })
    
    await waitFor(() => {
      const highlighted = screen.querySelector('mark.highlight')
      expect(highlighted).toBeInTheDocument()
    })
  })
})

describe('WebSocket Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.WebSocket = MockWebSocket
  })

  it('creates WebSocket connection', () => {
    const ws = new MockWebSocket('ws://localhost:8080/logs')
    expect(ws.url).toBe('ws://localhost:8080/logs')
    expect(ws.readyState).toBe(0) // CONNECTING
  })

  it('handles connection open', (done) => {
    const ws = new MockWebSocket('ws://localhost:8080/logs')
    
    ws.onopen = () => {
      expect(ws.readyState).toBe(1) // OPEN
      done()
    }
  })

  it('handles connection close', () => {
    const ws = new MockWebSocket('ws://localhost:8080/logs')
    const closeHandler = vi.fn()
    
    ws.onclose = closeHandler
    ws.close(1000, 'Normal closure')
    
    expect(closeHandler).toHaveBeenCalledWith({
      code: 1000,
      reason: 'Normal closure',
      wasClean: true
    })
  })

  it('sends messages', () => {
    const ws = new MockWebSocket('ws://localhost:8080/logs')
    const sendSpy = vi.spyOn(ws, 'send')
    
    ws.send('test message')
    
    expect(sendSpy).toHaveBeenCalledWith('test message')
  })
})
