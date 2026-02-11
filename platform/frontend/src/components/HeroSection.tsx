import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Zap, Shield, Globe } from 'lucide-react'
import FadeIn from './motion/FadeIn'

interface HeroSectionProps {
  onScrollToForm: () => void
}

const floatingOrbs = [
  { size: 'w-[500px] h-[500px]', color: 'from-accent-blue/15 to-accent-purple/10', position: 'top-[-10%] left-[-5%]', delay: 0 },
  { size: 'w-[400px] h-[400px]', color: 'from-accent-purple/10 to-accent-cyan/8', position: 'bottom-[-5%] right-[-5%]', delay: 2 },
  { size: 'w-[300px] h-[300px]', color: 'from-accent-cyan/8 to-accent-blue/5', position: 'top-[20%] right-[10%]', delay: 4 },
]

const trustBadges = [
  { icon: Zap, label: 'hero.badge.fast' },
  { icon: Shield, label: 'hero.badge.secure' },
  { icon: Globe, label: 'hero.badge.deploy' },
]

export default function HeroSection({ onScrollToForm }: HeroSectionProps) {
  const { t } = useTranslation()

  return (
    <section className="relative py-24 md:py-32 text-center overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {floatingOrbs.map((orb, i) => (
          <motion.div
            key={i}
            className={`absolute ${orb.size} ${orb.position} rounded-full bg-gradient-radial ${orb.color} blur-3xl`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 8,
              delay: orb.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Badge */}
      <FadeIn delay={0}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 text-sm">
          <Sparkles className="w-4 h-4 text-accent-amber" />
          <span className="text-warm-300">{t('hero.badge')}</span>
        </div>
      </FadeIn>

      {/* Title */}
      <FadeIn delay={0.1}>
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
          <span className="gradient-text">{t('hero.title')}</span>
        </h2>
      </FadeIn>

      {/* Subtitle */}
      <FadeIn delay={0.2}>
        <p className="text-lg md:text-xl text-warm-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          {t('hero.subtitle')}
        </p>
      </FadeIn>

      {/* CTA Buttons */}
      <FadeIn delay={0.3}>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <motion.button
            onClick={onScrollToForm}
            className="group relative px-8 py-4 bg-gradient-to-r from-accent-blue to-accent-purple rounded-2xl font-semibold text-lg text-white shadow-glow-blue btn-premium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {t('hero.cta.start')}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
          </motion.button>
          <motion.a
            href="#how-it-works"
            className="px-8 py-4 rounded-2xl font-semibold text-lg glass-card hover:border-warm-500/40 text-warm-200 inline-flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {t('hero.cta.demo')}
          </motion.a>
        </div>
      </FadeIn>

      {/* Trust badges */}
      <FadeIn delay={0.4}>
        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {trustBadges.map((badge) => {
            const Icon = badge.icon
            return (
              <div key={badge.label} className="flex items-center gap-2 text-warm-500 text-sm">
                <Icon className="w-4 h-4 text-accent-blue" />
                <span>{t(badge.label)}</span>
              </div>
            )
          })}
        </div>
      </FadeIn>
    </section>
  )
}
