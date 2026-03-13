import React from 'react';
import { Card, Tag, Space, Typography, Badge } from 'antd';
import { ClockOutlined, IdcardOutlined } from '@ant-design/icons';
import { getStatusColor } from '../services/agentService';
import { useNavigate } from 'react-router-dom';

const { Text, Paragraph } = Typography;

/**
 * AgentCard Component
 * Displays agent information in card format
 */
const AgentCard = ({ agent }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/agents/${agent.id}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <Card
      hoverable
      onClick={handleClick}
      style={{ height: '100%', cursor: 'pointer' }}
      cover={
        <div style={{ 
          height: 120, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 48,
          fontWeight: 'bold',
        }}>
          {agent.name.charAt(0).toUpperCase()}
        </div>
      }
    >
      <Card.Meta
        title={
          <Space>
            <Text strong style={{ fontSize: 16 }}>
              {agent.name}
            </Text>
            <Badge status={getStatusColor(agent.status)} />
          </Space>
        }
        description={
          <div>
            <Paragraph
              ellipsis={{ rows: 2 }}
              style={{ marginBottom: 8, height: 44 }}
            >
              {agent.description}
            </Paragraph>
            
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space>
                <IdcardOutlined />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {agent.id}
                </Text>
              </Space>
              
              <Space>
                <ClockOutlined />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  创建于 {formatDate(agent.createdAt)}
                </Text>
              </Space>
              
              <Space wrap>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  版本：{agent.version}
                </Text>
                {agent.capabilities?.slice(0, 3).map((cap, index) => (
                  <Tag key={index} color="blue" style={{ fontSize: 11 }}>
                    {cap}
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

export default AgentCard;
