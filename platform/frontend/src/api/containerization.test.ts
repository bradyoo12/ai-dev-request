import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import {
  generateDockerfile,
  getContainerConfig,
  triggerBuild,
  getBuildStatus,
  getBuildLogs,
  deployContainer,
  generateK8sManifest,
} from './containerization'

describe('containerization api', () => {
  describe('generateDockerfile', () => {
    it('generates a Dockerfile for a project', async () => {
      const data = { id: 'cfg-1', projectId: 1, detectedStack: 'nodejs', dockerfile: 'FROM node:20', buildStatus: 'pending' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await generateDockerfile(1)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/containers/generate'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Generation failed' }) })
      await expect(generateDockerfile(1)).rejects.toThrow('Generation failed')
    })
  })

  describe('getContainerConfig', () => {
    it('fetches container config', async () => {
      const data = { id: 'cfg-1', projectId: 1, detectedStack: 'nodejs' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getContainerConfig(1)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/containers/config'),
        expect.any(Object)
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Not found' }) })
      await expect(getContainerConfig(99)).rejects.toThrow('Not found')
    })
  })

  describe('triggerBuild', () => {
    it('triggers a build', async () => {
      const data = { id: 'cfg-1', projectId: 1, buildStatus: 'built' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await triggerBuild(1)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/containers/build'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Build failed' }) })
      await expect(triggerBuild(1)).rejects.toThrow('Build failed')
    })
  })

  describe('getBuildStatus', () => {
    it('fetches build status', async () => {
      const data = { projectId: 1, status: 'built', imageName: 'project-1', imageTag: 'latest' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getBuildStatus(1)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/containers/status'),
        expect.any(Object)
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Not found' }) })
      await expect(getBuildStatus(99)).rejects.toThrow('Not found')
    })
  })

  describe('getBuildLogs', () => {
    it('fetches build logs', async () => {
      const data = { projectId: 1, status: 'built', logs: '[]' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getBuildLogs(1)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/containers/logs'),
        expect.any(Object)
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Not found' }) })
      await expect(getBuildLogs(99)).rejects.toThrow('Not found')
    })
  })

  describe('deployContainer', () => {
    it('deploys a container', async () => {
      const data = { id: 'cfg-1', projectId: 1, buildStatus: 'deployed' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await deployContainer(1)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/containers/deploy'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Deploy failed' }) })
      await expect(deployContainer(1)).rejects.toThrow('Deploy failed')
    })
  })

  describe('generateK8sManifest', () => {
    it('generates K8s manifest', async () => {
      const data = { id: 'cfg-1', projectId: 1, k8sManifest: 'apiVersion: apps/v1' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await generateK8sManifest(1)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/1/containers/k8s'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'K8s generation failed' }) })
      await expect(generateK8sManifest(1)).rejects.toThrow('K8s generation failed')
    })
  })
})
