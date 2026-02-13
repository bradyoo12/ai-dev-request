import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listExecutions, executeCommand, deleteExecution, getTerminalStats, getPolicies } from '../api/terminalexecution'
import type { TerminalExecution, ExecuteResponse, PolicyInfo, TerminalStats } from '../api/terminalexecution'

type Tab = 'execute' | 'history' | 'policies' | 'stats'

export default function TerminalExecutionPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('execute')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">{t('terminal.title', 'Autonomous Terminal')}</h2>
        <p className="text-warm-400 text-sm mt-1">{t('terminal.subtitle', 'Auto-execute safe commands with configurable allowlist/denylist controls')}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(['execute', 'history', 'policies', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'}`}>
            {t(`terminal.tab.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'execute' && <ExecuteTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'policies' && <PoliciesTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function ExecuteTab() {
  const { t } = useTranslation()
  const [projectName, setProjectName] = useState('')
  const [command, setCommand] = useState('')
  const [securityLevel, setSecurityLevel] = useState('safe')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExecuteResponse | null>(null)

  const handleExecute = async () => {
    if (!command) return
    setLoading(true)
    try {
      const res = await executeCommand(projectName || 'default', command, securityLevel)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-warm-800 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('terminal.projectName', 'Project')}</label>
            <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="my-project" className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('terminal.securityLevel', 'Security Level')}</label>
            <select value={securityLevel} onChange={e => setSecurityLevel(e.target.value)} className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm">
              <option value="safe">Safe</option>
              <option value="cautious">Cautious</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-warm-400 mb-1">{t('terminal.command', 'Command')}</label>
          <input value={command} onChange={e => setCommand(e.target.value)} placeholder="npm run build" className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm font-mono" onKeyDown={e => e.key === 'Enter' && handleExecute()} />
        </div>
        <button onClick={handleExecute} disabled={loading || !command} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? t('terminal.executing', 'Executing...') : t('terminal.execute', 'Execute Command')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">{t('terminal.result', 'Result')}</h3>
              <div className="flex items-center gap-2">
                {result.execution.blocked ? (
                  <span className="text-red-400 text-sm font-medium">{t('terminal.blocked', 'BLOCKED')}</span>
                ) : result.execution.autoApproved ? (
                  <span className="text-green-400 text-sm font-medium">{t('terminal.autoApproved', 'Auto-approved')}</span>
                ) : (
                  <span className="text-yellow-400 text-sm font-medium">{t('terminal.manualApproval', 'Manual approval')}</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('terminal.exitCode', 'Exit Code')}</div>
                <div className={`text-lg font-bold ${result.execution.exitCode === 0 ? 'text-green-400' : 'text-red-400'}`}>{result.execution.exitCode}</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('terminal.category', 'Category')}</div>
                <div className="text-white text-lg font-bold capitalize">{result.execution.category}</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('terminal.duration', 'Duration')}</div>
                <div className="text-white text-lg font-bold">{(result.execution.durationMs / 1000).toFixed(1)}s</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('terminal.outputLines', 'Output Lines')}</div>
                <div className="text-white text-lg font-bold">{result.execution.outputLines}</div>
              </div>
            </div>
          </div>

          {result.policyMatch.matched && (
            <div className={`rounded-lg p-3 text-sm ${result.policyMatch.list === 'deny' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
              {t('terminal.policyMatch', 'Policy match')}: {result.policyMatch.list} list — <code className="font-mono">{result.policyMatch.pattern}</code>
            </div>
          )}

          {result.output && (
            <div className="bg-warm-900 rounded-lg p-4 font-mono text-sm text-green-400 whitespace-pre-wrap">
              {result.output}
            </div>
          )}

          {result.execution.blocked && result.execution.blockReason && (
            <div className="bg-red-900/30 rounded-lg p-4 text-red-400 text-sm">
              {result.execution.blockReason}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function HistoryTab() {
  const { t } = useTranslation()
  const [executions, setExecutions] = useState<TerminalExecution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { listExecutions().then(setExecutions).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>
  if (!executions.length) return <div className="text-warm-400 text-sm">{t('terminal.noHistory', 'No terminal executions yet.')}</div>

  return (
    <div className="space-y-2">
      {executions.map(ex => (
        <div key={ex.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white text-sm font-mono">{ex.command}</div>
            <div className="text-warm-500 text-xs mt-1">
              {ex.category} | {ex.blocked ? 'blocked' : `exit ${ex.exitCode}`} | {ex.autoApproved ? 'auto' : 'manual'} | {(ex.durationMs / 1000).toFixed(1)}s
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${ex.blocked ? 'text-red-400' : ex.exitCode === 0 ? 'text-green-400' : 'text-yellow-400'}`}>{ex.status}</span>
            <button onClick={async () => { await deleteExecution(ex.id); setExecutions(p => p.filter(x => x.id !== ex.id)) }} className="text-red-400 hover:text-red-300 text-xs">{t('common.delete', 'Delete')}</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function PoliciesTab() {
  const { t } = useTranslation()
  const [policies, setPolicies] = useState<PolicyInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getPolicies().then(setPolicies).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>
  if (!policies) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {policies.securityLevels.map(sl => (
          <div key={sl.id} className="bg-warm-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sl.color }} />
              <span className="text-white font-medium">{sl.name}</span>
            </div>
            <p className="text-warm-400 text-sm">{sl.description}</p>
          </div>
        ))}
      </div>
      <div className="bg-warm-800 rounded-lg p-4">
        <h3 className="text-green-400 font-semibold mb-3">{t('terminal.allowList', 'Allow List (Auto-Execute)')}</h3>
        <div className="space-y-1">
          {policies.allowList.map((a, i) => (
            <div key={i} className="flex items-center justify-between bg-warm-700 rounded p-2">
              <span className="text-white font-mono text-sm">{a.pattern}</span>
              <span className="text-warm-500 text-xs capitalize">{a.category}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-warm-800 rounded-lg p-4">
        <h3 className="text-red-400 font-semibold mb-3">{t('terminal.denyList', 'Deny List (Always Block)')}</h3>
        <div className="space-y-1">
          {policies.denyList.map((d, i) => (
            <div key={i} className="flex items-center justify-between bg-warm-700 rounded p-2">
              <span className="text-white font-mono text-sm">{d.pattern}</span>
              <span className={`text-xs ${d.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}>{d.severity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatsTab() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<TerminalStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getTerminalStats().then(setStats).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>
  if (!stats || stats.totalExecutions === 0) return <div className="text-warm-400 text-sm">{t('terminal.noStats', 'No terminal execution statistics yet.')}</div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('terminal.stats.total', 'Total Executions')}</div>
          <div className="text-white text-xl font-bold">{stats.totalExecutions}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('terminal.stats.autoApproved', 'Auto-Approved')}</div>
          <div className="text-green-400 text-xl font-bold">{stats.autoApproved}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('terminal.stats.blocked', 'Blocked')}</div>
          <div className="text-red-400 text-xl font-bold">{stats.blocked}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('terminal.stats.successRate', 'Success Rate')}</div>
          <div className="text-blue-400 text-xl font-bold">{stats.successRate}%</div>
        </div>
      </div>
      {stats.byCategory && stats.byCategory.length > 0 && (
        <div className="bg-warm-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">{t('terminal.stats.byCategory', 'By Category')}</h3>
          <div className="space-y-2">
            {stats.byCategory.map((c, i) => (
              <div key={i} className="flex items-center justify-between bg-warm-700 rounded p-2">
                <span className="text-white text-sm capitalize">{c.category}</span>
                <div className="flex gap-4">
                  <span className="text-warm-400 text-sm">{c.count} runs</span>
                  <span className="text-green-400 text-sm">{c.autoApproved} auto</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
