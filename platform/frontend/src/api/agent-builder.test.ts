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

import {
  analyzeDescription,
  createBlueprint,
  getBlueprints,
  getBlueprintById,
  updateBlueprint,
  deleteBlueprint,
  generateAgent,
  getGenerationStatus,
  convertToSkill,
  getAgentTemplates,
  exportToMarketplace,
  type AgentAnalysisResult,
  type AgentBlueprint,
  type AgentTemplate,
} from './agent-builder'

beforeEach(() => {
  vi.clearAllMocks()
  Object.keys(mockStorage).forEach(k => delete mockStorage[k])
  mockStorage['ai-dev-jwt'] = 'test-token'
})

describe('agent-builder api', () => {
  describe('analyzeDescription', () => {
    it('sends POST request with description and agent type', async () => {
      const mockResult: AgentAnalysisResult = {
        success: true,
        capabilities: ['Chat', 'Send messages'],
        integrations: ['Slack API'],
        configuration: { token: 'xxx' },
        requirements: ['Slack workspace'],
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      })

      const result = await analyzeDescription('A Slack bot for support', 'Slack')

      expect(result).toEqual(mockResult)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/analyze'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
          body: JSON.stringify({ description: 'A Slack bot for support', agentType: 'Slack' }),
        })
      )
    })

    it('returns error result on failure', async () => {
      const errorResult: AgentAnalysisResult = {
        success: false,
        errorMessage: 'Analysis failed',
        capabilities: [],
        integrations: [],
        configuration: {},
        requirements: [],
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(errorResult),
      })

      const result = await analyzeDescription('Invalid', 'Unknown')

      expect(result.success).toBe(false)
      expect(result.errorMessage).toBe('Analysis failed')
    })
  })

  describe('createBlueprint', () => {
    it('creates a new blueprint', async () => {
      const mockBlueprint: AgentBlueprint = {
        id: 'bp-1',
        userId: 'user1',
        name: 'My Bot',
        description: 'A helpful bot',
        agentType: 'Slack',
        status: 'Draft',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBlueprint),
      })

      const result = await createBlueprint({
        name: 'My Bot',
        description: 'A helpful bot',
        agentType: 'Slack',
      })

      expect(result).toEqual(mockBlueprint)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/blueprints'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  describe('getBlueprints', () => {
    it('fetches all user blueprints', async () => {
      const mockBlueprints: AgentBlueprint[] = [
        {
          id: 'bp-1',
          userId: 'user1',
          name: 'Bot 1',
          description: 'Test',
          agentType: 'Slack',
          status: 'Draft',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBlueprints),
      })

      const result = await getBlueprints()

      expect(result).toEqual(mockBlueprints)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/blueprints'),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      )
    })
  })

  describe('getBlueprintById', () => {
    it('fetches a specific blueprint', async () => {
      const mockBlueprint: AgentBlueprint = {
        id: 'bp-1',
        userId: 'user1',
        name: 'My Bot',
        description: 'Test',
        agentType: 'Slack',
        status: 'Ready',
        generatedCode: '// code',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBlueprint),
      })

      const result = await getBlueprintById('bp-1')

      expect(result).toEqual(mockBlueprint)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/blueprints/bp-1'),
        expect.anything()
      )
    })
  })

  describe('updateBlueprint', () => {
    it('updates a blueprint', async () => {
      const mockBlueprint: AgentBlueprint = {
        id: 'bp-1',
        userId: 'user1',
        name: 'Updated Bot',
        description: 'Updated description',
        agentType: 'Slack',
        status: 'Draft',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBlueprint),
      })

      const result = await updateBlueprint('bp-1', {
        name: 'Updated Bot',
        description: 'Updated description',
      })

      expect(result).toEqual(mockBlueprint)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/blueprints/bp-1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated Bot', description: 'Updated description' }),
        })
      )
    })
  })

  describe('deleteBlueprint', () => {
    it('deletes a blueprint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      })

      await deleteBlueprint('bp-1')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/blueprints/bp-1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('generateAgent', () => {
    it('triggers agent generation', async () => {
      const mockBlueprint: AgentBlueprint = {
        id: 'bp-1',
        userId: 'user1',
        name: 'My Bot',
        description: 'Test',
        agentType: 'Slack',
        status: 'Generating',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T01:00:00Z',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBlueprint),
      })

      const result = await generateAgent('bp-1')

      expect(result).toEqual(mockBlueprint)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/blueprints/bp-1/generate'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  describe('getGenerationStatus', () => {
    it('fetches generation status', async () => {
      const mockStatus = {
        status: 'Generating',
        updatedAt: '2024-01-01T01:00:00Z',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      })

      const result = await getGenerationStatus('bp-1')

      expect(result).toEqual(mockStatus)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/blueprints/bp-1/status'),
        expect.anything()
      )
    })

    it('includes error message when present', async () => {
      const mockStatus = {
        status: 'Failed',
        errorMessage: 'Generation failed',
        updatedAt: '2024-01-01T01:00:00Z',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      })

      const result = await getGenerationStatus('bp-1')

      expect(result.status).toBe('Failed')
      expect(result.errorMessage).toBe('Generation failed')
    })
  })

  describe('convertToSkill', () => {
    it('converts blueprint to skill', async () => {
      const mockSkill = {
        id: 'skill-1',
        userId: 'user1',
        name: 'My Skill',
        description: 'Test',
        category: 'Slack',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00Z',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSkill),
      })

      const result = await convertToSkill('bp-1')

      expect(result).toEqual(mockSkill)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/blueprints/bp-1/convert-to-skill'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  describe('getAgentTemplates', () => {
    it('fetches all agent templates', async () => {
      const mockTemplates: AgentTemplate[] = [
        {
          id: 'slack-helpdesk',
          name: 'Slack Helpdesk Bot',
          description: 'Customer support bot for Slack',
          agentType: 'Slack',
          icon: 'MessageSquare',
          useCount: 0,
          sampleCapabilities: ['Answer FAQs', 'Create tickets'],
        },
        {
          id: 'telegram-news',
          name: 'Telegram News Bot',
          description: 'News aggregation bot',
          agentType: 'Telegram',
          icon: 'Newspaper',
          useCount: 0,
          sampleCapabilities: ['Fetch news', 'Filter by topic'],
        },
      ]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplates),
      })

      const result = await getAgentTemplates()

      expect(result).toEqual(mockTemplates)
      expect(result).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/templates'),
        expect.anything()
      )
    })
  })

  describe('exportToMarketplace', () => {
    it('exports blueprint to marketplace', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Exported', skillId: 'skill-1' }),
      })

      await exportToMarketplace('bp-1')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-builder/blueprints/bp-1/export'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })
})
