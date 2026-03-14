import React from 'react';
import { Card, Tag, Space, Typography, Badge, Button, message, Popconfirm } from 'antd';
import { ClockCircleOutlined, IdcardOutlined, PlayCircleOutlined, StopOutlined, ReloadOutlined } from '@ant-design/icons';
import { getStatusColor, startAgent, stopAgent, restartAgent } from '../services/agentService';
import { useNavigate } from 'react-router-dom';

const { Text, Paragraph } = Typography;

/**
 * AgentCard Component
 * Displays agent information in card format
 */
const AgentCard = ({ agent, onRefresh }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/agents/${agent.id}`);
  };

  /**
   * Handle agent start
   */
  const handleStart = async (e) => {
    e.stopPropagation();
    try {
      const result = await startAgent(agent.id);
      if (result.success) {
        message.success(`Agent ${agent.id} 启动成功`);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      message.error(`启动失败：${error.message}`);
    }
  };

  /**
   * Handle agent stop
   */
  const handleStop = async (e) => {
    e.stopPropagation();
    try {
      const result = await stopAgent(agent.id);
      if (result.success) {
        message.success(`Agent ${agent.id} 停止成功`);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      message.error(`停止失败：${error.message}`);
    }
  };

  /**
   * Handle agent restart
   */
  const handleRestart = async (e) => {
    e.stopPropagation();
    try {
      const result = await restartAgent(agent.id);
      if (result.success) {
        message.success(`Agent ${agent.id} 重启成功`);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      message.error(`重启失败：${error.message}`);
    }
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
                <ClockCircleOutlined />
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

              {/* Action buttons */}
              <Space style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                <Popconfirm
                  title="确定要启动此 Agent 吗？"
                  onConfirm={handleStart}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    disabled={agent.status === 'active' || agent.status === 'running'}
                  >
                    启动
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title="确定要停止此 Agent 吗？"
                  onConfirm={handleStop}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    size="small"
                    danger
                    icon={<StopOutlined />}
                    disabled={agent.status === 'inactive' || agent.status === 'stopped'}
                  >
                    停止
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title="确定要重启此 Agent 吗？"
                  onConfirm={handleRestart}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                  >
                    重启
                  </Button>
                </Popconfirm>
              </Space>
            </Space>
          </div>
        }
      />
    </Card>
  );
};

export default AgentCard;
