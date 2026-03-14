import React, { useState } from 'react'
import { Card, Table, Tag, Space, Button, Empty, Select, Input } from 'antd'
import {
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons'

/**
 * 告警列表组件
 * 支持告警级别筛选、告警确认/忽略
 * @param {Object} props
 * @param {Array} props.alerts - 告警列表数据
 * @param {Function} props.onDismiss - 解除告警回调
 * @param {Function} props.onViewDetail - 查看详情回调
 * @param {Function} props.onConfirm - 确认告警回调
 * @param {Function} props.onIgnore - 忽略告警回调
 */
const AlertList = ({ alerts = [], onDismiss, onViewDetail, onConfirm, onIgnore }) => {
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchText, setSearchText] = useState('')
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
    if (status === 'confirmed' || status === '已确认') {
      return {
        color: 'blue',
        icon: null,
        text: '已确认'
      }
    }
    if (status === 'ignored' || status === '已忽略') {
      return {
        color: 'default',
        icon: null,
        text: '已忽略'
      }
    }
    return {
      color: 'default',
      icon: null,
      text: '未解决'
    }
  }

  // 过滤告警数据
  const filteredAlerts = alerts.filter((alert) => {
    const matchLevel = filterLevel === 'all' || alert.level === filterLevel
    const matchStatus = filterStatus === 'all' || alert.status === filterStatus
    const matchSearch = !searchText || 
      alert.message?.toLowerCase().includes(searchText.toLowerCase()) ||
      alert.source?.toLowerCase().includes(searchText.toLowerCase())
    return matchLevel && matchStatus && matchSearch
  })

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
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => onViewDetail?.(record)}
          >
            详情
          </Button>
          {record.status !== 'resolved' && record.status !== '已解决' && record.status !== 'confirmed' && record.status !== '已确认' && (
            <Button
              type="link"
              size="small"
              onClick={() => onConfirm?.(record)}
            >
              确认
            </Button>
          )}
          {record.status !== 'resolved' && record.status !== '已解决' && record.status !== 'ignored' && record.status !== '已忽略' && (
            <Button
              type="link"
              size="small"
              onClick={() => onIgnore?.(record)}
            >
              忽略
            </Button>
          )}
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
      title={
        <Space>
          <FilterOutlined />
          告警列表
        </Space>
      }
      variant="borderless"
      style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginTop: '24px' }}
      extra={
        <Space wrap>
          <Input.Search
            placeholder="搜索告警内容"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            value={filterLevel}
            onChange={setFilterLevel}
            style={{ width: 120 }}
          >
            <Select.Option value="all">全部级别</Select.Option>
            <Select.Option value="critical">严重</Select.Option>
            <Select.Option value="warning">警告</Select.Option>
            <Select.Option value="info">信息</Select.Option>
          </Select>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 120 }}
          >
            <Select.Option value="all">全部状态</Select.Option>
            <Select.Option value="active">未解决</Select.Option>
            <Select.Option value="confirmed">已确认</Select.Option>
            <Select.Option value="ignored">已忽略</Select.Option>
            <Select.Option value="resolved">已解决</Select.Option>
          </Select>
          {filteredAlerts.length > 0 && (
            <span style={{ fontSize: '12px', color: '#999' }}>
              显示 {filteredAlerts.length} / {alerts.length} 条
            </span>
          )}
        </Space>
      }
    >
      {filteredAlerts.length > 0 ? (
        <Table
          columns={columns}
          dataSource={filteredAlerts}
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
