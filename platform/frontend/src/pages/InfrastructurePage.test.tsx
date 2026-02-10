import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams('requestId=test-id')],
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    authUser: { id: '1', email: 'test@test.com', displayName: 'Test', isAdmin: false },
  }),
}))

vi.mock('../api/infrastructure', () => ({
  analyzeInfrastructure: vi.fn(() => Promise.resolve({
    id: 'cfg-1',
    devRequestId: 'test-id',
    selectedServices: ['container_apps', 'postgresql'],
    tier: 'Basic',
    estimatedMonthlyCostUsd: 25,
    analysisSummary: 'Recommended services for your project.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  })),
  getInfrastructureConfig: vi.fn(() => Promise.resolve(null)),
  updateInfrastructureConfig: vi.fn(() => Promise.resolve({
    id: 'cfg-1',
    selectedServices: ['container_apps'],
    tier: 'Free',
    estimatedMonthlyCostUsd: 0,
  })),
  generateBicep: vi.fn(() => Promise.resolve({
    id: 'cfg-1',
    generatedBicepMain: 'targetScope = \'resourceGroup\'',
    generatedBicepParameters: 'using \'main.bicep\'',
  })),
  getCostEstimation: vi.fn(() => Promise.resolve({
    lineItems: [
      { service: 'container_apps', displayName: 'Azure Container Apps', monthlyCostUsd: 10, tier: 'Basic' },
    ],
    totalMonthlyCostUsd: 10,
    tier: 'Basic',
    currency: 'USD',
  })),
  downloadTemplates: vi.fn(() => Promise.resolve(new Blob())),
}))

import InfrastructurePage from './InfrastructurePage'

beforeEach(() => { vi.clearAllMocks() })

describe('InfrastructurePage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<InfrastructurePage />)
    })
    expect(document.body).toBeTruthy()
  })

  it('shows header with title', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<InfrastructurePage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Infrastructure as Code')
  })
})
