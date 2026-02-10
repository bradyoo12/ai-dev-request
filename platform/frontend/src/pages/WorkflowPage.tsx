import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { listWorkflows, getWorkflowMetrics, retryWorkflowStep, cancelWorkflow } from '../api/workflows'
import type { WorkflowExecution, WorkflowStep, WorkflowMetrics } from '../api/workflows'

export default function WorkflowPage() {
  const { t } = useTranslation()
  const [workflows, setWorkflows] = useState<WorkflowExecution[]>([])
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowExecution | null>(null)
  const [tab, setTab] = useState<'list' | 'metrics'>('list')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [workflowsData, metricsData] = await Promise.all([
        listWorkflows(),
        getWorkflowMetrics(),
      ])
      setWorkflows(workflowsData)
      setMetrics(metricsData)
    } catch {
      setError(t('workflows.loadError', 'Failed to load workflow data'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { loadData() }, [loadData])

  const parseSteps = (stepsJson: string): WorkflowStep[] => {
    try { return JSON.parse(stepsJson) } catch { return [] }
  }

  const handleRetry = async (executionId: number, stepName: string) => {
    try {
      await retryWorkflowStep(executionId, stepName)
      await loadData()
      if (selectedWorkflow?.id === executionId) {
        const updated = workflows.find(w => w.id === executionId)
        if (updated) setSelectedWorkflow(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('workflows.retryError', 'Retry failed'))
    }
  }

  const handleCancel = async (executionId: number) => {
    try {
      await cancelWorkflow(executionId)
      await loadData()
      if (selectedWorkflow?.id === executionId) {
        setSelectedWorkflow(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('workflows.cancelError', 'Cancel failed'))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-900/50 text-green-400'
      case 'running': return 'bg-blue-900/50 text-blue-400'
      case 'pending': return 'bg-yellow-900/50 text-yellow-400'
      case 'failed': return 'bg-red-900/50 text-red-400'
      case 'cancelled': return 'bg-gray-700 text-gray-400'
      default: return 'bg-gray-700 text-gray-400'
    }
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return '+'
      case 'running': return '~'
      case 'failed': return 'x'
      case 'cancelled': return '-'
      default: return 'o'
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(0)}s`
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`
    return `${(seconds / 3600).toFixed(1)}h`
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">{t('workflows.loading', 'Loading workflows...')}</p>
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

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {(['list', 'metrics'] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              tab === tabKey ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t(`workflows.tab.${tabKey}`, tabKey === 'list' ? 'Executions' : 'Metrics')}
          </button>
        ))}
      </div>

      {/* Workflow List Tab */}
      {tab === 'list' && (
        <div>
          <h3 className="text-lg font-bold mb-4">{t('workflows.list.title', 'Workflow Executions')}</h3>

          {workflows.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
              <p>{t('workflows.list.empty', 'No workflows yet. Start one from a dev request.')}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {workflows.map((wf) => {
                const steps = parseSteps(wf.stepsJson)
                return (
                  <div
                    key={wf.id}
                    className={`bg-gray-800 rounded-xl p-4 cursor-pointer transition-colors hover:bg-gray-750 ${
                      selectedWorkflow?.id === wf.id ? 'ring-1 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedWorkflow(selectedWorkflow?.id === wf.id ? null : wf)}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">#{wf.id}</span>
                        <span className="font-medium">{wf.workflowType}</span>
                        <span className="text-xs text-gray-500">Request #{wf.devRequestId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(wf.status)}`}>
                          {wf.status}
                        </span>
                        {wf.retryCount > 0 && (
                          <span className="text-xs text-orange-400">
                            {t('workflows.retries', 'Retries')}: {wf.retryCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pipeline Visualization */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                      {steps.map((step, idx) => (
                        <div key={step.name} className="flex items-center">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${getStatusColor(step.status)}`}>
                            <span className="font-mono">{getStepIcon(step.status)}</span>
                            <span>{step.name}</span>
                          </div>
                          {idx < steps.length - 1 && (
                            <div className="w-4 h-px bg-gray-600 mx-0.5"></div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(wf.createdAt).toLocaleString()}
                      {wf.completedAt && ` -- ${new Date(wf.completedAt).toLocaleString()}`}
                    </div>

                    {/* Expanded Step Details */}
                    {selectedWorkflow?.id === wf.id && (
                      <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold">{t('workflows.steps.title', 'Step Details')}</h4>
                          {(wf.status === 'Running' || wf.status === 'Pending') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCancel(wf.id) }}
                              className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-400 rounded-lg text-xs transition-colors"
                            >
                              {t('workflows.cancel', 'Cancel Workflow')}
                            </button>
                          )}
                        </div>
                        {steps.map((step) => (
                          <div key={step.name} className="bg-gray-900 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(step.status)}`}>
                                  {step.status}
                                </span>
                                <span className="text-sm font-medium">{step.name}</span>
                              </div>
                              {step.status === 'failed' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRetry(wf.id, step.name) }}
                                  className="px-3 py-1 bg-blue-900/50 hover:bg-blue-800 text-blue-400 rounded-lg text-xs transition-colors"
                                >
                                  {t('workflows.retry', 'Retry')}
                                </button>
                              )}
                            </div>
                            {step.startedAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                {t('workflows.steps.started', 'Started')}: {new Date(step.startedAt).toLocaleString()}
                                {step.completedAt && (
                                  <span> | {t('workflows.steps.duration', 'Duration')}: {
                                    formatDuration((new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()) / 1000)
                                  }</span>
                                )}
                              </div>
                            )}
                            {step.error && (
                              <div className="text-xs text-red-400 mt-1 bg-red-900/20 rounded p-2">
                                {step.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Metrics Tab */}
      {tab === 'metrics' && metrics && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold">{t('workflows.metrics.title', 'Workflow Metrics')}</h3>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-gray-400 text-sm">{t('workflows.metrics.total', 'Total')}</div>
              <div className="text-2xl font-bold">{metrics.totalWorkflows}</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-gray-400 text-sm">{t('workflows.metrics.successRate', 'Success Rate')}</div>
              <div className="text-2xl font-bold text-green-400">{metrics.successRate.toFixed(1)}%</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-gray-400 text-sm">{t('workflows.metrics.avgDuration', 'Avg Duration')}</div>
              <div className="text-2xl font-bold">{formatDuration(metrics.avgDurationSeconds)}</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-gray-400 text-sm">{t('workflows.metrics.running', 'Running')}</div>
              <div className="text-2xl font-bold text-blue-400">{metrics.runningWorkflows}</div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h4 className="text-sm font-bold mb-4">{t('workflows.metrics.statusBreakdown', 'Status Breakdown')}</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-300">{t('workflows.metrics.completed', 'Completed')}: {metrics.completedWorkflows}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-300">{t('workflows.metrics.failed', 'Failed')}: {metrics.failedWorkflows}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-300">{t('workflows.metrics.running', 'Running')}: {metrics.runningWorkflows}</span>
              </div>
            </div>

            {/* Visual bar */}
            {metrics.totalWorkflows > 0 && (
              <div className="flex h-4 rounded-full overflow-hidden mt-4">
                {metrics.completedWorkflows > 0 && (
                  <div
                    className="bg-green-500"
                    style={{ width: `${(metrics.completedWorkflows / metrics.totalWorkflows) * 100}%` }}
                  ></div>
                )}
                {metrics.failedWorkflows > 0 && (
                  <div
                    className="bg-red-500"
                    style={{ width: `${(metrics.failedWorkflows / metrics.totalWorkflows) * 100}%` }}
                  ></div>
                )}
                {metrics.runningWorkflows > 0 && (
                  <div
                    className="bg-blue-500"
                    style={{ width: `${(metrics.runningWorkflows / metrics.totalWorkflows) * 100}%` }}
                  ></div>
                )}
                {(metrics.totalWorkflows - metrics.completedWorkflows - metrics.failedWorkflows - metrics.runningWorkflows) > 0 && (
                  <div
                    className="bg-gray-600"
                    style={{ width: `${((metrics.totalWorkflows - metrics.completedWorkflows - metrics.failedWorkflows - metrics.runningWorkflows) / metrics.totalWorkflows) * 100}%` }}
                  ></div>
                )}
              </div>
            )}
          </div>

          {/* Step Failure Rates */}
          {metrics.stepFailureRates.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-6">
              <h4 className="text-sm font-bold mb-4">{t('workflows.metrics.failurePoints', 'Common Failure Points')}</h4>
              <div className="space-y-3">
                {metrics.stepFailureRates.map((sfr) => (
                  <div key={sfr.stepName} className="flex items-center gap-4">
                    <span className="text-sm text-gray-300 w-28">{sfr.stepName}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full"
                        style={{ width: `${Math.min(sfr.failureRate, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400 w-24 text-right">
                      {sfr.failureCount} ({sfr.failureRate.toFixed(1)}%)
                    </span>
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
