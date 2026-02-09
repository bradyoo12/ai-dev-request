import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import LanguageSelector from './LanguageSelector'
import LoginPage from '../pages/LoginPage'
import FooterSection from './FooterSection'

export default function Layout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { authUser, tokenBalance, showLogin, setShowLogin, handleLogin, handleLogout, requireAuth } = useAuth()

  const navigateProtected = (path: string) => {
    if (requireAuth()) {
      navigate(path)
    }
  }

  if (showLogin) {
    return <LoginPage onLogin={handleLogin} onSkip={() => setShowLogin(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="p-6 border-b border-gray-700">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>
            🚀 AI Dev Request
          </h1>
          <div className="flex items-center gap-4">
            {tokenBalance !== null && (
              <button
                onClick={() => navigateProtected('/settings')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
              >
                <span className="text-yellow-400">&#9679;</span>
                <span>{t('settings.tokens.headerBalance', { count: tokenBalance })}</span>
              </button>
            )}
            <nav className="space-x-4">
              <button onClick={() => navigateProtected('/sites')} className="hover:text-blue-400">{t('header.mySites')}</button>
              <button onClick={() => navigateProtected('/suggestions')} className="hover:text-blue-400">{t('header.suggestions')}</button>
              <button onClick={() => navigateProtected('/recommendations')} className="hover:text-purple-400">{t('header.recommendations')}</button>
              {authUser?.isAdmin && (
                <button onClick={() => navigateProtected('/admin/churn')} className="hover:text-blue-400">{t('header.adminChurn')}</button>
              )}
              <Link to="/#pricing" className="hover:text-blue-400">{t('header.pricing')}</Link>
              <button onClick={() => navigateProtected('/settings')} className="hover:text-blue-400">{t('header.settings')}</button>
              <a href="#" className="hover:text-blue-400">{t('header.contact')}</a>
            </nav>
            <LanguageSelector />
            {authUser ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">{authUser.displayName || authUser.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('auth.logout')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                {t('auth.login')}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <Outlet />
      </main>

      <FooterSection />
    </div>
  )
}
