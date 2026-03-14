import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SkillMarket from '../pages/SkillMarket/SkillMarket'
import SkillCard from '../components/SkillCard'
import SkillFilter from '../components/SkillFilter'
import SkillDetail from '../components/SkillDetail'
import { fetchSkills, installSkill, uninstallSkill, updateSkill, CATEGORY_LABELS, SOURCE_LABELS } from '../services/skillService'

// Mock fetch
global.fetch = jest.fn()

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}))

describe('SkillMarket Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('SkillCard Component', () => {
    const mockSkill = {
      id: 'skill-001',
      name: 'weather',
      displayName: '天气查询',
      description: '通过 wttr.in 或 Open-Meteo 获取当前天气和预报',
      version: '1.2.0',
      author: 'OpenClaw Team',
      source: 'skillhub',
      category: 'tool',
      categories: ['tool', 'official'],
      downloads: 1250,
      rating: 4.8,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-03-10T14:20:00Z',
      tags: ['weather', 'forecast', 'api'],
      installed: false,
    }

    test('renders skill card with basic information', () => {
      render(<SkillCard skill={mockSkill} />)
      expect(screen.getByText('天气查询')).toBeInTheDocument()
      expect(screen.getByText('通过 wttr.in 或 Open-Meteo 获取当前天气和预报')).toBeInTheDocument()
      expect(screen.getByText('OpenClaw Team')).toBeInTheDocument()
      expect(screen.getByText('v1.2.0')).toBeInTheDocument()
    })

    test('displays skill source badge', () => {
      render(<SkillCard skill={mockSkill} />)
      expect(screen.getByText('SH')).toBeInTheDocument()
    })

    test('displays category tags', () => {
      render(<SkillCard skill={mockSkill} />)
      expect(screen.getByText('工具')).toBeInTheDocument()
      expect(screen.getByText('官方')).toBeInTheDocument()
    })

    test('displays rating and downloads', () => {
      render(<SkillCard skill={mockSkill} />)
      expect(screen.getByText('4.8')).toBeInTheDocument()
      expect(screen.getByText('1250')).toBeInTheDocument()
    })

    test('displays install button for uninstalled skill', () => {
      render(<SkillCard skill={mockSkill} />)
      expect(screen.getByText('安装')).toBeInTheDocument()
      expect(screen.queryByText('已安装')).not.toBeInTheDocument()
    })

    test('displays installed status for installed skill', () => {
      const installedSkill = { ...mockSkill, installed: true }
      render(<SkillCard skill={installedSkill} />)
      expect(screen.getByText('已安装')).toBeInTheDocument()
      expect(screen.queryByText('安装')).not.toBeInTheDocument()
    })

    test('displays tags', () => {
      render(<SkillCard skill={mockSkill} />)
      expect(screen.getByText('#weather')).toBeInTheDocument()
      expect(screen.getByText('#forecast')).toBeInTheDocument()
      expect(screen.getByText('#api')).toBeInTheDocument()
    })

    test('calls onInstallChange when install button is clicked', async () => {
      const mockOnInstallChange = jest.fn()
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      )

      render(<SkillCard skill={mockSkill} onInstallChange={mockOnInstallChange} />)
      fireEvent.click(screen.getByText('安装'))

      await waitFor(() => {
        expect(mockOnInstallChange).toHaveBeenCalledWith('skill-001', true)
      })
    })
  })

  describe('SkillFilter Component', () => {
    const mockHandlers = {
      onFilter: jest.fn(),
      onRefresh: jest.fn(),
      onSourceChange: jest.fn(),
      onViewModeChange: jest.fn(),
    }

    test('renders search input', () => {
      render(<SkillFilter {...mockHandlers} viewMode="card" loading={false} />)
      expect(screen.getByPlaceholderText('搜索技能名称、描述或标签')).toBeInTheDocument()
    })

    test('renders category filter dropdown', () => {
      render(<SkillFilter {...mockHandlers} viewMode="card" loading={false} />)
      expect(screen.getByPlaceholderText('分类筛选')).toBeInTheDocument()
    })

    test('renders source filter dropdown', () => {
      render(<SkillFilter {...mockHandlers} viewMode="card" loading={false} />)
      expect(screen.getByPlaceholderText('技能来源')).toBeInTheDocument()
    })

    test('renders sort options', () => {
      render(<SkillFilter {...mockHandlers} viewMode="card" loading={false} />)
      expect(screen.getByPlaceholderText('排序字段')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('排序方式')).toBeInTheDocument()
    })

    test('renders view mode toggle', () => {
      render(<SkillFilter {...mockHandlers} viewMode="card" loading={false} />)
      expect(screen.getByText('表格')).toBeInTheDocument()
      expect(screen.getByText('卡片')).toBeInTheDocument()
    })

    test('renders action buttons', () => {
      render(<SkillFilter {...mockHandlers} viewMode="card" loading={false} />)
      expect(screen.getByText('搜索')).toBeInTheDocument()
      expect(screen.getByText('重置')).toBeInTheDocument()
      expect(screen.getByText('刷新')).toBeInTheDocument()
    })

    test('calls onFilter when search input changes', () => {
      render(<SkillFilter {...mockHandlers} viewMode="card" loading={false} />)
      const searchInput = screen.getByPlaceholderText('搜索技能名称、描述或标签')
      fireEvent.change(searchInput, { target: { value: 'weather' } })
      
      expect(mockHandlers.onFilter).toHaveBeenCalled()
    })

    test('calls onRefresh when refresh button is clicked', () => {
      render(<SkillFilter {...mockHandlers} viewMode="card" loading={false} />)
      fireEvent.click(screen.getByText('刷新'))
      expect(mockHandlers.onRefresh).toHaveBeenCalled()
    })

    test('calls onViewModeChange when view mode is toggled', () => {
      render(<SkillFilter {...mockHandlers} viewMode="card" loading={false} />)
      fireEvent.click(screen.getByText('表格'))
      expect(mockHandlers.onViewModeChange).toHaveBeenCalledWith('table')
    })

    test('calls onReset when reset button is clicked', () => {
      render(<SkillFilter {...mockHandlers} viewMode="card" loading={false} />)
      fireEvent.click(screen.getByText('重置'))
      expect(mockHandlers.onFilter).toHaveBeenCalled()
    })
  })

  describe('SkillDetail Component', () => {
    const mockSkill = {
      id: 'skill-001',
      name: 'weather',
      displayName: '天气查询',
      description: '通过 wttr.in 或 Open-Meteo 获取当前天气和预报',
      version: '1.2.0',
      author: 'OpenClaw Team',
      source: 'skillhub',
      category: 'tool',
      categories: ['tool', 'official'],
      downloads: 1250,
      rating: 4.8,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-03-10T14:20:00Z',
      tags: ['weather', 'forecast', 'api'],
      installed: false,
    }

    const mockHandlers = {
      onClose: jest.fn(),
      onInstallChange: jest.fn(),
    }

    test('renders skill detail modal when visible', () => {
      render(
        <SkillDetail
          skill={mockSkill}
          visible={true}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('天气查询')).toBeInTheDocument()
      expect(screen.getByText('通过 wttr.in 或 Open-Meteo 获取当前天气和预报')).toBeInTheDocument()
    })

    test('displays skill statistics', () => {
      render(
        <SkillDetail
          skill={mockSkill}
          visible={true}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('评分')).toBeInTheDocument()
      expect(screen.getByText('下载量')).toBeInTheDocument()
      expect(screen.getByText('版本')).toBeInTheDocument()
      expect(screen.getByText('状态')).toBeInTheDocument()
    })

    test('displays detailed information', () => {
      render(
        <SkillDetail
          skill={mockSkill}
          visible={true}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('技能名称')).toBeInTheDocument()
      expect(screen.getByText('weather')).toBeInTheDocument()
      expect(screen.getByText('作者')).toBeInTheDocument()
      expect(screen.getByText('OpenClaw Team')).toBeInTheDocument()
    })

    test('displays install button for uninstalled skill', () => {
      render(
        <SkillDetail
          skill={mockSkill}
          visible={true}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('安装此技能')).toBeInTheDocument()
    })

    test('displays installed status for installed skill', () => {
      const installedSkill = { ...mockSkill, installed: true }
      render(
        <SkillDetail
          skill={installedSkill}
          visible={true}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('已安装')).toBeInTheDocument()
      expect(screen.getByText('更新')).toBeInTheDocument()
      expect(screen.getByText('卸载')).toBeInTheDocument()
    })

    test('calls onClose when close button is clicked', () => {
      render(
        <SkillDetail
          skill={mockSkill}
          visible={true}
          {...mockHandlers}
        />
      )
      fireEvent.click(screen.getByText('关闭'))
      expect(mockHandlers.onClose).toHaveBeenCalled()
    })

    test('shows risk notice for clawhub skills', () => {
      const clawhubSkill = { ...mockSkill, source: 'clawhub' }
      render(
        <SkillDetail
          skill={clawhubSkill}
          visible={true}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('风险提示')).toBeInTheDocument()
    })

    test('does not show risk notice for skillhub skills', () => {
      render(
        <SkillDetail
          skill={mockSkill}
          visible={true}
          {...mockHandlers}
        />
      )
      expect(screen.queryByText('风险提示')).not.toBeInTheDocument()
    })
  })

  describe('SkillMarket Integration', () => {
    test('renders skill market page', () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [], total: 0 })
        })
      )

      render(<SkillMarket />)
      expect(screen.getByText('技能市场')).toBeInTheDocument()
    })

    test('displays loading state', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}))

      render(<SkillMarket />)
      expect(screen.getByText('加载中...')).toBeInTheDocument()
    })

    test('fetches skills from API', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [], total: 0 })
        })
      )

      render(<SkillMarket />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/skills'))
      }, { timeout: 3000 })
    })

    test('displays empty state when no skills', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [], total: 0 })
        })
      )

      render(<SkillMarket />)

      await waitFor(() => {
        expect(screen.getByText('暂无技能数据')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    test('handles filter changes', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [], total: 0 })
        })
      )

      render(<SkillMarket />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('搜索技能名称、描述或标签')
        fireEvent.change(searchInput, { target: { value: 'test' } })
      })

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    test('handles refresh action', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [], total: 0 })
        })
      )

      render(<SkillMarket />)

      await waitFor(() => {
        const refreshButton = screen.getByText('刷新')
        fireEvent.click(refreshButton)
      })

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })

  describe('Service Functions', () => {
    test('fetchSkills returns data with pagination', async () => {
      const mockResponse = {
        data: [
          { id: 'skill-001', name: 'weather', displayName: '天气查询' }
        ],
        total: 1,
        page: 1,
        pageSize: 12,
      }

      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      )

      const result = await fetchSkills({ page: 1, pageSize: 12 })
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    test('installSkill calls API endpoint', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      )

      const result = await installSkill('skill-001', 'skillhub')
      expect(result.success).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        '/api/skills/install',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ id: 'skill-001', source: 'skillhub' })
        })
      )
    })

    test('uninstallSkill calls API endpoint', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      )

      const result = await uninstallSkill('skill-001')
      expect(result.success).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        '/api/skills/uninstall',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ id: 'skill-001' })
        })
      )
    })

    test('updateSkill calls API endpoint', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      )

      const result = await updateSkill('skill-001')
      expect(result.success).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        '/api/skills/update',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ id: 'skill-001' })
        })
      )
    })

    test('CATEGORY_LABELS contains correct mappings', () => {
      expect(CATEGORY_LABELS.official).toBe('官方')
      expect(CATEGORY_LABELS.community).toBe('社区')
      expect(CATEGORY_LABELS.tool).toBe('工具')
      expect(CATEGORY_LABELS.language).toBe('语言')
    })

    test('SOURCE_LABELS contains correct mappings', () => {
      expect(SOURCE_LABELS.skillhub).toBe('SkillHub')
      expect(SOURCE_LABELS.clawhub).toBe('ClawHub')
    })
  })
})
