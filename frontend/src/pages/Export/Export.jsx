import React, { useState, useCallback } from 'react';
import { Layout, Typography, Card, Row, Col, Button, Steps, message, Modal, Space } from 'antd';
import {
  ExportOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  HistoryOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import ExportConfig from '../../components/ExportConfig';
import ExportProgress from '../../components/ExportProgress';
import ExportHistory from '../../components/ExportHistory';
import { initiateExport, EXPORT_TYPES, EXPORT_FORMATS } from '../../services/exportService';
import './Export.css';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

/**
 * ExportPage Component
 * Main page for data export functionality with configuration, progress tracking, and history
 */
const ExportPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [exportConfig, setExportConfig] = useState({
    type: EXPORT_TYPES.TASK,
    format: EXPORT_FORMATS.CSV,
    fields: [],
    filters: {},
  });
  const [exportJob, setExportJob] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  /**
   * Handle config change
   */
  const handleConfigChange = (newConfig) => {
    setExportConfig(prev => ({ ...prev, ...newConfig }));
  };

  /**
   * Validate export configuration
   */
  const validateConfig = () => {
    if (!exportConfig.type) {
      message.error('请选择数据类型');
      return false;
    }
    if (!exportConfig.format) {
      message.error('请选择导出格式');
      return false;
    }
    if (!exportConfig.fields || exportConfig.fields.length === 0) {
      message.error('请至少选择一个字段');
      return false;
    }
    return true;
  };

  /**
   * Start export
   */
  const handleStartExport = async () => {
    if (!validateConfig()) {
      return;
    }

    try {
      setExporting(true);
      const result = await initiateExport(exportConfig);
      
      setExportJob(result);
      setCurrentStep(1);
      message.success('导出任务已创建');
    } catch (error) {
      console.error('Failed to start export:', error);
      message.error('创建导出任务失败，请稍后重试');
      setExporting(false);
    }
  };

  /**
   * Handle export complete
   */
  const handleExportComplete = (data) => {
    setExporting(false);
    message.success('导出完成！');
    
    // Auto-advance to step 2 (summary)
    setCurrentStep(2);
  };

  /**
   * Handle export cancel/failed
   */
  const handleExportCancel = (data) => {
    setExporting(false);
    if (data.status === 'cancelled') {
      message.info('导出已取消');
    } else if (data.status === 'failed') {
      message.error('导出失败');
    }
  };

  /**
   * Handle back to config
   */
  const handleBackToConfig = () => {
    setExportJob(null);
    setCurrentStep(0);
  };

  /**
   * Handle download
   */
  const handleDownload = () => {
    if (exportJob) {
      // Download will be handled by ExportProgress component
      message.info('正在准备下载...');
    }
  };

  /**
   * Toggle history panel
   */
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <Content className="export-page-content">
      {/* Header */}
      <div className="export-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} className="export-title">
              <ExportOutlined /> 数据导出
            </Title>
            <Text type="secondary" className="export-subtitle">
              配置并导出系统数据，支持多种格式和字段选择
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<HistoryOutlined />}
                onClick={toggleHistory}
                size="large"
              >
                {showHistory ? '隐藏历史' : '查看历史'}
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <Row gutter={16}>
        <Col xs={24} lg={showHistory ? 14 : 24}>
          {/* Export Workflow */}
          <Card className="export-workflow-card" bordered={false}>
            {/* Steps */}
            <Steps
              current={currentStep}
              className="export-steps"
              items={[
                {
                  title: '配置导出',
                  icon: <SettingOutlined />,
                  description: '选择数据类型和格式',
                },
                {
                  title: '导出进行中',
                  icon: <ExportOutlined />,
                  description: '等待导出完成',
                },
                {
                  title: '完成',
                  icon: <CheckCircleOutlined />,
                  description: '下载导出文件',
                },
              ]}
            />

            {/* Step Content */}
            <div className="export-step-content" style={{ marginTop: 32 }}>
              {/* Step 0: Configuration */}
              {currentStep === 0 && (
                <div className="config-step">
                  <ExportConfig
                    onConfigChange={handleConfigChange}
                    initialConfig={exportConfig}
                  />
                  
                  <div className="step-actions" style={{ marginTop: 24, textAlign: 'right' }}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<ExportOutlined />}
                      onClick={handleStartExport}
                      loading={exporting}
                    >
                      开始导出
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 1: Progress */}
              {currentStep === 1 && exportJob && (
                <div className="progress-step">
                  <ExportProgress
                    jobId={exportJob.id}
                    onComplete={handleExportComplete}
                    onCancel={handleExportCancel}
                  />
                  
                  <div className="step-actions" style={{ marginTop: 24, textAlign: 'right' }}>
                    <Button
                      onClick={handleBackToConfig}
                      disabled={exporting}
                    >
                      返回配置
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Complete */}
              {currentStep === 2 && exportJob && (
                <div className="complete-step">
                  <Card className="complete-card">
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <CheckCircleOutlined
                        style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }}
                      />
                      <Title level={3} style={{ margin: '16px 0' }}>
                        导出完成！
                      </Title>
                      <Paragraph type="secondary">
                        您的数据已成功导出，可以下载到本地使用。
                      </Paragraph>
                      
                      <div className="export-summary" style={{ marginTop: 24 }}>
                        <Row gutter={16} justify="center">
                          <Col>
                            <Card size="small" className="summary-card">
                              <Text type="secondary">数据类型</Text>
                              <div style={{ fontSize: 18, fontWeight: 600 }}>
                                {exportConfig.type === EXPORT_TYPES.AGENT ? 'Agent' :
                                 exportConfig.type === EXPORT_TYPES.TASK ? '任务' :
                                 exportConfig.type === EXPORT_TYPES.LOG ? '日志' : '配置'}
                              </div>
                            </Card>
                          </Col>
                          <Col>
                            <Card size="small" className="summary-card">
                              <Text type="secondary">导出格式</Text>
                              <div style={{ fontSize: 18, fontWeight: 600 }}>
                                {exportConfig.format.toUpperCase()}
                              </div>
                            </Card>
                          </Col>
                          <Col>
                            <Card size="small" className="summary-card">
                              <Text type="secondary">字段数量</Text>
                              <div style={{ fontSize: 18, fontWeight: 600 }}>
                                {exportConfig.fields.length}
                              </div>
                            </Card>
                          </Col>
                        </Row>
                      </div>

                      <div className="step-actions" style={{ marginTop: 32 }}>
                        <Space size="large">
                          <Button
                            onClick={handleBackToConfig}
                            size="large"
                          >
                            导出其他数据
                          </Button>
                          <Button
                            type="primary"
                            size="large"
                            icon={<DownloadOutlined />}
                            onClick={handleDownload}
                          >
                            下载文件
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* History Panel */}
        {showHistory && (
          <Col xs={24} lg={10}>
            <ExportHistory />
          </Col>
        )}
      </Row>

      {/* History Modal (for small screens) */}
      <Modal
        title="导出历史"
        open={showHistory && window.innerWidth < 992}
        onCancel={toggleHistory}
        footer={null}
        width="80%"
      >
        <ExportHistory />
      </Modal>
    </Content>
  );
};

export default ExportPage;
