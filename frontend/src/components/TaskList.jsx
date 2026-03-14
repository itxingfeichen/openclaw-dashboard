import React from 'react';
import { Table, Tag, Space, Typography, Button, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { getTaskStatusColor, getTaskStatusLabel, formatRuntime, formatDate } from '../services/taskService';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

/**
 * TaskList Component
 * Displays task information in table format
 */
const TaskList = ({ data, loading, pagination, onChange }) => {
  const navigate = useNavigate();

  const columns = [
    {
      title: '任务 ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (text) => (
        <Text copyable={{ text }} style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Agent',
      dataIndex: 'agentName',
      key: 'agentName',
      width: 150,
      sorter: (a, b) => a.agentName.localeCompare(b.agentName),
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
        { text: '运行中', value: 'running' },
        { text: '已完成', value: 'done' },
        { text: '失败', value: 'failed' },
        { text: '待处理', value: 'pending' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={getTaskStatusColor(status)}>
          {getTaskStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      filters: [
        { text: '数据处理', value: 'data-processing' },
        { text: '代码审查', value: 'code-review' },
        { text: '客户支持', value: 'support' },
        { text: '分析', value: 'analytics' },
        { text: '安全扫描', value: 'security-scan' },
        { text: '文档解析', value: 'parsing' },
        { text: '调度', value: 'scheduling' },
        { text: '翻译', value: 'translation' },
      ],
      onFilter: (value, record) => record.type === value,
      render: (type) => {
        const typeLabels = {
          'data-processing': '数据处理',
          'code-review': '代码审查',
          'support': '客户支持',
          'analytics': '分析',
          'security-scan': '安全扫描',
          'parsing': '文档解析',
          'scheduling': '调度',
          'translation': '翻译',
        };
        return <Text>{typeLabels[type] || type}</Text>;
      },
    },
    {
      title: '标签',
      dataIndex: 'labels',
      key: 'labels',
      width: 150,
      render: (labels) => (
        <Space size={4} wrap>
          {labels && labels.length > 0 ? (
            labels.map((label, index) => (
              <Tag key={index} color="default" style={{ margin: 0 }}>
                {label}
              </Tag>
            ))
          ) : (
            <Text type="secondary">-</Text>
          )}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => (
        <Tooltip title={new Date(date).toLocaleString('zh-CN')}>
          <Text>{formatDate(date)}</Text>
        </Tooltip>
      ),
      responsive: ['lg'],
    },
    {
      title: '运行时长',
      dataIndex: 'runtime',
      key: 'runtime',
      width: 100,
      sorter: (a, b) => a.runtime - b.runtime,
      render: (runtime) => (
        <Text>{formatRuntime(runtime)}</Text>
      ),
      responsive: ['md'],
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/tasks/${record.id}`)}
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

export default TaskList;
