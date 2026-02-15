import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  return { useTranslation: () => ({ t }) }
})

const mockTemplates = [
  {
    id: 'slack-helpdesk',
    name: 'Slack Helpdesk Bot',
    description: 'Customer support bot for Slack workspaces with ticket creation and FAQ',
    agentType: 'Slack',
    icon: 'MessageSquare',
    useCount: 0,
    sampleCapabilities: ['Answer FAQs', 'Create tickets', 'Escalate issues'],
  },
  {
    id: 'telegram-news',
    name: 'Telegram News Bot',
    description: 'Automated news aggregation and distribution bot for Telegram',
    agentType: 'Telegram',
    icon: 'Newspaper',
    useCount: 0,
    sampleCapabilities: ['Fetch news', 'Filter by topic', 'Schedule updates'],
  },
]

const mockBlueprints = [
  {
    id: 'bp-1',
    userId: 'user1',
    name: 'My Slack Bot',
    description: 'A customer support bot',
    agentType: 'Slack',
    status: 'Draft',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'bp-2',
    userId: 'user1',
    name: 'Monitoring Agent',
    description: 'System monitoring',
    agentType: 'Monitoring',
    status: 'Ready',
    generatedCode: '// monitoring code',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
]

const mockGetAgentTemplates = vi.fn(() => Promise.resolve(mockTemplates))
const mockGetBlueprints = vi.fn(() => Promise.resolve(mockBlueprints))
const mockCreateBlueprint = vi.fn((data) => Promise.resolve({
  id: 'bp-new',
  userId: 'user1',
  ...data,
  status: 'Draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}))
const mockGenerateAgent = vi.fn((id) => Promise.resolve({
  ...mockBlueprints.find(b => b.id === id),
  status: 'Generating',
  updatedAt: new Date().toISOString(),
}))
const mockDeleteBlueprint = vi.fn(() => Promise.resolve())
const mockConvertToSkill = vi.fn(() => Promise.resolve({
  id: 'skill-1',
  name: 'My Skill',
  version: '1.0.0',
}))
const mockExportToMarketplace = vi.fn(() => Promise.resolve())

vi.mock('../api/agent-builder', () => ({
  getAgentTemplates: () => mockGetAgentTemplates(),
  getBlueprints: () => mockGetBlueprints(),
  createBlueprint: (data: any) => mockCreateBlueprint(data),
  generateAgent: (id: string) => mockGenerateAgent(id),
  deleteBlueprint: (id: string) => mockDeleteBlueprint(id),
  convertToSkill: (id: string) => mockConvertToSkill(id),
  exportToMarketplace: (id: string) => mockExportToMarketplace(id),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AgentBuilderPage API Integration', () => {
  it('calls getAgentTemplates on mount', async () => {
    const { getAgentTemplates } = await import('../api/agent-builder')
    await getAgentTemplates()

    expect(mockGetAgentTemplates).toHaveBeenCalledTimes(1)
  })

  it('calls getBlueprints on mount', async () => {
    const { getBlueprints } = await import('../api/agent-builder')
    await getBlueprints()

    expect(mockGetBlueprints).toHaveBeenCalledTimes(1)
  })

  it('creates a new blueprint with correct data', async () => {
    const { createBlueprint } = await import('../api/agent-builder')

    const result = await createBlueprint({
      name: 'Test Bot',
      description: 'A test bot',
      agentType: 'Slack',
    })

    expect(mockCreateBlueprint).toHaveBeenCalledWith({
      name: 'Test Bot',
      description: 'A test bot',
      agentType: 'Slack',
    })
    expect(result.name).toBe('Test Bot')
    expect(result.status).toBe('Draft')
  })

  it('generates an agent from blueprint', async () => {
    const { generateAgent } = await import('../api/agent-builder')

    const result = await generateAgent('bp-1')

    expect(mockGenerateAgent).toHaveBeenCalledWith('bp-1')
    expect(result.status).toBe('Generating')
  })

  it('deletes a blueprint', async () => {
    const { deleteBlueprint } = await import('../api/agent-builder')

    await deleteBlueprint('bp-1')

    expect(mockDeleteBlueprint).toHaveBeenCalledWith('bp-1')
  })

  it('converts blueprint to skill', async () => {
    const { convertToSkill } = await import('../api/agent-builder')

    const result = await convertToSkill('bp-2')

    expect(mockConvertToSkill).toHaveBeenCalledWith('bp-2')
    expect(result.id).toBe('skill-1')
  })

  it('exports blueprint to marketplace', async () => {
    const { exportToMarketplace } = await import('../api/agent-builder')

    await exportToMarketplace('bp-2')

    expect(mockExportToMarketplace).toHaveBeenCalledWith('bp-2')
  })

  it('returns all templates', async () => {
    const { getAgentTemplates } = await import('../api/agent-builder')

    const result = await getAgentTemplates()

    expect(result).toHaveLength(2)
    expect(result[0].agentType).toBe('Slack')
    expect(result[1].agentType).toBe('Telegram')
  })

  it('returns all blueprints', async () => {
    const { getBlueprints } = await import('../api/agent-builder')

    const result = await getBlueprints()

    expect(result).toHaveLength(2)
    expect(result[0].status).toBe('Draft')
    expect(result[1].status).toBe('Ready')
  })

  it('handles blueprint creation with optional fields', async () => {
    const { createBlueprint } = await import('../api/agent-builder')

    const result = await createBlueprint({
      name: 'Advanced Bot',
      description: 'An advanced bot',
      agentType: 'CustomerService',
      capabilitiesJson: '["Chat", "Tickets"]',
      integrationsJson: '["Zendesk"]',
    })

    expect(mockCreateBlueprint).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Advanced Bot',
        capabilitiesJson: '["Chat", "Tickets"]',
        integrationsJson: '["Zendesk"]',
      })
    )
  })
})
