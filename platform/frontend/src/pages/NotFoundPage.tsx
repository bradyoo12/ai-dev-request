import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section className="text-center py-20">
      <div className="text-8xl mb-6 text-gray-600">404</div>
      <h2 className="text-3xl font-bold mb-4">{t('notFound.title')}</h2>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        {t('notFound.message')}
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
      >
        {t('notFound.backHome')}
      </button>
    </section>
  )
}
