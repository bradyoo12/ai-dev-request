import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listDeployments, deploy, deleteDeployment, getWorkersAiStats, getAiModels } from '../api/workersai'
import type { WorkersAiDeployment, DeployResponse, AiModel, WorkersAiStats } from '../api/workersai'

type Tab = 'deploy' | 'history' | 'models' | 'stats'

export default function WorkersAiPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('deploy')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">{t('workersai.title', 'Cloudflare Workers AI')}</h2>
        <p className="text-warm-400 text-sm mt-1">{t('workersai.subtitle', 'Edge-deployed AI inference across 180+ global locations with zero cold starts')}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(['deploy', 'history', 'models', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'}`}>
            {t(`workersai.tab.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'deploy' && <DeployTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'models' && <ModelsTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function DeployTab() {
  const { t } = useTranslation()
  const [projectName, setProjectName] = useState('')
  const [modelId, setModelId] = useState('@cf/meta/llama-3.1-8b-instruct')
  const [modelCategory, setModelCategory] = useState('text-generation')
  const [edgeRegion, setEdgeRegion] = useState('auto')
  const [customModel, setCustomModel] = useState(false)
  const [customModelSource, setCustomModelSource] = useState('huggingface')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DeployResponse | null>(null)

  const handleDeploy = async () => {
    if (!projectName) return
    setLoading(true)
    try {
      const res = await deploy(projectName, modelId, modelCategory, edgeRegion, customModel, customModel ? customModelSource : null)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-warm-800 rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-sm text-warm-400 mb-1">{t('workersai.projectName', 'Project Name')}</label>
          <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="my-ai-project" className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('workersai.modelCategory', 'Model Category')}</label>
            <select value={modelCategory} onChange={e => setModelCategory(e.target.value)} className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm">
              <option value="text-generation">Text Generation</option>
              <option value="embeddings">Embeddings</option>
              <option value="image-classification">Image Classification</option>
              <option value="speech-to-text">Speech to Text</option>
              <option value="translation">Translation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('workersai.edgeRegion', 'Edge Region')}</label>
            <select value={edgeRegion} onChange={e => setEdgeRegion(e.target.value)} className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm">
              <option value="auto">Auto (Global)</option>
              <option value="us">US</option>
              <option value="eu">Europe</option>
              <option value="ap">Asia Pacific</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-warm-400 mb-1">{t('workersai.model', 'Model')}</label>
          <select value={modelId} onChange={e => setModelId(e.target.value)} className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm">
            <option value="@cf/meta/llama-3.1-8b-instruct">Llama 3.1 8B Instruct (Meta)</option>
            <option value="@cf/mistral/mistral-7b-instruct-v0.2">Mistral 7B Instruct (Mistral AI)</option>
            <option value="@cf/baai/bge-large-en-v1.5">BGE Large EN v1.5 (BAAI)</option>
            <option value="@cf/openai/whisper">Whisper (OpenAI)</option>
            <option value="@cf/microsoft/resnet-50">ResNet-50 (Microsoft)</option>
            <option value="@cf/meta/m2m100-1.2b">M2M100 1.2B (Meta)</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-warm-300 cursor-pointer">
          <input type="checkbox" checked={customModel} onChange={e => setCustomModel(e.target.checked)} className="rounded" />
          {t('workersai.customModel', 'Custom Model')}
        </label>
        {customModel && (
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('workersai.modelSource', 'Model Source')}</label>
            <select value={customModelSource} onChange={e => setCustomModelSource(e.target.value)} className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm">
              <option value="huggingface">Hugging Face</option>
              <option value="upload">Direct Upload</option>
            </select>
          </div>
        )}
        <button onClick={handleDeploy} disabled={loading || !projectName} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? t('workersai.deploying', 'Deploying...') : t('workersai.deploy', 'Deploy to Edge')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('workersai.deploymentInfo', 'Deployment Info')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('workersai.endpoint', 'Endpoint')}</div>
                <div className="text-blue-400 text-xs font-mono truncate">{result.endpoint}</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('workersai.edgeLocations', 'Edge Locations')}</div>
                <div className="text-white text-lg font-bold">{result.deployment.edgeLocations}+</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('workersai.latency', 'Latency')}</div>
                <div className="text-green-400 text-lg font-bold">{result.deployment.inferenceLatencyMs}ms</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('workersai.deployTime', 'Deploy Time')}</div>
                <div className="text-white text-lg font-bold">{result.deployTimeMs}ms</div>
              </div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('workersai.pricing', 'Pricing')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-warm-700 rounded p-2 flex justify-between">
                <span className="text-warm-400 text-sm">Input Tokens</span>
                <span className="text-white text-sm">{result.pricing.inputTokens}</span>
              </div>
              <div className="bg-warm-700 rounded p-2 flex justify-between">
                <span className="text-warm-400 text-sm">Output Tokens</span>
                <span className="text-white text-sm">{result.pricing.outputTokens}</span>
              </div>
              <div className="bg-warm-700 rounded p-2 flex justify-between">
                <span className="text-warm-400 text-sm">Image Inference</span>
                <span className="text-white text-sm">{result.pricing.imageInference}</span>
              </div>
              <div className="bg-warm-700 rounded p-2 flex justify-between">
                <span className="text-warm-400 text-sm">Embedding Tokens</span>
                <span className="text-white text-sm">{result.pricing.embeddingTokens}</span>
              </div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('workersai.capabilities', 'Capabilities')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(result.capabilities).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className={val ? 'text-green-400' : 'text-warm-500'}>{val ? '\u2713' : '\u2717'}</span>
                  <span className="text-warm-300">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
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
  const [deployments, setDeployments] = useState<WorkersAiDeployment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { listDeployments().then(setDeployments).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>
  if (!deployments.length) return <div className="text-warm-400 text-sm">{t('workersai.noHistory', 'No deployments yet.')}</div>

  return (
    <div className="space-y-2">
      {deployments.map(d => (
        <div key={d.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white text-sm font-medium">{d.projectName}: <span className="text-blue-400 font-mono">{d.modelId}</span></div>
            <div className="text-warm-500 text-xs mt-1">
              {d.modelCategory} | {d.edgeLocations} locations | {d.inferenceLatencyMs}ms | {d.successRate}% success
              {d.customModel && ` | custom (${d.customModelSource})`}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded ${d.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-warm-700 text-warm-400'}`}>{d.status}</span>
            <span className="text-warm-500 text-xs">{new Date(d.createdAt).toLocaleDateString()}</span>
            <button onClick={async () => { await deleteDeployment(d.id); setDeployments(p => p.filter(x => x.id !== d.id)) }} className="text-red-400 hover:text-red-300 text-xs">{t('common.delete', 'Delete')}</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ModelsTab() {
  const { t } = useTranslation()
  const [models, setModels] = useState<AiModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getAiModels().then(setModels).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>

  const features = [
    { name: t('workersai.feat.zeroCold', 'Zero Cold Starts'), desc: t('workersai.feat.zeroColdDesc', 'Infire Engine eliminates cold start delays for instant LLM inference at the edge') },
    { name: t('workersai.feat.serverless', 'Serverless GPU'), desc: t('workersai.feat.serverlessDesc', 'No infrastructure to manage — pay only for inference with automatic scaling') },
    { name: t('workersai.feat.globalEdge', 'Global Edge Network'), desc: t('workersai.feat.globalEdgeDesc', 'Run AI models at 180+ Cloudflare edge locations for sub-100ms latency worldwide') }
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {models.map(m => (
          <div key={m.id} className="bg-warm-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{m.name}</span>
              {m.popular && <span className="text-green-400 text-xs">{t('workersai.popular', 'Popular')}</span>}
            </div>
            <div className="flex gap-3 text-xs text-warm-400">
              <span className="bg-warm-700 px-2 py-1 rounded">{m.category}</span>
              <span>{m.provider}</span>
            </div>
            <p className="text-warm-500 text-xs mt-2 font-mono">{m.id}</p>
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
  const [stats, setStats] = useState<WorkersAiStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getWorkersAiStats().then(setStats).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>
  if (!stats || stats.totalDeployments === 0) return <div className="text-warm-400 text-sm">{t('workersai.noStats', 'No Workers AI statistics yet.')}</div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('workersai.stats.deployments', 'Total Deployments')}</div>
          <div className="text-white text-xl font-bold">{stats.totalDeployments}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('workersai.stats.inferences', 'Total Inferences')}</div>
          <div className="text-white text-xl font-bold">{stats.totalInferences}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('workersai.stats.latency', 'Avg Latency')}</div>
          <div className="text-green-400 text-xl font-bold">{stats.avgLatencyMs}ms</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('workersai.stats.successRate', 'Avg Success')}</div>
          <div className="text-green-400 text-xl font-bold">{stats.avgSuccessRate}%</div>
        </div>
      </div>
      {stats.byCategory && stats.byCategory.length > 0 && (
        <div className="bg-warm-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">{t('workersai.stats.byCategory', 'By Category')}</h3>
          <div className="space-y-2">
            {stats.byCategory.map((c, i) => (
              <div key={i} className="flex items-center justify-between bg-warm-700 rounded p-2">
                <span className="text-white text-sm">{c.category}</span>
                <div className="flex gap-4">
                  <span className="text-warm-400 text-sm">{c.count} deployments</span>
                  <span className="text-green-400 text-sm">{c.avgLatencyMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
