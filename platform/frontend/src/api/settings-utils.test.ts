import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({
  default: { t: (key: string) => key },
}))

const mockStorage: Record<string, string> = {}
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value }),
    removeItem: vi.fn((key: string) => { delete mockStorage[key] }),
    clear: vi.fn(() => Object.keys(mockStorage).forEach(k => delete mockStorage[k])),
  },
  writable: true,
})

import { getUserId, TOKEN_TO_USD_RATE, getUsageExportUrl } from './settings'

beforeEach(() => {
  vi.clearAllMocks()
  Object.keys(mockStorage).forEach(k => delete mockStorage[k])
})

describe('settings utility functions', () => {
  describe('getUserId', () => {
    it('returns existing user ID from localStorage', () => {
      mockStorage['ai-dev-user-id'] = 'existing-id'
      const id = getUserId()
      expect(id).toBe('existing-id')
    })

    it('generates new UUID when no user ID exists', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'generated-uuid' })

      const id = getUserId()
      expect(id).toBe('generated-uuid')
      expect(window.localStorage.setItem).toHaveBeenCalledWith('ai-dev-user-id', 'generated-uuid')
    })

    it('persists generated ID in localStorage', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'new-uuid' })

      getUserId()
      expect(mockStorage['ai-dev-user-id']).toBe('new-uuid')
    })
  })

  describe('TOKEN_TO_USD_RATE', () => {
    it('equals 0.01', () => {
      expect(TOKEN_TO_USD_RATE).toBe(0.01)
    })
  })

  describe('getUsageExportUrl', () => {
    it('returns base URL without params when no dates provided', () => {
      const url = getUsageExportUrl()
      expect(url).toContain('/api/settings/usage/export')
      expect(url).not.toContain('?')
    })

    it('appends from parameter when provided', () => {
      const url = getUsageExportUrl('2024-01-01')
      expect(url).toContain('from=2024-01-01')
    })

    it('appends to parameter when provided', () => {
      const url = getUsageExportUrl(undefined, '2024-12-31')
      expect(url).toContain('to=2024-12-31')
    })

    it('appends both from and to parameters', () => {
      const url = getUsageExportUrl('2024-01-01', '2024-12-31')
      expect(url).toContain('from=2024-01-01')
      expect(url).toContain('to=2024-12-31')
    })
  })
})
