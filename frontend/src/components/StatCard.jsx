import React from 'react'
import { Card, Statistic } from 'antd'
import {
  CheckCircleOutlined,
  StopOutlined,
  RobotOutlined,
  TaskOutlined,
  CommentOutlined
} from '@ant-design/icons'

/**
 * 统计卡片组件
 * @param {Object} props
 * @param {string} props.title - 卡片标题
 * @param {number} props.value - 显示数值
 * @param {string} props.type - 卡片类型 (system, agent, task, session)
 * @param {boolean} props.status - 系统状态 (仅 system 类型使用)
 */
const StatCard = ({ title, value, type, status }) => {
  const getIcon = () => {
    switch (type) {
      case 'system':
        return status ? (
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} />
        ) : (
          <StopOutlined style={{ color: '#ff4d4f', fontSize: '24px' }} />
        )
      case 'agent':
        return <RobotOutlined style={{ color: '#1890ff', fontSize: '24px' }} />
      case 'task':
        return <TaskOutlined style={{ color: '#722ed1', fontSize: '24px' }} />
      case 'session':
        return <CommentOutlined style={{ color: '#fa8c16', fontSize: '24px' }} />
      default:
        return null
    }
  }

  const getStatusText = () => {
    if (type === 'system') {
      return status ? '运行中' : '停止'
    }
    return value
  }

  const getPrefix = () => {
    if (type === 'system') {
      return <div style={{ fontSize: '24px' }}>{getIcon()}</div>
    }
    return null
  }

  return (
    <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <Statistic
        title={title}
        value={getStatusText()}
        prefix={getPrefix()}
        valueStyle={{
          color: type === 'system' ? (status ? '#52c41a' : '#ff4d4f') : '#1890ff',
          fontSize: '24px',
          fontWeight: 'bold'
        }}
      />
    </Card>
  )
}

export default StatCard
