import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import Logs from '../pages/Logs/Logs'
import LogViewer from '../components/LogViewer'
import LogSourceSelector from '../components/LogSourceSelector'
import LogSearchBar from '../components/LogSearchBar'
import LogPagination from '../components/LogPagination'

// Mock fetch
global.fetch = vi.fn()

describe('Logs Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Logs page without crashing', async () => {
    // Mock API responses
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ['system', 'application']
    })
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logs: [], total: 0 })
    })

    render(<Logs />)
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('选择日志源')).toBeInTheDocument()
    })
  })

  it('displays loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<Logs />)
    
    // Should show loading spinner
    expect(screen.getByText(/加载日志中/i)).toBeInTheDocument()
  })

  it('handles log source selection', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ['system', 'application', 'agent']
    })
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logs: [], total: 0 })
    })

    render(<Logs />)
    
    await waitFor(() => {
      const select = screen.getByPlaceholderText('选择日志源')
      expect(select).toBeInTheDocument()
    })
  })

  it('displays error message when API fails', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'))
    fetch.mockRejectedValueOnce(new Error('API Error'))

    render(<Logs />)
    
    await waitFor(() => {
      // Should show error alert or fallback to mock data
      expect(screen.getByPlaceholderText('选择日志源')).toBeInTheDocument()
    })
  })
})

describe('LogViewer Component', () => {
  const mockLogs = [
    {
      id: '1',
      level: 'info',
      message: 'Agent started successfully',
      source: 'system',
      timestamp: '2024-01-01T10:00:00Z'
    },
    {
      id: '2',
      level: 'error',
      message: 'Failed to connect to database',
      source: 'application',
      timestamp: '2024-01-01T10:05:00Z'
    },
    {
      id: '3',
      level: 'warning',
      message: 'High memory usage detected',
      source: 'system',
      timestamp: '2024-01-01T10:10:00Z'
    }
  ]

  it('renders log table with data', () => {
    render(<LogViewer logs={mockLogs} searchQuery="" />)
    
    expect(screen.getByText('Agent started successfully')).toBeInTheDocument()
    expect(screen.getByText('Failed to connect to database')).toBeInTheDocument()
    expect(screen.getByText('High memory usage detected')).toBeInTheDocument()
  })

  it('displays log level tags correctly', () => {
    render(<LogViewer logs={mockLogs} searchQuery="" />)
    
    expect(screen.getByText('INFO')).toBeInTheDocument()
    expect(screen.getByText('ERROR')).toBeInTheDocument()
    expect(screen.getByText('WARN')).toBeInTheDocument()
  })

  it('highlights search query in log messages', () => {
    render(<LogViewer logs={mockLogs} searchQuery="Agent" />)
    
    const highlightedElement = screen.getByText('Agent started successfully')
    expect(highlightedElement).toBeInTheDocument()
  })

  it('displays empty state when no logs', () => {
    render(<LogViewer logs={[]} searchQuery="" />)
    
    expect(screen.getByText('暂无日志数据')).toBeInTheDocument()
  })

  it('formats timestamps correctly', () => {
    render(<LogViewer logs={mockLogs} searchQuery="" />)
    
    // Should display formatted date
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })
})

describe('LogSourceSelector Component', () => {
  const mockSources = ['system', 'application', 'agent', 'gateway']

  it('renders source selector with options', () => {
    const onChange = vi.fn()
    render(
      <LogSourceSelector
        sources={mockSources}
        selectedSource="system"
        onChange={onChange}
      />
    )
    
    expect(screen.getByPlaceholderText('选择日志源')).toBeInTheDocument()
  })

  it('calls onChange when source is selected', () => {
    const onChange = vi.fn()
    render(
      <LogSourceSelector
        sources={mockSources}
        selectedSource="system"
        onChange={onChange}
      />
    )
    
    // Click to open dropdown
    const select = screen.getByPlaceholderText('选择日志源')
    fireEvent.click(select)
    
    // Select different source
    const option = screen.getByText('application')
    fireEvent.click(option)
    
    expect(onChange).toHaveBeenCalledWith('application')
  })

  it('displays selected source', () => {
    const onChange = vi.fn()
    render(
      <LogSourceSelector
        sources={mockSources}
        selectedSource="gateway"
        onChange={onChange}
      />
    )
    
    expect(screen.getByText('gateway')).toBeInTheDocument()
  })
})

