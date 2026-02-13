import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/aiModel', () => ({
  getAiModelConfig: vi.fn(() => Promise.resolve({
    id: '1',
    selectedModel: 'sonnet-4-5',
    extendedThinkingEnabled: false,
    thinkingBudgetTokens: 10000,
    streamThinkingEnabled: false,
    autoModelSelection: false,
    totalRequestsOpus: 0,
    totalRequestsSonnet: 10,
    totalThinkingTokens: 0,
    totalOutputTokens: 5000,
    estimatedCost: 0.09,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  })),
  updateAiModelConfig: vi.fn((data) => Promise.resolve({ ...data })),
  getAvailableModels: vi.fn(() => Promise.resolve([
    {
      id: 'sonnet-4-5',
      name: 'Claude Sonnet 4.5',
      modelId: 'claude-sonnet-4-5-20250929',
      description: 'Fast and efficient',
      inputCostPer1k: 0.003,
      outputCostPer1k: 0.015,
      supportsExtendedThinking: false,
      maxOutputTokens: 8192,
      avgLatencyMs: 1500,
      tier: 'balanced',
      badge: 'Balanced',
      capabilities: ['Code Generation', 'Analysis'],
    },
  ])),
  getAiModelStats: vi.fn(() => Promise.resolve({
    totalRequests: 10,
    totalRequestsOpus: 0,
    totalRequestsSonnet: 10,
    totalThinkingTokens: 0,
    totalOutputTokens: 5000,
    estimatedCost: 0.09,
  })),
  getAvailableProviders: vi.fn(() => Promise.resolve([
    {
      id: 'claude',
      name: 'Claude',
      description: 'Anthropic Claude models',
      available: true,
    },
  ])),
  getEffortLevels: vi.fn(() => Promise.resolve({
    taskConfigs: [
      { taskType: 'analysis', effortLevel: 'Medium', description: 'Code analysis tasks' },
      { taskType: 'proposal', effortLevel: 'High', description: 'Generate project proposals' },
      { taskType: 'scaffold', effortLevel: 'Low', description: 'Basic code scaffolding' },
      { taskType: 'complexGeneration', effortLevel: 'High', description: 'Complex code generation' },
      { taskType: 'codeReview', effortLevel: 'Medium', description: 'Review code quality' },
      { taskType: 'testGeneration', effortLevel: 'Low', description: 'Generate test cases' },
      { taskType: 'securityScan', effortLevel: 'High', description: 'Security vulnerability scanning' },
      { taskType: 'multiAgent', effortLevel: 'High', description: 'Multi-agent orchestration' },
    ],
    structuredOutputsEnabled: false,
    updatedAt: '2026-01-01T00:00:00Z',
  })),
  updateEffortLevels: vi.fn((data) => Promise.resolve({ ...data, updatedAt: new Date().toISOString() })),
}))

import AiModelPage from './AiModelPage'

beforeEach(() => { vi.clearAllMocks() })

describe('AiModelPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<AiModelPage />)
    })
    expect(document.body).toBeTruthy()
  })

  it('renders effort level table in Configure tab', async () => {
    const { getByText } = await act(async () => {
      return render(<AiModelPage />)
    })

    await waitFor(() => {
      const configureButton = getByText('aiModel.tabs.configure')
      fireEvent.click(configureButton)
    })

    await waitFor(() => {
      expect(getByText('aiModel.adaptiveThinking.title')).toBeTruthy()
    })
  })

  it('updates effort level on dropdown change', async () => {
    const { updateEffortLevels } = await import('../api/aiModel')

    const { getByText, getAllByRole } = await act(async () => {
      return render(<AiModelPage />)
    })

    await waitFor(() => {
      const configureButton = getByText('aiModel.tabs.configure')
      fireEvent.click(configureButton)
    })

    await waitFor(() => {
      const selects = getAllByRole('combobox')
      const analysisSelect = selects.find(s => s.getAttribute('value') === 'Medium')
      if (analysisSelect) {
        fireEvent.change(analysisSelect, { target: { value: 'High' } })
      }
    })

    await waitFor(() => {
      expect(updateEffortLevels).toHaveBeenCalled()
    })
  })

  it('displays structured outputs toggle', async () => {
    const { getByText } = await act(async () => {
      return render(<AiModelPage />)
    })

    await waitFor(() => {
      const configureButton = getByText('aiModel.tabs.configure')
      fireEvent.click(configureButton)
    })

    await waitFor(() => {
      expect(getByText('aiModel.structuredOutputs.title')).toBeTruthy()
    })
  })

  it('toggles structured outputs', async () => {
    const { updateEffortLevels } = await import('../api/aiModel')

    const { getByText, container } = await act(async () => {
      return render(<AiModelPage />)
    })

    await waitFor(() => {
      const configureButton = getByText('aiModel.tabs.configure')
      fireEvent.click(configureButton)
    })

    await waitFor(() => {
      const toggleButtons = container.querySelectorAll('button[class*="rounded-full"]')
      const structuredOutputsToggle = Array.from(toggleButtons).find(btn =>
        btn.className.includes('bg-warm-600') || btn.className.includes('bg-green-500')
      )
      if (structuredOutputsToggle) {
        fireEvent.click(structuredOutputsToggle)
      }
    })

    await waitFor(() => {
      expect(updateEffortLevels).toHaveBeenCalled()
    })
  })

  it('displays cost estimate information', async () => {
    const { getByText } = await act(async () => {
      return render(<AiModelPage />)
    })

    await waitFor(() => {
      const configureButton = getByText('aiModel.tabs.configure')
      fireEvent.click(configureButton)
    })

    await waitFor(() => {
      expect(getByText('aiModel.costEstimate.title')).toBeTruthy()
    })
  })
})
