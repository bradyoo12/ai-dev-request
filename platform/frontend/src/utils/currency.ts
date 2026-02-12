/**
 * Currency utility for locale-aware pricing display.
 *
 * Resolution order:
 *   1. Logged-in user's preferred currency (stored in localStorage)
 *   2. Geolocation-based detection (navigator.language region subtag)
 *   3. Language-based fallback (en -> USD, ko -> KRW)
 */

export type Currency = 'USD' | 'KRW' | 'JPY' | 'EUR'

const STORAGE_KEY = 'preferred-currency'

/** Approximate exchange rates relative to 1 USD. */
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  KRW: 1400,
  JPY: 150,
  EUR: 0.92,
}

/** Canonical prices in KRW (must match fallbackPlans in PricingSection). */
export const BASE_PRICES_KRW: Record<string, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  starter: { monthly: 49000, yearly: 470400 },
  pro: { monthly: 149000, yearly: 1430400 },
  enterprise: { monthly: -1, yearly: -1 },
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/** Map a BCP-47 language/region tag to a currency. */
function currencyFromLocale(locale: string): Currency {
  const tag = locale.toLowerCase()
  // Check region subtag first  (e.g. en-US, ko-KR, ja-JP, de-DE)
  if (tag.includes('kr') || tag.startsWith('ko')) return 'KRW'
  if (tag.includes('jp') || tag.startsWith('ja')) return 'JPY'
  if (tag.includes('de') || tag.includes('fr') || tag.includes('es') || tag.includes('it') || tag.includes('nl')) return 'EUR'
  return 'USD'
}

/**
 * Detect the most appropriate currency for the current user.
 *
 * @param i18nLanguage  Current i18next language code (e.g. 'en' or 'ko')
 */
export function detectCurrency(i18nLanguage?: string): Currency {
  // 1. Explicit user preference
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && isValidCurrency(stored)) return stored

  // 2. Navigator language (includes region code when available, e.g. en-US)
  if (typeof navigator !== 'undefined' && navigator.language) {
    return currencyFromLocale(navigator.language)
  }

  // 3. i18n language fallback
  if (i18nLanguage) {
    return currencyFromLocale(i18nLanguage)
  }

  return 'USD'
}

export function setPreferredCurrency(currency: Currency): void {
  localStorage.setItem(STORAGE_KEY, currency)
}

export function getPreferredCurrency(): Currency | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored && isValidCurrency(stored) ? stored : null
}

function isValidCurrency(value: string): value is Currency {
  return ['USD', 'KRW', 'JPY', 'EUR'].includes(value)
}

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

/**
 * Convert an amount from one currency to another using static rates.
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
): number {
  if (from === to) return amount
  // Convert to USD first, then to target
  const usd = amount / EXCHANGE_RATES[from]
  return Math.round(usd * EXCHANGE_RATES[to])
}

/**
 * Get the price for a plan in the target currency.
 * Sentinel values (0 for free, -1 for contact us) are preserved.
 */
export function getPlanPrice(
  planId: string,
  period: 'monthly' | 'yearly',
  targetCurrency: Currency,
): number {
  const base = BASE_PRICES_KRW[planId]
  if (!base) return 0
  const amount = period === 'monthly' ? base.monthly : base.yearly
  // Preserve sentinel values
  if (amount <= 0) return amount
  return convertCurrency(amount, 'KRW', targetCurrency)
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const LOCALE_MAP: Record<Currency, string> = {
  USD: 'en-US',
  KRW: 'ko-KR',
  JPY: 'ja-JP',
  EUR: 'de-DE',
}

/**
 * Format a monetary amount in the given currency using Intl.NumberFormat.
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const fractionDigits = currency === 'KRW' || currency === 'JPY' ? 0 : 2
  return new Intl.NumberFormat(LOCALE_MAP[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount)
}

/**
 * Format a plan price for display.  Returns translated sentinel strings
 * for free / contact-us plans, otherwise a currency-formatted amount.
 *
 * @param price   Raw price (0 = free, negative = contact us)
 * @param currency Target currency
 * @param t       i18next t() function for sentinel labels
 */
export function formatPlanPrice(
  price: number,
  currency: Currency,
  t: (key: string) => string,
): string {
  if (price === 0) return t('pricing.free')
  if (price < 0) return t('pricing.contact')
  return formatCurrency(price, currency)
}
