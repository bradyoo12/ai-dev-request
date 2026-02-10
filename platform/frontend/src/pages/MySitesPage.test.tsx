import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/sites', () => ({
  getSites: vi.fn(),
  getSiteDetail: vi.fn(),
  deleteSite: vi.fn(),
  redeploySite: vi.fn(),
}))

vi.mock('../api/domains', () => ({
  searchDomains: vi.fn(),
  getSiteDomain: vi.fn(() => Promise.resolve(null)),
  purchaseDomain: vi.fn(),
  removeSiteDomain: vi.fn(),
}))

import { getSites } from '../api/sites'
import MySitesPage from './MySitesPage'

beforeEach(() => { vi.clearAllMocks() })

describe('MySitesPage', () => {
  it('shows loading state', async () => {
    vi.mocked(getSites).mockReturnValue(new Promise(() => {}))
    await act(async () => {
      render(<MySitesPage />)
    })
    expect(screen.getByText('sites.loading')).toBeInTheDocument()
  })

  it('shows empty state', async () => {
    vi.mocked(getSites).mockResolvedValue([])
    await act(async () => {
      render(<MySitesPage />)
    })
    expect(screen.getByText('sites.empty.title')).toBeInTheDocument()
  })

  it('renders sites list', async () => {
    vi.mocked(getSites).mockResolvedValue([
      { id: '1', siteName: 'My Site', status: 'Running', region: 'eastus', createdAt: '2024-01-01', previewUrl: 'https://mysite.com', resourceGroupName: 'rg-1', projectType: 'react' },
    ] as any)
    await act(async () => {
      render(<MySitesPage />)
    })
    expect(screen.getByText('My Site')).toBeInTheDocument()
  })

  it('shows error on failure', async () => {
    vi.mocked(getSites).mockRejectedValue(new Error('Network error'))
    await act(async () => {
      render(<MySitesPage />)
    })
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })
})
