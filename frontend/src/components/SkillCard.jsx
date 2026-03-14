import React from 'react';
import { Card, Tag, Space, Typography, Badge, Button, message, Tooltip } from 'antd';
import { DownloadOutlined, CheckCircleOutlined, StarOutlined, FireOutlined } from '@ant-design/icons';
import { CATEGORY_LABELS, SOURCE_LABELS, installSkill, uninstallSkill, updateSkill } from '../services/skillService';
import { useNavigate } from 'react-router-dom';

const { Text, Paragraph } = Typography;

/**
 * SkillCard Component
 * Displays skill information in card format
 */
const SkillCard = ({ skill, onInstallChange }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/skills/${skill.id}`);
  };

  /**
   * Handle skill install
   */
  const handleInstall = async (e) => {
    e.stopPropagation();
    try {
      const result = await installSkill(skill.id, skill.source);
      if (result.success) {
        message.success(`技能 ${skill.displayName} 安装成功`);
        if (onInstallChange) onInstallChange(skill.id, true);
      }
    } catch (error) {
      message.error(`安装失败：${error.message}`);
    }
  };

  /**
   * Handle skill uninstall
   */
  const handleUninstall = async (e) => {
    e.stopPropagation();
    try {
      const result = await uninstallSkill(skill.id);
      if (result.success) {
        message.success(`技能 ${skill.displayName} 已卸载`);
        if (onInstallChange) onInstallChange(skill.id, false);
      }
    } catch (error) {
      message.error(`卸载失败：${error.message}`);
    }
  };

  /**
   * Handle skill update
   */
  const handleUpdate = async (e) => {
    e.stopPropagation();
    try {
      const result = await updateSkill(skill.id);
      if (result.success) {
        message.success(`技能 ${skill.displayName} 更新成功`);
        if (onInstallChange) onInstallChange(skill.id, true);
      }
    } catch (error) {
      message.error(`更新失败：${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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

  return (
    <Card
      hoverable
      onClick={handleClick}
      style={{ height: '100%', cursor: 'pointer' }}
      cover={
        <div style={{ 
          height: 100, 
          background: `linear-gradient(135deg, ${skill.source === 'skillhub' ? '#667eea 0%, #764ba2 100%' : '#f093fb 0%, #f5576c 100%'})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 40,
          fontWeight: 'bold',
        }}>
          {skill.displayName.charAt(0)}
        </div>
      }
      actions={[
        skill.installed ? (
          <Tooltip title="已安装">
            <Button
              key="installed"
              type="text"
              icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              onClick={(e) => e.stopPropagation()}
            >
              已安装
            </Button>
          </Tooltip>
        ) : (
          <Button
            key="install"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleInstall}
          >
            安装
          </Button>
        ),
      ].concat(
        skill.installed
          ? [
              <Tooltip key="update" title="检查更新">
                <Button
                  type="text"
                  icon={<FireOutlined />}
                  onClick={handleUpdate}
                />
              </Tooltip>,
              <Tooltip key="uninstall" title="卸载">
                <Button
                  type="text"
                  danger
                  icon={<DownloadOutlined rotate={180} />}
                  onClick={handleUninstall}
                />
              </Tooltip>,
            ]
          : []
      )}
    >
      <Card.Meta
        title={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <Text strong style={{ fontSize: 16 }}>
                {skill.displayName}
              </Text>
              <Badge 
                count={skill.source === 'skillhub' ? 'SH' : 'CH'} 
                style={{ 
                  backgroundColor: getSourceColor(skill.source),
                  fontSize: 10,
                }} 
              />
            </Space>
          </Space>
        }
        description={
          <div>
            <Paragraph
              ellipsis={{ rows: 2 }}
              style={{ marginBottom: 8, height: 44 }}
            >
              {skill.description}
            </Paragraph>
            
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space wrap>
                <Tag color={getCategoryColor(skill.category)}>
                  {CATEGORY_LABELS[skill.category] || skill.category}
                </Tag>
                {skill.categories?.slice(0, 2).map((cat, index) => (
                  <Tag key={index} color={getCategoryColor(cat)}>
                    {CATEGORY_LABELS[cat] || cat}
                  </Tag>
                ))}
              </Space>
              
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <StarOutlined style={{ color: '#faad14' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {skill.rating.toFixed(1)}
                  </Text>
                </Space>
                <Space>
                  <DownloadOutlined style={{ color: '#1890ff' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {skill.downloads}
                  </Text>
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  v{skill.version}
                </Text>
              </Space>

              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  作者：{skill.author}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  更新于 {formatDate(skill.updatedAt)}
                </Text>
              </Space>

              {/* Tags */}
              <Space wrap style={{ marginTop: 8 }}>
                {skill.tags?.slice(0, 3).map((tag, index) => (
                  <Tag key={index} color="default" style={{ fontSize: 11 }}>
                    #{tag}
                  </Tag>
                ))}
              </Space>
            </Space>
          </div>
        }
      />
    </Card>
  );
};

export default SkillCard;
