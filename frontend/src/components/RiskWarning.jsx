import React from 'react';
import { Alert, Descriptions, Tag, Space, Typography, Divider } from 'antd';
import { 
  WarningOutlined, 
  SafetyCertificateOutlined, 
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { SOURCE_LABELS } from '../services/skillService';

const { Text } = Typography;

/**
 * RiskWarning Component
 * Displays risk information for skill installation
 * 
 * @param {Object} props
 * @param {Object} props.skill - Skill object containing risk-related information
 * @param {boolean} props.visible - Whether to show the warning
 * @param {Function} props.onConfirm - Callback when user confirms installation
 */
const RiskWarning = ({ skill, visible = true, onConfirm }) => {
  if (!skill || !visible) return null;

  // Calculate risk level based on various factors
  const calculateRiskLevel = () => {
    let riskScore = 0;
    const riskFactors = [];

    // Source risk
    if (skill.source === 'clawhub') {
      riskScore += 2;
      riskFactors.push('社区源技能');
    }

    // Version risk (new or very old versions)
    const versionAge = Date.now() - new Date(skill.updatedAt).getTime();
    const daysSinceUpdate = versionAge / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 180) {
      riskScore += 1;
      riskFactors.push('版本较旧');
    } else if (daysSinceUpdate < 7) {
      riskScore += 1;
      riskFactors.push('新版本未经充分验证');
    }

    // Rating risk
    if (skill.rating < 4.0) {
      riskScore += 2;
      riskFactors.push('评分较低');
    } else if (skill.rating < 4.5) {
      riskScore += 1;
      riskFactors.push('评分一般');
    }

    // Download count risk (low adoption)
    if (skill.downloads < 100) {
      riskScore += 1;
      riskFactors.push('下载量较少');
    }

    // Category risk
    if (skill.categories?.includes('security')) {
      riskScore += 1;
      riskFactors.push('涉及安全权限');
    }

    // Determine risk level
    let riskLevel = 'low';
    let riskType = 'success';
    if (riskScore >= 4) {
      riskLevel = 'high';
      riskType = 'error';
    } else if (riskScore >= 2) {
      riskLevel = 'medium';
      riskType = 'warning';
    }

    return { riskLevel, riskType, riskFactors, riskScore };
  };

  const { riskLevel, riskType, riskFactors, riskScore } = calculateRiskLevel();

  const getRiskLevelText = () => {
    switch (riskLevel) {
      case 'high':
        return '高风险';
      case 'medium':
        return '中等风险';
      case 'low':
        return '低风险';
      default:
        return '未知风险';
    }
  };

  const getRiskLevelColor = () => {
    switch (riskLevel) {
      case 'high':
        return '#ff4d4f';
      case 'medium':
        return '#faad14';
      case 'low':
        return '#52c41a';
      default:
        return '#8c8c8c';
    }
  };

  // Permission requirements based on skill type
  const getPermissionRequirements = () => {
    const permissions = [];
    
    if (skill.categories?.includes('security')) {
      permissions.push({ name: '系统权限', level: '高', description: '可能涉及系统配置修改' });
    }
    
    if (skill.categories?.includes('tool')) {
      permissions.push({ name: '文件读写', level: '中', description: '可能访问工作目录文件' });
    }
    
    if (skill.name?.includes('network') || skill.name?.includes('http')) {
      permissions.push({ name: '网络访问', level: '中', description: '可能需要访问外部 API' });
    }
    
    if (skill.name?.includes('exec') || skill.name?.includes('shell')) {
      permissions.push({ name: '命令执行', level: '高', description: '可能执行系统命令' });
    }

    // Default permissions
    if (permissions.length === 0) {
      permissions.push({ name: '基础权限', level: '低', description: '仅使用标准 API' });
    }

    return permissions;
  };

  const permissions = getPermissionRequirements();

  return (
    <div style={{ marginTop: 16 }}>
      {/* Main Risk Alert */}
      <Alert
        message={
          <Space>
            {riskLevel === 'high' ? (
              <WarningOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
            ) : riskLevel === 'medium' ? (
              <WarningOutlined style={{ color: '#faad14', fontSize: 16 }} />
            ) : (
              <SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            )}
            <Text strong style={{ fontSize: 16 }}>安装风险提示</Text>
          </Space>
        }
        description={
          <div style={{ marginTop: 8 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space>
                <Text>风险等级：</Text>
                <Tag color={getRiskLevelColor()} style={{ fontSize: 14 }}>
                  {getRiskLevelText()} (评分：{riskScore})
                </Tag>
              </Space>
              {riskFactors.length > 0 && (
                <Space wrap>
                  <Text>风险因素：</Text>
                  {riskFactors.map((factor, index) => (
                    <Tag key={index} color="orange">
                      {factor}
                    </Tag>
                  ))}
                </Space>
              )}
            </Space>
          </div>
        }
        type={riskType}
        showIcon={false}
        style={{ marginBottom: 16 }}
      />

      {/* Skill Information */}
      <Descriptions
        title={
          <Space>
            <InfoCircleOutlined />
            <Text strong>技能信息</Text>
          </Space>
        }
        bordered
        column={2}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Descriptions.Item label="技能名称" labelStyle={{ fontSize: 12 }}>
          <Space>
            <Text code>{skill.name}</Text>
            <Text strong>{skill.displayName}</Text>
          </Space>
        </Descriptions.Item>
        
        <Descriptions.Item label="来源" labelStyle={{ fontSize: 12 }}>
          <Tag color={skill.source === 'skillhub' ? 'cyan' : 'geekblue'}>
            {SOURCE_LABELS[skill.source]}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="版本" labelStyle={{ fontSize: 12 }}>
          <Tag color="blue">v{skill.version}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="作者" labelStyle={{ fontSize: 12 }}>
          {skill.author}
        </Descriptions.Item>

        <Descriptions.Item label="更新时间" labelStyle={{ fontSize: 12 }}>
          {new Date(skill.updatedAt).toLocaleDateString('zh-CN')}
        </Descriptions.Item>

        <Descriptions.Item label="下载量" labelStyle={{ fontSize: 12 }}>
          <Space>
            <Text>{skill.downloads}</Text>
            {skill.downloads < 100 && (
              <Tag color="orange" style={{ fontSize: 10 }}>较少</Tag>
            )}
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="评分" labelStyle={{ fontSize: 12 }} span={2}>
          <Space>
            <Text>{skill.rating.toFixed(1)}</Text>
            {skill.rating < 4.0 && (
              <Tag color="red" style={{ fontSize: 10 }}>较低</Tag>
            )}
            {skill.rating >= 4.0 && skill.rating < 4.5 && (
              <Tag color="orange" style={{ fontSize: 10 }}>一般</Tag>
            )}
            {skill.rating >= 4.5 && (
              <Tag color="green" style={{ fontSize: 10 }}>良好</Tag>
            )}
          </Space>
        </Descriptions.Item>
      </Descriptions>

      {/* Permission Requirements */}
      <div style={{ marginTop: 16 }}>
        <Space style={{ marginBottom: 8 }}>
          <SafetyCertificateOutlined />
          <Text strong>权限需求</Text>
        </Space>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {permissions.map((perm, index) => (
            <Alert
              key={index}
              type={perm.level === '高' ? 'warning' : perm.level === '中' ? 'info' : 'success'}
              message={
                <Space>
                  <Text strong>{perm.name}</Text>
                  <Tag color={perm.level === '高' ? 'red' : perm.level === '中' ? 'orange' : 'green'}>
                    {perm.level}风险
                  </Tag>
                </Space>
              }
              description={perm.description}
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ fontSize: 12 }}
            />
          ))}
        </Space>
      </div>

      {/* Recommendation */}
      {riskLevel === 'high' && (
        <Alert
          message="建议"
          description="此技能存在较高风险，建议：1) 确认技能来源可靠 2) 查看详细文档 3) 在测试环境先验证 4) 优先选择官方技能"
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          icon={<WarningOutlined />}
        />
      )}

      {riskLevel === 'medium' && (
        <Alert
          message="建议"
          description="此技能存在一定风险，建议先了解技能功能和权限需求后再安装"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
          icon={<InfoCircleOutlined />}
        />
      )}
    </div>
  );
};

export default RiskWarning;
