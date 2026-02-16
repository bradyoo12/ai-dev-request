import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

const featureVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.3 + i * 0.08, duration: 0.3 },
  }),
}

export default function ModeSelectionPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const standardFeatures = [
    t('modeSelection.standard.feature1'),
    t('modeSelection.standard.feature2'),
    t('modeSelection.standard.feature3'),
    t('modeSelection.standard.feature4'),
  ]

  const proFeatures = [
    t('modeSelection.pro.feature1'),
    t('modeSelection.pro.feature2'),
    t('modeSelection.pro.feature3'),
    t('modeSelection.pro.feature4'),
  ]

  return (
    <section className="py-12 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
          {t('modeSelection.title')}
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
        {/* Standard Mode Card */}
        <motion.div
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.02, y: -4 }}
          className="glass-card rounded-2xl p-6 sm:p-8 border border-accent-blue/20 hover:border-accent-blue/50 transition-colors cursor-pointer group"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              navigate('/')
            }
          }}
          aria-label={`${t('modeSelection.standard.title')} - ${t('modeSelection.standard.description')}`}
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-blue/5 mb-4">
              <svg className="w-8 h-8 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('modeSelection.standard.title')}</h2>
            <p className="text-warm-400 text-sm">{t('modeSelection.standard.description')}</p>
          </div>

          <ul className="space-y-3 mb-8">
            {standardFeatures.map((feature, i) => (
              <motion.li
                key={i}
                custom={i}
                variants={featureVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-3 text-warm-300"
              >
                <div className="w-5 h-5 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">{feature}</span>
              </motion.li>
            ))}
          </ul>

          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate('/')
            }}
            className="w-full py-3 bg-gradient-to-r from-accent-blue to-accent-purple hover:shadow-glow-blue rounded-xl font-semibold text-lg transition-all btn-premium"
          >
            {t('modeSelection.standard.cta')}
          </button>
        </motion.div>

        {/* Pro Mode Card */}
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.02, y: -4 }}
          className="glass-card rounded-2xl p-6 sm:p-8 border border-accent-purple/20 hover:border-accent-purple/50 transition-colors relative overflow-hidden"
          aria-label={`${t('modeSelection.pro.title')} - ${t('modeSelection.pro.description')}`}
        >
          {/* Coming Soon badge */}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-accent-purple/20 text-accent-purple border border-accent-purple/30 rounded-full text-xs font-medium">
              {t('modeSelection.pro.comingSoon')}
            </span>
          </div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-purple/5 mb-4">
              <svg className="w-8 h-8 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('modeSelection.pro.title')}</h2>
            <p className="text-warm-400 text-sm">{t('modeSelection.pro.description')}</p>
          </div>

          <ul className="space-y-3 mb-8">
            {proFeatures.map((feature, i) => (
              <motion.li
                key={i}
                custom={i}
                variants={featureVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-3 text-warm-400"
              >
                <div className="w-5 h-5 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">{feature}</span>
              </motion.li>
            ))}
          </ul>

          <button
            disabled
            className="w-full py-3 bg-warm-700 text-warm-400 rounded-xl font-semibold text-lg cursor-not-allowed opacity-60"
          >
            {t('modeSelection.pro.cta')}
          </button>
        </motion.div>
      </div>
    </section>
  )
}
