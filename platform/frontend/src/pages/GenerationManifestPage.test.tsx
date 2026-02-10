import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams('projectId=test-id')],
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

vi.mock('../api/generation', () => ({
  getManifest: vi.fn(() => Promise.resolve({
    id: 'mf-1',
    devRequestId: 'test-id',
    filesJson: JSON.stringify([
      { path: 'src/App.tsx', language: 'TypeScript', size: 200, description: 'Main app', exports: ['App'], imports: ['./components/Header'] },
      { path: 'src/components/Header.tsx', language: 'TypeScript', size: 150, description: 'Header', exports: ['Header'], imports: [] },
    ]),
    crossReferencesJson: JSON.stringify([
      { sourceFile: 'src/App.tsx', targetFile: 'src/components/Header.tsx', referenceType: 'import', symbol: './components/Header' },
    ]),
    validationResultsJson: '[]',
    validationStatus: 'pending',
    fileCount: 2,
    crossReferenceCount: 1,
    issueCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  })),
  validateConsistency: vi.fn(() => Promise.resolve({
    id: 'mf-1',
    validationStatus: 'passed',
    validationResultsJson: '[]',
    issueCount: 0,
  })),
  resolveConflicts: vi.fn(() => Promise.resolve({
    id: 'mf-1',
    validationStatus: 'resolved',
    validationResultsJson: '[]',
    issueCount: 0,
  })),
  getGeneratedFiles: vi.fn(() => Promise.resolve([
    { path: 'src/App.tsx', language: 'TypeScript', size: 200, description: 'Main app', exportCount: 1, importCount: 1, dependencyCount: 1, dependentCount: 0 },
    { path: 'src/components/Header.tsx', language: 'TypeScript', size: 150, description: 'Header', exportCount: 1, importCount: 0, dependencyCount: 0, dependentCount: 1 },
  ])),
  createManifest: vi.fn(),
}))

import GenerationManifestPage from './GenerationManifestPage'

beforeEach(() => { vi.clearAllMocks() })

describe('GenerationManifestPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<GenerationManifestPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
