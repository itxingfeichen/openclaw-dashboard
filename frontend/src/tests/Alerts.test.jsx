import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import Alerts from '../../pages/Alerts/Alerts'
import AlertRules from '../../components/AlertRules'
import AlertList from '../../components/AlertList'
import NotificationSettings from '../../components/NotificationSettings'

// Mock fetch
global.fetch = vi.fn()

const mockAlerts = [
  {
    id: '1',
    level: 'critical',
    message: 'CPU 使用率持续高于 90%',
    source: 'System Monitor',
    timestamp: new Date().toISOString(),
    status: 'active'
  },
  {
    id: '2',
    level: 'warning',
    message: '内存使用率达到 85%',
    source: 'Resource Monitor',
    timestamp: new Date().toISOString(),
    status: 'confirmed'
  },
  {
    id: '3',
    level: 'info',
    message: '新 Agent 已部署',
    source: 'Agent Manager',
    timestamp: new Date().toISOString(),
    status: 'resolved'
  }
]

const mockRules = [
  {
    id: '1',
    name: 'CPU 使用率过高',
    level: 'critical',
    condition: 'CPU 使用率 > 90% 持续 10 分钟',
    channels: ['email', 'dingtalk'],
    enabled: true
  },
  {
    id: '2',
    name: '内存使用率警告',
    level: 'warning',
    condition: '内存使用率 > 85% 持续 5 分钟',
    channels: ['email'],
    enabled: true
  }
]

const renderWithProviders = (component) => {
  return render(
    <ConfigProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ConfigProvider>
  )
}

