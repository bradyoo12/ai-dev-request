import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('./auth', () => ({
  authFetch: vi.fn(),
}))

beforeEach(() => { vi.clearAllMocks() })

import { generateAgent, previewAgent, getAgentTemplates, deployAgent, getDeployments, undeployAgent } from './agent-builder'
import { authFetch } from './auth'

const mockAuthFetch = authFetch as ReturnType<typeof vi.fn>

describe('agent-builder api', () => {
  describe('generateAgent', () => {
    it('generates agent from specification', async () => {
      const data = {
        id: 'skill-1',
        userId: 'user1',
        name: 'Test Agent',
        category: 'bot',
        isBuiltIn: false,
        isPublic: false,
        downloadCount: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
      mockAuthFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })

      const result = await generateAgent('Create a test bot')

      expect(result).toEqual(data)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/generate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ specification: 'Create a test bot' })
        })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Generation failed' })
      })

      await expect(generateAgent('Invalid spec')).rejects.toThrow('Generation failed')
    })

    it('throws with default message when no error provided', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({})
      })

      await expect(generateAgent('Invalid spec')).rejects.toThrow('Failed to generate agent')
    })
  })

  describe('previewAgent', () => {
    it('previews agent from specification', async () => {
      const data = {
        name: 'Preview Agent',
        description: 'Preview description',
        category: 'service',
        instructionContent: 'Instructions'
      }
      mockAuthFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(data) })

      const result = await previewAgent('Create a service agent')

      expect(result).toEqual(data)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/preview'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ specification: 'Create a service agent' })
        })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Preview failed' })
      })

      await expect(previewAgent('Invalid')).rejects.toThrow('Preview failed')
    })
  })

  describe('getAgentTemplates', () => {
    it('returns templates list', async () => {
      const templates = [
        { id: 'slack-bot', name: 'Slack Bot', description: 'A bot', category: 'bot', platform: 'slack', iconUrl: 'url', templateSpec: 'spec' },
        { id: 'telegram-bot', name: 'Telegram Bot', description: 'A bot', category: 'bot', platform: 'telegram', iconUrl: 'url', templateSpec: 'spec' }
      ]
      mockAuthFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(templates) })

      const result = await getAgentTemplates()

      expect(result).toEqual(templates)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/templates')
      )
    })
  })

  describe('deployAgent', () => {
    it('deploys agent to platform', async () => {
      const deployment = {
        id: 'dep-1',
        userId: 'user1',
        agentSkillId: 'skill-1',
        platform: 'slack',
        status: 'active',
        configJson: '{"token":"test"}',
        deployedAt: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
      mockAuthFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(deployment) })

      const result = await deployAgent('skill-1', 'slack', '{"token":"test"}')

      expect(result).toEqual(deployment)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/deploy'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            agentSkillId: 'skill-1',
            platform: 'slack',
            configJson: '{"token":"test"}'
          })
        })
      )
    })

    it('deploys without config', async () => {
      const deployment = {
        id: 'dep-1',
        userId: 'user1',
        agentSkillId: 'skill-1',
        platform: 'webhook',
        status: 'active',
        deployedAt: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
      mockAuthFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(deployment) })

      const result = await deployAgent('skill-1', 'webhook')

      expect(result).toEqual(deployment)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/deploy'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            agentSkillId: 'skill-1',
            platform: 'webhook',
            configJson: undefined
          })
        })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Deployment failed' })
      })

      await expect(deployAgent('skill-1', 'slack')).rejects.toThrow('Deployment failed')
    })
  })

  describe('getDeployments', () => {
    it('returns deployments list', async () => {
      const deployments = [
        {
          id: 'dep-1',
          userId: 'user1',
          agentSkillId: 'skill-1',
          platform: 'slack',
          status: 'active',
          deployedAt: '2024-01-01',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        }
      ]
      mockAuthFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(deployments) })

      const result = await getDeployments()

      expect(result).toEqual(deployments)
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/deployments')
      )
    })
  })

  describe('undeployAgent', () => {
    it('undeploys agent', async () => {
      mockAuthFetch.mockResolvedValueOnce({ ok: true })

      await expect(undeployAgent('dep-1')).resolves.toBeUndefined()
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/deployments/dep-1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('throws on failure', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Undeploy failed' })
      })

      await expect(undeployAgent('dep-1')).rejects.toThrow('Undeploy failed')
    })

    it('throws with default message when no error provided', async () => {
      mockAuthFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({})
      })

      await expect(undeployAgent('dep-1')).rejects.toThrow('Failed to undeploy agent')
    })
  })
})
