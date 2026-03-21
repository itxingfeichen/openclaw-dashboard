/**
 * Agent API service
 */

import type { AgentsResponse, AgentResponse, AgentOperationResponse } from '../types/agent';

const API_BASE_URL = '/api';

/**
 * Fetch all agents with optional status filter
 */
export const fetchAgents = async (status?: string): Promise<AgentsResponse> => {
  const url = status ? `${API_BASE_URL}/agents?status=${status}` : `${API_BASE_URL}/agents`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch agents');
  }
  return response.json();
};

/**
 * Fetch a specific agent by name
 */
export const fetchAgent = async (name: string): Promise<AgentResponse> => {
  const response = await fetch(`${API_BASE_URL}/agents/${name}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch agent: ${name}`);
  }
  return response.json();
};

/**
 * Start an agent
 */
export const startAgent = async (name: string): Promise<AgentOperationResponse> => {
  const response = await fetch(`${API_BASE_URL}/agents/${name}/start`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to start agent: ${name}`);
  }
  return response.json();
};

/**
 * Stop an agent
 */
export const stopAgent = async (name: string): Promise<AgentOperationResponse> => {
  const response = await fetch(`${API_BASE_URL}/agents/${name}/stop`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to stop agent: ${name}`);
  }
  return response.json();
};

/**
 * Restart an agent
 */
export const restartAgent = async (name: string): Promise<AgentOperationResponse> => {
  const response = await fetch(`${API_BASE_URL}/agents/${name}/restart`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to restart agent: ${name}`);
  }
  return response.json();
};
