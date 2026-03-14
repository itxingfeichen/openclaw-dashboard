import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Typography, Space, Button, Switch, Card, Row, Col, message, Empty } from 'antd';
import { AppstoreOutlined, UnorderedListOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AgentFilter from '../../components/AgentFilter';
import AgentTable from '../../components/AgentTable';
import AgentCard from '../../components/AgentCard';
import { fetchAgents, startAgent, stopAgent, restartAgent, getAgentStatus } from '../../services/agentService';

const { Content } = Layout;
const { Title, Text } = Typography;

/**
 * AgentsPage Component
 * Main page for Agent management with list/card views, search, filter, and pagination
 */
const AgentsPage = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  /**
   * Navigate to create agent page
   */
  const handleCreateAgent = () => {
    navigate('/agents/create');
  };

  /**
   * Load agents data
   */
  const loadAgents = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
        ...params,
      };

      const result = await fetchAgents(queryParams);
      
      setAgents(result.data || []);
      setPagination(prev => ({
        ...prev,
        total: result.total || 0,
        current: result.page || 1,
      }));

      if (result.data?.length === 0 && pagination.current > 1) {
        // If no data on current page, go back to first page
        loadAgents({ page: 1 });
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
      message.error('加载 Agent 列表失败，请稍后重试');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  // Initial load
  useEffect(() => {
    loadAgents();
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
   * Handle table pagination/sorting/filtering changes
   */
  const handleTableChange = (newPagination, newFilters, newSorter) => {
    const newFiltersState = { ...filters };
    
    if (newSorter.field) {
      newFiltersState.sortBy = newSorter.field;
      newFiltersState.sortOrder = newSorter.order === 'ascend' ? 'asc' : 'desc';
    }
    
    if (newFilters.status) {
      newFiltersState.status = Array.isArray(newFilters.status) 
        ? newFilters.status[0] 
        : newFilters.status;
    }

    setFilters(newFiltersState);
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: newPagination.total,
    });
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    loadAgents();
    message.success('刷新成功');
  };

  /**
   * Handle view mode toggle
   */
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'table' ? 'card' : 'table');
  };

  return (
    <Content style={{ padding: '24px', minHeight: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Agent 管理
            </Title>
            <Text type="secondary">
              管理所有 Agent，查看状态和详情
            </Text>
          </Col>
          <Col>
            <Space>
              <Button 
                type={viewMode === 'table' ? 'primary' : 'default'}
                icon={<UnorderedListOutlined />}
                onClick={() => setViewMode('table')}
              >
                表格
              </Button>
              <Button 
                type={viewMode === 'card' ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode('card')}
              >
                卡片
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateAgent}>
                新建 Agent
              </Button>
            </Space>
          </Col>
        </Row>

        <AgentFilter
          onFilter={handleFilterChange}
          onRefresh={handleRefresh}
          loading={loading}
        />
      </div>

      <Card bordered={false}>
        {viewMode === 'table' ? (
          <AgentTable
            data={agents}
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            onRefresh={loadAgents}
          />
        ) : (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text>加载中...</Text>
              </div>
            ) : agents.length > 0 ? (
              <Row gutter={[16, 16]}>
                {agents.map(agent => (
                  <Col
                    key={agent.id}
                    xs={24}
                    sm={12}
                    md={8}
                    lg={6}
                    xl={4}
                  >
                    <AgentCard agent={agent} onRefresh={loadAgents} />
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="暂无 Agent 数据" />
            )}
            
            {/* Card view pagination */}
            {!loading && agents.length > 0 && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: 24,
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}>
                <Button
                  onClick={() => setPagination(p => ({ ...p, current: Math.max(1, p.current - 1) }))}
                  disabled={pagination.current === 1}
                >
                  上一页
                </Button>
                <Text style={{ lineHeight: '32px' }}>
                  第 {pagination.current} 页，共 {Math.ceil(pagination.total / pagination.pageSize)} 页
                </Text>
                <Button
                  onClick={() => setPagination(p => ({ 
                    ...p, 
                    current: Math.min(Math.ceil(p.total / p.pageSize), p.current + 1) 
                  }))}
                  disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                >
                  下一页
                </Button>
                <Space>
                  <Text>每页:</Text>
                  <Button
                    size="small"
                    type={pagination.pageSize === 10 ? 'primary' : 'default'}
                    onClick={() => setPagination(p => ({ ...p, pageSize: 10, current: 1 }))}
                  >
                    10
                  </Button>
                  <Button
                    size="small"
                    type={pagination.pageSize === 20 ? 'primary' : 'default'}
                    onClick={() => setPagination(p => ({ ...p, pageSize: 20, current: 1 }))}
                  >
                    20
                  </Button>
                  <Button
                    size="small"
                    type={pagination.pageSize === 50 ? 'primary' : 'default'}
                    onClick={() => setPagination(p => ({ ...p, pageSize: 50, current: 1 }))}
                  >
                    50
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </Card>
    </Content>
  );
};

export default AgentsPage;
