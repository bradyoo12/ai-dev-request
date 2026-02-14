import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

vi.mock('./motion/StaggerChildren', () => ({
  default: ({ children, className }: any) => <div className={className}>{children}</div>,
  staggerItemVariants: {},
}))

vi.mock('./StatusBadge', () => ({
  StatusBadge: ({ status }: any) => <span data-testid="status-badge">{status}</span>,
}))

const mockApproveSubTask = vi.fn()
const mockApproveAllSubTasks = vi.fn()

vi.mock('../api/subtasks', () => ({
  approveSubTask: (...args: any[]) => mockApproveSubTask(...args),
  approveAllSubTasks: (...args: any[]) => mockApproveAllSubTasks(...args),
}))

import SubTaskList from './SubTaskList'
import type { SubTask } from '../api/subtasks'

beforeEach(() => {
  vi.clearAllMocks()
})

const makeSubTask = (overrides: Partial<SubTask> = {}): SubTask => ({
  id: 'st-1',
  devRequestId: 'req-1',
  title: 'Implement feature',
  status: 'Pending',
  order: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('SubTaskList', () => {
  it('returns null when no subtasks', () => {
    const { container } = render(
      <SubTaskList requestId="req-1" subTasks={[]} onRefresh={vi.fn()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders subtask titles', () => {
    const subTasks = [
      makeSubTask({ id: 'st-1', title: 'First task', order: 1 }),
      makeSubTask({ id: 'st-2', title: 'Second task', order: 2 }),
    ]
    render(<SubTaskList requestId="req-1" subTasks={subTasks} onRefresh={vi.fn()} />)
    expect(screen.getByText('First task')).toBeInTheDocument()
    expect(screen.getByText('Second task')).toBeInTheDocument()
  })

  it('renders order numbers', () => {
    const subTasks = [makeSubTask({ order: 3 })]
    render(<SubTaskList requestId="req-1" subTasks={subTasks} onRefresh={vi.fn()} />)
    expect(screen.getByText('3.')).toBeInTheDocument()
  })

  it('renders description when present', () => {
    const subTasks = [makeSubTask({ description: 'Some details here' })]
    render(<SubTaskList requestId="req-1" subTasks={subTasks} onRefresh={vi.fn()} />)
    expect(screen.getByText('Some details here')).toBeInTheDocument()
  })

  it('renders estimated credits when present', () => {
    const subTasks = [makeSubTask({ estimatedCredits: 50 })]
    render(<SubTaskList requestId="req-1" subTasks={subTasks} onRefresh={vi.fn()} />)
    expect(screen.getByText('50 subtasks.credits')).toBeInTheDocument()
  })

  it('renders dependency label when dependsOnSubTaskId is set', () => {
    const subTasks = [
      makeSubTask({ id: 'st-1', title: 'First task', order: 1 }),
      makeSubTask({ id: 'st-2', title: 'Second task', order: 2, dependsOnSubTaskId: 'st-1' }),
    ]
    render(<SubTaskList requestId="req-1" subTasks={subTasks} onRefresh={vi.fn()} />)
    const depLabel = screen.getByText(/subtasks.dependsOn/)
    expect(depLabel).toBeInTheDocument()
    expect(depLabel.textContent).toContain('First task')
  })

  it('shows approve button for pending subtasks', () => {
    const subTasks = [makeSubTask({ status: 'Pending' })]
    render(<SubTaskList requestId="req-1" subTasks={subTasks} onRefresh={vi.fn()} />)
    expect(screen.getByText('subtasks.approve')).toBeInTheDocument()
  })

  it('does not show approve button for approved subtasks', () => {
    const subTasks = [makeSubTask({ status: 'Approved' })]
    render(<SubTaskList requestId="req-1" subTasks={subTasks} onRefresh={vi.fn()} />)
    expect(screen.queryByText('subtasks.approve')).not.toBeInTheDocument()
  })

  it('shows approve all button when there are pending subtasks', () => {
    const subTasks = [makeSubTask({ status: 'Pending' })]
    render(<SubTaskList requestId="req-1" subTasks={subTasks} onRefresh={vi.fn()} />)
    expect(screen.getByText('subtasks.approveAll')).toBeInTheDocument()
  })

  it('does not show approve all button when no pending subtasks', () => {
    const subTasks = [makeSubTask({ status: 'Approved' })]
    render(<SubTaskList requestId="req-1" subTasks={subTasks} onRefresh={vi.fn()} />)
    expect(screen.queryByText('subtasks.approveAll')).not.toBeInTheDocument()
  })

  it('calls approveSubTask and onRefresh when approve button is clicked', async () => {
    mockApproveSubTask.mockResolvedValueOnce({ id: 'st-1', status: 'Approved' })
    const onRefresh = vi.fn()
    const subTasks = [makeSubTask({ id: 'st-1', status: 'Pending' })]
    render(<SubTaskList requestId="req-1" subTasks={subTasks} onRefresh={onRefresh} />)

    fireEvent.click(screen.getByText('subtasks.approve'))

    await waitFor(() => {
      expect(mockApproveSubTask).toHaveBeenCalledWith('req-1', 'st-1')
      expect(onRefresh).toHaveBeenCalled()
    })
  })

  it('calls approveAllSubTasks and onRefresh when approve all button is clicked', async () => {
    mockApproveAllSubTasks.mockResolvedValueOnce([])
    const onRefresh = vi.fn()
    const subTasks = [makeSubTask({ status: 'Pending' })]
    render(<SubTaskList requestId="req-1" subTasks={subTasks} onRefresh={onRefresh} />)

    fireEvent.click(screen.getByText('subtasks.approveAll'))

    await waitFor(() => {
      expect(mockApproveAllSubTasks).toHaveBeenCalledWith('req-1')
      expect(onRefresh).toHaveBeenCalled()
    })
  })

  it('handles approve failure silently', async () => {
    mockApproveSubTask.mockRejectedValueOnce(new Error('Network error'))
    const onRefresh = vi.fn()
    const subTasks = [makeSubTask({ id: 'st-1', status: 'Pending' })]
    render(<SubTaskList requestId="req-1" subTasks={subTasks} onRefresh={onRefresh} />)

    fireEvent.click(screen.getByText('subtasks.approve'))

    await waitFor(() => {
      expect(mockApproveSubTask).toHaveBeenCalled()
      expect(onRefresh).not.toHaveBeenCalled()
    })
  })

  it('handles approve all failure silently', async () => {
    mockApproveAllSubTasks.mockRejectedValueOnce(new Error('Network error'))
    const onRefresh = vi.fn()
    const subTasks = [makeSubTask({ status: 'Pending' })]
    render(<SubTaskList requestId="req-1" subTasks={subTasks} onRefresh={onRefresh} />)

    fireEvent.click(screen.getByText('subtasks.approveAll'))

    await waitFor(() => {
      expect(mockApproveAllSubTasks).toHaveBeenCalled()
      expect(onRefresh).not.toHaveBeenCalled()
    })
  })

  it('renders status badges for each subtask', () => {
    const subTasks = [
      makeSubTask({ id: 'st-1', status: 'Pending' }),
      makeSubTask({ id: 'st-2', status: 'Approved' }),
    ]
    render(<SubTaskList requestId="req-1" subTasks={subTasks} onRefresh={vi.fn()} />)
    const badges = screen.getAllByTestId('status-badge')
    expect(badges).toHaveLength(2)
  })
})
