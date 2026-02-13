import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listMessages, sendMessage, deleteMessage, getMessageStats, getProtocols } from '../api/agentmessages'
import type { AgentMessage, SendResponse, Protocol, MessageStats } from '../api/agentmessages'

type Tab = 'send' | 'history' | 'protocols' | 'stats'

export default function AgentMessagesPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('send')
  const [project, setProject] = useState('')
  const [msgType, setMsgType] = useState('task-delegation')
  const [fromAgent, setFromAgent] = useState('')
  const [toAgent, setToAgent] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState('normal')
  const [result, setResult] = useState<SendResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<AgentMessage[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [stats, setStats] = useState<MessageStats>({ total: 0, byType: [] })

  useEffect(() => {
    if (tab === 'history') listMessages().then(setHistory)
    if (tab === 'protocols') getProtocols().then(setProtocols)
    if (tab === 'stats') getMessageStats().then(setStats)
  }, [tab])

  const handleSend = async () => {
    if (!project || !fromAgent || !toAgent) return
    setLoading(true)
    try {
      const r = await sendMessage(project, msgType, fromAgent, toAgent, content, priority)
      setResult(r)
    } finally {
      setLoading(false)
    }
  }

  const priorityColor = (p: string) => {
    switch (p) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-600'
      case 'normal': return 'bg-blue-600'
      case 'low': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'delivered': return 'text-green-400'
      case 'acknowledged': return 'text-blue-400'
      case 'sent': return 'text-yellow-400'
      case 'failed': return 'text-red-400'
      default: return 'text-warm-400'
    }
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('agentmsg.title', 'Agent-to-Agent Communication')}</h3>
      <div className="flex gap-2 mb-6">
        {(['send', 'history', 'protocols', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-400 hover:text-white'}`}
          >{t(`agentmsg.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}</button>
        ))}
      </div>

      {tab === 'send' && (
        <div className="bg-warm-800 rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('agentmsg.project', 'Project Name')}</label>
              <input value={project} onChange={e => setProject(e.target.value)} placeholder="my-project"
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('agentmsg.msgType', 'Message Type')}</label>
              <select value={msgType} onChange={e => setMsgType(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white">
                <option value="task-delegation">Task Delegation</option>
                <option value="resource-lock">Resource Lock</option>
                <option value="progress-update">Progress Update</option>
                <option value="conflict-resolution">Conflict Resolution</option>
                <option value="heartbeat">Heartbeat</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('agentmsg.from', 'From Agent')}</label>
              <input value={fromAgent} onChange={e => setFromAgent(e.target.value)} placeholder="orchestrator"
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('agentmsg.to', 'To Agent')}</label>
              <input value={toAgent} onChange={e => setToAgent(e.target.value)} placeholder="code-generator"
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('agentmsg.priority', 'Priority')}</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-warm-400 mb-1">{t('agentmsg.content', 'Content')}</label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Task specification or resource name..."
              className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white h-24 resize-none" />
          </div>
          <button onClick={handleSend} disabled={loading || !project || !fromAgent || !toAgent}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? t('agentmsg.sending', 'Sending...') : t('agentmsg.send', 'Send Message')}
          </button>

          {result && (
            <div className="mt-6 bg-warm-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">{t('agentmsg.result', 'Message Result')}</h4>
                <span className={`text-sm font-medium ${statusColor(result.deliveryStatus)}`}>
                  {result.deliveryStatus.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-sm">{t('agentmsg.latency', 'Latency')}</div>
                  <div className="text-xl font-bold text-white">{result.latencyMs}ms</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-sm">{t('agentmsg.ack', 'Acknowledged')}</div>
                  <div className={`text-xl font-bold ${result.acknowledged ? 'text-green-400' : 'text-yellow-400'}`}>
                    {result.acknowledged ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-sm">{t('agentmsg.correlation', 'Correlation ID')}</div>
                  <div className="text-sm font-mono text-white">{result.correlationId}</div>
                </div>
              </div>
              <div className="bg-warm-800 rounded-lg p-3 mb-4">
                <div className="text-warm-400 text-sm mb-1">{t('agentmsg.payload', 'Payload')}</div>
                <pre className="text-warm-300 text-sm overflow-auto">{JSON.stringify(result.payload, null, 2)}</pre>
              </div>
              <div className="bg-warm-800 rounded-lg p-3">
                <div className="text-warm-400 text-sm mb-1">{t('agentmsg.recommendation', 'Status')}</div>
                <div className="text-white text-sm">{result.recommendation}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 && <div className="text-warm-400 text-center py-8">{t('agentmsg.noHistory', 'No messages yet')}</div>}
          {history.map(m => (
            <div key={m.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{m.fromAgent} → {m.toAgent}</span>
                  <span className="bg-warm-700 text-warm-300 px-2 py-0.5 rounded text-xs">{m.messageType}</span>
                  <span className={`${priorityColor(m.priority)} text-white text-xs px-2 py-0.5 rounded`}>{m.priority}</span>
                  <span className={`text-xs font-medium ${statusColor(m.deliveryStatus)}`}>{m.deliveryStatus}</span>
                </div>
                <div className="text-warm-400 text-sm mt-1">
                  {m.projectName} | {m.latencyMs}ms | {m.correlationId} | {new Date(m.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button onClick={async () => { await deleteMessage(m.id); setHistory(h => h.filter(x => x.id !== m.id)) }}
                className="text-red-400 hover:text-red-300 text-sm">{t('common.delete', 'Delete')}</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'protocols' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {protocols.map(p => (
            <div key={p.id} className="bg-warm-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">{p.name}</h4>
                {p.requiresAck && <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">ACK Required</span>}
              </div>
              <p className="text-warm-400 text-sm mb-3">{p.description}</p>
              <div className="text-sm text-warm-400 mb-2">{t('agentmsg.fields', 'Protocol Fields')}:</div>
              <div className="flex flex-wrap gap-2">
                {p.fields.map(f => (
                  <span key={f} className="bg-warm-700 text-warm-300 px-2 py-1 rounded text-xs font-mono">{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div>
          <div className="bg-warm-800 rounded-lg p-6 mb-4">
            <div className="text-warm-400 text-sm">{t('agentmsg.totalMessages', 'Total Messages')}</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.byType.map(s => (
              <div key={s.type} className="bg-warm-800 rounded-lg p-4">
                <div className="text-white font-medium">{s.type}</div>
                <div className="text-warm-400 text-sm mt-1">
                  {t('agentmsg.stats.count', 'Count')}: {s.count} | {t('agentmsg.stats.avgLatency', 'Avg Latency')}: {s.avgLatency}ms
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
