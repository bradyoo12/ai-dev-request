import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../api/multimodelrouting'

type Tab = 'simulate' | 'rules' | 'models' | 'stats'

export default function MultiModelRoutingPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('simulate')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{t('mmr.title', 'Multi-Model AI Routing')}</h2>
        <p className="text-warm-400 mt-1">{t('mmr.subtitle', 'Intelligent routing between Claude Opus 4.6 and GPT-5.3-Codex for optimal cost, speed, and quality')}</p>
      </div>
      <div className="flex gap-2">
        {(['simulate', 'rules', 'models', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-300 hover:bg-warm-600'}`}>
            {t(`mmr.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'simulate' && <SimulateTab />}
      {tab === 'rules' && <RulesTab />}
      {tab === 'models' && <ModelsTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function SimulateTab() {
  const { t } = useTranslation()
  const [taskType, setTaskType] = useState('code-generation')
  const [prompt, setPrompt] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<api.SimulateResponse | null>(null)

  const handleSimulate = async () => {
    if (!prompt.trim()) return
    setRunning(true)
    try {
      const res = await api.simulateRouting(taskType, prompt)
      setResult(res)
    } catch { /* ignore */ }
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">{t('mmr.simulateTitle', 'Simulate Model Routing')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('mmr.taskType', 'Task Type')}</label>
            <select value={taskType} onChange={e => setTaskType(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="code-generation">{t('mmr.taskCodeGen', 'Code Generation')}</option>
              <option value="reasoning">{t('mmr.taskReasoning', 'Reasoning')}</option>
              <option value="refactoring">{t('mmr.taskRefactor', 'Refactoring')}</option>
              <option value="testing">{t('mmr.taskTesting', 'Testing')}</option>
              <option value="review">{t('mmr.taskReview', 'Code Review')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('mmr.prompt', 'Task Prompt')}</label>
            <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={t('mmr.promptPlaceholder', 'Describe the task to route...')} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white" />
          </div>
        </div>
        <button onClick={handleSimulate} disabled={running || !prompt.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {running ? t('mmr.simulating', 'Routing...') : t('mmr.simulateBtn', 'Simulate Routing')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">{t('mmr.routingResult', 'Routing Decision')}</h4>
              <span className="px-2 py-1 text-xs rounded bg-green-600 text-white">{result.strategy}</span>
            </div>
            <p className="text-warm-300 text-sm mb-4">{result.reasoning}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.comparison.map(c => (
                <div key={c.model} className={`p-4 rounded-lg border-2 ${c.selected ? 'border-green-500 bg-warm-700' : 'border-warm-600 bg-warm-900'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{c.model}</span>
                    {c.selected && <span className="px-2 py-0.5 text-xs bg-green-600 text-white rounded">{t('mmr.selected', 'Selected')}</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-warm-400">{t('mmr.latency', 'Latency')}</div>
                      <div className="text-white font-medium">{c.latencyMs}ms</div>
                    </div>
                    <div>
                      <div className="text-warm-400">{t('mmr.cost', 'Cost')}</div>
                      <div className="text-white font-medium">${c.cost}</div>
                    </div>
                    <div>
                      <div className="text-warm-400">{t('mmr.accuracy', 'Accuracy')}</div>
                      <div className="text-white font-medium">{c.accuracy}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RulesTab() {
  const { t } = useTranslation()
  const [rules, setRules] = useState<api.ModelRoutingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [taskType, setTaskType] = useState('code-generation')
  const [primary, setPrimary] = useState('claude-opus')
  const [fallback, setFallback] = useState('gpt-codex')
  const [strategy, setStrategy] = useState('quality-first')
  const [creating, setCreating] = useState(false)

  useEffect(() => { api.listRules().then(setRules).catch(() => {}).finally(() => setLoading(false)) }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const rule = await api.createRule(taskType, primary, fallback, strategy)
      setRules(prev => [rule, ...prev])
    } catch { /* ignore */ }
    setCreating(false)
  }

  if (loading) return <div className="text-warm-400">{t('mmr.loading', 'Loading...')}</div>

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">{t('mmr.newRule', 'Create Routing Rule')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('mmr.taskType', 'Task Type')}</label>
            <select value={taskType} onChange={e => setTaskType(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="code-generation">Code Generation</option>
              <option value="reasoning">Reasoning</option>
              <option value="refactoring">Refactoring</option>
              <option value="testing">Testing</option>
              <option value="review">Code Review</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('mmr.primaryModel', 'Primary Model')}</label>
            <select value={primary} onChange={e => setPrimary(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="claude-opus">Claude Opus 4.6</option>
              <option value="claude-sonnet">Claude Sonnet 4.5</option>
              <option value="gpt-codex">GPT-5.3-Codex</option>
              <option value="gpt-4o">GPT-4o</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('mmr.fallbackModel', 'Fallback Model')}</label>
            <select value={fallback} onChange={e => setFallback(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="gpt-codex">GPT-5.3-Codex</option>
              <option value="claude-sonnet">Claude Sonnet 4.5</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude-opus">Claude Opus 4.6</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('mmr.strategy', 'Strategy')}</label>
            <select value={strategy} onChange={e => setStrategy(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="quality-first">{t('mmr.stratQuality', 'Quality First')}</option>
              <option value="speed-first">{t('mmr.stratSpeed', 'Speed First')}</option>
              <option value="cost-optimized">{t('mmr.stratCost', 'Cost Optimized')}</option>
              <option value="balanced">{t('mmr.stratBalanced', 'Balanced')}</option>
            </select>
          </div>
        </div>
        <button onClick={handleCreate} disabled={creating} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {creating ? t('mmr.creating', 'Creating...') : t('mmr.createBtn', 'Create Rule')}
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="text-warm-400">{t('mmr.noRules', 'No routing rules yet.')}</div>
      ) : (
        <div className="space-y-3">
          {rules.map(r => (
            <div key={r.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="text-white font-medium">{r.taskType}</div>
                <div className="text-sm text-warm-400">{r.primaryModel} &rarr; {r.fallbackModel} · {r.routingStrategy} · {r.totalRequests} requests</div>
                <div className="text-xs text-warm-500 mt-1">Accuracy: {r.accuracyScore}% · Primary: {r.avgPrimaryLatencyMs}ms · Fallback: {r.avgFallbackLatencyMs}ms</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs rounded ${r.status === 'active' ? 'bg-green-600 text-white' : 'bg-warm-600 text-warm-300'}`}>{r.status}</span>
                <button onClick={async () => { await api.deleteRule(r.id); setRules(p => p.filter(x => x.id !== r.id)) }} className="text-red-400 hover:text-red-300 text-sm">{t('mmr.delete', 'Delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ModelsTab() {
  const { t } = useTranslation()
  const [models, setModels] = useState<api.AIModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getModels().then(setModels).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('mmr.loading', 'Loading...')}</div>

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('mmr.modelsTitle', 'Available AI Models')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map(m => (
            <div key={m.id} className="p-4 bg-warm-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: m.color }} />
                  <h4 className="text-white font-medium">{m.name}</h4>
                </div>
                <span className="text-xs text-warm-400">{m.speed} speed</span>
              </div>
              <p className="text-sm text-warm-400 mb-3">{m.description}</p>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-green-400">Accuracy: {m.accuracy}</span>
                <span className="text-blue-400">Cost: {m.costPer1k}/1K tokens</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('mmr.strategiesTitle', 'Routing Strategies')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: t('mmr.stratQuality', 'Quality First'), desc: t('mmr.stratQualityDesc', 'Always use the primary model for highest accuracy'), color: '#8B5CF6' },
            { name: t('mmr.stratSpeed', 'Speed First'), desc: t('mmr.stratSpeedDesc', 'Prefer the fallback model for lowest latency'), color: '#10B981' },
            { name: t('mmr.stratCost', 'Cost Optimized'), desc: t('mmr.stratCostDesc', 'Switch to fallback when primary exceeds cost threshold'), color: '#F59E0B' },
            { name: t('mmr.stratBalanced', 'Balanced'), desc: t('mmr.stratBalancedDesc', 'Distribute requests evenly between models'), color: '#3B82F6' },
          ].map(s => (
            <div key={s.name} className="p-4 bg-warm-700 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-white font-medium">{s.name}</span>
              </div>
              <p className="text-sm text-warm-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatsTab() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<api.RoutingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getRoutingStats().then(setStats).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('mmr.loading', 'Loading...')}</div>
  if (!stats || stats.totalRules === 0) return <div className="text-warm-400">{t('mmr.noStats', 'No routing statistics yet.')}</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { value: stats.totalRules, label: t('mmr.stats.rules', 'Rules') },
          { value: stats.totalRequests, label: t('mmr.stats.requests', 'Total Requests') },
          { value: `${stats.avgAccuracy}%`, label: t('mmr.stats.accuracy', 'Avg Accuracy'), color: 'text-green-400' },
          { value: `${stats.avgLatency}ms`, label: t('mmr.stats.latency', 'Avg Latency'), color: 'text-blue-400' },
          { value: `$${stats.avgCost}`, label: t('mmr.stats.cost', 'Avg Cost'), color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value}</div>
            <div className="text-sm text-warm-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('mmr.stats.byStrategy', 'By Strategy')}</h4>
          <div className="space-y-2">
            {stats.byStrategy.map(s => (
              <div key={s.strategy} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{s.strategy}</span>
                <span className="text-warm-400 text-sm">{s.count} {t('mmr.rulesLabel', 'rules')} · {s.requests} {t('mmr.requestsLabel', 'reqs')}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('mmr.stats.byTask', 'By Task Type')}</h4>
          <div className="space-y-2">
            {stats.byTaskType.map(t2 => (
              <div key={t2.taskType} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{t2.taskType}</span>
                <span className="text-warm-400 text-sm">{t2.count} {t('mmr.rulesLabel', 'rules')} · {t2.requests} {t('mmr.requestsLabel', 'reqs')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
