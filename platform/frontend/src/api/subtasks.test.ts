import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
})

import {
  fetchSubTasks,
  createSubTasks,
  updateSubTask,
  deleteSubTask,
  approveSubTask,
  approveAllSubTasks,
} from './subtasks'

describe('subtasks api', () => {
  const requestId = 'req-123'

  describe('fetchSubTasks', () => {
    it('returns subtasks on success', async () => {
      const data = [{ id: '1', title: 'Task 1', order: 0 }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await fetchSubTasks(requestId)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/requests/${requestId}/subtasks`),
        expect.objectContaining({ headers: expect.any(Object) })
      )
    })

    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      const result = await fetchSubTasks(requestId)
      expect(result).toEqual([])
    })
  })

  describe('createSubTasks', () => {
    it('creates subtasks successfully', async () => {
      const items = [{ title: 'Task 1', order: 0 }]
      const data = [{ id: '1', title: 'Task 1', order: 0, status: 'Pending' }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await createSubTasks(requestId, items)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/requests/${requestId}/subtasks`),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ subTasks: items }),
        })
      )
    })

    it('throws on failure with error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Circular dependency' }),
      })
      await expect(createSubTasks(requestId, [])).rejects.toThrow('Circular dependency')
    })

    it('throws default message when no error body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('parse error')),
      })
      await expect(createSubTasks(requestId, [])).rejects.toThrow('Failed to create subtasks')
    })
  })

  describe('updateSubTask', () => {
    it('updates subtask successfully', async () => {
      const updateData = { title: 'Updated', status: 'Approved', order: 1 }
      const data = { id: 'st-1', ...updateData }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await updateSubTask(requestId, 'st-1', updateData)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/requests/${requestId}/subtasks/st-1`),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      )
    })

    it('throws on failure with error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' }),
      })
      await expect(
        updateSubTask(requestId, 'st-1', { title: 'X', status: 'Pending', order: 0 })
      ).rejects.toThrow('Not found')
    })

    it('throws default message when no error body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('parse error')),
      })
      await expect(
        updateSubTask(requestId, 'st-1', { title: 'X', status: 'Pending', order: 0 })
      ).rejects.toThrow('Failed to update subtask')
    })
  })

  describe('deleteSubTask', () => {
    it('deletes subtask successfully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(deleteSubTask(requestId, 'st-1')).resolves.toBeUndefined()
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/requests/${requestId}/subtasks/st-1`),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(deleteSubTask(requestId, 'st-1')).rejects.toThrow('Failed to delete subtask')
    })
  })

  describe('approveSubTask', () => {
    it('approves subtask successfully', async () => {
      const data = { id: 'st-1', status: 'Approved' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await approveSubTask(requestId, 'st-1')
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/requests/${requestId}/subtasks/st-1/approve`),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure with error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Already approved' }),
      })
      await expect(approveSubTask(requestId, 'st-1')).rejects.toThrow('Already approved')
    })

    it('throws default message when no error body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('parse error')),
      })
      await expect(approveSubTask(requestId, 'st-1')).rejects.toThrow(
        'Failed to approve subtask'
      )
    })
  })

  describe('approveAllSubTasks', () => {
    it('approves all subtasks successfully', async () => {
      const data = [
        { id: 'st-1', status: 'Approved' },
        { id: 'st-2', status: 'Approved' },
      ]
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      const result = await approveAllSubTasks(requestId)
      expect(result).toEqual(data)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/requests/${requestId}/subtasks/approve-all`),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure with error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'No pending tasks' }),
      })
      await expect(approveAllSubTasks(requestId)).rejects.toThrow('No pending tasks')
    })

    it('throws default message when no error body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('parse error')),
      })
      await expect(approveAllSubTasks(requestId)).rejects.toThrow(
        'Failed to approve all subtasks'
      )
    })
  })
})
