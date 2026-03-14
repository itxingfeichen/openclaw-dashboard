import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Select, Checkbox, Button, Space, message, Alert, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { validateAgentConfig } from '../services/agentService';

const { TextArea } = Input;
const { Text } = Typography;

const { Option } = Select;

// Available models
const AVAILABLE_MODELS = [
  { value: 'qwen3.5-plus', label: 'Qwen 3.5 Plus' },
  { value: 'qwencode/qwen3.5-plus', label: 'QwenCode 3.5 Plus' },
  { value: 'qwen3.5-vl', label: 'Qwen 3.5 VL' },
  { value: 'deepseek-v3', label: 'DeepSeek V3' },
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
];

// Available tools
const AVAILABLE_TOOLS = [
  { value: 'read', label: '文件读取', description: '读取文件内容' },
  { value: 'write', label: '文件写入', label: '文件写入', description: '创建或写入文件' },
  { value: 'edit', label: '文件编辑', description: '编辑现有文件' },
  { value: 'exec', label: '命令执行', description: '执行 Shell 命令' },
  { value: 'web_search', label: '网络搜索', description: '搜索互联网信息' },
  { value: 'web_fetch', label: '网页抓取', description: '抓取网页内容' },
  { value: 'browser', label: '浏览器控制', description: '控制浏览器自动化' },
  { value: 'message', label: '消息发送', description: '发送消息到渠道' },
  { value: 'tts', label: '语音合成', description: '文本转语音' },
  { value: 'image', label: '图像分析', description: '分析图像内容' },
  { value: 'pdf', label: 'PDF 分析', description: '分析 PDF 文档' },
];

/**
 * AgentCreateForm Component
 * Form for creating a new agent with validation
 */
