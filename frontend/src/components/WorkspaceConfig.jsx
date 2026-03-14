import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Space, Typography, Alert, Card, Row, Col, Tag, Tooltip } from 'antd';
import { 
  FolderOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  LoadingOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  HomeOutlined,
  ProjectOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

/**
 * Common workspace presets
 */
const WORKSPACE_PRESETS = [
  {
    id: 'default',
    name: '默认工作空间',
    path: '/home/admin/.openclaw/workspace',
    description: 'OpenClaw 默认工作目录',
    icon: <HomeOutlined />,
    tags: ['推荐', '默认'],
  },
  {
    id: 'projects',
    name: '项目目录',
    path: '/home/admin/.openclaw/workspace/projects',
    description: '用于代码开发和技术项目',
    icon: <ProjectOutlined />,
    tags: ['开发'],
  },
  {
    id: 'products',
    name: '产品目录',
    path: '/home/admin/.openclaw/workspace/products',
    description: '用于产品需求和文档管理',
    icon: <FileTextOutlined />,
    tags: ['产品'],
  },
  {
    id: 'custom',
    name: '自定义路径',
    path: '',
    description: '输入自定义工作空间路径',
    icon: <FolderOutlined />,
    tags: ['自定义'],
  },
];

/**
 * Validate workspace path format
 */
const validatePath = (path) => {
  if (!path || path.length === 0) {
    return { valid: false, message: '请输入工作空间路径' };
  }

  if (!path.startsWith('/')) {
    return { valid: false, message: '路径必须是绝对路径（以 / 开头）' };
  }

  // Check for invalid characters
  if (/[<>|"?*]/.test(path)) {
    return { valid: false, message: '路径包含无效字符' };
  }

  // Check for path traversal
  if (path.includes('../') || path.includes('..\\')) {
    return { valid: false, message: '路径不能包含目录穿越符号' };
  }

  // Check minimum length
  if (path.length < 2) {
    return { valid: false, message: '路径太短' };
  }

  return { valid: true, message: '路径格式有效' };
};

/**
 * WorkspaceConfig Component
 * Workspace path configuration with validation and presets
 */
const WorkspaceConfig = ({ value, onChange, form, agentName }) => {
  const [pathValue, setPathValue] = useState(value || '/home/admin/.openclaw/workspace');
  const [validationStatus, setValidationStatus] = useState(null); // 'valid' | 'invalid' | 'validating'
  const [validationMessage, setValidationMessage] = useState('');
  const [customPath, setCustomPath] = useState(false);

  useEffect(() => {
    if (value) {
      setPathValue(value);
      validateWorkspacePath(value);
    }
  }, [value]);

  /**
   * Validate workspace path
   */
  const validateWorkspacePath = useCallback((path) => {
    if (!path || path.length === 0) {
      setValidationStatus(null);
      setValidationMessage('');
      return;
    }

    setValidationStatus('validating');
    
    // Format validation
    const formatResult = validatePath(path);
    if (!formatResult.valid) {
      setValidationStatus('invalid');
      setValidationMessage(formatResult.message);
      return;
    }

    // Simulate async validation (in real app, this would call API)
    setTimeout(() => {
      // Additional validation logic could go here
      // For now, accept all valid format paths
      setValidationStatus('valid');
      setValidationMessage('路径可用');
    }, 300);
  }, []);

  /**
   * Handle path change
   */
  const handlePathChange = (e) => {
    const newPath = e.target.value;
    setPathValue(newPath);
    setCustomPath(true);
    validateWorkspacePath(newPath);
    onChange && onChange(newPath);
  };

  /**
   * Handle preset selection
   */
  const handlePresetSelect = (preset) => {
    if (preset.id === 'custom') {
      setCustomPath(true);
      setPathValue('');
      setValidationStatus(null);
      setValidationMessage('');
      onChange && onChange('');
    } else {
      setCustomPath(false);
      setPathValue(preset.path);
      validateWorkspacePath(preset.path);
      onChange && onChange(preset.path);
    }
  };

  /**
   * Get suggested path based on agent name
   */
  const getSuggestedPath = () => {
    if (!agentName || agentName.length === 0) {
      return '/home/admin/.openclaw/workspace';
    }
    
    // Sanitize agent name for path
    const sanitizedName = agentName
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '')
      .toLowerCase();
    
    return `/home/admin/.openclaw/workspace/agents/${sanitizedName}`;
  };

  /**
   * Use suggested path
   */
  const useSuggestedPath = () => {
    const suggested = getSuggestedPath();
    setPathValue(suggested);
    validateWorkspacePath(suggested);
    onChange && onChange(suggested);
  };

  /**
   * Get validation icon
   */
  const getValidationIcon = () => {
    switch (validationStatus) {
      case 'valid':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'invalid':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'validating':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      default:
        return null;
    }
  };

  return (
    <div className="workspace-config">
      {/* Workspace Presets */}
      <div className="workspace-presets" style={{ marginBottom: 20 }}>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>
          选择预设工作空间：
        </Text>
        
        <Row gutter={[16, 16]}>
          {WORKSPACE_PRESETS.map(preset => (
            <Col xs={24} sm={12} lg={6} key={preset.id}>
              <Card
                hoverable
                size="small"
                className={`workspace-preset-card ${pathValue === preset.path ? 'selected' : ''}`}
                onClick={() => handlePresetSelect(preset)}
                style={{
                  height: '100%',
                  borderColor: pathValue === preset.path ? '#1890ff' : '#e8e8e8',
                  backgroundColor: pathValue === preset.path ? '#e6f7ff' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space>
                    <span style={{ fontSize: 20 }}>{preset.icon}</span>
                    <Text strong>{preset.name}</Text>
                  </Space>
                  
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    {preset.description}
                  </Text>
                  
                  <Space wrap>
                    {preset.tags.map(tag => (
                      <Tag key={tag} color={tag === '推荐' ? 'green' : 'default'}>
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Custom Path Input */}
      <div className="custom-path-section" style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>
          工作空间路径：
        </Text>
        
        <Form.Item
          validateStatus={validationStatus}
          help={validationMessage}
        >
          <Input
            placeholder="/home/admin/.openclaw/workspace"
            value={pathValue}
            onChange={handlePathChange}
            suffix={getValidationIcon()}
            size="large"
            style={{ fontFamily: 'monospace' }}
          />
        </Form.Item>

        {/* Suggested Path */}
        {agentName && !customPath && (
          <Alert
            message={
              <Space>
                <InfoCircleOutlined />
                <Text type="secondary">
                  建议路径：<Text code style={{ background: '#f5f5f5' }}>{getSuggestedPath()}</Text>
                </Text>
                <Button 
                  type="link" 
                  size="small" 
                  onClick={useSuggestedPath}
                  style={{ padding: 0 }}
                >
                  使用此路径
                </Button>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginTop: 8 }}
          />
        )}
      </div>

      {/* Path Validation Status */}
      {validationStatus === 'valid' && (
        <Alert
          message={
            <Space>
              <CheckCircleOutlined />
              <Text type="success">工作空间路径格式正确</Text>
            </Space>
          }
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {validationStatus === 'invalid' && (
        <Alert
          message={
            <Space>
              <CloseCircleOutlined />
              <Text type="danger">{validationMessage}</Text>
            </Space>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Workspace Info */}
      <Card 
        size="small" 
        title={
          <Space>
            <InfoCircleOutlined />
            <Text strong>工作空间说明</Text>
          </Space>
        }
        bordered
        style={{ background: '#fafafa' }}
      >
        <Paragraph style={{ margin: 0 }}>
          <Text type="secondary">
            工作空间是 Agent 的文件操作根目录。Agent 只能在此目录及其子目录中读写文件，
            这有助于保护系统安全。请确保路径存在或 Agent 有权限创建。
          </Text>
        </Paragraph>
        
        <div style={{ marginTop: 12 }}>
          <Text strong style={{ fontSize: 12 }}>注意事项：</Text>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
            <li>
              <Text type="secondary" style={{ fontSize: 12 }}>
                必须使用绝对路径（以 / 开头）
              </Text>
            </li>
            <li>
              <Text type="secondary" style={{ fontSize: 12 }}>
                避免使用系统目录（如 /etc, /usr, /bin）
              </Text>
            </li>
            <li>
              <Text type="secondary" style={{ fontSize: 12 }}>
                建议使用专用的 Agent 工作目录
              </Text>
            </li>
            <li>
              <Text type="secondary" style={{ fontSize: 12 }}>
                确保磁盘空间充足
              </Text>
            </li>
          </ul>
        </div>
      </Card>

      {/* Quick Tips */}
      <div className="workspace-tips" style={{ marginTop: 16 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <WarningOutlined /> 提示：不同的 Agent 建议使用不同的工作空间，避免文件冲突
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <FolderOutlined /> 路径示例：/home/admin/.openclaw/workspace/agents/{agentName || 'agent-name'}
          </Text>
        </Space>
      </div>
    </div>
  );
};

export default WorkspaceConfig;
