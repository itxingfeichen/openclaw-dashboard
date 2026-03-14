import React from 'react'
import { Select } from 'antd'

/**
 * 日志源选择器组件
 * @param {Object} props
 * @param {Array} props.sources - 日志源列表
 * @param {string} props.selectedSource - 当前选中的日志源
 * @param {Function} props.onChange - 选择改变时的回调函数
 */
const LogSourceSelector = ({ sources, selectedSource, onChange }) => {
  return (
    <Select
      value={selectedSource}
      onChange={onChange}
      placeholder="选择日志源"
      style={{ width: '100%' }}
      size="middle"
      showSearch
      optionFilterProp="children"
    >
      {sources.map((source) => (
        <Select.Option key={source} value={source}>
          {source}
        </Select.Option>
      ))}
    </Select>
  )
}

export default LogSourceSelector