const AgentCreateForm = ({ onApplyTemplate, initialValues = {}, onSubmit, loading }) => {
  const [form] = Form.useForm();
  const [validationStatus, setValidationStatus] = useState({
    name: null, // 'valid' | 'invalid' | 'validating' | null
    workspacePath: null,
  });
  const [validationMessage, setValidationMessage] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Set initial values when provided
  useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      form.setFieldsValue(initialValues);
      // Trigger validation for pre-filled values
      handleNameBlur({ target: { value: initialValues.name } });
      handlePathBlur({ target: { value: initialValues.workspacePath } });
    }
  }, [initialValues]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Validate agent name (debounced)
   */
  const handleNameChange = useCallback((e) => {
    const value = e.target.value;
    
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (!value || value.length === 0) {
      setValidationStatus(prev => ({ ...prev, name: null }));
      setValidationMessage('');
      return;
    }

    // Set new timer for debounced validation
    const timer = setTimeout(async () => {
      setValidationStatus(prev => ({ ...prev, name: 'validating' }));
      
      try {
        const result = await validateAgentConfig({ 
          name: value,
          workspacePath: form.getFieldValue('workspacePath'),
        });
        
        if (result.valid) {
          setValidationStatus(prev => ({ ...prev, name: 'valid' }));
          setValidationMessage('名称可用');
        } else {
          setValidationStatus(prev => ({ ...prev, name: 'invalid' }));
          setValidationMessage(result.message || '名称已存在');
        }
      } catch (error) {
        setValidationStatus(prev => ({ ...prev, name: 'invalid' }));
        setValidationMessage('验证失败，请重试');
      }
    }, 500);

    setDebounceTimer(timer);
  }, [debounceTimer, form]);

  /**
   * Handle name blur
   */
  const handleNameBlur = useCallback((e) => {
    const value = e.target.value;
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }

    if (!value || value.length === 0) {
      setValidationStatus(prev => ({ ...prev, name: null }));
      return;
    }

    // Validate name format
    const nameRegex = /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/;
    if (!nameRegex.test(value)) {
      setValidationStatus(prev => ({ ...prev, name: 'invalid' }));
      setValidationMessage('名称只能包含字母、数字、中文、下划线和连字符');
      return;
    }

    if (value.length < 2 || value.length > 50) {
      setValidationStatus(prev => ({ ...prev, name: 'invalid' }));
      setValidationMessage('名称长度必须在 2-50 个字符之间');
      return;
    }

    setValidationStatus(prev => ({ ...prev, name: 'validating' }));
    
    validateAgentConfig({ 
      name: value,
      workspacePath: form.getFieldValue('workspacePath'),
    })
      .then(result => {
        if (result.valid) {
          setValidationStatus(prev => ({ ...prev, name: 'valid' }));
          setValidationMessage('名称可用');
        } else {
          setValidationStatus(prev => ({ ...prev, name: 'invalid' }));
          setValidationMessage(result.message || '名称已存在');
        }
      })
      .catch(() => {
        setValidationStatus(prev => ({ ...prev, name: 'invalid' }));
        setValidationMessage('验证失败，请重试');
      });
  }, [debounceTimer, form]);

  /**
   * Validate workspace path
   */
  const handlePathChange = useCallback((e) => {
    const value = e.target.value;
    
    if (!value || value.length === 0) {
      setValidationStatus(prev => ({ ...prev, workspacePath: null }));
      return;
    }

    // Basic path validation
    if (!value.startsWith('/')) {
      setValidationStatus(prev => ({ ...prev, workspacePath: 'invalid' }));
      setValidationMessage('路径必须是绝对路径（以 / 开头）');
      return;
    }

    // Check for invalid characters
    if (/[<>|"?*]/.test(value)) {
      setValidationStatus(prev => ({ ...prev, workspacePath: 'invalid' }));
      setValidationMessage('路径包含无效字符');
      return;
    }

    setValidationStatus(prev => ({ ...prev, workspacePath: 'valid' }));
    setValidationMessage('路径格式有效');
  }, []);

  /**
   * Handle path blur
   */
  const handlePathBlur = useCallback((e) => {
    const value = e.target.value;
    
    if (!value || value.length === 0) {
      setValidationStatus(prev => ({ ...prev, workspacePath: null }));
      return;
    }

    validateAgentConfig({ 
      name: form.getFieldValue('name'),
      workspacePath: value,
    })
      .then(result => {
        if (result.valid) {
          setValidationStatus(prev => ({ ...prev, workspacePath: 'valid' }));
          setValidationMessage('路径可用');
        } else {
          setValidationStatus(prev => ({ ...prev, workspacePath: 'invalid' }));
          setValidationMessage(result.message || '路径不可用');
        }
      })
      .catch(() => {
        setValidationStatus(prev => ({ ...prev, workspacePath: 'invalid' }));
        setValidationMessage('路径验证失败');
      });
  }, [form]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      message.error(`创建失败：${error.message}`);
    }
  };

  /**
   * Get validation status icon for name field
   */
  const getNameSuffix = () => {
    switch (validationStatus.name) {
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

  /**
   * Get validation status icon for path field
   */
  const getPathSuffix = () => {
    switch (validationStatus.workspacePath) {
      case 'valid':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'invalid':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        name: '',
        model: 'qwen3.5-plus',
        tools: ['read', 'write'],
        workspacePath: '/home/admin/.openclaw/workspace',
        description: '',
      }}
    >
      {/* Agent Name */}
      <Form.Item
        label="Agent 名称"
        name="name"
        rules={[
          { required: true, message: '请输入 Agent 名称' },
          { min: 2, message: '名称至少 2 个字符' },
          { max: 50, message: '名称最多 50 个字符' },
          { pattern: /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/, message: '名称只能包含字母、数字、中文、下划线和连字符' },
        ]}
        extra={validationMessage && (
          <Text type={validationStatus.name === 'invalid' ? 'danger' : 'secondary'}>
            {validationMessage}
          </Text>
        )}
      >
        <Input
          placeholder="请输入 Agent 名称"
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          suffix={getNameSuffix()}
          disabled={loading}
        />
      </Form.Item>

      {/* Description */}
      <Form.Item
        label="描述"
        name="description"
        rules={[{ max: 500, message: '描述最多 500 个字符' }]}
      >
        <TextArea
          rows={3}
          placeholder="简要描述 Agent 的用途和功能"
          disabled={loading}
        />
      </Form.Item>

      {/* Model Selection */}
      <Form.Item
        label="模型选择"
        name="model"
        rules={[{ required: true, message: '请选择模型' }]}
      >
        <Select
          placeholder="选择 AI 模型"
          disabled={loading}
        >
          {AVAILABLE_MODELS.map(model => (
            <Option key={model.value} value={model.value}>
              {model.label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* Tool Permissions */}
      <Form.Item
        label="工具权限"
        name="tools"
        rules={[
          { required: true, message: '请至少选择一个工具' },
          { min: 1, message: '请至少选择一个工具' },
        ]}
        extra="选择 Agent 可以使用的工具权限"
      >
        <Checkbox.Group style={{ width: '100%' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {AVAILABLE_TOOLS.map(tool => (
              <Checkbox 
                key={tool.value} 
                value={tool.value}
                disabled={loading}
              >
                <Space>
                  <Text strong>{tool.label}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {tool.description}
                  </Text>
                </Space>
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      </Form.Item>

      {/* Workspace Path */}
      <Form.Item
        label="工作空间路径"
        name="workspacePath"
        rules={[
          { required: true, message: '请输入工作空间路径' },
          { pattern: /^\/.+/, message: '必须是绝对路径（以 / 开头）' },
        ]}
        extra={validationStatus.workspacePath && (
          <Text type={validationStatus.workspacePath === 'invalid' ? 'danger' : 'secondary'}>
            {validationMessage}
          </Text>
        )}
      >
        <Input
          placeholder="/home/admin/.openclaw/workspace"
          onChange={handlePathChange}
          onBlur={handlePathBlur}
          suffix={getPathSuffix()}
          disabled={loading}
        />
      </Form.Item>

      {/* Submit Button */}
      <Form.Item>
        <Space>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            size="large"
          >
            创建 Agent
          </Button>
          <Button 
            htmlType="button"
            disabled={loading}
            onClick={() => form.resetFields()}
          >
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default AgentCreateForm;
