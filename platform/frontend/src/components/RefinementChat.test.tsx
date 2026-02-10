import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../api/refinement', () => ({
  getChatHistory: vi.fn(() => Promise.resolve([])),
  sendChatMessage: vi.fn(),
  sendChatMessageStream: vi.fn(),
  applyChanges: vi.fn(),
}))

vi.mock('../api/suggestions', () => ({
  createSuggestion: vi.fn(),
}))

import RefinementChat from './RefinementChat'

beforeEach(() => { vi.clearAllMocks() })

describe('RefinementChat', () => {
  it('renders chat header', async () => {
    await act(async () => {
      render(<RefinementChat requestId="req-1" />)
    })
    expect(screen.getByText('refinement.title')).toBeInTheDocument()
  })

  it('renders empty state', async () => {
    await act(async () => {
      render(<RefinementChat requestId="req-1" />)
    })
    expect(screen.getByText('refinement.emptyTitle')).toBeInTheDocument()
    expect(screen.getByText('refinement.emptyDescription')).toBeInTheDocument()
  })

  it('renders suggestion buttons', async () => {
    await act(async () => {
      render(<RefinementChat requestId="req-1" />)
    })
    expect(screen.getByText('refinement.suggestion1')).toBeInTheDocument()
    expect(screen.getByText('refinement.suggestion2')).toBeInTheDocument()
    expect(screen.getByText('refinement.suggestion3')).toBeInTheDocument()
  })

  it('renders send button', async () => {
    await act(async () => {
      render(<RefinementChat requestId="req-1" />)
    })
    expect(screen.getByText('refinement.send')).toBeInTheDocument()
  })

  it('renders textarea placeholder', async () => {
    await act(async () => {
      render(<RefinementChat requestId="req-1" />)
    })
    expect(screen.getByPlaceholderText('refinement.placeholder')).toBeInTheDocument()
  })
})
