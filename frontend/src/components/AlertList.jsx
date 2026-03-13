import React from 'react'
import { Card, Table, Tag, Space, Button, Empty } from 'antd'
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'

/**
 * 告警列表组件
 * @param {Object} props
 * @param {Array} props.alerts - 告警列表数据
 * @param {Function} props.onDismiss - 解除告警回调
 * @param {Function} props.onViewDetail - 查看详情回调
 */
const AlertList = ({ alerts = [], onDismiss, onViewDetail }) => {
  const getLevelInfo = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
      case '严重':
        return {
          color: 'red',
          icon: <ExclamationCircleOutlined />,
          text: '严重'
        }
      case 'warning':
      case '警告':
        return {
          color: 'orange',
          icon: <WarningOutlined />,
          text: '警告'
        }
      case 'info':
      case '信息':
      default:
        return {
          color: 'blue',
          icon: <InfoCircleOutlined />,
          text: '信息'
        }
    }
  }

  const getStatusInfo = (status) => {
    if (status === 'resolved' || status === '已解决') {
      return {
        color: 'green',
        icon: <CheckCircleOutlined />,
        text: '已解决'
      }
    }
    return {
      color: 'default',
      icon: null,
      text: '未解决'
    }
  }

  const columns = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level) => {
        const { color, icon, text } = getLevelInfo(level)
        return (
          <Tag color={color} icon={icon}>
            {text}
          </Tag>
        )
      }
    },
    {
      title: '告警内容',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (text) => <span style={{ fontSize: '12px', color: '#666' }}>{text}</span>
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp) => {
        const date = new Date(timestamp)
        return date.toLocaleString('zh-CN')
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const { color, icon, text } = getStatusInfo(status)
        return (
          <Tag color={color} icon={icon}>
            {text}
          </Tag>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => onViewDetail?.(record)}
            disabled={record.status === 'resolved' || record.status === '已解决'}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => onDismiss?.(record)}
            disabled={record.status === 'resolved' || record.status === '已解决'}
          >
            解除
          </Button>
        </Space>
      )
    }
  ]

  return (
    <Card
      title="告警列表"
      variant="borderless"
      style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginTop: '24px' }}
      extra={
        alerts.length > 0 ? (
          <span style={{ fontSize: '12px', color: '#999' }}>
            共 {alerts.filter((a) => a.status !== 'resolved' && a.status !== '已解决').length}{' '}
            条未解决告警
          </span>
        ) : null
      }
    >
      {alerts.length > 0 ? (
        <Table
          columns={columns}
          dataSource={alerts}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            locale: { items_per_page: '条/页' }
          }}
          size="middle"
          scroll={{ x: 800 }}
        />
      ) : (
        <Empty description="暂无告警" style={{ padding: '40px 0' }}>
          <Button type="primary" ghost onClick={() => window.location.reload()}>
            刷新
          </Button>
        </Empty>
      )}
    </Card>
  )
}

export default AlertList
