import React from 'react'
import { Pagination } from 'antd'

/**
 * 日志分页组件
 * @param {Object} props
 * @param {number} props.current - 当前页码
 * @param {number} props.pageSize - 每页条数
 * @param {number} props.total - 总记录数
 * @param {Function} props.onChange - 分页改变回调函数 (page, pageSize)
 */
const LogPagination = ({ current, pageSize, total, onChange }) => {
  /**
   * 处理分页改变
   */
  const handlePageChange = (page, size) => {
    onChange(page, size || pageSize)
  }

  /**
   * 处理每页条数改变
   */
  const handleShowSizeChange = (page, size) => {
    onChange(page, size)
  }

  return (
    <div className="log-pagination">
      <Pagination
        current={current}
        pageSize={pageSize}
        total={total}
        onChange={handlePageChange}
        onShowSizeChange={handleShowSizeChange}
        showSizeChanger
        showQuickJumper
        showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
        pageSizeOptions={['20', '50', '100', '200']}
        size="default"
      />
    </div>
  )
}

export default LogPagination
