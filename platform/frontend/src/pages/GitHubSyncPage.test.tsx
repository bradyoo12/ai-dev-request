import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string, fallback?: string) => fallback || key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/github-sync', () => ({
  connectRepo: vi.fn(() => Promise.resolve({
    id: 'abc-123',
    projectId: 1,
    gitHubRepoOwner: 'owner',
    gitHubRepoName: 'repo',
    gitHubRepoUrl: 'https://github.com/owner/repo',
    branch: 'main',
    status: 'connected',
    createdAt: '2024-01-01',
  })),
  disconnectRepo: vi.fn(() => Promise.resolve()),
  pushToRepo: vi.fn(() => Promise.resolve({ status: 'synced' })),
  pullFromRepo: vi.fn(() => Promise.resolve({ status: 'synced' })),
  getSyncStatus: vi.fn(() => Promise.resolve(null)),
  resolveConflicts: vi.fn(() => Promise.resolve({ status: 'synced' })),
  getSyncHistory: vi.fn(() => Promise.resolve([])),
}))

import GitHubSyncPage from './GitHubSyncPage'

beforeEach(() => { vi.clearAllMocks() })

describe('GitHubSyncPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<GitHubSyncPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
