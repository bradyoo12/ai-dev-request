import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { FrameworkConfig, Framework, BackendOption, DatabaseOption, GeneratePreviewResult, FrameworkStats } from '../api/frameworkconfig'
import { getFrameworkConfig, updateFrameworkConfig, getFrameworks, getBackends, getDatabases, generatePreview, getFrameworkStats } from '../api/frameworkconfig'

type Tab = 'frameworks' | 'configure' | 'preview' | 'stats'

export default function MultiFrameworkPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('frameworks')
  const [config, setConfig] = useState<FrameworkConfig | null>(null)
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [backends, setBackends] = useState<BackendOption[]>([])
  const [databases, setDatabases] = useState<DatabaseOption[]>([])
  const [preview, setPreview] = useState<GeneratePreviewResult | null>(null)
  const [stats, setStats] = useState<FrameworkStats | null>(null)
  const [generating, setGenerating] = useState(false)
  const [filterTier, setFilterTier] = useState<number | null>(null)

  useEffect(() => {
    getFrameworkConfig().then(setConfig).catch(() => {})
    getFrameworks().then(setFrameworks).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'configure') {
      getBackends().then(setBackends).catch(() => {})
      getDatabases().then(setDatabases).catch(() => {})
    }
    if (tab === 'stats') getFrameworkStats().then(setStats).catch(() => {})
  }, [tab])

  const handleSelectFramework = async (frameworkId: string) => {
    try {
      await updateFrameworkConfig({ selectedFramework: frameworkId } as Partial<FrameworkConfig>)
      setConfig((prev) => prev ? { ...prev, selectedFramework: frameworkId } : prev)
    } catch { /* ignore */ }
  }

  const handleToggle = async (key: string, value: boolean) => {
    try {
      await updateFrameworkConfig({ [key]: value } as Partial<FrameworkConfig>)
      setConfig((prev) => prev ? { ...prev, [key]: value } : prev)
    } catch { /* ignore */ }
  }

  const handleGeneratePreview = async () => {
    setGenerating(true)
    try {
      const result = await generatePreview(config?.selectedFramework)
      setPreview(result)
    } catch { /* ignore */ }
    setGenerating(false)
  }

  const filteredFrameworks = filterTier ? frameworks.filter((f) => f.tier === filterTier) : frameworks

  const tierColors: Record<number, string> = { 1: 'bg-green-900/30 text-green-400', 2: 'bg-blue-900/30 text-blue-400', 3: 'bg-purple-900/30 text-purple-400' }
  const categoryColors: Record<string, string> = { 'Frontend': 'bg-cyan-900/30 text-cyan-400', 'Backend': 'bg-orange-900/30 text-orange-400', 'Full-Stack': 'bg-indigo-900/30 text-indigo-400', 'Mobile': 'bg-pink-900/30 text-pink-400' }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('multiFramework.title', 'Multi-Framework Generation')}</h3>
      <p className="text-warm-400 text-sm mb-6">{t('multiFramework.subtitle', 'Choose your preferred tech stack for AI-generated projects')}</p>

      <div className="flex gap-2 mb-6">
        {(['frameworks', 'configure', 'preview', 'stats'] as Tab[]).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t2 ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`multiFramework.tabs.${t2}`, t2.charAt(0).toUpperCase() + t2.slice(1))}
          </button>
        ))}
      </div>

      {tab === 'frameworks' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setFilterTier(null)} className={`px-3 py-1 rounded-full text-xs font-medium ${!filterTier ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400'}`}>
              {t('multiFramework.allTiers', 'All Tiers')}
            </button>
            {[1, 2, 3].map((tier) => (
              <button key={tier} onClick={() => setFilterTier(tier)} className={`px-3 py-1 rounded-full text-xs font-medium ${filterTier === tier ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400'}`}>
                {t(`multiFramework.tier${tier}`, `Tier ${tier}`)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFrameworks.map((fw) => (
              <div
                key={fw.id}
                onClick={() => handleSelectFramework(fw.id)}
                className={`bg-warm-800 border rounded-lg p-4 cursor-pointer transition-all ${
                  config?.selectedFramework === fw.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-warm-700 hover:border-warm-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{fw.name}</span>
                  <div className="flex gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${tierColors[fw.tier] || ''}`}>Tier {fw.tier}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[fw.category] || 'bg-warm-700 text-warm-400'}`}>{fw.category}</span>
                  </div>
                </div>
                <p className="text-xs text-warm-400 mb-3">{fw.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-warm-500">{fw.language}</span>
                  <div className="flex gap-1">
                    {fw.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-xs bg-warm-700 px-2 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
                {config?.selectedFramework === fw.id && (
                  <div className="mt-2 text-xs text-blue-400 font-medium">{t('multiFramework.selected', 'Selected')}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'configure' && config && (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">{t('multiFramework.backendSelection', 'Backend Framework')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {backends.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { updateFrameworkConfig({ selectedBackend: b.id } as Partial<FrameworkConfig>); setConfig({ ...config, selectedBackend: b.id }) }}
                  className={`p-3 rounded-lg border text-left ${config.selectedBackend === b.id ? 'border-blue-500 bg-blue-900/20' : 'border-warm-700 bg-warm-800'}`}
                >
                  <div className="font-medium text-sm">{b.name}</div>
                  <div className="text-xs text-warm-400">{b.description}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3">{t('multiFramework.databaseSelection', 'Database')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {databases.map((d) => (
                <button
                  key={d.id}
                  onClick={() => { updateFrameworkConfig({ selectedDatabase: d.id } as Partial<FrameworkConfig>); setConfig({ ...config, selectedDatabase: d.id }) }}
                  className={`p-3 rounded-lg border text-left ${config.selectedDatabase === d.id ? 'border-blue-500 bg-blue-900/20' : 'border-warm-700 bg-warm-800'}`}
                >
                  <div className="font-medium text-sm">{d.name}</div>
                  <div className="text-xs text-warm-400">{d.description}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3">{t('multiFramework.projectOptions', 'Project Options')}</h4>
            <div className="space-y-3">
              {([
                { key: 'includeDocker' as const, label: t('multiFramework.includeDocker', 'Include Docker'), desc: t('multiFramework.includeDockerDesc', 'Add Dockerfile and docker-compose.yml') },
                { key: 'includeCI' as const, label: t('multiFramework.includeCI', 'Include CI/CD'), desc: t('multiFramework.includeCIDesc', 'Add GitHub Actions workflow') },
                { key: 'includeTests' as const, label: t('multiFramework.includeTests', 'Include Tests'), desc: t('multiFramework.includeTestsDesc', 'Generate test suite with framework-appropriate tools') },
                { key: 'autoDetectStack' as const, label: t('multiFramework.autoDetect', 'Auto-Detect Stack'), desc: t('multiFramework.autoDetectDesc', 'Let AI suggest the best framework based on your request') },
              ]).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between bg-warm-800 border border-warm-700 rounded-lg p-4">
                  <div>
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs text-warm-400">{desc}</div>
                  </div>
                  <button
                    onClick={() => handleToggle(key, !config[key])}
                    className={`w-12 h-6 rounded-full transition-colors ${config[key] ? 'bg-blue-600' : 'bg-warm-600'}`}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${config[key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-warm-400">{t('multiFramework.currentStack', 'Current Stack')}</div>
              <div className="font-medium">{config?.selectedFramework || 'react-vite'} + {config?.selectedBackend || 'none'} + {config?.selectedDatabase || 'none'}</div>
            </div>
            <button
              onClick={handleGeneratePreview}
              disabled={generating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {generating ? t('multiFramework.generating', 'Generating...') : t('multiFramework.generatePreview', 'Generate Preview')}
            </button>
          </div>

          {preview && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">{t('multiFramework.projectStructure', 'Project Structure')}</h4>
                <div className="bg-warm-900 border border-warm-700 rounded-lg p-4">
                  <pre className="text-sm text-green-400 font-mono">
                    {preview.projectStructure.map((f, i) => (
                      <div key={i}>{f.endsWith('/') ? `📁 ${f}` : `📄 ${f}`}</div>
                    ))}
                  </pre>
                </div>
                <div className="text-sm text-warm-400">
                  {t('multiFramework.estimatedFiles', 'Estimated files')}: {preview.estimatedFiles}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium">{t('multiFramework.estimates', 'Generation Estimates')}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-warm-800 border border-warm-700 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold">{preview.estimatedTokens.toLocaleString()}</div>
                    <div className="text-xs text-warm-400">{t('multiFramework.tokens', 'Tokens')}</div>
                  </div>
                  <div className="bg-warm-800 border border-warm-700 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold">${preview.estimatedCost}</div>
                    <div className="text-xs text-warm-400">{t('multiFramework.cost', 'Cost')}</div>
                  </div>
                  <div className="bg-warm-800 border border-warm-700 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold">{preview.estimatedTimeSeconds}s</div>
                    <div className="text-xs text-warm-400">{t('multiFramework.time', 'Time')}</div>
                  </div>
                  <div className="bg-warm-800 border border-warm-700 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold">{preview.estimatedFiles}</div>
                    <div className="text-xs text-warm-400">{t('multiFramework.files', 'Files')}</div>
                  </div>
                </div>
                <h4 className="font-medium">{t('multiFramework.features', 'Features')}</h4>
                <div className="space-y-1">
                  {preview.features.map((f, i) => (
                    <div key={i} className="text-sm text-warm-300 flex items-center gap-2">
                      <span className="text-green-400">✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!preview && (
            <div className="flex items-center justify-center h-48 bg-warm-800/50 rounded-lg border border-dashed border-warm-600">
              <div className="text-center text-warm-500">
                <p className="text-sm">{t('multiFramework.previewPlaceholder', 'Click "Generate Preview" to see the project structure')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-warm-800 border border-warm-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <div className="text-sm text-warm-400">{t('multiFramework.stats.totalProjects', 'Total Projects')}</div>
            </div>
            <div className="bg-warm-800 border border-warm-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.frameworksUsed}</div>
              <div className="text-sm text-warm-400">{t('multiFramework.stats.frameworksUsed', 'Frameworks Used')}</div>
            </div>
            <div className="bg-warm-800 border border-warm-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.favoriteFramework}</div>
              <div className="text-sm text-warm-400">{t('multiFramework.stats.favorite', 'Favorite')}</div>
            </div>
          </div>
          {stats.recentProjects.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">{t('multiFramework.stats.recent', 'Recent Projects')}</h4>
              <div className="space-y-2">
                {stats.recentProjects.map((p, i) => (
                  <div key={i} className="bg-warm-800 border border-warm-700 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{p.projectName || 'Unnamed'}</span>
                      <span className="text-xs text-warm-400 ml-2">{p.framework}</span>
                    </div>
                    <span className="text-xs text-warm-500">{new Date(p.generatedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
