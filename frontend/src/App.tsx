import { ConfigProvider, Layout, theme } from 'antd'
import { useState } from 'react'

const { Header, Content, Footer } = Layout

function App() {
  const [api, contextHolder] = theme.useToken()

  return (
    <ConfigProvider>
      {contextHolder}
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
            OpenClaw Dashboard
          </div>
        </Header>
        <Content style={{ padding: '24px' }}>
          <div
            style={{
              background: '#fff',
              padding: 24,
              minHeight: 360,
              borderRadius: 8,
            }}
          >
            <h1>Welcome to OpenClaw Dashboard</h1>
            <p>Project scaffold successfully created!</p>
            <p>Primary color: {api.colorPrimary}</p>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          OpenClaw Dashboard ©{new Date().getFullYear()} Created by OpenClaw
        </Footer>
      </Layout>
    </ConfigProvider>
  )
}

export default App
