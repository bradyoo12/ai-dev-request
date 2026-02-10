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

vi.mock('../api/preview', () => ({
  deployPreview: vi.fn(() => Promise.resolve({
    id: 'p-1',
    devRequestId: 'test-id',
    status: 'Deployed',
    previewUrl: 'https://abc12345-preview.azurestaticapps.net',
    provider: 'azure-static-web-apps',
    deployedAt: '2026-02-11T00:00:00Z',
    expiresAt: '2026-02-12T00:00:00Z',
    createdAt: '2026-02-11T00:00:00Z',
  })),
  getPreviewStatus: vi.fn(() => Promise.resolve({
    id: 'p-1',
    devRequestId: 'test-id',
    status: 'Deployed',
    previewUrl: 'https://abc12345-preview.azurestaticapps.net',
    provider: 'azure-static-web-apps',
    deployedAt: '2026-02-11T00:00:00Z',
    expiresAt: '2026-02-12T00:00:00Z',
    createdAt: '2026-02-11T00:00:00Z',
  })),
  getPreviewUrl: vi.fn(() => Promise.resolve('https://abc12345-preview.azurestaticapps.net')),
  expirePreview: vi.fn(() => Promise.resolve({
    id: 'p-1',
    status: 'Expired',
    previewUrl: 'https://abc12345-preview.azurestaticapps.net',
  })),
  listPreviews: vi.fn(() => Promise.resolve([
    {
      id: 'p-1',
      devRequestId: 'test-id',
      status: 'Deployed',
      previewUrl: 'https://abc12345-preview.azurestaticapps.net',
      provider: 'azure-static-web-apps',
      createdAt: '2026-02-11T00:00:00Z',
    },
  ])),
}))

import PreviewDeploymentPage from './PreviewDeploymentPage'

beforeEach(() => { vi.clearAllMocks() })

describe('PreviewDeploymentPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<PreviewDeploymentPage />)
    })
    expect(document.body).toBeTruthy()
  })

  it('shows header with title', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<PreviewDeploymentPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Preview Deployments')
  })

  it('shows active preview with URL', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<PreviewDeploymentPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('abc12345-preview.azurestaticapps.net')
  })

  it('shows preview history', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<PreviewDeploymentPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Preview History')
  })
})