describe('AlertList Component', () => {
  const mockOnDismiss = vi.fn()
  const mockOnViewDetail = vi.fn()
  const mockOnConfirm = vi.fn()
  const mockOnIgnore = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders alert list correctly', () => {
    renderWithProviders(
      <AlertList
        alerts={mockAlerts}
        onDismiss={mockOnDismiss}
        onViewDetail={mockOnViewDetail}
        onConfirm={mockOnConfirm}
        onIgnore={mockOnIgnore}
      />
    )

    expect(screen.getByText('告警列表')).toBeInTheDocument()
    expect(screen.getByText('CPU 使用率持续高于 90%')).toBeInTheDocument()
    expect(screen.getByText('内存使用率达到 85%')).toBeInTheDocument()
    expect(screen.getByText('新 Agent 已部署')).toBeInTheDocument()
  })

  it('displays correct level tags', () => {
    renderWithProviders(
      <AlertList
        alerts={mockAlerts}
        onDismiss={mockOnDismiss}
        onViewDetail={mockOnViewDetail}
        onConfirm={mockOnConfirm}
        onIgnore={mockOnIgnore}
      />
    )

    expect(screen.getByText('严重')).toBeInTheDocument()
    expect(screen.getByText('警告')).toBeInTheDocument()
    expect(screen.getByText('信息')).toBeInTheDocument()
  })

  it('displays status tags correctly', () => {
    renderWithProviders(
      <AlertList
        alerts={mockAlerts}
        onDismiss={mockOnDismiss}
        onViewDetail={mockOnViewDetail}
        onConfirm={mockOnConfirm}
        onIgnore={mockOnIgnore}
      />
    )

    expect(screen.getByText('已解决')).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', async () => {
    renderWithProviders(
      <AlertList
        alerts={mockAlerts}
        onDismiss={mockOnDismiss}
        onViewDetail={mockOnViewDetail}
        onConfirm={mockOnConfirm}
        onIgnore={mockOnIgnore}
      />
    )

    const dismissButtons = screen.getAllByText('解除')
    fireEvent.click(dismissButtons[0])

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledWith(mockAlerts[0])
    })
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    renderWithProviders(
      <AlertList
        alerts={mockAlerts}
        onDismiss={mockOnDismiss}
        onViewDetail={mockOnViewDetail}
        onConfirm={mockOnConfirm}
        onIgnore={mockOnIgnore}
      />
    )

    const confirmButton = screen.getByText('确认')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(mockAlerts[0])
    })
  })

  it('calls onIgnore when ignore button is clicked', async () => {
    renderWithProviders(
      <AlertList
        alerts={mockAlerts}
        onDismiss={mockOnDismiss}
        onViewDetail={mockOnViewDetail}
        onConfirm={mockOnConfirm}
        onIgnore={mockOnIgnore}
      />
    )

    const ignoreButton = screen.getByText('忽略')
    fireEvent.click(ignoreButton)

    await waitFor(() => {
      expect(mockOnIgnore).toHaveBeenCalledWith(mockAlerts[0])
    })
  })

  it('filters alerts by level', async () => {
    renderWithProviders(
      <AlertList
        alerts={mockAlerts}
        onDismiss={mockOnDismiss}
        onViewDetail={mockOnViewDetail}
        onConfirm={mockOnConfirm}
        onIgnore={mockOnIgnore}
      />
    )

    const levelSelect = screen.getByText('全部级别')
    fireEvent.mouseDown(levelSelect)

    const criticalOption = screen.getByText('严重')
    fireEvent.click(criticalOption)

    await waitFor(() => {
      expect(screen.getByText('CPU 使用率持续高于 90%')).toBeInTheDocument()
    })
  })

  it('filters alerts by status', async () => {
    renderWithProviders(
      <AlertList
        alerts={mockAlerts}
        onDismiss={mockOnDismiss}
        onViewDetail={mockOnViewDetail}
        onConfirm={mockOnConfirm}
        onIgnore={mockOnIgnore}
      />
    )

    const statusSelect = screen.getByText('全部状态')
    fireEvent.mouseDown(statusSelect)

    const resolvedOption = screen.getByText('已解决')
    fireEvent.click(resolvedOption)

    await waitFor(() => {
      expect(screen.getByText('新 Agent 已部署')).toBeInTheDocument()
    })
  })

  it('searches alerts by text', () => {
    renderWithProviders(
      <AlertList
        alerts={mockAlerts}
        onDismiss={mockOnDismiss}
        onViewDetail={mockOnViewDetail}
        onConfirm={mockOnConfirm}
        onIgnore={mockOnIgnore}
      />
    )

    const searchInput = screen.getByPlaceholderText('搜索告警内容')
    fireEvent.change(searchInput, { target: { value: 'CPU' } })

    expect(screen.getByText('CPU 使用率持续高于 90%')).toBeInTheDocument()
  })

  it('shows empty state when no alerts', () => {
    renderWithProviders(
      <AlertList
        alerts={[]}
        onDismiss={mockOnDismiss}
        onViewDetail={mockOnViewDetail}
        onConfirm={mockOnConfirm}
        onIgnore={mockOnIgnore}
      />
    )

    expect(screen.getByText('暂无告警')).toBeInTheDocument()
  })
})

describe('AlertRules Component', () => {
  const mockOnCreate = vi.fn()
  const mockOnUpdate = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders rules list correctly', () => {
    renderWithProviders(
      <AlertRules
        rules={mockRules}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByText('告警规则配置')).toBeInTheDocument()
    expect(screen.getByText('CPU 使用率过高')).toBeInTheDocument()
    expect(screen.getByText('内存使用率警告')).toBeInTheDocument()
  })

  it('opens create modal when create button is clicked', () => {
    renderWithProviders(
      <AlertRules
        rules={[]}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const createButton = screen.getByText('新建规则')
    fireEvent.click(createButton)

    expect(screen.getByText('新建告警规则')).toBeInTheDocument()
  })

  it('opens edit modal when edit button is clicked', () => {
    renderWithProviders(
      <AlertRules
        rules={mockRules}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const editButton = screen.getAllByText('编辑')[0]
    fireEvent.click(editButton)

    expect(screen.getByText('编辑告警规则')).toBeInTheDocument()
    expect(screen.getByDisplayValue('CPU 使用率过高')).toBeInTheDocument()
  })

  it('shows confirm dialog when delete button is clicked', () => {
    renderWithProviders(
      <AlertRules
        rules={mockRules}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const deleteButton = screen.getAllByText('删除')[0]
    fireEvent.click(deleteButton)

    expect(screen.getByText('确定要删除此规则吗？')).toBeInTheDocument()
  })

  it('calls onCreate when form is submitted in create mode', async () => {
    renderWithProviders(
      <AlertRules
        rules={[]}
        onCreate={mockOnCreate}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const createButton = screen.getByText('新建规则')
    fireEvent.click(createButton)

    const nameInput = screen.getByPlaceholderText('例如：CPU 使用率过高告警')
    fireEvent.change(nameInput, { target: { value: 'Test Rule' } })

    const conditionInput = screen.getByPlaceholderText('例如：CPU 使用率 > 80% 持续 5 分钟')
    fireEvent.change(conditionInput, { target: { value: 'Test Condition' } })

    const saveButton = screen.getByText('确定')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalled()
    })
  })
})

