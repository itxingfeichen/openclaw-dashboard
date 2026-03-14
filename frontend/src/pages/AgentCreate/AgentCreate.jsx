import React, { useState, useCallback } from 'react';
import { Layout, Typography, Card, Row, Col, message, Steps, Progress, Alert } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AgentCreateForm from '../../components/AgentCreateForm';
import AgentTemplateSelector from '../../components/AgentTemplateSelector';
import { createAgent } from '../../services/agentService';
import './AgentCreate.css';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

/**
 * AgentCreate Page
 * Main page for creating a new agent
 */
const AgentCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [creationStep, setCreationStep] = useState(0);
  const [creationProgress, setCreationProgress] = useState(0);
  const [templateValues, setTemplateValues] = useState({});
  const [error, setError] = useState(null);

  /**
   * Handle template application
   */
  const handleApplyTemplate = useCallback((values) => {
    setTemplateValues(values);
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    setCreationStep(0);
    setCreationProgress(0);

    try {
      // Step 1: Validate configuration
      setCreationStep(1);
      setCreationProgress(25);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Create agent
      setCreationStep(2);
      setCreationProgress(50);
      
      const agentData = {
        ...values,
        ...(templateValues.templateId && { templateId: templateValues.templateId }),
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
        // Navigate to agent details after short delay
        setTimeout(() => {
          navigate(`/agents/${result.id || 'new'}`);
        }, 1000);
      } else {
        throw new Error(result.message || '创建失败');
      }
    } catch (err) {
      console.error('Failed to create agent:', err);
      setError(err.message || '创建过程中出现错误，请重试');
      message.error('创建失败');
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

  return (
    <Content className="agent-create-page">
      <div className="page-header">
        <Row justify="space-between" align="middle">
          <Col>
            <div className="header-title">
              <ArrowLeftOutlined 
                onClick={handleBack}
                style={{ marginRight: 12, cursor: 'pointer', fontSize: 18 }}
              />
              <Title level={2} style={{ margin: 0, display: 'inline' }}>
                创建 Agent
              </Title>
            </div>
            <Paragraph type="secondary" style={{ marginLeft: 42 }}>
              填写以下信息创建新的 Agent，或选择预设模板快速开始
            </Paragraph>
          </Col>
        </Row>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column - Template Selector */}
        <Col xs={24} lg={10}>
          <Card className="template-card" bordered={false}>
            <AgentTemplateSelector 
              onApplyTemplate={handleApplyTemplate}
              loading={loading}
            />
          </Card>
        </Col>

        {/* Right Column - Creation Form */}
        <Col xs={24} lg={14}>
          <Card className="form-card" bordered={false}>
            {/* Creation Progress */}
            {loading && (
              <div className="creation-progress" style={{ marginBottom: 24 }}>
                <Title level={5}>创建进度</Title>
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

            {/* Error Alert */}
            {error && (
              <Alert
                message="创建失败"
                description={error}
                type="error"
                showIcon
                closable
                style={{ marginBottom: 24 }}
                onClose={() => setError(null)}
              />
            )}

            {/* Success State */}
            {creationStep === 4 && (
              <div className="success-state" style={{ 
                textAlign: 'center', 
                padding: '40px 0',
                marginBottom: 24,
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

            {/* Creation Form */}
            <AgentCreateForm
              onApplyTemplate={handleApplyTemplate}
              initialValues={templateValues}
              onSubmit={handleSubmit}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </Content>
  );
};

export default AgentCreate;
