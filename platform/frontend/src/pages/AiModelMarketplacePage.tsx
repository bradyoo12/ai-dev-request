import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listIntegrations, integrateModel, deleteIntegration, getIntegrationStats, getProviders } from '../api/aimodelintegration'
import type { AiModelIntegration, IntegrateResponse, ProviderInfo, IntegrationStats } from '../api/aimodelintegration'

type Tab = 'integrate' | 'history' | 'providers' | 'stats'

export default function AiModelMarketplacePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('integrate')
  const [project, setProject] = useState('')
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [capability, setCapability] = useState('chat')
  const [result, setResult] = useState<IntegrateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<AiModelIntegration[]>([])
  const [stats, setStats] = useState<IntegrationStats>({ total: 0, byProvider: [] })

  useEffect(() => {
    getProviders().then(p => { setProviders(p); if (p.length > 0) { setSelectedProvider(p[0].id); if (p[0].models.length > 0) setSelectedModel(p[0].models[0].id) } })
  }, [])

  useEffect(() => {
    if (tab === 'history') listIntegrations().then(setHistory)
    if (tab === 'providers') getProviders().then(setProviders)
    if (tab === 'stats') getIntegrationStats().then(setStats)
  }, [tab])

  useEffect(() => {
    const provider = providers.find(p => p.id === selectedProvider)
    if (provider && provider.models.length > 0) setSelectedModel(provider.models[0].id)
  }, [selectedProvider, providers])

  const handleIntegrate = async () => {
    if (!project || !selectedProvider || !selectedModel) return
    setLoading(true)
    try {
      const r = await integrateModel(project, selectedProvider, selectedModel, capability)
      setResult(r)
    } finally {
      setLoading(false)
    }
  }

  const currentProvider = providers.find(p => p.id === selectedProvider)

  const qualityColor = (q: string) => {
    switch (q) {
      case 'highest': return 'text-purple-400'
      case 'high': return 'text-blue-400'
      case 'good': return 'text-green-400'
      default: return 'text-warm-400'
    }
  }

  const speedBadge = (s: string) => {
    switch (s) {
      case 'fastest': return 'bg-green-600'
      case 'fast': return 'bg-blue-600'
      case 'medium': return 'bg-yellow-600'
      case 'slow': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('marketplace.title', 'AI Model Marketplace')}</h3>
      <div className="flex gap-2 mb-6">
        {(['integrate', 'history', 'providers', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-400 hover:text-white'}`}
          >{t(`marketplace.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}</button>
        ))}
      </div>

      {tab === 'integrate' && (
        <div className="bg-warm-800 rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('marketplace.project', 'Project Name')}</label>
              <input value={project} onChange={e => setProject(e.target.value)} placeholder="my-ai-app"
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('marketplace.provider', 'AI Provider')}</label>
              <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white">
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.modelCount} models)</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('marketplace.model', 'Model')}</label>
              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white">
                {currentProvider?.models.map(m => (
                  <option key={m.id} value={m.id}>{m.name} — ${m.costPer1kTokens}/1k tokens</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('marketplace.capability', 'Capability')}</label>
              <select value={capability} onChange={e => setCapability(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white">
                <option value="chat">Chat / Text Generation</option>
                <option value="image-gen">Image Generation</option>
                <option value="embeddings">Embeddings</option>
                <option value="speech">Speech-to-Text</option>
                <option value="classification">Classification</option>
              </select>
            </div>
          </div>
          <button onClick={handleIntegrate} disabled={loading || !project || !selectedModel}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? t('marketplace.integrating', 'Integrating...') : t('marketplace.integrate', 'Generate Integration')}
          </button>

          {result && (
            <div className="mt-6 bg-warm-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">{t('marketplace.result', 'Integration Result')}</h4>
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">{result.integrationStatus.toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('marketplace.providerLabel', 'Provider')}</div>
                  <div className="text-white font-medium">{result.provider?.name}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('marketplace.costLabel', 'Est. Cost/Request')}</div>
                  <div className="text-white font-medium">${result.estimatedCostPerRequest}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('marketplace.security', 'Credential Security')}</div>
                  <div className="text-green-400 font-medium">{result.credentialSecured ? 'Secured' : 'Pending'}</div>
                </div>
              </div>
              <div className="bg-warm-800 rounded-lg p-3 mb-4">
                <div className="text-warm-400 text-sm mb-2">{t('marketplace.codeSnippet', 'Generated Integration Code')}</div>
                <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap bg-warm-900 rounded p-3 overflow-x-auto">{result.codeSnippet}</pre>
              </div>
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 mb-4">
                <div className="text-blue-400 text-sm">{result.securityNote}</div>
              </div>
              <div className="bg-warm-800 rounded-lg p-3">
                <div className="text-warm-400 text-sm mb-1">{t('marketplace.recommendation', 'Next Steps')}</div>
                <div className="text-white text-sm">{result.recommendation}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 && <div className="text-warm-400 text-center py-8">{t('marketplace.noHistory', 'No integrations yet')}</div>}
          {history.map(i => (
            <div key={i.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{i.modelId}</span>
                  <span className="bg-warm-700 text-warm-300 px-2 py-0.5 rounded text-xs">{i.providerId}</span>
                  <span className="bg-warm-700 text-warm-300 px-2 py-0.5 rounded text-xs">{i.capability}</span>
                  <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded">{i.integrationStatus}</span>
                </div>
                <div className="text-warm-400 text-sm mt-1">
                  {i.projectName} | ${i.estimatedCostPerRequest}/req | {i.credentialSecured ? 'Secured' : 'Pending'} | {new Date(i.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button onClick={async () => { await deleteIntegration(i.id); setHistory(h => h.filter(x => x.id !== i.id)) }}
                className="text-red-400 hover:text-red-300 text-sm">{t('common.delete', 'Delete')}</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'providers' && (
        <div className="space-y-4">
          {providers.map(p => (
            <div key={p.id} className="bg-warm-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-white font-semibold text-lg">{p.name}</h4>
                  <p className="text-warm-400 text-sm">{p.description}</p>
                </div>
                <span className="bg-warm-700 text-warm-300 px-3 py-1 rounded text-sm">{p.modelCount.toLocaleString()} models</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {p.models.map(m => (
                  <div key={m.id} className="bg-warm-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium text-sm">{m.name}</span>
                      <span className={`${speedBadge(m.speed)} text-white text-xs px-2 py-0.5 rounded`}>{m.speed}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-warm-400">{m.capability}</span>
                      <span className="text-warm-400">|</span>
                      <span className={qualityColor(m.quality)}>{m.quality} quality</span>
                      <span className="text-warm-400">|</span>
                      <span className="text-white">${m.costPer1kTokens}/1k</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div>
          <div className="bg-warm-800 rounded-lg p-6 mb-4">
            <div className="text-warm-400 text-sm">{t('marketplace.totalIntegrations', 'Total Integrations')}</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.byProvider.map(s => (
              <div key={s.provider} className="bg-warm-800 rounded-lg p-4">
                <div className="text-white font-medium">{s.provider}</div>
                <div className="text-warm-400 text-sm mt-1">
                  {t('marketplace.stats.count', 'Count')}: {s.count} | {t('marketplace.stats.avgCost', 'Avg Cost')}: ${s.avgCost}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
