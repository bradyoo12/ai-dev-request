import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import SettingsPage from './SettingsPage'
import UsagePage from './UsagePage'
import BillingPage from './BillingPage'
import PaymentHistoryPage from './PaymentHistoryPage'
import { useAuth } from '../contexts/AuthContext'

type SettingsTab = 'tokens' | 'usage' | 'billing' | 'payments'

export default function SettingsLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setTokenBalance } = useAuth()
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('tokens')

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          &larr;
        </button>
        <h2 className="text-2xl font-bold">{t('settings.title')}</h2>
      </div>
      <div className="flex gap-1 mb-6 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setSettingsTab('tokens')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'tokens' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.tokens')}
        </button>
        <button
          onClick={() => setSettingsTab('usage')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'usage' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.usage')}
        </button>
        <button
          onClick={() => setSettingsTab('billing')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'billing' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.billing')}
        </button>
        <button
          onClick={() => setSettingsTab('payments')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'payments' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.payments')}
        </button>
      </div>
      {settingsTab === 'tokens' && <SettingsPage onBalanceChange={(b) => setTokenBalance(b)} />}
      {settingsTab === 'usage' && <UsagePage />}
      {settingsTab === 'billing' && <BillingPage />}
      {settingsTab === 'payments' && <PaymentHistoryPage />}
    </section>
  )
}
