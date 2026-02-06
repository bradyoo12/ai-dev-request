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
