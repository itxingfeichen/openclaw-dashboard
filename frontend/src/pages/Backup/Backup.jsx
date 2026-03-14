import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Typography, Card, Row, Col, Button, Space, Progress, Statistic, message, Tabs } from 'antd';
import {
  PlusOutlined,
  BackupOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import BackupList from '../../components/BackupList';
import BackupSchedule from '../../components/BackupSchedule';
import { fetchBackups, createBackup, fetchBackupProgress } from '../../services/backupService';
import './Backup.css';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * 备份管理页面
 */
const BackupPage = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [backupProgress, setBackupProgress] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    totalSize: 0,
  });
  const [activeTab, setActiveTab] = useState('list');

  /**
   * 加载备份列表
   */
  const loadBackups = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...params,
      };

      const result = await fetchBackups(queryParams);

      setBackups(result.data || []);
      setPagination((prev) => ({
        ...prev,
        total: result.total || 0,
        current: result.page || 1,
      }));

      // 计算统计数据
      calculateStats(result.data || []);
    } catch (error) {
      console.error('Failed to load backups:', error);
      message.error('加载备份列表失败，请稍后重试');
      setBackups([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  /**
   * 计算统计数据
   */
  const calculateStats = (backupData) => {
    const total = backupData.length;
    const completed = backupData.filter((b) => b.status === 'completed').length;
    const inProgress = backupData.filter((b) => b.status === 'in_progress').length;
    const totalSize = backupData.reduce((sum, b) => sum + (b.size || 0), 0);

    setStats({
      total,
      completed,
      inProgress,
      totalSize,
    });

    // 如果有进行中的备份，监控其进度
    const inProgressBackup = backupData.find((b) => b.status === 'in_progress');
    if (inProgressBackup) {
      monitorBackupProgress(inProgressBackup.id);
    } else {
      setBackupProgress(null);
    }
  };

  /**
   * 监控备份进度
   */
  const monitorBackupProgress = async (backupId) => {
    try {
      const progress = await fetchBackupProgress(backupId);
      setBackupProgress(progress);

      if (progress.status !== 'in_progress') {
        // 备份完成，刷新列表
        loadBackups();
        message.success('备份创建成功');
      } else {
        // 继续监控
        setTimeout(() => monitorBackupProgress(backupId), 2000);
      }
    } catch (error) {
      console.error('Failed to monitor backup progress:', error);
    }
  };

  /**
   * 创建手动备份
   */
  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const result = await createBackup({
        type: 'manual',
        description: '手动备份',
      });

      if (result.success) {
        message.success('备份创建成功');
        loadBackups();
        // 开始监控进度
        if (result.data?.id) {
          monitorBackupProgress(result.data.id);
        }
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
      message.error('创建备份失败');
    } finally {
      setCreating(false);
    }
  };

  /**
   * 表格分页变化
   */
  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  /**
   * 备份恢复完成
   */
  const handleRestoreComplete = (backupId) => {
    message.success(`备份 ${backupId} 恢复成功`);
    loadBackups();
  };

  /**
   * 备份计划变更
   */
  const handleScheduleChange = (schedule) => {
    console.log('Schedule changed:', schedule);
    // 可以在这里处理计划变更后的逻辑
  };

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  return (
    <Layout className="backup-page">
      <Content style={{ padding: '24px' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '24px' }}>
          <Space>
            <BackupOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Title level={2} style={{ margin: 0 }}>备份管理</Title>
          </Space>
          <Text type="secondary">管理系统备份、恢复和自动备份计划</Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="备份总数"
                value={stats.total}
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="成功备份"
                value={stats.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="进行中"
                value={stats.inProgress}
                prefix={<SyncOutlined spin />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总大小"
                value={stats.totalSize}
                suffix="MB"
                prefix={<BackupOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 备份进度提示 */}
        {backupProgress && backupProgress.status === 'in_progress' && (
          <Card
            style={{ marginBottom: '24px' }}
            bordered={false}
            bodyStyle={{ padding: '12px 24px' }}
          >
            <Space style={{ width: '100%' }}>
              <SyncOutlined spin />
              <Text>备份进行中：</Text>
              <Progress
                percent={backupProgress.progress}
                style={{ flex: 1, margin: '0 16px' }}
                size="small"
                format={(percent) => `${percent}%`}
              />
              <Text type="secondary">{backupProgress.message || '请稍候...'}</Text>
            </Space>
          </Card>
        )}

        {/* 主内容区域 */}
        <Row gutter={16}>
          {/* 左侧：备份列表 */}
          <Col span={16}>
            <Card
              title={
                <Space>
                  <ClockCircleOutlined />
                  <span>备份列表</span>
                </Space>
              }
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateBackup}
                  loading={creating}
                >
                  创建备份
                </Button>
              }
            >
              <BackupList
                data={backups}
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
                onRefresh={loadBackups}
                onRestore={handleRestoreComplete}
              />
            </Card>
          </Col>

          {/* 右侧：备份计划配置 */}
          <Col span={8}>
            <BackupSchedule onScheduleChange={handleScheduleChange} />
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default BackupPage;
