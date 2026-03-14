import React from 'react';
import { Steps, Typography } from 'antd';
import { 
  UserAddOutlined, 
  ToolOutlined, 
  FolderOutlined, 
  CheckCircleOutlined,
  FileTextOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

/**
 * WizardSteps Component
 * Displays step navigation and progress for the agent creation wizard
 */
const WizardSteps = ({ current, steps, onStepChange }) => {
  const defaultSteps = [
    {
      title: '基本信息',
      description: '填写 Agent 名称和描述',
      icon: <UserAddOutlined />,
    },
    {
      title: '模型配置',
      description: '选择 AI 模型',
      icon: <ToolOutlined />,
    },
    {
      title: '工具权限',
      description: '配置工具访问权限',
      icon: <ToolOutlined />,
    },
    {
      title: '工作空间',
      description: '设置工作目录',
      icon: <FolderOutlined />,
    },
    {
      title: '配置预览',
      description: '确认配置信息',
      icon: <FileTextOutlined />,
    },
  ];

  const items = (steps || defaultSteps).map((step, index) => ({
    key: index,
    title: step.title,
    description: step.description,
    icon: step.icon || defaultSteps[index]?.icon,
  }));

  return (
    <div className="wizard-steps-container">
      <div className="wizard-steps-header">
        <Text strong style={{ fontSize: 16 }}>创建进度</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          步骤 {current + 1} / {items.length}
        </Text>
      </div>
      
      <Steps
        current={current}
        items={items}
        onChange={onStepChange}
        size="small"
        className="wizard-steps"
      />
      
      <div className="wizard-step-indicator">
        {items.map((step, index) => (
          <button
            key={index}
            className={`wizard-step-dot ${index === current ? 'active' : ''} ${index < current ? 'completed' : ''}`}
            onClick={() => onStepChange && onStepChange(index)}
            disabled={index > current}
            title={step.title}
          >
            <span className="dot" />
            {index < current && <CheckCircleOutlined className="check-icon" />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WizardSteps;
