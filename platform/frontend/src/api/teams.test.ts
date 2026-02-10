import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  getAuthHeaders: () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer test' }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import { getTeams, createTeam, getTeam, updateTeam, deleteTeam, getMembers, addMember, updateMemberRole, removeMember, getActivities, getTeamProjects, shareProject, unshareProject } from './teams'

describe('teams api', () => {
  describe('getTeams', () => {
    it('returns teams', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getTeams()).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getTeams()).rejects.toThrow()
    })
  })

  describe('createTeam', () => {
    it('creates team', async () => {
      const data = { id: 1, name: 'Team A' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await createTeam('Team A')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(createTeam('Team A')).rejects.toThrow()
    })
  })

  describe('getTeam', () => {
    it('returns team', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 1 }) })
      expect(await getTeam(1)).toEqual({ id: 1 })
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getTeam(1)).rejects.toThrow()
    })
  })

  describe('updateTeam', () => {
    it('updates team', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 1, name: 'Updated' }) })
      expect(await updateTeam(1, 'Updated')).toEqual({ id: 1, name: 'Updated' })
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(updateTeam(1, 'Updated')).rejects.toThrow()
    })
  })

  describe('deleteTeam', () => {
    it('deletes team', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(deleteTeam(1)).resolves.toBeUndefined()
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(deleteTeam(1)).rejects.toThrow()
    })
  })

  describe('getMembers', () => {
    it('returns members', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getMembers(1)).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getMembers(1)).rejects.toThrow()
    })
  })

  describe('addMember', () => {
    it('adds member', async () => {
      const data = { id: 1, teamId: 1, userId: 'u1', role: 'editor' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await addMember(1, 'test@test.com')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(addMember(1, 'test@test.com')).rejects.toThrow()
    })
  })

  describe('updateMemberRole', () => {
    it('updates role', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 1, role: 'admin' }) })
      expect(await updateMemberRole(1, 1, 'admin')).toEqual({ id: 1, role: 'admin' })
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(updateMemberRole(1, 1, 'admin')).rejects.toThrow()
    })
  })

  describe('removeMember', () => {
    it('removes member', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(removeMember(1, 1)).resolves.toBeUndefined()
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(removeMember(1, 1)).rejects.toThrow()
    })
  })

  describe('getActivities', () => {
    it('returns activities', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getActivities(1)).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getActivities(1)).rejects.toThrow()
    })
  })

  describe('getTeamProjects', () => {
    it('returns projects', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      expect(await getTeamProjects(1)).toEqual([])
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(getTeamProjects(1)).rejects.toThrow()
    })
  })

  describe('shareProject', () => {
    it('shares project', async () => {
      const data = { id: 1, teamId: 1, devRequestId: 'req1' }
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })
      expect(await shareProject(1, 'req1')).toEqual(data)
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(shareProject(1, 'req1')).rejects.toThrow()
    })
  })

  describe('unshareProject', () => {
    it('unshares project', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(unshareProject(1, 1)).resolves.toBeUndefined()
    })
    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(unshareProject(1, 1)).rejects.toThrow()
    })
  })
})
