import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockNavigate = vi.fn()
let mockSearchParams = new URLSearchParams('projectId=123&name=TestProject')
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../components/CodePreview', () => ({
  default: ({ projectName }: any) => <div data-testid="code-preview">{projectName}</div>,
}))

vi.mock('../utils/sampleProject', () => ({
  sampleProjectFiles: { '/App.tsx': 'console.log("hello")' },
}))

const mockGetProjectFiles = vi.fn()
vi.mock('../api/requests', () => ({
  getProjectFiles: (...args: any[]) => mockGetProjectFiles(...args),
}))

import PreviewPage from './PreviewPage'

describe('PreviewPage', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams('projectId=123&name=TestProject')
    mockGetProjectFiles.mockReset()
  })

  it('renders sample code preview when no requestId', () => {
    render(<PreviewPage />)
    expect(screen.getByTestId('code-preview')).toBeInTheDocument()
    expect(screen.getByText('codePreview.sampleData')).toBeInTheDocument()
  })

  it('renders back button', () => {
    render(<PreviewPage />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('fetches real files when requestId is present', async () => {
    mockSearchParams = new URLSearchParams('projectId=123&name=TestProject&requestId=abc-123')
    mockGetProjectFiles.mockResolvedValue({
      files: { '/App.tsx': 'real code' },
      projectName: 'test-project',
    })

    render(<PreviewPage />)

    await waitFor(() => {
      expect(screen.getByTestId('code-preview')).toBeInTheDocument()
    })
    expect(mockGetProjectFiles).toHaveBeenCalledWith('abc-123')
    expect(screen.queryByText('codePreview.sampleData')).not.toBeInTheDocument()
  })

  it('falls back to sample data on fetch error', async () => {
    mockSearchParams = new URLSearchParams('projectId=123&name=TestProject&requestId=abc-123')
    mockGetProjectFiles.mockRejectedValue(new Error('Network error'))

    render(<PreviewPage />)

    await waitFor(() => {
      expect(screen.getByTestId('code-preview')).toBeInTheDocument()
    })
    expect(screen.getByText('codePreview.loadError')).toBeInTheDocument()
    expect(screen.getByText('codePreview.sampleData')).toBeInTheDocument()
  })
})
