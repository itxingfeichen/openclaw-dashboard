import React from 'react';
import { Form, Input, Select, Button, Space, Radio } from 'antd';
import { SearchOutlined, ReloadOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';

const { Option } = Select;

/**
 * Import service constants
 */
import { CATEGORY_LABELS, SOURCE_LABELS } from '../services/skillService';

/**
 * SkillFilter Component
 * Provides search, category filter, source filter, view mode toggle, and refresh functionality
 */
const SkillFilter = ({ onFilter, onRefresh, onSourceChange, onViewModeChange, viewMode, loading }) => {
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
        style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}
      >
        {/* Search Input */}
        <Form.Item name="search" noStyle>
          <Input
            placeholder="搜索技能名称、描述或标签"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            allowClear
            onPressEnter={() => form.submit()}
          />
        </Form.Item>

        {/* Category Filter */}
        <Form.Item name="category" noStyle>
          <Select
            placeholder="分类筛选"
            style={{ width: 120 }}
            allowClear
          >
            <Option value="official">{CATEGORY_LABELS.official}</Option>
            <Option value="community">{CATEGORY_LABELS.community}</Option>
            <Option value="tool">{CATEGORY_LABELS.tool}</Option>
            <Option value="language">{CATEGORY_LABELS.language}</Option>
            <Option value="security">{CATEGORY_LABELS.security}</Option>
          </Select>
        </Form.Item>

        {/* Source Filter */}
        <Form.Item name="source" noStyle>
          <Select
            placeholder="技能来源"
            style={{ width: 120 }}
            allowClear
            onChange={onSourceChange}
          >
            <Option value="skillhub">{SOURCE_LABELS.skillhub}</Option>
            <Option value="clawhub">{SOURCE_LABELS.clawhub}</Option>
          </Select>
        </Form.Item>

        {/* Sort By */}
        <Form.Item name="sortBy" noStyle>
          <Select
            placeholder="排序字段"
            style={{ width: 120 }}
            defaultValue="downloads"
          >
            <Option value="name">名称</Option>
            <Option value="downloads">下载量</Option>
            <Option value="rating">评分</Option>
            <Option value="createdAt">创建时间</Option>
          </Select>
        </Form.Item>

        {/* Sort Order */}
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

        {/* View Mode Toggle */}
        <Form.Item>
          <Radio.Group 
            value={viewMode} 
            onChange={(e) => onViewModeChange && onViewModeChange(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="table">
              <UnorderedListOutlined /> 表格
            </Radio.Button>
            <Radio.Button value="card">
              <AppstoreOutlined /> 卡片
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* Action Buttons */}
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

export default SkillFilter;
