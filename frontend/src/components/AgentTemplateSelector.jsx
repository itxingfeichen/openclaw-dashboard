import React, { useState, useEffect } from 'react';
import { Card, List, Button, Space, Tag, Typography, Modal, Descriptions, message, Spin, Empty } from 'antd';
import { BlockOutlined, EyeOutlined, CheckOutlined } from '@ant-design/icons';
import { fetchTemplates } from '../services/agentService';

const { Text, Paragraph, Title } = Typography;

/**
 * AgentTemplateSelector Component
 * Allows users to browse and select from preset agent templates
 */
const AgentTemplateSelector = ({ onApplyTemplate, loading }) => {
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  /**
   * Load templates on mount
   */
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const result = await fetchTemplates();
      setTemplates(result.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      message.error('加载模板失败');
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  /**
   * Handle template selection
   */
  const handleApplyTemplate = (template) => {
    if (onApplyTemplate) {
      onApplyTemplate({
        name: template.name,
        model: template.model,
        tools: template.tools,
        workspacePath: template.workspacePath,
        description: template.description,
        templateId: template.id,
      });
      message.success(`已应用模板：${template.name}`);
    }
  };

  /**
   * Show template details
   */
  const showDetails = (template) => {
    setSelectedTemplate(template);
    setDetailVisible(true);
  };

  /**
   * Get tool display name
   */
  const getToolName = (toolKey) => {
    const toolMap = {
      read: '文件读取',
      write: '文件写入',
      edit: '文件编辑',
      exec: '命令执行',
      web_search: '网络搜索',
      web_fetch: '网页抓取',
      browser: '浏览器控制',
      message: '消息发送',
      tts: '语音合成',
      image: '图像分析',
      pdf: 'PDF 分析',
    };
    return toolMap[toolKey] || toolKey;
  };

  if (loadingTemplates) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin tip="加载模板中..." />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Empty description="暂无可用模板" />
    );
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <BlockOutlined /> 选择预设模板
        </Title>
        <Text type="secondary">
          选择模板可快速填充表单，也可手动填写
        </Text>
      </div>

      <List
        grid={{ gutter: 16, column: 2 }}
        dataSource={templates}
        loading={loading}
        renderItem={(template) => (
          <List.Item>
            <Card
              hoverable
              size="small"
              title={template.name}
              extra={
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => showDetails(template)}
                  disabled={loading}
                >
                  详情
                </Button>
              }
              actions={[
                <Button
                  key="apply"
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleApplyTemplate(template)}
                  disabled={loading}
                  block
                >
                  应用此模板
                </Button>,
              ]}
              style={{ height: '100%' }}
            >
              <Paragraph
                ellipsis={{ rows: 2 }}
                style={{ marginBottom: 12, minHeight: 44 }}
              >
                {template.description}
              </Paragraph>
              
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  模型：{template.model}
                </Text>
              </div>
              
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  工具：
                </Text>
                <Space size={[4, 4]} wrap style={{ marginTop: 4 }}>
                  {(template.tools || []).slice(0, 4).map((tool, index) => (
                    <Tag key={index} color="blue" style={{ fontSize: 11 }}>
                      {getToolName(tool)}
                    </Tag>
                  ))}
                  {(template.tools || []).length > 4 && (
                    <Tag color="default">+{(template.tools || []).length - 4}</Tag>
                  )}
                </Space>
              </div>
            </Card>
          </List.Item>
        )}
      />

      {/* Template Detail Modal */}
      <Modal
        title={
          <Space>
            <BlockOutlined />
            {selectedTemplate?.name}
          </Space>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => setDetailVisible(false)}
            disabled={loading}
          >
            关闭
          </Button>,
          <Button
            key="apply"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              if (selectedTemplate) {
                handleApplyTemplate(selectedTemplate);
                setDetailVisible(false);
              }
            }}
            disabled={loading}
          >
            应用此模板
          </Button>,
        ]}
        width={600}
      >
        {selectedTemplate && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="模板名称">
              {selectedTemplate.name}
            </Descriptions.Item>
            <Descriptions.Item label="模板 ID">
              {selectedTemplate.id}
            </Descriptions.Item>
            <Descriptions.Item label="描述">
              {selectedTemplate.description}
            </Descriptions.Item>
            <Descriptions.Item label="AI 模型">
              {selectedTemplate.model}
            </Descriptions.Item>
            <Descriptions.Item label="工作空间">
              <Text code>{selectedTemplate.workspacePath}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="工具权限">
              <Space wrap>
                {(selectedTemplate.tools || []).map((tool, index) => (
                  <Tag key={index} color="blue">
                    {getToolName(tool)}
                  </Tag>
                ))}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default AgentTemplateSelector;
