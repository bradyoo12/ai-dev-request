import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getTokenOverview,
  getTokenHistory,
  getTokenPackages,
} from '../api/settings'
import type {
  TokenOverview,
  TokenTransaction,
  TokenPackage,
} from '../api/settings'
import { createCheckout } from '../api/payments'

interface SettingsPageProps {
  onBalanceChange?: (balance: number) => void
}

export default function SettingsPage({ onBalanceChange }: SettingsPageProps) {
  const { t } = useTranslation()

  const [overview, setOverview] = useState<TokenOverview | null>(null)
  const [transactions, setTransactions] = useState<TokenTransaction[]>([])
  const [packages, setPackages] = useState<TokenPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showBuyDialog, setShowBuyDialog] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'crypto'>('stripe')
  const [historyPage, setHistoryPage] = useState(1)
  const [actionFilter, setActionFilter] = useState<string>('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [overviewData, historyData] = await Promise.all([
        getTokenOverview(),
        getTokenHistory(1, 20, actionFilter || undefined),
      ])
      setOverview(overviewData)
      setTransactions(historyData)
      setHistoryPage(1)
      onBalanceChange?.(overviewData.balance)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.requestFailed'))
    } finally {
      setLoading(false)
    }
  }, [actionFilter, onBalanceChange, t])

  useEffect(() => {
    loadData()
  }, [loadData])

  const loadMoreHistory = async () => {
    try {
      const nextPage = historyPage + 1
      const moreData = await getTokenHistory(nextPage, 20, actionFilter || undefined)
      if (moreData.length > 0) {
        setTransactions((prev) => [...prev, ...moreData])
        setHistoryPage(nextPage)
      }
    } catch {
      // Silently fail for pagination
    }
  }

  const handleBuyTokens = async (pkg: TokenPackage) => {
    try {
      setPurchasing(true)
      const result = await createCheckout(pkg.id, undefined, undefined, paymentMethod)
      if (result.isSimulation) {
        // Simulation mode - tokens credited immediately
        setShowBuyDialog(false)
        await loadData()
      } else {
        // Redirect to checkout (Stripe or Coinbase hosted page)
        window.location.href = result.checkoutUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.requestFailed'))
    } finally {
      setPurchasing(false)
    }
  }

  const openBuyDialog = async () => {
    try {
      const pkgs = await getTokenPackages()
      setPackages(pkgs)
      setShowBuyDialog(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.requestFailed'))
    }
  }

  const getActionLabel = (action: string) => {
    const key = `settings.tokens.action.${action}`
    const translated = t(key)
    return translated === key ? action : translated
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">{t('settings.loading')}</p>
      </div>
    )
  }

  if (error && !overview) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          {t('button.tryAgain')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Token Balance Overview */}
      {overview && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">{t('settings.tokens.balance')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-300 text-sm">{t('settings.tokens.currentBalance')}</div>
              <div className="text-3xl font-bold">{overview.balance.toLocaleString()}</div>
              <div className="text-gray-400 text-sm">
                ≈ ${overview.balanceValueUsd.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-gray-300 text-sm">{t('settings.tokens.totalEarned')}</div>
              <div className="text-xl font-bold text-green-400">
                +{overview.totalEarned.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-300 text-sm">{t('settings.tokens.totalSpent')}</div>
              <div className="text-xl font-bold text-orange-400">
                -{overview.totalSpent.toLocaleString()}
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={openBuyDialog}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
              >
                {t('settings.tokens.buyTokens')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token Costs Per Action */}
      {overview && overview.pricing.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">{t('settings.tokens.costPerAction')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {overview.pricing.map((p) => (
              <div key={p.actionType} className="bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-gray-400 text-sm">{getActionLabel(p.actionType)}</div>
                <div className="text-xl font-bold">{p.tokenCost}</div>
                <div className="text-gray-500 text-xs">≈ ${p.approxUsd.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t('settings.tokens.history')}</h3>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1 text-sm"
          >
            <option value="">{t('settings.tokens.allActions')}</option>
            <option value="welcome_bonus">{t('settings.tokens.action.welcome_bonus')}</option>
            <option value="purchase">{t('settings.tokens.action.purchase')}</option>
            <option value="analysis">{t('settings.tokens.action.analysis')}</option>
            <option value="proposal">{t('settings.tokens.action.proposal')}</option>
            <option value="build">{t('settings.tokens.action.build')}</option>
            <option value="staging">{t('settings.tokens.action.staging')}</option>
          </select>
        </div>

        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">{t('settings.tokens.noHistory')}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 px-2">{t('settings.tokens.historyDate')}</th>
                    <th className="text-left py-2 px-2">{t('settings.tokens.historyAction')}</th>
                    <th className="text-left py-2 px-2">{t('settings.tokens.historyDescription')}</th>
                    <th className="text-right py-2 px-2">{t('settings.tokens.historyAmount')}</th>
                    <th className="text-right py-2 px-2">{t('settings.tokens.historyBalanceAfter')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-700/50">
                      <td className="py-2 px-2 text-gray-400 whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="py-2 px-2">{getActionLabel(tx.action)}</td>
                      <td className="py-2 px-2 text-gray-400">{tx.description}</td>
                      <td
                        className={`py-2 px-2 text-right font-medium ${
                          tx.amount > 0 ? 'text-green-400' : 'text-orange-400'
                        }`}
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount.toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-400">
                        {tx.balanceAfter.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions.length >= historyPage * 20 && (
              <div className="text-center mt-4">
                <button
                  onClick={loadMoreHistory}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  {t('settings.tokens.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Buy Tokens Dialog */}
      {showBuyDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{t('settings.tokens.buyTokens')}</h3>
              <button
                onClick={() => setShowBuyDialog(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Payment Method Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPaymentMethod('stripe')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors border ${
                  paymentMethod === 'stripe'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {t('payments.methodCard')}
              </button>
              <button
                onClick={() => setPaymentMethod('crypto')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors border ${
                  paymentMethod === 'crypto'
                    ? 'bg-orange-600 border-orange-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {t('payments.methodCrypto')}
              </button>
            </div>

            {paymentMethod === 'crypto' && (
              <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-3 mb-4 text-sm text-orange-300">
                {t('payments.cryptoNote')}
              </div>
            )}

            <div className="space-y-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-gray-900 rounded-xl p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
                >
                  <div>
                    <div className="font-bold">{pkg.name}</div>
                    <div className="text-gray-400 text-sm">
                      {pkg.tokenAmount.toLocaleString()} {t('settings.tokens.tokensUnit')}
                    </div>
                    {pkg.discountPercent > 0 && (
                      <div className="text-green-400 text-xs mt-1">
                        {t('settings.tokens.discount', { percent: pkg.discountPercent })}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleBuyTokens(pkg)}
                    disabled={purchasing}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-600 ${
                      paymentMethod === 'crypto'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    ${pkg.priceUsd.toFixed(2)}
                  </button>
                </div>
              ))}
            </div>

            <p className="text-gray-500 text-xs mt-4 text-center">
              {t('settings.tokens.simulatedPayment')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
