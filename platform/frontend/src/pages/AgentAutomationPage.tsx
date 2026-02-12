import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getAgentConfig,
  updateAgentConfig,
  getAgentTasks,
  retryAgentTask,
  type AgentAutomationConfig,
  type AgentTask,
} from '../api/agent-automation'

const STATUS_COLORS: Record<string, string> = {
  queued: 'bg-warm-700 text-warm-300',
  analyzing: 'bg-blue-900 text-blue-300',
  implementing: 'bg-purple-900 text-purple-300',
  testing: 'bg-yellow-900 text-yellow-300',
  pr_created: 'bg-green-900 text-green-300',
  failed: 'bg-red-900 text-red-300',
}

export default function AgentAutomationPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [config, setConfig] = useState<AgentAutomationConfig>({
    enabled: false,
    triggerLabels: ['auto-implement', 'agent'],
    maxConcurrent: 2,
    autoMerge: false,
  })
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [labelInput, setLabelInput] = useState('')
  const [retrying, setRetrying] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const webhookUrl = `${window.location.origin}/api/agent-automation/webhook`

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError('')
      const [configData, tasksData] = await Promise.all([
        getAgentConfig(),
        getAgentTasks(),
      ])
      setConfig(configData)
      setTasks(tasksData)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('agentAutomation.errorLoading', 'Failed to load agent automation config'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const updated = await updateAgentConfig(config)
      setConfig(updated)
      setSuccess(t('agentAutomation.saved', 'Settings saved successfully'))
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('agentAutomation.errorSaving', 'Failed to save settings'))
    } finally {
      setSaving(false)
    }
  }

  async function handleRetry(taskId: string) {
    try {
      setRetrying(taskId)
      setError('')
      const updated = await retryAgentTask(taskId)
      setTasks(prev => prev.map(task => task.id === taskId ? updated : task))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('agentAutomation.errorRetry', 'Failed to retry task'))
    } finally {
      setRetrying(null)
    }
  }

  function addLabel() {
    const label = labelInput.trim()
    if (label && !config.triggerLabels.includes(label)) {
      setConfig(prev => ({ ...prev, triggerLabels: [...prev.triggerLabels, label] }))
      setLabelInput('')
    }
  }

  function removeLabel(label: string) {
    setConfig(prev => ({ ...prev, triggerLabels: prev.triggerLabels.filter(l => l !== label) }))
  }

  function copyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold">{t('agentAutomation.settings.title')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('agentAutomation.settings.description')}</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-green-300 text-sm">
          {success}
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <div className="bg-warm-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">{t('agentAutomation.enabled')}</h4>
            <p className="text-warm-400 text-sm mt-1">{t('agentAutomation.enabledDesc')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={config.enabled}
            onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.enabled ? 'bg-accent-blue' : 'bg-warm-600'
            }`}
            data-testid="agent-automation-toggle"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Trigger Labels */}
      <div className="bg-warm-800 rounded-xl p-6">
        <h4 className="font-semibold mb-1">{t('agentAutomation.triggerLabels')}</h4>
        <p className="text-warm-400 text-sm mb-4">{t('agentAutomation.triggerLabelsDesc')}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {config.triggerLabels.map(label => (
            <span
              key={label}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-blue/20 text-accent-blue text-sm"
            >
              {label}
              <button
                type="button"
                onClick={() => removeLabel(label)}
                className="hover:text-red-400 transition-colors ml-1"
                aria-label={`Remove ${label}`}
              >
                x
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={labelInput}
            onChange={e => setLabelInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLabel())}
            placeholder="Add label..."
            className="flex-1 bg-warm-900 border border-warm-700 rounded-lg px-3 py-2 text-sm text-white placeholder-warm-500 focus:outline-none focus:border-accent-blue"
            data-testid="label-input"
          />
          <button
            type="button"
            onClick={addLabel}
            className="px-4 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/80 transition-colors"
          >
            {t('agentAutomation.addLabel', 'Add')}
          </button>
        </div>
      </div>

      {/* Max Concurrent Agents */}
      <div className="bg-warm-800 rounded-xl p-6">
        <h4 className="font-semibold mb-1">{t('agentAutomation.maxConcurrent')}</h4>
        <p className="text-warm-400 text-sm mb-4">{t('agentAutomation.maxConcurrentDesc')}</p>
        <select
          value={config.maxConcurrent}
          onChange={e => setConfig(prev => ({ ...prev, maxConcurrent: Number(e.target.value) }))}
          className="bg-warm-900 border border-warm-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
          data-testid="max-concurrent-select"
        >
          {[1, 2, 3, 4, 5].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {/* Auto-Merge Toggle */}
      <div className="bg-warm-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">{t('agentAutomation.autoMerge')}</h4>
            <p className="text-warm-400 text-sm mt-1">{t('agentAutomation.autoMergeDesc')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={config.autoMerge}
            onClick={() => setConfig(prev => ({ ...prev, autoMerge: !prev.autoMerge }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.autoMerge ? 'bg-accent-blue' : 'bg-warm-600'
            }`}
            data-testid="auto-merge-toggle"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.autoMerge ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="bg-warm-800 rounded-xl p-6">
        <h4 className="font-semibold mb-1">{t('agentAutomation.webhookUrl')}</h4>
        <p className="text-warm-400 text-sm mb-4">{t('agentAutomation.webhookUrlDesc')}</p>
        <div className="flex gap-2">
          <code className="flex-1 bg-warm-900 border border-warm-700 rounded-lg px-3 py-2 text-sm text-warm-300 overflow-x-auto">
            {webhookUrl}
          </code>
          <button
            type="button"
            onClick={copyWebhookUrl}
            className="px-4 py-2 bg-warm-700 text-white rounded-lg text-sm font-medium hover:bg-warm-600 transition-colors"
            data-testid="copy-webhook-btn"
          >
            {copied ? t('agentAutomation.copied', 'Copied!') : t('agentAutomation.copyWebhook')}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/80 transition-colors disabled:opacity-50"
          data-testid="save-config-btn"
        >
          {saving ? t('agentAutomation.saving', 'Saving...') : t('agentAutomation.save', 'Save Settings')}
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-warm-800 rounded-xl p-6">
        <h4 className="font-semibold mb-4">{t('agentAutomation.recentActivity')}</h4>
        {tasks.length === 0 ? (
          <p className="text-warm-500 text-sm text-center py-8">{t('agentAutomation.noActivity')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="agent-tasks-table">
              <thead>
                <tr className="border-b border-warm-700 text-warm-400">
                  <th className="text-left py-2 pr-4">Issue</th>
                  <th className="text-left py-2 pr-4">{t('agentAutomation.status.label', 'Status')}</th>
                  <th className="text-left py-2 pr-4">PR</th>
                  <th className="text-left py-2 pr-4">{t('agentAutomation.startedAt', 'Started')}</th>
                  <th className="text-left py-2" />
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} className="border-b border-warm-700/50">
                    <td className="py-3 pr-4">
                      <span className="text-warm-300">#{task.issueNumber}</span>{' '}
                      <span className="text-white">{task.issueTitle}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[task.status] || 'bg-warm-700 text-warm-300'}`}>
                        {t(`agentAutomation.status.${task.status}`)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {task.prUrl ? (
                        <a
                          href={task.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-blue hover:underline"
                        >
                          #{task.prNumber}
                        </a>
                      ) : (
                        <span className="text-warm-500">-</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-warm-400">
                      {new Date(task.startedAt).toLocaleString()}
                    </td>
                    <td className="py-3">
                      {task.status === 'failed' && (
                        <button
                          type="button"
                          onClick={() => handleRetry(task.id)}
                          disabled={retrying === task.id}
                          className="px-3 py-1 bg-warm-700 text-white rounded text-xs font-medium hover:bg-warm-600 transition-colors disabled:opacity-50"
                          data-testid={`retry-btn-${task.id}`}
                        >
                          {retrying === task.id ? '...' : t('agentAutomation.retry')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
