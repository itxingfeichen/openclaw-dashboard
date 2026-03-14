import React from 'react';
import { Timeline, Tag, Typography, Space, Button, Tooltip } from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  EyeOutlined,
  RollbackOutlined,
  DiffOutlined,
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

/**
 * VersionList Component
 * Displays configuration version history as a timeline
 */
const VersionList = ({
  versions,
  loading,
  selectedVersion,
  onSelectVersion,
  onViewDetails,
  onCompare,
  onRollback,
  rollbackInProgress,
}) => {
  /**
   * Get status tag color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'current':
        return 'green';
      case 'stable':
        return 'blue';
      case 'deprecated':
        return 'default';
      case 'broken':
        return 'red';
      default:
        return 'default';
    }
  };

  /**
   * Get status label
   */
  const getStatusLabel = (status) => {
    switch (status) {
      case 'current':
        return '当前版本';
      case 'stable':
        return '稳定';
      case 'deprecated':
        return '已弃用';
      case 'broken':
        return '已损坏';
      default:
        return status;
    }
  };

  /**
   * Format timestamp
   */
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Render version item
   */
  const renderVersionItem = (version) => {
    const isSelected = selectedVersion?.versionId === version.versionId;
    const isCurrent = version.status === 'current';
    const isRollingBack = rollbackInProgress === version.versionId;

    const color = isSelected ? '#1890ff' : undefined;

    return (
      <Timeline.Item
        key={version.versionId}
        color={isCurrent ? 'green' : 'blue'}
        dot={
          isCurrent ? (
            <ClockCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
          ) : (
            <ClockCircleOutlined style={{ fontSize: '16px' }} />
          )
        }
      >
        <div
          style={{
            padding: '12px',
            backgroundColor: isSelected ? '#f0f7ff' : 'transparent',
            borderRadius: '8px',
            border: isSelected ? '1px solid #1890ff' : '1px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onClick={() => onSelectVersion(version)}
        >
          {/* Version header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Space>
              <Text strong style={{ fontSize: '16px', color }}>
                {version.versionId}
              </Text>
              <Tag color={getStatusColor(version.status)}>
                {getStatusLabel(version.status)}
              </Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <ClockCircleOutlined /> {formatTime(version.timestamp)}
            </Text>
          </div>

          {/* Description */}
          <Paragraph
            ellipsis={{ rows: 2 }}
            style={{ marginBottom: '8px', color: '#666' }}
          >
            <FileTextOutlined style={{ marginRight: '4px' }} />
            {version.description || '无描述'}
          </Paragraph>

          {/* Author */}
          <div style={{ marginBottom: '8px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <UserOutlined /> {version.author || '未知'}
            </Text>
          </div>

          {/* Changes summary */}
          {version.changes && version.changes.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                共 {version.changes.length} 处变更
              </Text>
            </div>
          )}

          {/* Action buttons */}
          <Space size="small" onClick={(e) => e.stopPropagation()}>
            <Tooltip title="查看详情">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onViewDetails(version)}
              >
                详情
              </Button>
            </Tooltip>

            {!isCurrent && (
              <>
                <Tooltip title="版本对比">
                  <Button
                    type="text"
                    size="small"
                    icon={<DiffOutlined />}
                    onClick={() => onCompare(version)}
                    disabled={!selectedVersion || selectedVersion.versionId === version.versionId}
                  >
                    对比
                  </Button>
                </Tooltip>

                <Tooltip title="回滚到此版本">
                  <Button
                    type="link"
                    size="small"
                    icon={<RollbackOutlined />}
                    danger
                    loading={isRollingBack}
                    onClick={() => onRollback(version)}
                  >
                    回滚
                  </Button>
                </Tooltip>
              </>
            )}
          </Space>
        </div>
      </Timeline.Item>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Text type="secondary">加载版本历史...</Text>
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Text type="secondary">暂无版本历史</Text>
      </div>
    );
  }

  return (
    <Timeline style={{ padding: '16px' }}>
      {versions.map(renderVersionItem)}
    </Timeline>
  );
};

export default VersionList;
