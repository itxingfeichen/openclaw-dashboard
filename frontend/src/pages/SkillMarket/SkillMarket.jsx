import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Typography, Space, Card, Row, Col, message, Empty, Table, Pagination } from 'antd';
import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import SkillFilter from '../../components/SkillFilter';
import SkillCard from '../../components/SkillCard';
import SkillDetail from '../../components/SkillDetail';
import { fetchSkills, CATEGORY_LABELS, SOURCE_LABELS } from '../../services/skillService';

const { Content } = Layout;
const { Title, Text } = Typography;

/**
 * SkillMarket Component
 * Main page for Skill marketplace with list/card views, search, filter, and pagination
 */
const SkillMarket = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('card'); // 'table' or 'card'
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    source: '',
    sortBy: 'downloads',
    sortOrder: 'desc',
  });
  const [currentSource, setCurrentSource] = useState('');

  /**
   * Load skills data
   */
  const loadSkills = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
        ...params,
      };

      const result = await fetchSkills(queryParams);
      
      setSkills(result.data || []);
      setPagination(prev => ({
        ...prev,
        total: result.total || 0,
        current: result.page || 1,
      }));

      if (result.data?.length === 0 && pagination.current > 1) {
        // If no data on current page, go back to first page
        loadSkills({ page: 1 });
      }
    } catch (error) {
      console.error('Failed to load skills:', error);
      message.error('加载技能列表失败，请稍后重试');
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  // Initial load
  useEffect(() => {
    loadSkills();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle filter changes
   */
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    loadSkills();
    message.success('刷新成功');
  };

  /**
   * Handle view mode toggle
   */
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  /**
   * Handle source filter change
   */
  const handleSourceChange = (source) => {
    setCurrentSource(source);
    setFilters(prev => ({
      ...prev,
      source: source || '',
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  /**
   * Handle skill card click
   */
  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
    setDetailVisible(true);
  };

  /**
   * Handle install state change
   */
  const handleInstallChange = (skillId, installed) => {
    setSkills(prevSkills =>
      prevSkills.map(skill =>
        skill.id === skillId ? { ...skill, installed } : skill
      )
    );
    
    if (selectedSkill && selectedSkill.id === skillId) {
      setSelectedSkill(prev => ({ ...prev, installed }));
    }
  };

  /**
   * Handle table pagination/sorting/filtering changes
   */
  const handleTableChange = (newPagination, newFilters, newSorter) => {
    const newFiltersState = { ...filters };
    
    if (newSorter.field) {
      newFiltersState.sortBy = newSorter.field;
      newFiltersState.sortOrder = newSorter.order === 'ascend' ? 'asc' : 'desc';
    }
    
    if (newFilters.category) {
      newFiltersState.category = Array.isArray(newFilters.category) 
        ? newFilters.category[0] 
        : newFilters.category;
    }

    setFilters(newFiltersState);
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: newPagination.total,
    });
  };

  /**
   * Table columns definition
   */
  const columns = [
    {
      title: '技能名称',
      dataIndex: 'displayName',
      key: 'displayName',
      sorter: true,
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          <Text code style={{ fontSize: 12 }}>{record.name}</Text>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'categories',
      key: 'categories',
      render: (categories) => (
        <Space wrap>
          {categories.map((cat, index) => (
            <Tag key={index} color={cat === 'official' ? 'blue' : 'green'}>
              {CATEGORY_LABELS[cat] || cat}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source) => (
        <Tag color={source === 'skillhub' ? 'cyan' : 'geekblue'}>
          {SOURCE_LABELS[source]}
        </Tag>
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      sorter: true,
      render: (rating) => (
        <Space>
          <StarOutlined style={{ color: '#faad14' }} />
          <Text>{rating.toFixed(1)}</Text>
        </Space>
      ),
    },
    {
      title: '下载量',
      dataIndex: 'downloads',
      key: 'downloads',
      sorter: true,
      render: (downloads) => (
        <Space>
          <DownloadOutlined style={{ color: '#1890ff' }} />
          <Text>{downloads}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'installed',
      key: 'installed',
      render: (installed) => (
        <Tag color={installed ? 'success' : 'default'}>
          {installed ? '已安装' : '未安装'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handleSkillClick(record)}
          >
            详情
          </Button>
          {record.installed ? (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => handleInstallChange(record.id, false)}
            >
              卸载
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              onClick={() => handleInstallChange(record.id, true)}
            >
              安装
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Import icons for table
  const { StarOutlined, DownloadOutlined, Tag } = require('antd');

  return (
    <Content style={{ padding: '24px', minHeight: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              技能市场
            </Title>
            <Text type="secondary">
              浏览、搜索和安装技能，扩展您的 Agent 能力
            </Text>
          </Col>
          <Col>
            <Space>
              <Text type="secondary">
                共 {pagination.total} 个技能
              </Text>
            </Space>
          </Col>
        </Row>

        <SkillFilter
          onFilter={handleFilterChange}
          onRefresh={handleRefresh}
          onSourceChange={handleSourceChange}
          onViewModeChange={toggleViewMode}
          viewMode={viewMode}
          loading={loading}
        />
      </div>

      <Card bordered={false}>
        {viewMode === 'table' ? (
          <>
            <Table
              columns={columns}
              dataSource={skills}
              rowKey="id"
              loading={loading}
              pagination={false}
              onChange={handleTableChange}
              onRow={(record) => ({
                onClick: () => handleSkillClick(record),
                style: { cursor: 'pointer' },
              })}
            />
            
            {/* Pagination */}
            {!loading && skills.length > 0 && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: 24,
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
                <Pagination
                  current={pagination.current}
                  total={pagination.total}
                  pageSize={pagination.pageSize}
                  onChange={(page, pageSize) => {
                    setPagination(prev => ({
                      ...prev,
                      current: page,
                      pageSize: pageSize || prev.pageSize,
                    }));
                  }}
                  showSizeChanger
                  showTotal={(total) => `共 ${total} 条`}
                  pageSizeOptions={['12', '24', '48', '96']}
                />
              </div>
            )}
          </>
        ) : (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text>加载中...</Text>
              </div>
            ) : skills.length > 0 ? (
              <Row gutter={[16, 16]}>
                {skills.map(skill => (
                  <Col
                    key={skill.id}
                    xs={24}
                    sm={12}
                    md={8}
                    lg={6}
                    xl={4}
                  >
                    <SkillCard 
                      skill={skill} 
                      onInstallChange={handleInstallChange}
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty 
                description="暂无技能数据" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
            
            {/* Card view pagination */}
            {!loading && skills.length > 0 && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: 24,
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}>
                <Pagination
                  current={pagination.current}
                  total={pagination.total}
                  pageSize={pagination.pageSize}
                  onChange={(page, pageSize) => {
                    setPagination(prev => ({
                      ...prev,
                      current: page,
                      pageSize: pageSize || prev.pageSize,
                    }));
                  }}
                  showSizeChanger
                  showTotal={(total) => `共 ${total} 条`}
                  pageSizeOptions={['12', '24', '48', '96']}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Skill Detail Modal */}
      <SkillDetail
        skill={selectedSkill}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onInstallChange={handleInstallChange}
      />
    </Content>
  );
};

export default SkillMarket;
