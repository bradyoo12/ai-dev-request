import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getWorkflows, createWorkflow, updateWorkflow, deleteWorkflow,
  generateWorkflow, executeWorkflow, getExecutionStatus,
} from '../api/visual-workflow'
import type { VisualWorkflow, WorkflowNode, WorkflowEdge, VisualWorkflowRun } from '../api/visual-workflow'

type ViewMode = 'list' | 'editor' | 'generate'

const NODE_TYPE_COLORS: Record<string, string> = {
  trigger: 'bg-green-600/30 border-green-500 text-green-400',
  action: 'bg-blue-600/30 border-blue-500 text-blue-400',
  condition: 'bg-yellow-600/30 border-yellow-500 text-yellow-400',
  approval: 'bg-purple-600/30 border-purple-500 text-purple-400',
  input: 'bg-cyan-600/30 border-cyan-500 text-cyan-400',
  transform: 'bg-orange-600/30 border-orange-500 text-orange-400',
  delay: 'bg-warm-600/30 border-warm-500 text-warm-400',
  end: 'bg-red-600/30 border-red-500 text-red-400',
}

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-warm-700 text-warm-300',
  Active: 'bg-green-900/50 text-green-400',
  Paused: 'bg-yellow-900/50 text-yellow-400',
  Archived: 'bg-warm-800 text-warm-500',
}

