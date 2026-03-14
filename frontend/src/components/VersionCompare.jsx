import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Tag,
  Typography,
  Space,
  Select,
  Button,
  Spin,
  Alert,
  Empty,
} from 'antd';
import {
  DiffOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { compareVersions } from '../services/configService';

const { Text, Paragraph, Title } = Typography;
const { Option } = Select;

/**
 * VersionCompare Component
 * Displays diff view between two configuration versions
 */
const VersionCompare = ({
  visible,
  versions,
  selectedVersion,
  onClose,
  onVersionsChange,
}) => {
  const [compareFrom, setCompareFrom] = useState(null);
  const [compareTo, setCompareTo] = useState(null);
  const [diffResult, setDiffResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // When modal opens or selected version changes
  useEffect(() => {
    if (visible && selectedVersion && versions?.length > 0) {
      // Set selected version as "to" version
      setCompareTo(selectedVersion.versionId);
      
      // Find the previous version as "from" version
      const currentIndex = versions.findIndex(v => v.versionId === selectedVersion.versionId);
      if (currentIndex >= 0 && currentIndex < versions.length - 1) {
        setCompareFrom(versions[currentIndex + 1].versionId);
      } else if (versions.length > 0) {
        setCompareFrom(versions[0].versionId);
      }
    }
  }, [visible, selectedVersion, versions]);

  // Perform comparison when versions are selected
  useEffect(() => {
    if (visible && compareFrom && compareTo && compareFrom !== compareTo) {
      performComparison();
    }
  }, [compareFrom, compareTo, visible]);

  /**
   * Perform version comparison
   */
  const performComparison = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await compareVersions(compareFrom, compareTo);
      setDiffResult(result);
    } catch (err) {
      setError(err.message);
      setDiffResult(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get change type tag
   */
  const getChangeTypeTag = (type) => {
    switch (type) {
      case 'add':
        return <Tag color="green">新增</Tag>;
      case 'modify':
        return <Tag color="blue">修改</Tag>;
      case 'remove':
        return <Tag color="red">删除</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  /**
   * Render diff table columns
   */
  const diffColumns = [
    {
      title: '变更类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => getChangeTypeTag(type),
    },
    {
      title: '配置路径',
      dataIndex: 'path',
      key: 'path',
      width: 250,
      render: (path) => (
        <Text code style={{ fontSize: '12px' }}>
          {path}
        </Text>
      ),
    },
    {
      title: '旧值',
      dataIndex: 'oldValue',
      key: 'oldValue',
      render: (value) => renderValue(value),
    },
    {
      title: '新值',
      dataIndex: 'newValue',
      key: 'newValue',
      render: (value) => renderValue(value),
    },
  ];

  /**
   * Render value with proper formatting
   */
  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return <Text type="secondary">-</Text>;
    }
    
    if (typeof value === 'object') {
      return (
        <Text code style={{ fontSize: '11px' }}>
          {JSON.stringify(value)}
        </Text>
      );
    }
    
    if (Array.isArray(value)) {
      return (
        <Space size="small" wrap>
          {value.map((item, idx) => (
            <Tag key={idx} color="blue">{String(item)}</Tag>
          ))}
        </Space>
      );
    }
    
    return <Text>{String(value)}</Text>;
  };

  /**
   * Handle version selection change
   */
  const handleFromChange = (value) => {
    setCompareFrom(value);
  };

  /**
   * Handle version selection change
   */
  const handleToChange = (value) => {
    setCompareTo(value);
  };

  /**
   * Get version options for select
   */
  const versionOptions = versions?.map(v => (
    <Option key={v.versionId} value={v.versionId}>
      {v.versionId} - {v.description?.substring(0, 30) || '无描述'}
    </Option>
  )) || [];

  return (
    <Modal
      title={
        <Space>
          <DiffOutlined />
          <span>版本对比</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
      width={900}
      destroyOnClose
    >
      {/* Version selectors */}
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <Text strong>从版本</Text>
            <Select
              value={compareFrom}
              onChange={handleFromChange}
              style={{ width: 250, marginTop: '8px' }}
              disabled={loading}
            >
              {versionOptions}
            </Select>
          </div>

          <Space>
            <LeftOutlined />
            <RightOutlined />
          </Space>

          <div style={{ textAlign: 'center' }}>
            <Text strong>到版本</Text>
            <Select
              value={compareTo}
              onChange={handleToChange}
              style={{ width: 250, marginTop: '8px' }}
              disabled={loading}
            >
              {versionOptions}
            </Select>
          </div>
        </Space>
      </div>

      {/* Comparison result */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" tip="正在对比版本..." />
        </div>
      ) : error ? (
        <Alert
          message="对比失败"
          description={error}
          type="error"
          showIcon
        />
      ) : diffResult ? (
        <div>
          {/* Version info summary */}
          <div style={{ marginBottom: '16px' }}>
            <Space size="large">
              <div>
                <Text type="secondary">从版本：</Text>
                <Text strong>{compareFrom}</Text>
                <Text type="secondary" style={{ marginLeft: '8px' }}>
                  {diffResult.from?.timestamp && new Date(diffResult.from.timestamp).toLocaleString('zh-CN')}
                </Text>
              </div>
              <div>
                <Text type="secondary">到版本：</Text>
                <Text strong>{compareTo}</Text>
                <Text type="secondary" style={{ marginLeft: '8px' }}>
                  {diffResult.to?.timestamp && new Date(diffResult.to.timestamp).toLocaleString('zh-CN')}
                </Text>
              </div>
            </Space>
          </div>

          {/* Diff table */}
          {diffResult.diff && diffResult.diff.length > 0 ? (
            <Table
              columns={diffColumns}
              dataSource={diffResult.diff}
              rowKey="path"
              pagination={false}
              size="middle"
              scroll={{ y: 400 }}
              locale={{
                emptyText: '无变更',
              }}
            />
          ) : (
            <Empty description="两个版本之间没有差异" />
          )}

          {/* Summary statistics */}
          {diffResult.diff && diffResult.diff.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
              <Space size="large">
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text>
                    新增：{diffResult.diff.filter(d => d.type === 'add').length}
                  </Text>
                </Space>
                <Space>
                  <MinusCircleOutlined style={{ color: '#1890ff' }} />
                  <Text>
                    修改：{diffResult.diff.filter(d => d.type === 'modify').length}
                  </Text>
                </Space>
                <Space>
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  <Text>
                    删除：{diffResult.diff.filter(d => d.type === 'remove').length}
                  </Text>
                </Space>
              </Space>
            </div>
          )}
        </div>
      ) : (
        <Empty description="请选择要对比的版本" />
      )}
    </Modal>
  );
};

export default VersionCompare;
