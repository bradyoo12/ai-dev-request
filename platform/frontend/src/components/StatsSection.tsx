import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import FadeIn from './motion/FadeIn'
import StaggerChildren, { staggerItemVariants } from './motion/StaggerChildren'

export default function StatsSection() {
  const { t } = useTranslation()

  const stats = [
    { value: '150+', label: t('stats.projects') },
    { value: '50+', label: t('stats.users') },
    { value: '< 5min', label: t('stats.analysisTime') },
  ]

  const techLogos = ['Claude AI', 'Azure', 'React', '.NET']

  return (
    <section className="py-16">
      <StaggerChildren staggerDelay={0.1} className="grid grid-cols-3 gap-6 mb-10">
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={staggerItemVariants} className="text-center">
            <div className="text-4xl md:text-5xl font-bold gradient-text mb-1">
              {stat.value}
            </div>
            <div className="text-warm-500 text-sm">{stat.label}</div>
          </motion.div>
        ))}
      </StaggerChildren>

      <FadeIn delay={0.3}>
        <div className="flex justify-center items-center gap-4 text-sm text-warm-600">
          <span className="font-medium">{t('stats.poweredBy')}</span>
          {techLogos.map((logo) => (
            <span key={logo} className="px-3 py-1.5 glass-card rounded-xl text-warm-400 text-xs font-medium">
              {logo}
            </span>
          ))}
        </div>
      </FadeIn>
    </section>
  )
}
