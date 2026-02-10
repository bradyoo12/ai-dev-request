import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/preferences', () => ({
  getPreferences: vi.fn(() => Promise.resolve({ preferences: [] })),
  setPreference: vi.fn(),
  deletePreference: vi.fn(),
  deleteAllPreferences: vi.fn(),
  getPreferenceSummary: vi.fn(() => Promise.resolve(null)),
  regenerateSummary: vi.fn(),
}))

import PreferencePage from './PreferencePage'

beforeEach(() => { vi.clearAllMocks() })

describe('PreferencePage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<PreferencePage />)
    })
    expect(document.body).toBeTruthy()
  })
})
