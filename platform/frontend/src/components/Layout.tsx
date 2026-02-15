import { useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, Sparkles } from 'lucide-react'
import LanguageSelector from './LanguageSelector'
import LoginPage from '../pages/LoginPage'
import FooterSection from './FooterSection'

export default function Layout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
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

  // --- Navigation item styling (standardized hover colors, mobile touch targets) ---
  const navLinkClass = 'text-warm-400 hover:text-white transition-colors text-left min-h-[44px] flex items-center lg:min-h-0 lg:inline'

  const currentPath = location.pathname

  // --- Public nav items (shown to unauthenticated users) ---
  const publicDesktopNav = (
    <>
      <Link to="/templates" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>{t('header.templates')}</Link>
      <Link to="/#pricing" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>{t('header.pricing')}</Link>
      <Link to="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>{t('header.howItWorks')}</Link>
      <Link to="/support" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>{t('header.support')}</Link>
      <a href="mailto:support@aidevrequest.com" className={navLinkClass}>{t('header.contact')}</a>
    </>
  )

  const publicMobileNav = (
    <>
      <Link to="/templates" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>{t('header.templates')}</Link>
      <Link to="/#pricing" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>{t('header.pricing')}</Link>
      <Link to="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>{t('header.howItWorks')}</Link>
      <Link to="/support" onClick={() => setMobileMenuOpen(false)} className={navLinkClass}>{t('header.support')}</Link>
      <a href="mailto:support@aidevrequest.com" className={navLinkClass}>{t('header.contact')}</a>
    </>
  )

  // --- Authenticated nav items (simplified to 5 essential items) ---
  const authNav = (
    <>
      <button onClick={() => navigateProtected('/projects')} className={navLinkClass} aria-current={currentPath.startsWith('/projects') ? 'page' : undefined}>{t('header.projects')}</button>
      <button onClick={() => navigateProtected('/sites')} className={navLinkClass} aria-current={currentPath === '/sites' ? 'page' : undefined}>{t('header.mySites')}</button>
      <Link to="/templates" onClick={() => setMobileMenuOpen(false)} className={navLinkClass} aria-current={currentPath === '/templates' ? 'page' : undefined}>{t('header.templates')}</Link>
      <button onClick={() => navigateProtected('/settings')} className={navLinkClass} aria-current={currentPath.startsWith('/settings') ? 'page' : undefined}>{t('header.settings')}</button>
      <button onClick={() => navigateProtected('/settings/billing')} className={navLinkClass} aria-current={currentPath === '/settings/billing' ? 'page' : undefined}>{t('header.billing')}</button>
    </>
  )

  return (
    <div className="min-h-screen bg-warm-950 text-warm-50">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent-blue focus:text-white focus:rounded-lg focus:outline-none"
      >
        {t('header.skipToContent', 'Skip to content')}
      </a>

      {/* Premium gradient background */}
      <div className="fixed inset-0 -z-10" aria-hidden="true">
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
            <Sparkles className="w-5 h-5 text-accent-blue group-hover:text-accent-purple transition-colors" aria-hidden="true" />
            <span className="gradient-text">AI Dev Request</span>
          </h1>
          <div className="flex items-center gap-2 md:gap-4">
            {tokenBalance !== null && (
              <button
                onClick={() => navigateProtected('/settings')}
                className="flex items-center gap-1.5 px-3 py-1.5 glass-card rounded-xl text-xs md:text-sm transition-all hover:shadow-premium-sm"
                aria-label={t('settings.tokens.headerBalance', { count: tokenBalance })}
              >
                <span className="text-accent-amber" aria-hidden="true">&#9679;</span>
                <span className="hidden sm:inline text-warm-300">{t('settings.tokens.headerBalance', { count: tokenBalance })}</span>
                <span className="sm:hidden text-warm-300">{tokenBalance}</span>
              </button>
            )}
            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center space-x-4 text-sm" aria-label={t('header.mainNavigation', 'Main navigation')}>
              {authUser ? (
                authNav
              ) : (
                publicDesktopNav
              )}
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
              className="lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-warm-800/50 rounded-xl transition-colors"
              aria-label={mobileMenuOpen ? t('header.closeMenu', 'Close menu') : t('header.openMenu', 'Open menu')}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <nav className="lg:hidden mx-4 mb-4 p-4 glass rounded-2xl flex flex-col gap-3 text-sm" aria-label={t('header.mobileNavigation', 'Mobile navigation')}>
            {authUser ? (
              authNav
            ) : (
              publicMobileNav
            )}
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

      <main id="main-content" className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <Outlet />
      </main>

      <FooterSection />
    </div>
  )
}
