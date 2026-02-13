import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listWorkflows, deployWorkflow, deleteWorkflow, getWorkflowStats, getStrategies } from '../api/agenticworkflows'
import type { AgenticWorkflow, DeployResponse, DeployStrategy, WorkflowStats } from '../api/agenticworkflows'

type Tab = 'deploy' | 'history' | 'strategies' | 'stats'

export default function AgenticWorkflowsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('deploy')
  const [project, setProject] = useState('')
  const [workflowName, setWorkflowName] = useState('')
  const [version, setVersion] = useState('v1.0')
  const [strategy, setStrategy] = useState('canary')
  const [result, setResult] = useState<DeployResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<AgenticWorkflow[]>([])
  const [strategies, setStrategies] = useState<DeployStrategy[]>([])
  const [stats, setStats] = useState<WorkflowStats>({ total: 0, byStrategy: [] })

  useEffect(() => {
    if (tab === 'history') listWorkflows().then(setHistory)
    if (tab === 'strategies') getStrategies().then(setStrategies)
    if (tab === 'stats') getWorkflowStats().then(setStats)
  }, [tab])

  const handleDeploy = async () => {
    if (!project || !workflowName) return
    setLoading(true)
    try {
      const r = await deployWorkflow(project, workflowName, version, strategy)
      setResult(r)
    } finally {
      setLoading(false)
    }
  }

  const healthColor = (h: string) => {
    switch (h) {
      case 'healthy': return 'text-green-400'
      case 'degraded': return 'text-yellow-400'
      case 'critical': return 'text-red-400'
      case 'rolled-back': return 'text-red-400'
      default: return 'text-warm-400'
    }
  }

  const riskColor = (r: string) => {
    switch (r) {
      case 'low': return 'bg-green-600'
      case 'medium': return 'bg-yellow-600'
      case 'high': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const alertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-900/30 text-red-400 border-red-700'
      case 'warning': return 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
      case 'info': return 'bg-blue-900/30 text-blue-400 border-blue-700'
      default: return 'bg-warm-700 text-warm-400 border-warm-600'
    }
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('workflows.title', 'Production Agentic Workflows')}</h3>
      <div className="flex gap-2 mb-6">
        {(['deploy', 'history', 'strategies', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-400 hover:text-white'}`}
          >{t(`workflows.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}</button>
        ))}
      </div>

      {tab === 'deploy' && (
        <div className="bg-warm-800 rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('workflows.project', 'Project Name')}</label>
              <input value={project} onChange={e => setProject(e.target.value)} placeholder="my-project"
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('workflows.name', 'Workflow Name')}</label>
              <input value={workflowName} onChange={e => setWorkflowName(e.target.value)} placeholder="code-review-agent"
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('workflows.version', 'Version')}</label>
              <input value={version} onChange={e => setVersion(e.target.value)} placeholder="v1.0"
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('workflows.strategy', 'Deployment Strategy')}</label>
              <select value={strategy} onChange={e => setStrategy(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white">
                <option value="canary">Canary (5% → 100%)</option>
                <option value="blue-green">Blue-Green (instant switch)</option>
                <option value="rolling">Rolling (gradual)</option>
                <option value="full">Full (immediate)</option>
              </select>
            </div>
          </div>
          <button onClick={handleDeploy} disabled={loading || !project || !workflowName}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? t('workflows.deploying', 'Deploying...') : t('workflows.deploy', 'Deploy Workflow')}
          </button>

          {result && (
            <div className="mt-6 bg-warm-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">{t('workflows.result', 'Deployment Result')}</h4>
                <span className={`text-lg font-bold ${healthColor(result.healthStatus)}`}>
                  {result.healthStatus.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('workflows.successRate', 'Success Rate')}</div>
                  <div className="text-xl font-bold text-white">{result.successRate}%</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('workflows.latency', 'Avg Latency')}</div>
                  <div className="text-xl font-bold text-white">{result.avgLatencyMs}ms</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('workflows.cost', 'Cost/Request')}</div>
                  <div className="text-xl font-bold text-white">${result.costPerRequest}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('workflows.rollout', 'Rollout')}</div>
                  <div className="text-xl font-bold text-white">{result.rolloutPercent}%</div>
                </div>
              </div>
              {result.rollbackTriggered && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-4">
                  <div className="text-red-400 text-sm font-medium">{t('workflows.rollback', 'Rollback Triggered')}</div>
                  <div className="text-white text-sm mt-1">{result.rollbackReason}</div>
                  <div className="text-warm-400 text-xs mt-1">{t('workflows.rolledTo', 'Rolled back to')}: {result.rollbackVersion}</div>
                </div>
              )}
              {result.alerts.length > 0 && (
                <div className="space-y-2 mb-4">
                  <div className="text-warm-400 text-sm">{t('workflows.alerts', 'Monitoring Alerts')}</div>
                  {result.alerts.map((a, i) => (
                    <div key={i} className={`border rounded-lg p-2 text-sm ${alertColor(a.type)}`}>
                      [{a.type.toUpperCase()}] {a.message}
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-warm-800 rounded-lg p-3">
                <div className="text-warm-400 text-sm mb-1">{t('workflows.recommendation', 'Recommendation')}</div>
                <div className="text-white text-sm">{result.recommendation}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 && <div className="text-warm-400 text-center py-8">{t('workflows.noHistory', 'No deployments yet')}</div>}
          {history.map(w => (
            <div key={w.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{w.workflowName}</span>
                  <span className="bg-warm-700 text-warm-300 px-2 py-0.5 rounded text-xs">{w.workflowVersion}</span>
                  <span className="bg-warm-700 text-warm-300 px-2 py-0.5 rounded text-xs">{w.deploymentStrategy}</span>
                  <span className={`text-xs font-medium ${healthColor(w.healthStatus)}`}>{w.healthStatus}</span>
                </div>
                <div className="text-warm-400 text-sm mt-1">
                  {w.projectName} | {(w.successRate * 100).toFixed(1)}% success | {w.rolloutPercent}% rollout |
                  {w.rollbackTriggered && ' Rolled back |'}
                  {new Date(w.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button onClick={async () => { await deleteWorkflow(w.id); setHistory(h => h.filter(x => x.id !== w.id)) }}
                className="text-red-400 hover:text-red-300 text-sm">{t('common.delete', 'Delete')}</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'strategies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map(s => (
            <div key={s.id} className="bg-warm-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">{s.name}</h4>
                <span className={`${riskColor(s.riskLevel)} text-white text-xs px-2 py-1 rounded`}>{s.riskLevel} risk</span>
              </div>
              <p className="text-warm-400 text-sm mb-2">{s.description}</p>
              <div className="text-warm-300 text-xs mb-3 font-mono bg-warm-700 rounded px-2 py-1">{s.rollout}</div>
              <ul className="space-y-1">
                {s.features.map(f => (
                  <li key={f} className="text-warm-300 text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div>
          <div className="bg-warm-800 rounded-lg p-6 mb-4">
            <div className="text-warm-400 text-sm">{t('workflows.totalDeploys', 'Total Deployments')}</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.byStrategy.map(s => (
              <div key={s.strategy} className="bg-warm-800 rounded-lg p-4">
                <div className="text-white font-medium">{s.strategy}</div>
                <div className="text-warm-400 text-sm mt-1">
                  {t('workflows.stats.count', 'Count')}: {s.count} | {t('workflows.stats.avgSuccess', 'Avg Success')}: {s.avgSuccess}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
