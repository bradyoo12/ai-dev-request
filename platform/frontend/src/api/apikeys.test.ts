import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({
  default: { t: (key: string) => key },
}))

vi.mock('./auth', () => ({
  authFetch: vi.fn(),
}))

import { listApiKeys, generateApiKey, revokeApiKey } from './apikeys'
import { authFetch } from './auth'

const mockAuthFetch = vi.mocked(authFetch)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('apikeys api', () => {
  describe('listApiKeys', () => {
    it('calls correct URL and returns keys on success', async () => {
      const mockKeys = [
        { id: 'k1', name: 'My Key', keyPrefix: 'adr_abc', status: 'active', requestCount: 5, createdAt: '2024-01-01' },
      ]
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockKeys),
      } as Response)

      const result = await listApiKeys()
      expect(result).toEqual(mockKeys)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/apikeys')
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response)

      await expect(listApiKeys()).rejects.toThrow()
    })
  })

  describe('generateApiKey', () => {
    it('sends POST with name and returns generated key', async () => {
      const mockResponse = {
        id: 'k2',
        name: 'New Key',
        key: 'adr_full_key_value',
        keyPrefix: 'adr_ful',
        createdAt: '2024-01-01',
      }
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await generateApiKey('New Key')
      expect(result).toEqual(mockResponse)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/apikeys'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'New Key' }),
        })
      )
    })

    it('throws with server error message on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Duplicate name' }),
      } as Response)

      await expect(generateApiKey('Existing Key')).rejects.toThrow('Duplicate name')
    })

    it('throws with default error when server returns no message', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('parse error')),
      } as Response)

      await expect(generateApiKey('Key')).rejects.toThrow('api.error.apiKeyGenerateFailed')
    })
  })

  describe('revokeApiKey', () => {
    it('sends DELETE request for the key id', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: true,
      } as Response)

      await revokeApiKey('k1')
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/apikeys/k1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('throws with server error on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Key not found' }),
      } as Response)

      await expect(revokeApiKey('invalid')).rejects.toThrow('Key not found')
    })

    it('throws with default error when server returns no message', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('parse error')),
      } as Response)

      await expect(revokeApiKey('k1')).rejects.toThrow('api.error.apiKeyRevokeFailed')
    })
  })
})
