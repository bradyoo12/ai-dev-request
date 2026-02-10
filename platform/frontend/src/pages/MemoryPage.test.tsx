import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/memories', () => ({
  getMemories: vi.fn(() => Promise.resolve({ memories: [], totalCount: 0 })),
  addMemory: vi.fn(),
  deleteMemory: vi.fn(),
  deleteAllMemories: vi.fn(),
}))

import MemoryPage from './MemoryPage'

beforeEach(() => { vi.clearAllMocks() })

describe('MemoryPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<MemoryPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
