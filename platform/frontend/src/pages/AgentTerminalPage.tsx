import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../api/agentterminal'

type Tab = 'execute' | 'sessions' | 'sandboxes' | 'stats'

export default function AgentTerminalPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('execute')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{t('terminal.title', 'Agent Terminal & Browser')}</h2>
        <p className="text-warm-400 mt-1">{t('terminal.subtitle', 'Terminal and browser access for AI agents with sandboxed execution')}</p>
      </div>
      <div className="flex gap-2">
        {(['execute', 'sessions', 'sandboxes', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-300 hover:bg-warm-600'}`}>
            {t(`terminal.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'execute' && <ExecuteTab />}
      {tab === 'sessions' && <SessionsTab />}
      {tab === 'sandboxes' && <SandboxesTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function ExecuteTab() {
  const { t } = useTranslation()
  const [project, setProject] = useState('')
  const [command, setCommand] = useState('')
  const [mode, setMode] = useState('terminal')
  const [sandbox, setSandbox] = useState('docker')
  const [sandboxes, setSandboxes] = useState<api.SandboxType[]>([])
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<api.ExecuteResponse | null>(null)

  useEffect(() => { api.getSandboxTypes().then(setSandboxes).catch(() => {}) }, [])

  const handleExecute = async () => {
    if (!project.trim()) return
    setRunning(true)
    try {
      const res = await api.executeCommand(project, command || undefined, mode, sandbox)
      setResult(res)
    } catch { /* ignore */ }
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">{t('terminal.executeTitle', 'Execute Agent Task')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('terminal.projectName', 'Project Name')}</label>
            <input value={project} onChange={e => setProject(e.target.value)} placeholder="my-app" className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('terminal.command', 'Command')}</label>
            <input value={command} onChange={e => setCommand(e.target.value)} placeholder="npm install" className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white font-mono" />
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('terminal.accessMode', 'Access Mode')}</label>
            <select value={mode} onChange={e => setMode(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="terminal">{t('terminal.modeTerminal', 'Terminal Only')}</option>
              <option value="browser">{t('terminal.modeBrowser', 'Browser Only')}</option>
              <option value="both">{t('terminal.modeBoth', 'Terminal + Browser')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('terminal.sandbox', 'Sandbox Type')}</label>
            <select value={sandbox} onChange={e => setSandbox(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              {sandboxes.map(sb => <option key={sb.id} value={sb.id}>{sb.name}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleExecute} disabled={running || !project.trim()} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          {running ? t('terminal.executing', 'Executing...') : t('terminal.executeBtn', 'Execute')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{result.session.commandsExecuted}</div>
              <div className="text-sm text-warm-400">{t('terminal.commands', 'Commands')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{result.session.browserActions}</div>
              <div className="text-sm text-warm-400">{t('terminal.browserActs', 'Browser Actions')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{result.session.subagentsDelegated}</div>
              <div className="text-sm text-warm-400">{t('terminal.subagents', 'Subagents')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{result.session.sessionDurationMs}ms</div>
              <div className="text-sm text-warm-400">{t('terminal.duration', 'Duration')}</div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">{t('terminal.commandLog', 'Command Log')}</h4>
            <div className="space-y-2">
              {result.commandResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-warm-900 rounded-lg font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${r.exitCode === 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-warm-300">$ {r.command}</span>
                  </div>
                  <span className="text-warm-500">{r.durationMs}ms</span>
                </div>
              ))}
            </div>
          </div>

          {result.browserResults && result.browserResults.length > 0 && (
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">{t('terminal.browserLog', 'Browser Actions')}</h4>
              <div className="space-y-2">
                {result.browserResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-warm-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">{r.action}</span>
                      <span className="text-xs text-warm-400">{r.url}</span>
                    </div>
                    {r.consoleErrors > 0 && <span className="px-2 py-0.5 text-xs bg-red-600 text-white rounded">{r.consoleErrors} errors</span>}
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

function SessionsTab() {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<api.AgentTerminalSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.listSessions().then(setSessions).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('terminal.loading', 'Loading...')}</div>
  if (sessions.length === 0) return <div className="text-warm-400">{t('terminal.noSessions', 'No agent sessions yet.')}</div>

  return (
    <div className="space-y-3">
      {sessions.map(s => (
        <div key={s.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">{s.projectName}</div>
            <div className="text-sm text-warm-400">{s.accessMode} · {s.sandboxType} · {s.commandsExecuted} {t('terminal.cmds', 'cmds')} · {s.filesModified} {t('terminal.files', 'files')}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs rounded ${s.status === 'completed' ? 'bg-green-600 text-white' : s.status === 'error' ? 'bg-red-600 text-white' : 'bg-warm-600 text-warm-300'}`}>
              {s.status}
            </span>
            <button onClick={async () => { await api.deleteSession(s.id); setSessions(p => p.filter(x => x.id !== s.id)) }} className="text-red-400 hover:text-red-300 text-sm">
              {t('terminal.delete', 'Delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function SandboxesTab() {
  const { t } = useTranslation()
  const [sandboxes, setSandboxes] = useState<api.SandboxType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getSandboxTypes().then(setSandboxes).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('terminal.loading', 'Loading...')}</div>

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('terminal.sandboxesTitle', 'Sandbox Environments')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sandboxes.map(sb => (
            <div key={sb.id} className="p-4 bg-warm-700 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: sb.color }} />
                <h4 className="text-white font-medium">{sb.name}</h4>
              </div>
              <p className="text-sm text-warm-400">{sb.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('terminal.securityTitle', 'Security Controls')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: t('terminal.sec.cpu', 'CPU Limit'), value: '50%', desc: t('terminal.sec.cpuDesc', 'Maximum CPU allocation') },
            { label: t('terminal.sec.memory', 'Memory Limit'), value: '512 MB', desc: t('terminal.sec.memoryDesc', 'Maximum memory allocation') },
            { label: t('terminal.sec.timeout', 'Timeout'), value: '30 min', desc: t('terminal.sec.timeoutDesc', 'Maximum session duration') },
            { label: t('terminal.sec.network', 'Network'), value: t('terminal.sec.restricted', 'Restricted'), desc: t('terminal.sec.networkDesc', 'Egress controlled via allowlist') },
            { label: t('terminal.sec.filesystem', 'Filesystem'), value: t('terminal.sec.isolated', 'Isolated'), desc: t('terminal.sec.fsDesc', 'Writes restricted to project workspace') },
            { label: t('terminal.sec.commands', 'Commands'), value: t('terminal.sec.whitelisted', 'Whitelisted'), desc: t('terminal.sec.cmdDesc', 'Only approved commands allowed') },
          ].map(s => (
            <div key={s.label} className="p-3 bg-warm-700 rounded-lg">
              <div className="text-sm text-warm-400">{s.label}</div>
              <div className="text-white font-medium">{s.value}</div>
              <div className="text-xs text-warm-500 mt-1">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatsTab() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<api.TerminalStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getTerminalStats().then(setStats).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('terminal.loading', 'Loading...')}</div>
  if (!stats || stats.totalSessions === 0) return <div className="text-warm-400">{t('terminal.noStats', 'No session statistics yet.')}</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-warm-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.totalSessions}</div>
          <div className="text-sm text-warm-400">{t('terminal.stats.sessions', 'Sessions')}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.totalCommands}</div>
          <div className="text-sm text-warm-400">{t('terminal.stats.commands', 'Commands')}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.totalBrowserActions}</div>
          <div className="text-sm text-warm-400">{t('terminal.stats.browser', 'Browser Actions')}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.totalSubagents}</div>
          <div className="text-sm text-warm-400">{t('terminal.stats.subagents', 'Subagents')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('terminal.stats.byMode', 'By Access Mode')}</h4>
          <div className="space-y-2">
            {stats.byMode.map(m => (
              <div key={m.mode} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{m.mode}</span>
                <span className="text-warm-400 text-sm">{m.count} {t('terminal.sessionsLabel', 'sessions')}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('terminal.stats.bySandbox', 'By Sandbox')}</h4>
          <div className="space-y-2">
            {stats.bySandbox.map(s => (
              <div key={s.sandbox} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{s.sandbox}</span>
                <span className="text-warm-400 text-sm">{s.count} {t('terminal.sessionsLabel', 'sessions')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
