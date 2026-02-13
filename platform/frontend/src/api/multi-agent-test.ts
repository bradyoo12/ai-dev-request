const API_URL = import.meta.env.VITE_API_URL;

export interface MultiAgentTestSession {
  id: string;
  devRequestId: string;
  status: string;
  personaCount: number;
  concurrencyLevel: number;
  scenarioType: string;
  configJson?: string;
  resultsJson?: string;
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  issuesDetected: number;
  overallScore: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface TestPersona {
  id: string;
  sessionId: string;
  personaType: string;
  personaName: string;
  behaviorJson?: string;
  agentId?: string;
  status: string;
  actionsPerformed: number;
  actionsSucceeded: number;
  actionsFailed: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AgentTestExecution {
  id: string;
  sessionId: string;
  personaId: string;
  status: string;
  actionsJson?: string;
  issuesJson?: string;
  logsJson?: string;
  actionsCount: number;
  issuesCount: number;
  errorMessage?: string;
  stackTrace?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ConcurrencyIssue {
  id: string;
  sessionId: string;
  issueType: string;
  severity: string;
  affectedPersonasJson?: string;
  description: string;
  resourcePath?: string;
  conflictingOperations?: string;
  stackTrace?: string;
  suggestedFixJson?: string;
  confidenceScore: number;
  status: string;
  detectedAt: string;
  resolvedAt?: string;
}

export interface SessionReport {
  session: MultiAgentTestSession;
  personas: TestPersona[];
  executions: AgentTestExecution[];
  issues: ConcurrencyIssue[];
}

export interface CodeFix {
  issueType: string;
  severity: string;
  description: string;
  filePath?: string;
  originalCode: string;
  fixedCode: string;
  explanation: string;
  confidence: number;
}

export interface RefineResult {
  hasFixes: boolean;
  message: string;
  fixes: CodeFix[];
}

export interface CreateSessionRequest {
  devRequestId: string;
  scenarioType: string;
  concurrencyLevel: number;
  personaTypes: string[];
}

export async function createSession(request: CreateSessionRequest): Promise<MultiAgentTestSession> {
  const response = await fetch(`${API_URL}/api/multi-agent-test/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to create session');
  return response.json();
}

export async function startSession(sessionId: string): Promise<MultiAgentTestSession> {
  const response = await fetch(`${API_URL}/api/multi-agent-test/sessions/${sessionId}/start`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to start session');
  return response.json();
}

export async function getSessionStatus(sessionId: string): Promise<MultiAgentTestSession> {
  const response = await fetch(`${API_URL}/api/multi-agent-test/sessions/${sessionId}/status`);
  if (!response.ok) throw new Error('Failed to get session status');
  return response.json();
}

export async function getSessionReport(sessionId: string): Promise<SessionReport> {
  const response = await fetch(`${API_URL}/api/multi-agent-test/sessions/${sessionId}/report`);
  if (!response.ok) throw new Error('Failed to get session report');
  return response.json();
}

export async function getSessions(devRequestId?: string): Promise<MultiAgentTestSession[]> {
  const url = devRequestId
    ? `${API_URL}/api/multi-agent-test/sessions?devRequestId=${devRequestId}`
    : `${API_URL}/api/multi-agent-test/sessions`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to get sessions');
  return response.json();
}

export async function getSessionPersonas(sessionId: string): Promise<TestPersona[]> {
  const response = await fetch(`${API_URL}/api/multi-agent-test/sessions/${sessionId}/personas`);
  if (!response.ok) throw new Error('Failed to get personas');
  return response.json();
}

export async function getSessionIssues(sessionId: string): Promise<ConcurrencyIssue[]> {
  const response = await fetch(`${API_URL}/api/multi-agent-test/sessions/${sessionId}/issues`);
  if (!response.ok) throw new Error('Failed to get issues');
  return response.json();
}

export async function generateRefinement(sessionId: string): Promise<RefineResult> {
  const response = await fetch(`${API_URL}/api/multi-agent-test/sessions/${sessionId}/refine`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to generate refinement');
  return response.json();
}

export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/multi-agent-test/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete session');
}
