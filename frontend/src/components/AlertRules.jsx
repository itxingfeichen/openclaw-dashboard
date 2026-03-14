import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, Select, Tag, Switch, message, Popconfirm } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'

const { TextArea } = Input

/**
 * 告警规则配置组件
 * 支持告警规则的 CRUD 操作
 */
const AlertRules = ({ rules = [], onCreate, onUpdate, onDelete }) => {
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [form] = Form.useForm()

  const getLevelInfo = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
      case '严重':
        return { color: 'red', icon: <ExclamationCircleOutlined />, text: '严重' }
      case 'warning':
      case '警告':
        return { color: 'orange', icon: <WarningOutlined />, text: '警告' }
      case 'info':
      case '信息':
      default:
        return { color: 'blue', icon: <InfoCircleOutlined />, text: '信息' }
    }
  }

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '告警级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level) => {
        const { color, icon, text } = getLevelInfo(level)
        return (
          <Tag color={color} icon={icon}>
            {text}
          </Tag>
        )
      }
    },
    {
      title: '触发条件',
      dataIndex: 'condition',
      key: 'condition',
      ellipsis: true,
      width: 300
    },
    {
      title: '通知渠道',
      dataIndex: 'channels',
      key: 'channels',
      width: 150,
      render: (channels) => (
        <Space size={4}>
          {channels?.map((channel, index) => (
            <Tag key={index} color="geekblue">
              {channel}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: '启用状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'default'}>
          {enabled ? '已启用' : '已禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此规则吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const handleEdit = (rule) => {
    setEditingRule(rule)
    form.setFieldsValue({
      ...rule,
      channels: rule.channels || []
    })
    setModalVisible(true)
  }

  const handleCreate = () => {
    setEditingRule(null)
    form.resetFields()
    form.setFieldsValue({
      level: 'warning',
      enabled: true,
      channels: []
    })
    setModalVisible(true)
  }

  const handleDelete = (id) => {
    onDelete?.(id)
    message.success('规则删除成功')
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (editingRule) {
        onUpdate?.({ ...editingRule, ...values })
        message.success('规则更新成功')
      } else {
        onCreate?.({ ...values, id: Date.now().toString() })
        message.success('规则创建成功')
      }
      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  return (
    <>
      <Card
        title={
          <Space>
            <SettingOutlined />
            告警规则配置
          </Space>
        }
        variant="borderless"
        style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建规则
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            locale: { items_per_page: '条/页' }
          }}
          size="middle"
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingRule ? '编辑告警规则' : '新建告警规则'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="例如：CPU 使用率过高告警" />
          </Form.Item>

          <Form.Item
            name="level"
            label="告警级别"
            rules={[{ required: true, message: '请选择告警级别' }]}
          >
            <Select>
              <Select.Option value="critical">
                <Tag color="red">严重</Tag>
              </Select.Option>
              <Select.Option value="warning">
                <Tag color="orange">警告</Tag>
              </Select.Option>
              <Select.Option value="info">
                <Tag color="blue">信息</Tag>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="condition"
            label="触发条件"
            rules={[{ required: true, message: '请输入触发条件' }]}
          >
            <TextArea
              rows={3}
              placeholder="例如：CPU 使用率 > 80% 持续 5 分钟"
            />
          </Form.Item>

          <Form.Item
            name="channels"
            label="通知渠道"
          >
            <Select mode="multiple" placeholder="选择通知渠道">
              <Select.Option value="email">邮件</Select.Option>
              <Select.Option value="sms">短信</Select.Option>
              <Select.Option value="webhook">Webhook</Select.Option>
              <Select.Option value="dingtalk">钉钉</Select.Option>
              <Select.Option value="feishu">飞书</Select.Option>
              <Select.Option value="wechat">企业微信</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="enabled"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item name="description" label="规则描述">
            <TextArea rows={2} placeholder="可选，描述规则的用途" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default AlertRules
