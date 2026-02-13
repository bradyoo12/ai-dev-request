import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listWorkflows,
  createWorkflow,
  executeWorkflow,
  pauseWorkflow,
  getNodeTypes,
  getTemplates,
  getLangGraphStats,
  type LangGraphWorkflow,
  type NodeType,
  type WorkflowTemplate,
  type LangGraphStats,
} from '../api/langgraph'

type LangGraphTab = 'create' | 'workflows' | 'templates' | 'stats'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-700 text-slate-300',
  running: 'bg-blue-600 text-white animate-pulse',
  completed: 'bg-green-600 text-white',
  failed: 'bg-red-600 text-white',
  paused: 'bg-yellow-700 text-yellow-200',
}

export default function LangGraphPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<LangGraphTab>('create')
  const [workflows, setWorkflows] = useState<LangGraphWorkflow[]>([])
  const [nodeTypes, setNodeTypes] = useState<NodeType[]>([])
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [stats, setStats] = useState<LangGraphStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Create form
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedNodes, setSelectedNodes] = useState<string[]>(['analyzer', 'generator', 'reviewer'])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadNodeTypes()
  }, [])

  useEffect(() => {
    if (tab === 'workflows') loadWorkflows()
    if (tab === 'templates') loadTemplates()
    if (tab === 'stats') loadStatsData()
  }, [tab])

  async function loadNodeTypes() {
    try {
      const data = await getNodeTypes()
      setNodeTypes(data)
    } catch { /* ignore */ }
  }

  async function loadWorkflows() {
    setLoading(true)
    try {
      const data = await listWorkflows()
      setWorkflows(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadTemplates() {
    setLoading(true)
    try {
      const data = await getTemplates()
      setTemplates(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStatsData() {
    setLoading(true)
    try {
      const data = await getLangGraphStats()
      setStats(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    try {
      await createWorkflow(name, description, selectedNodes)
      setName('')
      setDescription('')
      setSelectedNodes(['analyzer', 'generator', 'reviewer'])
      setTab('workflows')
      loadWorkflows()
    } catch { /* ignore */ }
    setCreating(false)
  }

  async function handleExecute(id: string) {
    try {
      const updated = await executeWorkflow(id)
      setWorkflows(prev => prev.map(w => w.id === id ? updated : w))
    } catch { /* ignore */ }
  }

  async function handlePause(id: string) {
    try {
      const updated = await pauseWorkflow(id)
      setWorkflows(prev => prev.map(w => w.id === id ? updated : w))
    } catch { /* ignore */ }
  }

  async function handleCreateFromTemplate(tmpl: WorkflowTemplate) {
    setCreating(true)
    try {
      await createWorkflow(tmpl.name, tmpl.description, tmpl.nodeTypes)
      setTab('workflows')
      loadWorkflows()
    } catch { /* ignore */ }
    setCreating(false)
  }

  function toggleNode(nodeId: string) {
    setSelectedNodes(prev =>
      prev.includes(nodeId) ? prev.filter(n => n !== nodeId) : [...prev, nodeId]
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('langgraph.title', 'LangGraph Orchestration')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('langgraph.subtitle', 'Multi-agent workflow orchestration for code generation pipelines')}</p>
      </div>

      <div className="flex gap-2">
        {(['create', 'workflows', 'templates', 'stats'] as LangGraphTab[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`langgraph.tabs.${tabId}`, tabId === 'create' ? 'Create' : tabId === 'workflows' ? 'Workflows' : tabId === 'templates' ? 'Templates' : 'Stats')}
          </button>
        ))}
      </div>

      {/* Create Tab */}
      {tab === 'create' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('langgraph.createWorkflow', 'Create Workflow')}</h4>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('langgraph.workflowName', 'Workflow Name')}</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                placeholder={t('langgraph.namePlaceholder', 'e.g., Full-Stack Code Review Pipeline')}
              />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('langgraph.description', 'Description')}</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                placeholder={t('langgraph.descriptionPlaceholder', 'Describe what this workflow does...')}
              />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-2">{t('langgraph.selectNodes', 'Select Agent Nodes')}</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {nodeTypes.map(nt => (
                  <button
                    key={nt.id}
                    onClick={() => toggleNode(nt.id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedNodes.includes(nt.id)
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-warm-600 bg-warm-700 hover:border-warm-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: nt.color }}
                      />
                      <span className="text-sm text-white font-medium">{nt.name}</span>
                    </div>
                    <p className="text-xs text-warm-400 mt-1 line-clamp-2">{nt.description}</p>
                  </button>
                ))}
              </div>
            </div>
            {selectedNodes.length > 0 && (
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('langgraph.pipeline', 'Pipeline')}</label>
                <div className="flex items-center gap-1 flex-wrap">
                  {selectedNodes.map((nodeId, idx) => {
                    const nt = nodeTypes.find(n => n.id === nodeId)
                    return (
                      <span key={`${nodeId}-${idx}`} className="flex items-center gap-1">
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{ backgroundColor: nt?.color || '#6b7280', color: 'white' }}
                        >
                          {nt?.name || nodeId}
                        </span>
                        {idx < selectedNodes.length - 1 && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warm-500">
                            <path d="M5 12h14m-7-7 7 7-7 7" />
                          </svg>
                        )}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim() || selectedNodes.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? t('langgraph.creating', 'Creating...') : t('langgraph.createBtn', 'Create Workflow')}
            </button>
          </div>
        </div>
      )}

      {/* Workflows Tab */}
      {tab === 'workflows' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('langgraph.loading', 'Loading...')}</p>
          ) : workflows.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('langgraph.noWorkflows', 'No workflows yet. Create your first workflow or use a template!')}</p>
            </div>
          ) : (
            workflows.map(wf => (
              <div key={wf.id} className="bg-warm-800 rounded-lg p-4 border border-warm-700">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium truncate">{wf.workflowName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[wf.status] || 'bg-warm-700 text-warm-300'}`}>
                        {wf.status}
                      </span>
                    </div>
                    {wf.description && (
                      <p className="text-warm-400 text-sm mt-1 truncate">{wf.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-warm-500">
                      <span>{wf.completedNodes}/{wf.totalNodes} {t('langgraph.nodes', 'nodes')}</span>
                      <span>{wf.totalExecutions} {t('langgraph.executions', 'runs')}</span>
                      {wf.avgExecutionTimeMs > 0 && (
                        <span>{Math.round(wf.avgExecutionTimeMs)}ms {t('langgraph.avgTime', 'avg')}</span>
                      )}
                      {wf.cacheHitsCount > 0 && (
                        <span>{wf.cacheHitsCount} {t('langgraph.cacheHits', 'cache hits')}</span>
                      )}
                      <span>{new Date(wf.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {wf.status !== 'completed' && wf.status !== 'running' && (
                      <button
                        onClick={() => handleExecute(wf.id)}
                        className="px-3 py-1 bg-green-700 text-white rounded text-xs hover:bg-green-600"
                      >
                        {t('langgraph.execute', 'Execute')}
                      </button>
                    )}
                    {(wf.status === 'draft' || wf.status === 'paused') && (
                      <button
                        onClick={() => handlePause(wf.id)}
                        className="px-3 py-1 bg-warm-700 text-warm-300 rounded text-xs hover:bg-warm-600"
                      >
                        {wf.status === 'paused' ? t('langgraph.resume', 'Resume') : t('langgraph.pause', 'Pause')}
                      </button>
                    )}
                  </div>
                </div>
                {/* Node visualization */}
                {wf.nodesJson && wf.nodesJson !== '[]' && (
                  <div className="mt-3 pt-3 border-t border-warm-700">
                    <div className="flex items-center gap-1 flex-wrap">
                      {(() => {
                        try {
                          const nodes = JSON.parse(wf.nodesJson) as { id: string; name: string; status: string; type: string }[]
                          return nodes.map((node, idx) => {
                            const nt = nodeTypes.find(n => n.id === node.type)
                            return (
                              <span key={node.id} className="flex items-center gap-1">
                                <span
                                  className={`text-xs px-2 py-1 rounded border ${
                                    node.status === 'completed' ? 'border-green-600 bg-green-900/30 text-green-300' :
                                    node.status === 'failed' ? 'border-red-600 bg-red-900/30 text-red-300' :
                                    'border-warm-600 bg-warm-700 text-warm-300'
                                  }`}
                                >
                                  <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ backgroundColor: nt?.color || '#6b7280' }} />
                                  {node.name}
                                </span>
                                {idx < nodes.length - 1 && (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warm-600">
                                    <path d="M5 12h14m-7-7 7 7-7 7" />
                                  </svg>
                                )}
                              </span>
                            )
                          })
                        } catch { return null }
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('langgraph.loading', 'Loading...')}</p>
          ) : templates.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('langgraph.noTemplates', 'No templates available.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(tmpl => (
                <div key={tmpl.id} className="bg-warm-800 rounded-lg p-5 border border-warm-700 hover:border-warm-500 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium text-sm">{tmpl.name}</h4>
                    <span className="text-xs px-2 py-0.5 bg-warm-700 text-warm-400 rounded capitalize">{tmpl.category}</span>
                  </div>
                  <p className="text-warm-400 text-xs mb-3">{tmpl.description}</p>
                  <div className="flex items-center gap-1 flex-wrap mb-3">
                    {tmpl.nodeNames.map((nodeName, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        <span className="text-xs px-2 py-0.5 bg-warm-700 text-warm-300 rounded">{nodeName}</span>
                        {idx < tmpl.nodeNames.length - 1 && (
                          <span className="text-warm-600 text-xs">&rarr;</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleCreateFromTemplate(tmpl)}
                    disabled={creating}
                    className="w-full py-2 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 disabled:opacity-50"
                  >
                    {t('langgraph.useTemplate', 'Use Template')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('langgraph.loading', 'Loading...')}</p>
          ) : !stats ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('langgraph.noStats', 'No statistics available yet.')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: t('langgraph.stats.totalWorkflows', 'Total Workflows'), value: stats.totalWorkflows },
                  { label: t('langgraph.stats.completed', 'Completed'), value: stats.completedWorkflows },
                  { label: t('langgraph.stats.successRate', 'Success Rate'), value: `${stats.successRate}%` },
                  { label: t('langgraph.stats.avgNodes', 'Avg Nodes'), value: stats.avgNodes },
                  { label: t('langgraph.stats.totalExecutions', 'Total Runs'), value: stats.totalExecutions },
                  { label: t('langgraph.stats.cacheHits', 'Cache Hits'), value: stats.totalCacheHits },
                ].map(s => (
                  <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {stats.recentWorkflows.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('langgraph.stats.recentWorkflows', 'Recent Workflows')}</h4>
                  <div className="space-y-2">
                    {stats.recentWorkflows.map(rw => (
                      <div key={rw.id} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">{rw.workflowName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[rw.status] || 'bg-warm-700 text-warm-300'}`}>
                            {rw.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-warm-500">
                          <span>{rw.completedNodes}/{rw.totalNodes}</span>
                          <span>{new Date(rw.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
