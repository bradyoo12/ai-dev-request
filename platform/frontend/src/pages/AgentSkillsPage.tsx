import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getUserSkills, getBuiltInSkills, getPublicSkills,
  createSkill, updateSkill, deleteSkill, detectSkills,
  exportSkill, importSkill, forkSkill,
} from '../api/agent-skills'
import type { AgentSkill, CreateAgentSkillPayload } from '../api/agent-skills'

type TabView = 'my-skills' | 'built-in' | 'community'

export default function AgentSkillsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabView>('my-skills')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mySkills, setMySkills] = useState<AgentSkill[]>([])
  const [builtInSkills, setBuiltInSkills] = useState<AgentSkill[]>([])
  const [communitySkills, setCommunitySkills] = useState<AgentSkill[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingSkill, setEditingSkill] = useState<AgentSkill | null>(null)
  const [form, setForm] = useState<CreateAgentSkillPayload>({ name: '', description: '', category: '', instructionContent: '', tagsJson: '[]', isPublic: false, version: '1.0.0', author: '' })
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [detectText, setDetectText] = useState('')
  const [detectedSkills, setDetectedSkills] = useState<AgentSkill[]>([])
  const [detecting, setDetecting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const [my, bi, comm] = await Promise.all([getUserSkills(), getBuiltInSkills(), getPublicSkills(searchQuery || undefined, categoryFilter || undefined)])
      setMySkills(my.filter(s => !s.isBuiltIn)); setBuiltInSkills(bi); setCommunitySkills(comm)
    } catch { setError(t('agentSkills.error.loadFailed', 'Failed to load skills')) }
    finally { setLoading(false) }
  }, [t, searchQuery, categoryFilter])

  useEffect(() => { loadData() }, [loadData])

  const resetForm = () => setForm({ name: '', description: '', category: '', instructionContent: '', tagsJson: '[]', isPublic: false, version: '1.0.0', author: '' })

  const handleCreate = async () => {
    try { setError(''); if (!form.name.trim()) { setError('Name is required'); return }; await createSkill(form); setSuccess(t('agentSkills.createSuccess', 'Skill created!')); setShowDialog(false); resetForm(); loadData() }
    catch { setError(t('agentSkills.error.createFailed', 'Failed to create skill')) }
  }

  const handleUpdate = async () => {
    if (!editingSkill) return
    try { setError(''); await updateSkill(editingSkill.id, form); setSuccess(t('agentSkills.updateSuccess', 'Skill updated!')); setShowDialog(false); setEditingSkill(null); resetForm(); loadData() }
    catch { setError(t('agentSkills.error.updateFailed', 'Failed to update skill')) }
  }

  const handleDelete = async (id: string) => {
    try { setError(''); await deleteSkill(id); setSuccess(t('agentSkills.deleteSuccess', 'Skill deleted!')); setDeleteConfirmId(null); loadData() }
    catch { setError(t('agentSkills.error.deleteFailed', 'Failed to delete skill')) }
  }

  const handleExport = async (id: string) => {
    try { const result = await exportSkill(id); const blob = new Blob([result.json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'agent-skill.json'; a.click(); URL.revokeObjectURL(url); setSuccess('Exported!') }
    catch { setError(t('agentSkills.error.exportFailed', 'Failed to export')) }
  }

  const handleImport = async () => {
    try { setError(''); if (!importJson.trim()) return; await importSkill(importJson); setSuccess(t('agentSkills.importSuccess', 'Imported!')); setShowImportDialog(false); setImportJson(''); loadData() }
    catch { setError(t('agentSkills.error.importFailed', 'Failed to import')) }
  }

  const handleFork = async (id: string) => {
    try { setError(''); await forkSkill(id); setSuccess(t('agentSkills.forkSuccess', 'Forked!')); loadData() }
    catch { setError(t('agentSkills.error.forkFailed', 'Failed to fork')) }
  }

  const handleDetect = async () => {
    if (!detectText.trim()) return
    try { setDetecting(true); setDetectedSkills(await detectSkills(detectText)) }
    catch { setError(t('agentSkills.error.detectFailed', 'Auto-detect failed')) }
    finally { setDetecting(false) }
  }

  const openEditDialog = (skill: AgentSkill) => {
    setEditingSkill(skill)
    setForm({ name: skill.name, description: skill.description || '', category: skill.category || '', instructionContent: skill.instructionContent || '', tagsJson: skill.tagsJson || '[]', isPublic: skill.isPublic, version: skill.version || '1.0.0', author: skill.author || '' })
    setShowDialog(true)
  }

  const parseTags = (tagsJson: string | null | undefined): string[] => {
    if (!tagsJson) return []
    try { return JSON.parse(tagsJson) } catch { return [] }
  }

  if (loading) return <div className="text-center py-12 text-warm-400">{t('agentSkills.loading', 'Loading skills...')}</div>

  const currentSkills = activeTab === 'my-skills' ? mySkills : activeTab === 'built-in' ? builtInSkills : communitySkills

  return (
    <div className="space-y-6" data-testid="agent-skills-page">
      {error && <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">{error}<button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button></div>}
      {success && <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-green-400">{success}<button onClick={() => setSuccess('')} className="ml-2 text-green-300 hover:text-white">&times;</button></div>}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{t('agentSkills.title', 'Agent Skills')}</h3>
          <p className="text-sm text-warm-400">{t('agentSkills.description', 'Manage shareable AI instruction packs')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImportDialog(true)} className="bg-warm-700 hover:bg-warm-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">{t('agentSkills.import', 'Import')}</button>
          <button onClick={() => { resetForm(); setEditingSkill(null); setShowDialog(true) }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('agentSkills.create', 'Create Skill')}</button>
        </div>
      </div>

      <div className="flex gap-1 bg-warm-800 rounded-lg p-1">
        {(['my-skills', 'built-in', 'community'] as TabView[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'}`}>
            {tab === 'my-skills' ? t('agentSkills.mySkills', 'My Skills') : tab === 'built-in' ? t('agentSkills.builtIn', 'Built-in') : t('agentSkills.community', 'Community')}
            <span className="ml-1 text-warm-500">({tab === 'my-skills' ? mySkills.length : tab === 'built-in' ? builtInSkills.length : communitySkills.length})</span>
          </button>
        ))}
      </div>

      {activeTab === 'community' && (
        <div className="flex gap-2">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('agentSkills.searchPlaceholder', 'Search skills...')} className="flex-1 bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700">
            <option value="">{t('agentSkills.allCategories', 'All Categories')}</option>
            <option value="testing">Testing</option>
            <option value="api-design">API Design</option>
            <option value="performance">Performance</option>
            <option value="security">Security</option>
            <option value="devops">DevOps</option>
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
          </select>
        </div>
      )}

      <div className="bg-warm-900 rounded-xl p-4">
        <h4 className="text-sm font-bold mb-2">{t('agentSkills.detect', 'Auto-Detect')}</h4>
        <div className="flex gap-2">
          <input type="text" value={detectText} onChange={e => setDetectText(e.target.value)} placeholder={t('agentSkills.detectPlaceholder', 'Enter a request to find relevant skills...')} className="flex-1 bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none" onKeyDown={e => e.key === 'Enter' && handleDetect()} />
          <button onClick={handleDetect} disabled={detecting} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">{detecting ? '...' : t('agentSkills.detect', 'Auto-Detect')}</button>
        </div>
        {detectedSkills.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-warm-400 mb-1">{t('agentSkills.detectedResults', 'Matching skills:')}</p>
            <div className="flex flex-wrap gap-2">{detectedSkills.map(s => <span key={s.id} className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded">{s.name}{s.category && <span className="ml-1 text-warm-500">({s.category})</span>}</span>)}</div>
          </div>
        )}
      </div>

      {currentSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentSkills.map(skill => (
            <div key={skill.id} className="bg-warm-900 rounded-xl p-4 border border-warm-800 hover:border-warm-700 transition-colors" data-testid="skill-card">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-bold text-sm truncate flex-1">{skill.name}</h5>
                <div className="flex items-center gap-1 ml-2">
                  {skill.isBuiltIn && <span className="bg-green-600/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">{t('agentSkills.builtIn', 'Built-in')}</span>}
                  {skill.isPublic && <span className="bg-purple-600/20 text-purple-400 text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">{t('agentSkills.public', 'Public')}</span>}
                </div>
              </div>
              {skill.description && <p className="text-warm-400 text-xs mb-3 line-clamp-2">{skill.description}</p>}
              {skill.category && <span className="bg-blue-600/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded mr-1">{skill.category}</span>}
              {parseTags(skill.tagsJson).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 mb-3">{parseTags(skill.tagsJson).slice(0, 4).map(tag => <span key={tag} className="bg-warm-800 text-warm-300 text-[10px] px-1.5 py-0.5 rounded">#{tag}</span>)}</div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-warm-800">
                <div className="flex items-center gap-3 text-xs text-warm-400">
                  {skill.version && <span>v{skill.version}</span>}
                  {skill.author && <span>{skill.author}</span>}
                  <span>{skill.downloadCount} {t('agentSkills.downloads', 'Downloads')}</span>
                </div>
                <div className="flex gap-1">
                  {activeTab === 'community' && <button onClick={() => handleFork(skill.id)} className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded bg-warm-800 hover:bg-warm-700 transition-colors">{t('agentSkills.fork', 'Fork')}</button>}
                  <button onClick={() => handleExport(skill.id)} className="text-warm-400 hover:text-white text-xs px-2 py-1 rounded bg-warm-800 hover:bg-warm-700 transition-colors">{t('agentSkills.export', 'Export')}</button>
                  {activeTab === 'my-skills' && (<><button onClick={() => openEditDialog(skill)} className="text-warm-400 hover:text-white text-xs px-2 py-1 rounded bg-warm-800 hover:bg-warm-700 transition-colors">{t('agentSkills.edit', 'Edit')}</button><button onClick={() => setDeleteConfirmId(skill.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-warm-800 hover:bg-warm-700 transition-colors">&times;</button></>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="text-center py-12 text-warm-400">{t('agentSkills.noSkills', 'No skills found')}</div>}

      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-900 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingSkill ? t('agentSkills.edit', 'Edit Skill') : t('agentSkills.create', 'Create Skill')}</h3>
            <div className="space-y-4">
              <div><label className="block text-sm text-warm-400 mb-1">{t('agentSkills.name', 'Name')}</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none" /></div>
              <div><label className="block text-sm text-warm-400 mb-1">{t('agentSkills.skillDescription', 'Description')}</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none resize-none" /></div>
              <div><label className="block text-sm text-warm-400 mb-1">{t('agentSkills.category', 'Category')}</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700">
                  <option value="">-- Select --</option><option value="testing">Testing</option><option value="api-design">API Design</option><option value="performance">Performance</option><option value="security">Security</option><option value="devops">DevOps</option><option value="database">Database</option><option value="frontend">Frontend</option><option value="backend">Backend</option><option value="documentation">Documentation</option><option value="other">Other</option>
                </select>
              </div>
              <div><label className="block text-sm text-warm-400 mb-1">{t('agentSkills.instructions', 'Instructions')} (Markdown)</label><textarea value={form.instructionContent} onChange={e => setForm({ ...form, instructionContent: e.target.value })} rows={6} className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none resize-none font-mono" /></div>
              <div><label className="block text-sm text-warm-400 mb-1">{t('agentSkills.tags', 'Tags')} (JSON array)</label><input type="text" value={form.tagsJson} onChange={e => setForm({ ...form, tagsJson: e.target.value })} className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none font-mono" /></div>
              <div className="flex gap-4">
                <div className="flex-1"><label className="block text-sm text-warm-400 mb-1">{t('agentSkills.version', 'Version')}</label><input type="text" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none" /></div>
                <div className="flex-1"><label className="block text-sm text-warm-400 mb-1">{t('agentSkills.author', 'Author')}</label><input type="text" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none" /></div>
              </div>
              <div className="flex items-center gap-2"><input type="checkbox" id="isPublic" checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} className="rounded border-warm-700" /><label htmlFor="isPublic" className="text-sm text-warm-400">{t('agentSkills.public', 'Public')}</label></div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowDialog(false); setEditingSkill(null); resetForm() }} className="flex-1 bg-warm-700 hover:bg-warm-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('agentSkills.cancel', 'Cancel')}</button>
                <button onClick={editingSkill ? handleUpdate : handleCreate} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{editingSkill ? t('agentSkills.save', 'Save') : t('agentSkills.create', 'Create Skill')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-900 rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">{t('agentSkills.import', 'Import')}</h3>
            <textarea value={importJson} onChange={e => setImportJson(e.target.value)} rows={8} className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none resize-none font-mono mb-4" placeholder="Paste exported skill JSON here..." />
            <div className="flex gap-2">
              <button onClick={() => { setShowImportDialog(false); setImportJson('') }} className="flex-1 bg-warm-700 hover:bg-warm-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('agentSkills.cancel', 'Cancel')}</button>
              <button onClick={handleImport} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('agentSkills.import', 'Import')}</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-900 rounded-xl p-6 w-full max-w-sm">
            <p className="text-sm mb-4">{t('agentSkills.deleteConfirm', 'Are you sure you want to delete this skill?')}</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 bg-warm-700 hover:bg-warm-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('agentSkills.cancel', 'Cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t('agentSkills.delete', 'Delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
