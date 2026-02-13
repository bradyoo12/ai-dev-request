import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listActions, evaluateAction, deleteAction, getGovernanceStats, getRules } from '../api/governance'
import type { GovernanceAction, EvaluateResponse, GovernanceRule, GovernanceStats } from '../api/governance'

type Tab = 'evaluate' | 'history' | 'rules' | 'stats'

export default function GovernancePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('evaluate')
  const [actions, setActions] = useState<GovernanceAction[]>([])
  const [rules, setRules] = useState<GovernanceRule[]>([])
  const [stats, setStats] = useState<GovernanceStats | null>(null)
  const [projectName, setProjectName] = useState('')
  const [actionType, setActionType] = useState('git-push')
  const [description, setDescription] = useState('')
  const [agentId, setAgentId] = useState('agent-1')
  const [result, setResult] = useState<EvaluateResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tab === 'history') listActions().then(setActions).catch(() => {})
    if (tab === 'rules') getRules().then(setRules).catch(() => {})
    if (tab === 'stats') getGovernanceStats().then(setStats).catch(() => {})
  }, [tab])

  const handleEvaluate = async () => {
    if (!projectName.trim() || !description.trim()) return
    setLoading(true)
    try {
      const res = await evaluateAction(projectName, actionType, description, agentId)
      setResult(res)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAction(id)
      setActions(prev => prev.filter(a => a.id !== id))
    } catch { /* ignore */ }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'evaluate', label: t('governance.tab.evaluate', 'Evaluate') },
    { key: 'history', label: t('governance.tab.history', 'History') },
    { key: 'rules', label: t('governance.tab.rules', 'Rules') },
    { key: 'stats', label: t('governance.tab.stats', 'Stats') },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">{t('governance.title', 'Agentic Governance')}</h2>
      <p className="text-warm-400 text-sm mb-4">{t('governance.subtitle', 'Guardrails and approval workflows for safe AI agent deployment')}</p>

      <div className="flex gap-2 mb-4">
        {tabs.map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              tab === tb.key ? 'bg-blue-600 text-white' : 'text-warm-400 hover:text-white'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'evaluate' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('governance.projectName', 'Project Name')}</label>
              <input
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm"
                placeholder="my-project"
              />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('governance.actionType', 'Action Type')}</label>
              <select
                value={actionType}
                onChange={e => setActionType(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm"
              >
                <option value="git-push">Git Force Push</option>
                <option value="file-delete">File Delete</option>
                <option value="schema-change">Schema Change</option>
                <option value="secret-modify">Secret Modify</option>
                <option value="mass-delete">Mass Delete</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('governance.description', 'Action Description')}</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm"
                placeholder="Force push to main branch"
              />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('governance.agentId', 'Agent ID')}</label>
              <input
                value={agentId}
                onChange={e => setAgentId(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm"
                placeholder="agent-1"
              />
            </div>
          </div>
          <button
            onClick={handleEvaluate}
            disabled={loading || !projectName.trim() || !description.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t('governance.evaluating', 'Evaluating...') : t('governance.evaluate', 'Evaluate Action')}
          </button>

          {result && (
            <div className="bg-warm-800 rounded-lg p-4 space-y-3">
              <h3 className="text-white font-medium">{t('governance.result', 'Evaluation Result')}</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-warm-400 text-xs">{t('governance.classification', 'Classification')}</div>
                  <div className={`font-medium ${result.classification === 'destructive' ? 'text-red-400' : result.classification === 'reversible' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {result.classification}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-warm-400 text-xs">{t('governance.approval', 'Approval')}</div>
                  <div className="text-white font-medium">{result.action.approvalStatus}</div>
                </div>
                <div className="text-center">
                  <div className="text-warm-400 text-xs">{t('governance.blocked', 'Blocked')}</div>
                  <div className={`font-medium ${result.blocked ? 'text-red-400' : 'text-green-400'}`}>
                    {result.blocked ? t('governance.yes', 'Yes') : t('governance.no', 'No')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-warm-400 text-xs">{t('governance.rollback', 'Rollback')}</div>
                  <div className={`font-medium ${result.rollbackAvailable ? 'text-blue-400' : 'text-warm-500'}`}>
                    {result.rollbackAvailable ? t('governance.available', 'Available') : 'N/A'}
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded text-sm ${result.blocked ? 'bg-red-900/30 text-red-300' : result.requiresApproval ? 'bg-yellow-900/30 text-yellow-300' : 'bg-green-900/30 text-green-300'}`}>
                {result.recommendation}
              </div>
              <div>
                <div className="text-warm-400 text-xs mb-1">{t('governance.guardrails', 'Active Guardrails')}</div>
                <div className="space-y-1">
                  {result.guardrails.filter(g => g.applies).map((g, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${g.enabled ? 'bg-green-400' : 'bg-warm-500'}`} />
                      <span className="text-warm-300">{g.rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2">
          {actions.length === 0 && <p className="text-warm-400 text-sm">{t('governance.noHistory', 'No governance actions yet.')}</p>}
          {actions.map(a => (
            <div key={a.id} className="bg-warm-800 rounded-lg p-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{a.projectName} — {a.actionType}</div>
                <div className="text-warm-400 text-xs mt-0.5">
                  {a.classification} &middot; {a.agentId} &middot; {a.affectedFiles} files &middot; {a.executionTimeMs}ms
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  a.blocked ? 'bg-red-900 text-red-300' : a.approvalStatus === 'pending' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'
                }`}>
                  {a.status}
                </span>
                <button onClick={() => handleDelete(a.id)} className="text-warm-500 hover:text-red-400 text-xs">
                  {t('common.delete', 'Delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {rules.map(r => (
              <div key={r.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-white font-medium">{r.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${r.severity === 'critical' ? 'bg-red-900 text-red-300' : r.severity === 'high' ? 'bg-yellow-900 text-yellow-300' : 'bg-blue-900 text-blue-300'}`}>
                      {r.severity}
                    </span>
                  </div>
                  <p className="text-warm-400 text-sm mt-1">{r.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${r.enabled ? 'bg-green-900 text-green-300' : 'bg-warm-700 text-warm-400'}`}>
                  {r.enabled ? t('governance.enabled', 'Enabled') : t('governance.disabled', 'Disabled')}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">{t('governance.features', 'Features')}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-white text-sm font-medium">{t('governance.feat.classify', 'Action Classification')}</div>
                <div className="text-warm-400 text-xs mt-1">{t('governance.feat.classifyDesc', 'Categorize operations as safe, reversible, or destructive for appropriate handling')}</div>
              </div>
              <div>
                <div className="text-white text-sm font-medium">{t('governance.feat.approval', 'Approval Workflows')}</div>
                <div className="text-warm-400 text-xs mt-1">{t('governance.feat.approvalDesc', 'Require human approval for destructive actions like force push and schema changes')}</div>
              </div>
              <div>
                <div className="text-white text-sm font-medium">{t('governance.feat.audit', 'Audit Trail')}</div>
                <div className="text-warm-400 text-xs mt-1">{t('governance.feat.auditDesc', 'Log all agent actions with rollback capability for reversible operations')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-4">
          {!stats || stats.totalActions === 0 ? (
            <p className="text-warm-400 text-sm">{t('governance.noStats', 'No governance statistics yet.')}</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-warm-800 rounded-lg p-3 text-center">
                  <div className="text-warm-400 text-xs">{t('governance.stats.total', 'Total Actions')}</div>
                  <div className="text-white text-lg font-bold">{stats.totalActions}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3 text-center">
                  <div className="text-warm-400 text-xs">{t('governance.stats.blocked', 'Blocked')}</div>
                  <div className="text-red-400 text-lg font-bold">{stats.blockedActions}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3 text-center">
                  <div className="text-warm-400 text-xs">{t('governance.stats.pending', 'Pending')}</div>
                  <div className="text-yellow-400 text-lg font-bold">{stats.pendingApprovals}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3 text-center">
                  <div className="text-warm-400 text-xs">{t('governance.stats.autoApproved', 'Auto-Approved')}</div>
                  <div className="text-green-400 text-lg font-bold">{stats.autoApproved}</div>
                </div>
              </div>
              {stats.byClassification.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">{t('governance.stats.byClass', 'By Classification')}</h3>
                  <div className="space-y-2">
                    {stats.byClassification.map(c => (
                      <div key={c.classification} className="flex justify-between text-sm">
                        <span className="text-warm-300">{c.classification}</span>
                        <span className="text-warm-400">{c.count} actions &middot; {c.blockedCount} blocked &middot; {c.approvalRate}% approved</span>
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
