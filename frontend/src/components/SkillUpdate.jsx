import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Typography, message, Table, Tag, Alert, Checkbox, Badge } from 'antd';
import { 
  FireOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  RiseOutlined,
  WarningOutlined
} from '@ant-design/icons';
import InstallProgress from './InstallProgress';
import { updateSkill, fetchInstalledSkills } from '../services/skillService';

const { Title, Text, Paragraph } = Typography;

/**
 * SkillUpdate Component
 * Handles skill updates with batch update support
 * 
 * @param {Object} props
 * @param {Object|Array} props.skills - Single skill object or array of skills to update
 * @param {boolean} props.visible - Modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Function} props.onUpdateComplete - Callback when update completes
 */
const SkillUpdate = ({ skills, visible, onClose, onUpdateComplete }) => {
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, checking, updating, completed, error
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableUpdates, setAvailableUpdates] = useState([]);
  const [progress, setProgress] = useState(0);
  const [currentSkill, setCurrentSkill] = useState(null);
  const [currentStep, setCurrentStep] = useState('准备中...');
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [isBatchMode, setIsBatchMode] = useState(false);

  // Check if skills is array (batch mode) or single object
  useEffect(() => {
    if (visible) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      setIsBatchMode(Array.isArray(skills));
      setSelectedSkills(skillsArray.map(s => s.id));
      checkForUpdates(skillsArray);
    }
  }, [visible, skills]);

  /**
   * Check for available updates
   */
  const checkForUpdates = async (skillsList) => {
    setUpdateStatus('checking');
    addLog('正在检查可用更新...');

    try {
      // In a real scenario, this would call an API to check for updates
      // For now, we'll simulate the check
      const updates = skillsList.map(skill => ({
        ...skill,
        hasUpdate: true, // Assume update available
        currentVersion: skill.version,
        newVersion: incrementVersion(skill.version),
        updateSize: Math.floor(Math.random() * 500) + 100, // KB
        releaseNotes: `版本 ${incrementVersion(skill.version)} 更新内容:\n- 性能优化\n- Bug 修复\n- 新增功能`,
      }));

      setAvailableUpdates(updates);
      setUpdateStatus('idle');
      addLog(`发现 ${updates.length} 个可用更新`);
    } catch (err) {
      console.error('Update check error:', err);
      setError({ message: '检查更新失败' });
      setUpdateStatus('error');
      message.error('检查更新失败');
    }
  };

  /**
   * Increment version number (helper function)
   */
  const incrementVersion = (version) => {
    const parts = version.split('.').map(Number);
    if (parts.length >= 3) {
      parts[2] += 1;
      return parts.join('.');
    }
    return version + '.1';
  };

  const addLog = (logMessage) => {
    setLogs(prev => [...prev, {
      message: logMessage,
      timestamp: new Date().toISOString(),
    }]);
  };

  /**
   * Handle skill selection toggle
   */
  const handleSkillSelect = (skillId) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  /**
   * Handle select all
   */
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedSkills(availableUpdates.map(s => s.id));
    } else {
      setSelectedSkills([]);
    }
  };

  /**
   * Start update process
   */
  const handleUpdate = async () => {
    if (selectedSkills.length === 0) {
      message.warning('请至少选择一个技能进行更新');
      return;
    }

    setUpdateStatus('updating');
    setError(null);
    addLog(`开始更新 ${selectedSkills.length} 个技能`);

    try {
      const skillsToUpdate = availableUpdates.filter(s => selectedSkills.includes(s.id));
      let completedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < skillsToUpdate.length; i++) {
        const skill = skillsToUpdate[i];
        setCurrentSkill(skill);
        setCurrentStep(`正在更新 ${skill.displayName}...`);
        addLog(`开始更新：${skill.displayName} (${skill.currentVersion} -> ${skill.newVersion})`);

        // Simulate progress
        setProgress(Math.round(((i) / skillsToUpdate.length) * 100));

        try {
          // Call actual update API
          const result = await updateSkill(skill.id);
          
          addLog(`${skill.displayName} 更新成功`);
          completedCount++;
        } catch (err) {
          console.error(`Failed to update ${skill.id}:`, err);
          addLog(`${skill.displayName} 更新失败：${err.message}`);
          failedCount++;
        }
      }

      setProgress(100);
      setCurrentStep('更新完成');
      addLog(`更新完成：成功 ${completedCount} 个，失败 ${failedCount} 个`);
      
      setUpdateStatus('completed');
      
      if (failedCount === 0) {
        message.success(`成功更新 ${completedCount} 个技能`);
      } else {
        message.warning(`更新完成：成功 ${completedCount} 个，失败 ${failedCount} 个`);
      }

      if (onUpdateComplete) {
        onUpdateComplete(selectedSkills);
      }

      // Auto-close after 3 seconds if all successful
      if (failedCount === 0) {
        setTimeout(() => {
          onClose();
        }, 3000);
      }

    } catch (err) {
      console.error('Update error:', err);
      setError({
        message: err.message || '更新失败，请稍后重试',
        code: err.code || 'UPDATE_ERROR',
      });
      addLog(`更新失败：${err.message}`);
      setUpdateStatus('error');
      message.error(`更新失败：${err.message}`);
    }
  };

  /**
   * Cancel update
   */
  const handleCancel = () => {
    if (updateStatus === 'updating') {
      Modal.confirm({
        title: '确认取消',
        content: '更新正在进行中，取消可能导致技能版本不一致。确定要取消吗？',
        okText: '确定取消',
        cancelText: '继续更新',
        okButtonProps: { danger: true },
        onOk: () => {
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

  /**
   * Retry failed updates
   */
  const handleRetry = () => {
    setUpdateStatus('updating');
    setError(null);
    setTimeout(handleUpdate, 500);
  };

  // Table columns for available updates
  const columns = [
    {
      title: '选择',
      key: 'select',
      width: 60,
      render: (_, record) => (
        <Checkbox
          checked={selectedSkills.includes(record.id)}
          onChange={() => handleSkillSelect(record.id)}
          disabled={updateStatus === 'updating'}
        />
      ),
    },
    {
      title: '技能名称',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.name}</Text>
        </Space>
      ),
    },
    {
      title: '当前版本',
      key: 'currentVersion',
      width: 100,
      render: (_, record) => (
        <Tag color="blue">{record.currentVersion}</Tag>
      ),
    },
    {
      title: '新版本',
      key: 'newVersion',
      width: 100,
      render: (_, record) => (
        <Tag color="green">
          <Space>
            <RiseOutlined />
            {record.newVersion}
          </Space>
        </Tag>
      ),
    },
    {
      title: '更新大小',
      key: 'updateSize',
      width: 90,
      render: (_, record) => (
        <Text>{record.updateSize} KB</Text>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source) => (
        <Tag color={source === 'skillhub' ? 'cyan' : 'geekblue'}>
          {source === 'skillhub' ? 'SH' : 'CH'}
        </Tag>
      ),
    },
  ];

  // Render content based on status
  const renderContent = () => {
    if (updateStatus === 'updating' || updateStatus === 'completed' || updateStatus === 'error') {
      return (
        <InstallProgress
          skillName={currentSkill?.name || ''}
          skillDisplayName={currentSkill?.displayName || '批量更新'}
          progress={progress}
          status={updateStatus === 'updating' ? 'installing' : updateStatus}
          currentStep={currentStep}
          logs={logs}
          error={error}
          onCancel={handleCancel}
        />
      );
    }

    // Update selection view
    return (
      <div>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <FireOutlined style={{ color: '#faad14', fontSize: 20 }} />
            <Title level={4} style={{ margin: 0 }}>
              可用更新
            </Title>
            <Badge count={availableUpdates.length} style={{ backgroundColor: '#faad14' }} />
          </Space>
          <Paragraph type="secondary">
            发现 {availableUpdates.length} 个技能有新版本可用
          </Paragraph>
        </div>

        {/* Bulk Update Info */}
        {isBatchMode && selectedSkills.length > 1 && (
          <Alert
            message={
              <Space>
                <InfoCircleOutlined />
                <Text>批量更新模式</Text>
              </Space>
            }
            description={`已选择 ${selectedSkills.length} 个技能进行更新。更新将依次执行，请保持网络连接。`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            icon={<InfoCircleOutlined />}
          />
        )}

        {/* Update Table */}
        {availableUpdates.length > 0 ? (
          <>
            <div style={{ marginBottom: 8 }}>
              <Space>
                <Checkbox
                  checked={selectedSkills.length === availableUpdates.length && availableUpdates.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  disabled={updateStatus === 'checking'}
                >
                  <Text strong>全选</Text>
                </Checkbox>
                <Text type="secondary">
                  已选择 {selectedSkills.length} / {availableUpdates.length}
                </Text>
              </Space>
            </div>

            <Table
              columns={columns}
              dataSource={availableUpdates}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 400 }}
              loading={updateStatus === 'checking'}
            />

            {/* Release Notes Preview */}
            {selectedSkills.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>
                  <InfoCircleOutlined /> 更新说明
                </Title>
                <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                  {availableUpdates
                    .filter(s => selectedSkills.includes(s.id))
                    .map(skill => (
                      <div key={skill.id} style={{ marginBottom: 8 }}>
                        <Text strong>{skill.displayName}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {' '}{skill.currentVersion} → {skill.newVersion}
                        </Text>
                        <Paragraph style={{ fontSize: 12, marginTop: 4 }}>
                          {skill.releaseNotes}
                        </Paragraph>
                      </div>
                    ))}
                </Card>
              </div>
            )}
          </>
        ) : (
          <Alert
            message="已是最新版本"
            description="所有选中的技能都已是最新版本，无需更新。"
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        )}
      </div>
    );
  };

  // Render footer based on status
  const renderFooter = () => {
    if (updateStatus === 'updating' || updateStatus === 'completed') {
      return (
        <Space>
          {updateStatus === 'completed' && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={onClose}>
              完成
            </Button>
          )}
          {updateStatus === 'updating' && (
            <Button onClick={handleCancel} danger>
              取消更新
            </Button>
          )}
        </Space>
      );
    }

    if (updateStatus === 'error') {
      return (
        <Space>
          <Button onClick={handleRetry} icon={<SyncOutlined />} type="primary">
            重试
          </Button>
          <Button onClick={handleCancel} icon={<CloseCircleOutlined />}>
            关闭
          </Button>
        </Space>
      );
    }

    // Update selection view footer
    return (
      <Space>
        <Button onClick={handleCancel} icon={<CloseCircleOutlined />}>
          取消
        </Button>
        <Button
          type="primary"
          icon={<FireOutlined />}
          onClick={handleUpdate}
          disabled={selectedSkills.length === 0 || availableUpdates.length === 0}
          loading={updateStatus === 'checking'}
        >
          更新选中的技能 ({selectedSkills.length})
        </Button>
      </Space>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <SyncOutlined spin={updateStatus === 'checking' || updateStatus === 'updating'} />
          <Text strong>{isBatchMode ? '批量更新' : '技能更新'}</Text>
        </Space>
      }
      visible={visible}
      onCancel={handleCancel}
      footer={renderFooter()}
      width={isBatchMode ? 900 : 700}
      centered
      maskClosable={updateStatus !== 'updating'}
      destroyOnClose={false}
    >
      {renderContent()}
    </Modal>
  );
};

export default SkillUpdate;
