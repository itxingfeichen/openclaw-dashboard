import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Typography, Card, Row, Col, Statistic, message, Empty } from 'antd';
import { UnorderedListOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import TaskFilter from '../../components/TaskFilter';
import TaskList from '../../components/TaskList';
import TaskDetail from '../../components/TaskDetail';
import { fetchTasks, fetchTaskById, fetchTaskStats } from '../../services/taskService';
import './Tasks.css';

const { Content } = Layout;
const { Title, Text } = Typography;

/**
 * TasksPage Component
 * Main page for Task management with list view, filters, and detail view
 */
const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    agentId: '',
    type: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    done: 0,
    failed: 0,
  });

  /**
   * Load tasks data
   */
  const loadTasks = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
        ...params,
      };

      const result = await fetchTasks(queryParams);
      
      setTasks(result.data || []);
      setPagination(prev => ({
        ...prev,
        total: result.total || 0,
        current: result.page || 1,
      }));

      if (result.data?.length === 0 && pagination.current > 1) {
        // If no data on current page, go back to first page
        loadTasks({ page: 1 });
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      message.error('加载任务列表失败，请稍后重试');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  /**
   * Load task statistics
   */
  const loadStats = useCallback(async () => {
    try {
      const result = await fetchTaskStats();
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  /**
   * Load task detail
   */
  const loadTaskDetail = useCallback(async (taskId) => {
    setDetailLoading(true);
    try {
      const task = await fetchTaskById(taskId);
      setSelectedTask(task);
    } catch (error) {
      console.error('Failed to load task detail:', error);
      message.error('加载任务详情失败');
      setSelectedTask(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTasks();
    loadStats();
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
    loadTasks();
    loadStats();
    if (selectedTask) {
      loadTaskDetail(selectedTask.id);
    }
    message.success('刷新成功');
  };

  /**
   * Handle task selection
   */
  const handleTaskSelect = (taskId) => {
    loadTaskDetail(taskId);
  };

  /**
   * Handle back to list
   */
  const handleBackToList = () => {
    setSelectedTask(null);
  };

  return (
    <Content className="tasks-page-content">
      {/* Header */}
      <div className="tasks-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} className="tasks-title">
              任务管理
            </Title>
            <Text type="secondary" className="tasks-subtitle">
              查看所有任务状态，跟踪任务进度
            </Text>
          </Col>
          <Col>
            <Row gutter={16}>
              <Col>
                <Card className="stat-card stat-card-total">
                  <Statistic
                    title="总任务数"
                    value={stats.total}
                    prefix={<UnorderedListOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col>
                <Card className="stat-card stat-card-running">
                  <Statistic
                    title="运行中"
                    value={stats.running}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col>
                <Card className="stat-card stat-card-done">
                  <Statistic
                    title="已完成"
                    value={stats.done}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col>
                <Card className="stat-card stat-card-failed">
                  <Statistic
                    title="失败"
                    value={stats.failed}
                    prefix={<CloseCircleOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      {/* Filter Bar */}
      <Card className="tasks-filter-card" bordered={false}>
        <TaskFilter
          onFilter={handleFilterChange}
          onRefresh={handleRefresh}
          loading={loading}
        />
      </Card>

      {/* Main Content */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        {/* Task List */}
        <Col xs={24} lg={selectedTask ? 14 : 24}>
          <Card bordered={false} className="task-list-card">
            {selectedTask && (
              <div className="back-button-container" style={{ marginBottom: 16 }}>
                <a onClick={handleBackToList} style={{ cursor: 'pointer' }}>
                  ← 返回列表
                </a>
              </div>
            )}
            
            {!selectedTask ? (
              <TaskList
                data={tasks}
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
                onTaskSelect={handleTaskSelect}
              />
            ) : (
              <TaskDetail task={selectedTask} loading={detailLoading} />
            )}
            
            {!loading && !selectedTask && tasks.length === 0 && (
              <Empty description="暂无任务数据" />
            )}
          </Card>
        </Col>

        {/* Task Detail Panel (only on large screens when task selected) */}
        {selectedTask && (
          <Col xs={24} lg={10}>
            <Card 
              bordered={false} 
              className="task-detail-panel"
              title="任务详情"
            >
              <TaskDetail task={selectedTask} loading={detailLoading} />
            </Card>
          </Col>
        )}
      </Row>
    </Content>
  );
};

export default TasksPage;
