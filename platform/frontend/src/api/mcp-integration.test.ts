import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import {
  getPlatformTools,
  callPlatformTool,
  registerServer,
  unregisterServer,
  listServers,
  getServerStatus,
  discoverTools,
  callExternalTool,
  listProjectServers,
} from './mcp-integration'

describe('mcp-integration api', () => {
  describe('getPlatformTools', () => {
    it('returns platform tools list', async () => {
      const data = [
        { name: 'create_request', description: 'Create request', inputSchema: '{}' },
        { name: 'analyze_request', description: 'Analyze request', inputSchema: '{}' },
      ]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getPlatformTools()).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/mcp/tools'),
        expect.objectContaining({ headers: expect.any(Object) })
      )
    })
    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getPlatformTools()).toEqual([])
    })
  })

  describe('callPlatformTool', () => {
    it('calls a platform tool', async () => {
      const data = { success: true, result: '{"message":"ok"}', error: null }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await callPlatformTool({ toolName: 'create_request', arguments: '{}' })).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/mcp/tools/call'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Unknown tool' }) })
      await expect(callPlatformTool({ toolName: 'bad_tool', arguments: '{}' })).rejects.toThrow('Unknown tool')
    })
  })

  describe('registerServer', () => {
    it('registers an external server', async () => {
      const data = { id: 'srv-1', name: 'Test', serverUrl: 'https://test.com', status: 'disconnected' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await registerServer({ name: 'Test', serverUrl: 'https://test.com' })).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/mcp/servers'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Bad URL' }) })
      await expect(registerServer({ name: 'Test', serverUrl: '' })).rejects.toThrow('Bad URL')
    })
  })

  describe('unregisterServer', () => {
    it('unregisters a server', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await unregisterServer('srv-1')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/mcp/servers/srv-1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Not found' }) })
      await expect(unregisterServer('bad-id')).rejects.toThrow('Not found')
    })
  })

  describe('listServers', () => {
    it('returns server list', async () => {
      const data = [{ id: 'srv-1', name: 'Test', status: 'connected' }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await listServers()).toEqual(data)
    })
    it('passes projectId as query param', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      await listServers(42)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('?projectId=42'),
        expect.any(Object)
      )
    })
    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await listServers()).toEqual([])
    })
  })

  describe('getServerStatus', () => {
    it('returns server status', async () => {
      const data = { connectionId: 'srv-1', name: 'Test', status: 'connected', toolCount: 3 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await getServerStatus('srv-1')).toEqual(data)
    })
    it('returns null on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getServerStatus('bad-id')).toBeNull()
    })
  })

  describe('discoverTools', () => {
    it('discovers tools from a server', async () => {
      const data = { id: 'srv-1', name: 'Test', status: 'connected', availableTools: '[{"name":"tool1"}]' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await discoverTools('srv-1')).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/mcp/servers/srv-1/discover'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Server unreachable' }) })
      await expect(discoverTools('bad-id')).rejects.toThrow('Server unreachable')
    })
  })

  describe('callExternalTool', () => {
    it('calls a tool on an external server', async () => {
      const data = { success: true, result: '{"output":"done"}', error: null }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await callExternalTool('srv-1', { toolName: 'tool1', arguments: '{}' })).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/mcp/servers/srv-1/tools/call'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Tool not found' }) })
      await expect(callExternalTool('srv-1', { toolName: 'bad', arguments: '{}' })).rejects.toThrow('Tool not found')
    })
  })

  describe('listProjectServers', () => {
    it('returns servers for a project', async () => {
      const data = [{ id: 'srv-1', projectId: 5, name: 'Project Server' }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await listProjectServers(5)).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/5/mcp/servers'),
        expect.any(Object)
      )
    })
    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await listProjectServers(99)).toEqual([])
    })
  })
})
