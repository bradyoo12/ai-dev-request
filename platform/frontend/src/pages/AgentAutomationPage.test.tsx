import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      if (typeof fallback === 'string') return fallback
      return key
    },
  }),
}))

const mockGetAgentConfig = vi.fn()
const mockUpdateAgentConfig = vi.fn()
const mockGetAgentTasks = vi.fn()
const mockRetryAgentTask = vi.fn()

vi.mock('../api/agent-automation', () => ({
  getAgentConfig: (...args: unknown[]) => mockGetAgentConfig(...args),
  updateAgentConfig: (...args: unknown[]) => mockUpdateAgentConfig(...args),
  getAgentTasks: (...args: unknown[]) => mockGetAgentTasks(...args),
  retryAgentTask: (...args: unknown[]) => mockRetryAgentTask(...args),
}))

import AgentAutomationPage from './AgentAutomationPage'

const defaultConfig = {
  enabled: false,
  triggerLabels: ['auto-implement', 'agent'],
  maxConcurrent: 2,
  autoMerge: false,
}

const defaultTasks = [
  {
    id: 'task-1',
    issueNumber: 42,
    issueTitle: 'Fix login bug',
    status: 'implementing',
    startedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'task-2',
    issueNumber: 99,
    issueTitle: 'Add dark mode',
    status: 'failed',
    startedAt: '2024-01-02T00:00:00Z',
    error: 'Build failed',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockGetAgentConfig.mockResolvedValue(defaultConfig)
  mockGetAgentTasks.mockResolvedValue(defaultTasks)
  mockUpdateAgentConfig.mockResolvedValue(defaultConfig)
})

describe('AgentAutomationPage', () => {
  it('renders settings title and description', async () => {
    render(<AgentAutomationPage />)
    await waitFor(() => {
      expect(screen.getByText('agentAutomation.settings.title')).toBeInTheDocument()
    })
    expect(screen.getByText('agentAutomation.settings.description')).toBeInTheDocument()
  })

  it('renders enable toggle', async () => {
    render(<AgentAutomationPage />)
    await waitFor(() => {
      expect(screen.getByTestId('agent-automation-toggle')).toBeInTheDocument()
    })
  })

  it('toggles agent automation on/off', async () => {
    const user = userEvent.setup()
    render(<AgentAutomationPage />)
    await waitFor(() => {
      expect(screen.getByTestId('agent-automation-toggle')).toBeInTheDocument()
    })

    const toggle = screen.getByTestId('agent-automation-toggle')
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('renders trigger labels', async () => {
    render(<AgentAutomationPage />)
    await waitFor(() => {
      expect(screen.getByText('auto-implement')).toBeInTheDocument()
    })
    expect(screen.getByText('agent')).toBeInTheDocument()
  })

  it('renders max concurrent selector', async () => {
    render(<AgentAutomationPage />)
    await waitFor(() => {
      expect(screen.getByTestId('max-concurrent-select')).toBeInTheDocument()
    })
  })

  it('renders auto-merge toggle', async () => {
    render(<AgentAutomationPage />)
    await waitFor(() => {
      expect(screen.getByTestId('auto-merge-toggle')).toBeInTheDocument()
    })
  })

  it('renders webhook URL section', async () => {
    render(<AgentAutomationPage />)
    await waitFor(() => {
      expect(screen.getByTestId('copy-webhook-btn')).toBeInTheDocument()
    })
  })

  it('renders agent tasks table', async () => {
    render(<AgentAutomationPage />)
    await waitFor(() => {
      expect(screen.getByTestId('agent-tasks-table')).toBeInTheDocument()
    })
    expect(screen.getByText('#42')).toBeInTheDocument()
    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
    expect(screen.getByText('#99')).toBeInTheDocument()
    expect(screen.getByText('Add dark mode')).toBeInTheDocument()
  })

  it('shows retry button for failed tasks', async () => {
    render(<AgentAutomationPage />)
    await waitFor(() => {
      expect(screen.getByTestId('retry-btn-task-2')).toBeInTheDocument()
    })
  })

  it('shows no activity message when tasks are empty', async () => {
    mockGetAgentTasks.mockResolvedValue([])
    render(<AgentAutomationPage />)
    await waitFor(() => {
      expect(screen.getByText('agentAutomation.noActivity')).toBeInTheDocument()
    })
  })

  it('calls save when save button is clicked', async () => {
    const user = userEvent.setup()
    mockUpdateAgentConfig.mockResolvedValue({ ...defaultConfig, enabled: true })
    render(<AgentAutomationPage />)
    await waitFor(() => {
      expect(screen.getByTestId('save-config-btn')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('save-config-btn'))
    await waitFor(() => {
      expect(mockUpdateAgentConfig).toHaveBeenCalled()
    })
  })

  it('shows error when loading fails', async () => {
    mockGetAgentConfig.mockRejectedValue(new Error('Network error'))
    render(<AgentAutomationPage />)
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })
})
