import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockChangeLanguage = vi.fn()
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'ko', changeLanguage: mockChangeLanguage },
  }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => { vi.clearAllMocks() })

import LanguageSelector from './LanguageSelector'

describe('LanguageSelector', () => {
  it('renders nothing while loading', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    const { container } = render(<LanguageSelector />)
    expect(container.innerHTML).toBe('')
  })

  it('renders language button after fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([
        { code: 'ko', name: 'Korean', nativeName: '한국어', isDefault: true },
        { code: 'en', name: 'English', nativeName: 'English', isDefault: false },
      ]),
    })
    await act(async () => {
      render(<LanguageSelector />)
    })
    expect(screen.getByText('한국어')).toBeInTheDocument()
  })

  it('falls back to default languages on fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fail'))
    await act(async () => {
      render(<LanguageSelector />)
    })
    expect(screen.getByText('한국어')).toBeInTheDocument()
  })

  it('opens dropdown on click', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([
        { code: 'ko', name: 'Korean', nativeName: '한국어', isDefault: true },
        { code: 'en', name: 'English', nativeName: 'English', isDefault: false },
      ]),
    })
    await act(async () => {
      render(<LanguageSelector />)
    })
    const user = userEvent.setup()
    const button = screen.getByText('한국어').closest('button')!
    await user.click(button)
    expect(screen.getByText('English')).toBeInTheDocument()
  })

  it('changes language on selection', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([
        { code: 'ko', name: 'Korean', nativeName: '한국어', isDefault: true },
        { code: 'en', name: 'English', nativeName: 'English', isDefault: false },
      ]),
    })
    await act(async () => {
      render(<LanguageSelector />)
    })
    const user = userEvent.setup()
    const toggle = screen.getByText('한국어').closest('button')!
    await user.click(toggle)
    await user.click(screen.getByText('English'))
    expect(mockChangeLanguage).toHaveBeenCalledWith('en')
  })
})
