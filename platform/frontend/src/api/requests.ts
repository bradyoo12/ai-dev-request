import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export class InsufficientTokensError extends Error {
  required: number
  balance: number
  shortfall: number
  action: string

  constructor(data: { required: number; balance: number; shortfall: number; action: string }) {
    super(`Insufficient tokens. Required: ${data.required}, Balance: ${data.balance}`)
    this.name = 'InsufficientTokensError'
    this.required = data.required
    this.balance = data.balance
    this.shortfall = data.shortfall
    this.action = data.action
  }
}

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface CreateDevRequestDto {
  description: string;
  contactEmail?: string;
  contactPhone?: string;
  screenshotBase64?: string;
  screenshotMediaType?: string;
  framework?: string;
}

export interface DevRequestResponse {
  id: string;
  description: string;
  contactEmail?: string;
  hasScreenshot?: boolean;
  category: string;
  complexity: string;
  status: string;
  createdAt: string;
  analyzedAt?: string;
  proposedAt?: string;
  projectId?: string;
}

export interface RequirementsInfo {
  functional: string[];
  nonFunctional: string[];
  integrations: string[];
}

export interface FeasibilityInfo {
  score: number;
  risks: string[];
  questions: string[];
}

export interface TechStackInfo {
  frontend: string;
  backend: string;
  database: string;
  others: string[];
}

export interface AnalysisResponse {
  requestId: string;
  category: string;
  platform?: string;
  complexity: string;
  summary: string;
  requirements: RequirementsInfo;
  feasibility: FeasibilityInfo;
  estimatedDays: number;
  suggestedStack: TechStackInfo;
  tokensUsed?: number;
  newBalance?: number;
}

// Proposal Types
export interface ScopeInfo {
  included: string[];
  excluded: string[];
}

export interface ComponentInfo {
  name: string;
  description: string;
  technology: string;
}

export interface ArchitectureInfo {
  overview: string;
  components: ComponentInfo[];
  dataFlow: string;
}

export interface MilestoneInfo {
  phase: number;
  name: string;
  description: string;
  deliverables: string[];
  durationDays: number;
}

export interface CostBreakdown {
  item: string;
  amount: number;
}

export interface DevelopmentCost {
  amount: number;
  currency: string;
  breakdown: CostBreakdown[];
}

export interface MonthlyCost {
  hosting: number;
  maintenance: number;
  apiCosts: number;
  total: number;
}

export interface PricingInfo {
  development: DevelopmentCost;
  monthly: MonthlyCost;
}

export interface PhaseInfo {
  name: string;
  duration: string;
  description: string;
}

export interface TimelineInfo {
  totalDays: number;
  startDate: string;
  phases: PhaseInfo[];
}

export interface TermsInfo {
  payment: string;
  warranty: string;
  support: string;
}

export interface ProposalResult {
  title: string;
  summary: string;
  scope: ScopeInfo;
  architecture: ArchitectureInfo;
  milestones: MilestoneInfo[];
  pricing: PricingInfo;
  timeline: TimelineInfo;
  terms: TermsInfo;
  nextSteps: string[];
}

export interface ProposalResponse {
  requestId: string;
  proposal: ProposalResult;
  tokensUsed?: number;
  newBalance?: number;
}

// Production Types
export interface DeployConfigInfo {
  platform: string;
  settings: Record<string, unknown>;
}

export interface EnvVariableInfo {
  name: string;
  description: string;
  required: boolean;
}

