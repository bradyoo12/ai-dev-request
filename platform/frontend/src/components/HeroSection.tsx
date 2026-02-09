import { useTranslation } from 'react-i18next'

interface HeroSectionProps {
  onScrollToForm: () => void
}

export default function HeroSection({ onScrollToForm }: HeroSectionProps) {
  const { t } = useTranslation()

  return (
    <section className="relative py-20 text-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/20 to-cyan-900/30" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
        {t('hero.title')}
      </h2>
      <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">
        {t('hero.subtitle')}
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={onScrollToForm}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium text-lg transition-all hover:scale-105 shadow-lg shadow-blue-600/25"
        >
          {t('hero.cta.start')}
        </button>
        <a
          href="#how-it-works"
          className="px-8 py-4 border border-gray-600 hover:border-gray-400 rounded-xl font-medium text-lg transition-all hover:bg-white/5"
        >
          {t('hero.cta.demo')}
        </a>
      </div>
    </section>
  )
}
