const API_URL = import.meta.env.VITE_API_URL;

export interface GenerateAgentRequest {
  description: string;
  userId?: string;
  modelId?: string;
}

export interface RefineAgentRequest {
  currentAgentJson: string;
  refinementInstructions: string;
  userId?: string;
  modelId?: string;
}

export interface GenerateAgentResult {
  agentJson: string;
  name: string;
  description: string;
  category: string;
  suggestedTags: string[];
}

export interface AgentExample {
  title: string;
  description: string;
  category: string;
  examplePrompt: string;
}

export async function generateAgent(request: GenerateAgentRequest): Promise<GenerateAgentResult> {
  const res = await fetch(`${API_URL}/api/agent-builder/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to generate agent');
  }

  return res.json();
}

export async function refineAgent(request: RefineAgentRequest): Promise<GenerateAgentResult> {
  const res = await fetch(`${API_URL}/api/agent-builder/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to refine agent');
  }

  return res.json();
}

export async function getExampleAgents(): Promise<AgentExample[]> {
  const res = await fetch(`${API_URL}/api/agent-builder/examples`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to load example agents');
  }

  return res.json();
}
