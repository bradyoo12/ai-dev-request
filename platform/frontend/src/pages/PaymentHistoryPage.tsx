import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getPaymentHistory } from '../api/payments'
import type { PaymentRecord } from '../api/payments'

export default function PaymentHistoryPage() {
  const { t } = useTranslation()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getPaymentHistory(page, pageSize)
      setPayments(result.payments)
      setTotalCount(result.totalCount)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.requestFailed'))
    } finally {
      setLoading(false)
    }
  }, [page, t])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Succeeded':
        return 'bg-green-900/50 text-green-400'
      case 'Pending':
        return 'bg-yellow-900/50 text-yellow-400'
      case 'Failed':
        return 'bg-red-900/50 text-red-400'
      case 'Refunded':
        return 'bg-blue-900/50 text-blue-400'
      case 'Cancelled':
        return 'bg-warm-700 text-warm-400'
      default:
        return 'bg-warm-700 text-warm-400'
    }
  }

  const getStatusLabel = (status: string) => {
    const key = `payments.status.${status.toLowerCase()}`
    const translated = t(key)
    return translated === key ? status : translated
  }

  const getTypeLabel = (type: string) => {
    const key = `payments.type.${type.toLowerCase()}`
    const translated = t(key)
    return translated === key ? type : translated
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-warm-400">{t('payments.loading')}</p>
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

      <div className="bg-warm-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-bold">{t('payments.history')}</h3>
          <span className="text-warm-400 text-sm">
            {t('payments.totalPayments', { count: totalCount })}
          </span>
        </div>

        {payments.length === 0 ? (
          <p className="text-warm-500 text-center py-8">{t('payments.noHistory')}</p>
        ) : (
          <>
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="text-warm-400 border-b border-warm-700">
                    <th className="text-left py-2 px-2">{t('payments.date')}</th>
                    <th className="text-left py-2 px-2">{t('payments.typeLabel')}</th>
                    <th className="text-center py-2 px-2">{t('payments.providerLabel')}</th>
                    <th className="text-left py-2 px-2">{t('payments.description')}</th>
                    <th className="text-right py-2 px-2">{t('payments.amount')}</th>
                    <th className="text-center py-2 px-2">{t('payments.tokensLabel')}</th>
                    <th className="text-center py-2 px-2">{t('payments.statusLabel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-warm-700/50">
                      <td className="py-2 px-2 text-warm-400 whitespace-nowrap">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="py-2 px-2">{getTypeLabel(payment.type)}</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          payment.provider === 'CoinbaseCommerce'
                            ? 'bg-orange-900/50 text-orange-400'
                            : 'bg-blue-900/50 text-blue-400'
                        }`}>
                          {payment.provider === 'CoinbaseCommerce' ? t('payments.providerCrypto') : t('payments.providerStripe')}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-warm-400">
                        {payment.description || '-'}
                      </td>
                      <td className="py-2 px-2 text-right font-medium">
                        ${payment.amountUsd.toFixed(2)}
                        <span className="text-warm-500 text-xs ml-1">
                          {payment.currency.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        {payment.tokensAwarded != null ? (
                          <span className="text-green-400">
                            +{payment.tokensAwarded.toLocaleString()}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(payment.status)}`}
                        >
                          {getStatusLabel(payment.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalCount > pageSize && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 min-h-[44px] bg-warm-700 hover:bg-warm-600 disabled:bg-warm-800 disabled:text-warm-600 rounded-lg text-sm transition-colors"
                >
                  {t('payments.prev')}
                </button>
                <span className="text-warm-400 text-sm">
                  {page} / {Math.ceil(totalCount / pageSize)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(totalCount / pageSize)}
                  className="px-4 py-2 min-h-[44px] bg-warm-700 hover:bg-warm-600 disabled:bg-warm-800 disabled:text-warm-600 rounded-lg text-sm transition-colors"
                >
                  {t('payments.next')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
