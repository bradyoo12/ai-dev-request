import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { registerAgent, getAgents, grantConsent, revokeConsent, getConsents, createA2ATask, getA2ATasks, getA2ATaskArtifacts } from './a2a'

describe('a2a api', () => {
  describe('registerAgent', () => {
    it('registers agent', async () => {
      const data = { id: 1, agentKey: 'test', name: 'Test Agent', isActive: true, createdAt: '2024-01-01' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await registerAgent({ agentKey: 'test', name: 'Test Agent' })).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Failed' }) })
      await expect(registerAgent({ agentKey: 'test', name: 'Test' })).rejects.toThrow('Failed')
    })
  })

  describe('getAgents', () => {
    it('returns agents', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getAgents()).toEqual([])
    })
    it('returns empty on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getAgents()).toEqual([])
    })
  })

  describe('grantConsent', () => {
    it('grants consent', async () => {
      const data = { id: 1, fromAgentId: 1, toAgentId: 2 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await grantConsent({ fromAgentId: 1, toAgentId: 2, scopes: 'read' })).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(grantConsent({ fromAgentId: 1, toAgentId: 2, scopes: 'read' })).rejects.toThrow()
    })
  })

  describe('revokeConsent', () => {
    it('revokes consent', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(revokeConsent(1)).resolves.toBeUndefined()
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(revokeConsent(1)).rejects.toThrow()
    })
  })

  describe('getConsents', () => {
    it('returns consents', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getConsents()).toEqual([])
    })
    it('returns empty on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getConsents()).toEqual([])
    })
  })

  describe('createA2ATask', () => {
    it('creates task', async () => {
      const data = { id: 1, taskUid: 'uid', status: 'pending' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await createA2ATask({ fromAgentId: 1, toAgentId: 2, artifactType: 'json', dataJson: '{}' })).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      await expect(createA2ATask({ fromAgentId: 1, toAgentId: 2, artifactType: 'json', dataJson: '{}' })).rejects.toThrow()
    })
  })

  describe('getA2ATasks', () => {
    it('returns tasks', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getA2ATasks()).toEqual([])
    })
    it('returns empty on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getA2ATasks()).toEqual([])
    })
  })

  describe('getA2ATaskArtifacts', () => {
    it('returns artifacts', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getA2ATaskArtifacts(1)).toEqual([])
    })
    it('returns empty on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getA2ATaskArtifacts(1)).toEqual([])
    })
  })
})
