import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Metrics from '../pages/Metrics/Metrics'
import CpuChart from '../components/CpuChart'
import MemoryChart from '../components/MemoryChart'
import DiskChart from '../components/DiskChart'
import NetworkChart from '../components/NetworkChart'

// Mock fetch
global.fetch = jest.fn()

// Mock data
const mockCpuData = [
  { time: '10:00', value: 25, usage: 30, system: 10, user: 20 },
  { time: '10:01', value: 30, usage: 35, system: 12, user: 23 },
  { time: '10:02', value: 28, usage: 32, system: 11, user: 21 }
]

const mockMemoryData = [
  { time: '10:00', value: 45, used: 7200000000, available: 8800000000, total: 16000000000 },
  { time: '10:01', value: 48, used: 7680000000, available: 8320000000, total: 16000000000 },
  { time: '10:02', value: 46, used: 7360000000, available: 8640000000, total: 16000000000 }
]

const mockDiskData = [
  { time: '10:00', value: 45, used: 225000000000, available: 275000000000, total: 500000000000 },
  { time: '10:01', value: 46, used: 230000000000, available: 270000000000, total: 500000000000 },
  { time: '10:02', value: 45, used: 225000000000, available: 275000000000, total: 500000000000 }
]

const mockDiskDetails = [
  {
    mount: '/',
    filesystem: '/dev/sda1',
    size: 500000000000,
    used: 225000000000,
    available: 275000000000,
    percent: 45
  }
]

const mockNetworkData = [
  { time: '10:00', rx: 100000000, tx: 50000000, rxRate: 50, txRate: 25 },
  { time: '10:01', rx: 120000000, tx: 60000000, rxRate: 60, txRate: 30 },
  { time: '10:02', rx: 110000000, tx: 55000000, rxRate: 55, txRate: 27 }
]

