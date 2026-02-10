import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams('projectId=123&name=TestProject')],
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

import PreviewPage from './PreviewPage'

describe('PreviewPage', () => {
  it('renders code preview', () => {
    render(<PreviewPage />)
    expect(screen.getByTestId('code-preview')).toBeInTheDocument()
  })

  it('renders back button', () => {
    render(<PreviewPage />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
