import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import SuggestionBoardPage from './SuggestionBoardPage'
import { useAuth } from '../contexts/AuthContext'

export default function SuggestionsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setTokenBalance } = useAuth()

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          &larr;
        </button>
        <h2 className="text-2xl font-bold">{t('header.suggestions')}</h2>
      </div>
      <SuggestionBoardPage onBalanceChange={(b) => setTokenBalance(b)} />
    </section>
  )
}