export interface ProductionResult {
  projectId: string;
  projectPath: string;
  projectName: string;
  projectType: string;
  filesGenerated: number;
  setupCommands: string[];
  buildCommands: string[];
  deployConfig: DeployConfigInfo;
  envVariables: EnvVariableInfo[];
  status: string;
  stagingUrl?: string;
  message: string;
  verificationScore?: number;
  verificationPassed?: boolean;
  verificationSummary?: string;
  accessibilityScore?: number;
  accessibilitySummary?: string;
  accessibilityIssueCount?: number;
  testFilesGenerated?: number;
  totalTestCount?: number;
  testCoverageEstimate?: number;
  testFramework?: string;
  testSummary?: string;
  codeReviewScore?: number;
  securityScore?: number;
  performanceScore?: number;
  codeQualityScore?: number;
  codeReviewSummary?: string;
  codeReviewIssueCount?: number;
  ciCdProvider?: string;
  ciCdWorkflowCount?: number;
  ciCdSummary?: string;
  ciCdRequiredSecrets?: string[];
  hasDatabase?: boolean;
  databaseProvider?: string;
  databaseTableCount?: number;
  databaseRelationshipCount?: number;
  databaseSummary?: string;
  databaseTables?: string[];
  validationIterations?: number;
  fixHistory?: Array<{ iteration: number; issues: string[]; fixDescription: string }>;
  validationPassed?: boolean;
}

export interface ProductionResponse {
  requestId: string;
  production: ProductionResult;
  tokensUsed?: number;
  newBalance?: number;
}

export interface BuildStatusResponse {
  requestId: string;
  projectId?: string;
  projectPath?: string;
  status: string;
  buildStatus: string;
}

// Pricing Types
export interface PricingPlan {
  id: string;
  name: string;
  nameKorean: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  projectLimit: number;
  features: string[];
  isPopular: boolean;
}

export interface MonthlyCostBreakdown {
  hosting: number;
  maintenance: number;
  apiCosts: number;
  total: number;
}

export interface CostEstimate {
  developmentCost: number;
  estimatedDays: number;
  monthlyCosts: MonthlyCostBreakdown;
  currency: string;
  note: string;
}

const t = (key: string) => i18n.t(key);

// API Functions
export async function createRequest(data: CreateDevRequestDto): Promise<DevRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || t('api.error.createFailed'));
  }

  return response.json();
}

export async function getRequest(id: string): Promise<DevRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(t('api.error.notFound'));
  }

  return response.json();
}

export async function getRequests(page = 1, pageSize = 20): Promise<DevRequestResponse[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests?page=${page}&pageSize=${pageSize}`,
    { headers: authHeaders() }
  );

  if (!response.ok) {
    throw new Error(t('api.error.listFailed'));
  }

  return response.json();
}

export async function analyzeRequest(id: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/analyze`, {
    method: 'POST',
    headers: authHeaders(),
  });

  if (response.status === 402) {
    const data = await response.json();
    throw new InsufficientTokensError(data);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || t('api.error.analysisFailed'));
  }

  return response.json();
}

export async function getAnalysis(id: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/analysis`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(t('api.error.analysisLoadFailed'));
  }

  return response.json();
}

export async function generateProposal(id: string): Promise<ProposalResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/proposal`, {
    method: 'POST',
    headers: authHeaders(),
  });

  if (response.status === 402) {
    const data = await response.json();
    throw new InsufficientTokensError(data);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || t('api.error.proposalFailed'));
  }

  return response.json();
}

export async function getProposal(id: string): Promise<ProposalResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/proposal`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(t('api.error.proposalLoadFailed'));
  }

  return response.json();
}

export async function approveProposal(id: string): Promise<DevRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/proposal/approve`, {
    method: 'POST',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || t('api.error.approveFailed'));
  }

  return response.json();
}

export async function startBuild(id: string): Promise<ProductionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/build`, {
    method: 'POST',
    headers: authHeaders(),
  });

  if (response.status === 402) {
    const data = await response.json();
    throw new InsufficientTokensError(data);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || t('api.error.buildStartFailed'));
  }

  return response.json();
}

export async function getBuildStatus(id: string): Promise<BuildStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/build`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(t('api.error.buildStatusFailed'));
  }

  return response.json();
}

