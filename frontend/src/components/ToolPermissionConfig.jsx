import React, { useState, useEffect } from 'react';
import { Form, Checkbox, Space, Typography, Alert, Tag, Tooltip, Divider } from 'antd';
import { 
  InfoCircleOutlined, 
  CheckCircleOutlined, 
  WarningOutlined 
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

/**
 * Available tools with detailed configuration
 */
const AVAILABLE_TOOLS = [
  { 
    value: 'read', 
    label: '文件读取', 
    description: '读取文件内容',
    category: '文件操作',
    riskLevel: 'low',
    icon: '📄'
  },
  { 
    value: 'write', 
    label: '文件写入', 
    description: '创建或写入文件',
    category: '文件操作',
    riskLevel: 'medium',
    icon: '✏️'
  },
  { 
    value: 'edit', 
    label: '文件编辑', 
    description: '编辑现有文件',
    category: '文件操作',
    riskLevel: 'medium',
    icon: '📝'
  },
  { 
    value: 'exec', 
    label: '命令执行', 
    description: '执行 Shell 命令',
    category: '系统操作',
    riskLevel: 'high',
    icon: '⚡'
  },
  { 
    value: 'web_search', 
    label: '网络搜索', 
    description: '搜索互联网信息',
    category: '网络访问',
    riskLevel: 'low',
    icon: '🔍'
  },
  { 
    value: 'web_fetch', 
    label: '网页抓取', 
    description: '抓取网页内容',
    category: '网络访问',
    riskLevel: 'low',
    icon: '🌐'
  },
  { 
    value: 'browser', 
    label: '浏览器控制', 
    description: '控制浏览器自动化',
    category: '网络访问',
    riskLevel: 'medium',
    icon: '🌍'
  },
  { 
    value: 'message', 
    label: '消息发送', 
    description: '发送消息到渠道',
    category: '通信',
    riskLevel: 'medium',
    icon: '💬'
  },
  { 
    value: 'tts', 
    label: '语音合成', 
    description: '文本转语音',
    category: '通信',
    riskLevel: 'low',
    icon: '🔊'
  },
  { 
    value: 'image', 
    label: '图像分析', 
    description: '分析图像内容',
    category: '媒体处理',
    riskLevel: 'low',
    icon: '🖼️'
  },
  { 
    value: 'pdf', 
    label: 'PDF 分析', 
    description: '分析 PDF 文档',
    category: '媒体处理',
    riskLevel: 'low',
    icon: '📕'
  },
];

/**
 * Group tools by category
 */
const groupToolsByCategory = () => {
  const grouped = {};
  AVAILABLE_TOOLS.forEach(tool => {
    if (!grouped[tool.category]) {
      grouped[tool.category] = [];
    }
    grouped[tool.category].push(tool);
  });
  return grouped;
};

/**
 * Get risk level color
 */
const getRiskColor = (level) => {
  switch (level) {
    case 'high':
      return 'red';
    case 'medium':
      return 'orange';
    case 'low':
      return 'green';
    default:
      return 'default';
  }
};

/**
 * ToolPermissionConfig Component
 * Detailed tool permission configuration with categories and risk levels
 */
const ToolPermissionConfig = ({ value, onChange, form }) => {
  const [selectedTools, setSelectedTools] = useState(value || []);
  const [showRiskWarning, setShowRiskWarning] = useState(false);

  useEffect(() => {
    setSelectedTools(value || []);
  }, [value]);

  const groupedTools = groupToolsByCategory();

  /**
   * Handle tool selection change
   */
  const handleToolChange = (checkedValues) => {
    setSelectedTools(checkedValues);
    onChange && onChange(checkedValues);

    // Show warning if high-risk tools are selected
    const hasHighRisk = checkedValues.some(toolValue => {
      const tool = AVAILABLE_TOOLS.find(t => t.value === toolValue);
      return tool?.riskLevel === 'high';
    });

    setShowRiskWarning(hasHighRisk);
  };

  /**
   * Select all tools in a category
   */
  const handleSelectCategory = (category, checked) => {
    const categoryTools = groupedTools[category].map(t => t.value);
    let newTools;
    
    if (checked) {
      newTools = [...new Set([...selectedTools, ...categoryTools])];
    } else {
      newTools = selectedTools.filter(t => !categoryTools.includes(t));
    }

    setSelectedTools(newTools);
    onChange && onChange(newTools);

    const hasHighRisk = newTools.some(toolValue => {
      const tool = AVAILABLE_TOOLS.find(t => t.value === toolValue);
      return tool?.riskLevel === 'high';
    });
    setShowRiskWarning(hasHighRisk);
  };

  /**
   * Check if all tools in category are selected
   */
  const isCategoryFullySelected = (category) => {
    const categoryTools = groupedTools[category].map(t => t.value);
    return categoryTools.every(t => selectedTools.includes(t));
  };

  /**
   * Check if some tools in category are selected
   */
  const isCategoryPartiallySelected = (category) => {
    const categoryTools = groupedTools[category].map(t => t.value);
    const selectedCount = categoryTools.filter(t => selectedTools.includes(t)).length;
    return selectedCount > 0 && selectedCount < categoryTools.length;
  };

  return (
    <div className="tool-permission-config">
      {/* Risk Warning */}
      {showRiskWarning && (
        <Alert
          message="高风险工具提示"
          description={
            <Paragraph style={{ margin: 0 }}>
              您已选择 <Tag color="red">命令执行 (exec)</Tag> 工具，该工具具有较高权限，
              请确保 Agent 在受控环境中运行。
            </Paragraph>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setShowRiskWarning(false)}
        />
      )}

      {/* Tool Selection Summary */}
      <div className="tool-summary" style={{ marginBottom: 16 }}>
        <Text strong>已选择 {selectedTools.length} 个工具</Text>
        {selectedTools.length > 0 && (
          <Space style={{ marginLeft: 12 }} wrap>
            {selectedTools.map(toolValue => {
              const tool = AVAILABLE_TOOLS.find(t => t.value === toolValue);
              return (
                <Tag 
                  key={toolValue} 
                  color={getRiskColor(tool?.riskLevel)}
                  closable
                  onClose={() => {
                    const newTools = selectedTools.filter(t => t !== toolValue);
                    setSelectedTools(newTools);
                    onChange && onChange(newTools);
                  }}
                >
                  {tool?.icon} {tool?.label}
                </Tag>
              );
            })}
          </Space>
        )}
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Tool Categories */}
      {Object.entries(groupedTools).map(([category, tools]) => (
        <div key={category} className="tool-category" style={{ marginBottom: 20 }}>
          <div className="category-header" style={{ marginBottom: 12 }}>
            <Space>
              <Text strong style={{ fontSize: 14 }}>{category}</Text>
              <Checkbox
                checked={isCategoryFullySelected(category)}
                indeterminate={isCategoryPartiallySelected(category)}
                onChange={(e) => handleSelectCategory(category, e.target.checked)}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  全选
                </Text>
              </Checkbox>
            </Space>
          </div>

          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {tools.map(tool => (
              <Tooltip 
                key={tool.value}
                title={
                  <div>
                    <Text strong>{tool.description}</Text>
                    <br />
                    <Text type="secondary">风险等级：{tool.riskLevel}</Text>
                  </div>
                }
              >
                <div 
                  className={`tool-item ${selectedTools.includes(tool.value) ? 'selected' : ''}`}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #e8e8e8',
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: selectedTools.includes(tool.value) ? '#e6f7ff' : '#fff',
                    borderColor: selectedTools.includes(tool.value) ? '#1890ff' : '#e8e8e8',
                  }}
                  onClick={() => {
                    const newTools = selectedTools.includes(tool.value)
                      ? selectedTools.filter(t => t !== tool.value)
                      : [...selectedTools, tool.value];
                    setSelectedTools(newTools);
                    onChange && onChange(newTools);
                  }}
                >
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <span style={{ fontSize: 16 }}>{tool.icon}</span>
                      <div>
                        <div>
                          <Text strong>{tool.label}</Text>
                          <Tag 
                            size="small" 
                            color={getRiskColor(tool.riskLevel)}
                            style={{ marginLeft: 8 }}
                          >
                            {tool.riskLevel === 'high' ? '高风险' : 
                             tool.riskLevel === 'medium' ? '中风险' : '低风险'}
                          </Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {tool.description}
                        </Text>
                      </div>
                    </Space>
                    <Checkbox
                      checked={selectedTools.includes(tool.value)}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Space>
                </div>
              </Tooltip>
            ))}
          </Space>
        </div>
      ))}

      {/* Quick Select Buttons */}
      <Divider style={{ margin: '16px 0' }} />
      
      <div className="quick-select" style={{ marginBottom: 16 }}>
        <Text strong style={{ marginRight: 12 }}>快速选择：</Text>
        <Space>
          <button
            className="quick-select-btn"
            onClick={() => {
              const basicTools = ['read', 'write', 'web_search'];
              setSelectedTools(basicTools);
              onChange && onChange(basicTools);
            }}
            style={{
              padding: '6px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            基础权限
          </button>
          <button
            className="quick-select-btn"
            onClick={() => {
              const devTools = ['read', 'write', 'edit', 'exec', 'browser', 'web_search'];
              setSelectedTools(devTools);
              onChange && onChange(devTools);
            }}
            style={{
              padding: '6px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            开发权限
          </button>
          <button
            className="quick-select-btn"
            onClick={() => {
              setSelectedTools(AVAILABLE_TOOLS.map(t => t.value));
              onChange && onChange(AVAILABLE_TOOLS.map(t => t.value));
            }}
            style={{
              padding: '6px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            全部权限
          </button>
          <button
            className="quick-select-btn"
            onClick={() => {
              setSelectedTools([]);
              onChange && onChange([]);
            }}
            style={{
              padding: '6px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            清空
          </button>
        </Space>
      </div>

      {/* Tool Count Info */}
      <Alert
        message={
          <Space>
            <InfoCircleOutlined />
            <Text type="secondary">
              建议根据最小权限原则选择工具，仅授予 Agent 完成任务所需的工具权限
            </Text>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </div>
  );
};

export default ToolPermissionConfig;
