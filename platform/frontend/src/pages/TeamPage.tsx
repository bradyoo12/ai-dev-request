import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  getTeams,
  createTeam,
  deleteTeam,
  getMembers,
  addMember,
  removeMember,
  updateMemberRole,
  getActivities,
  type Team,
  type TeamMember,
  type TeamActivity,
} from '../api/teams'
import { useAuth } from '../contexts/AuthContext'

const ROLES = ['editor', 'viewer'] as const

export default function TeamPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [activities, setActivities] = useState<TeamActivity[]>([])
  const [activeTab, setActiveTab] = useState<'members' | 'activity'>('members')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDesc, setNewTeamDesc] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('editor')
  const [creating, setCreating] = useState(false)
  const [adding, setAdding] = useState(false)

  async function loadTeams() {
    try {
      setLoading(true)
      const result = await getTeams()
      setTeams(result)
    } catch {
      setError(t('team.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTeams() }, [])

  async function handleSelectTeam(team: Team) {
    setSelectedTeam(team)
    try {
      const [m, a] = await Promise.all([
        getMembers(team.id),
        getActivities(team.id),
      ])
      setMembers(m)
      setActivities(a)
    } catch {
      setError(t('team.detailLoadError'))
    }
  }

  async function handleCreateTeam() {
    if (!newTeamName.trim()) return
    setCreating(true)
    try {
      const team = await createTeam(newTeamName.trim(), newTeamDesc.trim() || undefined)
      setTeams(prev => [team, ...prev])
      setNewTeamName('')
      setNewTeamDesc('')
      setShowCreate(false)
    } catch {
      setError(t('team.createError'))
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteTeam(teamId: number) {
    try {
      await deleteTeam(teamId)
      setTeams(prev => prev.filter(t => t.id !== teamId))
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null)
        setMembers([])
        setActivities([])
      }
    } catch {
      setError(t('team.deleteError'))
    }
  }

  async function handleAddMember() {
    if (!selectedTeam || !newMemberEmail.trim()) return
    setAdding(true)
    try {
      const member = await addMember(selectedTeam.id, newMemberEmail.trim(), newMemberRole)
      setMembers(prev => [...prev, member])
      setNewMemberEmail('')
      setShowAddMember(false)
    } catch {
      setError(t('team.addMemberError'))
    } finally {
      setAdding(false)
    }
  }

  async function handleRemoveMember(memberId: number) {
    if (!selectedTeam) return
    try {
      await removeMember(selectedTeam.id, memberId)
      setMembers(prev => prev.filter(m => m.id !== memberId))
    } catch {
      setError(t('team.removeMemberError'))
    }
  }

  async function handleRoleChange(memberId: number, role: string) {
    if (!selectedTeam) return
    try {
      const updated = await updateMemberRole(selectedTeam.id, memberId, role)
      setMembers(prev => prev.map(m => m.id === memberId ? updated : m))
    } catch {
      setError(t('team.roleChangeError'))
    }
  }

  function roleColor(role: string) {
    switch (role) {
      case 'owner': return 'text-yellow-400 bg-yellow-900/40'
      case 'editor': return 'text-blue-400 bg-blue-900/40'
      case 'viewer': return 'text-warm-400 bg-warm-700'
      default: return 'text-warm-400 bg-warm-700'
    }
  }

  function actionIcon(action: string) {
    switch (action) {
      case 'created': return '🏗️'
      case 'member_added': return '➕'
      case 'member_removed': return '➖'
      case 'role_changed': return '🔄'
      case 'project_shared': return '📁'
      default: return '📝'
    }
  }

  if (!authUser) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-2">{t('team.title')}</h2>
        <p className="text-warm-400">{t('team.loginRequired')}</p>
      </div>
    )
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto text-center py-8 text-warm-400">{t('team.loading')}</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-warm-400 hover:text-white transition-colors">
          &larr;
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{t('team.title')}</h2>
          <p className="text-sm text-warm-400 mt-1">{t('team.description')}</p>
        </div>
        {!selectedTeam && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            {t('team.create')}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {/* Create Team Dialog */}
      {showCreate && (
        <div className="bg-warm-800 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-white">{t('team.createTitle')}</h3>
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder={t('team.namePlaceholder')}
            className="w-full px-3 py-2 bg-warm-700 rounded-lg text-sm text-white placeholder-warm-500"
          />
          <input
            type="text"
            value={newTeamDesc}
            onChange={(e) => setNewTeamDesc(e.target.value)}
            placeholder={t('team.descPlaceholder')}
            className="w-full px-3 py-2 bg-warm-700 rounded-lg text-sm text-white placeholder-warm-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateTeam}
              disabled={creating || !newTeamName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
            >
              {creating ? t('team.creating') : t('team.create')}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-warm-700 hover:bg-warm-600 rounded-lg text-sm transition-colors"
            >
              {t('team.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Team List */}
      {!selectedTeam && (
        <div className="space-y-3">
          {teams.length === 0 ? (
            <div className="text-center py-12 bg-warm-800/50 rounded-lg">
              <p className="text-warm-400">{t('team.empty')}</p>
              <p className="text-sm text-warm-500 mt-1">{t('team.emptyHint')}</p>
            </div>
          ) : (
            teams.map((team) => (
              <button
                key={team.id}
                onClick={() => handleSelectTeam(team)}
                className="w-full bg-warm-800 rounded-lg p-4 flex items-center justify-between hover:bg-warm-750 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{team.name}</p>
                  {team.description && (
                    <p className="text-xs text-warm-500 mt-1 truncate">{team.description}</p>
                  )}
                  <p className="text-xs text-warm-600 mt-1">
                    {t('team.created')}: {new Date(team.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {team.ownerId === authUser?.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id) }}
                      className="px-2 py-1 text-xs bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors"
                    >
                      {t('team.delete')}
                    </button>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Team Detail */}
      {selectedTeam && (
        <div className="space-y-4">
          <button
            onClick={() => { setSelectedTeam(null); setMembers([]); setActivities([]) }}
            className="text-sm text-warm-400 hover:text-white transition-colors"
          >
            &larr; {t('team.backToList')}
          </button>

          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="font-semibold text-white text-lg">{selectedTeam.name}</h3>
            {selectedTeam.description && (
              <p className="text-sm text-warm-400 mt-1">{selectedTeam.description}</p>
            )}
            <p className="text-xs text-warm-600 mt-2">
              {t('team.created')}: {new Date(selectedTeam.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-warm-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'members' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
              }`}
            >
              {t('team.tab.members')} ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'activity' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
              }`}
            >
              {t('team.tab.activity')}
            </button>
          </div>

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddMember(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors"
                >
                  {t('team.addMember')}
                </button>
              </div>

              {showAddMember && (
                <div className="bg-warm-800 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-white text-sm">{t('team.addMemberTitle')}</h4>
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder={t('team.emailPlaceholder')}
                    className="w-full px-3 py-2 bg-warm-700 rounded-lg text-sm text-white placeholder-warm-500"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full px-3 py-2 bg-warm-700 rounded-lg text-sm text-white"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{t(`team.role.${r}`)}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddMember}
                      disabled={adding || !newMemberEmail.trim()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg text-xs font-medium transition-colors"
                    >
                      {adding ? t('team.adding') : t('team.add')}
                    </button>
                    <button
                      onClick={() => setShowAddMember(false)}
                      className="px-3 py-1.5 bg-warm-700 hover:bg-warm-600 rounded-lg text-xs transition-colors"
                    >
                      {t('team.cancel')}
                    </button>
                  </div>
                </div>
              )}

              {members.length === 0 ? (
                <div className="text-center py-8 text-warm-400">{t('team.noMembers')}</div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="bg-warm-800 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-warm-700 rounded-full flex items-center justify-center text-sm text-warm-300">
                          {member.userId.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm text-white">{member.userId}</p>
                          <p className="text-xs text-warm-500">{t('team.joined')}: {new Date(member.joinedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleColor(member.role)}`}>
                          {t(`team.role.${member.role}`)}
                        </span>
                        {member.role !== 'owner' && selectedTeam.ownerId === authUser?.id && (
                          <div className="flex gap-1">
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.id, e.target.value)}
                              className="px-2 py-1 bg-warm-700 rounded text-xs text-white"
                            >
                              {ROLES.map(r => (
                                <option key={r} value={r}>{t(`team.role.${r}`)}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="px-2 py-1 text-xs bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors"
                            >
                              &times;
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-2">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-warm-400">{t('team.noActivities')}</div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="bg-warm-800 rounded-lg p-3 flex items-start gap-3">
                    <span className="text-lg">{actionIcon(activity.action)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        {t(`team.action.${activity.action}`)}
                      </p>
                      {activity.detail && (
                        <p className="text-xs text-warm-400 mt-0.5">{activity.detail}</p>
                      )}
                      <p className="text-xs text-warm-600 mt-1">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
