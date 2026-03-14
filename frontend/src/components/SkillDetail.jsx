import React, { useState } from 'react';
import { Modal, Descriptions, Tag, Space, Typography, Button, Rate, Statistic, Row, Col, Divider, Alert, Badge } from 'antd';
import { 
  DownloadOutlined, 
  CheckCircleOutlined, 
  StarOutlined, 
  FireOutlined, 
  UserOutlined, 
  ClockCircleOutlined,
  VersionOutlined,
  LinkOutlined,
  TagOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { CATEGORY_LABELS, SOURCE_LABELS, installSkill, uninstallSkill, updateSkill } from '../services/skillService';
import SkillInstall from './SkillInstall';
import SkillUpdate from './SkillUpdate';

const { Title, Text, Paragraph } = Typography;

/**
 * SkillDetail Component
 * Displays detailed skill information in a modal
 */
const SkillDetail = ({ skill, visible, onClose, onInstallChange }) => {
  const [installModalVisible, setInstallModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  if (!skill) return null;

  /**
   * Handle skill install
   */
  const handleInstall = () => {
    setInstallModalVisible(true);
  };

  /**
   * Handle install complete
   */
  const handleInstallComplete = (skillId, installed) => {
    if (onInstallChange) {
      onInstallChange(skillId, installed);
    }
    setInstallModalVisible(false);
  };

  /**
   * Handle skill uninstall
   */
  const handleUninstall = async () => {
    try {
      const result = await uninstallSkill(skill.id);
      if (result.success) {
        onInstallChange(skill.id, false);
      }
    } catch (error) {
      console.error('Uninstall failed:', error);
    }
  };

  /**
   * Handle skill update
   */
  const handleUpdate = () => {
    setUpdateModalVisible(true);
  };

  /**
   * Handle update complete
   */
  const handleUpdateComplete = (skillIds) => {
    if (onInstallChange) {
      skillIds.forEach(id => onInstallChange(id, true));
    }
    setUpdateModalVisible(false);
  };

  const getCategoryColor = (category) => {
    const colors = {
      official: 'blue',
      community: 'green',
      tool: 'orange',
      language: 'purple',
      security: 'red',
    };
    return colors[category] || 'default';
  };

  const getSourceColor = (source) => {
    return source === 'skillhub' ? 'cyan' : 'geekblue';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
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
          <Title level={4} style={{ margin: 0 }}>
            {skill.displayName}
          </Title>
          <Badge 
            count={skill.source === 'skillhub' ? 'SH' : 'CH'} 
            style={{ 
              backgroundColor: getSourceColor(skill.source),
              fontSize: 10,
            }} 
          />
        </Space>
      }
      visible={visible}
      onCancel={onClose}
      width={800}
      footer={
        <Space>
          {skill.installed ? (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                disabled
              >
                已安装
              </Button>
              <Button
                icon={<FireOutlined />}
                onClick={handleUpdate}
              >
                更新
              </Button>
              <Button
                danger
                icon={<DownloadOutlined rotate={180} />}
                onClick={handleUninstall}
              >
                卸载
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleInstall}
            >
              安装此技能
            </Button>
          )}
          <Button onClick={onClose}>关闭</Button>
        </Space>
      }
    >
      {/* Skill Install Modal */}
      <SkillInstall
        skill={skill}
        visible={installModalVisible}
        onClose={() => setInstallModalVisible(false)}
        onInstallComplete={handleInstallComplete}
      />

      {/* Skill Update Modal */}
      <SkillUpdate
        skills={skill}
        visible={updateModalVisible}
        onClose={() => setUpdateModalVisible(false)}
        onUpdateComplete={handleUpdateComplete}
      />
      <div style={{ marginBottom: 24 }}>
        <Paragraph style={{ fontSize: 16, lineHeight: 1.8 }}>
          {skill.description}
        </Paragraph>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic
            title="评分"
            value={skill.rating}
            precision={1}
            prefix={<StarOutlined style={{ color: '#faad14' }} />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="下载量"
            value={skill.downloads}
            prefix={<DownloadOutlined style={{ color: '#1890ff' }} />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="版本"
            value={skill.version}
            prefix={<VersionOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="状态"
            value={skill.installed ? '已安装' : '未安装'}
            valueStyle={{ color: skill.installed ? '#52c41a' : '#8c8c8c' }}
            prefix={skill.installed ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          />
        </Col>
      </Row>

      <Divider />

      {/* Detailed Information */}
      <Descriptions
        title="详细信息"
        bordered
        column={2}
        size="middle"
      >
        <Descriptions.Item
          label="技能名称"
          labelStyle={{ fontWeight: 'bold' }}
        >
          <Space>
            <Text code>{skill.name}</Text>
          </Space>
        </Descriptions.Item>
        
        <Descriptions.Item
          label="显示名称"
          labelStyle={{ fontWeight: 'bold' }}
        >
          {skill.displayName}
        </Descriptions.Item>

        <Descriptions.Item
          label="作者"
          labelStyle={{ fontWeight: 'bold' }}
        >
          <Space>
            <UserOutlined />
            {skill.author}
          </Space>
        </Descriptions.Item>

        <Descriptions.Item
          label="来源"
          labelStyle={{ fontWeight: 'bold' }}
        >
          <Tag color={getSourceColor(skill.source)}>
            {SOURCE_LABELS[skill.source]}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item
          label="分类"
          labelStyle={{ fontWeight: 'bold' }}
          span={2}
        >
          <Space wrap>
            {skill.categories.map((cat, index) => (
              <Tag key={index} color={getCategoryColor(cat)}>
                {CATEGORY_LABELS[cat] || cat}
              </Tag>
            ))}
          </Space>
        </Descriptions.Item>

        <Descriptions.Item
          label="创建时间"
          labelStyle={{ fontWeight: 'bold' }}
        >
          <Space>
            <ClockCircleOutlined />
            {formatDate(skill.createdAt)}
          </Space>
        </Descriptions.Item>

        <Descriptions.Item
          label="更新时间"
          labelStyle={{ fontWeight: 'bold' }}
        >
          <Space>
            <FireOutlined />
            {formatDate(skill.updatedAt)}
          </Space>
        </Descriptions.Item>

        <Descriptions.Item
          label="标签"
          labelStyle={{ fontWeight: 'bold' }}
          span={2}
        >
          <Space wrap>
            {skill.tags.map((tag, index) => (
              <Tag key={index} icon={<TagOutlined />} color="default">
                {tag}
              </Tag>
            ))}
          </Space>
        </Descriptions.Item>
      </Descriptions>

      {/* Risk Notice */}
      {skill.source === 'clawhub' && !skill.installed && (
        <Alert
          message="风险提示"
          description="此技能来自 ClawHub 社区源，请在安装前确认技能来源和作者信息。建议优先选择 SkillHub 官方技能。"
          type="warning"
          showIcon
          style={{ marginTop: 24 }}
          icon={<SafetyCertificateOutlined />}
        />
      )}

      {/* Installation Notice */}
      {skill.installed && (
        <Alert
          message="已安装"
          description="此技能已安装在您的系统中。您可以检查更新或卸载它。"
          type="success"
          showIcon
          style={{ marginTop: 24 }}
          icon={<CheckCircleOutlined />}
        />
      )}
    </Modal>
  );
};

export default SkillDetail;
