import React, { useState, useEffect } from 'react';
import { Card, Form, Switch, Select, TimePicker, InputNumber, Space, Typography, Button, Divider, message as antMessage } from 'antd';
import { ClockCircleOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchBackupSchedule, updateBackupSchedule } from '../services/backupService';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 备份计划配置组件
 * @param {Object} props
 * @param {Function} props.onScheduleChange - 计划变更回调
 */
const BackupSchedule = ({ onScheduleChange }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState(null);

  useEffect(() => {
    loadSchedule();
  }, []);

  /**
   * 加载备份计划
   */
  const loadSchedule = async () => {
    setLoading(true);
    try {
      const data = await fetchBackupSchedule();
      setSchedule(data);
      form.setFieldsValue({
        enabled: data.enabled,
        frequency: data.frequency,
        time: data.time ? dayjs(data.time, 'HH:mm') : dayjs('02:00', 'HH:mm'),
        dayOfWeek: data.dayOfWeek || 1,
        dayOfMonth: data.dayOfMonth || 1,
        retentionDays: data.retentionDays || 30,
        retentionCount: data.retentionCount || 10,
      });
    } catch (error) {
      console.error('Failed to load schedule:', error);
      antMessage.error('加载备份计划失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 保存备份计划
   */
  const handleSave = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      
      setSaving(true);
      const scheduleData = {
        enabled: values.enabled,
        frequency: values.frequency,
        time: values.time ? values.time.format('HH:mm') : '02:00',
        dayOfWeek: values.dayOfWeek,
        dayOfMonth: values.dayOfMonth,
        retentionDays: values.retentionDays,
        retentionCount: values.retentionCount,
      };

      const result = await updateBackupSchedule(scheduleData);
      
      if (result.success) {
        antMessage.success('备份计划保存成功');
        setSchedule(scheduleData);
        if (onScheduleChange) {
          onScheduleChange(scheduleData);
        }
      }
    } catch (error) {
      console.error('Failed to save schedule:', error);
      antMessage.error('保存备份计划失败');
    } finally {
      setSaving(false);
    }
  };

  /**
   * 重置表单
   */
  const handleReset = () => {
    if (schedule) {
      form.setFieldsValue({
        enabled: schedule.enabled,
        frequency: schedule.frequency,
        time: schedule.time ? dayjs(schedule.time, 'HH:mm') : dayjs('02:00', 'HH:mm'),
        dayOfWeek: schedule.dayOfWeek || 1,
        dayOfMonth: schedule.dayOfMonth || 1,
        retentionDays: schedule.retentionDays || 30,
        retentionCount: schedule.retentionCount || 10,
      });
    }
  };

  const frequency = Form.useWatch('frequency', form);
  const enabled = Form.useWatch('enabled', form);

  return (
    <Card
      title={
        <Space>
          <ClockCircleOutlined />
          <span>备份计划配置</span>
        </Space>
      }
      loading={loading}
      extra={
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadSchedule}
            size="small"
          >
            重置
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSave}
            loading={saving}
            size="small"
          >
            保存
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          enabled: true,
          frequency: 'daily',
          time: dayjs('02:00', 'HH:mm'),
          dayOfWeek: 1,
          dayOfMonth: 1,
          retentionDays: 30,
          retentionCount: 10,
        }}
      >
        <Form.Item
          label="启用自动备份"
          name="enabled"
          valuePropName="checked"
        >
          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
        </Form.Item>

        <Divider orientationMargin={0} />

        <Form.Item
          label="备份频率"
          name="frequency"
          rules={[{ required: true, message: '请选择备份频率' }]}
        >
          <Select disabled={!enabled}>
            <Option value="daily">每天</Option>
            <Option value="weekly">每周</Option>
            <Option value="monthly">每月</Option>
          </Select>
        </Form.Item>

        {frequency && (
          <>
            <Form.Item
              label="备份时间"
              name="time"
              rules={[{ required: true, message: '请选择备份时间' }]}
              tooltip="系统将在指定时间自动执行备份"
            >
              <TimePicker 
                format="HH:mm" 
                disabled={!enabled}
                style={{ width: '100%' }}
              />
            </Form.Item>

            {frequency === 'weekly' && (
              <Form.Item
                label="每周备份日期"
                name="dayOfWeek"
                rules={[{ required: true, message: '请选择每周备份日期' }]}
              >
                <Select disabled={!enabled}>
                  <Option value={1}>周一</Option>
                  <Option value={2}>周二</Option>
                  <Option value={3}>周三</Option>
                  <Option value={4}>周四</Option>
                  <Option value={5}>周五</Option>
                  <Option value={6}>周六</Option>
                  <Option value={0}>周日</Option>
                </Select>
              </Form.Item>
            )}

            {frequency === 'monthly' && (
              <Form.Item
                label="每月备份日期"
                name="dayOfMonth"
                rules={[{ required: true, message: '请选择每月备份日期' }]}
                tooltip="如果选择的日期在该月不存在，将在该月最后一天执行备份"
              >
                <Select disabled={!enabled}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <Option key={day} value={day}>
                      每月{day}日
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </>
        )}

        <Divider orientationMargin={0} />

        <Title level={5} style={{ marginBottom: '16px' }}>保留策略</Title>

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Form.Item
            label="按天数保留"
            name="retentionDays"
            tooltip="超过指定天数的备份将被自动删除"
            rules={[{ min: 1, message: '保留天数至少为 1 天' }]}
          >
            <InputNumber 
              min={1} 
              max={365} 
              style={{ width: '100%' }}
              disabled={!enabled}
              addonAfter="天"
            />
          </Form.Item>

          <Form.Item
            label="按数量保留"
            name="retentionCount"
            tooltip="保留最近的指定数量的备份"
            rules={[{ min: 1, message: '保留数量至少为 1 个' }]}
          >
            <InputNumber 
              min={1} 
              max={100} 
              style={{ width: '100%' }}
              disabled={!enabled}
              addonAfter="个"
            />
          </Form.Item>
        </Space>

        {!enabled && (
          <div style={{ marginTop: '16px' }}>
            <Text type="warning">自动备份已关闭，系统将不会执行定时备份任务</Text>
          </div>
        )}
      </Form>
    </Card>
  );
};

export default BackupSchedule;