export async function completeRequest(id: string): Promise<DevRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/complete`, {
    method: 'POST',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || t('api.error.completeFailed'));
  }

  return response.json();
}

// Pricing API
export async function getPricingPlans(): Promise<PricingPlan[]> {
  const response = await fetch(`${API_BASE_URL}/api/pricing/plans`);

  if (!response.ok) {
    throw new Error(t('api.error.pricingFailed'));
  }

  return response.json();
}

export async function getCostEstimate(complexity: string, category: string): Promise<CostEstimate> {
  const response = await fetch(`${API_BASE_URL}/api/pricing/estimate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ complexity, category }),
  });

  if (!response.ok) {
    throw new Error(t('api.error.estimateFailed'));
  }

  return response.json();
}

// Export Types
export interface GitHubExportResponse {
  repoUrl: string;
  repoFullName: string;
  filesUploaded: number;
  totalFiles: number;
}

// Export API Functions
export async function exportZip(id: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/export/zip`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(t('api.error.exportZipFailed'));
  }

  return response.blob();
}

export async function exportToGitHub(id: string, accessToken: string, repoName?: string): Promise<GitHubExportResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/export/github`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ accessToken, repoName }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || t('api.error.exportGitHubFailed'));
  }

  return response.json();
}

// Version Control API
export interface ProjectVersion {
  id: string;
  versionNumber: number;
  label: string;
  source: string;
  fileCount: number;
  createdAt: string;
}

export async function getVersions(id: string): Promise<ProjectVersion[]> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/versions`, {
    headers: authHeaders(),
  });
  if (!response.ok) return [];
  return response.json();
}

export async function rollbackToVersion(id: string, versionId: string): Promise<ProjectVersion> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/versions/${versionId}/rollback`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Rollback failed');
  }
  return response.json();
}

// Template API
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  framework: string;
  tags: string[];
  promptTemplate: string;
  usageCount: number;
  createdBy: string;
}

// GitHub Sync API
export interface GitHubSyncStatus {
  linked: boolean;
  repoUrl?: string;
  repoFullName?: string;
}

export interface GitHubSyncResult {
  repoFullName: string;
  filesCreated: number;
  filesUpdated: number;
  totalFiles: number;
}

export async function getGitHubStatus(id: string): Promise<GitHubSyncStatus> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/github`, {
    headers: authHeaders(),
  });
  if (!response.ok) return { linked: false };
  return response.json();
}

export async function syncToGitHub(id: string, accessToken: string): Promise<GitHubSyncResult> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/github/sync`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ accessToken }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || t('api.error.githubSyncFailed'));
  }
  return response.json();
}

// Cost Report Types
export interface TierUsage {
  tier: string;
  category: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

export interface CostReport {
  totalEstimatedCost: number;
  estimatedSavingsVsOpusOnly: number;
  tierBreakdown: TierUsage[];
}

export async function getCostReport(requestId: string): Promise<CostReport | null> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/cost-report`, {
    headers: authHeaders(),
  });
  if (!response.ok) return null;
  return response.json();
}

// Expo Preview API
export interface ExpoPreviewResponse {
  previewUrl: string
  snackUrl: string
  success: boolean
  error?: string
}

export async function generateExpoPreview(requestId: string): Promise<ExpoPreviewResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/preview/expo`, {
    method: 'POST',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to generate Expo preview')
  }

  return response.json()
}

// Project Files API
export interface ProjectFilesResponse {
  files: Record<string, string>
  projectName: string | null
}

export async function getProjectFiles(requestId: string): Promise<ProjectFilesResponse | null> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/files`, {
    headers: authHeaders(),
  })

  if (!response.ok) return null
  return response.json()
}

export async function getExpoPreview(requestId: string): Promise<{ previewUrl: string; snackUrl: string } | null> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/preview`, {
    headers: authHeaders(),
  })

  if (!response.ok) return null
  return response.json()
}

export async function getTemplates(category?: string, framework?: string): Promise<ProjectTemplate[]> {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (framework) params.set('framework', framework);
  const query = params.toString() ? `?${params}` : '';
  const response = await fetch(`${API_BASE_URL}/api/templates${query}`);
  if (!response.ok) return [];
  return response.json();
}
