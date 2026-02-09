import i18n from '../i18n';
import { getAuthHeaders } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  customDomain?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TenantDetail extends Tenant {
  faviconUrl?: string;
  customCss?: string;
  aiPromptGuidelines?: string;
  welcomeMessage?: string;
  updatedAt: string;
}

export interface Partner {
  id: number;
  companyName: string;
  contactEmail?: string;
  marginPercent: number;
  commissionRate: number;
  status?: string;
  joinedAt: string;
}

export interface UsageSummary {
  totalTokens: number;
  totalActions: number;
  actionBreakdown: { action: string; tokens: number; count: number }[];
  period: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || i18n.t('api.error.unknown'));
  }
  return res.json();
}

export function getTenants() {
  return request<Tenant[]>('/api/whitelabel/tenants');
}

export function getTenant(id: number) {
  return request<TenantDetail>(`/api/whitelabel/tenants/${id}`);
}

export function createTenant(name: string, slug: string) {
  return request<{ id: number; name: string; slug: string }>('/api/whitelabel/tenants', {
    method: 'POST',
    body: JSON.stringify({ name, slug }),
  });
}

export function updateTenant(id: number, data: Partial<TenantDetail>) {
  return request<{ id: number; name: string; updated: boolean }>(`/api/whitelabel/tenants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteTenant(id: number) {
  return request<{ deleted: boolean }>(`/api/whitelabel/tenants/${id}`, { method: 'DELETE' });
}

export function getPartners(tenantId: number) {
  return request<Partner[]>(`/api/whitelabel/tenants/${tenantId}/partners`);
}

export function addPartner(tenantId: number, companyName: string, contactEmail: string | undefined, marginPercent: number) {
  return request<{ id: number; companyName: string }>(`/api/whitelabel/tenants/${tenantId}/partners`, {
    method: 'POST',
    body: JSON.stringify({ companyName, contactEmail, marginPercent }),
  });
}

export function updatePartner(partnerId: number, data: { status?: string; marginPercent?: number }) {
  return request<{ updated: boolean }>(`/api/whitelabel/partners/${partnerId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function removePartner(partnerId: number) {
  return request<{ deleted: boolean }>(`/api/whitelabel/partners/${partnerId}`, { method: 'DELETE' });
}

export function getUsageSummary(tenantId: number) {
  return request<UsageSummary>(`/api/whitelabel/tenants/${tenantId}/usage/summary`);
}
