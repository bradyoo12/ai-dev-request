import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockGenerateExpoPreview = vi.fn()

vi.mock('../api/requests', () => ({
  generateExpoPreview: (...args: unknown[]) => mockGenerateExpoPreview(...args),
}))

import MobilePreview from './MobilePreview'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MobilePreview', () => {
  it('renders QR code when previewUrl is provided', () => {
    render(<MobilePreview requestId="req-1" previewUrl="https://snack.expo.dev/test" platform="mobile" />)
    expect(screen.getByText('mobile.previewTitle')).toBeInTheDocument()
    expect(screen.getByText('mobile.previewDescription')).toBeInTheDocument()
    expect(screen.getByText('mobile.openInBrowser')).toBeInTheDocument()
    // QR code should be rendered as SVG
    const svg = document.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  it('shows Generate Preview button when no previewUrl', () => {
    render(<MobilePreview requestId="req-1" platform="mobile" />)
    expect(screen.getByText('mobile.generatePreview')).toBeInTheDocument()
    expect(screen.getByText('mobile.generateDescription')).toBeInTheDocument()
  })

  it('does not render for non-mobile platforms', () => {
    const { container } = render(<MobilePreview requestId="req-1" platform="web" />)
    expect(container.innerHTML).toBe('')
  })

  it('does not render when platform is undefined', () => {
    const { container } = render(<MobilePreview requestId="req-1" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders for react-native platform', () => {
    render(<MobilePreview requestId="req-1" platform="react-native" />)
    expect(screen.getByText('mobile.previewTitle')).toBeInTheDocument()
  })

  it('renders for expo platform', () => {
    render(<MobilePreview requestId="req-1" platform="expo" />)
    expect(screen.getByText('mobile.previewTitle')).toBeInTheDocument()
  })

  it('shows loading state while generating', async () => {
    mockGenerateExpoPreview.mockImplementation(() => new Promise(() => {}))
    render(<MobilePreview requestId="req-1" platform="mobile" />)
    const user = userEvent.setup()

    await user.click(screen.getByText('mobile.generatePreview'))
    expect(screen.getByText('mobile.generating')).toBeInTheDocument()
  })

  it('shows error state if generation fails', async () => {
    mockGenerateExpoPreview.mockRejectedValue(new Error('Network error'))
    render(<MobilePreview requestId="req-1" platform="mobile" />)
    const user = userEvent.setup()

    await act(async () => {
      await user.click(screen.getByText('mobile.generatePreview'))
    })

    expect(screen.getByText('Network error')).toBeInTheDocument()
    expect(screen.getByText('mobile.retryGenerate')).toBeInTheDocument()
  })

  it('shows QR code after successful generation', async () => {
    mockGenerateExpoPreview.mockResolvedValue({
      success: true,
      previewUrl: 'https://snack.expo.dev/test',
      snackUrl: 'https://snack.expo.dev/test',
    })
    render(<MobilePreview requestId="req-1" platform="mobile" />)
    const user = userEvent.setup()

    await act(async () => {
      await user.click(screen.getByText('mobile.generatePreview'))
    })

    expect(screen.getByText('mobile.openInBrowser')).toBeInTheDocument()
    const svg = document.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  it('shows instructions with correct steps', () => {
    render(<MobilePreview requestId="req-1" previewUrl="https://snack.expo.dev/test" platform="mobile" />)
    expect(screen.getByText(/mobile.step1/)).toBeInTheDocument()
    expect(screen.getByText(/mobile.step2/)).toBeInTheDocument()
    expect(screen.getByText(/mobile.step3/)).toBeInTheDocument()
  })

  it('links to snack URL in browser link', () => {
    render(<MobilePreview requestId="req-1" previewUrl="https://snack.expo.dev/test" platform="mobile" />)
    const link = screen.getByText('mobile.openInBrowser')
    expect(link.closest('a')).toHaveAttribute('href', 'https://snack.expo.dev/test')
    expect(link.closest('a')).toHaveAttribute('target', '_blank')
  })
})
