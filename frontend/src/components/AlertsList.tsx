import React, { useState } from 'react';
import type { Alert } from '../types';
import './AlertsList.css';

interface AlertsListProps {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  onAcknowledge: (alertId: string) => Promise<void>;
  onRefresh: () => void;
}

const AlertIcon: React.FC<{ level: Alert['level'] }> = ({ level }) => {
  switch (level) {
    case 'info':
      return <span className="alert-icon">ℹ️</span>;
    case 'warning':
      return <span className="alert-icon">⚠️</span>;
    case 'error':
      return <span className="alert-icon">❌</span>;
    case 'critical':
      return <span className="alert-icon">🚨</span>;
    default:
      return <span className="alert-icon">📋</span>;
  }
};

const getLevelColor = (level: Alert['level']): string => {
  switch (level) {
    case 'info':
      return '#60a5fa';
    case 'warning':
      return '#fbbf24';
    case 'error':
      return '#ef4444';
    case 'critical':
      return '#dc2626';
    default:
      return '#888';
  }
};

const AlertsList: React.FC<AlertsListProps> = ({
  alerts,
  loading,
  error,
  onAcknowledge,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('active');
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgingId(alertId);
    try {
      await onAcknowledge(alertId);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'active') return !alert.acknowledged;
    if (filter === 'acknowledged') return alert.acknowledged;
    return true;
  });

  const activeCount = alerts.filter((a) => !a.acknowledged).length;

  if (loading) {
    return (
      <div className="alerts-list loading">
        <div className="loading-spinner">Loading alerts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alerts-list error">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="alerts-list">
      <div className="alerts-header">
        <div className="alerts-title">
          <h2>🔔 Alerts</h2>
          {activeCount > 0 && <span className="active-count">{activeCount} active</span>}
        </div>
        <div className="alerts-actions">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button
              className={`filter-btn ${filter === 'acknowledged' ? 'active' : ''}`}
              onClick={() => setFilter('acknowledged')}
            >
              Acknowledged
            </button>
          </div>
          <button className="refresh-btn" onClick={onRefresh} title="Refresh">
            🔄
          </button>
        </div>
      </div>

      <div className="alerts-container">
        {filteredAlerts.length === 0 ? (
          <div className="no-alerts">
            <p>
              {filter === 'active'
                ? 'No active alerts! 🎉'
                : filter === 'acknowledged'
                  ? 'No acknowledged alerts.'
                  : 'No alerts.'}
            </p>
          </div>
        ) : (
          <ul className="alerts-items">
            {filteredAlerts.map((alert) => (
              <li
                key={alert.id}
                className={`alert-item ${alert.acknowledged ? 'acknowledged' : ''} ${
                  acknowledgingId === alert.id ? 'acknowledging' : ''
                }`}
                style={{ borderLeftColor: getLevelColor(alert.level) }}
              >
                <div className="alert-content">
                  <div className="alert-header">
                    <AlertIcon level={alert.level} />
                    <span className="alert-level" style={{ color: getLevelColor(alert.level) }}>
                      {alert.level.toUpperCase()}
                    </span>
                    <span className="alert-source">{alert.source}</span>
                    <span className="alert-time">{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                  <h3 className="alert-title">{alert.title}</h3>
                  <p className="alert-message">{alert.message}</p>
                </div>
                {!alert.acknowledged && (
                  <button
                    className="acknowledge-btn"
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={acknowledgingId === alert.id}
                  >
                    {acknowledgingId === alert.id ? '...' : '✓ Acknowledge'}
                  </button>
                )}
                {alert.acknowledged && <span className="acknowledged-badge">✓ Acknowledged</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AlertsList;
