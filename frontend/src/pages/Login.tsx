import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message as antdMessage, Typography, Card } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import authService from '../services/auth.service';
import type { FormProps } from 'antd';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
  remember?: boolean;
}

/**
 * Login Page Component
 * 
 * Features:
 * - Email and password input
 * - Remember me checkbox
 * - Forgot password link
 * - Register link
 * - Form validation
 * - Error handling
 * - Loading state
 * - Responsive design
 */
const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish: FormProps<LoginFormValues>['onFinish'] = async (values) => {
    setLoading(true);

    try {
      await authService.login({
        email: values.email,
        password: values.password,
      });

      antdMessage.success('Login successful!');
      
      // Handle remember me
      if (values.remember) {
        // Token is already stored in authService.login
        // Additional logic can be added here if needed
      }

      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      antdMessage.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card" size="default">
        <div className="auth-header">
          <Title level={2} className="auth-title">
            🦀 OpenClaw Dashboard
          </Title>
          <Text type="secondary">Welcome back! Please login to continue.</Text>
        </div>

        <Form
          name="login"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          requiredMark={false}
        >
          <Form.Item<LoginFormValues>
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { 
                type: 'email', 
                message: 'Please enter a valid email address!' 
              },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item<LoginFormValues>
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <div className="auth-form-row">
              <Form.Item<LoginFormValues>
                name="remember"
                valuePropName="checked"
                noStyle
              >
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              <Link to="/forgot-password" className="auth-link">
                Forgot password?
              </Link>
            </div>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              size="large"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form.Item>

          <div className="auth-footer">
            <Text type="secondary">Don't have an account? </Text>
            <Link to="/register" className="auth-link">
              Register here
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
