import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Typography, message, Checkbox, Divider } from 'antd';
import { 
  DownloadOutlined, 
  WarningOutlined, 
  CheckCircleOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import RiskWarning from './RiskWarning';
import InstallProgress from './InstallProgress';
import { installSkill } from '../services/skillService';

const { Title, Text, Paragraph } = Typography;

/**
 * SkillInstall Component
 * Handles skill installation with risk warning and progress tracking
 * 
 * @param {Object} props
 * @param {Object} props.skill - Skill object to install
 * @param {boolean} props.visible - Modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Function} props.onInstallComplete - Callback when installation completes
 */
const SkillInstall = ({ skill, visible, onClose, onInstallComplete }) => {
  const [installStatus, setInstallStatus] = useState('idle'); // idle, confirming, installing, completed, error
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('准备中...');
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [agreeToRisks, setAgreeToRisks] = useState(false);

  // Reset state when skill or visibility changes
  useEffect(() => {
    if (visible && skill) {
      resetState();
    }
  }, [visible, skill]);

  const resetState = () => {
    setInstallStatus('confirming');
    setProgress(0);
    setCurrentStep('准备中...');
    setLogs([]);
    setError(null);
    setAgreeToRisks(false);
  };

  const addLog = (logMessage) => {
    setLogs(prev => [...prev, {
      message: logMessage,
      timestamp: new Date().toISOString(),
    }]);
  };

  /**
   * Start installation process
   */
  const handleInstall = async () => {
    if (!skill) return;

    setInstallStatus('installing');
    setError(null);
    addLog(`开始安装技能：${skill.displayName}`);

    try {
      // Simulate progress updates (in real scenario, this would come from backend)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      // Update step descriptions
      setTimeout(() => {
        setCurrentStep('正在下载技能包...');
        addLog('从源服务器下载技能文件');
      }, 1000);

      setTimeout(() => {
        setCurrentStep('正在验证文件完整性...');
        addLog('校验文件哈希值和签名');
      }, 3000);

      setTimeout(() => {
        setCurrentStep('正在安装技能...');
        addLog('解压并安装技能文件到系统目录');
      }, 5000);

      // Call actual install API
      const result = await installSkill(skill.id, skill.source);
      
      clearInterval(progressInterval);
      setProgress(100);
      setCurrentStep('安装完成');
      addLog('技能安装成功');
      
      setInstallStatus('completed');
      
      message.success(`技能 ${skill.displayName} 安装成功`);
      
      if (onInstallComplete) {
        onInstallComplete(skill.id, true);
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Installation error:', err);
      setError({
        message: err.message || '安装失败，请稍后重试',
        code: err.code || 'INSTALL_ERROR',
      });
      addLog(`安装失败：${err.message}`);
      setInstallStatus('error');
      message.error(`安装失败：${err.message}`);
    }
  };

  /**
   * Cancel installation
   */
  const handleCancel = () => {
    if (installStatus === 'installing') {
      Modal.confirm({
        title: '确认取消',
        content: '安装正在进行中，取消可能导致技能安装不完整。确定要取消吗？',
        okText: '确定取消',
        cancelText: '继续安装',
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
   * Retry installation after error
   */
  const handleRetry = () => {
    resetState();
    setTimeout(handleInstall, 500);
  };

  if (!skill) return null;

  // Render different content based on installation status
  const renderContent = () => {
    if (installStatus === 'installing' || installStatus === 'completed' || installStatus === 'error') {
      return (
        <InstallProgress
          skillName={skill.name}
          skillDisplayName={skill.displayName}
          progress={Math.round(progress)}
          status={installStatus === 'installing' ? 'installing' : installStatus}
          currentStep={currentStep}
          logs={logs}
          error={error}
          onCancel={handleCancel}
        />
      );
    }

    // Confirmation view with risk warning
    return (
      <div>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ 
            width: 80, 
            height: 80, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'white',
            fontSize: 36,
            fontWeight: 'bold',
          }}>
            {skill.displayName.charAt(0)}
          </div>
          <Title level={4} style={{ margin: 0 }}>
            安装 {skill.displayName}
          </Title>
          <Text type="secondary">版本 {skill.version}</Text>
        </div>

        {/* Skill Description */}
        <Paragraph style={{ textAlign: 'center', marginBottom: 24 }}>
          {skill.description}
        </Paragraph>

        <Divider />

        {/* Risk Warning */}
        <RiskWarning skill={skill} visible={true} />

        {/* Agreement Checkbox */}
        <div style={{ marginTop: 24 }}>
          <Checkbox
            checked={agreeToRisks}
            onChange={(e) => setAgreeToRisks(e.target.checked)}
            style={{ fontSize: 14 }}
          >
            <Space>
              <WarningOutlined style={{ color: agreeToRisks ? '#faad14' : '#8c8c8c' }} />
              <Text>我已了解上述风险，确认要安装此技能</Text>
            </Space>
          </Checkbox>
        </div>

        {/* Info Notice */}
        <Alert
          message={
            <Space>
              <InfoCircleOutlined />
              <Text>提示信息</Text>
            </Space>
          }
          description="安装过程中请保持网络连接，不要关闭此窗口。安装完成后技能将立即可用。"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
          icon={<InfoCircleOutlined />}
        />
      </div>
    );
  };

  // Render footer based on status
  const renderFooter = () => {
    if (installStatus === 'installing' || installStatus === 'completed') {
      return (
        <Space>
          {installStatus === 'completed' && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={onClose}>
              完成
            </Button>
          )}
          {installStatus === 'installing' && (
            <Button onClick={handleCancel} danger>
              取消安装
            </Button>
          )}
        </Space>
      );
    }

    if (installStatus === 'error') {
      return (
        <Space>
          <Button onClick={handleRetry} icon={<DownloadOutlined />} type="primary">
            重试
          </Button>
          <Button onClick={handleCancel} icon={<CloseCircleOutlined />}>
            关闭
          </Button>
        </Space>
      );
    }

    // Confirmation view footer
    return (
      <Space>
        <Button onClick={handleCancel} icon={<CloseCircleOutlined />}>
          取消
        </Button>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleInstall}
          disabled={!agreeToRisks}
          loading={installStatus === 'installing'}
        >
          确认安装
        </Button>
      </Space>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <DownloadOutlined />
          <Text strong>技能安装</Text>
        </Space>
      }
      visible={visible}
      onCancel={handleCancel}
      footer={renderFooter()}
      width={700}
      centered
      maskClosable={installStatus !== 'installing'}
      destroyOnClose={false}
    >
      {renderContent()}
    </Modal>
  );
};

export default SkillInstall;
