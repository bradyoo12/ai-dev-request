import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getAgents, getConsents, registerAgent, grantConsent, revokeConsent, getA2ATasks } from '../api/a2a'
import type { AgentCard, A2AConsent, A2ATask } from '../api/a2a'

export default function A2APage() {
  const { t } = useTranslation()
  const [agents, setAgents] = useState<AgentCard[]>([])
  const [consents, setConsents] = useState<A2AConsent[]>([])
  const [tasks, setTasks] = useState<A2ATask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  const [showConsentDialog, setShowConsentDialog] = useState(false)
  const [tab, setTab] = useState<'agents' | 'consents' | 'tasks'>('agents')

  // Register form state
  const [regKey, setRegKey] = useState('')
  const [regName, setRegName] = useState('')
  const [regDesc, setRegDesc] = useState('')
  const [regScopes, setRegScopes] = useState('')
  const [registering, setRegistering] = useState(false)

  // Consent form state
  const [consentFrom, setConsentFrom] = useState(0)
  const [consentTo, setConsentTo] = useState(0)
  const [consentScopes, setConsentScopes] = useState('')
  const [granting, setGranting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [agentsData, consentsData, tasksData] = await Promise.all([
        getAgents(),
        getConsents(),
        getA2ATasks(),
      ])
      setAgents(agentsData)
      setConsents(consentsData)
      setTasks(tasksData)
    } catch {
      setError(t('a2a.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { loadData() }, [loadData])

  const handleRegister = async () => {
    if (!regKey || !regName) return
    try {
      setRegistering(true)
      await registerAgent({ agentKey: regKey, name: regName, description: regDesc || undefined, scopes: regScopes || undefined })
      setShowRegisterDialog(false)
      setRegKey('')
      setRegName('')
      setRegDesc('')
      setRegScopes('')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('a2a.registerError'))
    } finally {
      setRegistering(false)
    }
  }

  const handleGrantConsent = async () => {
    if (!consentFrom || !consentTo || !consentScopes) return
    try {
      setGranting(true)
      await grantConsent({ fromAgentId: consentFrom, toAgentId: consentTo, scopes: consentScopes })
      setShowConsentDialog(false)
      setConsentFrom(0)
      setConsentTo(0)
      setConsentScopes('')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('a2a.consentError'))
    } finally {
      setGranting(false)
    }
  }

  const handleRevoke = async (consentId: number) => {
    try {
      await revokeConsent(consentId)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('a2a.revokeError'))
    }
  }

  const getAgentName = (id: number) => agents.find(a => a.id === id)?.name || `Agent #${id}`

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-900/50 text-green-400'
      case 'Working': return 'bg-blue-900/50 text-blue-400'
      case 'Submitted': return 'bg-yellow-900/50 text-yellow-400'
      case 'Failed': return 'bg-red-900/50 text-red-400'
      default: return 'bg-warm-700 text-warm-400'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-warm-400">{t('a2a.loading')}</p>
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
      <div className="flex gap-2 border-b border-warm-700 pb-2">
        {(['agents', 'consents', 'tasks'] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              tab === tabKey ? 'bg-warm-800 text-white' : 'text-warm-400 hover:text-warm-200'
            }`}
          >
            {t(`a2a.tab.${tabKey}`)}
          </button>
        ))}
      </div>

      {/* Agents Tab */}
      {tab === 'agents' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{t('a2a.agents.title')}</h3>
            <button
              onClick={() => setShowRegisterDialog(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              {t('a2a.agents.register')}
            </button>
          </div>

          {agents.length === 0 ? (
            <div className="bg-warm-800 rounded-xl p-8 text-center text-warm-400">
              <p>{t('a2a.agents.empty')}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-warm-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center text-blue-400 font-bold text-sm">
                        {agent.agentKey.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold">{agent.name}</div>
                        <div className="text-xs text-warm-500">{agent.agentKey}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      agent.isActive ? 'bg-green-900/50 text-green-400' : 'bg-warm-700 text-warm-400'
                    }`}>
                      {agent.isActive ? t('a2a.agents.active') : t('a2a.agents.inactive')}
                    </span>
                  </div>
                  {agent.description && (
                    <p className="text-sm text-warm-400 mb-2">{agent.description}</p>
                  )}
                  {agent.scopes && (
                    <div className="flex flex-wrap gap-1">
                      {agent.scopes.split(',').map((scope) => (
                        <span key={scope} className="px-1.5 py-0.5 bg-warm-700 text-warm-300 rounded text-[10px]">
                          {scope.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Consents Tab */}
      {tab === 'consents' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{t('a2a.consents.title')}</h3>
            <button
              onClick={() => setShowConsentDialog(true)}
              disabled={agents.length < 2}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
            >
              {t('a2a.consents.grant')}
            </button>
          </div>

          {consents.length === 0 ? (
            <div className="bg-warm-800 rounded-xl p-8 text-center text-warm-400">
              <p>{t('a2a.consents.empty')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {consents.map((consent) => (
                <div key={consent.id} className="bg-warm-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{getAgentName(consent.fromAgentId)}</span>
                      <span className="text-warm-500">&rarr;</span>
                      <span className="font-medium">{getAgentName(consent.toAgentId)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {consent.scopes.split(',').map((scope) => (
                        <span key={scope} className="px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded text-[10px]">
                          {scope.trim()}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-warm-500 mt-1">
                      {consent.isGranted ? t('a2a.consents.granted') : t('a2a.consents.revoked')}
                      {consent.expiresAt && ` · ${t('a2a.consents.expires')}: ${new Date(consent.expiresAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  {consent.isGranted && (
                    <button
                      onClick={() => handleRevoke(consent.id)}
                      className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-400 rounded-lg text-xs transition-colors"
                    >
                      {t('a2a.consents.revoke')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div>
          <h3 className="text-lg font-bold mb-4">{t('a2a.tasks.title')}</h3>

          {tasks.length === 0 ? (
            <div className="bg-warm-800 rounded-xl p-8 text-center text-warm-400">
              <p>{t('a2a.tasks.empty')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="bg-warm-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{getAgentName(task.fromAgentId)}</span>
                      <span className="text-warm-500">&rarr;</span>
                      <span className="font-medium">{getAgentName(task.toAgentId)}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="text-xs text-warm-500">
                    {task.taskUid.slice(0, 8)}... · {new Date(task.createdAt).toLocaleString()}
                  </div>
                  {task.errorMessage && (
                    <div className="text-xs text-red-400 mt-1">{task.errorMessage}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Register Agent Dialog */}
      {showRegisterDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{t('a2a.agents.register')}</h3>
              <button onClick={() => setShowRegisterDialog(false)} className="text-warm-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('a2a.agents.keyLabel')}</label>
                <input
                  value={regKey}
                  onChange={(e) => setRegKey(e.target.value)}
                  placeholder="health-ai"
                  className="w-full bg-warm-900 border border-warm-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('a2a.agents.nameLabel')}</label>
                <input
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="AI Health Manager"
                  className="w-full bg-warm-900 border border-warm-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('a2a.agents.descLabel')}</label>
                <textarea
                  value={regDesc}
                  onChange={(e) => setRegDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-warm-900 border border-warm-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('a2a.agents.scopesLabel')}</label>
                <input
                  value={regScopes}
                  onChange={(e) => setRegScopes(e.target.value)}
                  placeholder="health:read, meal:write"
                  className="w-full bg-warm-900 border border-warm-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={handleRegister}
                disabled={registering || !regKey || !regName}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg font-medium transition-colors"
              >
                {registering ? t('a2a.agents.registering') : t('a2a.agents.register')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Consent Dialog */}
      {showConsentDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{t('a2a.consents.grant')}</h3>
              <button onClick={() => setShowConsentDialog(false)} className="text-warm-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('a2a.consents.fromAgent')}</label>
                <select
                  value={consentFrom}
                  onChange={(e) => setConsentFrom(Number(e.target.value))}
                  className="w-full bg-warm-900 border border-warm-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={0}>--</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('a2a.consents.toAgent')}</label>
                <select
                  value={consentTo}
                  onChange={(e) => setConsentTo(Number(e.target.value))}
                  className="w-full bg-warm-900 border border-warm-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={0}>--</option>
                  {agents.filter(a => a.id !== consentFrom).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('a2a.consents.scopesLabel')}</label>
                <input
                  value={consentScopes}
                  onChange={(e) => setConsentScopes(e.target.value)}
                  placeholder="health:read, meal:write"
                  className="w-full bg-warm-900 border border-warm-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={handleGrantConsent}
                disabled={granting || !consentFrom || !consentTo || !consentScopes}
                className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-warm-600 rounded-lg font-medium transition-colors"
              >
                {granting ? t('a2a.consents.granting') : t('a2a.consents.grant')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
