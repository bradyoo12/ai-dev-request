import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  analyzeOAuthScopes,
  getOAuthReport,
  generateComplianceDocs,
  getComplianceDocs,
  getOAuthScopes,
  type OAuthComplianceReportResponse,
  type OAuthScopeDetail,
  type ComplianceDocumentation,
  type DetectedOAuthScope,
  type OAuthScopeRecommendation,
} from '../api/oauth-compliance'

type Tab = 'scopes' | 'recommendations' | 'docs'

export default function OAuthCompliancePage() {
  const { t } = useTranslation()
  const { authUser } = useAuth()
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get('requestId') || ''

  const [activeTab, setActiveTab] = useState<Tab>('scopes')
  const [report, setReport] = useState<OAuthComplianceReportResponse | null>(null)
  const [scopes, setScopes] = useState<OAuthScopeDetail[]>([])
  const [detectedScopes, setDetectedScopes] = useState<DetectedOAuthScope[]>([])
  const [recommendations, setRecommendations] = useState<OAuthScopeRecommendation[]>([])
  const [complianceDocs, setComplianceDocs] = useState<ComplianceDocumentation | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [generatingDocs, setGeneratingDocs] = useState(false)
  const [error, setError] = useState('')
  const [activeDocTab, setActiveDocTab] = useState<'privacy' | 'usage' | 'justifications' | 'provider'>('privacy')

  useEffect(() => {
    if (requestId) loadExistingData()
  }, [requestId])

  async function loadExistingData() {
    setLoading(true)
    try {
      const [reportData, scopeData, docsData] = await Promise.all([
        getOAuthReport(requestId),
        getOAuthScopes(requestId),
        getComplianceDocs(requestId),
      ])
      if (reportData) {
        setReport(reportData)
        try {
          setDetectedScopes(JSON.parse(reportData.scopesAnalyzedJson))
        } catch { setDetectedScopes([]) }
        try {
          setRecommendations(JSON.parse(reportData.recommendationsJson))
        } catch { setRecommendations([]) }
      }
      setScopes(scopeData)
      setComplianceDocs(docsData)
    } catch {
      // No existing data
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyze() {
    if (!requestId) {
      setError(t('oauth.noProject', 'No project selected. Please provide a requestId.'))
      return
    }
    setAnalyzing(true)
    setError('')
    try {
      await analyzeOAuthScopes(requestId)
      await loadExistingData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleGenerateDocs() {
    if (!requestId) return
    setGeneratingDocs(true)
    setError('')
    try {
      await generateComplianceDocs(requestId)
      await loadExistingData()
      setActiveTab('docs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Doc generation failed')
    } finally {
      setGeneratingDocs(false)
    }
  }

  function handleExportMarkdown(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function providerColor(provider: string) {
    switch (provider.toLowerCase()) {
      case 'google': return 'text-blue-400 bg-blue-900/40'
      case 'apple': return 'text-gray-200 bg-gray-700'
      case 'github': return 'text-purple-400 bg-purple-900/40'
      case 'facebook': return 'text-sky-400 bg-sky-900/40'
      case 'microsoft': return 'text-teal-400 bg-teal-900/40'
      default: return 'text-gray-400 bg-gray-700'
    }
  }

  if (!authUser) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-2">{t('oauth.title', 'OAuth Compliance')}</h2>
        <p className="text-gray-400">{t('oauth.loginRequired', 'Please log in to view OAuth compliance data.')}</p>
      </div>
    )
  }

  if (!requestId) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-2">{t('oauth.title', 'OAuth Compliance')}</h2>
        <p className="text-gray-400">{t('oauth.noProject', 'No project selected. Go to your project and run an OAuth analysis.')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{t('oauth.title', 'OAuth Compliance')}</h2>
          <p className="text-sm text-gray-400 mt-1">{t('oauth.description', 'OAuth scope analysis, minimization, and compliance documentation')}</p>
        </div>
        <div className="flex gap-2">
          {report && report.status === 'analyzed' && (
            <button
              onClick={handleGenerateDocs}
              disabled={generatingDocs}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {generatingDocs ? t('oauth.generating', 'Generating...') : t('oauth.generateDocs', 'Generate Docs')}
            </button>
          )}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            {analyzing ? t('oauth.analyzing', 'Analyzing...') : t('oauth.analyze', 'Analyze Scopes')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{report.totalScopesDetected}</div>
            <div className="text-xs text-gray-400 mt-1">{t('oauth.totalScopes', 'Total Scopes')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{report.overPermissionedCount}</div>
            <div className="text-xs text-gray-400 mt-1">{t('oauth.overPermissioned', 'Over-Permissioned')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{report.totalScopesDetected - report.overPermissionedCount}</div>
            <div className="text-xs text-gray-400 mt-1">{t('oauth.minimal', 'Minimal')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {new Set(detectedScopes.map(s => s.provider)).size}
            </div>
            <div className="text-xs text-gray-400 mt-1">{t('oauth.providers', 'Providers')}</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
        {(['scopes', 'recommendations', 'docs'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'scopes' && `${t('oauth.tab.scopes', 'Scopes')} (${scopes.length})`}
            {tab === 'recommendations' && `${t('oauth.tab.recommendations', 'Recommendations')} (${recommendations.length})`}
            {tab === 'docs' && t('oauth.tab.docs', 'Compliance Docs')}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-400">{t('oauth.loading', 'Loading...')}</div>
      )}

      {/* Scopes Tab */}
      {!loading && activeTab === 'scopes' && (
        <div className="space-y-3">
          {scopes.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400">{t('oauth.noScopes', 'No OAuth scopes detected. Run an analysis to scan your project.')}</p>
            </div>
          ) : (
            scopes.map((scope, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${providerColor(scope.provider)}`}>
                        {scope.provider}
                      </span>
                      {scope.isOverPermissioned && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-orange-400 bg-orange-900/40">
                          {t('oauth.overPermissionedBadge', 'Over-Permissioned')}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-white font-mono">{scope.scope}</h4>
                    <p className="text-xs text-gray-400 mt-1">{scope.description}</p>
                    {scope.justification && (
                      <p className="text-xs mt-1">
                        <span className="text-gray-500">{t('oauth.justification', 'Justification')}:</span>{' '}
                        <span className="text-gray-300">{scope.justification}</span>
                      </p>
                    )}
                    {scope.minimalAlternative && (
                      <p className="text-xs mt-1">
                        <span className="text-gray-500">{t('oauth.alternative', 'Suggested')}:</span>{' '}
                        <span className="text-green-400 font-mono">{scope.minimalAlternative}</span>
                      </p>
                    )}
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300 shrink-0">
                    {scope.detectedInFile}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {!loading && activeTab === 'recommendations' && (
        <div className="space-y-3">
          {recommendations.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400">
                {report
                  ? t('oauth.noRecommendations', 'No recommendations. All scopes appear minimal!')
                  : t('oauth.noAnalysis', 'No analysis results. Run an OAuth scope analysis first.')}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-4">
                <p className="text-sm text-orange-300">
                  {t('oauth.recommendationsSummary', '{count} scope(s) can be minimized for better security and compliance.').replace('{count}', String(recommendations.length))}
                </p>
              </div>
              {recommendations.map((rec, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                      rec.severity === 'warning' ? 'bg-orange-400' : 'bg-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${providerColor(rec.provider)}`}>
                          {rec.provider}
                        </span>
                      </div>
                      <div className="text-sm text-white">
                        <span className="font-mono text-red-400 line-through">{rec.currentScope}</span>
                        {rec.recommendedScope && (
                          <>
                            <span className="text-gray-500 mx-2">-&gt;</span>
                            <span className="font-mono text-green-400">{rec.recommendedScope}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{rec.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Docs Tab */}
      {!loading && activeTab === 'docs' && (
        <div className="space-y-4">
          {!complianceDocs ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400">{t('oauth.noDocs', 'No compliance docs generated yet.')}</p>
              {report && (
                <button
                  onClick={handleGenerateDocs}
                  disabled={generatingDocs}
                  className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-sm transition-colors"
                >
                  {generatingDocs ? t('oauth.generating', 'Generating...') : t('oauth.generateDocs', 'Generate Docs')}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Doc Sub-tabs */}
              <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                {(['privacy', 'usage', 'justifications', 'provider'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDocTab(tab)}
                    className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                      activeDocTab === tab ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab === 'privacy' && t('oauth.doc.privacy', 'Privacy Policy')}
                    {tab === 'usage' && t('oauth.doc.usage', 'Data Usage')}
                    {tab === 'justifications' && t('oauth.doc.justifications', 'Justifications')}
                    {tab === 'provider' && t('oauth.doc.provider', 'Provider Compliance')}
                  </button>
                ))}
              </div>

              {/* Doc Content */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-end mb-3">
                  <button
                    onClick={() => {
                      const content = activeDocTab === 'privacy' ? complianceDocs.privacyPolicy
                        : activeDocTab === 'usage' ? complianceDocs.dataUsageDisclosure
                        : activeDocTab === 'justifications' ? complianceDocs.scopeJustifications
                        : complianceDocs.providerCompliance
                      const filename = `oauth-${activeDocTab}-${requestId.substring(0, 8)}.md`
                      handleExportMarkdown(content, filename)
                    }}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
                  >
                    {t('oauth.exportMarkdown', 'Export Markdown')}
                  </button>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">
                    {activeDocTab === 'privacy' && complianceDocs.privacyPolicy}
                    {activeDocTab === 'usage' && complianceDocs.dataUsageDisclosure}
                    {activeDocTab === 'justifications' && complianceDocs.scopeJustifications}
                    {activeDocTab === 'provider' && complianceDocs.providerCompliance}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
