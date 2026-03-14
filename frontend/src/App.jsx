import { Layout, Menu, Button } from 'antd'
import { useState } from 'react'
import {
  DashboardOutlined,
  RobotOutlined,
  CheckSquareOutlined,
  SettingOutlined,
  FileTextOutlined,
  PlusOutlined,
  WifiOutlined,
  BellOutlined,
  BackupOutlined
} from '@ant-design/icons'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard/Dashboard'
import AgentsPage from './pages/Agents/AgentsPage'
import AgentCreate from './pages/AgentCreate/AgentCreate'
import AgentCreateWizard from './pages/AgentCreateWizard/AgentCreateWizard'
import Logs from './pages/Logs/Logs'
import LogStream from './pages/LogStream/LogStream'
import TasksPage from './pages/Tasks/Tasks'
import ConfigHistory from './pages/ConfigHistory/ConfigHistory'
import Alerts from './pages/Alerts/Alerts'
import BackupPage from './pages/Backup/Backup'

const { Header, Content, Footer, Sider } = Layout

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

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
      icon: <CheckSquareOutlined />,
      label: '任务管理'
    },
    {
      key: 'alerts',
      icon: <BellOutlined />,
      label: '告警管理'
    },
    {
      key: 'logs',
      icon: <FileTextOutlined />,
      label: '日志查看'
    },
    {
      key: 'logstream',
      icon: <WifiOutlined />,
      label: '实时日志流'
    },
    {
      key: 'config-history',
      icon: <FileTextOutlined />,
      label: '配置历史'
    },
    {
      key: 'backups',
      icon: <BackupOutlined />,
      label: '备份管理'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置'
    }
  ]

  const handleMenuClick = ({ key }) => {
    if (key === 'dashboard') {
      navigate('/')
    } else {
      navigate(`/${key}`)
    }
  }

  const renderContent = () => {
    return (
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agents/create" element={<AgentCreate />} />
        <Route path="/agents/create-wizard" element={<AgentCreateWizard />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/logstream" element={<LogStream />} />
        <Route path="/backups" element={<BackupPage />} />
        <Route 
          path="/settings" 
          element={
            <div style={{ padding: '24px' }}>
              <h1>系统设置</h1>
              <p>系统设置页面开发中...</p>
            </div>
          } 
        />
      </Routes>
    )
  }

  return (
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
            selectedKeys={[location.pathname === '/' ? 'dashboard' : location.pathname.split('/')[1]]}
            items={items}
            onClick={handleMenuClick}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {location.pathname === '/agents' && (
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/agents/create-wizard')}
                >
                  新建 Agent (向导模式)
                </Button>
              )}
              <div style={{ fontSize: '14px', color: '#666' }}>
                {new Date().toLocaleDateString('zh-CN')}
              </div>
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
  )
}

export default App
