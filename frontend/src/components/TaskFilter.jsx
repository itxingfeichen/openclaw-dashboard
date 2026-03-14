import React, { useState } from 'react';
import { Row, Col, Input, Select, Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Option } = Select;

/**
 * TaskFilter Component
 * Filter bar for task list with search, status, agent, and type filters
 */
const TaskFilter = ({ onFilter, onRefresh, loading }) => {
  const [searchValue, setSearchValue] = useState('');

  /**
   * Handle search input change
   */
  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  /**
   * Handle search submit
   */
  const handleSearch = () => {
    onFilter({ search: searchValue });
  };

  /**
   * Handle search clear
   */
  const handleClear = () => {
    setSearchValue('');
    onFilter({ search: '' });
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (key, value) => {
    onFilter({ [key]: value });
  };

  return (
    <Row gutter={[16, 16]} align="middle">
      <Col xs={24} sm={8} md={6}>
        <Input
          placeholder="搜索任务 ID、内容或 Agent"
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={handleSearchChange}
          onPressEnter={handleSearch}
          allowClear
          onClear={handleClear}
        />
      </Col>
      
      <Col xs={24} sm={6} md={4}>
        <Select
          placeholder="状态筛选"
          style={{ width: '100%' }}
          onChange={(value) => handleFilterChange('status', value)}
          allowClear
        >
          <Option value="running">运行中</Option>
          <Option value="done">已完成</Option>
          <Option value="failed">失败</Option>
          <Option value="pending">待处理</Option>
        </Select>
      </Col>

      <Col xs={24} sm={6} md={4}>
        <Select
          placeholder="按 Agent 筛选"
          style={{ width: '100%' }}
          onChange={(value) => handleFilterChange('agentId', value)}
          allowClear
        >
          <Option value="agent-001">Data Processor</Option>
          <Option value="agent-002">Code Reviewer</Option>
          <Option value="agent-003">Customer Support</Option>
          <Option value="agent-004">Analytics Engine</Option>
          <Option value="agent-005">Security Monitor</Option>
          <Option value="agent-006">Document Parser</Option>
          <Option value="agent-008">Scheduler Pro</Option>
          <Option value="agent-011">Translation Bot</Option>
        </Select>
      </Col>

      <Col xs={24} sm={6} md={4}>
        <Select
          placeholder="按类型筛选"
          style={{ width: '100%' }}
          onChange={(value) => handleFilterChange('type', value)}
          allowClear
        >
          <Option value="data-processing">数据处理</Option>
          <Option value="code-review">代码审查</Option>
          <Option value="support">客户支持</Option>
          <Option value="analytics">分析</Option>
          <Option value="security-scan">安全扫描</Option>
          <Option value="parsing">文档解析</Option>
          <Option value="scheduling">调度</Option>
          <Option value="translation">翻译</Option>
        </Select>
      </Col>

      <Col xs={24} sm={6} md={6} style={{ textAlign: 'right' }}>
        <Space>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            搜索
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      </Col>
    </Row>
  );
};

export default TaskFilter;
