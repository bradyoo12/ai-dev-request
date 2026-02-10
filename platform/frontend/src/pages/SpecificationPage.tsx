import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  generateSpec,
  getSpec,
  getSpecHistory,
  approveSpec,
  rejectSpec,
} from '../api/specifications'
import type { DevelopmentSpec } from '../api/specifications'

const PHASES = ['requirements', 'design', 'implementation'] as const
type Phase = typeof PHASES[number]

export default function SpecificationPage() {
  const { t } = useTranslation()
  const [currentSpec, setCurrentSpec] = useState<DevelopmentSpec | null>(null)
  const [history, setHistory] = useState<DevelopmentSpec[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activePhase, setActivePhase] = useState<Phase>('requirements')
  const [requestId, setRequestId] = useState<number>(1)
  const [requestIdInput, setRequestIdInput] = useState('1')
  const [showHistory, setShowHistory] = useState(false)
  const [rejectFeedback, setRejectFeedback] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [generating, setGenerating] = useState(false)

  const loadSpec = useCallback(async () => {
    try {
      setLoading(true)
      const [specData, historyData] = await Promise.all([
        getSpec(requestId),
        getSpecHistory(requestId),
      ])
      setCurrentSpec(specData)
      setHistory(historyData)
      if (specData) {
        setActivePhase(specData.phase as Phase)
      }
    } catch {
      setError(t('specs.loadError', 'Failed to load specification data'))
    } finally {
      setLoading(false)
    }
  }, [requestId, t])

  useEffect(() => {
    loadSpec()
  }, [loadSpec])

  const handleGenerate = async (phase: Phase) => {
    try {
      setGenerating(true)
      setError('')
      const spec = await generateSpec(requestId, phase)
      setCurrentSpec(spec)
      setActivePhase(phase)
      await loadSpec()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('specs.generateError', 'Generation failed'))
    } finally {
      setGenerating(false)
    }
  }

  const handleApprove = async () => {
    if (!currentSpec) return
    try {
      setError('')
      const spec = await approveSpec(requestId, currentSpec.id)
      setCurrentSpec(spec)
      await loadSpec()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('specs.approveError', 'Approval failed'))
    }
  }

  const handleReject = async () => {
    if (!currentSpec || !rejectFeedback.trim()) return
    try {
      setError('')
      const spec = await rejectSpec(requestId, currentSpec.id, rejectFeedback)
      setCurrentSpec(spec)
      setRejectFeedback('')
      setShowRejectDialog(false)
      await loadSpec()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('specs.rejectError', 'Rejection failed'))
    }
  }

  const handleLoadRequest = () => {
    const parsed = parseInt(requestIdInput, 10)
    if (!isNaN(parsed) && parsed > 0) {
      setRequestId(parsed)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-900/50 text-green-400'
      case 'review': return 'bg-blue-900/50 text-blue-400'
      case 'generating': return 'bg-yellow-900/50 text-yellow-400'
      case 'rejected': return 'bg-red-900/50 text-red-400'
      case 'pending': return 'bg-gray-700 text-gray-400'
      default: return 'bg-gray-700 text-gray-400'
    }
  }

  const getPhaseIcon = (phase: Phase) => {
    switch (phase) {
      case 'requirements': return '1'
      case 'design': return '2'
      case 'implementation': return '3'
    }
  }

  const getPhaseLabel = (phase: Phase) => {
    switch (phase) {
      case 'requirements': return t('specs.phase.requirements', 'Requirements')
      case 'design': return t('specs.phase.design', 'Design')
      case 'implementation': return t('specs.phase.implementation', 'Implementation')
    }
  }

  const parseJson = (json: string | null | undefined): unknown[] => {
    if (!json) return []
    try { return JSON.parse(json) } catch { return [] }
  }

  const parseJsonObj = (json: string | null | undefined): Record<string, unknown> => {
    if (!json) return {}
    try { return JSON.parse(json) } catch { return {} }
  }

  const getPhaseSpec = (phase: Phase): DevelopmentSpec | null => {
    return history.find(s => s.phase === phase) || null
  }

  const isPhaseComplete = (phase: Phase): boolean => {
    const spec = getPhaseSpec(phase)
    return spec?.status === 'approved'
  }

  const renderRequirementsContent = (spec: DevelopmentSpec) => {
    const stories = parseJson(spec.userStories) as Array<{ id: string; title: string; role: string; action: string; benefit: string }>
    const criteria = parseJson(spec.acceptanceCriteria) as Array<{ id: string; storyId: string; criteria: string }>
    const edges = parseJson(spec.edgeCases) as Array<{ id: string; description: string; mitigation: string }>

    return (
      <div className="space-y-6">
        {/* User Stories */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h4 className="text-sm font-bold mb-3">{t('specs.userStories', 'User Stories')}</h4>
          <div className="space-y-3">
            {stories.map((story) => (
              <div key={story.id} className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-blue-400 font-mono">{story.id}</span>
                  <span className="text-sm font-medium">{story.title}</span>
                </div>
                <p className="text-xs text-gray-400">
                  As a <span className="text-gray-300">{story.role}</span>, I want to{' '}
                  <span className="text-gray-300">{story.action}</span> so that I can{' '}
                  <span className="text-gray-300">{story.benefit}</span>.
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Acceptance Criteria */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h4 className="text-sm font-bold mb-3">{t('specs.acceptanceCriteria', 'Acceptance Criteria')}</h4>
          <div className="space-y-2">
            {criteria.map((ac) => (
              <div key={ac.id} className="flex items-start gap-2 bg-gray-900 rounded-lg p-3">
                <span className="text-xs text-green-400 font-mono mt-0.5">{ac.id}</span>
                <div>
                  <span className="text-xs text-gray-500">{ac.storyId}</span>
                  <p className="text-sm text-gray-300">{ac.criteria}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edge Cases */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h4 className="text-sm font-bold mb-3">{t('specs.edgeCases', 'Edge Cases')}</h4>
          <div className="space-y-2">
            {edges.map((ec) => (
              <div key={ec.id} className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-orange-400 font-mono">{ec.id}</span>
                  <span className="text-sm text-gray-300">{ec.description}</span>
                </div>
                <p className="text-xs text-gray-400">Mitigation: {ec.mitigation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderDesignContent = (spec: DevelopmentSpec) => {
    const decisions = parseJson(spec.architectureDecisions) as Array<{ id: string; title: string; decision: string; rationale: string }>
    const apis = parseJson(spec.apiContracts) as Array<{ method: string; path: string; description: string; requestBody?: string | null; responseType: string }>
    const models = parseJson(spec.dataModels) as Array<{ name: string; fields: string[] }>
    const components = parseJson(spec.componentBreakdown) as Array<{ name: string; type: string; description: string; children: string[] }>

    return (
      <div className="space-y-6">
        {/* Architecture Decisions */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h4 className="text-sm font-bold mb-3">{t('specs.architectureDecisions', 'Architecture Decisions')}</h4>
          <div className="space-y-3">
            {decisions.map((adr) => (
              <div key={adr.id} className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-purple-400 font-mono">{adr.id}</span>
                  <span className="text-sm font-medium">{adr.title}</span>
                </div>
                <p className="text-sm text-blue-300">Decision: {adr.decision}</p>
                <p className="text-xs text-gray-400 mt-1">Rationale: {adr.rationale}</p>
              </div>
            ))}
          </div>
        </div>

        {/* API Contracts */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h4 className="text-sm font-bold mb-3">{t('specs.apiContracts', 'API Contracts')}</h4>
          <div className="space-y-2">
            {apis.map((api, idx) => (
              <div key={idx} className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    api.method === 'GET' ? 'bg-green-900/50 text-green-400' :
                    api.method === 'POST' ? 'bg-blue-900/50 text-blue-400' :
                    api.method === 'PUT' ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-red-900/50 text-red-400'
                  }`}>{api.method}</span>
                  <span className="text-sm font-mono text-gray-300">{api.path}</span>
                </div>
                <p className="text-xs text-gray-400">{api.description}</p>
                {api.requestBody && <p className="text-xs text-gray-500 mt-1">Body: {api.requestBody}</p>}
                <p className="text-xs text-gray-500">Response: {api.responseType}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Data Models */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h4 className="text-sm font-bold mb-3">{t('specs.dataModels', 'Data Models')}</h4>
          <div className="space-y-3">
            {models.map((model) => (
              <div key={model.name} className="bg-gray-900 rounded-lg p-3">
                <span className="text-sm font-bold text-cyan-400">{model.name}</span>
                <div className="mt-2 space-y-1">
                  {model.fields.map((field, idx) => (
                    <div key={idx} className="text-xs font-mono text-gray-400 pl-2">- {field}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Component Breakdown */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h4 className="text-sm font-bold mb-3">{t('specs.componentBreakdown', 'Component Breakdown')}</h4>
          <div className="space-y-2">
            {components.map((comp) => (
              <div key={comp.name} className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{comp.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">{comp.type}</span>
                </div>
                <p className="text-xs text-gray-400">{comp.description}</p>
                {comp.children.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">Children: {comp.children.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderImplementationContent = (spec: DevelopmentSpec) => {
    const tasks = parseJson(spec.taskList) as Array<{ id: string; file: string; action: string; description: string; estimatedLines: number }>
    const order = parseJson(spec.dependencyOrder) as string[]
    const files = parseJson(spec.estimatedFiles) as string[]
    const links = parseJsonObj(spec.traceabilityLinks) as Record<string, string[]>

    return (
      <div className="space-y-6">
        {/* Task List */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h4 className="text-sm font-bold mb-3">{t('specs.taskList', 'Task List')}</h4>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-400 font-mono">{task.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      task.action === 'create' ? 'bg-green-900/50 text-green-400' :
                      task.action === 'modify' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>{task.action}</span>
                  </div>
                  <span className="text-xs text-gray-500">~{task.estimatedLines} lines</span>
                </div>
                <p className="text-sm font-mono text-gray-300">{task.file}</p>
                <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                {links[task.id] && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {links[task.id].map((link) => (
                      <span key={link} className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">{link}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dependency Order */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h4 className="text-sm font-bold mb-3">{t('specs.dependencyOrder', 'Dependency Order')}</h4>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {order.map((taskId, idx) => (
              <div key={taskId} className="flex items-center">
                <span className="px-3 py-1.5 rounded-lg text-xs font-mono bg-blue-900/30 text-blue-400">{taskId}</span>
                {idx < order.length - 1 && <div className="w-4 h-px bg-gray-600 mx-0.5"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Estimated Files */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h4 className="text-sm font-bold mb-3">{t('specs.estimatedFiles', 'Estimated Files')} ({files.length})</h4>
          <div className="space-y-1">
            {files.map((file, idx) => (
              <div key={idx} className="text-sm font-mono text-gray-400 bg-gray-900 rounded px-3 py-1.5">{file}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderPhaseContent = (phase: Phase) => {
    const spec = getPhaseSpec(phase)
    if (!spec) {
      return (
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400 mb-4">{t('specs.noSpec', 'No specification generated for this phase yet.')}</p>
          <button
            onClick={() => handleGenerate(phase)}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {generating ? t('specs.generating', 'Generating...') : t('specs.generate', 'Generate Specification')}
          </button>
        </div>
      )
    }

    return (
      <div>
        {/* Status bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(spec.status)}`}>
              {spec.status}
            </span>
            <span className="text-xs text-gray-500">v{spec.version}</span>
            <span className="text-xs text-gray-500">{new Date(spec.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            {spec.status === 'review' && (
              <>
                <button
                  onClick={handleApprove}
                  className="px-3 py-1.5 bg-green-900/50 hover:bg-green-800 text-green-400 rounded-lg text-xs font-medium transition-colors"
                >
                  {t('specs.approve', 'Approve')}
                </button>
                <button
                  onClick={() => setShowRejectDialog(true)}
                  className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-400 rounded-lg text-xs font-medium transition-colors"
                >
                  {t('specs.reject', 'Reject')}
                </button>
              </>
            )}
            {(spec.status === 'rejected' || spec.status === 'approved') && (
              <button
                onClick={() => handleGenerate(phase)}
                disabled={generating}
                className="px-3 py-1.5 bg-blue-900/50 hover:bg-blue-800 text-blue-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {generating ? t('specs.regenerating', 'Regenerating...') : t('specs.regenerate', 'Regenerate')}
              </button>
            )}
          </div>
        </div>

        {/* Rejection feedback */}
        {spec.status === 'rejected' && spec.rejectionFeedback && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 mb-4">
            <p className="text-sm text-red-400 font-medium mb-1">{t('specs.rejectionFeedback', 'Rejection Feedback')}</p>
            <p className="text-sm text-gray-300">{spec.rejectionFeedback}</p>
          </div>
        )}

        {/* Phase-specific content */}
        {phase === 'requirements' && renderRequirementsContent(spec)}
        {phase === 'design' && renderDesignContent(spec)}
        {phase === 'implementation' && renderImplementationContent(spec)}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">{t('specs.loading', 'Loading specifications...')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Request ID Selector */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">{t('specs.requestId', 'Request ID')}:</label>
          <input
            type="number"
            value={requestIdInput}
            onChange={(e) => setRequestIdInput(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-24"
            min={1}
          />
          <button
            onClick={handleLoadRequest}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {t('specs.load', 'Load')}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="ml-auto px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium transition-colors"
          >
            {showHistory ? t('specs.hideHistory', 'Hide History') : t('specs.showHistory', 'Show History')} ({history.length})
          </button>
        </div>
      </div>

      {/* Phase Stepper */}
      <div className="flex items-center gap-2">
        {PHASES.map((phase, idx) => (
          <div key={phase} className="flex items-center">
            <button
              onClick={() => setActivePhase(phase)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activePhase === phase
                  ? 'bg-blue-600 text-white'
                  : isPhaseComplete(phase)
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isPhaseComplete(phase) ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}>
                {isPhaseComplete(phase) ? '+' : getPhaseIcon(phase)}
              </span>
              {getPhaseLabel(phase)}
            </button>
            {idx < PHASES.length - 1 && (
              <div className={`w-8 h-px mx-1 ${isPhaseComplete(phase) ? 'bg-green-600' : 'bg-gray-600'}`}></div>
            )}
          </div>
        ))}
      </div>

      {/* Phase Content */}
      <div className="min-h-[400px]">
        {renderPhaseContent(activePhase)}
      </div>

      {/* Version History Sidebar */}
      {showHistory && history.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold mb-3">{t('specs.versionHistory', 'Version History')}</h3>
          <div className="space-y-2">
            {history.map((spec) => (
              <div key={spec.id} className="bg-gray-900 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500">v{spec.version}</span>
                  <span className="text-sm text-gray-300">{spec.phase}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(spec.status)}`}>
                    {spec.status}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{new Date(spec.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{t('specs.rejectTitle', 'Reject Specification')}</h3>
            <textarea
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              placeholder={t('specs.rejectPlaceholder', 'Provide feedback for what should be changed...')}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white h-32 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowRejectDialog(false); setRejectFeedback('') }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
              >
                {t('specs.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectFeedback.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {t('specs.confirmReject', 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
