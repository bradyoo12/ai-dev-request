import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'

export default function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    document.title = `404 - ${t('notFound.title')} | AI Dev Request`
  }, [t])

  return (
    <section className="text-center py-20" role="alert" aria-label="Page not found">
      <div className="text-8xl md:text-9xl font-extrabold mb-6 gradient-text select-none">404</div>
      <h2 className="text-3xl font-bold mb-4">{t('notFound.title')}</h2>
      <p className="text-warm-400 mb-2 max-w-md mx-auto">
        {t('notFound.message')}
      </p>
      <p className="text-warm-500 text-sm mb-8 font-mono max-w-md mx-auto truncate">
        {location.pathname}
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl font-medium transition-all hover:shadow-glow-blue hover:scale-[1.02]"
      >
        {t('notFound.backHome')}
      </button>
    </section>
  )
}
