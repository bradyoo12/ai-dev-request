import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getHostingPlans, getRecommendedPlan } from '../api/hosting'
import type { HostingPlan } from '../api/hosting'

interface PlanSelectionDialogProps {
  complexity: string
  tokenCost: number
  onSelect: (planId: number) => void
  onCancel: () => void
}

export default function PlanSelectionDialog({
  complexity,
  tokenCost,
  onSelect,
  onCancel,
}: PlanSelectionDialogProps) {
  const { t } = useTranslation()
  const [plans, setPlans] = useState<HostingPlan[]>([])
  const [recommendedPlanId, setRecommendedPlanId] = useState<number | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [allPlans, recommended] = await Promise.all([
          getHostingPlans(),
          getRecommendedPlan(complexity),
        ])
        setPlans(allPlans)
        setRecommendedPlanId(recommended.id)
        setSelectedPlanId(recommended.id)
      } catch {
        // Fallback if loading fails
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [complexity])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-2xl p-6 max-w-4xl w-full text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">{t('hosting.loading')}</p>
        </div>
      </div>
    )
  }

  const selectedPlan = plans.find(p => p.id === selectedPlanId)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-4xl w-full my-8">
        <h3 className="text-xl font-bold mb-2">{t('hosting.selectPlan')}</h3>
        <p className="text-gray-400 text-sm mb-4">{t('hosting.selectPlanDescription')}</p>

        {recommendedPlanId && (
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 mb-4 text-sm text-blue-300">
            {t('hosting.recommended', {
              plan: plans.find(p => p.id === recommendedPlanId)?.displayName ?? '',
              complexity,
            })}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`relative rounded-xl p-4 text-left transition-all ${
                selectedPlanId === plan.id
                  ? 'bg-blue-900/50 border-2 border-blue-500'
                  : 'bg-gray-900 border-2 border-gray-700 hover:border-gray-500'
              }`}
            >
              {plan.id === recommendedPlanId && (
                <span className="absolute -top-2 right-2 bg-blue-600 text-xs px-2 py-0.5 rounded-full">
                  {t('hosting.recommendedBadge')}
                </span>
              )}
              <div className="font-bold text-lg mb-1">{plan.displayName}</div>
              <div className="text-2xl font-bold mb-2">
                {plan.monthlyCostUsd === 0
                  ? t('hosting.free')
                  : `$${plan.monthlyCostUsd}`}
                {plan.monthlyCostUsd > 0 && (
                  <span className="text-sm text-gray-400 font-normal">{t('hosting.perMonth')}</span>
                )}
              </div>
              <div className="space-y-1 text-sm text-gray-400">
                <div>{plan.vcpu} {t('hosting.vcpu')}</div>
                <div>{plan.memoryGb} GB RAM</div>
                <div>{plan.supportsAutoscale ? t('hosting.autoScale') : t('hosting.noScaling')}</div>
                <div>{plan.supportsCustomDomain ? t('hosting.customDomain') : t('hosting.noCustomDomain')}</div>
              </div>
              {plan.bestFor && (
                <div className="mt-2 text-xs text-gray-500">{plan.bestFor}</div>
              )}
            </button>
          ))}
        </div>

        {/* Confirmation summary */}
        {selectedPlan && (
          <div className="bg-gray-900 rounded-xl p-4 mb-4">
            <h4 className="font-medium mb-3">{t('hosting.confirmTitle')}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('hosting.buildCost')}</span>
                <span>{tokenCost} {t('settings.tokens.tokensUnit')} (${(tokenCost * 0.01).toFixed(2)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('hosting.monthlyCost')}</span>
                <span className="font-bold">
                  {selectedPlan.monthlyCostUsd === 0
                    ? t('hosting.free')
                    : `$${selectedPlan.monthlyCostUsd.toFixed(2)}${t('hosting.perMonth')}`}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mb-4">
          {t('hosting.billingNote')}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
          >
            {t('tokens.confirm.cancel')}
          </button>
          <button
            onClick={() => selectedPlanId && onSelect(selectedPlanId)}
            disabled={!selectedPlanId}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-xl font-medium transition-colors"
          >
            {t('hosting.buildAndDeploy')}
          </button>
        </div>
      </div>
    </div>
  )
}
