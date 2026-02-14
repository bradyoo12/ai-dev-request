import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getTokenOverview } from '../api/settings'
import type { TokenCost } from '../api/settings'

/**
 * CreditEstimatePreview - Shown in the form state before the user submits a request.
 * Displays current credit balance and estimated total cost for all pipeline steps,
 * so the user knows the approximate cost before starting.
 */
export default function CreditEstimatePreview() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tokenBalance } = useAuth()
  const [pricing, setPricing] = useState<TokenCost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const loadPricing = async () => {
      try {
        const overview = await getTokenOverview()
        if (!cancelled) {
          setPricing(overview.pricing)
        }
      } catch {
        // Silently fail - component will show with fallback values
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadPricing()
    return () => { cancelled = true }
  }, [])

  if (loading || tokenBalance == null) return null

  const getBaseCost = (actionType: string): number => {
    const found = pricing.find(p => p.actionType === actionType)
    return found?.tokenCost ?? 0
  }

  const analysisCost = getBaseCost('analysis')
  const proposalCost = getBaseCost('proposal')
  const buildCost = getBaseCost('build')
  const totalEstimate = analysisCost + proposalCost + buildCost
  const estimatedRemaining = tokenBalance - totalEstimate
  const isInsufficient = estimatedRemaining < 0

  return (
    <div className="mt-6 bg-gradient-to-r from-amber-900/15 to-orange-900/10 border border-amber-700/25 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h4 className="font-semibold text-amber-300 text-sm">{t('creditEstimate.preview.title')}</h4>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-warm-400">{t('creditEstimate.currentBalance')}:</span>
            <span className="text-sm font-bold text-white">{tokenBalance.toLocaleString()}</span>
            <span className="text-xs text-warm-500">{t('settings.tokens.tokensUnit')}</span>
          </div>
          <div className="text-warm-600 hidden sm:block">|</div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-warm-400">{t('creditEstimate.preview.totalEstimate')}:</span>
            <span className="text-sm font-bold text-amber-400">~{totalEstimate.toLocaleString()}</span>
            <span className="text-xs text-warm-500">{t('settings.tokens.tokensUnit')}</span>
          </div>
          <div className="text-warm-600 hidden sm:block">|</div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-warm-400">{t('creditEstimate.estimatedRemaining')}:</span>
            <span className={`text-sm font-bold ${isInsufficient ? 'text-red-400' : 'text-green-400'}`}>
              {estimatedRemaining.toLocaleString()}
            </span>
            <span className="text-xs text-warm-500">{t('settings.tokens.tokensUnit')}</span>
          </div>
        </div>
      </div>

      {/* Step costs breakdown - compact */}
      <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-warm-500">
        <span>{t('creditEstimate.step.analysis')}: {analysisCost.toLocaleString()}</span>
        <span className="text-warm-700">+</span>
        <span>{t('creditEstimate.step.proposal')}: {proposalCost.toLocaleString()}</span>
        <span className="text-warm-700">+</span>
        <span>{t('creditEstimate.step.build')}: {buildCost.toLocaleString()}</span>
      </div>

      {isInsufficient && (
        <div className="mt-3 flex items-center gap-2 bg-red-900/20 border border-red-700/30 rounded-lg p-2.5">
          <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-red-300 flex-1">{t('creditEstimate.preview.insufficientHint')}</p>
          <button
            type="button"
            onClick={() => navigate('/buy-credits')}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium text-white transition-colors flex-shrink-0"
          >
            {t('settings.tokens.buyTokens')}
          </button>
        </div>
      )}

      <p className="mt-2 text-[10px] text-warm-600 italic">{t('creditEstimate.preview.note')}</p>
    </div>
  )
}
