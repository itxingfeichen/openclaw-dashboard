import React, { useState, useEffect } from 'react';
import { Form, Select, Checkbox, Card, Row, Col, Typography, Divider, Button, Space } from 'antd';
import { SettingOutlined, FilterOutlined } from '@ant-design/icons';
import {
  EXPORT_TYPES,
  EXPORT_FORMATS,
  AVAILABLE_FIELDS,
} from '../services/exportService';

const { Option } = Select;
const { Title, Text } = Typography;

/**
 * ExportConfig Component
 * Configuration panel for data export with type selection, format selection, and field configuration
 */
const ExportConfig = ({ onConfigChange, initialConfig = {} }) => {
  const [form] = Form.useForm();
  const [selectedType, setSelectedType] = useState(initialConfig.type || EXPORT_TYPES.TASK);
  const [selectedFields, setSelectedFields] = useState(initialConfig.fields || []);
  const [filterConditions, setFilterConditions] = useState(initialConfig.filters || {});

  /**
   * Handle data type change
   */
  const handleTypeChange = (type) => {
    setSelectedType(type);
    setSelectedFields([]);
    form.setFieldsValue({ fields: [] });
    
    onConfigChange?.({
      type,
      format: form.getFieldValue('format'),
      fields: [],
      filters: filterConditions,
    });
  };

  /**
   * Handle format change
   */
  const handleFormatChange = (format) => {
    onConfigChange?.({
      type: selectedType,
      format,
      fields: selectedFields,
      filters: filterConditions,
    });
  };

  /**
   * Handle field selection change
   */
  const handleFieldChange = (checkedValues) => {
    setSelectedFields(checkedValues);
    onConfigChange?.({
      type: selectedType,
      format: form.getFieldValue('format'),
      fields: checkedValues,
      filters: filterConditions,
    });
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filterConditions, [key]: value };
    setFilterConditions(newFilters);
    onConfigChange?.({
      type: selectedType,
      format: form.getFieldValue('format'),
      fields: selectedFields,
      filters: newFilters,
    });
  };

  /**
   * Select all fields
   */
  const handleSelectAll = () => {
    const allFields = AVAILABLE_FIELDS[selectedType].map(f => f.key);
    setSelectedFields(allFields);
    form.setFieldsValue({ fields: allFields });
    onConfigChange?.({
      type: selectedType,
      format: form.getFieldValue('format'),
      fields: allFields,
      filters: filterConditions,
    });
  };

  /**
   * Deselect all fields
   */
  const handleDeselectAll = () => {
    setSelectedFields([]);
    form.setFieldsValue({ fields: [] });
    onConfigChange?.({
      type: selectedType,
      format: form.getFieldValue('format'),
      fields: [],
      filters: filterConditions,
    });
  };

  useEffect(() => {
    form.setFieldsValue({
      type: initialConfig.type || EXPORT_TYPES.TASK,
      format: initialConfig.format || EXPORT_FORMATS.CSV,
      fields: initialConfig.fields || [],
    });
  }, [initialConfig, form]);

  return (
    <div className="export-config">
      <Form form={form} layout="vertical">
        {/* Data Type Selection */}
        <Card className="config-section" size="small">
          <Title level={5} className="section-title">
            <SettingOutlined /> 数据类型
          </Title>
          <Form.Item name="type" label="选择要导出的数据类型">
            <Select
              value={selectedType}
              onChange={handleTypeChange}
              style={{ width: '100%' }}
              size="large"
            >
              <Option value={EXPORT_TYPES.AGENT}>Agent 数据</Option>
              <Option value={EXPORT_TYPES.TASK}>任务数据</Option>
              <Option value={EXPORT_TYPES.LOG}>日志数据</Option>
              <Option value={EXPORT_TYPES.CONFIG}>配置数据</Option>
            </Select>
          </Form.Item>
        </Card>

        {/* Export Format Selection */}
        <Card className="config-section" size="small" style={{ marginTop: 16 }}>
          <Title level={5} className="section-title">
            <SettingOutlined /> 导出格式
          </Title>
          <Form.Item name="format" label="选择导出文件格式">
            <Select
              value={form.getFieldValue('format') || EXPORT_FORMATS.CSV}
              onChange={handleFormatChange}
              style={{ width: '100%' }}
              size="large"
            >
              <Option value={EXPORT_FORMATS.CSV}>CSV - 逗号分隔值</Option>
              <Option value={EXPORT_FORMATS.JSON}>JSON - JavaScript 对象</Option>
              <Option value={EXPORT_FORMATS.XLSX}>XLSX - Excel 表格</Option>
            </Select>
          </Form.Item>
        </Card>

        {/* Field Configuration */}
        <Card className="config-section" size="small" style={{ marginTop: 16 }}>
          <div className="section-header">
            <Title level={5} className="section-title">
              <SettingOutlined /> 字段配置
            </Title>
            <Space size="small">
              <Button size="small" onClick={handleSelectAll}>
                全选
              </Button>
              <Button size="small" onClick={handleDeselectAll}>
                取消全选
              </Button>
            </Space>
          </div>
          
          <Text type="secondary" style={{ fontSize: 12 }}>
            选择要导出的字段（已选择 {selectedFields.length} 个）
          </Text>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <Form.Item name="fields">
            <Checkbox.Group
              value={selectedFields}
              onChange={handleFieldChange}
              style={{ width: '100%' }}
            >
              <Row gutter={[16, 16]}>
                {AVAILABLE_FIELDS[selectedType].map((field) => (
                  <Col span={12} key={field.key}>
                    <Checkbox value={field.key}>{field.label}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Card>

        {/* Filter Conditions */}
        <Card className="config-section" size="small" style={{ marginTop: 16 }}>
          <Title level={5} className="section-title">
            <FilterOutlined /> 数据过滤
          </Title>
          
          <Row gutter={[16, 16]}>
            {selectedType === EXPORT_TYPES.TASK && (
              <>
                <Col span={12}>
                  <Form.Item label="状态筛选">
                    <Select
                      placeholder="选择状态"
                      onChange={(value) => handleFilterChange('status', value)}
                      allowClear
                    >
                      <Option value="running">运行中</Option>
                      <Option value="done">已完成</Option>
                      <Option value="failed">失败</Option>
                      <Option value="pending">待处理</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="时间范围">
                    <Select
                      placeholder="选择时间范围"
                      onChange={(value) => handleFilterChange('timeRange', value)}
                      allowClear
                    >
                      <Option value="today">今天</Option>
                      <Option value="week">本周</Option>
                      <Option value="month">本月</Option>
                      <Option value="quarter">本季度</Option>
                      <Option value="year">今年</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </>
            )}

            {selectedType === EXPORT_TYPES.AGENT && (
              <>
                <Col span={12}>
                  <Form.Item label="状态筛选">
                    <Select
                      placeholder="选择状态"
                      onChange={(value) => handleFilterChange('status', value)}
                      allowClear
                    >
                      <Option value="active">活跃</Option>
                      <Option value="idle">空闲</Option>
                      <Option value="offline">离线</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="类型筛选">
                    <Select
                      placeholder="选择类型"
                      onChange={(value) => handleFilterChange('type', value)}
                      allowClear
                    >
                      <Option value="data-processing">数据处理</Option>
                      <Option value="code-review">代码审查</Option>
                      <Option value="support">客户支持</Option>
                      <Option value="analytics">分析</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </>
            )}

            {selectedType === EXPORT_TYPES.LOG && (
              <>
                <Col span={12}>
                  <Form.Item label="日志级别">
                    <Select
                      placeholder="选择级别"
                      onChange={(value) => handleFilterChange('level', value)}
                      allowClear
                    >
                      <Option value="error">错误</Option>
                      <Option value="warn">警告</Option>
                      <Option value="info">信息</Option>
                      <Option value="debug">调试</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="时间范围">
                    <Select
                      placeholder="选择时间范围"
                      onChange={(value) => handleFilterChange('timeRange', value)}
                      allowClear
                    >
                      <Option value="today">今天</Option>
                      <Option value="week">本周</Option>
                      <Option value="month">本月</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </>
            )}

            {selectedType === EXPORT_TYPES.CONFIG && (
              <Col span={24}>
                <Form.Item label="配置类型">
                  <Select
                    placeholder="选择配置类型"
                    onChange={(value) => handleFilterChange('type', value)}
                    allowClear
                  >
                    <Option value="system">系统配置</Option>
                    <Option value="agent">Agent 配置</Option>
                    <Option value="user">用户配置</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>
        </Card>
      </Form>
    </div>
  );
};

export default ExportConfig;
