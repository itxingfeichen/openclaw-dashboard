import React from 'react';
import { Card, Descriptions, Tag, Space, Typography, Divider, Progress, Alert, Spin, Empty } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, DashboardOutlined } from '@ant-design/icons';
import { getTaskStatusColor, getTaskStatusLabel, formatRuntime, formatDate } from '../services/taskService';

const { Title, Text, Paragraph } = Typography;

/**
 * TaskDetail Component
 * Displays detailed information about a single task
 */
const TaskDetail = ({ task, loading }) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载中...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <Empty description="任务不存在或已被删除" />
    );
  }

  /**
   * Get subtask status icon
   */
  const getSubtaskIcon = (status) => {
    switch (status) {
      case 'done':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'running':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return <DashboardOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  /**
   * Calculate subtask progress
   */
  const calculateProgress = () => {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const doneCount = task.subtasks.filter(s => s.status === 'done').length;
    return Math.round((doneCount / task.subtasks.length) * 100);
  };

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* Basic Information */}
      <Card title="基本信息" bordered={false} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
          <Descriptions.Item label="任务 ID">
            <Text copyable style={{ fontFamily: 'monospace' }}>{task.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Agent">
            <Text strong>{task.agentName}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getTaskStatusColor(task.status)}>
              {getTaskStatusLabel(task.status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="类型">
            <Tag>{task.type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {formatDate(task.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="运行时长">
            {formatRuntime(task.runtime)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Task Content */}
      <Card title="任务内容" bordered={false} style={{ marginBottom: 16 }}>
        <Paragraph style={{ fontSize: '14px', lineHeight: '1.8' }}>
          {task.content}
        </Paragraph>
        
        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary" style={{ marginRight: 8 }}>标签:</Text>
            <Space size={4}>
              {task.labels.map((label, index) => (
                <Tag key={index} color="default">
                  {label}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* Error Message */}
        {task.error && (
          <Alert
            message="错误信息"
            description={task.error}
            type="error"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {/* Statistics */}
      <Card title="统计数据" bordered={false} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 4 }} bordered>
          <Descriptions.Item label="输入 Tokens">
            <Text code>{task.tokens?.input || 0}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="输出 Tokens">
            <Text code>{task.tokens?.output || 0}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="总计 Tokens">
            <Text code strong>{task.tokens?.total || 0}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="运行时长">
            <Text code>{formatRuntime(task.runtime)}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Timeline */}
      <Card title="时间线" bordered={false} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 3 }} bordered>
          <Descriptions.Item label="创建时间">
            <Space>
              <ClockCircleOutlined />
              {formatDate(task.createdAt)}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="开始时间">
            <Space>
              <ClockCircleOutlined />
              {task.startedAt ? formatDate(task.startedAt) : '-'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="完成时间">
            <Space>
              <ClockCircleOutlined />
              {task.completedAt ? formatDate(task.completedAt) : '-'}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <Card title="子任务" bordered={false}>
          <div style={{ marginBottom: 16 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary">进度</Text>
              <Text strong>{calculateProgress()}%</Text>
            </Space>
            <Progress 
              percent={calculateProgress()} 
              strokeColor={getTaskStatusColor(task.status)}
              style={{ marginTop: 8 }}
            />
          </div>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {task.subtasks.map((subtask) => (
              <Card 
                key={subtask.id} 
                size="small" 
                bordered
                style={{ 
                  borderLeft: `4px solid ${getTaskStatusColor(subtask.status)}`,
                }}
              >
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    {getSubtaskIcon(subtask.status)}
                    <Text strong>{subtask.name}</Text>
                  </Space>
                  <Tag color={getTaskStatusColor(subtask.status)}>
                    {getTaskStatusLabel(subtask.status)}
                  </Tag>
                </Space>
              </Card>
            ))}
          </Space>
        </Card>
      )}
    </div>
  );
};

export default TaskDetail;
