import React, { useState } from 'react'
import { Input, Select, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

const { Search } = Input

/**
 * 日志搜索栏组件
 * @param {Object} props
 * @param {Function} props.onSearch - 搜索回调函数
 * @param {Function} props.onLevelFilter - 级别过滤回调函数
 * @param {Function} props.onTimeRangeChange - 时间范围改变回调函数
 * @param {string} props.levelFilter - 当前级别过滤值
 * @param {string} props.timeRange - 当前时间范围值
 */
const LogSearchBar = ({
  onSearch,
  onLevelFilter,
  onTimeRangeChange,
  levelFilter,
  timeRange
}) => {
  const [searchValue, setSearchValue] = useState('')

  /**
   * 处理搜索
   */
  const handleSearch = (value) => {
    onSearch(value)
  }

  /**
   * 处理级别过滤改变
   */
  const handleLevelChange = (value) => {
    onLevelFilter(value)
  }

  /**
   * 处理时间范围改变
   */
  const handleTimeRangeChange = (value) => {
    onTimeRangeChange(value)
  }

  return (
    <Space.Compact block>
      <Search
        placeholder="搜索日志关键词"
        allowClear
        onSearch={handleSearch}
        onChange={(e) => setSearchValue(e.target.value)}
        value={searchValue}
        prefix={<SearchOutlined />}
        style={{ flex: 1 }}
        size="middle"
      />
      <Select
        value={levelFilter}
        onChange={handleLevelChange}
        placeholder="日志级别"
        style={{ width: 120 }}
        size="middle"
        allowClear
      >
        <Select.Option value="all">全部级别</Select.Option>
        <Select.Option value="info">INFO</Select.Option>
        <Select.Option value="warning">WARNING</Select.Option>
        <Select.Option value="error">ERROR</Select.Option>
        <Select.Option value="debug">DEBUG</Select.Option>
      </Select>
      <Select
        value={timeRange}
        onChange={handleTimeRangeChange}
        placeholder="时间范围"
        style={{ width: 100 }}
        size="middle"
      >
        <Select.Option value="all">全部</Select.Option>
        <Select.Option value="1h">1 小时</Select.Option>
        <Select.Option value="6h">6 小时</Select.Option>
        <Select.Option value="24h">24 小时</Select.Option>
        <Select.Option value="7d">7 天</Select.Option>
      </Select>
    </Space.Compact>
  )
}

export default LogSearchBar
