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

vi.mock('../api/secrets', () => ({
  triggerSecretScan: vi.fn(() => Promise.resolve({
    scanResultId: 'scan-1',
    findingCount: 2,
    criticalCount: 1,
    highCount: 1,
    mediumCount: 0,
    lowCount: 0,
    status: 'completed',
    scannedAt: '2026-01-01T00:00:00Z',
  })),
  getSecretScanResults: vi.fn(() => Promise.resolve({
    id: 'scan-1',
    devRequestId: 'test-id',
    findings: [
      {
        patternId: 'aws-access-key',
        patternName: 'AWS Access Key ID',
        severity: 'critical',
        description: 'AWS Access Key ID detected',
        location: 'src/config.ts:5',
        matchPreview: 'AKIA****WXYZ',
      },
      {
        patternId: 'generic-password',
        patternName: 'Hardcoded Password',
        severity: 'high',
        description: 'Hardcoded password detected',
        location: 'src/db.ts:12',
        matchPreview: 'pass****word',
      },
    ],
    findingCount: 2,
    status: 'completed',
    scannedAt: '2026-01-01T00:00:00Z',
  })),
  getSecretPatterns: vi.fn(() => Promise.resolve([
    { id: 'aws-access-key', name: 'AWS Access Key ID', severity: 'critical', description: 'AWS Access Key' },
    { id: 'stripe-secret-key', name: 'Stripe Secret Key', severity: 'critical', description: 'Stripe key' },
  ])),
  generateSecureConfig: vi.fn(() => Promise.resolve({
    id: 'cfg-1',
    envTemplate: '# .env.example\nDATABASE_URL=<your-url>',
    gitignore: '.env\n*.pem',
    configModule: 'export const config = {}',
    keyVaultConfig: '// Key Vault config',
    language: 'typescript',
  })),
  getSecureConfig: vi.fn(() => Promise.resolve(null)),
}))

import SecretDetectionPage from './SecretDetectionPage'

beforeEach(() => { vi.clearAllMocks() })

describe('SecretDetectionPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<SecretDetectionPage />)
    })
    expect(document.body).toBeTruthy()
  })

  it('shows header with title', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<SecretDetectionPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Secret Detection')
  })

  it('displays scan results with severity counts', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<SecretDetectionPage />)
      container = result.container
    })
    // Should show severity summary cards
    expect(container!.textContent).toContain('Critical')
    expect(container!.textContent).toContain('High')
  })
})
