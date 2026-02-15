import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  getCreditPackages,
  getCreditBalance,
  createCreditCheckout,
} from '../api/credits'
import type { CreditPackage, CreditPackagesResponse, CreditBalance } from '../api/credits'
import PaymentDisclaimer from '../components/PaymentDisclaimer'

type Currency = 'USD' | 'KRW' | 'JPY' | 'EUR'

const CURRENCIES: Currency[] = ['USD', 'KRW', 'JPY', 'EUR']

function detectCurrency(): Currency {
  const lang = navigator.language || ''
  const prefix = lang.split('-')[0].toLowerCase()
  switch (prefix) {
    case 'ko':
      return 'KRW'
    case 'ja':
      return 'JPY'
    default:
      return 'USD'
  }
}

function formatCurrency(amount: number, currency: Currency): string {
  const localeMap: Record<Currency, string> = {
    USD: 'en-US',
    KRW: 'ko-KR',
    JPY: 'ja-JP',
    EUR: 'de-DE',
  }

  return new Intl.NumberFormat(localeMap[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'KRW' || currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'KRW' || currency === 'JPY' ? 0 : 2,
  }).format(amount)
}

function formatExchangeRate(rate: number, currency: Currency): string {
  if (currency === 'USD') return ''
  const localeMap: Record<Currency, string> = {
    USD: 'en-US',
    KRW: 'ko-KR',
    JPY: 'ja-JP',
    EUR: 'de-DE',
  }
  return new Intl.NumberFormat(localeMap[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rate)
}

export default function BuyCreditsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [currency, setCurrency] = useState<Currency>(detectCurrency)
  const [packagesData, setPackagesData] = useState<CreditPackagesResponse | null>(null)
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [purchasingId, setPurchasingId] = useState<number | null>(null)
  const [policyAgreed, setPolicyAgreed] = useState(false)

  const loadData = useCallback(async (cur: Currency) => {
    try {
      setLoading(true)
      setError('')
      const [pkgData, balData] = await Promise.all([
        getCreditPackages(cur),
        getCreditBalance(),
      ])
      setPackagesData(pkgData)
      setBalance(balData)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.requestFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadData(currency)
  }, [currency, loadData])

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency)
  }

  const handlePurchase = async (pkg: CreditPackage) => {
    setPurchasingId(pkg.id)
    setError('')
    try {
      const result = await createCreditCheckout(pkg.id, currency)
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.requestFailed'))
    } finally {
      setPurchasingId(null)
    }
  }

  const rateUpdatedDate = useMemo(() => {
    if (!packagesData?.rateUpdatedAt) return ''
    return new Date(packagesData.rateUpdatedAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }, [packagesData?.rateUpdatedAt])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-warm-400">{t('credits.loading')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold">{t('credits.buyCredits')}</h1>
          <div className="flex items-center gap-2">
            <label htmlFor="currency-select" className="text-sm text-warm-400">
              {t('credits.currencySelector')}:
            </label>
            <select
              id="currency-select"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
              className="bg-warm-700 text-white text-sm rounded-lg px-3 py-1.5 border border-warm-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CURRENCIES.map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Exchange rate info */}
        <div className="bg-warm-900 rounded-xl p-4 space-y-1">
          <p className="text-sm text-warm-300">
            {t('credits.exchangeRateInfo', { rate: '100' })}
          </p>
          {currency !== 'USD' && packagesData && (
            <p className="text-sm text-warm-400">
              {t('credits.todaysRate', {
                rate: formatExchangeRate(packagesData.exchangeRate, currency),
                currency,
                date: rateUpdatedDate,
              })}
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Credit & Refund Policy Disclaimer */}
      <PaymentDisclaimer
        requireAgreement
        agreed={policyAgreed}
        onAgreementChange={setPolicyAgreed}
      />

      {/* Package cards */}
      {packagesData && packagesData.packages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {packagesData.packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-warm-900 rounded-xl p-6 border-2 transition-colors flex flex-col ${
                pkg.isPopular
                  ? 'border-blue-500 shadow-lg shadow-blue-500/10'
                  : 'border-transparent hover:border-warm-700'
              }`}
            >
              {/* Popular badge */}
              {pkg.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {t('credits.popular')}
                  </span>
                </div>
              )}

              <div className="flex-1 space-y-3">
                {/* Package name */}
                <h3 className="text-lg font-bold text-center pt-1">
                  {t(`credits.${pkg.name.toLowerCase()}`, pkg.name)}
                </h3>

                {/* Credits amount */}
                <div className="text-center">
                  <span className="text-2xl font-bold text-blue-400">
                    ~{pkg.credits.toLocaleString()}
                  </span>
                  <span className="text-sm text-warm-400 ml-1">
                    {t('credits.creditsLabel')}
                  </span>
                </div>

                {/* Price */}
                <div className="text-center">
                  <span className="text-xl font-semibold">
                    {formatCurrency(pkg.price, currency)}
                  </span>
                </div>
              </div>

              {/* Purchase button */}
              <button
                onClick={() => handlePurchase(pkg)}
                disabled={purchasingId !== null || !policyAgreed}
                className={`mt-4 w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  pkg.isPopular
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-warm-700 hover:bg-warm-600 text-white'
                }`}
              >
                {purchasingId === pkg.id
                  ? t('credits.purchasing')
                  : t('credits.purchase')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Balance section */}
      {balance && (
        <div className="bg-warm-900 rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-yellow-400"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 0 1 0 4H8" />
                <path d="M12 18V6" />
              </svg>
              <div>
                <div className="text-sm text-warm-400">{t('credits.yourBalance')}</div>
                <div className="text-2xl font-bold">
                  {balance.balance.toLocaleString()}{' '}
                  <span className="text-sm text-warm-400 font-normal">
                    {t('credits.creditsLabel')}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/settings/billing')}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {t('credits.transactionHistory')} &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
