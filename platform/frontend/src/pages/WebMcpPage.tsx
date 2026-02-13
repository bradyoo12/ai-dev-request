import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listSessions, connect, deleteSession, getMcpStats, getBrowsers } from '../api/webmcp'
import type { WebMcpSession, ConnectResponse, BrowserInfo, McpStats } from '../api/webmcp'

type Tab = 'connect' | 'history' | 'browsers' | 'stats'

export default function WebMcpPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('connect')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">{t('webmcp.title', 'Chrome WebMCP')}</h2>
        <p className="text-warm-400 text-sm mt-1">{t('webmcp.subtitle', 'Standardized browser automation with direct DOM access')}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(['connect', 'history', 'browsers', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'}`}>
            {t(`webmcp.tab.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'connect' && <ConnectTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'browsers' && <BrowsersTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function ConnectTab() {
  const { t } = useTranslation()
  const [targetUrl, setTargetUrl] = useState('')
  const [browserType, setBrowserType] = useState('chrome')
  const [protocol, setProtocol] = useState('webmcp-v1')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ConnectResponse | null>(null)

  const handleConnect = async () => {
    if (!targetUrl) return
    setLoading(true)
    try {
      const res = await connect(targetUrl, browserType, protocol)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-warm-800 rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-sm text-warm-400 mb-1">{t('webmcp.targetUrl', 'Target URL')}</label>
          <input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} placeholder="https://example.com" className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('webmcp.browser', 'Browser')}</label>
            <select value={browserType} onChange={e => setBrowserType(e.target.value)} className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm">
              <option value="chrome">Chrome</option>
              <option value="edge">Edge</option>
              <option value="safari">Safari</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('webmcp.protocol', 'Protocol')}</label>
            <select value={protocol} onChange={e => setProtocol(e.target.value)} className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm">
              <option value="webmcp-v1">WebMCP v1</option>
              <option value="webmcp-v2">WebMCP v2</option>
            </select>
          </div>
        </div>
        <button onClick={handleConnect} disabled={loading || !targetUrl} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? t('webmcp.connecting', 'Connecting...') : t('webmcp.connect', 'Connect via WebMCP')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('webmcp.sessionResult', 'Session Result')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('webmcp.elements', 'Elements')}</div>
                <div className="text-white text-lg font-bold">{result.session.elementsDiscovered}</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('webmcp.actions', 'Actions')}</div>
                <div className="text-white text-lg font-bold">{result.session.actionsPerformed}</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('webmcp.events', 'Events')}</div>
                <div className="text-white text-lg font-bold">{result.session.eventsCaptured}</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('webmcp.domNodes', 'DOM Nodes')}</div>
                <div className="text-white text-lg font-bold">{result.session.domNodesAnalyzed}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-warm-400 text-xs">{t('webmcp.semanticAccuracy', 'Semantic Accuracy')}</div>
              <div className="text-green-400 text-2xl font-bold">{result.session.semanticAccuracy}%</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-warm-400 text-xs">{t('webmcp.actionReliability', 'Action Reliability')}</div>
              <div className="text-blue-400 text-2xl font-bold">{result.session.actionReliability}%</div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('webmcp.semanticElements', 'Semantic Elements')}</h3>
            <div className="space-y-2">
              {result.semanticElements.map((el, i) => (
                <div key={i} className="flex items-center justify-between bg-warm-700 rounded p-2">
                  <div>
                    <span className="text-white text-sm font-medium capitalize">{el.type}</span>
                    <span className="text-warm-500 text-xs ml-2">({el.examples.join(', ')})</span>
                  </div>
                  <span className="text-blue-400 font-mono text-sm">{el.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('webmcp.capabilities', 'Capabilities')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(result.capabilities).map(([key, val]) => (
                <div key={key} className={`rounded p-2 text-sm ${val ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  {val ? '\u2713' : '\u2717'} {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('webmcp.actionLog', 'Action Log')}</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {result.actions.map(a => (
                <div key={a.id} className="flex items-center gap-2 text-sm">
                  <span className={a.success ? 'text-green-400' : 'text-red-400'}>{a.success ? '\u2713' : '\u2717'}</span>
                  <span className="text-blue-400 font-mono">{a.type}</span>
                  <span className="text-warm-500">{a.selector}</span>
                  <span className="text-warm-600 ml-auto">{a.durationMs}ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HistoryTab() {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<WebMcpSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { listSessions().then(setSessions).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>
  if (!sessions.length) return <div className="text-warm-400 text-sm">{t('webmcp.noHistory', 'No WebMCP sessions yet.')}</div>

  return (
    <div className="space-y-2">
      {sessions.map(s => (
        <div key={s.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white text-sm font-medium">{s.targetUrl}</div>
            <div className="text-warm-500 text-xs mt-1">
              {s.browserType} | {s.protocol} | {s.elementsDiscovered} {t('webmcp.elements', 'elements')} | {s.semanticAccuracy}% {t('webmcp.accuracy', 'accuracy')}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-warm-500 text-xs">{new Date(s.createdAt).toLocaleDateString()}</span>
            <button onClick={async () => { await deleteSession(s.id); setSessions(p => p.filter(x => x.id !== s.id)) }} className="text-red-400 hover:text-red-300 text-xs">{t('common.delete', 'Delete')}</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function BrowsersTab() {
  const { t } = useTranslation()
  const [browsers, setBrowsers] = useState<BrowserInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getBrowsers().then(setBrowsers).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>

  const features = [
    { name: t('webmcp.feat.domAccess', 'Direct DOM Access'), desc: t('webmcp.feat.domAccessDesc', 'Native access to page elements — no screenshot parsing or pixel guessing') },
    { name: t('webmcp.feat.eventDriven', 'Event-Driven Architecture'), desc: t('webmcp.feat.eventDrivenDesc', 'Listen to real DOM events natively instead of polling or observing') },
    { name: t('webmcp.feat.semantic', 'Semantic Understanding'), desc: t('webmcp.feat.semanticDesc', 'AI understands page structure, roles, and accessibility tree directly') }
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {browsers.map(b => (
          <div key={b.id} className="bg-warm-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
              <span className="text-white font-medium">{b.name}</span>
              {b.supported ? <span className="text-green-400 text-xs ml-auto">{t('webmcp.supported', 'Supported')}</span> : <span className="text-yellow-400 text-xs ml-auto">{t('webmcp.coming', 'Coming Soon')}</span>}
            </div>
            <p className="text-warm-400 text-sm">{b.description}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {features.map((f, i) => (
          <div key={i} className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-white font-medium">{f.name}</h4>
            <p className="text-warm-400 text-sm mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatsTab() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<McpStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getMcpStats().then(setStats).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>
  if (!stats || stats.totalSessions === 0) return <div className="text-warm-400 text-sm">{t('webmcp.noStats', 'No WebMCP statistics yet.')}</div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('webmcp.stats.sessions', 'Total Sessions')}</div>
          <div className="text-white text-xl font-bold">{stats.totalSessions}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('webmcp.stats.accuracy', 'Avg Accuracy')}</div>
          <div className="text-green-400 text-xl font-bold">{stats.avgSemanticAccuracy}%</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('webmcp.stats.reliability', 'Avg Reliability')}</div>
          <div className="text-blue-400 text-xl font-bold">{stats.avgActionReliability}%</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('webmcp.stats.actions', 'Total Actions')}</div>
          <div className="text-white text-xl font-bold">{stats.totalActions}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('webmcp.stats.events', 'Total Events')}</div>
          <div className="text-white text-xl font-bold">{stats.totalEvents}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('webmcp.stats.elements', 'Total Elements')}</div>
          <div className="text-white text-xl font-bold">{stats.totalElements}</div>
        </div>
      </div>
      {stats.byBrowser && stats.byBrowser.length > 0 && (
        <div className="bg-warm-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">{t('webmcp.stats.byBrowser', 'By Browser')}</h3>
          <div className="space-y-2">
            {stats.byBrowser.map((b, i) => (
              <div key={i} className="flex items-center justify-between bg-warm-700 rounded p-2">
                <span className="text-white text-sm capitalize">{b.browser}</span>
                <div className="flex gap-4">
                  <span className="text-warm-400 text-sm">{b.count} sessions</span>
                  <span className="text-green-400 text-sm">{b.avgAccuracy}% accuracy</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
