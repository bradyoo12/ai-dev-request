import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import MySitesPage from './MySitesPage'

export default function SitesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-warm-400 hover:text-white transition-colors"
        >
          &larr;
        </button>
        <h2 className="text-2xl font-bold">{t('header.mySites')}</h2>
      </div>
      <MySitesPage />
    </section>
  )
}
