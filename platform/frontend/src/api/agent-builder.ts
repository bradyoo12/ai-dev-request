import { authFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export interface AgentAnalysisResult {
  success: boolean;
  errorMessage?: string;
  capabilities: string[];
  integrations: string[];
  configuration: Record<string, string>;
  requirements: string[];
}

export interface AgentBlueprint {
  id: string;
  userId: string;
  name: string;
  description: string;
  agentType: string;
  capabilitiesJson?: string;
  integrationsJson?: string;
  configurationJson?: string;
  generatedCode?: string;
  status: string;
  errorMessage?: string;
  generatedSkillId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  agentType: string;
  icon: string;
  useCount: number;
  sampleCapabilities: string[];
}

export interface CreateBlueprintRequest {
  name: string;
  description: string;
  agentType: string;
  capabilitiesJson?: string;
  integrationsJson?: string;
}

export interface UpdateBlueprintRequest {
  name?: string;
  description?: string;
  capabilitiesJson?: string;
  integrationsJson?: string;
}

export async function analyzeDescription(
  description: string,
  agentType: string
): Promise<AgentAnalysisResult> {
  const response = await authFetch(`${API_URL}/api/agent-builder/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, agentType }),
  });
  return response.json();
}

export async function createBlueprint(
  data: CreateBlueprintRequest
): Promise<AgentBlueprint> {
  const response = await authFetch(`${API_URL}/api/agent-builder/blueprints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function getBlueprints(): Promise<AgentBlueprint[]> {
  const response = await authFetch(`${API_URL}/api/agent-builder/blueprints`);
  return response.json();
}

export async function getBlueprintById(id: string): Promise<AgentBlueprint> {
  const response = await authFetch(`${API_URL}/api/agent-builder/blueprints/${id}`);
  return response.json();
}

export async function updateBlueprint(
  id: string,
  data: UpdateBlueprintRequest
): Promise<AgentBlueprint> {
  const response = await authFetch(`${API_URL}/api/agent-builder/blueprints/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteBlueprint(id: string): Promise<void> {
  await authFetch(`${API_URL}/api/agent-builder/blueprints/${id}`, {
    method: 'DELETE',
  });
}

export async function generateAgent(blueprintId: string): Promise<AgentBlueprint> {
  const response = await authFetch(
    `${API_URL}/api/agent-builder/blueprints/${blueprintId}/generate`,
    {
      method: 'POST',
    }
  );
  return response.json();
}

export async function getGenerationStatus(blueprintId: string): Promise<{
  status: string;
  errorMessage?: string;
  updatedAt: string;
}> {
  const response = await authFetch(
    `${API_URL}/api/agent-builder/blueprints/${blueprintId}/status`
  );
  return response.json();
}

export async function convertToSkill(blueprintId: string): Promise<any> {
  const response = await authFetch(
    `${API_URL}/api/agent-builder/blueprints/${blueprintId}/convert-to-skill`,
    {
      method: 'POST',
    }
  );
  return response.json();
}

export async function getAgentTemplates(): Promise<AgentTemplate[]> {
  const response = await authFetch(`${API_URL}/api/agent-builder/templates`);
  return response.json();
}

export async function exportToMarketplace(blueprintId: string): Promise<void> {
  await authFetch(`${API_URL}/api/agent-builder/blueprints/${blueprintId}/export`, {
    method: 'POST',
  });
}
