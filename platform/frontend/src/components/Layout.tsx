import { useState } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X } from 'lucide-react'
import LanguageSelector from './LanguageSelector'
import LoginPage from '../pages/LoginPage'
import FooterSection from './FooterSection'

export default function Layout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { authUser, tokenBalance, showLogin, setShowLogin, handleLogin, handleLogout, requireAuth } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigateProtected = (path: string) => {
    setMobileMenuOpen(false)
    if (requireAuth()) {
      navigate(path)
    }
  }

  if (showLogin) {
    return <LoginPage onLogin={handleLogin} onSkip={() => setShowLogin(false)} />
  }

  const navItems = (
    <>
      <button onClick={() => navigateProtected('/sites')} className="hover:text-blue-400 text-left">{t('header.mySites')}</button>
      <button onClick={() => navigateProtected('/suggestions')} className="hover:text-blue-400 text-left">{t('header.suggestions')}</button>
      <button onClick={() => navigateProtected('/recommendations')} className="hover:text-purple-400 text-left">{t('header.recommendations')}</button>
      <button onClick={() => navigateProtected('/project-health')} className="hover:text-green-400 text-left">{t('header.projectHealth')}</button>
      <button onClick={() => navigateProtected('/teams')} className="hover:text-cyan-400 text-left">{t('header.teams')}</button>
      <button onClick={() => navigateProtected('/whitelabel')} className="hover:text-orange-400 text-left">{t('header.whitelabel')}</button>
      {authUser?.isAdmin && (
        <button onClick={() => navigateProtected('/admin/churn')} className="hover:text-blue-400 text-left">{t('header.adminChurn')}</button>
      )}
      <Link to="/#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-400">{t('header.pricing')}</Link>
      <button onClick={() => navigateProtected('/settings')} className="hover:text-blue-400 text-left">{t('header.settings')}</button>
      <a href="mailto:support@aidevrequest.com" className="hover:text-blue-400">{t('header.contact')}</a>
    </>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="p-4 md:p-6 border-b border-gray-700">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>
            🚀 AI Dev Request
          </h1>
          <div className="flex items-center gap-2 md:gap-4">
            {tokenBalance !== null && (
              <button
                onClick={() => navigateProtected('/settings')}
                className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs md:text-sm transition-colors"
              >
                <span className="text-yellow-400">&#9679;</span>
                <span className="hidden sm:inline">{t('settings.tokens.headerBalance', { count: tokenBalance })}</span>
                <span className="sm:hidden">{tokenBalance}</span>
              </button>
            )}
            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center space-x-4 text-sm">
              {navItems}
            </nav>
            <LanguageSelector />
            {authUser ? (
              <div className="hidden md:flex items-center gap-2">
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
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <nav className="lg:hidden mt-4 pt-4 border-t border-gray-700 flex flex-col gap-3 text-sm">
            {navItems}
            {authUser && (
              <div className="pt-3 border-t border-gray-700 flex items-center justify-between">
                <span className="text-sm text-gray-300">{authUser.displayName || authUser.email}</span>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('auth.logout')}
                </button>
              </div>
            )}
          </nav>
        )}
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <Outlet />
      </main>

      <FooterSection />
    </div>
  )
}
