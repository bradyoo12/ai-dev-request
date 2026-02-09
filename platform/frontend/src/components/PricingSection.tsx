import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X } from 'lucide-react'
import type { PricingPlanData } from '../api/settings'

interface PricingSectionProps {
  plans: PricingPlanData[]
}

const fallbackPlans: PricingPlanData[] = [
  { id: 'free', name: 'Free', nameKorean: '무료', priceMonthly: 0, priceYearly: 0, currency: 'KRW', projectLimit: 1, features: ['basic_analysis', 'community_support'], isPopular: false },
  { id: 'starter', name: 'Starter', nameKorean: '스타터', priceMonthly: 49000, priceYearly: 470400, currency: 'KRW', projectLimit: 5, features: ['basic_analysis', 'email_support', 'custom_domain'], isPopular: false },
  { id: 'pro', name: 'Pro', nameKorean: '프로', priceMonthly: 149000, priceYearly: 1430400, currency: 'KRW', projectLimit: -1, features: ['advanced_analysis', 'priority_support', 'custom_domain', 'team_collab'], isPopular: true },
  { id: 'enterprise', name: 'Enterprise', nameKorean: '엔터프라이즈', priceMonthly: -1, priceYearly: -1, currency: 'KRW', projectLimit: -1, features: ['dedicated_infra', 'sla', 'dedicated_manager'], isPopular: false },
]

export default function PricingSection({ plans }: PricingSectionProps) {
  const { t, i18n } = useTranslation()
  const [annual, setAnnual] = useState(false)

  const displayPlans = plans.length > 0 ? plans : fallbackPlans

  const featureKeys = [
    'basic_analysis', 'advanced_analysis', 'email_support', 'priority_support',
    'custom_domain', 'team_collab', 'dedicated_infra', 'sla', 'dedicated_manager', 'community_support',
  ]

  const planHasFeature = (plan: PricingPlanData, feature: string): boolean => {
    if (plan.features.includes(feature)) return true
    if (feature === 'basic_analysis' && plan.features.includes('advanced_analysis')) return true
    if (feature === 'email_support' && plan.features.includes('priority_support')) return true
    if (feature === 'community_support') return true
    return false
  }

  const formatPrice = (plan: PricingPlanData) => {
    const price = annual ? plan.priceYearly : plan.priceMonthly
    if (price === 0) return t('pricing.free')
    if (price < 0) return t('pricing.contact')
    const symbol = plan.currency === 'KRW' ? '₩' : '$'
    const displayPrice = annual ? Math.round(price / 12) : price
    return `${symbol}${displayPrice.toLocaleString()}`
  }

  const getName = (plan: PricingPlanData) => {
    return i18n.language === 'ko' && plan.nameKorean ? plan.nameKorean : plan.name
  }

  return (
    <section id="pricing" className="py-16 text-center">
      <h3 className="text-3xl font-bold mb-4">{t('pricing.title')}</h3>
      <p className="text-gray-400 mb-8">{t('pricing.subtitle')}</p>

      {/* Annual/Monthly toggle */}
      <div className="flex justify-center items-center gap-3 mb-10">
        <span className={`text-sm ${!annual ? 'text-white' : 'text-gray-400'}`}>{t('pricing.monthly')}</span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative w-14 h-7 rounded-full transition-colors ${annual ? 'bg-blue-600' : 'bg-gray-600'}`}
        >
          <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform ${annual ? 'translate-x-7' : 'translate-x-0.5'}`} />
        </button>
        <span className={`text-sm ${annual ? 'text-white' : 'text-gray-400'}`}>
          {t('pricing.annual')} <span className="text-green-400 text-xs">{t('pricing.annualDiscount')}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {displayPlans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl p-6 text-left transition-all hover:-translate-y-1 ${
              plan.isPopular
                ? 'bg-blue-600 ring-2 ring-blue-400 shadow-xl shadow-blue-600/20'
                : 'bg-gray-800'
            }`}
          >
            {plan.isPopular && (
              <div className="text-xs font-medium bg-blue-400 text-blue-900 px-2 py-0.5 rounded-full inline-block mb-3">
                {t('pricing.popular')}
              </div>
            )}
            <div className="text-lg font-bold mb-1">{getName(plan)}</div>
            <div className="text-3xl font-bold mb-1">
              {formatPrice(plan)}
            </div>
            {plan.priceMonthly > 0 && (
              <div className={`text-sm mb-4 ${plan.isPopular ? 'text-blue-200' : 'text-gray-400'}`}>
                {annual ? t('pricing.perMonthBilled') : t('pricing.perMonth')}
              </div>
            )}
            {plan.priceMonthly === 0 && <div className="text-sm mb-4 text-gray-400">{t('pricing.forever')}</div>}
            {plan.priceMonthly < 0 && <div className="text-sm mb-4 text-gray-400">{t('pricing.customPricing')}</div>}

            <div className="text-sm mb-4">
              <span className="font-medium">
                {plan.projectLimit < 0 ? t('pricing.unlimited') : t('pricing.projectLimit', { count: plan.projectLimit })}
              </span>
            </div>

            <div className="space-y-2 mb-6">
              {featureKeys.filter(f => planHasFeature(plan, f) || plan.id !== 'free').slice(0, 5).map((feature) => {
                const has = planHasFeature(plan, feature)
                return (
                  <div key={feature} className={`flex items-center gap-2 text-sm ${has ? '' : 'text-gray-500'}`}>
                    {has ? (
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    )}
                    <span>{t(`pricing.feature.${feature}`)}</span>
                  </div>
                )
              })}
            </div>

            <button className={`w-full py-2.5 rounded-xl font-medium text-sm transition-colors ${
              plan.isPopular
                ? 'bg-white text-blue-600 hover:bg-blue-50'
                : plan.priceMonthly < 0
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-blue-600 hover:bg-blue-700'
            }`}>
              {plan.priceMonthly < 0 ? t('pricing.contactUs') : t('pricing.getStarted')}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
