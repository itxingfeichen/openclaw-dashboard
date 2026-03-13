import React, { useState } from 'react';
import { Form, Input, Select, Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Option } = Select;

/**
 * AgentFilter Component
 * Provides search, status filter, and refresh functionality
 */
const AgentFilter = ({ onFilter, onRefresh, loading }) => {
  const [form] = Form.useForm();

  const handleFilterChange = (values) => {
    if (onFilter) {
      onFilter(values);
    }
  };

  const handleReset = () => {
    form.resetFields();
    if (onFilter) {
      onFilter({});
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Form
        form={form}
        layout="inline"
        onValuesChange={handleFilterChange}
        style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
      >
        <Form.Item name="search" noStyle>
          <Input
            placeholder="搜索名称或 ID"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            allowClear
          />
        </Form.Item>

        <Form.Item name="status" noStyle>
          <Select
            placeholder="状态筛选"
            style={{ width: 120 }}
            allowClear
          >
            <Option value="active">活跃</Option>
            <Option value="inactive">未激活</Option>
            <Option value="unknown">未知</Option>
          </Select>
        </Form.Item>

        <Form.Item name="sortBy" noStyle>
          <Select
            placeholder="排序字段"
            style={{ width: 120 }}
            defaultValue="createdAt"
          >
            <Option value="name">名称</Option>
            <Option value="createdAt">创建时间</Option>
            <Option value="status">状态</Option>
          </Select>
        </Form.Item>

        <Form.Item name="sortOrder" noStyle>
          <Select
            placeholder="排序方式"
            style={{ width: 100 }}
            defaultValue="desc"
          >
            <Option value="asc">升序</Option>
            <Option value="desc">降序</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SearchOutlined />}
              onClick={() => form.submit()}
            >
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AgentFilter;
