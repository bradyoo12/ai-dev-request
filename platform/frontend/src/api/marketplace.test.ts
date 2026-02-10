import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import {
  browseTemplates,
  getTemplate,
  submitTemplate,
  updateTemplate,
  importTemplate,
  rateTemplate,
  getCategories,
  getPopularTemplates,
} from './marketplace'

describe('marketplace api', () => {
  describe('browseTemplates', () => {
    it('fetches templates with filters', async () => {
      const data = { templates: [{ id: '1', name: 'Test' }], totalCount: 1 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await browseTemplates('web-app', 'React', 'starter', 'popular')
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/marketplace/templates?'),
        expect.any(Object)
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Server error' }) })
      await expect(browseTemplates()).rejects.toThrow('Server error')
    })
  })

  describe('getTemplate', () => {
    it('fetches template by id', async () => {
      const data = { id: 'abc', name: 'Test Template' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getTemplate('abc')
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/marketplace/templates/abc'),
        expect.any(Object)
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Not found' }) })
      await expect(getTemplate('xyz')).rejects.toThrow('Not found')
    })
  })

  describe('submitTemplate', () => {
    it('submits a new template', async () => {
      const data = { id: 'new-id', name: 'My Template' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await submitTemplate({
        authorId: 1,
        name: 'My Template',
        description: 'A great template',
        category: 'web-app',
        techStack: 'React,TypeScript',
      })
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/marketplace/templates'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Bad request' }) })
      await expect(submitTemplate({
        authorId: 1,
        name: '',
        description: '',
        category: '',
        techStack: '',
      })).rejects.toThrow('Bad request')
    })
  })

  describe('updateTemplate', () => {
    it('updates an existing template', async () => {
      const data = { id: 'abc', name: 'Updated' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await updateTemplate('abc', { name: 'Updated' })
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/marketplace/templates/abc'),
        expect.objectContaining({ method: 'PUT' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Update failed' }) })
      await expect(updateTemplate('abc', { name: 'Updated' })).rejects.toThrow('Update failed')
    })
  })

  describe('importTemplate', () => {
    it('imports a template', async () => {
      const data = { success: true, templateId: 'abc', templateName: 'Test', templateData: '{}' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await importTemplate('abc', 1)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/marketplace/templates/abc/import'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Not found' }) })
      await expect(importTemplate('xyz', 1)).rejects.toThrow('Not found')
    })
  })

  describe('rateTemplate', () => {
    it('rates a template', async () => {
      const data = { success: true, newRating: 4.5, newRatingCount: 10 }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await rateTemplate('abc', 1, 5)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/marketplace/templates/abc/rate'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Invalid rating' }) })
      await expect(rateTemplate('abc', 1, 6)).rejects.toThrow('Invalid rating')
    })
  })

  describe('getCategories', () => {
    it('returns categories with counts', async () => {
      const data = [{ category: 'web-app', count: 5 }, { category: 'api', count: 3 }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getCategories()
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/marketplace/categories'),
        expect.any(Object)
      )
    })
    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getCategories()).toEqual([])
    })
  })

  describe('getPopularTemplates', () => {
    it('returns popular templates', async () => {
      const data = [{ id: '1', name: 'Popular', downloadCount: 100 }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await getPopularTemplates(5)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/marketplace/templates/popular?limit=5'),
        expect.any(Object)
      )
    })
    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      expect(await getPopularTemplates()).toEqual([])
    })
  })
})
