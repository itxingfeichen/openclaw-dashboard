import { useState } from 'react';
import { Layout, Menu, theme, Card, Row, Col, Statistic } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div
          style={{
            height: 32,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'OC' : 'OpenClaw'}
        </div>
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
          <Menu.Item key="1" icon={<DashboardOutlined />}>
            Dashboard
          </Menu.Item>
          <Menu.Item key="2" icon={<ProjectOutlined />}>
            Projects
          </Menu.Item>
          <Menu.Item key="3" icon={<UserOutlined />}>
            Users
          </Menu.Item>
          <Menu.Item key="4" icon={<SettingOutlined />}>
            Settings
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: colorBgContainer }}>
          <h2 style={{ margin: 0, lineHeight: '64px' }}>OpenClaw Dashboard</h2>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <h1>Welcome to OpenClaw Dashboard</h1>
            <p style={{ color: '#666', marginBottom: 24 }}>
              Your centralized management platform for OpenClaw agents and workflows.
            </p>
            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <Statistic title="Active Agents" value={3} prefix="🤖" />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="Running Tasks" value={12} prefix="📋" />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="Success Rate" value={98.5} suffix="%" prefix="✅" />
                </Card>
              </Col>
            </Row>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
