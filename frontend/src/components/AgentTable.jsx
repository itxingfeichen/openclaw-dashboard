import React from 'react';
import { Table, Tag, Space, Typography, Button, message, Popconfirm } from 'antd';
import { EyeOutlined, PlayCircleOutlined, StopOutlined, ReloadOutlined } from '@ant-design/icons';
import { getStatusColor, startAgent, stopAgent, restartAgent } from '../services/agentService';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

/**
 * AgentTable Component
 * Displays agent information in table format
 */
const AgentTable = ({ data, loading, pagination, onChange, onRefresh }) => {
  const navigate = useNavigate();

  /**
   * Handle agent start
   */
  const handleStart = async (id) => {
    try {
      const result = await startAgent(id);
      if (result.success) {
        message.success(`Agent ${id} 启动成功`);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      message.error(`启动失败：${error.message}`);
    }
  };

  /**
   * Handle agent stop
   */
  const handleStop = async (id) => {
    try {
      const result = await stopAgent(id);
      if (result.success) {
        message.success(`Agent ${id} 停止成功`);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      message.error(`停止失败：${error.message}`);
    }
  };

  /**
   * Handle agent restart
   */
  const handleRestart = async (id) => {
    try {
      const result = await restartAgent(id);
      if (result.success) {
        message.success(`Agent ${id} 重启成功`);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      message.error(`重启失败：${error.message}`);
    }
  };

  const columns = [
    {
      title: 'Agent ID',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (text) => (
        <Text copyable={{ text }} style={{ fontFamily: 'monospace' }}>
          {text}
        </Text>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Text strong>{text}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: '活跃', value: 'active' },
        { text: '未激活', value: 'inactive' },
        { text: '未知', value: 'unknown' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status === 'active' ? '活跃' : status === 'inactive' ? '未激活' : '未知'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['md'],
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      responsive: ['lg'],
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => new Date(date).toLocaleString('zh-CN'),
      responsive: ['lg'],
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="确定要启动此 Agent 吗？"
            onConfirm={() => handleStart(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              disabled={record.status === 'active' || record.status === 'running'}
            >
              启动
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确定要停止此 Agent 吗？"
            onConfirm={() => handleStop(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              icon={<StopOutlined />}
              danger
              disabled={record.status === 'inactive' || record.status === 'stopped'}
            >
              停止
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确定要重启此 Agent 吗？"
            onConfirm={() => handleRestart(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              icon={<ReloadOutlined />}
            >
              重启
            </Button>
          </Popconfirm>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/agents/${record.id}`)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      pagination={{
        ...pagination,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        pageSizeOptions: ['10', '20', '50'],
      }}
      onChange={onChange}
      scroll={{ x: 1200 }}
      size="middle"
    />
  );
};

export default AgentTable;
