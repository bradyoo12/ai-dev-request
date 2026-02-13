import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SubagentOrchestrationPage from './SubagentOrchestrationPage'
import * as orchestrationApi from '../api/orchestration'

// Mock the API module
vi.mock('../api/orchestration')

// Mock i18next
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>()
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, defaultValue?: string) => defaultValue || key,
    }),
  }
})

const mockOrchestration: orchestrationApi.ParallelOrchestration = {
  id: 1,
  devRequestId: 'test-request-123',
  status: 'running',
  totalTasks: 5,
  completedTasks: 2,
  failedTasks: 0,
  dependencyGraphJson: '{}',
  startedAt: new Date().toISOString(),
  totalDurationMs: 45000,
  createdAt: new Date().toISOString(),
}

const mockTasks: orchestrationApi.SubagentTask[] = [
  {
    id: 1,
    devRequestId: 'test-request-123',
    parentOrchestrationId: 1,
    taskType: 'frontend',
    name: 'Generate Frontend Components',
    description: 'Creating React components',
    contextJson: '{}',
    status: 'completed',
    outputJson: '{}',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: 15000,
    tokensUsed: 5000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    devRequestId: 'test-request-123',
    parentOrchestrationId: 1,
    taskType: 'backend',
    name: 'Generate Backend API',
    description: 'Creating API controllers',
    contextJson: '{}',
    status: 'running',
    startedAt: new Date().toISOString(),
    durationMs: 0,
    tokensUsed: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    devRequestId: 'test-request-123',
    parentOrchestrationId: 1,
    taskType: 'tests',
    name: 'Generate Tests',
    description: 'Creating unit tests',
    contextJson: '{}',
    status: 'pending',
    durationMs: 0,
    tokensUsed: 0,
    createdAt: new Date().toISOString(),
  },
]

const mockConflicts: orchestrationApi.MergeConflict[] = [
  {
    id: 1,
    type: 'import',
    filePath: 'src/types.ts',
    description: 'Import statement conflict between frontend and backend',
    conflictingTasks: [1, 2],
    status: 'unresolved',
  },
  {
    id: 2,
    type: 'api_contract',
    filePath: 'src/api/user.ts',
    description: 'API endpoint mismatch',
    conflictingTasks: [2, 3],
    status: 'resolved',
  },
]

