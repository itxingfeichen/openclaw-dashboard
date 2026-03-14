import React, { useState } from 'react';
import { Modal, Form, Input, Alert, Space, Typography, Divider } from 'antd';
import { ExclamationCircleOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * 恢复确认对话框组件
 * @param {Object} props
 * @param {boolean} props.visible - 对话框是否可见
 * @param {Object} props.backup - 要恢复的备份信息
 * @param {Function} props.onCancel - 取消回调
 * @param {Function} props.onConfirm - 确认回调
 * @param {boolean} props.loading - 加载状态
 */
const RestoreDialog = ({
  visible,
  backup,
  onCancel,
  onConfirm,
  loading = false,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [form] = Form.useForm();

  const handleConfirm = async () => {
    try {
      await form.validateFields();
      
      if (confirmText !== 'RESTORE') {
        form.setFields([
          {
            name: 'confirmText',
            errors: ['请输入 RESTORE 确认恢复操作'],
          },
        ]);
        return;
      }

      await onConfirm();
      form.resetFields();
      setConfirmText('');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setConfirmText('');
    onCancel();
  };

  const formatSize = (size) => {
    if (!size) return '未知';
    return `${size} MB`;
  };

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

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#fa8c16', fontSize: '20px' }} />
          <span>确认恢复备份</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      onOk={handleConfirm}
      confirmLoading={loading}
      okText="确认恢复"
      cancelText="取消"
      okButtonProps={{ 
        danger: true,
        disabled: confirmText !== 'RESTORE',
      }}
      width={520}
    >
      <Alert
        type="warning"
        style={{ marginBottom: '16px' }}
        message="警告：此操作将覆盖当前数据"
        description="恢复备份会将系统状态回滚到备份时的状态，当前数据将被覆盖。请确保您已了解此操作的后果。"
        showIcon
        icon={<ExclamationCircleOutlined />}
      />

      <Divider orientation="left" orientationMargin={0}>备份信息</Divider>

      <div style={{ marginBottom: '16px' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">备份 ID: </Text>
            <Text code>{backup?.id}</Text>
          </div>
          <div>
            <Text type="secondary">创建时间: </Text>
            <Text>{formatTime(backup?.createdAt)}</Text>
          </div>
          <div>
            <Text type="secondary">备份大小: </Text>
            <Text>{formatSize(backup?.size)}</Text>
          </div>
          <div>
            <Text type="secondary">备份类型: </Text>
            <Text>{backup?.type === 'manual' ? '手动备份' : '自动备份'}</Text>
          </div>
          {backup?.description && (
            <div>
              <Text type="secondary">描述: </Text>
              <Text>{backup.description}</Text>
            </div>
          )}
        </Space>
      </div>

      <Divider orientation="left" orientationMargin={0}>确认操作</Divider>

      <Form form={form} layout="vertical">
        <Form.Item
          label={
            <Space>
              <DatabaseOutlined />
              <span>请输入 <Text code>RESTORE</Text> 以确认恢复操作</span>
            </Space>
          }
          name="confirmText"
          rules={[
            { 
              required: true, 
              message: '请输入 RESTORE 确认恢复操作' 
            },
          ]}
        >
          <Input
            placeholder="输入 RESTORE"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
          />
        </Form.Item>
      </Form>

      <Alert
        type="info"
        style={{ marginTop: '16px' }}
        message="恢复过程可能需要几分钟"
        description="恢复过程中系统将不可用，请勿关闭页面或刷新浏览器。"
        showIcon
      />
    </Modal>
  );
};

export default RestoreDialog;
