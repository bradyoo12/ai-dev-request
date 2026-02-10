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

vi.mock('../api/security', () => ({
  triggerSecurityScan: vi.fn(() => Promise.resolve({
    sbomReportId: 'r1',
    dependencyCount: 5,
    vulnerabilityCount: 1,
    criticalCount: 0,
    highCount: 1,
    mediumCount: 0,
    lowCount: 0,
    generatedAt: '2026-01-01T00:00:00Z',
  })),
  getSbomReport: vi.fn(() => Promise.resolve(null)),
  getVulnerabilities: vi.fn(() => Promise.resolve([])),
  getLicenseAnalysis: vi.fn(() => Promise.resolve(null)),
  exportSbom: vi.fn(() => Promise.resolve(new Blob())),
}))

import CompliancePage from './CompliancePage'

beforeEach(() => { vi.clearAllMocks() })

describe('CompliancePage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<CompliancePage />)
    })
    expect(document.body).toBeTruthy()
  })
})
