import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getCostReport } from '../api/requests'
import type { CostReport } from '../api/requests'

interface CostSavingsDisplayProps {
  requestId: string
}

export default function CostSavingsDisplay({ requestId }: CostSavingsDisplayProps) {
  const { t } = useTranslation()
  const [costReport, setCostReport] = useState<CostReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    getCostReport(requestId)
      .then((data) => {
        setCostReport(data)
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [requestId])

  if (loading) {
    return (
      <div className="bg-warm-900 rounded-xl p-4 mb-4" data-testid="cost-savings-loading">
        <div className="flex items-center gap-2 text-warm-400">
          <div className="animate-spin w-4 h-4 border-2 border-warm-400 border-t-transparent rounded-full" role="status" aria-label={t('cost.loading')} />
          <span className="text-sm">{t('cost.loading')}</span>
        </div>
      </div>
    )
  }

  if (error || !costReport) {
    return null
  }

  const savingsPercentage = costReport.totalEstimatedCost > 0
    ? Math.round(
        (costReport.estimatedSavingsVsOpusOnly /
          (costReport.totalEstimatedCost + costReport.estimatedSavingsVsOpusOnly)) *
          100
      )
    : 0

  const getTierLabel = (tier: string): string => {
    switch (tier.toLowerCase()) {
      case 'haiku':
        return t('cost.tier.haiku')
      case 'sonnet':
        return t('cost.tier.sonnet')
      case 'opus':
        return t('cost.tier.opus')
      default:
        return tier
    }
  }

  const getTierColor = (tier: string): string => {
    switch (tier.toLowerCase()) {
      case 'haiku':
        return 'bg-green-600'
      case 'sonnet':
        return 'bg-blue-600'
      case 'opus':
        return 'bg-purple-600'
      default:
        return 'bg-warm-600'
    }
  }

  return (
    <div className="bg-teal-900/30 border border-teal-700 rounded-xl p-6 mb-4" data-testid="cost-savings-display">
      <h4 className="font-bold text-teal-400 mb-4">{t('cost.title')}</h4>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-warm-900/50 rounded-lg p-3 text-center">
          <div className="text-xs text-warm-400 mb-1">{t('cost.totalCost')}</div>
          <div className="text-xl font-bold text-white" data-testid="cost-total">
            ${costReport.totalEstimatedCost.toFixed(4)}
          </div>
        </div>
        <div className="bg-warm-900/50 rounded-lg p-3 text-center">
          <div className="text-xs text-warm-400 mb-1">{t('cost.savings')}</div>
          <div className="text-xl font-bold text-green-400" data-testid="cost-savings">
            ${costReport.estimatedSavingsVsOpusOnly.toFixed(4)}
          </div>
        </div>
      </div>

      {savingsPercentage > 0 && (
        <div className="mb-4" data-testid="cost-savings-bar">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-warm-400">{t('cost.savings')}</span>
            <span className="text-green-400 font-bold">{savingsPercentage}%</span>
          </div>
          <div className="w-full bg-warm-700 rounded-full h-2.5" role="progressbar" aria-valuenow={savingsPercentage} aria-valuemin={0} aria-valuemax={100} aria-label={`${t('cost.savings')}: ${savingsPercentage}%`}>
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(savingsPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {costReport.tierBreakdown.length > 0 && (
        <div>
          <div className="text-sm text-warm-400 font-medium mb-2">{t('cost.tierBreakdown')}</div>
          <div className="space-y-2">
            {costReport.tierBreakdown.map((usage, index) => (
              <div key={index} className="flex items-center justify-between bg-warm-800 rounded-lg p-2.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getTierColor(usage.tier)}`}>
                    {getTierLabel(usage.tier)}
                  </span>
                  <span className="text-xs text-warm-400">{usage.category}</span>
                </div>
                <div className="text-sm font-medium text-warm-300">
                  ${usage.estimatedCost.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
