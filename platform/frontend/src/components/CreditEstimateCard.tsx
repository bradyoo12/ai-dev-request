import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { getTokenOverview } from '../api/settings'
import type { TokenCost } from '../api/settings'

interface CreditEstimateCardProps {
  /** The complexity from analysis result to adjust estimates */
  complexity: string
  /** Credits already used for analysis (if available) */
  analysisTokensUsed?: number
  /** Credits already used for proposal (if available) */
  proposalTokensUsed?: number
  /** Which steps have already been completed */
  completedSteps?: ('analysis' | 'proposal' | 'build')[]
}

/** Returns a complexity multiplier for credit estimation */
function getComplexityMultiplier(complexity: string): number {
  switch (complexity.toLowerCase()) {
    case 'simple': return 1.0
    case 'medium': return 1.5
    case 'complex': return 2.0
    case 'enterprise': return 3.0
    default: return 1.0
  }
}

export default function CreditEstimateCard({
  complexity,
  analysisTokensUsed,
  proposalTokensUsed,
  completedSteps = [],
}: CreditEstimateCardProps) {
  const { t } = useTranslation()
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
        // Silently fail - card will show with fallback values
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadPricing()
    return () => { cancelled = true }
  }, [])

  if (loading || tokenBalance == null) return null

  const multiplier = getComplexityMultiplier(complexity)

  // Get base costs from pricing data
  const getBaseCost = (actionType: string): number => {
    const found = pricing.find(p => p.actionType === actionType)
    return found?.tokenCost ?? 0
  }

  const analysisCost = analysisTokensUsed ?? Math.round(getBaseCost('analysis') * multiplier)
  const proposalCost = proposalTokensUsed ?? Math.round(getBaseCost('proposal') * multiplier)
  const buildCost = Math.round(getBaseCost('build') * multiplier)

  // Calculate total estimated cost for all steps
  const alreadySpent = (completedSteps.includes('analysis') ? analysisCost : 0) +
    (completedSteps.includes('proposal') ? proposalCost : 0) +
    (completedSteps.includes('build') ? buildCost : 0)

  const remainingEstimate = (completedSteps.includes('analysis') ? 0 : analysisCost) +
    (completedSteps.includes('proposal') ? 0 : proposalCost) +
    (completedSteps.includes('build') ? 0 : buildCost)

  const totalEstimate = alreadySpent + remainingEstimate
  const estimatedRemaining = tokenBalance - remainingEstimate
  const isInsufficientEstimate = estimatedRemaining < 0

  return (
    <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/10 border border-amber-700/30 rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h4 className="font-bold text-amber-300 text-lg">{t('creditEstimate.title')}</h4>
      </div>

      {/* Main credit summary grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-warm-900/60 rounded-xl p-3 text-center">
          <div className="text-xs text-warm-400 mb-1">{t('creditEstimate.currentBalance')}</div>
          <div className="text-xl font-bold text-white">
            {tokenBalance.toLocaleString()}
          </div>
          <div className="text-xs text-warm-500">{t('settings.tokens.tokensUnit')}</div>
        </div>
        <div className="bg-warm-900/60 rounded-xl p-3 text-center">
          <div className="text-xs text-warm-400 mb-1">{t('creditEstimate.estimatedUsage')}</div>
          <div className="text-xl font-bold text-amber-400">
            -{totalEstimate.toLocaleString()}
          </div>
          <div className="text-xs text-warm-500">{t('settings.tokens.tokensUnit')}</div>
        </div>
        <div className="bg-warm-900/60 rounded-xl p-3 text-center">
          <div className="text-xs text-warm-400 mb-1">{t('creditEstimate.estimatedRemaining')}</div>
          <div className={`text-xl font-bold ${isInsufficientEstimate ? 'text-red-400' : 'text-green-400'}`}>
            {estimatedRemaining.toLocaleString()}
          </div>
          <div className="text-xs text-warm-500">{t('settings.tokens.tokensUnit')}</div>
        </div>
      </div>

      {/* Step-by-step breakdown */}
      <div className="bg-warm-950/40 rounded-xl p-3">
        <div className="text-xs font-medium text-warm-400 mb-2">{t('creditEstimate.breakdown')}</div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {completedSteps.includes('analysis') ? (
                <span className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-[10px] text-white">&#10003;</span>
              ) : (
                <span className="w-4 h-4 bg-warm-700 rounded-full flex items-center justify-center text-[10px] text-warm-400">1</span>
              )}
              <span className={completedSteps.includes('analysis') ? 'text-warm-500 line-through' : 'text-warm-300'}>
                {t('creditEstimate.step.analysis')}
              </span>
            </div>
            <span className={completedSteps.includes('analysis') ? 'text-warm-500' : 'text-warm-300'}>
              {analysisCost.toLocaleString()} {t('settings.tokens.tokensUnit')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {completedSteps.includes('proposal') ? (
                <span className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-[10px] text-white">&#10003;</span>
              ) : (
                <span className="w-4 h-4 bg-warm-700 rounded-full flex items-center justify-center text-[10px] text-warm-400">2</span>
              )}
              <span className={completedSteps.includes('proposal') ? 'text-warm-500 line-through' : 'text-warm-300'}>
                {t('creditEstimate.step.proposal')}
              </span>
            </div>
            <span className={completedSteps.includes('proposal') ? 'text-warm-500' : 'text-warm-300'}>
              {proposalCost.toLocaleString()} {t('settings.tokens.tokensUnit')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {completedSteps.includes('build') ? (
                <span className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-[10px] text-white">&#10003;</span>
              ) : (
                <span className="w-4 h-4 bg-warm-700 rounded-full flex items-center justify-center text-[10px] text-warm-400">3</span>
              )}
              <span className={completedSteps.includes('build') ? 'text-warm-500 line-through' : 'text-warm-300'}>
                {t('creditEstimate.step.build')}
              </span>
            </div>
            <span className={completedSteps.includes('build') ? 'text-warm-500' : 'text-warm-300'}>
              {buildCost.toLocaleString()} {t('settings.tokens.tokensUnit')}
            </span>
          </div>
        </div>
      </div>

      {/* Warning if insufficient balance */}
      {isInsufficientEstimate && (
        <div className="mt-3 flex items-start gap-2 bg-red-900/20 border border-red-700/30 rounded-lg p-3">
          <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-red-300">{t('creditEstimate.insufficientWarning')}</p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="mt-3 text-[11px] text-warm-600 italic">{t('creditEstimate.disclaimer')}</p>
    </div>
  )
}
