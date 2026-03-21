import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchAgents } from '../services/agent.service';
import type { Agent, AgentStatusFilter } from '../types/agent';
import './AgentList.css';

export function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AgentStatusFilter>('all');

  const loadAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const statusParam = statusFilter === 'all' ? undefined : statusFilter;
      const response = await fetchAgents(statusParam);
      setAgents(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

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

  if (loading) {
    return <div className="loading">Loading agents...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={loadAgents}>Retry</button>
      </div>
    );
  }

  return (
    <div className="agent-list-container">
      <header className="agent-list-header">
        <h1>🤖 Agent Management</h1>
        <div className="filter-controls">
          <label htmlFor="status-filter">Filter by status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AgentStatusFilter)}
          >
            <option value="all">All Agents</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </header>

      <div className="agent-stats">
        <span className="stat">Total: {agents.length}</span>
        <span className="stat running">
          Running: {agents.filter((a) => a.status === 'running').length}
        </span>
        <span className="stat stopped">
          Stopped: {agents.filter((a) => a.status === 'stopped').length}
        </span>
      </div>

      <div className="agent-grid">
        {agents.map((agent) => (
          <div key={agent.name} className="agent-card">
            <div className="agent-card-header">
              <h3>
                {agent.isDefault && <span className="default-badge">⭐ </span>}
                {agent.name}
              </h3>
              <span className={`agent-status ${getStatusColor(agent.status)}`}>{agent.status}</span>
            </div>
            <div className="agent-card-body">
              <p className="agent-model">
                <strong>Model:</strong> {agent.model}
              </p>
              <p className="agent-workspace">
                <strong>Workspace:</strong>{' '}
                <span className="workspace-path">{agent.workspace}</span>
              </p>
              <p className="agent-routing">
                <strong>Routing:</strong> {agent.routing}
              </p>
              <p className="agent-rules">
                <strong>Routing Rules:</strong> {agent.routingRules}
              </p>
            </div>
            <div className="agent-card-actions">
              <Link to={`/agents/${agent.name}`} className="btn btn-primary">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="empty-state">
          <p>No agents found</p>
        </div>
      )}
    </div>
  );
}
