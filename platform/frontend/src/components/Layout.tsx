import { useState } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, Sparkles } from 'lucide-react'
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
      <button onClick={() => navigateProtected('/sites')} className="text-warm-400 hover:text-white transition-colors text-left">{t('header.mySites')}</button>
      <button onClick={() => navigateProtected('/suggestions')} className="text-warm-400 hover:text-white transition-colors text-left">{t('header.suggestions')}</button>
      <button onClick={() => navigateProtected('/recommendations')} className="text-warm-400 hover:text-accent-purple transition-colors text-left">{t('header.recommendations')}</button>
      <button onClick={() => navigateProtected('/project-health')} className="text-warm-400 hover:text-accent-emerald transition-colors text-left">{t('header.projectHealth')}</button>
      <button onClick={() => navigateProtected('/teams')} className="text-warm-400 hover:text-accent-cyan transition-colors text-left">{t('header.teams')}</button>
      <button onClick={() => navigateProtected('/whitelabel')} className="text-warm-400 hover:text-accent-amber transition-colors text-left">{t('header.whitelabel')}</button>
      {authUser?.isAdmin && (
        <button onClick={() => navigateProtected('/admin/churn')} className="text-warm-400 hover:text-white transition-colors text-left">{t('header.adminChurn')}</button>
      )}
      <Link to="/#pricing" onClick={() => setMobileMenuOpen(false)} className="text-warm-400 hover:text-white transition-colors">{t('header.pricing')}</Link>
      <button onClick={() => navigateProtected('/settings')} className="text-warm-400 hover:text-white transition-colors text-left">{t('header.settings')}</button>
      <a href="mailto:support@aidevrequest.com" className="text-warm-400 hover:text-white transition-colors">{t('header.contact')}</a>
    </>
  )

  return (
    <div className="min-h-screen bg-warm-950 text-warm-50">
      {/* Premium gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-warm-950 via-warm-900/50 to-warm-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-accent-blue/5 to-transparent blur-3xl" />
      </div>

      {/* Glassmorphism header */}
      <header className="sticky top-0 z-50 glass-heavy">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <h1
            className="text-xl md:text-2xl font-bold cursor-pointer flex items-center gap-2 group"
            onClick={() => navigate('/')}
          >
            <Sparkles className="w-5 h-5 text-accent-blue group-hover:text-accent-purple transition-colors" />
            <span className="gradient-text">AI Dev Request</span>
          </h1>
          <div className="flex items-center gap-2 md:gap-4">
            {tokenBalance !== null && (
              <button
                onClick={() => navigateProtected('/settings')}
                className="flex items-center gap-1.5 px-3 py-1.5 glass-card rounded-xl text-xs md:text-sm transition-all hover:shadow-premium-sm"
              >
                <span className="text-accent-amber">&#9679;</span>
                <span className="hidden sm:inline text-warm-300">{t('settings.tokens.headerBalance', { count: tokenBalance })}</span>
                <span className="sm:hidden text-warm-300">{tokenBalance}</span>
              </button>
            )}
            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center space-x-4 text-sm">
              {navItems}
            </nav>
            <LanguageSelector />
            {authUser ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-warm-400">{authUser.displayName || authUser.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-warm-500 hover:text-white transition-colors"
                >
                  {t('auth.logout')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-1.5 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl text-sm font-medium transition-all hover:shadow-glow-blue hover:scale-[1.02]"
              >
                {t('auth.login')}
              </button>
            )}
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-warm-800/50 rounded-xl transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <nav className="lg:hidden mx-4 mb-4 p-4 glass rounded-2xl flex flex-col gap-3 text-sm">
            {navItems}
            {authUser && (
              <div className="pt-3 border-t border-warm-700/30 flex items-center justify-between">
                <span className="text-sm text-warm-400">{authUser.displayName || authUser.email}</span>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                  className="text-sm text-warm-500 hover:text-white transition-colors"
                >
                  {t('auth.logout')}
                </button>
              </div>
            )}
          </nav>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <Outlet />
      </main>

      <FooterSection />
    </div>
  )
}
