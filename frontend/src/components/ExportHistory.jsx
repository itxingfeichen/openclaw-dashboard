import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Card,
  Typography,
  Input,
  Select,
  DatePicker,
  Popconfirm,
  message,
  Empty,
} from 'antd';
import {
  DownloadOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import {
  getExportHistory,
  downloadExport,
  deleteExportRecord,
  EXPORT_TYPES,
  EXPORT_FORMATS,
} from '../services/exportService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * ExportHistory Component
 * Displays export history with filtering, search, and download capabilities
 */
const ExportHistory = ({ onRefresh }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    format: '',
    status: '',
    dateRange: null,
  });

  /**
   * Load export history
   */
  const loadHistory = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
        ...params,
      };

      // Convert date range to string format
      if (queryParams.dateRange) {
        queryParams.startDate = queryParams.dateRange[0].format('YYYY-MM-DD');
        queryParams.endDate = queryParams.dateRange[1].format('YYYY-MM-DD');
        delete queryParams.dateRange;
      }

      const result = await getExportHistory(queryParams);

      setHistory(result.data || []);
      setPagination(prev => ({
        ...prev,
        total: result.total || 0,
        current: result.page || 1,
      }));

      if (result.data?.length === 0 && pagination.current > 1) {
        loadHistory({ page: 1 });
      }
    } catch (error) {
      console.error('Failed to load export history:', error);
      message.error('加载导出历史失败，请稍后重试');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  // Initial load
  useEffect(() => {
    loadHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen to parent refresh
  useEffect(() => {
    if (onRefresh) {
      const unsubscribe = onRefresh(() => loadHistory());
      return unsubscribe;
    }
  }, [onRefresh, loadHistory]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  /**
   * Handle table pagination/sorting/filtering changes
   */
  const handleTableChange = (newPagination, newFilters, newSorter) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: newPagination.total,
    });
  };

  /**
   * Handle download
   */
  const handleDownload = async (record) => {
    try {
      await downloadExport(record.id, record.filename || `export-${record.id}.${record.format}`);
      message.success('下载成功');
    } catch (error) {
      console.error('Download failed:', error);
      message.error('下载失败，请稍后重试');
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = async (recordId) => {
    try {
      await deleteExportRecord(recordId);
      message.success('删除成功');
      loadHistory();
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('删除失败，请稍后重试');
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    loadHistory();
    message.success('刷新成功');
  };

  /**
   * Get type label
   */
  const getTypeLabel = (type) => {
    const labels = {
      [EXPORT_TYPES.AGENT]: 'Agent',
      [EXPORT_TYPES.TASK]: '任务',
      [EXPORT_TYPES.LOG]: '日志',
      [EXPORT_TYPES.CONFIG]: '配置',
    };
    return labels[type] || type;
  };

  /**
   * Get format label
   */
  const getFormatLabel = (format) => {
    const labels = {
      [EXPORT_FORMATS.CSV]: 'CSV',
      [EXPORT_FORMATS.JSON]: 'JSON',
      [EXPORT_FORMATS.XLSX]: 'XLSX',
    };
    return labels[format] || format;
  };

  /**
   * Get status tag
   */
  const getStatusTag = (status) => {
    const config = {
      completed: { color: 'success', icon: <CheckCircleOutlined />, text: '已完成' },
      processing: { color: 'processing', icon: <ClockCircleOutlined />, text: '进行中' },
      failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
      cancelled: { color: 'warning', icon: <CloseCircleOutlined />, text: '已取消' },
      pending: { color: 'default', icon: <ClockCircleOutlined />, text: '待处理' },
    };
    const { color, icon, text } = config[status] || config.pending;
    return <Tag color={color} icon={icon}>{text}</Tag>;
  };

  /**
   * Table columns
   */
  const columns = [
    {
      title: '导出 ID',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      ellipsis: true,
    },
    {
      title: '数据类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => <Tag color="blue">{getTypeLabel(type)}</Tag>,
    },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      width: 80,
      render: (format) => getFormatLabel(format),
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      key: 'recordCount',
      width: 90,
      sorter: true,
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 90,
      render: (size) => {
        if (!size) return '-';
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => date ? new Date(date).toLocaleString() : '-',
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'completed' && (
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            >
              下载
            </Button>
          )}
          <Popconfirm
            title="确定要删除这条导出记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card className="export-history-card" bordered={false}>
      {/* Header */}
      <div className="history-header" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <FileTextOutlined /> 导出历史
            </Title>
            <Text type="secondary">查看和管理历史导出记录</Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
          </Col>
        </Row>
      </div>

      {/* Filters */}
      <Card size="small" className="filter-card" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8} md={4}>
            <Input
              placeholder="搜索导出 ID"
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onPressEnter={() => loadHistory()}
              allowClear
            />
          </Col>
          <Col xs={24} sm={6} md={3}>
            <Select
              placeholder="数据类型"
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value={EXPORT_TYPES.AGENT}>Agent</Option>
              <Option value={EXPORT_TYPES.TASK}>任务</Option>
              <Option value={EXPORT_TYPES.LOG}>日志</Option>
              <Option value={EXPORT_TYPES.CONFIG}>配置</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6} md={3}>
            <Select
              placeholder="导出格式"
              value={filters.format}
              onChange={(value) => handleFilterChange('format', value)}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value={EXPORT_FORMATS.CSV}>CSV</Option>
              <Option value={EXPORT_FORMATS.JSON}>JSON</Option>
              <Option value={EXPORT_FORMATS.XLSX}>XLSX</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6} md={3}>
            <Select
              placeholder="状态"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="completed">已完成</Option>
              <Option value="processing">进行中</Option>
              <Option value="failed">失败</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="pending">待处理</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={history}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowKey="id"
        scroll={{ x: 1200 }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无导出记录"
            />
          ),
        }}
      />
    </Card>
  );
};

export default ExportHistory;
