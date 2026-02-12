import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listOverlaySessions,
  createOverlaySession,
  selectElement,
  applyModification,
  undoModification,
  getOverlayStats,
  getOverlayProperties,
  type VisualOverlaySession,
  type OverlayStats,
  type OverlayProperty,
  type ModificationEntry,
  type ComponentTreeNode,
} from '../api/visual-overlay'

type OverlayTab = 'editor' | 'sessions' | 'stats'

export default function VisualOverlayPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<OverlayTab>('editor')
  const [sessions, setSessions] = useState<VisualOverlaySession[]>([])
  const [stats, setStats] = useState<OverlayStats | null>(null)
  const [properties, setProperties] = useState<OverlayProperty[]>([])
  const [loading, setLoading] = useState(false)

  // Editor state
  const [projectName, setProjectName] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [creating, setCreating] = useState(false)
  const [currentSession, setCurrentSession] = useState<VisualOverlaySession | null>(null)
  const [componentTree, setComponentTree] = useState<ComponentTreeNode[]>([])
  const [modifications, setModifications] = useState<ModificationEntry[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  // Property editor state
  const [editProperty, setEditProperty] = useState('')
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    if (tab === 'sessions') loadSessions()
    if (tab === 'stats') loadStats()
    if (tab === 'editor') loadProperties()
  }, [tab])

  async function loadSessions() {
    setLoading(true)
    try {
      const data = await listOverlaySessions()
      setSessions(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStats() {
    setLoading(true)
    try {
      const data = await getOverlayStats()
      setStats(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadProperties() {
    try {
      const data = await getOverlayProperties()
      setProperties(data)
    } catch { /* ignore */ }
  }

  async function handleCreateSession() {
    if (!projectName.trim()) return
    setCreating(true)
    try {
      const session = await createOverlaySession({ projectName, previewUrl: previewUrl || undefined })
      setCurrentSession(session)
      const tree: ComponentTreeNode[] = JSON.parse(session.componentTreeJson)
      setComponentTree(tree)
      setModifications([])
      setSelectedElement(null)
    } catch { /* ignore */ }
    setCreating(false)
  }

  async function handleSelectElement(path: string) {
    if (!currentSession) return
    try {
      const updated = await selectElement(currentSession.id, { elementPath: path })
      setCurrentSession(updated)
      setSelectedElement(path)
    } catch { /* ignore */ }
  }

  async function handleApplyModification() {
    if (!currentSession || !selectedElement || !editProperty || !editValue) return
    try {
      const updated = await applyModification(currentSession.id, {
        elementPath: selectedElement,
        property: editProperty,
        oldValue: '',
        newValue: editValue,
      })
      setCurrentSession(updated)
      const mods: ModificationEntry[] = JSON.parse(updated.modificationsJson)
      setModifications(mods)
      setEditValue('')
    } catch { /* ignore */ }
  }

  async function handleUndo() {
    if (!currentSession) return
    try {
      const updated = await undoModification(currentSession.id)
      setCurrentSession(updated)
      const mods: ModificationEntry[] = JSON.parse(updated.modificationsJson)
      setModifications(mods)
    } catch { /* ignore */ }
  }

  function renderTreeNode(node: ComponentTreeNode, depth: number = 0) {
    return (
      <div key={node.path}>
        <button
          onClick={() => handleSelectElement(node.path)}
          className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
            selectedElement === node.path
              ? 'bg-blue-600 text-white'
              : 'text-warm-300 hover:bg-warm-700'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <span className="text-blue-400">&lt;</span>
          <span className={selectedElement === node.path ? 'text-white' : 'text-orange-300'}>{node.tag}</span>
          <span className="text-blue-400">&gt;</span>
        </button>
        {node.children?.map(child => renderTreeNode(child, depth + 1))}
      </div>
    )
  }

  const STATUS_COLORS: Record<string, string> = {
    'active': 'bg-green-900 text-green-300',
    'paused': 'bg-yellow-900 text-yellow-300',
    'completed': 'bg-blue-900 text-blue-300',
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('visualOverlay.title', 'Visual Overlay Editor')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('visualOverlay.subtitle', 'Point-and-click editing for generated project UI components')}</p>
      </div>

      <div className="flex gap-2">
        {(['editor', 'sessions', 'stats'] as OverlayTab[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`visualOverlay.tabs.${tabId}`, tabId === 'editor' ? 'Editor' : tabId === 'sessions' ? 'Sessions' : 'Stats')}
          </button>
        ))}
      </div>

      {/* Editor Tab */}
      {tab === 'editor' && (
        <div className="space-y-4">
          {/* Session Setup */}
          {!currentSession && (
            <div className="bg-warm-800 rounded-lg p-6 space-y-4">
              <h4 className="text-white font-medium">{t('visualOverlay.startSession', 'Start Editing Session')}</h4>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('visualOverlay.projectName', 'Project Name')}</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                  placeholder={t('visualOverlay.projectNamePlaceholder', 'e.g., My Landing Page')}
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('visualOverlay.previewUrl', 'Preview URL')}</label>
                <input
                  type="text"
                  value={previewUrl}
                  onChange={e => setPreviewUrl(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                  placeholder={t('visualOverlay.previewUrlPlaceholder', 'https://preview.example.com')}
                />
              </div>
              <button
                onClick={handleCreateSession}
                disabled={creating || !projectName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? t('visualOverlay.creating', 'Starting...') : t('visualOverlay.startBtn', 'Start Session')}
              </button>
            </div>
          )}

          {/* Active Editor */}
          {currentSession && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="text-white font-medium">{currentSession.projectName}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[currentSession.status] || 'bg-warm-700 text-warm-300'}`}>
                    {currentSession.status}
                  </span>
                </div>
                <button
                  onClick={() => { setCurrentSession(null); setSelectedElement(null); setModifications([]) }}
                  className="text-sm text-warm-400 hover:text-white"
                >
                  {t('visualOverlay.newSession', 'New Session')}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Panel: Component Tree */}
                <div className="bg-warm-800 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-warm-300 mb-3">{t('visualOverlay.componentTree', 'Component Tree')}</h5>
                  <div className="space-y-0.5 max-h-80 overflow-auto">
                    {componentTree.map(node => renderTreeNode(node))}
                  </div>
                </div>

                {/* Center Panel: Preview Area */}
                <div className="bg-warm-800 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-warm-300 mb-3">{t('visualOverlay.preview', 'Preview')}</h5>
                  <div className="bg-warm-900 rounded-lg border border-warm-700 h-64 flex items-center justify-center">
                    {currentSession.previewUrl ? (
                      <div className="text-center">
                        <p className="text-warm-400 text-sm">{t('visualOverlay.previewLabel', 'Preview')}:</p>
                        <p className="text-blue-400 text-sm mt-1 break-all">{currentSession.previewUrl}</p>
                        {selectedElement && (
                          <div className="mt-3 px-3 py-1.5 bg-blue-900 rounded text-blue-300 text-xs">
                            {t('visualOverlay.selected', 'Selected')}: {selectedElement}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-warm-500 text-sm">{t('visualOverlay.noPreview', 'No preview URL provided')}</p>
                        {selectedElement && (
                          <div className="mt-3 px-3 py-1.5 bg-blue-900 rounded text-blue-300 text-xs">
                            {t('visualOverlay.selected', 'Selected')}: {selectedElement}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel: Property Editor */}
                <div className="bg-warm-800 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-warm-300 mb-3">{t('visualOverlay.propertyEditor', 'Property Editor')}</h5>
                  {selectedElement ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-warm-500 mb-1">{t('visualOverlay.element', 'Element')}</label>
                        <p className="text-sm text-blue-400 font-mono">{selectedElement}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-warm-500 mb-1">{t('visualOverlay.property', 'Property')}</label>
                        <select
                          value={editProperty}
                          onChange={e => setEditProperty(e.target.value)}
                          className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-1.5 text-sm"
                        >
                          <option value="">{t('visualOverlay.selectProperty', 'Select property...')}</option>
                          {properties.map(p => (
                            <option key={p.name} value={p.name}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      {editProperty && (
                        <div>
                          <label className="block text-xs text-warm-500 mb-1">{t('visualOverlay.value', 'Value')}</label>
                          {properties.find(p => p.name === editProperty)?.type === 'color' ? (
                            <input
                              type="color"
                              value={editValue || '#ffffff'}
                              onChange={e => setEditValue(e.target.value)}
                              className="w-full h-8 bg-warm-700 border border-warm-600 rounded-md cursor-pointer"
                            />
                          ) : properties.find(p => p.name === editProperty)?.type === 'range' ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={editProperty === 'opacity' ? '0' : '8'}
                                max={editProperty === 'opacity' ? '100' : '72'}
                                value={editValue || (editProperty === 'opacity' ? '100' : '16')}
                                onChange={e => setEditValue(e.target.value)}
                                className="flex-1"
                              />
                              <span className="text-sm text-warm-300 w-10 text-right">
                                {editProperty === 'opacity' ? `${editValue || 100}%` : `${editValue || 16}px`}
                              </span>
                            </div>
                          ) : properties.find(p => p.name === editProperty)?.type === 'number' ? (
                            <input
                              type="number"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              min="0"
                              className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-1.5 text-sm"
                              placeholder="0"
                            />
                          ) : properties.find(p => p.name === editProperty)?.type === 'select' ? (
                            <select
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-1.5 text-sm"
                            >
                              <option value="normal">Normal</option>
                              <option value="bold">Bold</option>
                              <option value="lighter">Lighter</option>
                              <option value="100">100</option>
                              <option value="300">300</option>
                              <option value="500">500</option>
                              <option value="700">700</option>
                              <option value="900">900</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-1.5 text-sm"
                              placeholder={t('visualOverlay.enterValue', 'Enter value...')}
                            />
                          )}
                        </div>
                      )}
                      <button
                        onClick={handleApplyModification}
                        disabled={!editProperty || !editValue}
                        className="w-full py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {t('visualOverlay.applyChange', 'Apply Change')}
                      </button>
                    </div>
                  ) : (
                    <p className="text-warm-500 text-sm">{t('visualOverlay.selectElementHint', 'Select an element from the component tree to edit its properties')}</p>
                  )}
                </div>
              </div>

              {/* Bottom Panel: Modification History */}
              <div className="bg-warm-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-warm-300">{t('visualOverlay.modificationHistory', 'Modification History')}</h5>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-warm-500">{modifications.length} {t('visualOverlay.edits', 'edits')}</span>
                    {modifications.length > 0 && (
                      <button
                        onClick={handleUndo}
                        className="px-3 py-1 bg-warm-700 text-warm-300 rounded text-xs hover:bg-warm-600"
                      >
                        {t('visualOverlay.undo', 'Undo')}
                      </button>
                    )}
                  </div>
                </div>
                {modifications.length === 0 ? (
                  <p className="text-warm-500 text-sm">{t('visualOverlay.noModifications', 'No modifications yet. Select an element and edit its properties.')}</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {[...modifications].reverse().map((mod, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-warm-900 rounded px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400 font-mono text-xs">{mod.elementPath}</span>
                          <span className="text-warm-600">|</span>
                          <span className="text-orange-300 text-xs">{mod.property}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {mod.oldValue && <span className="text-red-400 text-xs line-through">{mod.oldValue}</span>}
                          <span className="text-warm-600">&rarr;</span>
                          <span className="text-green-400 text-xs">{mod.newValue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {tab === 'sessions' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('visualOverlay.loading', 'Loading...')}</p>
          ) : sessions.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('visualOverlay.noSessions', 'No editing sessions yet. Start your first visual overlay session!')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className="bg-warm-800 rounded-lg p-4 border border-warm-700">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{s.projectName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[s.status] || 'bg-warm-700 text-warm-300'}`}>
                          {s.status}
                        </span>
                        <span className="text-xs text-warm-500">{s.totalEdits} {t('visualOverlay.edits', 'edits')}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-warm-500">
                        {s.previewUrl && <span className="truncate max-w-48">{s.previewUrl}</span>}
                        <span>{s.viewportWidth}x{s.viewportHeight}</span>
                        <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
              <p className="text-warm-400 text-sm">{t('visualOverlay.stats.totalSessions', 'Total Sessions')}</p>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.totalEdits}</p>
              <p className="text-warm-400 text-sm">{t('visualOverlay.stats.totalEdits', 'Total Edits')}</p>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.avgEditsPerSession}</p>
              <p className="text-warm-400 text-sm">{t('visualOverlay.stats.avgEdits', 'Avg Edits/Session')}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.mostEditedProperty}</p>
              <p className="text-warm-400 text-sm">{t('visualOverlay.stats.mostEdited', 'Most Edited Property')}</p>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.activeSessions}</p>
              <p className="text-warm-400 text-sm">{t('visualOverlay.stats.activeSessions', 'Active Sessions')}</p>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-400">
                {stats.lastSession ? new Date(stats.lastSession).toLocaleDateString() : 'N/A'}
              </p>
              <p className="text-warm-400 text-sm">{t('visualOverlay.stats.lastSession', 'Last Session')}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'stats' && !stats && loading && (
        <p className="text-warm-400 text-sm">{t('visualOverlay.loading', 'Loading...')}</p>
      )}
    </div>
  )
}
