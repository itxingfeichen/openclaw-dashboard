import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchAgent, startAgent, stopAgent, restartAgent } from '../services/agent.service';
import type { Agent } from '../types/agent';
import './AgentDetail.css';

export function AgentDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);

  const loadAgent = useCallback(async () => {
    if (!name) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAgent(name);
      setAgent(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent details');
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    if (name) {
      loadAgent();
    }
  }, [name, loadAgent]);

  const handleOperation = async (operation: 'start' | 'stop' | 'restart') => {
    if (!name) return;

    try {
      setOperationLoading(operation);
      setOperationMessage(null);

      let result;
      switch (operation) {
        case 'start':
          result = await startAgent(name);
          break;
        case 'stop':
          result = await stopAgent(name);
          break;
        case 'restart':
          result = await restartAgent(name);
          break;
      }

      if (result.success) {
        setOperationMessage(`✅ ${result.message}`);
        // Refresh agent data
        await loadAgent();
      } else {
        setOperationMessage(`❌ ${result.message}`);
      }
    } catch (err) {
      setOperationMessage(
        `❌ Failed to ${operation} agent: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setOperationLoading(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading agent details...</div>;
  }

  if (error || !agent) {
    return (
      <div className="error">
        <p>{error || 'Agent not found'}</p>
        <button onClick={() => navigate('/agents')}>Back to Agents</button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'status-running';
      case 'stopped':
        return 'status-stopped';
      default:
        return 'status-unknown';
    }
  };

  return (
    <div className="agent-detail-container">
      <nav className="breadcrumb">
        <Link to="/agents">Agents</Link>
        <span className="separator">/</span>
        <span className="current">{agent.name}</span>
      </nav>

      <header className="agent-detail-header">
        <div className="agent-title">
          <h1>
            {agent.isDefault && <span className="default-badge">⭐ </span>}
            {agent.name}
          </h1>
          <span className={`agent-status ${getStatusColor(agent.status)}`}>{agent.status}</span>
        </div>
      </header>

      {operationMessage && (
        <div
          className={`operation-message ${operationMessage.includes('✅') ? 'success' : 'error'}`}
        >
          {operationMessage}
        </div>
      )}

      <div className="agent-detail-content">
        <section className="detail-section">
          <h2>📋 Agent Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Name:</label>
              <span>{agent.name}</span>
            </div>
            <div className="info-item">
              <label>Status:</label>
              <span className={`status-badge ${getStatusColor(agent.status)}`}>{agent.status}</span>
            </div>
            <div className="info-item">
              <label>Model:</label>
              <span>{agent.model}</span>
            </div>
            <div className="info-item">
              <label>Default Agent:</label>
              <span>{agent.isDefault ? 'Yes' : 'No'}</span>
            </div>
            <div className="info-item">
              <label>Routing Rules:</label>
              <span>{agent.routingRules}</span>
            </div>
            <div className="info-item">
              <label>Routing Mode:</label>
              <span>{agent.routing}</span>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h2>📁 Workspace</h2>
          <div className="workspace-info">
            <div className="info-item">
              <label>Workspace Path:</label>
              <code className="path-code">{agent.workspace}</code>
            </div>
            <div className="info-item">
              <label>Agent Directory:</label>
              <code className="path-code">{agent.agentDir}</code>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h2>⚙️ Actions</h2>
          <div className="action-buttons">
            <button
              className="btn btn-success"
              onClick={() => handleOperation('start')}
              disabled={operationLoading !== null || agent.status === 'running'}
            >
              {operationLoading === 'start' ? 'Starting...' : '▶️ Start'}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleOperation('stop')}
              disabled={operationLoading !== null || agent.status === 'stopped'}
            >
              {operationLoading === 'stop' ? 'Stopping...' : '⏹️ Stop'}
            </button>
            <button
              className="btn btn-warning"
              onClick={() => handleOperation('restart')}
              disabled={operationLoading !== null}
            >
              {operationLoading === 'restart' ? 'Restarting...' : '🔄 Restart'}
            </button>
            <button
              className="btn btn-primary"
              onClick={loadAgent}
              disabled={operationLoading !== null}
            >
              🔄 Refresh
            </button>
          </div>
        </section>

        <section className="detail-section">
          <h2>🔗 Quick Links</h2>
          <div className="quick-links">
            <Link to="/agents" className="link-item">
              ← Back to Agent List
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
