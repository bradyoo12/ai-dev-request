import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

import LivePreview from './LivePreview'

describe('LivePreview', () => {
  it('renders preview title', () => {
    render(<LivePreview previewUrl="https://example.com" />)
    expect(screen.getByText('preview.title')).toBeInTheDocument()
  })

  it('renders device toggle buttons', () => {
    render(<LivePreview previewUrl="https://example.com" />)
    expect(screen.getByText('preview.desktop')).toBeInTheDocument()
    expect(screen.getByText('preview.tablet')).toBeInTheDocument()
    expect(screen.getByText('preview.mobile')).toBeInTheDocument()
  })

  it('renders iframe with correct src', () => {
    render(<LivePreview previewUrl="https://example.com" />)
    const iframe = document.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe?.src).toBe('https://example.com/')
  })

  it('prepends https if missing', () => {
    render(<LivePreview previewUrl="example.com" />)
    const iframe = document.querySelector('iframe')
    expect(iframe?.src).toBe('https://example.com/')
  })

  it('renders copy URL button', () => {
    render(<LivePreview previewUrl="https://example.com" />)
    expect(screen.getByText('preview.copyUrl')).toBeInTheDocument()
  })

  it('renders open in new tab link', () => {
    render(<LivePreview previewUrl="https://example.com" />)
    expect(screen.getByText('preview.openNew')).toBeInTheDocument()
  })

  it('switches device mode on click', async () => {
    render(<LivePreview previewUrl="https://example.com" />)
    const user = userEvent.setup()
    await user.click(screen.getByText('preview.tablet'))
    expect(screen.getByText('768px')).toBeInTheDocument()
  })
})