export default function VisualWorkflowPage() {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [workflows, setWorkflows] = useState<VisualWorkflow[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<VisualWorkflow | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Create/Edit form
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTriggerType, setFormTriggerType] = useState('manual')

  // AI Generation
  const [nlPrompt, setNlPrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  // Execution
  const [currentRun, setCurrentRun] = useState<VisualWorkflowRun | null>(null)
  const [executing, setExecuting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const data = await getWorkflows()
      setWorkflows(data)
    } catch { setError(t('visualWorkflow.error.loadFailed', 'Failed to load workflows')) }
    finally { setLoading(false) }
  }, [t])

  useEffect(() => { loadData() }, [loadData])

  const handleCreate = async () => {
    if (!formName.trim()) { setError(t('visualWorkflow.error.nameRequired', 'Name is required')); return }
    try {
      setError('')
      await createWorkflow({ name: formName, description: formDescription, triggerType: formTriggerType })
      setSuccess(t('visualWorkflow.createSuccess', 'Workflow created!'))
      setShowCreateDialog(false); resetForm(); loadData()
    } catch { setError(t('visualWorkflow.error.createFailed', 'Failed to create workflow')) }
  }

  const handleDelete = async (id: string) => {
    try {
      setError('')
      await deleteWorkflow(id)
      setSuccess(t('visualWorkflow.deleteSuccess', 'Workflow deleted!'))
      setDeleteConfirmId(null)
      if (selectedWorkflow?.id === id) { setSelectedWorkflow(null); setViewMode('list') }
      loadData()
    } catch { setError(t('visualWorkflow.error.deleteFailed', 'Failed to delete workflow')) }
  }

  const handleGenerate = async () => {
    if (!nlPrompt.trim()) { setError(t('visualWorkflow.error.promptRequired', 'Please describe the workflow you want to create')); return }
    try {
      setError(''); setGenerating(true)
      const workflow = await generateWorkflow(nlPrompt)
      setSuccess(t('visualWorkflow.generateSuccess', 'Workflow generated from your description!'))
      setSelectedWorkflow(workflow)
      setViewMode('editor')
      setNlPrompt('')
      loadData()
    } catch { setError(t('visualWorkflow.error.generateFailed', 'Failed to generate workflow')) }
    finally { setGenerating(false) }
  }

  const handleExecute = async (id: string) => {
    try {
      setError(''); setExecuting(true)
      const run = await executeWorkflow(id)
      setCurrentRun(run)
      setSuccess(t('visualWorkflow.executeSuccess', 'Workflow execution started!'))
      // Poll for status updates
      const pollInterval = setInterval(async () => {
        try {
          const status = await getExecutionStatus(id)
          setCurrentRun(status)
          if (status.status === 'Completed' || status.status === 'Failed' || status.status === 'Cancelled') {
            clearInterval(pollInterval)
            setExecuting(false)
          }
        } catch { clearInterval(pollInterval); setExecuting(false) }
      }, 1000)
    } catch { setError(t('visualWorkflow.error.executeFailed', 'Failed to execute workflow')); setExecuting(false) }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      setError('')
      await updateWorkflow(id, { status })
      setSuccess(t('visualWorkflow.statusUpdated', 'Status updated!'))
      loadData()
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow({ ...selectedWorkflow, status })
      }
    } catch { setError(t('visualWorkflow.error.updateFailed', 'Failed to update workflow')) }
  }

  const openEditor = (workflow: VisualWorkflow) => {
    setSelectedWorkflow(workflow)
    setViewMode('editor')
  }

  const resetForm = () => { setFormName(''); setFormDescription(''); setFormTriggerType('manual') }

  const parseNodes = (json: string): WorkflowNode[] => { try { return JSON.parse(json) } catch { return [] } }
  const parseEdges = (json: string): WorkflowEdge[] => { try { return JSON.parse(json) } catch { return [] } }

  if (loading) return <div className="text-center py-12 text-warm-400">{t('visualWorkflow.loading', 'Loading workflows...')}</div>

  return (
    <div className="space-y-6" data-testid="visual-workflow-page">
      {error && <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">{error}<button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button></div>}
      {success && <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-green-400">{success}<button onClick={() => setSuccess('')} className="ml-2 text-green-300 hover:text-white">&times;</button></div>}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{t('visualWorkflow.title', 'Visual Workflow Builder')}</h3>
          <p className="text-sm text-warm-400">{t('visualWorkflow.description', 'Design and automate business processes with a visual node editor and AI generation')}</p>
        </div>
        <div className="flex gap-2">
          {viewMode !== 'list' && (
            <button onClick={() => { setViewMode('list'); setSelectedWorkflow(null) }} className="bg-warm-700 hover:bg-warm-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              {t('visualWorkflow.backToList', 'Back to List')}
            </button>
          )}
          <button onClick={() => setViewMode('generate')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'generate' ? 'bg-purple-600 text-white' : 'bg-warm-700 hover:bg-warm-600 text-white'}`}>
            {t('visualWorkflow.aiGenerate', 'AI Generate')}
          </button>
          <button onClick={() => { resetForm(); setShowCreateDialog(true) }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {t('visualWorkflow.create', 'Create Workflow')}
          </button>
        </div>
      </div>

      {/* AI Generation Panel */}
      {viewMode === 'generate' && (
        <div className="bg-warm-900 rounded-xl p-6 border border-purple-700/30">
          <h4 className="text-md font-bold mb-3">{t('visualWorkflow.aiGenerateTitle', 'Generate Workflow with AI')}</h4>
          <p className="text-sm text-warm-400 mb-4">{t('visualWorkflow.aiGenerateDesc', 'Describe your workflow in natural language and AI will create the automation for you.')}</p>
          <textarea
            value={nlPrompt}
            onChange={e => setNlPrompt(e.target.value)}
            rows={4}
            className="w-full bg-warm-800 text-white rounded-lg px-4 py-3 text-sm border border-warm-700 focus:border-purple-500 outline-none resize-none mb-4"
            placeholder={t('visualWorkflow.aiPlaceholder', 'e.g., When a user submits a form, send an email notification, update the database, and call an external API for processing...')}
          />
          <div className="flex gap-2">
            <button onClick={() => setNlPrompt('When a user submits a support form, send email notification to the team, create a ticket in the database, and call Slack API to post in the support channel')} className="text-xs bg-warm-800 hover:bg-warm-700 text-warm-300 px-3 py-1.5 rounded-lg transition-colors">
              {t('visualWorkflow.example1', 'Support form workflow')}
            </button>
            <button onClick={() => setNlPrompt('Every day at 9am, check the database for pending orders, send reminder emails to customers, and update order status')} className="text-xs bg-warm-800 hover:bg-warm-700 text-warm-300 px-3 py-1.5 rounded-lg transition-colors">
              {t('visualWorkflow.example2', 'Daily order reminder')}
            </button>
            <button onClick={() => setNlPrompt('When a new employee is added, send welcome email, create accounts in HR system, assign default permissions, and notify the manager')} className="text-xs bg-warm-800 hover:bg-warm-700 text-warm-300 px-3 py-1.5 rounded-lg transition-colors">
              {t('visualWorkflow.example3', 'Employee onboarding')}
            </button>
          </div>
          <button onClick={handleGenerate} disabled={generating} className="mt-4 w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
            {generating ? t('visualWorkflow.generating', 'Generating workflow...') : t('visualWorkflow.generateButton', 'Generate Workflow')}
          </button>
        </div>
      )}

      {/* Workflow Editor */}
      {viewMode === 'editor' && selectedWorkflow && (
        <div className="space-y-4">
          <div className="bg-warm-900 rounded-xl p-6 border border-warm-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-md font-bold">{selectedWorkflow.name}</h4>
                {selectedWorkflow.description && <p className="text-sm text-warm-400 mt-1">{selectedWorkflow.description}</p>}
              </div>
              <div className="flex gap-2 items-center">
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[selectedWorkflow.status] || 'bg-warm-700 text-warm-300'}`}>{selectedWorkflow.status}</span>
                <select
                  value={selectedWorkflow.status}
                  onChange={e => handleStatusChange(selectedWorkflow.id, e.target.value)}
                  className="bg-warm-800 text-white text-xs rounded px-2 py-1 border border-warm-700"
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Archived">Archived</option>
                </select>
                <button onClick={() => handleExecute(selectedWorkflow.id)} disabled={executing} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  {executing ? t('visualWorkflow.executing', 'Executing...') : t('visualWorkflow.execute', 'Execute')}
                </button>
              </div>
            </div>

            <div className="flex gap-4 text-xs text-warm-400 mb-4">
              <span>{t('visualWorkflow.trigger', 'Trigger')}: <span className="text-white">{selectedWorkflow.triggerType}</span></span>
              <span>{t('visualWorkflow.nodes', 'Nodes')}: <span className="text-white">{parseNodes(selectedWorkflow.nodesJson).length}</span></span>
              <span>{t('visualWorkflow.edges', 'Edges')}: <span className="text-white">{parseEdges(selectedWorkflow.edgesJson).length}</span></span>
            </div>

            {selectedWorkflow.naturalLanguagePrompt && (
              <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-purple-400 font-medium mb-1">{t('visualWorkflow.generatedFrom', 'Generated from:')}</p>
                <p className="text-sm text-warm-300">{selectedWorkflow.naturalLanguagePrompt}</p>
              </div>
            )}

            {/* Visual Node Graph */}
            <div className="bg-warm-950 rounded-lg p-6 min-h-[400px] border border-warm-800 relative overflow-auto">
              <div className="flex flex-col items-center gap-2">
                {parseNodes(selectedWorkflow.nodesJson).map((node) => {
                  const colorClass = NODE_TYPE_COLORS[node.type] || NODE_TYPE_COLORS.action
                  const edges = parseEdges(selectedWorkflow.edgesJson)
                  const hasNextEdge = edges.some(e => e.source === node.id)
                  const runResults = currentRun ? JSON.parse(currentRun.nodeResultsJson || '{}') : {}
                  const nodeResult = runResults[node.id]
                  const isCurrentNode = currentRun?.currentNodeId === node.id

                  return (
                    <div key={node.id} className="flex flex-col items-center">
                      <div className={`relative px-6 py-3 rounded-lg border-2 min-w-[200px] text-center transition-all ${colorClass} ${isCurrentNode ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-warm-950 animate-pulse' : ''}`}>
                        <div className="text-[10px] uppercase tracking-wider opacity-60 mb-1">{node.type}</div>
                        <div className="font-medium text-sm">{node.label}</div>
                        {nodeResult && (
                          <div className={`text-[10px] mt-1 ${nodeResult.status === 'completed' ? 'text-green-400' : nodeResult.status === 'running' ? 'text-blue-400' : 'text-warm-400'}`}>
                            {nodeResult.status}
                          </div>
                        )}
                      </div>
                      {hasNextEdge && (
                        <div className="flex flex-col items-center">
                          <div className="w-0.5 h-4 bg-warm-600" />
                          <svg width="12" height="8" viewBox="0 0 12 8" className="text-warm-600"><polygon points="6,8 0,0 12,0" fill="currentColor" /></svg>
                          <div className="w-0.5 h-2 bg-warm-600" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Execution Status */}
            {currentRun && (
              <div className="mt-4 bg-warm-800 rounded-lg p-4">
                <h5 className="text-sm font-bold mb-2">{t('visualWorkflow.executionStatus', 'Execution Status')}</h5>
                <div className="flex gap-4 text-xs">
                  <span className="text-warm-400">{t('visualWorkflow.runId', 'Run ID')}: <span className="text-white font-mono">{currentRun.id.substring(0, 8)}</span></span>
                  <span className="text-warm-400">{t('visualWorkflow.runStatus', 'Status')}: <span className={`font-medium ${currentRun.status === 'Completed' ? 'text-green-400' : currentRun.status === 'Failed' ? 'text-red-400' : 'text-blue-400'}`}>{currentRun.status}</span></span>
                  {currentRun.error && <span className="text-red-400">{t('visualWorkflow.runError', 'Error')}: {currentRun.error}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workflow List */}
      {viewMode === 'list' && (
        <>
          {workflows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map(workflow => {
                const nodes = parseNodes(workflow.nodesJson)
                return (
                  <div key={workflow.id} className="bg-warm-900 rounded-xl p-4 border border-warm-800 hover:border-warm-700 transition-colors cursor-pointer" onClick={() => openEditor(workflow)} data-testid="workflow-card">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-bold text-sm truncate flex-1">{workflow.name}</h5>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap ml-2 ${STATUS_COLORS[workflow.status] || 'bg-warm-700 text-warm-300'}`}>{workflow.status}</span>
                    </div>
                    {workflow.description && <p className="text-warm-400 text-xs mb-3 line-clamp-2">{workflow.description}</p>}
                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className="bg-warm-800 text-warm-300 text-[10px] px-1.5 py-0.5 rounded">{workflow.triggerType}</span>
                      <span className="bg-warm-800 text-warm-300 text-[10px] px-1.5 py-0.5 rounded">{nodes.length} {t('visualWorkflow.nodesCount', 'nodes')}</span>
                    </div>
                    {nodes.length > 0 && (
                      <div className="flex items-center gap-1 mb-3 overflow-hidden">
                        {nodes.slice(0, 5).map(node => (
                          <span key={node.id} className={`text-[9px] px-1.5 py-0.5 rounded truncate max-w-[80px] border ${NODE_TYPE_COLORS[node.type] || NODE_TYPE_COLORS.action}`}>{node.label}</span>
                        ))}
                        {nodes.length > 5 && <span className="text-warm-500 text-[10px]">+{nodes.length - 5}</span>}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-warm-800">
                      <span className="text-xs text-warm-500">{new Date(workflow.updatedAt).toLocaleDateString()}</span>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleExecute(workflow.id)} className="text-green-400 hover:text-green-300 text-xs px-2 py-1 rounded bg-warm-800 hover:bg-warm-700 transition-colors">{t('visualWorkflow.run', 'Run')}</button>
                        <button onClick={() => setDeleteConfirmId(workflow.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-warm-800 hover:bg-warm-700 transition-colors">&times;</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-warm-500 text-4xl mb-4">&#x2699;</div>
              <p className="text-warm-400 mb-2">{t('visualWorkflow.empty', 'No workflows yet')}</p>
              <p className="text-warm-500 text-sm mb-6">{t('visualWorkflow.emptyDesc', 'Create a workflow manually or use AI to generate one from a natural language description.')}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setViewMode('generate')} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('visualWorkflow.aiGenerate', 'AI Generate')}</button>
                <button onClick={() => { resetForm(); setShowCreateDialog(true) }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('visualWorkflow.create', 'Create Workflow')}</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-900 rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">{t('visualWorkflow.create', 'Create Workflow')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('visualWorkflow.name', 'Name')}</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none" placeholder={t('visualWorkflow.namePlaceholder', 'e.g., Order Processing Workflow')} />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('visualWorkflow.formDescription', 'Description')}</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={3} className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('visualWorkflow.triggerType', 'Trigger Type')}</label>
                <select value={formTriggerType} onChange={e => setFormTriggerType(e.target.value)} className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700">
                  <option value="manual">{t('visualWorkflow.triggerManual', 'Manual')}</option>
                  <option value="schedule">{t('visualWorkflow.triggerSchedule', 'Schedule')}</option>
                  <option value="webhook">{t('visualWorkflow.triggerWebhook', 'Webhook')}</option>
                  <option value="event">{t('visualWorkflow.triggerEvent', 'Event')}</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowCreateDialog(false); resetForm() }} className="flex-1 bg-warm-700 hover:bg-warm-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('visualWorkflow.cancel', 'Cancel')}</button>
                <button onClick={handleCreate} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('visualWorkflow.create', 'Create Workflow')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-900 rounded-xl p-6 w-full max-w-sm">
            <p className="text-sm mb-4">{t('visualWorkflow.deleteConfirm', 'Are you sure you want to delete this workflow?')}</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 bg-warm-700 hover:bg-warm-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('visualWorkflow.cancel', 'Cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('visualWorkflow.delete', 'Delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
