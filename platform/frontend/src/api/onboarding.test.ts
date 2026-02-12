import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({
  default: { t: (key: string) => key },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

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

import { getProgress, completeStep, skipOnboarding, resetOnboarding } from './onboarding'
import type { OnboardingProgress } from './onboarding'

beforeEach(() => {
  vi.clearAllMocks()
  Object.keys(mockStorage).forEach(k => delete mockStorage[k])
})

describe('onboarding api', () => {
  const mockProgress: OnboardingProgress = {
    id: 1,
    userId: 'u1',
    currentStep: 2,
    completedSteps: ['welcome', 'profile'],
    status: 'in_progress',
    startedAt: '2024-01-01',
    completedAt: null,
    updatedAt: '2024-01-02',
  }

  describe('getProgress', () => {
    it('calls correct URL with auth headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProgress),
      })

      const result = await getProgress()
      expect(result).toEqual(mockProgress)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/onboarding/progress'),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        })
      )
    })

    it('throws with server error message on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' }),
      })

      await expect(getProgress()).rejects.toThrow('Not found')
    })

    it('throws default error when response body is not JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('parse error')),
      })

      await expect(getProgress()).rejects.toThrow('onboarding.error.loadFailed')
    })
  })

  describe('completeStep', () => {
    it('sends POST to step endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockProgress, completedSteps: ['welcome', 'profile', 'preferences'] }),
      })

      const result = await completeStep('preferences')
      expect(result.completedSteps).toContain('preferences')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/onboarding/step/preferences'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Step invalid' }),
      })

      await expect(completeStep('invalid')).rejects.toThrow('Step invalid')
    })
  })

  describe('skipOnboarding', () => {
    it('sends POST to skip endpoint', async () => {
      const skippedProgress = { ...mockProgress, status: 'skipped' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(skippedProgress),
      })

      const result = await skipOnboarding()
      expect(result.status).toBe('skipped')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/onboarding/skip'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      })

      await expect(skipOnboarding()).rejects.toThrow()
    })
  })

  describe('resetOnboarding', () => {
    it('sends POST to reset endpoint', async () => {
      const resetProgress = { ...mockProgress, currentStep: 0, completedSteps: [], status: 'in_progress' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(resetProgress),
      })

      const result = await resetOnboarding()
      expect(result.currentStep).toBe(0)
      expect(result.completedSteps).toEqual([])
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/onboarding/reset'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Reset failed' }),
      })

      await expect(resetOnboarding()).rejects.toThrow('Reset failed')
    })
  })
})
