import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getInnovations, analyzeCodebase, generatePatentDraft, getPatentStats,
} from '../api/patent-agent'
import type { PatentInnovation, PatentStats } from '../api/patent-agent'

type ActiveTab = 'innovations' | 'analysis' | 'drafts'

const TIER_COLORS: Record<string, string> = {
  'Tier 1': 'bg-red-900/50 text-red-400 border-red-500',
  'Tier 2': 'bg-yellow-900/50 text-yellow-400 border-yellow-500',
  'Tier 3': 'bg-blue-900/50 text-blue-400 border-blue-500',
}

const STATUS_COLORS: Record<string, string> = {
  'Identified': 'bg-warm-700 text-warm-300',
  'Drafted': 'bg-blue-900/50 text-blue-400',
  'Filed': 'bg-yellow-900/50 text-yellow-400',
  'Granted': 'bg-green-900/50 text-green-400',
}

function getTotalScore(item: PatentInnovation): number {
  return item.noveltyScore + item.nonObviousnessScore + item.utilityScore + item.commercialValueScore
}

export default function PatentAgentPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<ActiveTab>('innovations')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [innovations, setInnovations] = useState<PatentInnovation[]>([])
  const [stats, setStats] = useState<PatentStats | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [draftLoading, setDraftLoading] = useState(false)
  const [selectedInnovation, setSelectedInnovation] = useState<PatentInnovation | null>(null)
  const [draftText, setDraftText] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const [data, statsData] = await Promise.all([getInnovations(), getPatentStats()])
      setInnovations(data)
      setStats(statsData)
    } catch {
      setError(t('patentAgent.error.loadFailed', 'Failed to load innovations'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { loadData() }, [loadData])

  // Clear alerts after timeout
  useEffect(() => {
    if (success) { const timer = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(timer) }
  }, [success])

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true); setError('')
      const results = await analyzeCodebase()
      setInnovations(results)
      setSuccess(t('patentAgent.analyzeSuccess', `Analysis complete! Found ${results.length} innovations.`))
      // Refresh stats
      const statsData = await getPatentStats()
      setStats(statsData)
    } catch {
      setError(t('patentAgent.error.analyzeFailed', 'Failed to analyze codebase'))
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGenerateDraft = async (innovation: PatentInnovation) => {
    try {
      setDraftLoading(true); setError(''); setDraftText('')
      setSelectedInnovation(innovation)
      const result = await generatePatentDraft(innovation.id)
      setDraftText(result.draft)
      setSuccess(t('patentAgent.draftSuccess', 'Patent draft generated!'))
      // Reload to get updated status
      loadData()
    } catch {
      setError(t('patentAgent.error.draftFailed', 'Failed to generate patent draft'))
    } finally {
      setDraftLoading(false)
    }
  }

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'innovations', label: t('patentAgent.tabs.innovations', 'Innovations') },
    { key: 'analysis', label: t('patentAgent.tabs.analysis', 'Analysis') },
    { key: 'drafts', label: t('patentAgent.tabs.drafts', 'Patent Drafts') },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold">{t('patentAgent.title', 'Patent Agent')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('patentAgent.description', 'Discover patentable innovations in your codebase and generate patent application drafts')}</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/30 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-warm-800/50 border border-warm-700 rounded-lg p-4">
            <p className="text-warm-400 text-xs uppercase tracking-wide">{t('patentAgent.stats.total', 'Total')}</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>
          {stats.byTier.map(tier => (
            <div key={tier.tier} className="bg-warm-800/50 border border-warm-700 rounded-lg p-4">
              <p className="text-warm-400 text-xs uppercase tracking-wide">{tier.tier}</p>
              <p className="text-2xl font-bold mt-1">{tier.count}</p>
              <p className="text-warm-500 text-xs mt-1">{t('patentAgent.stats.avgScore', 'Avg')}: {Math.round(tier.avgScore)}/400</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-warm-700 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-warm-800 text-white border border-warm-700 border-b-transparent -mb-px'
                : 'text-warm-400 hover:text-white hover:bg-warm-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="text-center py-12 text-warm-400">{t('patentAgent.loading', 'Loading innovations...')}</div>
      ) : (
        <>
          {/* Innovations Tab */}
          {activeTab === 'innovations' && (
            <div className="space-y-4">
              {innovations.length === 0 ? (
                <div className="text-center py-12 bg-warm-800/30 rounded-lg border border-warm-700">
                  <p className="text-warm-400">{t('patentAgent.empty', 'No innovations discovered yet.')}</p>
                  <p className="text-warm-500 text-sm mt-2">{t('patentAgent.emptyHint', 'Run codebase analysis to discover patentable innovations.')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-warm-700 text-warm-400 text-left">
                        <th className="py-3 px-4 font-medium">{t('patentAgent.table.title', 'Title')}</th>
                        <th className="py-3 px-2 font-medium">{t('patentAgent.table.category', 'Category')}</th>
                        <th className="py-3 px-2 font-medium text-center">{t('patentAgent.table.score', 'Score')}</th>
                        <th className="py-3 px-2 font-medium">{t('patentAgent.table.status', 'Status')}</th>
                        <th className="py-3 px-2 font-medium">{t('patentAgent.table.actions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {innovations.map(item => (
                        <tr key={item.id} className="border-b border-warm-800 hover:bg-warm-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-medium text-white">{item.title}</p>
                            <p className="text-warm-500 text-xs mt-1 line-clamp-1">{item.patentAngle}</p>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${TIER_COLORS[item.category] || 'bg-warm-700 text-warm-300'}`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className="font-mono font-bold">{getTotalScore(item)}</span>
                            <span className="text-warm-500 text-xs">/400</span>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[item.status] || 'bg-warm-700 text-warm-300'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <button
                              onClick={() => { setSelectedInnovation(item); setActiveTab('drafts') }}
                              className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                            >
                              {t('patentAgent.viewDraft', 'Draft')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div className="bg-warm-800/30 border border-warm-700 rounded-lg p-6">
                <h4 className="font-semibold text-lg mb-2">{t('patentAgent.analysis.title', 'Codebase Analysis')}</h4>
                <p className="text-warm-400 text-sm mb-4">
                  {t('patentAgent.analysis.description', 'Analyze your codebase to identify new patentable innovations. The AI agent will scan your code architecture, services, and unique implementations to discover novel approaches worth protecting.')}
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-700 disabled:text-warm-500 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  {analyzing ? t('patentAgent.analysis.analyzing', 'Analyzing codebase...') : t('patentAgent.analysis.button', 'Run Analysis')}
                </button>
              </div>

              {/* Analysis Results */}
              {innovations.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">{t('patentAgent.analysis.results', 'Discovered Innovations')}</h4>
                  {innovations.map(item => (
                    <div key={item.id} className="bg-warm-800/30 border border-warm-700 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${TIER_COLORS[item.category] || 'bg-warm-700 text-warm-300'}`}>
                              {item.category}
                            </span>
                            <h5 className="font-medium">{item.title}</h5>
                          </div>
                          <p className="text-warm-400 text-sm mb-2">{item.innovation}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-warm-500">
                            <span>{t('patentAgent.scores.novelty', 'Novelty')}: <strong className="text-warm-300">{item.noveltyScore}</strong></span>
                            <span>{t('patentAgent.scores.nonObvious', 'Non-Obvious')}: <strong className="text-warm-300">{item.nonObviousnessScore}</strong></span>
                            <span>{t('patentAgent.scores.utility', 'Utility')}: <strong className="text-warm-300">{item.utilityScore}</strong></span>
                            <span>{t('patentAgent.scores.commercial', 'Commercial')}: <strong className="text-warm-300">{item.commercialValueScore}</strong></span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono font-bold text-lg">{getTotalScore(item)}</p>
                          <p className="text-warm-500 text-xs">/400</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Patent Drafts Tab */}
          {activeTab === 'drafts' && (
            <div className="space-y-6">
              {/* Innovation Selector */}
              <div className="bg-warm-800/30 border border-warm-700 rounded-lg p-4">
                <h4 className="font-semibold mb-3">{t('patentAgent.drafts.select', 'Select Innovation')}</h4>
                <div className="grid gap-2">
                  {innovations.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedInnovation(item)}
                      className={`text-left p-3 rounded-lg border transition-colors ${
                        selectedInnovation?.id === item.id
                          ? 'bg-blue-900/30 border-blue-500'
                          : 'bg-warm-800/50 border-warm-700 hover:border-warm-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${TIER_COLORS[item.category] || 'bg-warm-700 text-warm-300'}`}>
                            {item.category}
                          </span>
                          <span className="text-sm font-medium">{item.title}</span>
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[item.status] || 'bg-warm-700 text-warm-300'}`}>
                          {item.status}
                        </span>
                      </div>
                    </button>
                  ))}
                  {innovations.length === 0 && (
                    <p className="text-warm-500 text-sm">{t('patentAgent.drafts.noInnovations', 'No innovations available. Run analysis first.')}</p>
                  )}
                </div>
              </div>

              {/* Generate Draft Button */}
              {selectedInnovation && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleGenerateDraft(selectedInnovation)}
                    disabled={draftLoading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-700 disabled:text-warm-500 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    {draftLoading ? t('patentAgent.drafts.generating', 'Generating draft...') : t('patentAgent.drafts.generate', 'Generate Patent Draft')}
                  </button>
                  <span className="text-warm-400 text-sm">
                    {t('patentAgent.drafts.selected', 'Selected')}: <strong className="text-white">{selectedInnovation.title}</strong>
                  </span>
                </div>
              )}

              {/* Draft Display */}
              {draftText && (
                <div className="bg-warm-900 border border-warm-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">{t('patentAgent.drafts.draftTitle', 'Patent Application Draft')}</h4>
                    <button
                      onClick={() => navigator.clipboard.writeText(draftText)}
                      className="text-warm-400 hover:text-white text-xs transition-colors"
                    >
                      {t('patentAgent.drafts.copy', 'Copy to Clipboard')}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-warm-300 font-mono leading-relaxed">
                    {draftText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
