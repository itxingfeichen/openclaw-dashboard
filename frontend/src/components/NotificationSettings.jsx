import React, { useState } from 'react'
import { Card, Form, Input, Button, Switch, Space, Tag, message, Divider, Collapse } from 'antd'
import {
  MailOutlined,
  MessageOutlined,
  BellOutlined,
  GlobalOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined
} from '@ant-design/icons'

const { Panel } = Collapse

/**
 * 通知设置组件
 * 支持通知渠道配置
 */
const NotificationSettings = ({ settings = {}, onSave }) => {
  const [form] = Form.useForm()
  const [webhooks, setWebhooks] = useState(settings.webhooks || [])
  const [editingWebhook, setEditingWebhook] = useState(null)

  const channelIcons = {
    email: <MailOutlined />,
    sms: <MessageOutlined />,
    dingtalk: <BellOutlined />,
    feishu: <BellOutlined />,
    wechat: <MessageOutlined />,
    webhook: <GlobalOutlined />
  }

  const channelNames = {
    email: '邮件',
    sms: '短信',
    dingtalk: '钉钉',
    feishu: '飞书',
    wechat: '企业微信',
    webhook: 'Webhook'
  }

  const handleSave = async (values) => {
    try {
      await onSave?.({
        ...values,
        webhooks
      })
      message.success('通知设置保存成功')
    } catch (error) {
      message.error('保存失败，请重试')
    }
  }

  const handleAddWebhook = () => {
    setEditingWebhook({ id: Date.now().toString(), name: '', url: '', enabled: true })
  }

  const handleSaveWebhook = () => {
    if (editingWebhook?.name && editingWebhook?.url) {
      if (webhooks.find((w) => w.id === editingWebhook.id)) {
        setWebhooks(webhooks.map((w) => (w.id === editingWebhook.id ? editingWebhook : w)))
      } else {
        setWebhooks([...webhooks, editingWebhook])
      }
      setEditingWebhook(null)
      message.success('Webhook 保存成功')
    }
  }

  const handleDeleteWebhook = (id) => {
    setWebhooks(webhooks.filter((w) => w.id !== id))
    message.success('Webhook 删除成功')
  }

  return (
    <Card
      title={
        <Space>
          <BellOutlined />
          通知设置
        </Space>
      }
      variant="borderless"
      style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginTop: '24px' }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          emailEnabled: settings.emailEnabled ?? true,
          emailRecipients: settings.emailRecipients?.join(',') || '',
          smsEnabled: settings.smsEnabled ?? false,
          smsRecipients: settings.smsRecipients?.join(',') || '',
          dingtalkEnabled: settings.dingtalkEnabled ?? false,
          dingtalkWebhook: settings.dingtalkWebhook || '',
          feishuEnabled: settings.feishuEnabled ?? false,
          feishuWebhook: settings.feishuWebhook || '',
          wechatEnabled: settings.wechatEnabled ?? false,
          wechatWebhook: settings.wechatWebhook || '',
          quietHoursEnabled: settings.quietHoursEnabled ?? false,
          quietHoursStart: settings.quietHoursStart || '22:00',
          quietHoursEnd: settings.quietHoursEnd || '08:00'
        }}
        onFinish={handleSave}
      >
        <Divider orientation="left">邮件通知</Divider>
        <Form.Item name="emailEnabled" label="启用邮件通知" valuePropName="checked">
          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
        </Form.Item>
        <Form.Item
          name="emailRecipients"
          label="收件人列表"
          extra="多个邮箱地址用逗号分隔"
        >
          <Input placeholder="example@company.com, admin@company.com" />
        </Form.Item>

        <Divider orientation="left">短信通知</Divider>
        <Form.Item name="smsEnabled" label="启用短信通知" valuePropName="checked">
          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
        </Form.Item>
        <Form.Item
          name="smsRecipients"
          label="手机号列表"
          extra="多个手机号用逗号分隔"
        >
          <Input placeholder="13800138000, 13900139000" />
        </Form.Item>

        <Divider orientation="left">即时通讯工具</Divider>
        <Form.Item name="dingtalkEnabled" label="启用钉钉通知" valuePropName="checked">
          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
        </Form.Item>
        <Form.Item name="dingtalkWebhook" label="钉钉 Webhook 地址">
          <Input placeholder="https://oapi.dingtalk.com/robot/send?access_token=..." />
        </Form.Item>

        <Form.Item name="feishuEnabled" label="启用飞书通知" valuePropName="checked">
          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
        </Form.Item>
        <Form.Item name="feishuWebhook" label="飞书 Webhook 地址">
          <Input placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..." />
        </Form.Item>

        <Form.Item name="wechatEnabled" label="启用企业微信通知" valuePropName="checked">
          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
        </Form.Item>
        <Form.Item name="wechatWebhook" label="企业微信 Webhook 地址">
          <Input placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..." />
        </Form.Item>

        <Divider orientation="left">免打扰设置</Divider>
        <Form.Item name="quietHoursEnabled" label="启用免打扰时段" valuePropName="checked">
          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
        </Form.Item>
        <Space>
          <Form.Item name="quietHoursStart" label="开始时间" noStyle>
            <Input style={{ width: 120 }} placeholder="22:00" />
          </Form.Item>
          <span>至</span>
          <Form.Item name="quietHoursEnd" label="结束时间" noStyle>
            <Input style={{ width: 120 }} placeholder="08:00" />
          </Form.Item>
        </Space>

        <Divider orientation="left">自定义 Webhook</Divider>
        <Space style={{ marginBottom: 16 }}>
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddWebhook}>
            添加 Webhook
          </Button>
        </Space>

        {webhooks.length > 0 && (
          <Collapse>
            <Panel header={`已配置 ${webhooks.length} 个 Webhook`} key="webhooks">
              <Space direction="vertical" style={{ width: '100%' }}>
                {webhooks.map((webhook) => (
                  <Card key={webhook.id} size="small" style={{ marginBottom: 8 }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{webhook.name}</strong>
                        <div style={{ fontSize: '12px', color: '#999' }}>{webhook.url}</div>
                      </div>
                      <Space>
                        <Tag color={webhook.enabled ? 'green' : 'default'}>
                          {webhook.enabled ? '启用' : '禁用'}
                        </Tag>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => setEditingWebhook(webhook)}
                        />
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteWebhook(webhook.id)}
                        />
                      </Space>
                    </Space>
                  </Card>
                ))}
              </Space>
            </Panel>
          </Collapse>
        )}

        {editingWebhook && (
          <Card size="small" title="编辑 Webhook" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="Webhook 名称"
                value={editingWebhook.name}
                onChange={(e) => setEditingWebhook({ ...editingWebhook, name: e.target.value })}
              />
              <Input
                placeholder="Webhook URL"
                value={editingWebhook.url}
                onChange={(e) => setEditingWebhook({ ...editingWebhook, url: e.target.value })}
              />
              <Switch
                checked={editingWebhook.enabled}
                onChange={(checked) => setEditingWebhook({ ...editingWebhook, enabled: checked })}
                checkedChildren="启用"
                unCheckedChildren="禁用"
              />
              <Space>
                <Button type="primary" icon={<CheckOutlined />} onClick={handleSaveWebhook}>
                  保存
                </Button>
                <Button onClick={() => setEditingWebhook(null)}>取消</Button>
              </Space>
            </Space>
          </Card>
        )}

        <Form.Item style={{ marginTop: 24 }}>
          <Space>
            <Button type="primary" htmlType="submit" size="large">
              保存设置
            </Button>
            <Button htmlType="button" size="large" onClick={() => form.resetFields()}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default NotificationSettings
