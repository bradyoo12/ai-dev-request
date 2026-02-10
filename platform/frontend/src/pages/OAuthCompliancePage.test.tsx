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

vi.mock('../api/oauth-compliance', () => ({
  analyzeOAuthScopes: vi.fn(() => Promise.resolve({
    reportId: 'rpt-1',
    totalScopesDetected: 3,
    overPermissionedCount: 1,
    status: 'analyzed',
    createdAt: '2026-01-01T00:00:00Z',
  })),
  getOAuthReport: vi.fn(() => Promise.resolve({
    id: 'rpt-1',
    totalScopesDetected: 3,
    overPermissionedCount: 1,
    scopesAnalyzedJson: JSON.stringify([
      { provider: 'google', scope: 'email', detectedInFile: 'src/auth.ts', isOverPermissioned: false },
      { provider: 'google', scope: 'https://www.googleapis.com/auth/drive', detectedInFile: 'src/drive.ts', isOverPermissioned: true },
      { provider: 'github', scope: 'repo', detectedInFile: 'src/github.ts', isOverPermissioned: true },
    ]),
    recommendationsJson: JSON.stringify([
      { provider: 'google', currentScope: 'https://www.googleapis.com/auth/drive', recommendedScope: 'https://www.googleapis.com/auth/drive.file', reason: 'Use drive.file for app files only', severity: 'warning' },
      { provider: 'github', currentScope: 'repo', recommendedScope: 'public_repo', reason: 'Use public_repo if only public repos needed', severity: 'warning' },
    ]),
    complianceDocsJson: null,
    status: 'analyzed',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  })),
  generateComplianceDocs: vi.fn(() => Promise.resolve({
    id: 'rpt-1',
    status: 'docs_generated',
  })),
  getComplianceDocs: vi.fn(() => Promise.resolve(null)),
  getOAuthScopes: vi.fn(() => Promise.resolve([
    { provider: 'google', scope: 'email', description: 'Email Address', justification: 'Contact and account identification', isOverPermissioned: false, detectedInFile: 'src/auth.ts', minimalAlternative: null },
    { provider: 'google', scope: 'https://www.googleapis.com/auth/drive', description: 'Google Drive (Full)', justification: 'Manage app-specific files', isOverPermissioned: true, detectedInFile: 'src/drive.ts', minimalAlternative: 'https://www.googleapis.com/auth/drive.file' },
    { provider: 'github', scope: 'repo', description: 'Full Repository Access', justification: 'Read/write public repos', isOverPermissioned: true, detectedInFile: 'src/github.ts', minimalAlternative: 'public_repo' },
  ])),
}))

import OAuthCompliancePage from './OAuthCompliancePage'

beforeEach(() => { vi.clearAllMocks() })

describe('OAuthCompliancePage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<OAuthCompliancePage />)
    })
    expect(document.body).toBeTruthy()
  })

  it('shows header with title', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<OAuthCompliancePage />)
      container = result.container
    })
    expect(container!.textContent).toContain('OAuth Compliance')
  })

  it('displays summary cards with counts', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<OAuthCompliancePage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Total Scopes')
    expect(container!.textContent).toContain('Over-Permissioned')
  })

  it('displays detected scopes', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<OAuthCompliancePage />)
      container = result.container
    })
    expect(container!.textContent).toContain('google')
    expect(container!.textContent).toContain('email')
  })
})
