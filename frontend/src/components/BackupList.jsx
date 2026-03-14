import React, { useState } from 'react';
import { Table, Tag, Space, Button, Progress, Popconfirm, Typography, Tooltip } from 'antd';
import {
  DownloadOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import RestoreDialog from './RestoreDialog';
import { deleteBackup, restoreBackup } from '../services/backupService';
import { message } from 'antd';

const { Text } = Typography;

/**
 * 备份列表组件
 * @param {Object} props
 * @param {Array} props.data - 备份数据列表
 * @param {boolean} props.loading - 加载状态
 * @param {Object} props.pagination - 分页配置
 * @param {Function} props.onChange - 表格变化回调
 * @param {Function} props.onRefresh - 刷新回调
 * @param {Function} props.onRestore - 恢复回调
 */
const BackupList = ({
  data = [],
  loading = false,
  pagination,
  onChange,
  onRefresh,
  onRestore,
}) => {
  const [restoreDialogVisible, setRestoreDialogVisible] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [restoring, setRestoring] = useState(false);

  /**
   * 格式化时间
   */
  const formatTime = (dateString) => {
    if (!dateString) return '未知';
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * 格式化大小
   */
  const formatSize = (size) => {
    if (size === undefined || size === null) return '-';
    return `${size} MB`;
  };

  /**
   * 获取状态标签
   */
  const getStatusTag = (status, progress) => {
    const statusConfig = {
      completed: { color: 'success', icon: <CheckCircleOutlined />, text: '完成' },
      in_progress: { color: 'processing', icon: <SyncOutlined spin />, text: '进行中' },
      failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
      pending: { color: 'warning', icon: <ClockCircleOutlined />, text: '等待中' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    if (status === 'in_progress' && progress !== undefined) {
      return (
        <Tooltip title={`${progress}%`}>
          <Tag icon={config.icon} color={config.color}>
            {progress}%
          </Tag>
        </Tooltip>
      );
    }

    return <Tag icon={config.icon} color={config.color}>{config.text}</Tag>;
  };

  /**
   * 获取类型标签
   */
  const getTypeTag = (type) => {
    const typeConfig = {
      manual: { color: 'blue', text: '手动' },
      scheduled: { color: 'green', text: '自动' },
    };

    const config = typeConfig[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  /**
   * 处理恢复操作
   */
  const handleRestore = (record) => {
    setSelectedBackup(record);
    setRestoreDialogVisible(true);
  };

  /**
   * 确认恢复
   */
  const handleConfirmRestore = async () => {
    setRestoring(true);
    try {
      const result = await restoreBackup(selectedBackup.id);
      if (result.success) {
        message.success('备份恢复成功');
        if (onRestore) onRestore(selectedBackup.id);
        if (onRefresh) onRefresh();
      }
      setRestoreDialogVisible(false);
    } catch (error) {
      message.error(`恢复失败：${error.message}`);
    } finally {
      setRestoring(false);
    }
  };

  /**
   * 处理删除操作
   */
  const handleDelete = async (backupId) => {
    try {
      const result = await deleteBackup(backupId);
      if (result.success) {
        message.success('备份删除成功');
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      message.error(`删除失败：${error.message}`);
    }
  };

  const columns = [
    {
      title: '备份 ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (text) => (
        <Text copyable={{ text }} style={{ fontFamily: 'monospace' }} ellipsis>
          {text}
        </Text>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (text) => <Text>{formatTime(text)}</Text>,
    },
    {
      title: '备份大小',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      sorter: (a, b) => (a.size || 0) - (b.size || 0),
      render: (text) => <Text>{formatSize(text)}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (text) => getTypeTag(text),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (text, record) => getStatusTag(text, record.progress),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <Text type="secondary" ellipsis>
          {text || '-'}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="恢复">
            <Button
              type="link"
              icon={<DownloadOutlined />}
              onClick={() => handleRestore(record)}
              disabled={record.status !== 'completed'}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="删除备份"
            description="确定要删除此备份吗？此操作不可恢复。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        onChange={onChange}
        rowKey="id"
        size="middle"
      />
      <RestoreDialog
        visible={restoreDialogVisible}
        backup={selectedBackup}
        onCancel={() => {
          setRestoreDialogVisible(false);
          setSelectedBackup(null);
        }}
        onConfirm={handleConfirmRestore}
        loading={restoring}
      />
    </>
  );
};

export default BackupList;
