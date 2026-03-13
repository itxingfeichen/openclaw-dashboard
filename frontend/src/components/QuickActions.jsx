import React from 'react'
import { Card, Button, Space, Modal, message as antdMessage } from 'antd'
import {
  PlayCircleFilled,
  StopFilled,
  FileTextOutlined,
  PlusCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons'

/**
 * 快速操作组件
 * @param {Object} props
 * @param {Function} props.onStartAgent - 启动 Agent 回调
 * @param {Function} props.onStopAgent - 停止 Agent 回调
 * @param {Function} props.onViewLogs - 查看日志回调
 * @param {Function} props.onCreateAgent - 创建新 Agent 回调
 * @param {boolean} props.isAgentRunning - Agent 当前是否运行中
 */
const QuickActions = ({
  onStartAgent,
  onStopAgent,
  onViewLogs,
  onCreateAgent,
  isAgentRunning = false
}) => {
  const [loading, setLoading] = React.useState(false)

  const handleStartAgent = async () => {
    setLoading(true)
    try {
      await onStartAgent?.()
      antdMessage.success('Agent 启动成功')
    } catch (error) {
      antdMessage.error('Agent 启动失败')
    } finally {
      setLoading(false)
    }
  }

  const handleStopAgent = async () => {
    Modal.confirm({
      title: '确认停止 Agent',
      content: '确定要停止当前运行的 Agent 吗？这可能会中断正在进行的任务。',
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        setLoading(true)
        try {
          await onStopAgent?.()
          antdMessage.success('Agent 已停止')
        } catch (error) {
          antdMessage.error('Agent 停止失败')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  const handleViewLogs = () => {
    onViewLogs?.()
  }

  const handleCreateAgent = () => {
    onCreateAgent?.()
  }

  return (
    <Card
      title="快速操作"
      variant="borderless"
      style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginTop: '24px' }}
    >
      <Space size="middle" wrap>
        {!isAgentRunning ? (
          <Button
            type="primary"
            icon={<PlayCircleFilled />}
            size="large"
            onClick={handleStartAgent}
            loading={loading}
            style={{ width: '140px' }}
          >
            启动 Agent
          </Button>
        ) : (
          <Button
            danger
            icon={<StopFilled />}
            size="large"
            onClick={handleStopAgent}
            loading={loading}
            style={{ width: '140px' }}
          >
            停止 Agent
          </Button>
        )}

        <Button
          icon={<FileTextOutlined />}
          size="large"
          onClick={handleViewLogs}
          style={{ width: '140px' }}
        >
          查看日志
        </Button>

        <Button
          icon={<PlusCircleOutlined />}
          size="large"
          onClick={handleCreateAgent}
          style={{ width: '140px' }}
        >
          创建 Agent
        </Button>

        <Button
          icon={<ReloadOutlined />}
          size="large"
          onClick={() => window.location.reload()}
          style={{ width: '140px' }}
        >
          刷新
        </Button>
      </Space>
    </Card>
  )
}

export default QuickActions
