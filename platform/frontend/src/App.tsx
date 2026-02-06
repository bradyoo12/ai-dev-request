import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import { createRequest, analyzeRequest, generateProposal, approveProposal, startBuild, InsufficientTokensError } from './api/requests'
import type { DevRequestResponse, AnalysisResponse, ProposalResponse, ProductionResponse } from './api/requests'
import { getTokenOverview, checkTokens } from './api/settings'
import type { TokenCheck } from './api/settings'
import { getStoredUser, isAuthenticated, logout } from './api/auth'
import type { AuthUser } from './api/auth'
import LanguageSelector from './components/LanguageSelector'
import SettingsPage from './pages/SettingsPage'
import UsagePage from './pages/UsagePage'
import MySitesPage from './pages/MySitesPage'
import PaymentHistoryPage from './pages/PaymentHistoryPage'
import BillingPage from './pages/BillingPage'
import LoginPage from './pages/LoginPage'

type ViewState = 'form' | 'submitting' | 'analyzing' | 'analyzed' | 'generatingProposal' | 'proposal' | 'approving' | 'building' | 'completed' | 'error'
type PageState = 'main' | 'settings' | 'sites'
type SettingsTab = 'tokens' | 'usage' | 'billing' | 'payments'

function App() {
  const { t, i18n } = useTranslation()
  const [authUser, setAuthUser] = useState<AuthUser | null>(getStoredUser())
  const [showLogin, setShowLogin] = useState(false)
  const [page, setPage] = useState<PageState>('main')
  const [request, setRequest] = useState('')
  const [email, setEmail] = useState('')
  const [viewState, setViewState] = useState<ViewState>('form')
  const [tokenBalance, setTokenBalance] = useState<number | null>(null)
  const [submittedRequest, setSubmittedRequest] = useState<DevRequestResponse | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [proposalResult, setProposalResult] = useState<ProposalResponse | null>(null)
  const [productionResult, setProductionResult] = useState<ProductionResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('tokens')
  const [insufficientDialog, setInsufficientDialog] = useState<{ required: number; balance: number; shortfall: number; action: string } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ action: string; tokenCheck: TokenCheck; onConfirm: () => void } | null>(null)

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user)
    setShowLogin(false)
    loadTokenBalance()
  }

  const handleLogout = () => {
    logout()
    setAuthUser(null)
    setTokenBalance(null)
    loadTokenBalance()
  }

  if (showLogin) {
    return <LoginPage onLogin={handleLogin} onSkip={() => setShowLogin(false)} />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!request.trim()) return

    setViewState('submitting')
    setErrorMessage('')

    try {
      const result = await createRequest({
        description: request,
        contactEmail: email || undefined,
      })
      setSubmittedRequest(result)

      setViewState('analyzing')
      const analysis = await analyzeRequest(result.id)
      setAnalysisResult(analysis)
      if (analysis.newBalance != null) setTokenBalance(analysis.newBalance)
      setViewState('analyzed')
    } catch (error) {
      if (error instanceof InsufficientTokensError) {
        setInsufficientDialog(error)
        setViewState('form')
        return
      }
      console.error('Failed to process request:', error)
      setErrorMessage(error instanceof Error ? error.message : t('error.requestFailed'))
      setViewState('error')
    }
  }

  const handleGenerateProposal = async () => {
    if (!submittedRequest) return

    try {
      const check = await checkTokens('proposal')
      if (!check.hasEnough) {
        setInsufficientDialog({ required: check.tokenCost, balance: check.currentBalance, shortfall: check.shortfall, action: 'proposal' })
        return
      }
      setConfirmDialog({
        action: 'proposal',
        tokenCheck: check,
        onConfirm: async () => {
          setConfirmDialog(null)
          setViewState('generatingProposal')
          try {
            const proposal = await generateProposal(submittedRequest.id)
            setProposalResult(proposal)
            if (proposal.newBalance != null) setTokenBalance(proposal.newBalance)
            setViewState('proposal')
          } catch (err) {
            if (err instanceof InsufficientTokensError) {
              setInsufficientDialog(err)
              setViewState('analyzed')
              return
            }
            console.error('Failed to generate proposal:', err)
            setErrorMessage(err instanceof Error ? err.message : t('error.proposalFailed'))
            setViewState('error')
          }
        }
      })
    } catch {
      setViewState('generatingProposal')
      try {
        const proposal = await generateProposal(submittedRequest.id)
        setProposalResult(proposal)
        if (proposal.newBalance != null) setTokenBalance(proposal.newBalance)
        setViewState('proposal')
      } catch (err) {
        console.error('Failed to generate proposal:', err)
        setErrorMessage(err instanceof Error ? err.message : t('error.proposalFailed'))
        setViewState('error')
      }
    }
  }

  const handleApproveAndBuild = async () => {
    if (!submittedRequest) return

    try {
      const check = await checkTokens('build')
      if (!check.hasEnough) {
        setInsufficientDialog({ required: check.tokenCost, balance: check.currentBalance, shortfall: check.shortfall, action: 'build' })
        return
      }
      setConfirmDialog({
        action: 'build',
        tokenCheck: check,
        onConfirm: async () => {
          setConfirmDialog(null)
          setViewState('approving')
          try {
            await approveProposal(submittedRequest.id)
            setViewState('building')
            const production = await startBuild(submittedRequest.id)
            setProductionResult(production)
            if (production.newBalance != null) setTokenBalance(production.newBalance)
            setViewState('completed')
          } catch (err) {
            if (err instanceof InsufficientTokensError) {
              setInsufficientDialog(err)
              setViewState('proposal')
              return
            }
            console.error('Failed to build:', err)
            setErrorMessage(err instanceof Error ? err.message : t('error.buildFailed'))
            setViewState('error')
          }
        }
      })
    } catch {
      setViewState('approving')
      try {
        await approveProposal(submittedRequest.id)
        setViewState('building')
        const production = await startBuild(submittedRequest.id)
        setProductionResult(production)
        if (production.newBalance != null) setTokenBalance(production.newBalance)
        setViewState('completed')
      } catch (err) {
        console.error('Failed to build:', err)
        setErrorMessage(err instanceof Error ? err.message : t('error.buildFailed'))
        setViewState('error')
      }
    }
  }

  const loadTokenBalance = useCallback(async () => {
    try {
      const overview = await getTokenOverview()
      setTokenBalance(overview.balance)
    } catch {
      // Silently fail - header balance is optional
    }
  }, [])

  useEffect(() => {
    loadTokenBalance()
  }, [loadTokenBalance])

  const handleReset = () => {
    setRequest('')
    setEmail('')
    setViewState('form')
    setPage('main')
    setSubmittedRequest(null)
    setAnalysisResult(null)
    setProposalResult(null)
    setProductionResult(null)
    setErrorMessage('')
  }

  const formatCurrency = (amount: number) => {
    const locale = i18n.language === 'ko' ? 'ko-KR' : 'en-US'
    const currency = i18n.language === 'ko' ? 'KRW' : 'USD'
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
  }

  const exampleRequests = [
    t('form.example.shopping'),
    t('form.example.automation'),
    t('form.example.dashboard'),
    t('form.example.chatbot'),
  ]

  const getComplexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'simple': return 'bg-green-600'
      case 'medium': return 'bg-yellow-600'
      case 'complex': return 'bg-orange-600'
      case 'enterprise': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const getComplexityLabel = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'simple': return t('complexity.simple')
      case 'medium': return t('complexity.medium')
      case 'complex': return t('complexity.complex')
      case 'enterprise': return t('complexity.enterprise')
      default: return complexity
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="p-6 border-b border-gray-700">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={handleReset}>
            🚀 AI Dev Request
          </h1>
          <div className="flex items-center gap-4">
            {tokenBalance !== null && (
              <button
                onClick={() => setPage('settings')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
              >
                <span className="text-yellow-400">&#9679;</span>
                <span>{t('settings.tokens.headerBalance', { count: tokenBalance })}</span>
              </button>
            )}
            <nav className="space-x-4">
              <button onClick={() => setPage('sites')} className="hover:text-blue-400">{t('header.mySites')}</button>
              <a href="#pricing" className="hover:text-blue-400">{t('header.pricing')}</a>
              <button onClick={() => setPage('settings')} className="hover:text-blue-400">{t('header.settings')}</button>
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
        {page === 'settings' && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setPage('main')}
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
        )}

        {page === 'sites' && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setPage('main')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                &larr;
              </button>
              <h2 className="text-2xl font-bold">{t('header.mySites')}</h2>
            </div>
            <MySitesPage />
          </section>
        )}

        {page === 'main' && viewState === 'form' && (
          <section className="text-center py-12">
            <h2 className="text-4xl font-bold mb-4">{t('hero.title')}</h2>
            <p className="text-xl text-gray-400 mb-8">{t('hero.subtitle')}</p>
          </section>
        )}

        {page === 'main' && <section className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          {viewState === 'form' && (
            <form onSubmit={handleSubmit}>
              <label className="block text-lg font-medium mb-4">{t('form.label')}</label>
              <textarea
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder={t('form.placeholder')}
                className="w-full h-40 p-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {exampleRequests.map((example) => (
                  <button key={example} type="button" onClick={() => setRequest(example)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm transition-colors">
                    {example}
                  </button>
                ))}
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2 text-gray-400">{t('form.emailLabel')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={!request.trim()}
                className="mt-6 w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-medium text-lg transition-colors">
                {t('form.submit')}
              </button>
            </form>
          )}

          {viewState === 'submitting' && (
            <div className="text-center py-12">
              <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"></div>
              <h3 className="text-2xl font-bold mb-2">{t('status.submitting')}</h3>
            </div>
          )}

          {viewState === 'analyzing' && (
            <div className="text-center py-12">
              <div className="animate-pulse"><div className="text-6xl mb-6">🤖</div></div>
              <h3 className="text-2xl font-bold mb-2">{t('status.analyzing')}</h3>
              <p className="text-gray-400">{t('status.analyzingDetail')}</p>
            </div>
          )}

          {viewState === 'analyzed' && analysisResult && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">✅</div>
                <div>
                  <h3 className="text-2xl font-bold">{t('status.analyzed')}</h3>
                  <p className="text-gray-400">{analysisResult.summary}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-900 rounded-xl p-4 text-center">
                  <div className="text-gray-400 text-sm mb-1">{t('analysis.category')}</div>
                  <div className="font-bold">{analysisResult.category}</div>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 text-center">
                  <div className="text-gray-400 text-sm mb-1">{t('analysis.complexity')}</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm ${getComplexityColor(analysisResult.complexity)}`}>
                    {getComplexityLabel(analysisResult.complexity)}
                  </div>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 text-center">
                  <div className="text-gray-400 text-sm mb-1">{t('analysis.estimatedDuration')}</div>
                  <div className="font-bold">{t('analysis.days', { count: analysisResult.estimatedDays })}</div>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 text-center">
                  <div className="text-gray-400 text-sm mb-1">{t('analysis.feasibility')}</div>
                  <div className="font-bold">{Math.round(analysisResult.feasibility.score * 100)}%</div>
                </div>
              </div>

              {analysisResult.tokensUsed != null && (
                <div className="bg-gray-900/50 rounded-lg p-3 mb-4 text-sm text-gray-400 text-center">
                  {t('tokens.used', { count: analysisResult.tokensUsed })} &bull; {t('tokens.remaining', { count: analysisResult.newBalance ?? 0 })}
                </div>
              )}

              <div className="flex gap-4">
                <button onClick={handleReset}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors">
                  {t('button.newRequest')}
                </button>
                <button onClick={handleGenerateProposal}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">
                  {t('button.getProposal')}
                </button>
              </div>
            </div>
          )}

          {viewState === 'generatingProposal' && (
            <div className="text-center py-12">
              <div className="animate-pulse"><div className="text-6xl mb-6">📝</div></div>
              <h3 className="text-2xl font-bold mb-2">{t('status.generatingProposal')}</h3>
              <p className="text-gray-400">{t('status.generatingProposalDetail')}</p>
            </div>
          )}

          {viewState === 'proposal' && proposalResult && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">📋</div>
                <div>
                  <h3 className="text-2xl font-bold">{proposalResult.proposal.title}</h3>
                  <p className="text-gray-400">{proposalResult.proposal.summary}</p>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl p-6 mb-6">
                <h4 className="font-bold mb-4 text-lg">{t('proposal.estimate')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-300 text-sm">{t('proposal.developmentCost')}</div>
                    <div className="text-3xl font-bold">{formatCurrency(proposalResult.proposal.pricing.development.amount)}</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-sm">{t('proposal.monthlyCost')}</div>
                    <div className="text-2xl font-bold">{formatCurrency(proposalResult.proposal.pricing.monthly.total)}</div>
                  </div>
                </div>
                {proposalResult.proposal.pricing.development.breakdown.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-700">
                    <div className="text-sm text-gray-300 mb-2">{t('proposal.breakdown')}</div>
                    {proposalResult.proposal.pricing.development.breakdown.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{item.item}</span>
                        <span>{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-gray-900 rounded-xl p-4 mb-4">
                <h4 className="font-bold mb-3">{t('proposal.timelineTotal', { days: proposalResult.proposal.timeline.totalDays })}</h4>
                <div className="space-y-2">
                  {proposalResult.proposal.milestones.map((milestone, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {milestone.phase}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{milestone.name}</div>
                        <div className="text-gray-400 text-sm">{milestone.description}</div>
                        <div className="text-blue-400 text-sm">{t('proposal.durationDays', { count: milestone.durationDays })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scope */}
              <div className="bg-gray-900 rounded-xl p-4 mb-4">
                <h4 className="font-bold mb-3">{t('proposal.includedScope')}</h4>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  {proposalResult.proposal.scope.included.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                {proposalResult.proposal.scope.excluded.length > 0 && (
                  <>
                    <h4 className="font-bold mt-4 mb-2 text-orange-400">{t('proposal.excludedScope')}</h4>
                    <ul className="list-disc list-inside text-gray-400 space-y-1">
                      {proposalResult.proposal.scope.excluded.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* Terms */}
              <div className="bg-gray-900 rounded-xl p-4 mb-6">
                <h4 className="font-bold mb-3">{t('proposal.terms')}</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-400">{t('proposal.termsPayment')}</span> {proposalResult.proposal.terms.payment}</div>
                  <div><span className="text-gray-400">{t('proposal.termsWarranty')}</span> {proposalResult.proposal.terms.warranty}</div>
                  <div><span className="text-gray-400">{t('proposal.termsSupport')}</span> {proposalResult.proposal.terms.support}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button onClick={handleReset}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors">
                  {t('button.newRequest')}
                </button>
                <button onClick={handleApproveAndBuild}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-medium transition-colors">
                  {t('button.approveAndBuild')}
                </button>
              </div>
            </div>
          )}

          {viewState === 'approving' && (
            <div className="text-center py-12">
              <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-6"></div>
              <h3 className="text-2xl font-bold mb-2">{t('status.approving')}</h3>
            </div>
          )}

          {viewState === 'building' && (
            <div className="text-center py-12">
              <div className="animate-pulse"><div className="text-6xl mb-6">🔨</div></div>
              <h3 className="text-2xl font-bold mb-2">{t('status.building')}</h3>
              <p className="text-gray-400">{t('status.buildingDetail')}</p>
              <div className="mt-6 flex justify-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}

          {viewState === 'completed' && productionResult && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">🎉</div>
                <div>
                  <h3 className="text-2xl font-bold">{t('status.completed')}</h3>
                  <p className="text-gray-400">{productionResult.production.message}</p>
                </div>
              </div>

              <div className="bg-green-900/30 border border-green-700 rounded-xl p-6 mb-6">
                <h4 className="font-bold mb-4 text-green-400">{t('completed.projectInfo')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">{t('completed.projectId')}</div>
                    <div className="font-mono">{productionResult.production.projectId}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">{t('completed.projectType')}</div>
                    <div>{productionResult.production.projectType}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">{t('completed.filesGenerated')}</div>
                    <div>{t('completed.filesCount', { count: productionResult.production.filesGenerated })}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">{t('completed.projectStatus')}</div>
                    <div className="text-green-400">{productionResult.production.status}</div>
                  </div>
                </div>
              </div>

              {productionResult.production.setupCommands.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 mb-4">
                  <h4 className="font-bold mb-3">{t('completed.setupCommands')}</h4>
                  <div className="bg-black rounded-lg p-3 font-mono text-sm overflow-x-auto">
                    {productionResult.production.setupCommands.map((cmd, i) => (
                      <div key={i} className="text-green-400">$ {cmd}</div>
                    ))}
                  </div>
                </div>
              )}

              {productionResult.production.envVariables.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 mb-6">
                  <h4 className="font-bold mb-3">{t('completed.envVariables')}</h4>
                  <div className="space-y-2">
                    {productionResult.production.envVariables.map((env, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <code className="bg-gray-800 px-2 py-1 rounded">{env.name}</code>
                        <span className="text-gray-400">{env.description}</span>
                        {env.required && <span className="text-red-400 text-xs">{t('completed.required')}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button onClick={handleReset}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors">
                  {t('button.newRequest')}
                </button>
                <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">
                  {t('button.downloadProject')}
                </button>
              </div>
            </div>
          )}

          {viewState === 'error' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-6">❌</div>
              <h3 className="text-2xl font-bold mb-4">{t('error.title')}</h3>
              <p className="text-red-400 mb-6">{errorMessage}</p>
              <button onClick={() => setViewState('form')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">
                {t('button.tryAgain')}
              </button>
            </div>
          )}
        </section>}

        {page === 'main' && viewState === 'form' && (
          <>
            <section className="py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="text-xl font-bold mb-2">{t('steps.request.title')}</h3>
                <p className="text-gray-400">{t('steps.request.description')}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="text-xl font-bold mb-2">{t('steps.analysis.title')}</h3>
                <p className="text-gray-400">{t('steps.analysis.description')}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="text-3xl mb-3">🤖</div>
                <h3 className="text-xl font-bold mb-2">{t('steps.build.title')}</h3>
                <p className="text-gray-400">{t('steps.build.description')}</p>
              </div>
            </section>

            <section id="pricing" className="py-12 text-center">
              <h3 className="text-2xl font-bold mb-6">{t('pricing.title')}</h3>
              <div className="flex justify-center gap-4 flex-wrap">
                <div className="bg-gray-800 p-6 rounded-xl w-64">
                  <div className="text-lg font-bold">Starter</div>
                  <div className="text-3xl font-bold my-2">₩49,000<span className="text-lg text-gray-400">{t('pricing.perMonth')}</span></div>
                  <div className="text-gray-400 text-sm">{t('pricing.starter.projects')}</div>
                </div>
                <div className="bg-blue-600 p-6 rounded-xl w-64 ring-2 ring-blue-400">
                  <div className="text-lg font-bold">Pro</div>
                  <div className="text-3xl font-bold my-2">₩149,000<span className="text-lg text-gray-200">{t('pricing.perMonth')}</span></div>
                  <div className="text-gray-200 text-sm">{t('pricing.pro.projects')}</div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-gray-700 p-6 text-center text-gray-500">
        <p>{t('footer.copyright')}</p>
      </footer>

      {/* Token Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">{t(`tokens.confirm.${confirmDialog.action}.title`)}</h3>
            <p className="text-gray-400 mb-4">{t(`tokens.confirm.${confirmDialog.action}.description`)}</p>
            <div className="bg-gray-900 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('tokens.confirm.cost')}</span>
                <span className="font-bold">{confirmDialog.tokenCheck.tokenCost} {t('settings.tokens.tokensUnit')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('tokens.confirm.balance')}</span>
                <span>{confirmDialog.tokenCheck.currentBalance} &rarr; {confirmDialog.tokenCheck.currentBalance - confirmDialog.tokenCheck.tokenCost} {t('settings.tokens.tokensUnit')}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                {t('tokens.confirm.cancel')}
              </button>
              <button onClick={confirmDialog.onConfirm}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
                {t(`tokens.confirm.${confirmDialog.action}.button`)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Tokens Dialog */}
      {insufficientDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-orange-400">{t('tokens.insufficient.title')}</h3>
            <p className="text-gray-400 mb-4">
              {t(`tokens.confirm.${insufficientDialog.action}.title`)} {t('tokens.insufficient.requires', { count: insufficientDialog.required })}
            </p>
            <div className="bg-gray-900 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('tokens.insufficient.yourBalance')}</span>
                <span className="font-bold">{insufficientDialog.balance} {t('settings.tokens.tokensUnit')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('tokens.insufficient.needed')}</span>
                <span className="text-orange-400 font-bold">+{insufficientDialog.shortfall} {t('settings.tokens.tokensUnit')}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setInsufficientDialog(null)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                {t('tokens.confirm.cancel')}
              </button>
              <button onClick={() => { setInsufficientDialog(null); setPage('settings') }}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors">
                {t('settings.tokens.buyTokens')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
