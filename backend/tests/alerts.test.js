/**
 * Alert System Tests
 * Tests for alert routes, services, and repository
 */

import request from 'supertest';
import { describe, it, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { expect } from 'vitest';
import { getDatabase, initializeDatabase, closeDatabase, resetDatabase } from '../src/database/index.js';
import {
  AlertSeverity,
  AlertStatus,
  NotificationChannel,
  createAlertRule,
  getAlertRuleById,
  getAllAlertRules,
  updateAlertRule,
  deleteAlertRule,
  createAlertHistory,
  getAlertHistory,
  acknowledgeAlert,
  getActiveAlertsCount,
} from '../src/repositories/alert-repository.js';
import {
  createAlertRuleService,
  getAlertRuleService,
  getAllAlertRulesService,
  updateAlertRuleService,
  deleteAlertRuleService,
  triggerAlertService,
  getAlertHistoryService,
  acknowledgeAlertService,
  getActiveAlertsCountService,
} from '../src/services/alertService.js';
import app from '../src/index.js';

// Test database path
const TEST_DB_PATH = ':memory:';

describe('Alert Repository', () => {
  let db;

  beforeAll(async () => {
    process.env.DB_PATH = TEST_DB_PATH;
    resetDatabase();
    db = await initializeDatabase(true);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(() => {
    // Clear tables before each test
    db.exec('DELETE FROM alert_history');
    db.exec('DELETE FROM alert_rules');
  });

  describe('Alert Rule CRUD', () => {
    it('should create an alert rule', () => {
      const ruleData = {
        name: 'High CPU Usage',
        description: 'Alert when CPU usage exceeds threshold',
        condition: 'cpu > 80',
        severity: AlertSeverity.WARNING,
        channels: [NotificationChannel.EMAIL],
        cooldown: 300,
        enabled: true,
      };

      const rule = createAlertRule(ruleData);

      expect(rule).toBeDefined();
      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('High CPU Usage');
      expect(rule.condition).toBe('cpu > 80');
      expect(rule.severity).toBe(AlertSeverity.WARNING);
      expect(rule.enabled).toBe(true);
    });

    it('should get alert rule by ID', () => {
      const ruleData = {
        name: 'Test Rule',
        condition: 'memory > 90',
        severity: AlertSeverity.CRITICAL,
      };

      const created = createAlertRule(ruleData);
      const retrieved = getAlertRuleById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Test Rule');
    });

    it('should return null for non-existent rule ID', () => {
      const rule = getAlertRuleById(999);
      expect(rule).toBeNull();
    });

    it('should get all alert rules', () => {
      createAlertRule({ name: 'Rule 1', condition: 'cpu > 80' });
      createAlertRule({ name: 'Rule 2', condition: 'memory > 90' });
      createAlertRule({ name: 'Rule 3', condition: 'disk > 95' });

      const rules = getAllAlertRules();

      expect(rules).toHaveLength(3);
      expect(rules.map(r => r.name)).toEqual(expect.arrayContaining(['Rule 1', 'Rule 2', 'Rule 3']));
    });

    it('should filter rules by severity', () => {
      createAlertRule({ name: 'Warning Rule', condition: 'cpu > 80', severity: AlertSeverity.WARNING });
      createAlertRule({ name: 'Critical Rule', condition: 'memory > 90', severity: AlertSeverity.CRITICAL });

      const warningRules = getAllAlertRules({ severity: AlertSeverity.WARNING });

      expect(warningRules).toHaveLength(1);
      expect(warningRules[0].name).toBe('Warning Rule');
    });

    it('should filter rules by enabled status', () => {
      createAlertRule({ name: 'Enabled Rule', condition: 'cpu > 80', enabled: true });
      createAlertRule({ name: 'Disabled Rule', condition: 'memory > 90', enabled: false });

      const enabledRules = getAllAlertRules({ enabled: true });

      expect(enabledRules).toHaveLength(1);
      expect(enabledRules[0].name).toBe('Enabled Rule');
    });

    it('should update alert rule', () => {
      const ruleData = {
        name: 'Original Rule',
        condition: 'cpu > 80',
        severity: AlertSeverity.WARNING,
      };

      const created = createAlertRule(ruleData);
      const updated = updateAlertRule(created.id, {
        name: 'Updated Rule',
        severity: AlertSeverity.CRITICAL,
        cooldown: 600,
      });

      expect(updated.name).toBe('Updated Rule');
      expect(updated.severity).toBe(AlertSeverity.CRITICAL);
      expect(updated.cooldown).toBe(600);
    });

    it('should return null when updating non-existent rule', () => {
      const updated = updateAlertRule(999, { name: 'Updated' });
      expect(updated).toBeNull();
    });

    it('should delete alert rule', () => {
      const ruleData = {
        name: 'To Delete',
        condition: 'cpu > 80',
      };

      const created = createAlertRule(ruleData);
      const deleted = deleteAlertRule(created.id);

      expect(deleted).toBe(true);
      expect(getAlertRuleById(created.id)).toBeNull();
    });

    it('should return false when deleting non-existent rule', () => {
      const deleted = deleteAlertRule(999);
      expect(deleted).toBe(false);
    });
  });

  describe('Alert History', () => {
    it('should create alert history record', () => {
      const rule = createAlertRule({
        name: 'Test Rule',
        condition: 'cpu > 80',
        severity: AlertSeverity.WARNING,
      });

      const alertData = {
        rule_id: rule.id,
        title: 'High CPU Alert',
        message: 'CPU usage exceeded 80%',
        severity: AlertSeverity.WARNING,
        context: { cpu: 85, timestamp: new Date().toISOString() },
      };

      const alert = createAlertHistory(alertData);

      expect(alert).toBeDefined();
      expect(alert.id).toBeDefined();
      expect(alert.rule_id).toBe(rule.id);
      expect(alert.title).toBe('High CPU Alert');
      expect(alert.status).toBe(AlertStatus.ACTIVE);
      expect(alert.context.cpu).toBe(85);
    });

    it('should get alert history with pagination', () => {
      const rule = createAlertRule({ name: 'Test Rule', condition: 'cpu > 80' });

      // Create 15 alerts
      for (let i = 0; i < 15; i++) {
        createAlertHistory({
          rule_id: rule.id,
          title: `Alert ${i}`,
          message: `Message ${i}`,
          severity: AlertSeverity.WARNING,
        });
      }

      const history = getAlertHistory({ limit: 10, offset: 0 });

      expect(history.alerts).toHaveLength(10);
      expect(history.pagination.total).toBe(15);
      expect(history.pagination.hasMore).toBe(true);
    });

    it('should filter history by status', () => {
      const rule = createAlertRule({ name: 'Test Rule', condition: 'cpu > 80' });

      const alert1 = createAlertHistory({
        rule_id: rule.id,
        title: 'Active Alert',
        message: 'Active',
        severity: AlertSeverity.WARNING,
      });

      const alert2 = createAlertHistory({
        rule_id: rule.id,
        title: 'Acknowledged Alert',
        message: 'Acknowledged',
        severity: AlertSeverity.WARNING,
      });

      acknowledgeAlert(alert2.id, 'test-user', 'Acknowledged for testing');

      const activeHistory = getAlertHistory({ status: AlertStatus.ACTIVE });
      const ackHistory = getAlertHistory({ status: AlertStatus.ACKNOWLEDGED });

      expect(activeHistory.alerts).toHaveLength(1);
      expect(activeHistory.alerts[0].id).toBe(alert1.id);
      expect(ackHistory.alerts).toHaveLength(1);
      expect(ackHistory.alerts[0].id).toBe(alert2.id);
    });

    it('should acknowledge alert', () => {
      const rule = createAlertRule({ name: 'Test Rule', condition: 'cpu > 80' });

      const alert = createAlertHistory({
        rule_id: rule.id,
        title: 'To Acknowledge',
        message: 'Needs acknowledgment',
        severity: AlertSeverity.CRITICAL,
      });

      const acknowledged = acknowledgeAlert(alert.id, 'admin-user', 'Investigating');

      expect(acknowledged).toBeDefined();
      expect(acknowledged.status).toBe(AlertStatus.ACKNOWLEDGED);
      expect(acknowledged.acknowledged_by).toBe('admin-user');
      expect(acknowledged.acknowledgment_notes).toBe('Investigating');
    });

    it('should get active alerts count', () => {
      const rule = createAlertRule({ name: 'Test Rule', condition: 'cpu > 80' });

      createAlertHistory({
        rule_id: rule.id,
        title: 'Warning Alert',
        message: 'Warning',
        severity: AlertSeverity.WARNING,
      });

      createAlertHistory({
        rule_id: rule.id,
        title: 'Critical Alert',
        message: 'Critical',
        severity: AlertSeverity.CRITICAL,
      });

      createAlertHistory({
        rule_id: rule.id,
        title: 'Another Warning',
        message: 'Another warning',
        severity: AlertSeverity.WARNING,
      });

      const count = getActiveAlertsCount();

      expect(count.total).toBe(3);
      expect(count[AlertSeverity.WARNING]).toBe(2);
      expect(count[AlertSeverity.CRITICAL]).toBe(1);
    });
  });
});

describe('Alert Service', () => {
  let db;

  beforeAll(async () => {
    process.env.DB_PATH = TEST_DB_PATH;
    resetDatabase();
    db = await initializeDatabase(true);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(() => {
    db.exec('DELETE FROM alert_history');
    db.exec('DELETE FROM alert_rules');
  });

  describe('Rule Management', () => {
    it('should create alert rule via service', () => {
      const ruleData = {
        name: 'Service Test Rule',
        condition: 'cpu > 75',
        severity: AlertSeverity.WARNING,
        channels: [NotificationChannel.DINGTALK],
        cooldown: 600,
      };

      const rule = createAlertRuleService(ruleData);

      expect(rule.name).toBe('Service Test Rule');
      expect(rule.channels).toEqual([NotificationChannel.DINGTALK]);
    });

    it('should throw error for invalid rule data', () => {
      expect(() => {
        createAlertRuleService({ name: 'Incomplete Rule' });
      }).toThrow('Name and condition are required');
    });

    it('should update rule via service', () => {
      const rule = createAlertRuleService({
        name: 'Update Test',
        condition: 'cpu > 80',
      });

      const updated = updateAlertRuleService(rule.id, {
        condition: 'cpu > 90',
        cooldown: 900,
      });

      expect(updated.condition).toBe('cpu > 90');
      expect(updated.cooldown).toBe(900);
    });

    it('should throw error when updating non-existent rule', () => {
      expect(() => {
        updateAlertRuleService(999, { name: 'Updated' });
      }).toThrow('Alert rule not found');
    });

    it('should delete rule via service', () => {
      const rule = createAlertRuleService({
        name: 'Delete Test',
        condition: 'cpu > 80',
      });

      const deleted = deleteAlertRuleService(rule.id);
      expect(deleted).toBe(true);
    });
  });

  describe('Alert Triggering', () => {
    it('should trigger alert when condition is met', async () => {
      const rule = createAlertRuleService({
        name: 'CPU Alert',
        condition: 'cpu > 80',
        severity: AlertSeverity.WARNING,
        cooldown: 0, // No cooldown for testing
      });

      const alert = await triggerAlertService({
        ruleId: rule.id,
        metrics: { cpu: 85 },
      });

      expect(alert).toBeDefined();
      expect(alert.title).toBe('CPU Alert');
      expect(alert.severity).toBe(AlertSeverity.WARNING);
    });

    it('should not trigger alert when condition is not met', async () => {
      const rule = createAlertRuleService({
        name: 'CPU Alert',
        condition: 'cpu > 80',
        severity: AlertSeverity.WARNING,
      });

      const alert = await triggerAlertService({
        ruleId: rule.id,
        metrics: { cpu: 70 },
      });

      expect(alert).toBeNull();
    });

    it('should not trigger alert when rule is disabled', async () => {
      const rule = createAlertRuleService({
        name: 'Disabled Rule',
        condition: 'cpu > 80',
        enabled: false,
      });

      const alert = await triggerAlertService({
        ruleId: rule.id,
        metrics: { cpu: 95 },
      });

      expect(alert).toBeNull();
    });

    it('should respect cooldown period', async () => {
      const rule = createAlertRuleService({
        name: 'Cooldown Test',
        condition: 'cpu > 80',
        cooldown: 300, // 5 minutes
      });

      // First trigger should succeed
      const alert1 = await triggerAlertService({
        ruleId: rule.id,
        metrics: { cpu: 85 },
      });

      expect(alert1).toBeDefined();

      // Second trigger should be suppressed
      const alert2 = await triggerAlertService({
        ruleId: rule.id,
        metrics: { cpu: 90 },
      });

      expect(alert2).toBeNull();
    });

    it('should evaluate complex conditions', async () => {
      const rule = createAlertRuleService({
        name: 'Complex Condition',
        condition: 'cpu > 80 && memory > 90',
        severity: AlertSeverity.CRITICAL,
        cooldown: 0,
      });

      // Both conditions met
      const alert1 = await triggerAlertService({
        ruleId: rule.id,
        metrics: { cpu: 85, memory: 95 },
      });

      expect(alert1).toBeDefined();

      // Only one condition met
      const alert2 = await triggerAlertService({
        ruleId: rule.id,
        metrics: { cpu: 85, memory: 80 },
      });

      expect(alert2).toBeNull();
    });
  });

  describe('Alert Acknowledgment', () => {
    it('should acknowledge alert via service', () => {
      const rule = createAlertRuleService({
        name: 'Ack Test',
        condition: 'cpu > 80',
      });

      const alert = createAlertHistory({
        rule_id: rule.id,
        title: 'To Acknowledge',
        message: 'Needs ack',
        severity: AlertSeverity.WARNING,
      });

      const acknowledged = acknowledgeAlertService(alert.id, 'test-user', 'Acknowledged');

      expect(acknowledged.status).toBe(AlertStatus.ACKNOWLEDGED);
      expect(acknowledged.acknowledged_by).toBe('test-user');
    });

    it('should throw error when acknowledging non-existent alert', () => {
      expect(() => {
        acknowledgeAlertService(999, 'user');
      }).toThrow('Alert not found');
    });

    it('should throw error when acknowledging already acknowledged alert', () => {
      const rule = createAlertRuleService({
        name: 'Test Rule',
        condition: 'cpu > 80',
      });

      const alert = createAlertHistory({
        rule_id: rule.id,
        title: 'Already Acked',
        message: 'Test',
        severity: AlertSeverity.WARNING,
      });

      acknowledgeAlert(alert.id, 'user1');

      expect(() => {
        acknowledgeAlertService(alert.id, 'user2');
      }).toThrow('Alert is not active');
    });
  });

  describe('Statistics', () => {
    it('should get active alerts count via service', () => {
      const rule = createAlertRuleService({
        name: 'Stats Test',
        condition: 'cpu > 80',
      });

      createAlertHistory({
        rule_id: rule.id,
        title: 'Alert 1',
        message: 'Test',
        severity: AlertSeverity.WARNING,
      });

      createAlertHistory({
        rule_id: rule.id,
        title: 'Alert 2',
        message: 'Test',
        severity: AlertSeverity.CRITICAL,
      });

      const stats = getActiveAlertsCountService();

      expect(stats.total).toBe(2);
      expect(stats[AlertSeverity.WARNING]).toBe(1);
      expect(stats[AlertSeverity.CRITICAL]).toBe(1);
    });
  });
});

describe('Alert API Routes', () => {
  let db;
  let agent;

  beforeAll(async () => {
    process.env.DB_PATH = TEST_DB_PATH;
    resetDatabase();
    db = await initializeDatabase(true);
    agent = request(app);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(() => {
    db.exec('DELETE FROM alert_history');
    db.exec('DELETE FROM alert_rules');
  });

  describe('GET /api/alerts/rules', () => {
    it('should return empty list when no rules exist', async () => {
      const response = await agent.get('/api/alerts/rules');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return list of rules', async () => {
      createAlertRule({ name: 'Rule 1', condition: 'cpu > 80' });
      createAlertRule({ name: 'Rule 2', condition: 'memory > 90' });

      const response = await agent.get('/api/alerts/rules');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('POST /api/alerts/rules', () => {
    it('should create alert rule', async () => {
      const ruleData = {
        name: 'API Test Rule',
        description: 'Created via API',
        condition: 'cpu > 75',
        severity: AlertSeverity.WARNING,
        channels: [NotificationChannel.EMAIL],
        cooldown: 300,
        enabled: true,
      };

      const response = await agent
        .post('/api/alerts/rules')
        .send(ruleData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('API Test Rule');
    });

    it('should reject rule without name', async () => {
      const response = await agent
        .post('/api/alerts/rules')
        .send({ condition: 'cpu > 80' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Name is required');
    });

    it('should reject rule without condition', async () => {
      const response = await agent
        .post('/api/alerts/rules')
        .send({ name: 'Invalid Rule' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Condition is required');
    });

    it('should reject invalid severity', async () => {
      const response = await agent
        .post('/api/alerts/rules')
        .send({
          name: 'Invalid Severity',
          condition: 'cpu > 80',
          severity: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid severity');
    });
  });

  describe('PUT /api/alerts/rules/:id', () => {
    it('should update alert rule', async () => {
      const rule = createAlertRule({
        name: 'Original',
        condition: 'cpu > 80',
      });

      const response = await agent
        .put(`/api/alerts/rules/${rule.id}`)
        .send({
          name: 'Updated',
          cooldown: 600,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated');
      expect(response.body.data.cooldown).toBe(600);
    });

    it('should return 404 for non-existent rule', async () => {
      const response = await agent
        .put('/api/alerts/rules/999')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/alerts/rules/:id', () => {
    it('should delete alert rule', async () => {
      const rule = createAlertRule({
        name: 'To Delete',
        condition: 'cpu > 80',
      });

      const response = await agent.delete(`/api/alerts/rules/${rule.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent rule', async () => {
      const response = await agent.delete('/api/alerts/rules/999');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/alerts/history', () => {
    it('should return alert history', async () => {
      const rule = createAlertRule({ name: 'Test', condition: 'cpu > 80' });

      createAlertHistory({
        rule_id: rule.id,
        title: 'Alert 1',
        message: 'Test',
        severity: AlertSeverity.WARNING,
      });

      const response = await agent.get('/api/alerts/history');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should support pagination', async () => {
      const rule = createAlertRule({ name: 'Test', condition: 'cpu > 80' });

      for (let i = 0; i < 25; i++) {
        createAlertHistory({
          rule_id: rule.id,
          title: `Alert ${i}`,
          message: 'Test',
          severity: AlertSeverity.WARNING,
        });
      }

      const response = await agent.get('/api/alerts/history?limit=10&offset=0');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.total).toBe(25);
    });
  });

  describe('POST /api/alerts/acknowledge', () => {
    it('should acknowledge alert', async () => {
      const rule = createAlertRule({ name: 'Test', condition: 'cpu > 80' });

      const alert = createAlertHistory({
        rule_id: rule.id,
        title: 'To Acknowledge',
        message: 'Test',
        severity: AlertSeverity.WARNING,
      });

      const response = await agent
        .post('/api/alerts/acknowledge')
        .send({
          alertId: alert.id,
          acknowledgedBy: 'test-user',
          notes: 'Acknowledged via API',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(AlertStatus.ACKNOWLEDGED);
    });

    it('should reject acknowledgment without alertId', async () => {
      const response = await agent
        .post('/api/alerts/acknowledge')
        .send({ acknowledgedBy: 'user' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Alert ID is required');
    });
  });

  describe('POST /api/alerts/trigger', () => {
    it('should manually trigger alert', async () => {
      const rule = createAlertRule({
        name: 'Manual Trigger Test',
        condition: 'cpu > 80',
        cooldown: 0,
      });

      const response = await agent
        .post('/api/alerts/trigger')
        .send({
          ruleId: rule.id,
          metrics: { cpu: 85 },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return null when condition not met', async () => {
      const rule = createAlertRule({
        name: 'No Trigger Test',
        condition: 'cpu > 80',
      });

      const response = await agent
        .post('/api/alerts/trigger')
        .send({
          ruleId: rule.id,
          metrics: { cpu: 70 },
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeNull();
    });
  });

  describe('GET /api/alerts/stats', () => {
    it('should return alert statistics', async () => {
      const response = await agent.get('/api/alerts/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.active).toBeDefined();
      expect(response.body.data.severity).toBeDefined();
      expect(response.body.data.status).toBeDefined();
    });
  });
});
