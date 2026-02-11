import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import type { PricingPlanData } from '../api/settings'
import FadeIn from './motion/FadeIn'
import StaggerChildren, { staggerItemVariants } from './motion/StaggerChildren'

interface PricingSectionProps {
  plans: PricingPlanData[]
  onSelectPlan?: (planId: string) => void
}

const fallbackPlans: PricingPlanData[] = [
  { id: 'free', name: 'Free', nameKorean: '무료', priceMonthly: 0, priceYearly: 0, currency: 'KRW', projectLimit: 1, features: ['basic_analysis', 'community_support'], isPopular: false },
  { id: 'starter', name: 'Starter', nameKorean: '스타터', priceMonthly: 49000, priceYearly: 470400, currency: 'KRW', projectLimit: 5, features: ['basic_analysis', 'email_support', 'custom_domain'], isPopular: false },
  { id: 'pro', name: 'Pro', nameKorean: '프로', priceMonthly: 149000, priceYearly: 1430400, currency: 'KRW', projectLimit: -1, features: ['advanced_analysis', 'priority_support', 'custom_domain', 'team_collab'], isPopular: true },
  { id: 'enterprise', name: 'Enterprise', nameKorean: '엔터프라이즈', priceMonthly: -1, priceYearly: -1, currency: 'KRW', projectLimit: -1, features: ['dedicated_infra', 'sla', 'dedicated_manager'], isPopular: false },
]

export default function PricingSection({ plans, onSelectPlan }: PricingSectionProps) {
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
    <section id="pricing" className="py-20 text-center">
      <FadeIn>
        <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">{t('pricing.title')}</h3>
        <p className="text-warm-500 mb-10 max-w-md mx-auto">{t('pricing.subtitle')}</p>
      </FadeIn>

      {/* Annual/Monthly toggle */}
      <FadeIn delay={0.1}>
        <div className="flex justify-center items-center gap-3 mb-12">
          <span className={`text-sm font-medium transition-colors ${!annual ? 'text-white' : 'text-warm-500'}`}>{t('pricing.monthly')}</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${annual ? 'bg-gradient-to-r from-accent-blue to-accent-purple shadow-glow-blue' : 'bg-warm-700'}`}
          >
            <motion.div
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-premium-sm"
              animate={{ x: annual ? 28 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${annual ? 'text-white' : 'text-warm-500'}`}>
            {t('pricing.annual')} <span className="text-accent-emerald text-xs font-semibold">{t('pricing.annualDiscount')}</span>
          </span>
        </div>
      </FadeIn>

      <StaggerChildren staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {displayPlans.map((plan) => (
          <motion.div
            key={plan.id}
            variants={staggerItemVariants}
            className={`relative rounded-2xl p-6 text-left transition-all duration-300 ${
              plan.isPopular
                ? 'bg-gradient-to-b from-accent-blue/20 to-accent-purple/10 ring-1 ring-accent-blue/40 shadow-glow-blue'
                : 'glass-card'
            }`}
            whileHover={{ y: -4 }}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-xs font-semibold bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-1 rounded-full shadow-glow-blue">
                  {t('pricing.popular')}
                </span>
              </div>
            )}
            <div className="text-lg font-bold mb-1 text-warm-100">{getName(plan)}</div>
            <div className="text-3xl font-bold mb-1 text-white">
              {formatPrice(plan)}
            </div>
            {plan.priceMonthly > 0 && (
              <div className={`text-sm mb-4 ${plan.isPopular ? 'text-accent-blue' : 'text-warm-500'}`}>
                {annual ? t('pricing.perMonthBilled') : t('pricing.perMonth')}
              </div>
            )}
            {plan.priceMonthly === 0 && <div className="text-sm mb-4 text-warm-500">{t('pricing.forever')}</div>}
            {plan.priceMonthly < 0 && <div className="text-sm mb-4 text-warm-500">{t('pricing.customPricing')}</div>}

            <div className="text-sm mb-4">
              <span className="font-medium text-warm-300">
                {plan.projectLimit < 0 ? t('pricing.unlimited') : t('pricing.projectLimit', { count: plan.projectLimit })}
              </span>
            </div>

            <div className="space-y-2 mb-6">
              {featureKeys.filter(f => planHasFeature(plan, f) || plan.id !== 'free').slice(0, 5).map((feature) => {
                const has = planHasFeature(plan, feature)
                return (
                  <div key={feature} className={`flex items-center gap-2 text-sm ${has ? 'text-warm-300' : 'text-warm-700'}`}>
                    {has ? (
                      <Check className="w-4 h-4 text-accent-emerald flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-warm-700 flex-shrink-0" />
                    )}
                    <span>{t(`pricing.feature.${feature}`)}</span>
                  </div>
                )
              })}
            </div>

            <motion.button
              onClick={() => onSelectPlan?.(plan.id)}
              className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all btn-premium ${
                plan.isPopular
                  ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-glow-blue hover:shadow-lg'
                  : plan.priceMonthly < 0
                    ? 'glass text-warm-300 hover:text-white'
                    : 'bg-warm-800 hover:bg-warm-700 text-warm-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {plan.priceMonthly < 0 ? t('pricing.contactUs') : t('pricing.getStarted')}
            </motion.button>
          </motion.div>
        ))}
      </StaggerChildren>
    </section>
  )
}
