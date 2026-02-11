import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { FileText, Search, Lightbulb, Hammer, Rocket } from 'lucide-react'
import FadeIn from './motion/FadeIn'
import StaggerChildren, { staggerItemVariants } from './motion/StaggerChildren'

export default function FeaturesSection() {
  const { t } = useTranslation()

  const steps = [
    { icon: FileText, gradient: 'from-accent-blue to-accent-cyan', glow: 'shadow-glow-blue', title: t('steps.request.title'), description: t('steps.request.description') },
    { icon: Search, gradient: 'from-accent-purple to-accent-blue', glow: 'shadow-glow-purple', title: t('steps.analysis.title'), description: t('steps.analysis.description') },
    { icon: Lightbulb, gradient: 'from-accent-amber to-accent-rose', glow: '', title: t('steps.proposal.title'), description: t('steps.proposal.description') },
    { icon: Hammer, gradient: 'from-accent-emerald to-accent-cyan', glow: 'shadow-glow-cyan', title: t('steps.build.title'), description: t('steps.build.description') },
    { icon: Rocket, gradient: 'from-accent-rose to-accent-purple', glow: 'shadow-glow-purple', title: t('steps.deploy.title'), description: t('steps.deploy.description') },
  ]

  return (
    <section id="how-it-works" className="py-20">
      <FadeIn>
        <h3 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
          {t('features.howItWorks')}
        </h3>
        <p className="text-warm-500 text-center mb-14 max-w-lg mx-auto">
          {t('hero.subtitle')}
        </p>
      </FadeIn>

      <StaggerChildren staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <motion.div key={i} variants={staggerItemVariants} className="relative group">
              <div className="glass-card rounded-2xl p-6 text-center h-full">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center transition-shadow duration-300 group-hover:${step.glow}`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-xs text-warm-600 mb-2 font-semibold uppercase tracking-wider">
                  {t('features.step', { num: i + 1 })}
                </div>
                <h4 className="font-bold mb-2 text-warm-100">{step.title}</h4>
                <p className="text-warm-500 text-sm leading-relaxed">{step.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-3 text-warm-700 text-lg items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-warm-600">
                    <path d="M2 6H10M10 6L7 3M10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </motion.div>
          )
        })}
      </StaggerChildren>
    </section>
  )
}
