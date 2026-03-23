import React, { useState } from 'react';
import { Form, Input, Button, message as antdMessage, Typography, Card } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import authService from '../services/auth.service';
import type { FormProps } from 'antd';

const { Title, Text } = Typography;

interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Password validation rules:
 * - 8-128 characters
 * - Must contain uppercase letter
 * - Must contain lowercase letter
 * - Must contain number
 */
const validatePassword = (_: unknown, value: string) => {
  if (!value) {
    return Promise.reject(new Error('Please input your password!'));
  }

  if (value.length < 8 || value.length > 128) {
    return Promise.reject(new Error('Password must be between 8 and 128 characters!'));
  }

  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return Promise.reject(
      new Error('Password must contain uppercase, lowercase, and number!')
    );
  }

  return Promise.resolve();
};

/**
 * Username validation rules:
 * - 3-30 characters
 * - Only letters, numbers, and underscores
 */
const validateUsername = (_: unknown, value: string) => {
  if (!value) {
    return Promise.reject(new Error('Please input your username!'));
  }

  if (value.length < 3 || value.length > 30) {
    return Promise.reject(new Error('Username must be between 3 and 30 characters!'));
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(value)) {
    return Promise.reject(
      new Error('Username can only contain letters, numbers, and underscores!')
    );
  }

  return Promise.resolve();
};

/**
 * Register Page Component
 * 
 * Features:
 * - Username, email, password, confirm password inputs
 * - Password strength validation
 * - Form validation
 * - Error handling
 * - Loading state
 * - Responsive design
 */
const Register: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish: FormProps<RegisterFormValues>['onFinish'] = async (values) => {
    setLoading(true);

    try {
      await authService.register({
        username: values.username,
        email: values.email,
        password: values.password,
      });

      antdMessage.success('Registration successful! Redirecting to login...');
      
      // Redirect to login page after successful registration
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
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
            🦀 Create Account
          </Title>
          <Text type="secondary">Join OpenClaw Dashboard today!</Text>
        </div>

        <Form
          form={form}
          name="register"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          requiredMark={false}
        >
          <Form.Item<RegisterFormValues>
            label="Username"
            name="username"
            rules={[
              { required: true },
              { validator: validateUsername },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Choose a username (3-30 characters)"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item<RegisterFormValues>
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

          <Form.Item<RegisterFormValues>
            label="Password"
            name="password"
            rules={[
              { required: true },
              { validator: validatePassword },
            ]}
            extra="Must be 8-128 characters with uppercase, lowercase, and number"
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item<RegisterFormValues>
            label="Confirm Password"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              size="large"
            >
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </Form.Item>

          <div className="auth-footer">
            <Text type="secondary">Already have an account? </Text>
            <Link to="/login" className="auth-link">
              Login here
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