describe('SubagentOrchestrationPage', () => {
  let mockEventSource: {
    onmessage: ((event: MessageEvent) => void) | null
    onerror: ((event: Event) => void) | null
    close: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock EventSource
    mockEventSource = {
      onmessage: null,
      onerror: null,
      close: vi.fn(),
    }

    vi.mocked(orchestrationApi.createEventSource).mockReturnValue(mockEventSource as unknown as EventSource)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function renderPage() {
    return render(
      <BrowserRouter>
        <SubagentOrchestrationPage />
      </BrowserRouter>
    )
  }

  it('renders page with input fields', () => {
    renderPage()

    expect(screen.getByText(/Parallel Subagent Orchestration/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Enter request ID/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Generation/i })).toBeInTheDocument()
  })

  it('shows empty state when no orchestration is active', () => {
    renderPage()

    expect(screen.getByText(/Ready to Accelerate/i)).toBeInTheDocument()
    expect(screen.getByText(/Multiple AI agents will work simultaneously/i)).toBeInTheDocument()
  })

  it('validates request ID input before starting', async () => {
    renderPage()

    const startButton = screen.getByRole('button', { name: /Start Generation/i })
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByText(/Please enter a request ID/i)).toBeInTheDocument()
    })

    expect(orchestrationApi.startOrchestration).not.toHaveBeenCalled()
  })

  it('starts orchestration and loads data', async () => {
    vi.mocked(orchestrationApi.startOrchestration).mockResolvedValue(mockOrchestration)
    vi.mocked(orchestrationApi.getOrchestrationTasks).mockResolvedValue(mockTasks)
    vi.mocked(orchestrationApi.getConflicts).mockResolvedValue(mockConflicts)

    renderPage()

    const input = screen.getByPlaceholderText(/Enter request ID/i)
    fireEvent.change(input, { target: { value: 'test-request-123' } })

    const startButton = screen.getByRole('button', { name: /Start Generation/i })
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(orchestrationApi.startOrchestration).toHaveBeenCalledWith('test-request-123')
      expect(orchestrationApi.getOrchestrationTasks).toHaveBeenCalledWith('test-request-123')
      expect(orchestrationApi.getConflicts).toHaveBeenCalledWith(1)
    })

    // Check if status is displayed
    await waitFor(() => {
      expect(screen.getByText('RUNNING')).toBeInTheDocument()
    })
  })

  it('displays subagent cards with correct status', async () => {
    vi.mocked(orchestrationApi.startOrchestration).mockResolvedValue(mockOrchestration)
    vi.mocked(orchestrationApi.getOrchestrationTasks).mockResolvedValue(mockTasks)
    vi.mocked(orchestrationApi.getConflicts).mockResolvedValue([])

    renderPage()

    const input = screen.getByPlaceholderText(/Enter request ID/i)
    fireEvent.change(input, { target: { value: 'test-request-123' } })

    const startButton = screen.getByRole('button', { name: /Start Generation/i })
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('Frontend')).toBeInTheDocument()
      expect(screen.getByText('Backend')).toBeInTheDocument()
      expect(screen.getByText('Tests')).toBeInTheDocument()
    })

    // Check status badges
    const completedBadges = screen.getAllByText('completed')
    expect(completedBadges.length).toBeGreaterThan(0)

    const runningBadges = screen.getAllByText('running')
    expect(runningBadges.length).toBeGreaterThan(0)
  })

  it('shows timeline view with parallel execution', async () => {
    vi.mocked(orchestrationApi.startOrchestration).mockResolvedValue(mockOrchestration)
    vi.mocked(orchestrationApi.getOrchestrationTasks).mockResolvedValue(mockTasks)
    vi.mocked(orchestrationApi.getConflicts).mockResolvedValue([])

    renderPage()

    const input = screen.getByPlaceholderText(/Enter request ID/i)
    fireEvent.change(input, { target: { value: 'test-request-123' } })

    const startButton = screen.getByRole('button', { name: /Start Generation/i })
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByText(/Execution Timeline/i)).toBeInTheDocument()
    })
  })

  it('handles conflict resolution interactions', async () => {
    vi.mocked(orchestrationApi.startOrchestration).mockResolvedValue(mockOrchestration)
    vi.mocked(orchestrationApi.getOrchestrationTasks).mockResolvedValue(mockTasks)
    vi.mocked(orchestrationApi.getConflicts).mockResolvedValue(mockConflicts)
    vi.mocked(orchestrationApi.resolveConflict).mockResolvedValue({
      ...mockConflicts[0],
      status: 'resolved',
    })

    renderPage()

    const input = screen.getByPlaceholderText(/Enter request ID/i)
    fireEvent.change(input, { target: { value: 'test-request-123' } })

    const startButton = screen.getByRole('button', { name: /Start Generation/i })
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByText(/Conflicts/i)).toBeInTheDocument()
    })

    // Find and click auto-resolve button
    const autoButtons = screen.getAllByText(/Auto/i)
    if (autoButtons.length > 0) {
      fireEvent.click(autoButtons[0])

      await waitFor(() => {
        expect(orchestrationApi.resolveConflict).toHaveBeenCalledWith(1, 1, true)
      })
    }
  })

  it('tests real-time updates via mock EventSource', async () => {
    vi.mocked(orchestrationApi.startOrchestration).mockResolvedValue(mockOrchestration)
    vi.mocked(orchestrationApi.getOrchestrationTasks).mockResolvedValue(mockTasks)
    vi.mocked(orchestrationApi.getConflicts).mockResolvedValue([])

    renderPage()

    const input = screen.getByPlaceholderText(/Enter request ID/i)
    fireEvent.change(input, { target: { value: 'test-request-123' } })

    const startButton = screen.getByRole('button', { name: /Start Generation/i })
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(orchestrationApi.createEventSource).toHaveBeenCalledWith(1)
    })

    // Simulate SSE message
    if (mockEventSource.onmessage) {
      const mockEvent = {
        data: JSON.stringify({
          type: 'task_update',
          task: {
            ...mockTasks[1],
            status: 'completed',
            durationMs: 20000,
          },
          message: 'Backend generation completed',
        }),
      } as MessageEvent

      mockEventSource.onmessage(mockEvent)

      await waitFor(() => {
        expect(screen.getByText(/Backend generation completed/i)).toBeInTheDocument()
      })
    }
  })

  it('handles cancel orchestration', async () => {
    vi.mocked(orchestrationApi.startOrchestration).mockResolvedValue(mockOrchestration)
    vi.mocked(orchestrationApi.getOrchestrationTasks).mockResolvedValue(mockTasks)
    vi.mocked(orchestrationApi.getConflicts).mockResolvedValue([])
    vi.mocked(orchestrationApi.cancelOrchestration).mockResolvedValue({
      ...mockOrchestration,
      status: 'failed',
    })

    renderPage()

    const input = screen.getByPlaceholderText(/Enter request ID/i)
    fireEvent.change(input, { target: { value: 'test-request-123' } })

    const startButton = screen.getByRole('button', { name: /Start Generation/i })
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(orchestrationApi.cancelOrchestration).toHaveBeenCalledWith('test-request-123')
    })
  })

  it('handles API errors gracefully', async () => {
    vi.mocked(orchestrationApi.startOrchestration).mockRejectedValue(new Error('API Error'))

    renderPage()

    const input = screen.getByPlaceholderText(/Enter request ID/i)
    fireEvent.change(input, { target: { value: 'test-request-123' } })

    const startButton = screen.getByRole('button', { name: /Start Generation/i })
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByText(/API Error/i)).toBeInTheDocument()
    })
  })

  it('refreshes status on refresh button click', async () => {
    vi.mocked(orchestrationApi.startOrchestration).mockResolvedValue(mockOrchestration)
    vi.mocked(orchestrationApi.getOrchestrationTasks).mockResolvedValue(mockTasks)
    vi.mocked(orchestrationApi.getConflicts).mockResolvedValue([])
    vi.mocked(orchestrationApi.getOrchestrationStatus).mockResolvedValue({
      ...mockOrchestration,
      completedTasks: 3,
    })

    renderPage()

    const input = screen.getByPlaceholderText(/Enter request ID/i)
    fireEvent.change(input, { target: { value: 'test-request-123' } })

    const startButton = screen.getByRole('button', { name: /Start Generation/i })
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument()
    })

    const refreshButton = screen.getByRole('button', { name: /Refresh/i })
    fireEvent.click(refreshButton)

    await waitFor(() => {
      expect(orchestrationApi.getOrchestrationStatus).toHaveBeenCalledWith('test-request-123')
    })
  })
})
