import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  return {
    useTranslation: () => ({ t }),
    initReactI18next: { type: '3rdParty', init: () => {} },
  }
})

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    authUser: { id: '1', email: 'test@test.com', displayName: 'Test', isAdmin: false },
  }),
}))

vi.mock('../api/teams', () => ({
  getTeams: vi.fn(() => Promise.resolve([])),
  createTeam: vi.fn(),
  deleteTeam: vi.fn(),
  getMembers: vi.fn(),
  addMember: vi.fn(),
  removeMember: vi.fn(),
  updateMemberRole: vi.fn(),
  getActivities: vi.fn(),
}))

import TeamPage from './TeamPage'

beforeEach(() => { vi.clearAllMocks() })

describe('TeamPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<TeamPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
