import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listComparisons,
  createComparison,
  selectWinner,
  getArenaStats,
  getLeaderboard,
  type ArenaComparison,
  type ArenaStats,
  type ModelOutput,
  type LeaderboardEntry,
} from '../api/arena'

type ArenaTab = 'compare' | 'history' | 'leaderboard' | 'stats'

const TASK_CATEGORIES = ['code-generation', 'bug-fixing', 'architecture', 'refactoring', 'testing', 'documentation']

export default function ArenaPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<ArenaTab>('compare')
  const [comparisons, setComparisons] = useState<ArenaComparison[]>([])
  const [stats, setStats] = useState<ArenaStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)

  // Compare form
  const [prompt, setPrompt] = useState('')
  const [taskCategory, setTaskCategory] = useState('code-generation')
  const [comparing, setComparing] = useState(false)
  const [currentComparison, setCurrentComparison] = useState<ArenaComparison | null>(null)
  const [outputs, setOutputs] = useState<ModelOutput[]>([])

  useEffect(() => {
    if (tab === 'history') loadComparisons()
    if (tab === 'stats') loadStats()
    if (tab === 'leaderboard') loadLeaderboard()
  }, [tab])

  async function loadComparisons() {
    setLoading(true)
    try {
      const data = await listComparisons()
      setComparisons(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStats() {
    setLoading(true)
    try {
      const data = await getArenaStats()
      setStats(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadLeaderboard() {
    setLoading(true)
    try {
      const data = await getLeaderboard()
      setLeaderboard(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleCompare() {
    if (!prompt.trim()) return
    setComparing(true)
    setCurrentComparison(null)
    setOutputs([])
    try {
      const result = await createComparison({ prompt, taskCategory })
      setCurrentComparison(result)
      const parsed: ModelOutput[] = JSON.parse(result.modelOutputsJson)
      setOutputs(parsed)
    } catch { /* ignore */ }
    setComparing(false)
  }

  async function handleSelectWinner(model: string) {
    if (!currentComparison) return
    try {
      const updated = await selectWinner(currentComparison.id, { model })
      setCurrentComparison(updated)
    } catch { /* ignore */ }
  }

  const MODEL_COLORS: Record<string, string> = {
    'Claude Sonnet': 'bg-orange-900 text-orange-300 border-orange-700',
    'GPT-4o': 'bg-emerald-900 text-emerald-300 border-emerald-700',
    'Gemini Pro': 'bg-blue-900 text-blue-300 border-blue-700',
  }

  const MODEL_HEADER_COLORS: Record<string, string> = {
    'Claude Sonnet': 'border-orange-600',
    'GPT-4o': 'border-emerald-600',
    'Gemini Pro': 'border-blue-600',
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('arena.title', 'Model Arena')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('arena.subtitle', 'Compare AI models side-by-side and track which performs best for your tasks')}</p>
      </div>

      <div className="flex gap-2">
        {(['compare', 'history', 'leaderboard', 'stats'] as ArenaTab[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`arena.tabs.${tabId}`, tabId === 'compare' ? 'Compare' : tabId === 'history' ? 'History' : tabId === 'leaderboard' ? 'Leaderboard' : 'Stats')}
          </button>
        ))}
      </div>

      {/* Compare Tab */}
      {tab === 'compare' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('arena.runArena', 'Run Arena Comparison')}</h4>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('arena.taskCategory', 'Task Category')}</label>
              <select
                value={taskCategory}
                onChange={e => setTaskCategory(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
              >
                {TASK_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('arena.prompt', 'Prompt')}</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={3}
                className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                placeholder={t('arena.promptPlaceholder', 'Describe the code you want generated...')}
              />
            </div>
            <button
              onClick={handleCompare}
              disabled={comparing || !prompt.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {comparing ? t('arena.comparing', 'Running Arena...') : t('arena.runBtn', 'Run Arena')}
            </button>
          </div>

          {/* Model Outputs */}
          {outputs.length > 0 && currentComparison && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">{t('arena.results', 'Results')}</h4>
                {currentComparison.status === 'winner_selected' && (
                  <span className="text-xs px-3 py-1 bg-green-900 text-green-300 rounded-full">
                    {t('arena.winnerSelected', 'Winner')}: {currentComparison.selectedModel}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {outputs.map((output, idx) => (
                  <div
                    key={idx}
                    className={`bg-warm-800 rounded-lg border-t-4 ${MODEL_HEADER_COLORS[output.model] || 'border-warm-600'} ${
                      currentComparison.selectedModel === output.model ? 'ring-2 ring-green-500' : ''
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs px-2 py-1 rounded ${MODEL_COLORS[output.model] || 'bg-warm-700 text-warm-300'}`}>
                          {output.model}
                        </span>
                        <span className="text-xs text-warm-500">{output.provider}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                        <div>
                          <p className="text-xs text-warm-500">{t('arena.latency', 'Latency')}</p>
                          <p className="text-sm text-white font-medium">{output.latencyMs}ms</p>
                        </div>
                        <div>
                          <p className="text-xs text-warm-500">{t('arena.tokens', 'Tokens')}</p>
                          <p className="text-sm text-white font-medium">{output.tokenCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-warm-500">{t('arena.cost', 'Cost')}</p>
                          <p className="text-sm text-white font-medium">${output.cost.toFixed(4)}</p>
                        </div>
                      </div>
                      <div className="bg-warm-900 rounded p-3 mb-3 max-h-64 overflow-auto">
                        <pre className="text-xs text-warm-300 whitespace-pre-wrap font-mono">{output.output}</pre>
                      </div>
                      {currentComparison.status !== 'winner_selected' && (
                        <button
                          onClick={() => handleSelectWinner(output.model)}
                          className="w-full py-2 bg-warm-700 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                        >
                          {t('arena.pickWinner', 'Pick Winner')}
                        </button>
                      )}
                      {currentComparison.selectedModel === output.model && (
                        <div className="text-center py-2 text-green-400 text-sm font-medium">
                          {t('arena.winner', 'Winner')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('arena.loading', 'Loading...')}</p>
          ) : comparisons.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('arena.noHistory', 'No comparisons yet. Run your first arena comparison!')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comparisons.map(c => (
                <div key={c.id} className="bg-warm-800 rounded-lg p-4 border border-warm-700">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{c.promptText}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-warm-700 text-warm-300 rounded">{c.taskCategory}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          c.status === 'winner_selected' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                        }`}>
                          {c.status === 'winner_selected' ? c.selectedModel : t('arena.pending', 'Pending')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-warm-500">
                        <span>{c.modelCount} {t('arena.models', 'models')}</span>
                        <span>${c.totalCost.toFixed(4)}</span>
                        <span>{c.totalTokens} {t('arena.tokensSuffix', 'tokens')}</span>
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {tab === 'leaderboard' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('arena.loading', 'Loading...')}</p>
          ) : leaderboard.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('arena.noLeaderboard', 'No winners selected yet. Run comparisons and pick winners to build the leaderboard.')}</p>
            </div>
          ) : (
            leaderboard.map(entry => (
              <div key={entry.category} className="bg-warm-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium capitalize">{entry.category.replace(/-/g, ' ')}</h4>
                  <span className="text-xs text-warm-500">{entry.totalComparisons} {t('arena.comparisons', 'comparisons')}</span>
                </div>
                <div className="space-y-2">
                  {entry.models.map((model, idx) => (
                    <div key={model.model} className="flex items-center gap-3">
                      <span className="text-xs text-warm-500 w-4">{idx + 1}.</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${MODEL_COLORS[model.model] || 'bg-warm-700 text-warm-300'}`}>
                        {model.model}
                      </span>
                      <div className="flex-1 bg-warm-900 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-yellow-500' : 'bg-warm-600'
                          }`}
                          style={{ width: `${model.winRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-white font-medium w-14 text-right">{model.winRate}%</span>
                      <span className="text-xs text-warm-500 w-12 text-right">{model.wins} {t('arena.wins', 'wins')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.totalComparisons}</p>
              <p className="text-warm-400 text-sm">{t('arena.stats.totalComparisons', 'Total Comparisons')}</p>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.winnersSelected}</p>
              <p className="text-warm-400 text-sm">{t('arena.stats.winnersSelected', 'Winners Selected')}</p>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">${stats.avgCost.toFixed(4)}</p>
              <p className="text-warm-400 text-sm">{t('arena.stats.avgCost', 'Avg Cost')}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.totalTokens.toLocaleString()}</p>
              <p className="text-warm-400 text-sm">{t('arena.stats.totalTokens', 'Total Tokens')}</p>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.fastestModel}</p>
              <p className="text-warm-400 text-sm">{t('arena.stats.fastestModel', 'Fastest Model')}</p>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-400">{stats.mostSelected}</p>
              <p className="text-warm-400 text-sm">{t('arena.stats.mostSelected', 'Most Selected')}</p>
            </div>
          </div>

          {stats.winRates.length > 0 && (
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">{t('arena.stats.winRates', 'Model Win Rates')}</h4>
              <div className="space-y-2">
                {stats.winRates.map(wr => (
                  <div key={wr.model} className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${MODEL_COLORS[wr.model] || 'bg-warm-700 text-warm-300'}`}>
                      {wr.model}
                    </span>
                    <div className="flex-1 bg-warm-900 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${wr.winRate}%` }}
                      />
                    </div>
                    <span className="text-sm text-white font-medium">{wr.winRate}%</span>
                    <span className="text-xs text-warm-500">({wr.wins} {t('arena.wins', 'wins')})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.recentComparisons.length > 0 && (
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">{t('arena.stats.recent', 'Recent Comparisons')}</h4>
              <div className="space-y-2">
                {stats.recentComparisons.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-warm-300 truncate flex-1">{c.promptText}</span>
                    <span className="text-warm-400 ml-2">{c.taskCategory}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded ${c.selectedModel ? 'bg-green-900 text-green-300' : 'bg-warm-700 text-warm-400'}`}>
                      {c.selectedModel || t('arena.pending', 'Pending')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'stats' && !stats && loading && (
        <p className="text-warm-400 text-sm">{t('arena.loading', 'Loading...')}</p>
      )}
    </div>
  )
}
