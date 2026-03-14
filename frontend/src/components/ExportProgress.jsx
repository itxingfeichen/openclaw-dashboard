import React, { useEffect, useState } from 'react';
import { Progress, Card, Typography, Row, Col, Statistic, Button, Tag, Spin, Alert } from 'antd';
import {
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { getExportProgress, cancelExport, downloadExport } from '../services/exportService';

const { Title, Text } = Typography;

/**
 * ExportProgress Component
 * Displays export job progress with real-time updates
 */
const ExportProgress = ({ jobId, onComplete, onCancel }) => {
  const [progress, setProgress] = useState({
    status: 'pending', // pending, processing, completed, failed, cancelled
    percentage: 0,
    totalRecords: 0,
    processedRecords: 0,
    currentStep: '',
    estimatedTime: 0,
    startTime: null,
    endTime: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load progress data
   */
  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await getExportProgress(jobId);
      setProgress(data);
      setError(null);

      // Check if export is complete
      if (data.status === 'completed') {
        onComplete?.(data);
      } else if (data.status === 'failed' || data.status === 'cancelled') {
        onCancel?.(data);
      }
    } catch (err) {
      console.error('Failed to load progress:', err);
      setError('加载进度失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle cancel export
   */
  const handleCancel = async () => {
    try {
      await cancelExport(jobId);
      setProgress(prev => ({ ...prev, status: 'cancelled' }));
      onCancel?.({ status: 'cancelled' });
    } catch (err) {
      console.error('Failed to cancel export:', err);
      setError('取消导出失败');
    }
  };

  /**
   * Handle download
   */
  const handleDownload = async () => {
    try {
      await downloadExport(jobId, `export-${jobId}.csv`);
    } catch (err) {
      console.error('Download failed:', err);
      setError('下载失败');
    }
  };

  // Poll for progress updates
  useEffect(() => {
    loadProgress();

    // Poll every 2 seconds if still processing
    if (progress.status === 'pending' || progress.status === 'processing') {
      const interval = setInterval(loadProgress, 2000);
      return () => clearInterval(interval);
    }
  }, [jobId, progress.status]);

  /**
   * Get status icon
   */
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />;
      case 'cancelled':
        return <CloseCircleOutlined style={{ color: '#faad14', fontSize: 24 }} />;
      case 'processing':
        return <ClockCircleOutlined style={{ color: '#1890ff', fontSize: 24, spin: true }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#8c8c8c', fontSize: 24 }} />;
    }
  };

  /**
   * Get status text
   */
  const getStatusText = () => {
    switch (progress.status) {
      case 'completed':
        return '导出完成';
      case 'failed':
        return '导出失败';
      case 'cancelled':
        return '已取消';
      case 'processing':
        return '正在导出...';
      case 'pending':
        return '等待开始';
      default:
        return '未知状态';
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return '#52c41a';
      case 'failed':
        return '#ff4d4f';
      case 'cancelled':
        return '#faad14';
      case 'processing':
        return '#1890ff';
      default:
        return '#8c8c8c';
    }
  };

  /**
   * Format time
   */
  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}分${secs}秒`;
  };

  if (loading && !progress.status) {
    return (
      <Card className="export-progress-card">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" tip="加载进度..." />
        </div>
      </Card>
    );
  }

  return (
    <Card className="export-progress-card">
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          onClose={() => setError(null)}
        />
      )}

      {/* Status Header */}
      <div className="progress-header" style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>{getStatusIcon()}</div>
        <Title level={4} style={{ margin: 0, color: getStatusColor() }}>
          {getStatusText()}
        </Title>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 24 }}>
        <Progress
          percent={progress.percentage}
          status={
            progress.status === 'failed'
              ? 'exception'
              : progress.status === 'completed'
              ? 'success'
              : 'active'
          }
          strokeColor={getStatusColor()}
          format={(percent) => `${percent}%`}
        />
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic
            title="总记录数"
            value={progress.totalRecords}
            prefix={<DownloadOutlined />}
            valueStyle={{ fontSize: 18 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="已处理"
            value={progress.processedRecords}
            valueStyle={{ fontSize: 18, color: '#1890ff' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="剩余时间"
            value={formatTime(progress.estimatedTime || 0)}
            valueStyle={{ fontSize: 18 }}
          />
        </Col>
      </Row>

      {/* Current Step */}
      {progress.currentStep && (
        <div className="current-step" style={{ marginBottom: 16 }}>
          <Text type="secondary">当前步骤：</Text>
          <Tag color="blue">{progress.currentStep}</Tag>
        </div>
      )}

      {/* Time Information */}
      <div className="time-info" style={{ fontSize: 12, color: '#8c8c8c' }}>
        {progress.startTime && (
          <div>
            <Text type="secondary">开始时间：</Text>
            <Text>{new Date(progress.startTime).toLocaleString()}</Text>
          </div>
        )}
        {progress.endTime && (
          <div>
            <Text type="secondary">完成时间：</Text>
            <Text>{new Date(progress.endTime).toLocaleString()}</Text>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons" style={{ marginTop: 24, textAlign: 'center' }}>
        {progress.status === 'completed' && (
          <Button
            type="primary"
            size="large"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            block
          >
            下载导出文件
          </Button>
        )}

        {(progress.status === 'pending' || progress.status === 'processing') && (
          <Button
            danger
            size="large"
            icon={<PauseCircleOutlined />}
            onClick={handleCancel}
            block
          >
            取消导出
          </Button>
        )}

        {(progress.status === 'failed' || progress.status === 'cancelled') && (
          <Button
            size="large"
            icon={<ReloadOutlined />}
            onClick={loadProgress}
            block
          >
            刷新状态
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ExportProgress;
