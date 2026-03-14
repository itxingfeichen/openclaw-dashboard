import React, { useState, useCallback, useMemo } from 'react';
import { 
  Layout, Typography, Card, Row, Col, message, 
  Button, Space, Form, Input, Select, Divider, 
  Descriptions, Modal, Alert, Steps, Progress 
} from 'antd';
import { 
  ArrowLeftOutlined, 
  CheckCircleOutlined, 
  LeftOutlined, 
  RightOutlined,
  SaveOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import WizardSteps from '../../components/WizardSteps';
import ToolPermissionConfig from '../../components/ToolPermissionConfig';
import WorkspaceConfig from '../../components/WorkspaceConfig';
import { createAgent, validateAgentConfig } from '../../services/agentService';
import './AgentCreateWizard.css';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Available models
const AVAILABLE_MODELS = [
  { value: 'qwen3.5-plus', label: 'Qwen 3.5 Plus' },
  { value: 'qwencode/qwen3.5-plus', label: 'QwenCode 3.5 Plus' },
  { value: 'qwen3.5-vl', label: 'Qwen 3.5 VL' },
  { value: 'deepseek-v3', label: 'DeepSeek V3' },
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
];

/**
 * AgentCreateWizard Page
 * Multi-step wizard for creating a new agent with advanced configuration
 */
const AgentCreateWizard = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationStep, setCreationStep] = useState(0);
  
  // Validation state
  const [nameValidation, setNameValidation] = useState({
    status: null,
    message: '',
  });

  // Wizard steps configuration
  const steps = useMemo(() => [
    {
      title: '基本信息',
      description: '填写 Agent 名称和描述',
    },
    {
      title: '模型配置',
      description: '选择 AI 模型',
    },
    {
      title: '工具权限',
      description: '配置工具访问权限',
    },
    {
      title: '工作空间',
      description: '设置工作目录',
    },
    {
      title: '配置预览',
      description: '确认配置信息',
    },
  ], []);

  /**
   * Navigate to previous step
   */
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Validate current step before proceeding
   */
  const validateCurrentStep = async () => {
    try {
      if (currentStep === 0) {
        // Validate basic info
        const values = await form.validateFields(['name', 'description']);
        
        // Validate name format
        const nameRegex = /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/;
        if (!nameRegex.test(values.name)) {
          setNameValidation({
            status: 'invalid',
            message: '名称只能包含字母、数字、中文、下划线和连字符',
          });
          return false;
        }

        if (values.name.length < 2 || values.name.length > 50) {
          setNameValidation({
            status: 'invalid',
            message: '名称长度必须在 2-50 个字符之间',
          });
          return false;
        }

        // Async validation
        setNameValidation({ status: 'validating', message: '正在验证...' });
        const result = await validateAgentConfig({ name: values.name });
        
        if (result.valid) {
          setNameValidation({ status: 'valid', message: '名称可用' });
        } else {
          setNameValidation({ 
            status: 'invalid', 
            message: result.message || '名称已存在' 
          });
          return false;
        }
      } else if (currentStep === 1) {
        // Validate model selection
        await form.validateFields(['model']);
      } else if (currentStep === 2) {
        // Validate tool permissions
        const tools = form.getFieldValue('tools');
        if (!tools || tools.length === 0) {
          message.warning('请至少选择一个工具权限');
          return false;
        }
      } else if (currentStep === 3) {
        // Validate workspace path
        const workspacePath = form.getFieldValue('workspacePath');
        if (!workspacePath || !workspacePath.startsWith('/')) {
          message.warning('请输入有效的工作空间路径（绝对路径）');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  };

  /**
   * Navigate to next step
   */
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    
    if (isValid) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Final step - submit
        handleSubmit();
      }
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    setLoading(true);
    setCreationStep(0);
    setCreationProgress(0);

    try {
      const values = await form.getFieldsValue();
      
      // Step 1: Validate configuration
      setCreationStep(1);
      setCreationProgress(25);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Create agent
      setCreationStep(2);
      setCreationProgress(50);
      
      const agentData = {
        name: values.name,
        description: values.description,
        model: values.model,
        tools: values.tools,
        workspacePath: values.workspacePath,
      };

      const result = await createAgent(agentData);
      
      // Step 3: Initialize workspace
      setCreationStep(3);
      setCreationProgress(75);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Complete
      setCreationStep(4);
      setCreationProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      if (result.success || result.id) {
        message.success('Agent 创建成功！');
        setTimeout(() => {
          navigate(`/agents/${result.id || 'new'}`);
        }, 1000);
      } else {
        throw new Error(result.message || '创建失败');
      }
    } catch (err) {
      console.error('Failed to create agent:', err);
      message.error('创建失败：' + (err.message || '未知错误'));
      setCreationStep(0);
      setCreationProgress(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigate('/agents');
  };

  /**
   * Render step content based on current step
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="wizard-step-content">
            <Title level={4}>基本信息</Title>
            <Paragraph type="secondary">
              请填写 Agent 的基本信息，包括名称和描述
            </Paragraph>
            
            <Divider />
            
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                name: '',
                description: '',
              }}
            >
              <Form.Item
                label="Agent 名称"
                name="name"
                rules={[
                  { required: true, message: '请输入 Agent 名称' },
                  { min: 2, message: '名称至少 2 个字符' },
                  { max: 50, message: '名称最多 50 个字符' },
                ]}
                extra={
                  nameValidation.message && (
                    <Text 
                      type={nameValidation.status === 'invalid' ? 'danger' : 'secondary'}
                    >
                      {nameValidation.message}
                    </Text>
                  )
                }
              >
                <Input
                  placeholder="请输入 Agent 名称（如：数据处理助手）"
                  size="large"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length >= 2) {
                      setNameValidation({ status: 'validating', message: '正在验证...' });
                    } else {
                      setNameValidation({ status: null, message: '' });
                    }
                  }}
                  onBlur={async (e) => {
                    const value = e.target.value;
                    if (value && value.length >= 2) {
                      try {
                        const result = await validateAgentConfig({ name: value });
                        setNameValidation({
                          status: result.valid ? 'valid' : 'invalid',
                          message: result.valid ? '名称可用' : (result.message || '名称已存在'),
                        });
                      } catch (err) {
                        setNameValidation({
                          status: 'invalid',
                          message: '验证失败',
                        });
                      }
                    }
                  }}
                  suffix={
                    nameValidation.status === 'valid' ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : nameValidation.status === 'invalid' ? (
                      <CheckCircleOutlined style={{ color: '#ff4d4f' }} />
                    ) : null
                  }
                />
              </Form.Item>

              <Form.Item
                label="描述"
                name="description"
                rules={[{ max: 500, message: '描述最多 500 个字符' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="简要描述 Agent 的用途和功能（可选）"
                  size="large"
                />
              </Form.Item>
            </Form>
          </div>
        );

      case 1: // Model Selection
        return (
          <div className="wizard-step-content">
            <Title level={4}>模型配置</Title>
            <Paragraph type="secondary">
              选择 Agent 将使用的 AI 模型
            </Paragraph>
            
            <Divider />
            
            <Form
              form={form}
              layout="vertical"
              initialValues={{ model: 'qwen3.5-plus' }}
            >
              <Form.Item
                label="AI 模型"
                name="model"
                rules={[{ required: true, message: '请选择模型' }]}
              >
                <Select size="large" placeholder="选择 AI 模型">
                  {AVAILABLE_MODELS.map(model => (
                    <Option key={model.value} value={model.value}>
                      {model.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Alert
                message="模型选择建议"
                description={
                  <Paragraph style={{ margin: 0 }}>
                    <Text type="secondary">
                      • Qwen 3.5 Plus：通用模型，适合大多数任务<br/>
                      • QwenCode 3.5 Plus：专注于代码开发和技术任务<br/>
                      • Qwen 3.5 VL：支持视觉语言任务<br/>
                      • DeepSeek V3：高性能开源模型<br/>
                      • Claude 3.5 Sonnet：强大的推理和写作能力
                    </Text>
                  </Paragraph>
                }
                type="info"
                showIcon
              />
            </Form>
          </div>
        );

      case 2: // Tool Permissions
        return (
          <div className="wizard-step-content">
            <Title level={4}>工具权限配置</Title>
            <Paragraph type="secondary">
              选择 Agent 可以使用的工具权限
            </Paragraph>
            
            <Divider />
            
            <Form
              form={form}
              layout="vertical"
              initialValues={{ tools: ['read', 'write'] }}
            >
              <Form.Item
                label="工具权限"
                name="tools"
                rules={[
                  { required: true, message: '请至少选择一个工具' },
                  { min: 1, message: '请至少选择一个工具' },
                ]}
              >
                <ToolPermissionConfig
                  value={form.getFieldValue('tools')}
                  onChange={(values) => {
                    form.setFieldValue('tools', values);
                    form.validateFields(['tools']);
                  }}
                  form={form}
                />
              </Form.Item>
            </Form>
          </div>
        );

      case 3: // Workspace
        return (
          <div className="wizard-step-content">
            <Title level={4}>工作空间配置</Title>
            <Paragraph type="secondary">
              设置 Agent 的工作目录路径
            </Paragraph>
            
            <Divider />
            
            <Form
              form={form}
              layout="vertical"
              initialValues={{ 
                workspacePath: '/home/admin/.openclaw/workspace' 
              }}
            >
              <Form.Item
                label="工作空间路径"
                name="workspacePath"
                rules={[
                  { required: true, message: '请输入工作空间路径' },
                  { pattern: /^\/.+/, message: '必须是绝对路径（以 / 开头）' },
                ]}
              >
                <WorkspaceConfig
                  value={form.getFieldValue('workspacePath')}
                  onChange={(value) => {
                    form.setFieldValue('workspacePath', value);
                    form.validateFields(['workspacePath']);
                  }}
                  form={form}
                  agentName={form.getFieldValue('name')}
                />
              </Form.Item>
            </Form>
          </div>
        );

      case 4: // Preview
        return (
          <div className="wizard-step-content preview-step">
            <Title level={4}>配置预览</Title>
            <Paragraph type="secondary">
              请确认以下配置信息，确认无误后点击创建
            </Paragraph>
            
            <Divider />
            
            <Card 
              title="Agent 配置预览" 
              bordered
              extra={<EyeOutlined />}
              style={{ background: '#fafafa' }}
            >
              <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label="Agent 名称">
                  <Text strong>{form.getFieldValue('name') || '-'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="描述">
                  {form.getFieldValue('description') || '无'}
                </Descriptions.Item>
                <Descriptions.Item label="AI 模型">
                  {AVAILABLE_MODELS.find(m => m.value === form.getFieldValue('model'))?.label || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="工具权限">
                  <Space wrap>
                    {(form.getFieldValue('tools') || []).map(tool => (
                      <Tag key={tool} color="blue">{tool}</Tag>
                    ))}
                    {(form.getFieldValue('tools') || []).length === 0 && '-'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="工作空间路径">
                  <Text code style={{ background: '#f5f5f5' }}>
                    {form.getFieldValue('workspacePath') || '-'}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Alert
              message="创建前确认"
              description={
                <Paragraph style={{ margin: 0 }}>
                  <Text type="secondary">
                    点击"创建 Agent"后，系统将：<br/>
                    1. 验证配置的合法性<br/>
                    2. 创建 Agent 实例<br/>
                    3. 初始化工作空间<br/>
                    4. 应用配置并启动
                  </Text>
                </Paragraph>
              }
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  /**
   * Check if current step is complete
   */
  const isStepComplete = () => {
    if (currentStep === 0) {
      return nameValidation.status === 'valid' && form.getFieldValue('name');
    }
    return true;
  };

  return (
    <Content className="agent-create-wizard-page">
      <div className="page-header">
        <Row justify="space-between" align="middle">
          <Col>
            <div className="header-title">
              <ArrowLeftOutlined 
                onClick={handleBack}
                style={{ marginRight: 12, cursor: 'pointer', fontSize: 18 }}
              />
              <Title level={2} style={{ margin: 0, display: 'inline' }}>
                创建 Agent - 向导模式
              </Title>
            </div>
            <Paragraph type="secondary" style={{ marginLeft: 42 }}>
              通过分步向导创建新的 Agent，支持工具权限配置、工作空间设置等高级功能
            </Paragraph>
          </Col>
        </Row>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={18} offset={0}>
          <Card className="wizard-card" bordered={false}>
            {/* Creation Progress (during submission) */}
            {loading && (
              <div className="creation-progress" style={{ marginBottom: 24 }}>
                <Title level={5}>正在创建 Agent...</Title>
                <Steps
                  current={creationStep}
                  items={[
                    { title: '准备' },
                    { title: '验证配置' },
                    { title: '创建 Agent' },
                    { title: '初始化' },
                    { title: '完成' },
                  ]}
                  size="small"
                  style={{ marginBottom: 16 }}
                />
                <Progress 
                  percent={creationProgress} 
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  showInfo={false}
                />
              </div>
            )}

            {/* Wizard Steps Navigation */}
            {!loading && (
              <>
                <WizardSteps
                  current={currentStep}
                  steps={steps}
                  onStepChange={(step) => {
                    if (step <= currentStep) {
                      setCurrentStep(step);
                    }
                  }}
                />

                <Divider style={{ margin: '24px 0' }} />

                {/* Step Content */}
                <div className="wizard-content">
                  {renderStepContent()}
                </div>

                {/* Navigation Buttons */}
                <Divider style={{ margin: '24px 0' }} />

                <div className="wizard-navigation">
                  <Row justify="space-between">
                    <Col>
                      <Button
                        size="large"
                        icon={<LeftOutlined />}
                        onClick={handlePrevious}
                        disabled={currentStep === 0 || loading}
                      >
                        上一步
                      </Button>
                    </Col>
                    <Col>
                      <Space>
                        <Button
                          size="large"
                          onClick={() => {
                            form.resetFields();
                            setNameValidation({ status: null, message: '' });
                            setCurrentStep(0);
                          }}
                          disabled={loading}
                        >
                          重置
                        </Button>
                        {currentStep === steps.length - 1 ? (
                          <Button
                            type="primary"
                            size="large"
                            icon={<SaveOutlined />}
                            onClick={handleSubmit}
                            loading={loading}
                            disabled={!isStepComplete()}
                          >
                            创建 Agent
                          </Button>
                        ) : (
                          <Button
                            type="primary"
                            size="large"
                            icon={<RightOutlined />}
                            onClick={handleNext}
                            loading={loading}
                          >
                            下一步
                          </Button>
                        )}
                      </Space>
                    </Col>
                  </Row>
                </div>
              </>
            )}

            {/* Success State */}
            {creationStep === 4 && (
              <div className="success-state" style={{ 
                textAlign: 'center', 
                padding: '40px 0',
                marginTop: 24,
              }}>
                <CheckCircleOutlined style={{ 
                  fontSize: 48, 
                  color: '#52c41a',
                  marginBottom: 16,
                }} />
                <Title level={3}>创建成功！</Title>
                <Text type="secondary">正在跳转到 Agent 详情页面...</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Right Sidebar - Help & Tips */}
        <Col xs={24} lg={6}>
          <Card 
            title="创建指南" 
            size="small"
            bordered
            className="wizard-sidebar"
          >
            <Paragraph type="secondary">
              <Text strong>步骤 {currentStep + 1}: {steps[currentStep].title}</Text>
            </Paragraph>
            <Paragraph type="secondary" style={{ fontSize: 12 }}>
              {steps[currentStep].description}
            </Paragraph>

            <Divider style={{ margin: '12px 0' }} />

            <div className="sidebar-tips">
              <Text strong style={{ fontSize: 12 }}>提示：</Text>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, fontSize: 12 }}>
                {currentStep === 0 && (
                  <>
                    <li>名称应简洁明了，便于识别</li>
                    <li>描述可以帮助理解 Agent 用途</li>
                    <li>名称一旦创建后不可修改</li>
                  </>
                )}
                {currentStep === 1 && (
                  <>
                    <li>不同模型有不同的专长领域</li>
                    <li>考虑任务类型选择合适的模型</li>
                    <li>模型可以在创建后修改</li>
                  </>
                )}
                {currentStep === 2 && (
                  <>
                    <li>遵循最小权限原则</li>
                    <li>仅选择必要的工具权限</li>
                    <li>高风险工具需谨慎选择</li>
                  </>
                )}
                {currentStep === 3 && (
                  <>
                    <li>工作空间是 Agent 的文件操作根目录</li>
                    <li>使用专用目录避免冲突</li>
                    <li>确保路径存在或有创建权限</li>
                  </>
                )}
                {currentStep === 4 && (
                  <>
                    <li>仔细检查所有配置信息</li>
                    <li>确认无误后再创建</li>
                    <li>创建后部分配置不可修改</li>
                  </>
                )}
              </ul>
            </div>
          </Card>

          <Card 
            title="需要帮助？" 
            size="small"
            bordered
            className="wizard-sidebar"
            style={{ marginTop: 16 }}
          >
            <Paragraph type="secondary" style={{ fontSize: 12 }}>
              查看文档了解如何创建和配置 Agent
            </Paragraph>
            <Button type="link" size="small">
              查看文档 →
            </Button>
          </Card>
        </Col>
      </Row>
    </Content>
  );
};

export default AgentCreateWizard;
