import React from 'react';
import { Table, Tag, Space, Typography, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { getStatusColor } from '../services/agentService';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

/**
 * AgentTable Component
 * Displays agent information in table format
 */
const AgentTable = ({ data, loading, pagination, onChange }) => {
  const navigate = useNavigate();

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
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/agents/${record.id}`)}
        >
          详情
        </Button>
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
