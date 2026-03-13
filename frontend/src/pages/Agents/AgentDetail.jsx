import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout, Typography, Card, Descriptions, Tag, Space, 
  Button, Divider, Spin, Alert, Empty, Breadcrumb, message, Badge 
} from 'antd';
import { 
  ArrowLeftOutlined, ClockOutlined, IdcardOutlined, 
  VersionOutlined, CheckCircleOutlined, SyncOutlined 
} from '@ant-design/icons';
import { fetchAgentById, getStatusColor } from '../../services/agentService';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

/**
 * AgentDetail Component
 * Displays detailed information about a single agent
 */
const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAgent = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAgentById(id);
        setAgent(data);
      } catch (err) {
        console.error('Failed to load agent:', err);
        setError(err.message || '加载失败');
        message.error('加载 Agent 详情失败');
      } finally {
        setLoading(false);
      }
    };

    loadAgent();
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return '活跃';
      case 'inactive':
        return '未激活';
      case 'unknown':
        return '未知';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Content style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" tip="加载中..." />
      </Content>
    );
  }

  if (error || !agent) {
    return (
      <Content style={{ padding: '24px' }}>
        <Alert
          message="加载失败"
          description={error || '未找到该 Agent'}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/agents')}>
              返回列表
            </Button>
          }
        />
      </Content>
    );
  }

  return (
    <Content style={{ padding: '24px' }}>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <Button type="link" onClick={() => navigate('/agents')} icon={<ArrowLeftOutlined />}>
            Agent 列表
          </Button>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{agent.name}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Space align="start">
          <div style={{ 
            width: 80, 
            height: 80, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 36,
            fontWeight: 'bold',
          }}>
            {agent.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <Space>
                {agent.name}
                <Badge status={getStatusColor(agent.status)} />
              </Space>
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {agent.description}
            </Text>
          </div>
        </Space>
      </div>

      {/* Basic Info Card */}
      <Card 
        title="基本信息" 
        size="small"
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Button icon={<SyncOutlined />} onClick={() => window.location.reload()}>
              刷新
            </Button>
            <Button type="primary">编辑</Button>
          </Space>
        }
      >
        <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 3 }} bordered>
          <Descriptions.Item 
            label="Agent ID" 
            labelStyle={{ fontWeight: 'bold' }}
          >
            <Space>
              <IdcardOutlined />
              <Text code copyable>{agent.id}</Text>
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item 
            label="状态" 
            labelStyle={{ fontWeight: 'bold' }}
          >
            <Tag color={getStatusColor(agent.status)}>
              {getStatusText(agent.status)}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item 
            label="版本" 
            labelStyle={{ fontWeight: 'bold' }}
          >
            <Space>
              <VersionOutlined />
              {agent.version}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item 
            label="创建时间" 
            labelStyle={{ fontWeight: 'bold' }}
          >
            <Space>
              <ClockOutlined />
              {formatDate(agent.createdAt)}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item 
            label="更新时间" 
            labelStyle={{ fontWeight: 'bold' }}
          >
            <Space>
              <ClockOutlined />
              {formatDate(agent.updatedAt)}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item 
            label="运行状态" 
            labelStyle={{ fontWeight: 'bold' }}
          >
            {agent.status === 'active' ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                正常运行
              </Tag>
            ) : agent.status === 'inactive' ? (
              <Tag color="default">已停止</Tag>
            ) : (
              <Tag color="warning" icon={<SyncOutlined spin />}>
                状态未知
              </Tag>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Capabilities Card */}
      <Card 
        title="能力列表" 
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Space wrap>
          {agent.capabilities?.map((cap, index) => (
            <Tag key={index} color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>
              {cap}
            </Tag>
          ))}
          {(!agent.capabilities || agent.capabilities.length === 0) && (
            <Text type="secondary">暂无能力信息</Text>
          )}
        </Space>
      </Card>

      {/* Description Card */}
      <Card title="详细描述" size="small">
        <Paragraph style={{ fontSize: 14, lineHeight: 1.8 }}>
          {agent.description || '暂无描述信息'}
        </Paragraph>
      </Card>

      {/* Action Buttons */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Space>
          <Button onClick={() => navigate('/agents')} icon={<ArrowLeftOutlined />}>
            返回列表
          </Button>
          <Button type="primary">编辑 Agent</Button>
          <Button danger>删除 Agent</Button>
        </Space>
      </div>
    </Content>
  );
};

export default AgentDetail;