describe('NotificationSettings Component', () => {
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders notification settings form', () => {
    renderWithProviders(
      <NotificationSettings
        settings={{}}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('通知设置')).toBeInTheDocument()
    expect(screen.getByText('邮件通知')).toBeInTheDocument()
    expect(screen.getByText('短信通知')).toBeInTheDocument()
    expect(screen.getByText('即时通讯工具')).toBeInTheDocument()
  })

  it('displays email settings', () => {
    renderWithProviders(
      <NotificationSettings
        settings={{
          emailEnabled: true,
          emailRecipients: ['admin@example.com']
        }}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('启用邮件通知')).toBeInTheDocument()
    expect(screen.getByText('收件人列表')).toBeInTheDocument()
  })

  it('displays IM tool settings', () => {
    renderWithProviders(
      <NotificationSettings
        settings={{
          dingtalkEnabled: true,
          feishuEnabled: false,
          wechatEnabled: false
        }}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('启用钉钉通知')).toBeInTheDocument()
    expect(screen.getByText('启用飞书通知')).toBeInTheDocument()
    expect(screen.getByText('启用企业微信通知')).toBeInTheDocument()
  })

  it('displays quiet hours settings', () => {
    renderWithProviders(
      <NotificationSettings
        settings={{
          quietHoursEnabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00'
        }}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('启用免打扰时段')).toBeInTheDocument()
  })

  it('allows adding webhook', () => {
    renderWithProviders(
      <NotificationSettings
        settings={{}}
        onSave={mockOnSave}
      />
    )

    const addButton = screen.getByText('添加 Webhook')
    fireEvent.click(addButton)

    expect(screen.getByText('编辑 Webhook')).toBeInTheDocument()
  })

  it('calls onSave when form is submitted', async () => {
    renderWithProviders(
      <NotificationSettings
        settings={{}}
        onSave={mockOnSave}
      />
    )

    const saveButton = screen.getByText('保存设置')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled()
    })
  })
})

describe('Alerts Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders alerts page with stats', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAlerts
    })
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRules
    })
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    })

    renderWithProviders(<Alerts />)

    await waitFor(() => {
      expect(screen.getByText('告警管理')).toBeInTheDocument()
    })

    expect(screen.getByText('总告警数')).toBeInTheDocument()
    expect(screen.getByText('严重告警')).toBeInTheDocument()
    expect(screen.getByText('警告')).toBeInTheDocument()
    expect(screen.getByText('已解决')).toBeInTheDocument()
  })

  it('switches between tabs', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAlerts
    })
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRules
    })
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    })

    renderWithProviders(<Alerts />)

    await waitFor(() => {
      expect(screen.getByText('告警列表')).toBeInTheDocument()
    })

    const rulesTab = screen.getByText('告警规则')
    fireEvent.click(rulesTab)

    await waitFor(() => {
      expect(screen.getByText('告警规则配置')).toBeInTheDocument()
    })

    const settingsTab = screen.getByText('通知设置')
    fireEvent.click(settingsTab)

    await waitFor(() => {
      expect(screen.getByText('通知设置')).toBeInTheDocument()
    })
  })

  it('displays loading state', () => {
    fetch.mockImplementation(() => new Promise(() => {}))

    renderWithProviders(<Alerts />)

    expect(screen.getByText('加载告警数据...')).toBeInTheDocument()
  })
})
