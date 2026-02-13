import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listDatabases, provisionDatabase, deleteDatabase, getTursoStats, getRegions } from '../api/tursodatabase'
import type { TursoDatabase, ProvisionResponse, TursoRegion, TursoStats } from '../api/tursodatabase'

type Tab = 'provision' | 'history' | 'regions' | 'stats'

export default function TursoDatabasePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('provision')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">{t('turso.title', 'Turso Edge Database')}</h2>
        <p className="text-warm-400 text-sm mt-1">{t('turso.subtitle', 'Edge-native SQLite with global replication, vector search, and schema branching')}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(['provision', 'history', 'regions', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'}`}>
            {t(`turso.tab.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'provision' && <ProvisionTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'regions' && <RegionsTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function ProvisionTab() {
  const { t } = useTranslation()
  const [projectName, setProjectName] = useState('')
  const [region, setRegion] = useState('')
  const [enableVectorSearch, setEnableVectorSearch] = useState(false)
  const [vectorDimensions, setVectorDimensions] = useState(1536)
  const [enableSchemaBranching, setEnableSchemaBranching] = useState(false)
  const [enableEmbeddedReplica, setEnableEmbeddedReplica] = useState(false)
  const [enableGlobalReplication, setEnableGlobalReplication] = useState(false)
  const [syncMode, setSyncMode] = useState('automatic')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProvisionResponse | null>(null)

  const handleProvision = async () => {
    if (!projectName) return
    setLoading(true)
    try {
      const res = await provisionDatabase(projectName, region || null, enableVectorSearch, vectorDimensions, enableSchemaBranching, enableEmbeddedReplica, enableGlobalReplication, syncMode)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-warm-800 rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-sm text-warm-400 mb-1">{t('turso.projectName', 'Project Name')}</label>
          <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="my-project" className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('turso.region', 'Primary Region')}</label>
            <select value={region} onChange={e => setRegion(e.target.value)} className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm">
              <option value="">{t('turso.autoRegion', 'Auto-select nearest')}</option>
              <option value="us-east-1">US East (Virginia)</option>
              <option value="us-west-2">US West (Oregon)</option>
              <option value="eu-west-1">Europe (Ireland)</option>
              <option value="eu-central-1">Europe (Frankfurt)</option>
              <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
              <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('turso.syncMode', 'Sync Mode')}</label>
            <select value={syncMode} onChange={e => setSyncMode(e.target.value)} className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm">
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm text-warm-300 cursor-pointer">
            <input type="checkbox" checked={enableVectorSearch} onChange={e => setEnableVectorSearch(e.target.checked)} className="rounded" />
            {t('turso.vectorSearch', 'Vector Search')}
          </label>
          <label className="flex items-center gap-2 text-sm text-warm-300 cursor-pointer">
            <input type="checkbox" checked={enableSchemaBranching} onChange={e => setEnableSchemaBranching(e.target.checked)} className="rounded" />
            {t('turso.schemaBranching', 'Schema Branching')}
          </label>
          <label className="flex items-center gap-2 text-sm text-warm-300 cursor-pointer">
            <input type="checkbox" checked={enableEmbeddedReplica} onChange={e => setEnableEmbeddedReplica(e.target.checked)} className="rounded" />
            {t('turso.embeddedReplica', 'Embedded Replica')}
          </label>
          <label className="flex items-center gap-2 text-sm text-warm-300 cursor-pointer">
            <input type="checkbox" checked={enableGlobalReplication} onChange={e => setEnableGlobalReplication(e.target.checked)} className="rounded" />
            {t('turso.globalReplication', 'Global Replication')}
          </label>
        </div>
        {enableVectorSearch && (
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('turso.vectorDimensions', 'Vector Dimensions')}</label>
            <input type="number" value={vectorDimensions} onChange={e => setVectorDimensions(Number(e.target.value))} className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm" />
          </div>
        )}
        <button onClick={handleProvision} disabled={loading || !projectName} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? t('turso.provisioning', 'Provisioning...') : t('turso.provision', 'Provision Database')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('turso.dbInfo', 'Database Info')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('turso.dbName', 'Database')}</div>
                <div className="text-white text-sm font-bold truncate">{result.database.databaseName}</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('turso.regionLabel', 'Region')}</div>
                <div className="text-white text-sm font-bold">{result.database.region}</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('turso.provisionTime', 'Provision Time')}</div>
                <div className="text-green-400 text-sm font-bold">{result.provisionTimeMs}ms</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('turso.connectionUrl', 'Connection')}</div>
                <div className="text-blue-400 text-xs font-mono truncate">{result.connectionUrl}</div>
              </div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('turso.features', 'Features')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {result.features.vectorSearch && (
                <div className="bg-warm-700 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-400 text-xs">{'\u2713'}</span>
                    <span className="text-white text-sm font-medium">{t('turso.vectorSearch', 'Vector Search')}</span>
                  </div>
                  <div className="text-warm-400 text-xs">{result.features.vectorSearch.dimensions}d {result.features.vectorSearch.similarity}</div>
                </div>
              )}
              {result.features.schemaBranching && (
                <div className="bg-warm-700 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-400 text-xs">{'\u2713'}</span>
                    <span className="text-white text-sm font-medium">{t('turso.schemaBranching', 'Schema Branching')}</span>
                  </div>
                  <div className="text-warm-400 text-xs">{result.features.schemaBranching.activeBranches} branch(es), main: {result.features.schemaBranching.mainBranch}</div>
                </div>
              )}
              {result.features.embeddedReplica && (
                <div className="bg-warm-700 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-400 text-xs">{'\u2713'}</span>
                    <span className="text-white text-sm font-medium">{t('turso.embeddedReplica', 'Embedded Replica')}</span>
                  </div>
                  <div className="text-warm-400 text-xs">sync: {result.features.embeddedReplica.syncInterval}, offline: {result.features.embeddedReplica.offlineCapable ? 'yes' : 'no'}</div>
                </div>
              )}
              {result.features.globalReplication && (
                <div className="bg-warm-700 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-400 text-xs">{'\u2713'}</span>
                    <span className="text-white text-sm font-medium">{t('turso.globalReplication', 'Global Replication')}</span>
                  </div>
                  <div className="text-warm-400 text-xs">{result.features.globalReplication.replicas.length} replicas: {result.features.globalReplication.replicas.join(', ')}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HistoryTab() {
  const { t } = useTranslation()
  const [databases, setDatabases] = useState<TursoDatabase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { listDatabases().then(setDatabases).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>
  if (!databases.length) return <div className="text-warm-400 text-sm">{t('turso.noHistory', 'No databases provisioned yet.')}</div>

  return (
    <div className="space-y-2">
      {databases.map(d => (
        <div key={d.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white text-sm font-medium">{d.databaseName} <span className="text-warm-500">({d.projectName})</span></div>
            <div className="text-warm-500 text-xs mt-1">
              {d.region} | {d.replicaCount} replicas | {(d.sizeBytes / 1024).toFixed(0)}KB | {d.tableCount} tables | {d.readLatencyMs}ms read
              {d.vectorSearchEnabled && ' | vector'}
              {d.schemaBranchingEnabled && ` | ${d.activeBranches} branches`}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded ${d.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-warm-700 text-warm-400'}`}>{d.status}</span>
            <span className="text-warm-500 text-xs">{new Date(d.createdAt).toLocaleDateString()}</span>
            <button onClick={async () => { await deleteDatabase(d.id); setDatabases(p => p.filter(x => x.id !== d.id)) }} className="text-red-400 hover:text-red-300 text-xs">{t('common.delete', 'Delete')}</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function RegionsTab() {
  const { t } = useTranslation()
  const [regions, setRegions] = useState<TursoRegion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getRegions().then(setRegions).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>

  const features = [
    { name: t('turso.feat.edgeNative', 'Edge-Native SQLite'), desc: t('turso.feat.edgeNativeDesc', 'Database runs alongside your app with sub-millisecond local reads via embedded replicas') },
    { name: t('turso.feat.vectorSearch', 'Built-in Vector Search'), desc: t('turso.feat.vectorSearchDesc', 'Native vector similarity search for AI features without external vector databases') },
    { name: t('turso.feat.branching', 'Schema Branching'), desc: t('turso.feat.branchingDesc', 'Create database branches for preview environments, just like git branches for code') }
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {regions.map(r => (
          <div key={r.id} className="bg-warm-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{r.name}</span>
              <span className="text-green-400 text-xs">{r.latency}</span>
            </div>
            <p className="text-warm-400 text-sm font-mono">{r.id}</p>
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
  const [stats, setStats] = useState<TursoStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getTursoStats().then(setStats).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>
  if (!stats || stats.totalDatabases === 0) return <div className="text-warm-400 text-sm">{t('turso.noStats', 'No Turso database statistics yet.')}</div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('turso.stats.databases', 'Total Databases')}</div>
          <div className="text-white text-xl font-bold">{stats.totalDatabases}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('turso.stats.replicas', 'Total Replicas')}</div>
          <div className="text-white text-xl font-bold">{stats.totalReplicas}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('turso.stats.readLatency', 'Avg Read Latency')}</div>
          <div className="text-green-400 text-xl font-bold">{stats.avgReadLatencyMs}ms</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('turso.stats.vectorEnabled', 'Vector Enabled')}</div>
          <div className="text-blue-400 text-xl font-bold">{stats.vectorEnabled}</div>
        </div>
      </div>
      {stats.byRegion && stats.byRegion.length > 0 && (
        <div className="bg-warm-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">{t('turso.stats.byRegion', 'By Region')}</h3>
          <div className="space-y-2">
            {stats.byRegion.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-warm-700 rounded p-2">
                <span className="text-white text-sm">{r.region}</span>
                <div className="flex gap-4">
                  <span className="text-warm-400 text-sm">{r.count} databases</span>
                  <span className="text-green-400 text-sm">{r.avgReadLatencyMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
