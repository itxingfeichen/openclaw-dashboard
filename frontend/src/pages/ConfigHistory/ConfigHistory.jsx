import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Modal,
  Progress,
  Alert,
  Tabs,
  Badge,
  Spin,
  Empty,
} from 'antd';
import {
  HistoryOutlined,
  ReloadOutlined,
  DiffOutlined,
  RollbackOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import VersionList from '../../components/VersionList';
import VersionCompare from '../../components/VersionCompare';
import {
  fetchVersionHistory,
  fetchVersionDetails,
  rollbackToVersion,
  getCurrentConfig,
} from '../../services/configService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

/**
 * ConfigHistory Page
 * Configuration version history management page
 */
const ConfigHistory = () => {
  // Version history data
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected version
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionDetails, setVersionDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Comparison modal
  const [compareVisible, setCompareVisible] = useState(false);
  const [compareVersion, setCompareVersion] = useState(null);

  // Rollback state
  const [rollbackModalVisible, setRollbackModalVisible] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState(null);
  const [rollbackProgress, setRollbackProgress] = useState(0);
  const [rollbackStage, setRollbackStage] = useState('');
  const [rollbackInProgress, setRollbackInProgress] = useState(null);
  const [rollbackError, setRollbackError] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Current config
  const [currentConfig, setCurrentConfig] = useState(null);

  /**
   * Load version history
   */
  const loadVersionHistory = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchVersionHistory({ page, pageSize });
      setVersions(result.data || []);
      setPagination({
        current: result.page || 1,
        pageSize: result.pageSize || 10,
        total: result.total || 0,
      });
    } catch (err) {
      setError(err.message);
      console.error('Failed to load version history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load current configuration
   */
  const loadCurrentConfig = useCallback(async () => {
    try {
      const config = await getCurrentConfig();
      setCurrentConfig(config);
    } catch (err) {
      console.warn('Failed to load current config:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadVersionHistory();
    loadCurrentConfig();
  }, [loadVersionHistory, loadCurrentConfig]);

  /**
   * Handle pagination change
   */
  const handleTableChange = (newPagination) => {
    loadVersionHistory(newPagination.current, newPagination.pageSize);
  };

  /**
   * Select a version
   */
  const handleSelectVersion = (version) => {
    setSelectedVersion(version);
    loadVersionDetails(version.versionId);
  };

  /**
   * Load version details
   */
  const loadVersionDetails = async (versionId) => {
    setDetailsLoading(true);
    try {
      const details = await fetchVersionDetails(versionId);
      setVersionDetails(details);
    } catch (err) {
      console.error('Failed to load version details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  /**
   * View version details
   */
  const handleViewDetails = (version) => {
    loadVersionDetails(version.versionId);
  };

  /**
   * Start comparison
   */
  const handleCompare = (version) => {
    setCompareVersion(version);
    setCompareVisible(true);
  };

  /**
   * Start rollback
   */
  const handleRollback = (version) => {
    setRollbackTarget(version);
    setRollbackModalVisible(true);
    setRollbackProgress(0);
    setRollbackStage('');
    setRollbackError(null);
  };

  /**
   * Confirm rollback
   */
  const confirmRollback = async () => {
    if (!rollbackTarget) return;

    setRollbackInProgress(rollbackTarget.versionId);
    setRollbackError(null);

    try {
      await rollbackToVersion(rollbackTarget.versionId, (progress) => {
        setRollbackProgress(progress.progress);
        setRollbackStage(progress.stage);
        if (progress.error) {
          setRollbackError(progress.error);
        }
      });

      // Success
      Modal.success({
        title: '回滚成功',
        content: `已成功回滚到版本 ${rollbackTarget.versionId}`,
        onOk: () => {
          setRollbackModalVisible(false);
          setRollbackTarget(null);
          loadVersionHistory();
          loadCurrentConfig();
        },
      });
    } catch (err) {
      setRollbackError(err.message);
      Modal.error({
        title: '回滚失败',
        content: err.message,
      });
    } finally {
      setRollbackInProgress(null);
    }
  };

  /**
   * Cancel rollback
   */
  const cancelRollback = () => {
    setRollbackModalVisible(false);
    setRollbackTarget(null);
    setRollbackProgress(0);
    setRollbackStage('');
    setRollbackError(null);
  };

  /**
   * Get rollback stage label
   */
  const getRollbackStageLabel = (stage) => {
    switch (stage) {
      case 'validating':
        return '正在验证版本...';
      case 'applying':
        return '正在应用配置...';
      case 'verifying':
        return '正在验证配置...';
      case 'complete':
        return '完成';
      case 'error':
        return '错误';
      default:
        return '';
    }
  };

  /**
   * Render version details panel
   */
  const renderVersionDetails = () => {
    if (detailsLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin tip="加载详情..." />
        </div>
      );
    }

    if (!versionDetails) {
      return (
        <Empty description="选择一个版本查看详情" />
      );
    }

    return (
      <div style={{ padding: '16px' }}>
        <Title level={4}>{versionDetails.versionId}</Title>
        
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>描述：</Text>
            <Text>{versionDetails.description || '无描述'}</Text>
          </div>

          <div>
            <Text strong>作者：</Text>
            <Text>{versionDetails.author || '未知'}</Text>
          </div>

          <div>
            <Text strong>时间：</Text>
            <Text>
              {versionDetails.timestamp && new Date(versionDetails.timestamp).toLocaleString('zh-CN')}
            </Text>
          </div>

          <div>
            <Text strong>状态：</Text>
            <Badge
              status={
                versionDetails.status === 'current' ? 'success' :
                versionDetails.status === 'stable' ? 'processing' :
                versionDetails.status === 'broken' ? 'error' : 'default'
              }
              text={
                versionDetails.status === 'current' ? '当前版本' :
                versionDetails.status === 'stable' ? '稳定' :
                versionDetails.status === 'broken' ? '已损坏' : versionDetails.status
              }
            />
          </div>

          {versionDetails.changes && versionDetails.changes.length > 0 && (
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>变更详情：</Text>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {versionDetails.changes.map((change, idx) => (
                  <Card key={idx} size="small" style={{ marginBottom: '8px' }}>
                    <Paragraph style={{ marginBottom: '4px' }}>
                      <Text code>{change.path}</Text>
                    </Paragraph>
                    <Space size="small">
                      <Text type="secondary">旧值：</Text>
                      <Text delete>{change.old !== null ? JSON.stringify(change.old) : '无'}</Text>
                      <Text type="secondary">→</Text>
                      <Text strong>{change.new !== null ? JSON.stringify(change.new) : '无'}</Text>
                    </Space>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </Space>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <HistoryOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <Title level={2} style={{ margin: 0 }}>配置版本历史</Title>
        </Space>
        <Text type="secondary" style={{ marginLeft: '32px' }}>
          管理和回滚配置版本
        </Text>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => loadVersionHistory(pagination.current, pagination.pageSize)}
          style={{ float: 'right' }}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      {/* Error alert */}
      {error && (
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
          action={
            <Button size="small" onClick={() => loadVersionHistory()}>
              重试
            </Button>
          }
        />
      )}

      {/* Main content */}
      <Row gutter={16}>
        {/* Version list */}
        <Col xs={24} lg={14}>
          <Card
            title="版本列表"
            extra={
              <Space>
                <Text type="secondary">共 {pagination.total} 个版本</Text>
              </Space>
            }
            style={{ marginBottom: '16px' }}
          >
            <VersionList
              versions={versions}
              loading={loading}
              selectedVersion={selectedVersion}
              onSelectVersion={handleSelectVersion}
              onViewDetails={handleViewDetails}
              onCompare={handleCompare}
              onRollback={handleRollback}
              rollbackInProgress={rollbackInProgress}
            />

            {/* Pagination info */}
            {!loading && versions.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                <Space>
                  <Button
                    size="small"
                    disabled={pagination.current <= 1}
                    onClick={() => handleTableChange({ ...pagination, current: pagination.current - 1 })}
                  >
                    上一页
                  </Button>
                  <Text>
                    第 {pagination.current} 页，共 {Math.ceil(pagination.total / pagination.pageSize)} 页
                  </Text>
                  <Button
                    size="small"
                    disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                    onClick={() => handleTableChange({ ...pagination, current: pagination.current + 1 })}
                  >
                    下一页
                  </Button>
                </Space>
              </div>
            )}
          </Card>
        </Col>

        {/* Version details */}
        <Col xs={24} lg={10}>
          <Card title="版本详情" style={{ marginBottom: '16px' }}>
            {renderVersionDetails()}
          </Card>

          {/* Current config info */}
          {currentConfig && (
            <Card title="当前配置" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>当前版本：</Text>
                  <Tag color="green">{currentConfig.versionId}</Tag>
                </div>
                <div>
                  <Text strong>更新时间：</Text>
                  <Text type="secondary">
                    {currentConfig.updatedAt && new Date(currentConfig.updatedAt).toLocaleString('zh-CN')}
                  </Text>
                </div>
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      {/* Version comparison modal */}
      <VersionCompare
        visible={compareVisible}
        versions={versions}
        selectedVersion={compareVersion}
        onClose={() => {
          setCompareVisible(false);
          setCompareVersion(null);
        }}
      />

      {/* Rollback confirmation modal */}
      <Modal
        title={
          <Space>
            <RollbackOutlined />
            <span>确认回滚</span>
          </Space>
        }
        open={rollbackModalVisible}
        onCancel={rollbackError ? cancelRollback : undefined}
        onOk={confirmRollback}
        confirmLoading={rollbackInProgress !== null}
        okText="确认回滚"
        cancelText="取消"
        okButtonProps={{ 
          danger: true,
          loading: rollbackInProgress !== null && !rollbackError,
        }}
        width={500}
        closable={!rollbackInProgress}
      >
        {rollbackInProgress ? (
          <div style={{ padding: '20px 0' }}>
            <Progress
              percent={rollbackProgress}
              status={rollbackError ? 'exception' : rollbackProgress === 100 ? 'success' : 'active'}
              format={() => getRollbackStageLabel(rollbackStage)}
            />
            {rollbackError && (
              <Alert
                message="回滚失败"
                description={rollbackError}
                type="error"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
          </div>
        ) : (
          <div>
            <Paragraph>
              确定要回滚到版本 <Text strong>{rollbackTarget?.versionId}</Text> 吗？
            </Paragraph>
            <Alert
              message="注意"
              description="回滚操作将覆盖当前配置，请确保已备份重要数据。"
              type="warning"
              showIcon
            />
            {rollbackTarget?.description && (
              <div style={{ marginTop: '16px' }}>
                <Text strong>版本描述：</Text>
                <Paragraph style={{ marginTop: '4px' }}>
                  {rollbackTarget.description}
                </Paragraph>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ConfigHistory;
