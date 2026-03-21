/**
 * Agent types for frontend
 */

export interface Agent {
  name: string;
  workspace: string;
  agentDir: string;
  model: string;
  routingRules: number;
  routing: string;
  status: 'running' | 'stopped' | 'unknown';
  isDefault?: boolean;
}

export interface AgentsResponse {
  success: boolean;
  data: Agent[];
  total: number;
}

export interface AgentResponse {
  success: boolean;
  data: Agent;
}

export interface AgentOperationResponse {
  success: boolean;
  message: string;
  agentName?: string;
}

export type AgentStatusFilter = 'all' | 'running' | 'stopped' | 'unknown';
