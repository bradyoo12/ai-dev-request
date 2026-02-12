import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  detectCurrency,
  setPreferredCurrency,
  getPreferredCurrency,
  convertCurrency,
  getPlanPrice,
  formatCurrency,
  formatPlanPrice,
} from './currency'

// Helper to mock navigator.language
function mockNavigatorLanguage(lang: string) {
  Object.defineProperty(navigator, 'language', { value: lang, configurable: true })
}

beforeEach(() => {
  localStorage.clear()
  // Reset navigator.language to a neutral default
  mockNavigatorLanguage('en-US')
})

// ---------------------------------------------------------------------------
// detectCurrency
// ---------------------------------------------------------------------------
describe('detectCurrency', () => {
  it('returns stored preference when set', () => {
    setPreferredCurrency('JPY')
    expect(detectCurrency('ko')).toBe('JPY')
  })

  it('uses navigator.language when no preference stored', () => {
    mockNavigatorLanguage('ko-KR')
    expect(detectCurrency()).toBe('KRW')
  })

  it('detects USD from en-US', () => {
    mockNavigatorLanguage('en-US')
    expect(detectCurrency()).toBe('USD')
  })

  it('detects JPY from ja-JP', () => {
    mockNavigatorLanguage('ja-JP')
    expect(detectCurrency()).toBe('JPY')
  })

  it('detects EUR from de-DE', () => {
    mockNavigatorLanguage('de-DE')
    expect(detectCurrency()).toBe('EUR')
  })

  it('falls back to i18n language when navigator is unavailable', () => {
    // Simulate no navigator.language
    Object.defineProperty(navigator, 'language', { value: '', configurable: true })
    expect(detectCurrency('ko')).toBe('KRW')
    expect(detectCurrency('en')).toBe('USD')
    expect(detectCurrency('ja')).toBe('JPY')
  })

  it('defaults to USD when nothing matches', () => {
    Object.defineProperty(navigator, 'language', { value: '', configurable: true })
    expect(detectCurrency()).toBe('USD')
  })
})

// ---------------------------------------------------------------------------
// setPreferredCurrency / getPreferredCurrency
// ---------------------------------------------------------------------------
describe('preferred currency storage', () => {
  it('stores and retrieves the preferred currency', () => {
    expect(getPreferredCurrency()).toBeNull()
    setPreferredCurrency('EUR')
    expect(getPreferredCurrency()).toBe('EUR')
  })

  it('returns null for invalid stored values', () => {
    localStorage.setItem('preferred-currency', 'XYZ')
    expect(getPreferredCurrency()).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// convertCurrency
// ---------------------------------------------------------------------------
describe('convertCurrency', () => {
  it('returns same amount when from === to', () => {
    expect(convertCurrency(100, 'USD', 'USD')).toBe(100)
  })

  it('converts KRW to USD', () => {
    // 149000 KRW / 1400 = ~106 USD
    const result = convertCurrency(149000, 'KRW', 'USD')
    expect(result).toBeGreaterThan(100)
    expect(result).toBeLessThan(110)
  })

  it('converts USD to KRW', () => {
    // 100 USD * 1400 = 140000 KRW
    const result = convertCurrency(100, 'USD', 'KRW')
    expect(result).toBe(140000)
  })

  it('converts KRW to JPY', () => {
    // 149000 KRW -> USD -> JPY
    const result = convertCurrency(149000, 'KRW', 'JPY')
    expect(result).toBeGreaterThan(15000)
    expect(result).toBeLessThan(17000)
  })
})

// ---------------------------------------------------------------------------
// getPlanPrice
// ---------------------------------------------------------------------------
describe('getPlanPrice', () => {
  it('returns 0 for free plan', () => {
    expect(getPlanPrice('free', 'monthly', 'USD')).toBe(0)
    expect(getPlanPrice('free', 'monthly', 'KRW')).toBe(0)
  })

  it('returns -1 for enterprise plan', () => {
    expect(getPlanPrice('enterprise', 'monthly', 'USD')).toBe(-1)
    expect(getPlanPrice('enterprise', 'yearly', 'KRW')).toBe(-1)
  })

  it('converts starter plan monthly to USD', () => {
    const price = getPlanPrice('starter', 'monthly', 'USD')
    expect(price).toBe(35) // 49000 / 1400 = 35
  })

  it('returns original KRW price when target is KRW', () => {
    expect(getPlanPrice('pro', 'monthly', 'KRW')).toBe(149000)
  })

  it('returns 0 for unknown plan', () => {
    expect(getPlanPrice('unknown', 'monthly', 'USD')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------
describe('formatCurrency', () => {
  it('formats USD amounts', () => {
    const result = formatCurrency(35, 'USD')
    expect(result).toContain('35')
    expect(result).toContain('$')
  })

  it('formats KRW amounts without decimals', () => {
    const result = formatCurrency(149000, 'KRW')
    expect(result).toContain('149,000')
  })

  it('formats JPY amounts without decimals', () => {
    const result = formatCurrency(15964, 'JPY')
    expect(result).toContain('15,964')
  })

  it('formats EUR amounts with decimals', () => {
    const result = formatCurrency(32.2, 'EUR')
    // EUR formatting may vary by locale but should contain the amount
    expect(result).toContain('32')
  })
})

// ---------------------------------------------------------------------------
// formatPlanPrice
// ---------------------------------------------------------------------------
describe('formatPlanPrice', () => {
  const t = vi.fn((key: string) => key)

  beforeEach(() => {
    t.mockClear()
  })

  it('returns pricing.free for zero price', () => {
    expect(formatPlanPrice(0, 'USD', t)).toBe('pricing.free')
    expect(t).toHaveBeenCalledWith('pricing.free')
  })

  it('returns pricing.contact for negative price', () => {
    expect(formatPlanPrice(-1, 'USD', t)).toBe('pricing.contact')
    expect(t).toHaveBeenCalledWith('pricing.contact')
  })

  it('formats positive USD price', () => {
    const result = formatPlanPrice(35, 'USD', t)
    expect(result).toContain('$')
    expect(result).toContain('35')
  })

  it('formats positive KRW price', () => {
    const result = formatPlanPrice(149000, 'KRW', t)
    expect(result).toContain('149,000')
  })
})
