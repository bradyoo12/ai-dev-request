import { authFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export interface AgentSkill {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category?: string;
  instructionContent?: string;
  scriptsJson?: string;
  resourcesJson?: string;
  tagsJson?: string;
  isBuiltIn: boolean;
  isPublic: boolean;
  downloadCount: number;
  version?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentDeployment {
  id: string;
  userId: string;
  agentSkillId: string;
  platform: string;
  status: string;
  configJson?: string;
  metricsJson?: string;
  deployedAt: string;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  platform: string;
  iconUrl: string;
  templateSpec: string;
}

export interface AgentPreview {
  name: string;
  description?: string;
  category?: string;
  instructionContent?: string;
  scriptsJson?: string;
  resourcesJson?: string;
  tagsJson?: string;
}

export async function generateAgent(specification: string): Promise<AgentSkill> {
  const res = await authFetch(`${API_URL}/api/agent-builder/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ specification }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to generate agent');
  }
  return res.json();
}

export async function previewAgent(specification: string): Promise<AgentPreview> {
  const res = await authFetch(`${API_URL}/api/agent-builder/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ specification }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to preview agent');
  }
  return res.json();
}

export async function getAgentTemplates(): Promise<AgentTemplate[]> {
  const res = await authFetch(`${API_URL}/api/agent-builder/templates`);
  return res.json();
}

export async function deployAgent(
  agentSkillId: string,
  platform: string,
  configJson?: string
): Promise<AgentDeployment> {
  const res = await authFetch(`${API_URL}/api/agent-builder/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentSkillId, platform, configJson }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to deploy agent');
  }
  return res.json();
}

export async function getDeployments(): Promise<AgentDeployment[]> {
  const res = await authFetch(`${API_URL}/api/agent-builder/deployments`);
  return res.json();
}

export async function undeployAgent(deploymentId: string): Promise<void> {
  const res = await authFetch(`${API_URL}/api/agent-builder/deployments/${deploymentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to undeploy agent');
  }
}