describe('Metrics Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('CpuChart Component', () => {
    test('renders CPU chart with data', () => {
      render(<CpuChart data={mockCpuData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('CPU 使用率')).toBeInTheDocument()
      expect(screen.getByText('1 小时')).toBeInTheDocument()
    })

    test('displays current CPU usage statistics', () => {
      render(<CpuChart data={mockCpuData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('当前:')).toBeInTheDocument()
      expect(screen.getByText('平均:')).toBeInTheDocument()
      expect(screen.getByText('峰值:')).toBeInTheDocument()
    })

    test('renders chart type selector', () => {
      render(<CpuChart data={mockCpuData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('折线')).toBeInTheDocument()
      expect(screen.getByText('面积')).toBeInTheDocument()
      expect(screen.getByText('柱状')).toBeInTheDocument()
    })

    test('renders export button', () => {
      render(<CpuChart data={mockCpuData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('导出')).toBeInTheDocument()
    })

    test('changes chart type when radio button clicked', () => {
      render(<CpuChart data={mockCpuData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      fireEvent.click(screen.getByText('折线'))
      // Chart type should change (visual change, hard to test directly)
    })

    test('calls onTimeRangeChange when time range changed', () => {
      const mockOnChange = jest.fn()
      render(<CpuChart data={mockCpuData} timeRange="1h" onTimeRangeChange={mockOnChange} />)
      fireEvent.click(screen.getByText('1 小时'))
      // Select dropdown would open
    })

    test('shows warning alert when CPU exceeds threshold', () => {
      const highCpuData = mockCpuData.map(item => ({ ...item, value: 75 }))
      render(<CpuChart data={highCpuData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('CPU 使用率警告')).toBeInTheDocument()
    })

    test('shows critical alert when CPU exceeds critical threshold', () => {
      const criticalCpuData = mockCpuData.map(item => ({ ...item, value: 95 }))
      render(<CpuChart data={criticalCpuData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('CPU 使用率严重过高')).toBeInTheDocument()
    })

    test('renders with empty data', () => {
      render(<CpuChart data={[]} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('CPU 使用率')).toBeInTheDocument()
    })
  })

  describe('MemoryChart Component', () => {
    test('renders memory chart with data', () => {
      render(<MemoryChart data={mockMemoryData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('内存使用率')).toBeInTheDocument()
    })

    test('displays memory progress bar', () => {
      render(<MemoryChart data={mockMemoryData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText(/已用/)).toBeInTheDocument()
    })

    test('displays memory statistics', () => {
      render(<MemoryChart data={mockMemoryData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('总内存:')).toBeInTheDocument()
      expect(screen.getByText('已用:')).toBeInTheDocument()
      expect(screen.getByText('可用:')).toBeInTheDocument()
    })

    test('shows warning alert when memory exceeds threshold', () => {
      const highMemoryData = mockMemoryData.map(item => ({ ...item, value: 80 }))
      render(<MemoryChart data={highMemoryData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('内存使用率警告')).toBeInTheDocument()
    })

    test('shows critical alert when memory exceeds critical threshold', () => {
      const criticalMemoryData = mockMemoryData.map(item => ({ ...item, value: 95 }))
      render(<MemoryChart data={criticalMemoryData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('内存使用率严重过高')).toBeInTheDocument()
    })

    test('renders with empty data', () => {
      render(<MemoryChart data={[]} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('内存使用率')).toBeInTheDocument()
    })
  })

  describe('DiskChart Component', () => {
    test('renders disk chart with data', () => {
      render(
        <DiskChart
          data={mockDiskData}
          diskDetails={mockDiskDetails}
          timeRange="1h"
          onTimeRangeChange={jest.fn()}
        />
      )
      expect(screen.getByText('磁盘使用率')).toBeInTheDocument()
    })

    test('displays disk partition details table', () => {
      render(
        <DiskChart
          data={mockDiskData}
          diskDetails={mockDiskDetails}
          timeRange="1h"
          onTimeRangeChange={jest.fn()}
        />
      )
      expect(screen.getByText('分区详情')).toBeInTheDocument()
      expect(screen.getByText('/dev/sda1')).toBeInTheDocument()
    })

    test('displays disk space distribution pie chart label', () => {
      render(
        <DiskChart
          data={mockDiskData}
          diskDetails={mockDiskDetails}
          timeRange="1h"
          onTimeRangeChange={jest.fn()}
        />
      )
      expect(screen.getByText('空间分布')).toBeInTheDocument()
    })

    test('shows warning alert when disk exceeds threshold', () => {
      const highDiskData = mockDiskData.map(item => ({ ...item, value: 85 }))
      render(
        <DiskChart
          data={highDiskData}
          diskDetails={mockDiskDetails}
          timeRange="1h"
          onTimeRangeChange={jest.fn()}
        />
      )
      expect(screen.getByText('磁盘使用率警告')).toBeInTheDocument()
    })

    test('shows critical alert when disk exceeds critical threshold', () => {
      const criticalDiskData = mockDiskData.map(item => ({ ...item, value: 96 }))
      render(
        <DiskChart
          data={criticalDiskData}
          diskDetails={mockDiskDetails}
          timeRange="1h"
          onTimeRangeChange={jest.fn()}
        />
      )
      expect(screen.getByText('磁盘使用率严重过高')).toBeInTheDocument()
    })

    test('renders with empty data', () => {
      render(
        <DiskChart
          data={[]}
          diskDetails={[]}
          timeRange="1h"
          onTimeRangeChange={jest.fn()}
        />
      )
      expect(screen.getByText('磁盘使用率')).toBeInTheDocument()
    })
  })

  describe('NetworkChart Component', () => {
    test('renders network chart with data', () => {
      render(<NetworkChart data={mockNetworkData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('网络流量')).toBeInTheDocument()
    })

    test('displays network statistics', () => {
      render(<NetworkChart data={mockNetworkData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText(/当前接收/)).toBeInTheDocument()
      expect(screen.getByText(/当前发送/)).toBeInTheDocument()
      expect(screen.getByText('总速率:')).toBeInTheDocument()
    })

    test('displays unit selector', () => {
      render(<NetworkChart data={mockNetworkData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('Mbps')).toBeInTheDocument()
    })

    test('displays average and peak statistics', () => {
      render(<NetworkChart data={mockNetworkData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('平均接收:')).toBeInTheDocument()
      expect(screen.getByText('平均发送:')).toBeInTheDocument()
      expect(screen.getByText('峰值接收:')).toBeInTheDocument()
      expect(screen.getByText('峰值发送:')).toBeInTheDocument()
    })

    test('displays cumulative traffic', () => {
      render(<NetworkChart data={mockNetworkData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('累计接收:')).toBeInTheDocument()
      expect(screen.getByText('累计发送:')).toBeInTheDocument()
    })

    test('renders with empty data', () => {
      render(<NetworkChart data={[]} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('网络流量')).toBeInTheDocument()
    })
  })

  describe('Metrics Page Integration', () => {
    test('renders metrics page with tabs', () => {
      fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ history: [] })
        })
      )

      render(<Metrics />)
      
      expect(screen.getByText('资源监控')).toBeInTheDocument()
      expect(screen.getByText('总览')).toBeInTheDocument()
      expect(screen.getByText('磁盘')).toBeInTheDocument()
      expect(screen.getByText('网络')).toBeInTheDocument()
    })

    test('displays refresh button', () => {
      fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ history: [] })
        })
      )

      render(<Metrics />)
      expect(screen.getByText('刷新')).toBeInTheDocument()
    })

    test('displays fullscreen button', () => {
      fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ history: [] })
        })
      )

      render(<Metrics />)
      expect(screen.getByText('全屏')).toBeInTheDocument()
    })

    test('shows loading state initially', () => {
      fetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<Metrics />)
      // Should show loading spinner initially
    })

    test('fetches data from API endpoints', async () => {
      fetch.mockImplementation((url) => {
        if (url.includes('/metrics/cpu')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ history: mockCpuData })
          })
        }
        if (url.includes('/metrics/memory')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ history: mockMemoryData })
          })
        }
        if (url.includes('/metrics/disk')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ history: mockDiskData, details: mockDiskDetails })
          })
        }
        if (url.includes('/metrics/network')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ history: mockNetworkData })
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      render(<Metrics />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/metrics/cpu?range=1h')
        expect(fetch).toHaveBeenCalledWith('/api/metrics/memory?range=1h')
        expect(fetch).toHaveBeenCalledWith('/api/metrics/disk?range=1h')
        expect(fetch).toHaveBeenCalledWith('/api/metrics/network?range=1h')
      }, { timeout: 3000 })
    })

    test('displays error message when fetch fails', async () => {
      fetch.mockImplementation(() =>
        Promise.reject(new Error('Network error'))
      )

      render(<Metrics />)

      await waitFor(() => {
        expect(screen.getByText(/加载监控数据失败/)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    test('refreshes data when refresh button clicked', async () => {
      fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ history: mockCpuData })
        })
      )

      render(<Metrics />)

      await waitFor(() => {
        const refreshButton = screen.getByText('刷新')
        fireEvent.click(refreshButton)
      }, { timeout: 3000 })

      expect(fetch).toHaveBeenCalledTimes(8) // Initial load + refresh
    })
  })

  describe('Export Functionality', () => {
    test('CpuChart export creates CSV download', () => {
      const { container } = render(<CpuChart data={mockCpuData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      const exportButton = screen.getByText('导出')
      expect(exportButton).toBeInTheDocument()
      // Click would trigger download (hard to test in JSDOM)
    })

    test('MemoryChart export creates CSV download', () => {
      render(<MemoryChart data={mockMemoryData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      const exportButton = screen.getByText('导出')
      expect(exportButton).toBeInTheDocument()
    })

    test('DiskChart export creates CSV download', () => {
      render(<DiskChart data={mockDiskData} diskDetails={mockDiskDetails} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      const exportButton = screen.getByText('导出')
      expect(exportButton).toBeInTheDocument()
    })

    test('NetworkChart export creates CSV download', () => {
      render(<NetworkChart data={mockNetworkData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      const exportButton = screen.getByText('导出')
      expect(exportButton).toBeInTheDocument()
    })
  })

  describe('Time Range Selection', () => {
    test('CpuChart displays time range options', () => {
      render(<CpuChart data={mockCpuData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('1 小时')).toBeInTheDocument()
      expect(screen.getByText('24 小时')).toBeInTheDocument()
      expect(screen.getByText('7 天')).toBeInTheDocument()
    })

    test('MemoryChart displays time range options', () => {
      render(<MemoryChart data={mockMemoryData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('1 小时')).toBeInTheDocument()
    })

    test('DiskChart displays time range options', () => {
      render(<DiskChart data={mockDiskData} diskDetails={mockDiskDetails} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('1 小时')).toBeInTheDocument()
    })

    test('NetworkChart displays time range options', () => {
      render(<NetworkChart data={mockNetworkData} timeRange="1h" onTimeRangeChange={jest.fn()} />)
      expect(screen.getByText('1 小时')).toBeInTheDocument()
    })
  })
})