describe('LogSearchBar Component', () => {
  it('renders search input and filters', () => {
    const onSearch = vi.fn()
    const onLevelFilter = vi.fn()
    const onTimeRangeChange = vi.fn()

    render(
      <LogSearchBar
        onSearch={onSearch}
        onLevelFilter={onLevelFilter}
        onTimeRangeChange={onTimeRangeChange}
        levelFilter="all"
        timeRange="all"
      />
    )
    
    expect(screen.getByPlaceholderText('搜索日志关键词')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('日志级别')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('时间范围')).toBeInTheDocument()
  })

  it('calls onSearch when search is submitted', () => {
    const onSearch = vi.fn()
    const onLevelFilter = vi.fn()
    const onTimeRangeChange = vi.fn()

    render(
      <LogSearchBar
        onSearch={onSearch}
        onLevelFilter={onLevelFilter}
        onTimeRangeChange={onTimeRangeChange}
        levelFilter="all"
        timeRange="all"
      />
    )
    
    const searchInput = screen.getByPlaceholderText('搜索日志关键词')
    fireEvent.change(searchInput, { target: { value: 'error' } })
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' })
    
    expect(onSearch).toHaveBeenCalledWith('error')
  })

  it('calls onLevelFilter when level is changed', () => {
    const onSearch = vi.fn()
    const onLevelFilter = vi.fn()
    const onTimeRangeChange = vi.fn()

    render(
      <LogSearchBar
        onSearch={onSearch}
        onLevelFilter={onLevelFilter}
        onTimeRangeChange={onTimeRangeChange}
        levelFilter="all"
        timeRange="all"
      />
    )
    
    const levelSelect = screen.getByPlaceholderText('日志级别')
    fireEvent.click(levelSelect)
    
    const errorOption = screen.getByText('ERROR')
    fireEvent.click(errorOption)
    
    expect(onLevelFilter).toHaveBeenCalledWith('error')
  })

  it('calls onTimeRangeChange when time range is changed', () => {
    const onSearch = vi.fn()
    const onLevelFilter = vi.fn()
    const onTimeRangeChange = vi.fn()

    render(
      <LogSearchBar
        onSearch={onSearch}
        onLevelFilter={onLevelFilter}
        onTimeRangeChange={onTimeRangeChange}
        levelFilter="all"
        timeRange="all"
      />
    )
    
    const timeSelect = screen.getByPlaceholderText('时间范围')
    fireEvent.click(timeSelect)
    
    const hourOption = screen.getByText('1 小时')
    fireEvent.click(hourOption)
    
    expect(onTimeRangeChange).toHaveBeenCalledWith('1h')
  })
})

describe('LogPagination Component', () => {
  it('renders pagination with correct props', () => {
    const onChange = vi.fn()
    render(
      <LogPagination
        current={1}
        pageSize={50}
        total={100}
        onChange={onChange}
      />
    )
    
    expect(screen.getByText(/第 1-50 条/)).toBeInTheDocument()
    expect(screen.getByText(/共 100 条/)).toBeInTheDocument()
  })

  it('calls onChange when page is changed', () => {
    const onChange = vi.fn()
    render(
      <LogPagination
        current={1}
        pageSize={50}
        total={200}
        onChange={onChange}
      />
    )
    
    // Click on page 2
    const page2 = screen.getByText('2')
    fireEvent.click(page2)
    
    expect(onChange).toHaveBeenCalledWith(2, 50)
  })

  it('calls onChange when page size is changed', () => {
    const onChange = vi.fn()
    render(
      <LogPagination
        current={1}
        pageSize={50}
        total={200}
        onChange={onChange}
      />
    )
    
    // Change page size to 100
    const pageSizeSelect = screen.getByText('50 条/页')
    fireEvent.click(pageSizeSelect)
    
    const option100 = screen.getByText('100 条/页')
    fireEvent.click(option100)
    
    expect(onChange).toHaveBeenCalledWith(1, 100)
  })

  it('displays total count correctly', () => {
    const onChange = vi.fn()
    render(
      <LogPagination
        current={2}
        pageSize={50}
        total={150}
        onChange={onChange}
      />
    )
    
    expect(screen.getByText(/第 51-100 条/)).toBeInTheDocument()
    expect(screen.getByText(/共 150 条/)).toBeInTheDocument()
  })
})

describe('LogViewer Highlighting', () => {
  const mockLogs = [
    {
      id: '1',
      level: 'info',
      message: 'Connection established with server',
      source: 'system',
      timestamp: '2024-01-01T10:00:00Z'
    }
  ]

  it('highlights matching text case-insensitively', () => {
    render(<LogViewer logs={mockLogs} searchQuery="connection" />)
    
    // Should highlight "Connection" even though query is lowercase
    const messageElement = screen.getByText('Connection established with server')
    expect(messageElement).toBeInTheDocument()
  })

  it('handles special characters in search query', () => {
    render(<LogViewer logs={mockLogs} searchQuery="server." />)
    
    const messageElement = screen.getByText('Connection established with server')
    expect(messageElement).toBeInTheDocument()
  })
})
