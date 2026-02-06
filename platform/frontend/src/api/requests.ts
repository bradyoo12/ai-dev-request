const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface CreateDevRequestDto {
  description: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface DevRequestResponse {
  id: string;
  description: string;
  contactEmail?: string;
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
  complexity: string;
  summary: string;
  requirements: RequirementsInfo;
  feasibility: FeasibilityInfo;
  estimatedDays: number;
  suggestedStack: TechStackInfo;
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
}

export interface ProductionResponse {
  requestId: string;
  production: ProductionResult;
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

// API Functions
export async function createRequest(data: CreateDevRequestDto): Promise<DevRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '요청 생성에 실패했습니다.');
  }

  return response.json();
}

export async function getRequest(id: string): Promise<DevRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}`);

  if (!response.ok) {
    throw new Error('요청을 찾을 수 없습니다.');
  }

  return response.json();
}

export async function getRequests(page = 1, pageSize = 20): Promise<DevRequestResponse[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests?page=${page}&pageSize=${pageSize}`
  );

  if (!response.ok) {
    throw new Error('요청 목록을 불러올 수 없습니다.');
  }

  return response.json();
}

export async function analyzeRequest(id: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/analyze`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '분석에 실패했습니다.');
  }

  return response.json();
}

export async function getAnalysis(id: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/analysis`);

  if (!response.ok) {
    throw new Error('분석 결과를 불러올 수 없습니다.');
  }

  return response.json();
}

export async function generateProposal(id: string): Promise<ProposalResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/proposal`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '제안서 생성에 실패했습니다.');
  }

  return response.json();
}

export async function getProposal(id: string): Promise<ProposalResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/proposal`);

  if (!response.ok) {
    throw new Error('제안서를 불러올 수 없습니다.');
  }

  return response.json();
}

export async function approveProposal(id: string): Promise<DevRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/proposal/approve`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '제안서 승인에 실패했습니다.');
  }

  return response.json();
}

export async function startBuild(id: string): Promise<ProductionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/build`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '빌드 시작에 실패했습니다.');
  }

  return response.json();
}

export async function getBuildStatus(id: string): Promise<BuildStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/build`);

  if (!response.ok) {
    throw new Error('빌드 상태를 불러올 수 없습니다.');
  }

  return response.json();
}

export async function completeRequest(id: string): Promise<DevRequestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}/complete`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '완료 처리에 실패했습니다.');
  }

  return response.json();
}

// Pricing API
export async function getPricingPlans(): Promise<PricingPlan[]> {
  const response = await fetch(`${API_BASE_URL}/api/pricing/plans`);

  if (!response.ok) {
    throw new Error('요금제를 불러올 수 없습니다.');
  }

  return response.json();
}

export async function getCostEstimate(complexity: string, category: string): Promise<CostEstimate> {
  const response = await fetch(`${API_BASE_URL}/api/pricing/estimate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ complexity, category }),
  });

  if (!response.ok) {
    throw new Error('견적 계산에 실패했습니다.');
  }

  return response.json();
}
