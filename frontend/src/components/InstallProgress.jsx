import React, { useState, useEffect } from 'react';
import { Progress, Steps, Timeline, Card, Space, Typography, Tag, Alert, Spin } from 'antd';
import { 
  DownloadOutlined, 
  CheckCircleOutlined, 
  LoadingOutlined,
  WarningOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  SyncOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

/**
 * InstallProgress Component
 * Displays installation/update progress with detailed steps
 * 
 * @param {Object} props
 * @param {string} props.skillName - Name of the skill being installed
 * @param {string} props.skillDisplayName - Display name of the skill
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {string} props.status - Status: 'pending' | 'downloading' | 'verifying' | 'installing' | 'completed' | 'error'
 * @param {string} props.currentStep - Current step description
 * @param {Array} props.logs - Installation log messages
 * @param {Object} props.error - Error object if installation failed
 * @param {Function} props.onCancel - Callback to cancel installation
 */
const InstallProgress = ({
  skillName = '',
  skillDisplayName = '',
  progress = 0,
  status = 'pending',
  currentStep = '准备中...',
  logs = [],
  error = null,
  onCancel,
}) => {
  // Map status to step index
  const getCurrentStepIndex = () => {
    switch (status) {
      case 'pending':
        return 0;
      case 'downloading':
        return 1;
      case 'verifying':
        return 2;
      case 'installing':
        return 3;
      case 'completed':
        return 4;
      case 'error':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex();

  // Steps definition
  const steps = [
    {
      title: '准备',
      description: '初始化安装环境',
      icon: <FileTextOutlined />,
    },
    {
      title: '下载',
      description: '从源服务器下载技能包',
      icon: <DownloadOutlined />,
    },
    {
      title: '验证',
      description: '校验文件完整性和安全性',
      icon: <SafetyCertificateOutlined />,
    },
    {
      title: '安装',
      description: '解压并安装技能文件',
      icon: <SyncOutlined />,
    },
    {
      title: '完成',
      description: '安装成功',
      icon: <CheckCircleOutlined />,
    },
  ];

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#52c41a';
      case 'error':
        return '#ff4d4f';
      case 'pending':
        return '#1890ff';
      default:
        return '#1890ff';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <LoadingOutlined spin />;
      case 'downloading':
      case 'verifying':
      case 'installing':
        return <LoadingOutlined spin />;
      case 'completed':
        return <CheckCircleOutlined />;
      case 'error':
        return <WarningOutlined />;
      default:
        return <LoadingOutlined spin />;
    }
  };

  // Format log timestamp
  const formatLogTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get log color based on message type
  const getLogColor = (message) => {
    const msgLower = message.toLowerCase();
    if (msgLower.includes('error') || msgLower.includes('fail')) return '#ff4d4f';
    if (msgLower.includes('warning') || msgLower.includes('warn')) return '#faad14';
    if (msgLower.includes('success') || msgLower.includes('complete')) return '#52c41a';
    if (msgLower.includes('download') || msgLower.includes('fetch')) return '#1890ff';
    return '#8c8c8c';
  };

  return (
    <Card
      title={
        <Space>
          {getStatusIcon()}
          <Text strong>
            {status === 'completed' ? '安装完成' : status === 'error' ? '安装失败' : '安装进度'}
          </Text>
        </Space>
      }
      bordered={false}
    >
      {/* Skill Information */}
      <div style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="small">
          <Title level={5} style={{ margin: 0 }}>
            {skillDisplayName || skillName}
          </Title>
          {skillName && skillDisplayName && skillName !== skillDisplayName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {skillName}
            </Text>
          )}
        </Space>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 24 }}>
        <Progress
          percent={progress}
          status={status === 'error' ? 'exception' : status === 'completed' ? 'success' : 'active'}
          strokeColor={getStatusColor()}
          format={(percent) => `${percent}%`}
        />
        {status !== 'completed' && status !== 'error' && (
          <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
            {currentStep}
          </Text>
        )}
      </div>

      {/* Steps */}
      <Steps
        current={currentStepIndex}
        status={status === 'error' ? 'error' : status === 'completed' ? 'finish' : 'process'}
        items={steps.map((step) => ({
          key: step.title,
          title: step.title,
          description: step.description,
          icon: step.icon,
        }))}
        size="small"
        style={{ marginBottom: 24 }}
      />

      {/* Error Message */}
      {error && (
        <Alert
          message="安装失败"
          description={error.message || '未知错误，请稍后重试'}
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
          action={
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                错误代码：{error.code || 'UNKNOWN'}
              </Text>
            </Space>
          }
        />
      )}

      {/* Installation Logs */}
      {logs.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Space style={{ marginBottom: 8 }}>
            <FileTextOutlined />
            <Text strong>安装日志</Text>
          </Space>
          <Card
            size="small"
            style={{ 
              maxHeight: 300, 
              overflowY: 'auto', 
              backgroundColor: '#fafafa',
              fontSize: 12,
            }}
          >
            <Timeline
              items={logs.map((log, index) => ({
                key: index,
                color: getLogColor(log.message),
                children: (
                  <div>
                    <Space>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {formatLogTime(log.timestamp)}
                      </Text>
                      <Text style={{ color: getLogColor(log.message) }}>
                        {log.message}
                      </Text>
                    </Space>
                  </div>
                ),
              }))}
            />
          </Card>
        </div>
      )}

      {/* Cancel Button */}
      {status !== 'completed' && status !== 'error' && onCancel && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Space>
            <Spin size="small" />
            <Text type="secondary">正在安装，请稍候...</Text>
          </Space>
        </div>
      )}
    </Card>
  );
};

export default InstallProgress;
