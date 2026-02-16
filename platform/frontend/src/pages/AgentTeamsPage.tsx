import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getUserTeams, getPublicTeams, createTeam, updateTeam,
  deleteTeam, createFromTemplate, forkTeam,
} from '../api/agent-teams'
import type { AgentTeam, CreateAgentTeamPayload } from '../api/agent-teams'
import { StatusBadge } from '../components/StatusBadge'

type TabView = 'my-teams' | 'templates' | 'community'

const TEAM_TEMPLATES = [
  { id: 'full-stack', name: 'Full-Stack Team', description: 'Frontend + Backend + Testing agents working in parallel', strategy: 'parallel', roles: ['frontend', 'backend', 'testing'] },
  { id: 'frontend-only', name: 'Frontend Team', description: 'UI + Styling + Testing agents for frontend work', strategy: 'pipeline', roles: ['ui-developer', 'testing', 'reviewer'] },
  { id: 'api-only', name: 'API Team', description: 'Backend API + Database + Testing agents', strategy: 'sequential', roles: ['api-developer', 'testing', 'docs'] },
  { id: 'review-team', name: 'Review Team', description: 'Multi-agent code review with security, quality, and performance', strategy: 'parallel', roles: ['security', 'quality', 'performance'] },
]

export default function AgentTeamsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabView>('my-teams')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [myTeams, setMyTeams] = useState<AgentTeam[]>([])
  const [communityTeams, setCommunityTeams] = useState<AgentTeam[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingTeam, setEditingTeam] = useState<AgentTeam | null>(null)
  const [form, setForm] = useState<CreateAgentTeamPayload>({ name: '', description: '', strategy: 'parallel', membersJson: '[]', isPublic: false })
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const [my, comm] = await Promise.all([getUserTeams(), getPublicTeams(searchQuery || undefined)])
      setMyTeams(my); setCommunityTeams(comm)
    } catch { setError(t('agentTeams.error.loadFailed', 'Failed to load teams')) }
    finally { setLoading(false) }
  }, [t, searchQuery])

  useEffect(() => { loadData() }, [loadData])

  const resetForm = () => setForm({ name: '', description: '', strategy: 'parallel', membersJson: '[]', isPublic: false })

  const handleCreate = async () => {
    try { setError(''); if (!form.name.trim()) { setError('Name is required'); return }; await createTeam(form); setSuccess(t('agentTeams.createSuccess', 'Team created!')); setShowDialog(false); resetForm(); loadData() }
    catch { setError(t('agentTeams.error.createFailed', 'Failed to create team')) }
  }

  const handleUpdate = async () => {
    if (!editingTeam) return
    try { setError(''); await updateTeam(editingTeam.id, form); setSuccess(t('agentTeams.updateSuccess', 'Team updated!')); setShowDialog(false); setEditingTeam(null); resetForm(); loadData() }
    catch { setError(t('agentTeams.error.updateFailed', 'Failed to update team')) }
  }

  const handleDelete = async (id: string) => {
    try { setError(''); await deleteTeam(id); setSuccess(t('agentTeams.deleteSuccess', 'Team deleted!')); setDeleteConfirmId(null); loadData() }
    catch { setError(t('agentTeams.error.deleteFailed', 'Failed to delete team')) }
  }

  const handleCreateFromTemplate = async (template: string) => {
    try { setError(''); await createFromTemplate(template); setSuccess(t('agentTeams.templateSuccess', 'Team created from template!')); setActiveTab('my-teams'); loadData() }
    catch { setError(t('agentTeams.error.templateFailed', 'Failed to create from template')) }
  }

  const handleFork = async (id: string) => {
    try { setError(''); await forkTeam(id); setSuccess(t('agentTeams.forkSuccess', 'Team forked!')); loadData() }
    catch { setError(t('agentTeams.error.forkFailed', 'Failed to fork team')) }
  }

  const openEditDialog = (team: AgentTeam) => {
    setEditingTeam(team)
    setForm({ name: team.name, description: team.description || '', strategy: team.strategy, membersJson: team.membersJson, template: team.template || undefined, isPublic: team.isPublic })
    setShowDialog(true)
  }

  const parseMembers = (membersJson: string): { role: string; skillType: string }[] => {
    try { return JSON.parse(membersJson) } catch { return [] }
  }

  const strategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'parallel': return 'Parallel'
      case 'sequential': return 'Sequential'
      case 'pipeline': return 'Pipeline'
      default: return strategy
    }
  }

  const strategyColor = (strategy: string) => {
    switch (strategy) {
      case 'parallel': return 'bg-blue-600/20 text-blue-400'
      case 'sequential': return 'bg-yellow-600/20 text-yellow-400'
      case 'pipeline': return 'bg-purple-600/20 text-purple-400'
      default: return 'bg-warm-700 text-warm-400'
    }
  }

  if (loading) return <div className="text-center py-12 text-warm-400">{t('agentTeams.loading', 'Loading teams...')}</div>

  return (
    <div className="space-y-6" data-testid="agent-teams-page">
      {error && <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">{error}<button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button></div>}
      {success && <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-green-400">{success}<button onClick={() => setSuccess('')} className="ml-2 text-green-300 hover:text-white">&times;</button></div>}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{t('agentTeams.title', 'Agent Teams')}</h3>
          <p className="text-sm text-warm-400">{t('agentTeams.description', 'Compose multi-agent teams for parallel execution')}</p>
        </div>
        <button onClick={() => { resetForm(); setEditingTeam(null); setShowDialog(true) }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('agentTeams.create', 'Create Team')}</button>
      </div>

      <div className="flex gap-1 bg-warm-800 rounded-lg p-1">
        {(['my-teams', 'templates', 'community'] as TabView[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'}`}>
            {tab === 'my-teams' ? t('agentTeams.myTeams', 'My Teams') : tab === 'templates' ? t('agentTeams.templates', 'Templates') : t('agentTeams.community', 'Community')}
            {tab === 'my-teams' && <span className="ml-1 text-warm-500">({myTeams.length})</span>}
            {tab === 'community' && <span className="ml-1 text-warm-500">({communityTeams.length})</span>}
          </button>
        ))}
      </div>

      {activeTab === 'community' && (
        <div className="flex gap-2">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('agentTeams.searchPlaceholder', 'Search teams...')} className="flex-1 bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none" />
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEAM_TEMPLATES.map(tmpl => (
            <div key={tmpl.id} className="bg-warm-900 rounded-xl p-5 border border-warm-800 hover:border-warm-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <h5 className="font-bold text-sm">{tmpl.name}</h5>
                <span className={`text-[10px] px-2 py-0.5 rounded ${strategyColor(tmpl.strategy)}`}>{strategyLabel(tmpl.strategy)}</span>
              </div>
              <p className="text-warm-400 text-xs mb-4">{tmpl.description}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {tmpl.roles.map(role => <span key={role} className="bg-warm-800 text-warm-300 text-[10px] px-2 py-0.5 rounded">{role}</span>)}
              </div>
              <button onClick={() => handleCreateFromTemplate(tmpl.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('agentTeams.useTemplate', 'Use Template')}</button>
            </div>
          ))}
        </div>
      )}

      {activeTab !== 'templates' && (
        <>
          {(activeTab === 'my-teams' ? myTeams : communityTeams).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeTab === 'my-teams' ? myTeams : communityTeams).map(team => (
                <div key={team.id} className="bg-warm-900 rounded-xl p-4 border border-warm-800 hover:border-warm-700 transition-colors" data-testid="team-card">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-bold text-sm truncate flex-1">{team.name}</h5>
                    <div className="flex items-center gap-1 ml-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${strategyColor(team.strategy)}`}>{strategyLabel(team.strategy)}</span>
                      <StatusBadge status={team.status} />
                    </div>
                  </div>
                  {team.description && <p className="text-warm-400 text-xs mb-3 line-clamp-2">{team.description}</p>}
                  {team.template && <span className="bg-green-600/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded mr-1">{team.template}</span>}

                  <div className="flex flex-wrap gap-1 mt-2 mb-3">
                    {parseMembers(team.membersJson).map((m, i) => (
                      <span key={i} className="bg-warm-800 text-warm-300 text-[10px] px-1.5 py-0.5 rounded">{m.role || m.skillType}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-warm-800">
                    <div className="flex items-center gap-3 text-xs text-warm-400">
                      <span>{team.executionCount} {t('agentTeams.executions', 'runs')}</span>
                      {team.isPublic && <span className="text-purple-400">{t('agentTeams.public', 'Public')}</span>}
                    </div>
                    <div className="flex gap-1">
                      {activeTab === 'community' && <button onClick={() => handleFork(team.id)} className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded bg-warm-800 hover:bg-warm-700 transition-colors">{t('agentTeams.fork', 'Fork')}</button>}
                      {activeTab === 'my-teams' && (
                        <>
                          <button onClick={() => openEditDialog(team)} className="text-warm-400 hover:text-white text-xs px-2 py-1 rounded bg-warm-800 hover:bg-warm-700 transition-colors">{t('agentTeams.edit', 'Edit')}</button>
                          <button onClick={() => setDeleteConfirmId(team.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-warm-800 hover:bg-warm-700 transition-colors">&times;</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-12 text-warm-400">{t('agentTeams.noTeams', 'No teams found. Create one or use a template!')}</div>}
        </>
      )}

      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-900 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingTeam ? t('agentTeams.editTeam', 'Edit Team') : t('agentTeams.create', 'Create Team')}</h3>
            <div className="space-y-4">
              <div><label className="block text-sm text-warm-400 mb-1">{t('agentTeams.name', 'Name')}</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none" /></div>
              <div><label className="block text-sm text-warm-400 mb-1">{t('agentTeams.teamDescription', 'Description')}</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none resize-none" /></div>
              <div><label className="block text-sm text-warm-400 mb-1">{t('agentTeams.strategy', 'Strategy')}</label>
                <select value={form.strategy} onChange={e => setForm({ ...form, strategy: e.target.value })} className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700">
                  <option value="parallel">Parallel</option>
                  <option value="sequential">Sequential</option>
                  <option value="pipeline">Pipeline</option>
                </select>
              </div>
              <div><label className="block text-sm text-warm-400 mb-1">{t('agentTeams.members', 'Members')} (JSON)</label><textarea value={form.membersJson} onChange={e => setForm({ ...form, membersJson: e.target.value })} rows={6} className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none resize-none font-mono" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="isPublicTeam" checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} className="rounded border-warm-700" /><label htmlFor="isPublicTeam" className="text-sm text-warm-400">{t('agentTeams.public', 'Public')}</label></div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowDialog(false); setEditingTeam(null); resetForm() }} className="flex-1 bg-warm-700 hover:bg-warm-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('agentTeams.cancel', 'Cancel')}</button>
                <button onClick={editingTeam ? handleUpdate : handleCreate} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{editingTeam ? t('agentTeams.save', 'Save') : t('agentTeams.create', 'Create Team')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-900 rounded-xl p-6 w-full max-w-sm">
            <p className="text-sm mb-4">{t('agentTeams.deleteConfirm', 'Are you sure you want to delete this team?')}</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 bg-warm-700 hover:bg-warm-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('agentTeams.cancel', 'Cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('agentTeams.delete', 'Delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
