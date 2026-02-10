import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string, fallback?: string) => fallback || key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/streaming-generation', () => ({
  startGeneration: vi.fn(() => Promise.resolve({
    id: 'stream-1',
    devRequestId: 1,
    status: 'idle',
    currentFile: null,
    totalFiles: 0,
    completedFiles: 0,
    totalTokens: 0,
    streamedTokens: 0,
    progressPercent: 0,
    generatedFiles: null,
    errorMessage: null,
    createdAt: '2024-01-01',
    startedAt: null,
    completedAt: null,
  })),
  cancelGeneration: vi.fn(() => Promise.resolve({
    id: 'stream-1',
    devRequestId: 1,
    status: 'cancelled',
  })),
  getStreamStatus: vi.fn(() => Promise.resolve(null)),
  getStreamHistory: vi.fn(() => Promise.resolve([])),
  connectToStream: vi.fn(() => ({
    close: vi.fn(),
    addEventListener: vi.fn(),
    onerror: null,
  })),
}))

import StreamingGenerationPage from './StreamingGenerationPage'

beforeEach(() => { vi.clearAllMocks() })

describe('StreamingGenerationPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<StreamingGenerationPage />)
    })
    expect(document.body).toBeTruthy()
  })

  it('shows empty state when no stream is active', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<StreamingGenerationPage />)
      container = result.container
    })
    // Should show the "No Active Generation" text
    expect(container!.textContent).toContain('No Active Generation')
  })

  it('shows request ID input', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<StreamingGenerationPage />)
      container = result.container
    })
    const input = container!.querySelector('input[type="number"]')
    expect(input).toBeTruthy()
  })

  it('shows Start Generation button', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<StreamingGenerationPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Start Generation')
  })
})
