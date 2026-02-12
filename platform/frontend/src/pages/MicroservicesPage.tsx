import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  getBlueprints,
  getBlueprint,
  deleteBlueprint,
  type BlueprintSummary,
  type BlueprintDetail,
  type ServiceDef,
  type DependencyEdge,
} from '../api/microservices'
import { useAuth } from '../contexts/AuthContext'

const TYPE_COLORS: Record<string, string> = {
  gateway: 'bg-purple-900/40 text-purple-400',
  backend: 'bg-blue-900/40 text-blue-400',
  frontend: 'bg-green-900/40 text-green-400',
  database: 'bg-orange-900/40 text-orange-400',
  cache: 'bg-red-900/40 text-red-400',
}

export default function MicroservicesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [blueprints, setBlueprints] = useState<BlueprintSummary[]>([])
  const [selected, setSelected] = useState<BlueprintDetail | null>(null)
  const [services, setServices] = useState<ServiceDef[]>([])
  const [dependencies, setDependencies] = useState<DependencyEdge[]>([])
  const [activeTab, setActiveTab] = useState<'services' | 'dependencies' | 'docker' | 'k8s'>('services')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadBlueprints() {
    try {
      setLoading(true)
      const result = await getBlueprints()
      setBlueprints(result)
    } catch {
      setError(t('micro.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBlueprints() }, [])

  async function handleSelect(bp: BlueprintSummary) {
    try {
      const detail = await getBlueprint(bp.id)
      setSelected(detail)
      setServices(JSON.parse(detail.servicesJson))
      setDependencies(JSON.parse(detail.dependenciesJson))
    } catch {
      setError(t('micro.detailError'))
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteBlueprint(id)
      setBlueprints(prev => prev.filter(b => b.id !== id))
      if (selected?.id === id) {
        setSelected(null)
        setServices([])
        setDependencies([])
      }
    } catch {
      setError(t('micro.deleteError'))
    }
  }

  if (!authUser) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-2">{t('micro.title')}</h2>
        <p className="text-warm-400">{t('micro.loginRequired')}</p>
      </div>
    )
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto text-center py-8 text-warm-400">{t('micro.loading')}</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-warm-400 hover:text-white transition-colors">
          &larr;
        </button>
        <div>
          <h2 className="text-2xl font-bold">{t('micro.title')}</h2>
          <p className="text-sm text-warm-400 mt-1">{t('micro.description')}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {/* Blueprint List */}
      {!selected && (
        <div className="space-y-3">
          {blueprints.length === 0 ? (
            <div className="text-center py-12 bg-warm-800/50 rounded-lg">
              <p className="text-warm-400">{t('micro.empty')}</p>
              <p className="text-sm text-warm-500 mt-1">{t('micro.emptyHint')}</p>
            </div>
          ) : (
            blueprints.map((bp) => (
              <button
                key={bp.id}
                onClick={() => handleSelect(bp)}
                className="w-full bg-warm-800 rounded-lg p-4 flex items-center justify-between hover:bg-warm-750 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{bp.name}</p>
                  <p className="text-xs text-warm-500 mt-1">
                    {bp.serviceCount} {t('micro.services')} &middot; {new Date(bp.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-1 text-xs bg-blue-900/30 text-blue-400 rounded">
                    {bp.serviceCount} {t('micro.services')}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(bp.id) }}
                    className="px-2 py-1 text-xs bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors"
                  >
                    &times;
                  </button>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Blueprint Detail */}
      {selected && (
        <div className="space-y-4">
          <button
            onClick={() => { setSelected(null); setServices([]); setDependencies([]) }}
            className="text-sm text-warm-400 hover:text-white transition-colors"
          >
            &larr; {t('micro.backToList')}
          </button>

          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="font-semibold text-white text-lg">{selected.name}</h3>
            <p className="text-xs text-warm-500 mt-1">
              {selected.serviceCount} {t('micro.services')} &middot; {new Date(selected.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-warm-800 rounded-lg p-1">
            {(['services', 'dependencies', 'docker', 'k8s'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
                }`}
              >
                {t(`micro.tab.${tab}`)}
              </button>
            ))}
          </div>

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="grid gap-3 md:grid-cols-2">
              {services.map((svc) => (
                <div key={svc.Name} className="bg-warm-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[svc.Type] || 'bg-warm-700 text-warm-400'}`}>
                      {svc.Type}
                    </span>
                    <span className="text-xs text-warm-500">{svc.Tech}</span>
                    <span className="text-xs text-warm-600">:{svc.Port}</span>
                  </div>
                  <h4 className="text-sm font-medium text-white">{svc.Name}</h4>
                  <p className="text-xs text-warm-400 mt-1">{svc.Description}</p>
                  {svc.Endpoints.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {svc.Endpoints.map((ep, i) => (
                        <code key={i} className="block text-xs text-warm-500 font-mono">{ep}</code>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Dependencies Tab */}
          {activeTab === 'dependencies' && (
            <div className="space-y-2">
              {dependencies.map((dep, i) => (
                <div key={i} className="bg-warm-800 rounded-lg p-3 flex items-center gap-3">
                  <span className="text-sm font-mono text-blue-400">{dep.From}</span>
                  <span className="text-warm-500">&rarr;</span>
                  <span className="text-sm font-mono text-green-400">{dep.To}</span>
                  <span className="px-2 py-0.5 text-xs bg-warm-700 text-warm-300 rounded">{dep.Protocol}</span>
                  <span className="text-xs text-warm-500 flex-1 truncate">{dep.Description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Docker Compose Tab */}
          {activeTab === 'docker' && (
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-white">{t('micro.dockerCompose')}</h4>
                <button
                  onClick={() => navigator.clipboard.writeText(selected.dockerComposeYaml || '')}
                  className="px-2 py-1 text-xs bg-warm-700 text-warm-300 rounded hover:bg-warm-600 transition-colors"
                >
                  {t('micro.copy')}
                </button>
              </div>
              <pre className="text-xs text-warm-300 font-mono overflow-x-auto whitespace-pre max-h-96 overflow-y-auto">
                {selected.dockerComposeYaml || t('micro.noConfig')}
              </pre>
            </div>
          )}

          {/* K8s Tab */}
          {activeTab === 'k8s' && (
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-white">{t('micro.k8sManifest')}</h4>
                <button
                  onClick={() => navigator.clipboard.writeText(selected.k8sManifestYaml || '')}
                  className="px-2 py-1 text-xs bg-warm-700 text-warm-300 rounded hover:bg-warm-600 transition-colors"
                >
                  {t('micro.copy')}
                </button>
              </div>
              <pre className="text-xs text-warm-300 font-mono overflow-x-auto whitespace-pre max-h-96 overflow-y-auto">
                {selected.k8sManifestYaml || t('micro.noConfig')}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
