import { ConfigProvider, Layout, theme, Menu } from 'antd'
import { useState } from 'react'
import {
  DashboardOutlined,
  RobotOutlined,
  TaskOutlined,
  SettingOutlined
} from '@ant-design/icons'
import Dashboard from './pages/Dashboard/Dashboard'

const { Header, Content, Footer, Sider } = Layout

function App() {
  const [api, contextHolder] = theme.useToken()
  const [collapsed, setCollapsed] = useState(false)
  const [current, setCurrent] = useState('dashboard')

  const items = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘'
    },
    {
      key: 'agents',
      icon: <RobotOutlined />,
      label: 'Agent 管理'
    },
    {
      key: 'tasks',
      icon: <TaskOutlined />,
      label: '任务管理'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置'
    }
  ]

  const renderContent = () => {
    switch (current) {
      case 'dashboard':
        return <Dashboard />
      case 'agents':
        return (
          <div style={{ padding: '24px' }}>
            <h1>Agent 管理</h1>
            <p>Agent 管理页面开发中...</p>
          </div>
        )
      case 'tasks':
        return (
          <div style={{ padding: '24px' }}>
            <h1>任务管理</h1>
            <p>任务管理页面开发中...</p>
          </div>
        )
      case 'settings':
        return (
          <div style={{ padding: '24px' }}>
            <h1>系统设置</h1>
            <p>系统设置页面开发中...</p>
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <ConfigProvider>
      {contextHolder}
      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
          <div
            style={{
              height: '64px',
              margin: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: collapsed ? '12px' : '14px'
            }}
          >
            {collapsed ? 'OC' : 'OpenClaw'}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[current]}
            items={items}
            onClick={({ key }) => setCurrent(key)}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              padding: '0 24px',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>OpenClaw Dashboard</div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {new Date().toLocaleDateString('zh-CN')}
            </div>
          </Header>
          <Content style={{ margin: '24px 16px' }}>
            {renderContent()}
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            OpenClaw Dashboard ©{new Date().getFullYear()} Created by OpenClaw
          </Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default App
