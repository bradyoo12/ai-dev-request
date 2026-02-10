import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string, fallback?: string) => fallback || key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/specifications', () => ({
  generateSpec: vi.fn(() => Promise.resolve({
    id: 'abc-123',
    devRequestId: 1,
    phase: 'requirements',
    status: 'review',
    version: 1,
    createdAt: '2024-01-01',
  })),
  getSpec: vi.fn(() => Promise.resolve(null)),
  getSpecHistory: vi.fn(() => Promise.resolve([])),
  approveSpec: vi.fn(),
  rejectSpec: vi.fn(),
  updateSpec: vi.fn(),
}))

import SpecificationPage from './SpecificationPage'

beforeEach(() => { vi.clearAllMocks() })

describe('SpecificationPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<SpecificationPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
