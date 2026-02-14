import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { register, login, getProviders, getAuthUrl, getOAuthCallbackUrl } from '../api/auth'
import type { AuthUser, SocialProvider } from '../api/auth'

interface LoginPageProps {
  onLogin: (user: AuthUser) => void
  onSkip: () => void
}

const providerConfig: Record<SocialProvider, { icon: string; label: string; bg: string; hover: string }> = {
  google: { icon: 'G', label: 'Google', bg: 'bg-white text-warm-800', hover: 'hover:bg-warm-100' },
  apple: { icon: '\uF8FF', label: 'Apple', bg: 'bg-black text-white', hover: 'hover:bg-warm-900' },
  kakao: { icon: '\uD83D\uDCAC', label: 'Kakao', bg: 'bg-[#FEE500] text-[#191919]', hover: 'hover:bg-[#F5DC00]' },
  line: { icon: '\uD83D\uDCAC', label: 'LINE', bg: 'bg-[#06C755] text-white', hover: 'hover:bg-[#05B34C]' },
}

export default function LoginPage({ onLogin, onSkip }: LoginPageProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null)
  const [providers, setProviders] = useState<SocialProvider[]>([])

  useEffect(() => {
    getProviders().then(setProviders)
  }, [])

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

  const handleSocialLogin = async (provider: SocialProvider) => {
    setSocialLoading(provider)
    setError('')
    try {
      const redirectUri = getOAuthCallbackUrl(provider)
      const url = await getAuthUrl(provider, redirectUri)
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error.unknown'))
      setSocialLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-warm-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 gradient-text">AI Dev Request</h1>
          <p className="text-warm-400">{t('auth.subtitle')}</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            {providers.map((provider) => {
              const config = providerConfig[provider]
              return (
                <button
                  key={provider}
                  onClick={() => handleSocialLogin(provider)}
                  disabled={socialLoading !== null}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-3 ${config.bg} ${config.hover} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="text-lg">{config.icon}</span>
                  <span>
                    {socialLoading === provider
                      ? t('auth.processing')
                      : t('auth.continueWith', { provider: config.label })}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-warm-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[oklch(0.18_0.008_75/0.7)] text-warm-500">{t('auth.orContinueWith')}</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <div className="flex gap-1 mb-4 bg-warm-900 rounded-lg p-1">
            <button
              onClick={() => { setMode('login'); setError('') }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'login' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
              }`}
            >
              {t('auth.login')}
            </button>
            <button
              onClick={() => { setMode('register'); setError('') }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'register' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
              }`}
            >
              {t('auth.register')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-warm-400 mb-1">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full p-3 bg-warm-900 border border-warm-700/50 rounded-xl text-white placeholder-warm-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-400 mb-1">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full p-3 bg-warm-900 border border-warm-700/50 rounded-xl text-white placeholder-warm-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-warm-400 mb-1">{t('auth.displayName')}</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('auth.displayNamePlaceholder')}
                  className="w-full p-3 bg-warm-900 border border-warm-700/50 rounded-xl text-white placeholder-warm-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
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
              className="w-full py-3 bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue/90 hover:to-accent-purple/90 disabled:from-warm-600 disabled:to-warm-600 disabled:cursor-not-allowed rounded-xl font-medium transition-all btn-premium"
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
              className="text-sm text-warm-500 hover:text-warm-300 transition-colors"
            >
              {t('auth.skipLogin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
