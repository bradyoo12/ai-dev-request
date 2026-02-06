import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { register, login } from '../api/auth'
import type { AuthUser } from '../api/auth'

interface LoginPageProps {
  onLogin: (user: AuthUser) => void
  onSkip: () => void
}

export default function LoginPage({ onLogin, onSkip }: LoginPageProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError(t('auth.error.fieldsRequired'))
      return
    }

    if (password.length < 8) {
      setError(t('auth.error.passwordTooShort'))
      return
    }

    setLoading(true)
    try {
      if (mode === 'register') {
        const result = await register(email, password, displayName || undefined)
        onLogin(result.user)
      } else {
        const result = await login(email, password)
        onLogin(result.user)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error.unknown'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Dev Request</h1>
          <p className="text-gray-400">{t('auth.subtitle')}</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          <div className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1">
            <button
              onClick={() => { setMode('login'); setError('') }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'login' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('auth.login')}
            </button>
            <button
              onClick={() => { setMode('register'); setError('') }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'register' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('auth.register')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{t('auth.displayName')}</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('auth.displayNamePlaceholder')}
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
            >
              {loading
                ? t('auth.processing')
                : mode === 'login'
                  ? t('auth.loginButton')
                  : t('auth.registerButton')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onSkip}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              {t('auth.skipLogin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
