import React from 'react'
import { Table, Tag } from 'antd'

/**
 * 日志查看器组件
 * @param {Object} props
 * @param {Array} props.logs - 日志数据数组
 * @param {string} props.searchQuery - 搜索关键词（用于高亮）
 */
const LogViewer = ({ logs, searchQuery }) => {
  /**
   * 高亮搜索关键词
   */
  const highlightText = (text) => {
    if (!searchQuery) return text

    const parts = text.split(new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={index} className="highlight">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  /**
   * 转义正则表达式特殊字符
   */
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * 获取日志级别标签
   */
  const getLevelTag = (level) => {
    const levelConfig = {
      info: { color: 'blue', text: 'INFO' },
      warning: { color: 'orange', text: 'WARN' },
      error: { color: 'red', text: 'ERROR' },
      debug: { color: 'green', text: 'DEBUG' }
    }

    const config = levelConfig[level.toLowerCase()] || { color: 'default', text: level }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  /**
   * 格式化时间
   */
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp) => (
        <span className="log-timestamp">{formatTime(timestamp)}</span>
      ),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level) => getLevelTag(level),
      filters: [
        { text: 'INFO', value: 'info' },
        { text: 'WARNING', value: 'warning' },
        { text: 'ERROR', value: 'error' },
        { text: 'DEBUG', value: 'debug' }
      ],
      onFilter: (value, record) => record.level === value
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      render: (message) => (
        <span className="log-message">{highlightText(message)}</span>
      )
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 150,
      render: (source) => (
        <span className="log-source">{source}</span>
      )
    }
  ]

  // 为每行添加唯一 key
  const dataSource = logs.map((log, index) => ({
    ...log,
    key: log.id || `log-${index}`
  }))

  return (
    <div className="log-table-container">
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        size="small"
        className="log-table"
        scroll={{ y: 600 }}
        locale={{ emptyText: '暂无日志数据' }}
      />
    </div>
  )
}

export default LogViewer
