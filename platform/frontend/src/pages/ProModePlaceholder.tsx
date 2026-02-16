import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function ProModePlaceholder() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section className="py-16 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card rounded-2xl p-8 sm:p-12 max-w-2xl mx-auto text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-purple/5 mb-6"
        >
          <svg className="w-10 h-10 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          </svg>
        </motion.div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
          {t('proMode.comingSoon.title')}
        </h1>

        <p className="text-warm-400 text-base sm:text-lg mb-8 max-w-md mx-auto leading-relaxed">
          {t('proMode.comingSoon.description')}
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/mode-select')}
          className="px-8 py-3 bg-warm-800 hover:bg-warm-700 border border-warm-700/30 rounded-xl font-medium transition-colors"
        >
          {t('proMode.comingSoon.back')}
        </motion.button>
      </motion.div>
    </section>
  )
}
