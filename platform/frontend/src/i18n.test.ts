import { describe, it, expect, vi } from 'vitest'

vi.mock('i18next', () => {
  const instance = {
    use: vi.fn(() => instance),
    init: vi.fn(() => Promise.resolve()),
  }
  return { default: instance }
})

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('i18next-http-backend', () => ({
  default: { type: 'backend', init: vi.fn() },
}))

vi.mock('i18next-browser-languagedetector', () => ({
  default: { type: 'languageDetector', init: vi.fn() },
}))

vi.mock('./locales/ko.json', () => ({ default: { key: 'value-ko' } }))
vi.mock('./locales/en.json', () => ({ default: { key: 'value-en' } }))

describe('i18n', () => {
  it('initializes i18next', async () => {
    const i18n = (await import('./i18n')).default
    expect(i18n.use).toHaveBeenCalledTimes(3)
    expect(i18n.init).toHaveBeenCalledTimes(1)
  })

  it('configures with fallback language ko', async () => {
    const i18n = (await import('./i18n')).default
    const initCall = vi.mocked(i18n.init).mock.calls[0][0] as any
    expect(initCall.fallbackLng).toBe('ko')
  })

  it('configures resources for ko and en', async () => {
    const i18n = (await import('./i18n')).default
    const initCall = vi.mocked(i18n.init).mock.calls[0][0] as any
    expect(initCall.resources).toHaveProperty('ko')
    expect(initCall.resources).toHaveProperty('en')
  })
})
