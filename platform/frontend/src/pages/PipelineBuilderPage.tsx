import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { listPipelines, createPipeline, updatePipeline, deletePipeline } from '../api/pipelines'
import type { Pipeline, PipelineStep } from '../api/pipelines'

const STEP_TYPES = [
  { type: 'analyze', icon: '🔍', color: 'blue' },
  { type: 'design', icon: '🎨', color: 'purple' },
  { type: 'generate', icon: '⚡', color: 'yellow' },
  { type: 'test', icon: '✅', color: 'green' },
  { type: 'review', icon: '👁', color: 'orange' },
  { type: 'deploy', icon: '🚀', color: 'cyan' },
  { type: 'custom', icon: '⚙', color: 'gray' },
]

const TEMPLATES = [
  {
    name: 'Web App',
    description: 'Full-stack web application pipeline',
    steps: [
      { id: '1', type: 'analyze', name: 'Analyze Requirements', enabled: true },
      { id: '2', type: 'design', name: 'UI/UX Design', enabled: true },
      { id: '3', type: 'generate', name: 'Generate Code', enabled: true },
      { id: '4', type: 'test', name: 'Run Tests', enabled: true },
      { id: '5', type: 'review', name: 'Code Review', enabled: true },
      { id: '6', type: 'deploy', name: 'Deploy', enabled: true },
    ],
  },
  {
    name: 'API Service',
    description: 'Backend API development pipeline',
    steps: [
      { id: '1', type: 'analyze', name: 'API Specification', enabled: true },
      { id: '2', type: 'generate', name: 'Generate Endpoints', enabled: true },
      { id: '3', type: 'test', name: 'API Testing', enabled: true },
      { id: '4', type: 'review', name: 'Security Review', enabled: true },
      { id: '5', type: 'deploy', name: 'Deploy', enabled: true },
    ],
  },
  {
    name: 'Mobile App',
    description: 'Mobile application pipeline',
    steps: [
      { id: '1', type: 'analyze', name: 'Requirements Analysis', enabled: true },
      { id: '2', type: 'design', name: 'Mobile UI Design', enabled: true },
      { id: '3', type: 'generate', name: 'Generate React Native', enabled: true },
      { id: '4', type: 'test', name: 'Device Testing', enabled: true },
      { id: '5', type: 'deploy', name: 'App Store Deploy', enabled: true },
    ],
  },
]

function getStepColor(type: string): string {
  const step = STEP_TYPES.find(s => s.type === type)
  switch (step?.color) {
    case 'blue': return 'border-blue-500 bg-blue-900/20'
    case 'purple': return 'border-purple-500 bg-purple-900/20'
    case 'yellow': return 'border-yellow-500 bg-yellow-900/20'
    case 'green': return 'border-green-500 bg-green-900/20'
    case 'orange': return 'border-orange-500 bg-orange-900/20'
    case 'cyan': return 'border-cyan-500 bg-cyan-900/20'
    default: return 'border-gray-500 bg-gray-900/20'
  }
}

function getStepIcon(type: string): string {
  return STEP_TYPES.find(s => s.type === type)?.icon || '⚙'
}

export default function PipelineBuilderPage() {
  const { t } = useTranslation()
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Pipeline | null>(null)
  const [editSteps, setEditSteps] = useState<PipelineStep[]>([])
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  const loadPipelines = useCallback(async () => {
    try {
      const data = await listPipelines()
      setPipelines(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pipeline.loadError', 'Failed to load pipelines'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadPipelines()
  }, [loadPipelines])

  const handleCreateFromTemplate = async (template: typeof TEMPLATES[0]) => {
    try {
      setError('')
      setSaving(true)
      const result = await createPipeline({
        name: template.name,
        description: template.description,
        steps: template.steps,
      })
      setPipelines(prev => [result, ...prev])
      setShowTemplates(false)
      startEditing(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pipeline.createError', 'Failed to create pipeline'))
    } finally {
      setSaving(false)
    }
  }

  const handleCreateBlank = async () => {
    try {
      setError('')
      setSaving(true)
      const result = await createPipeline({
        name: t('pipeline.untitled', 'Untitled Pipeline'),
        steps: [{ id: crypto.randomUUID(), type: 'analyze', name: t('pipeline.stepAnalyze', 'Analyze Requirements'), enabled: true }],
      })
      setPipelines(prev => [result, ...prev])
      startEditing(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pipeline.createError', 'Failed to create pipeline'))
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (pipeline: Pipeline) => {
    setEditing(pipeline)
    setEditSteps([...pipeline.steps])
    setEditName(pipeline.name)
    setEditDescription(pipeline.description || '')
  }

  const handleSave = async () => {
    if (!editing) return
    try {
      setError('')
      setSaving(true)
      const result = await updatePipeline(editing.id, {
        name: editName,
        description: editDescription,
        steps: editSteps,
      })
      setPipelines(prev => prev.map(p => p.id === result.id ? result : p))
      setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pipeline.saveError', 'Failed to save pipeline'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setError('')
      setDeleting(id)
      await deletePipeline(id)
      setPipelines(prev => prev.filter(p => p.id !== id))
      if (editing?.id === id) setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pipeline.deleteError', 'Failed to delete pipeline'))
    } finally {
      setDeleting(null)
    }
  }

  const addStep = (type: string) => {
    const stepType = STEP_TYPES.find(s => s.type === type)
    setEditSteps(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        name: stepType ? type.charAt(0).toUpperCase() + type.slice(1) : 'Custom Step',
        enabled: true,
      },
    ])
  }

  const removeStep = (index: number) => {
    setEditSteps(prev => prev.filter((_, i) => i !== index))
  }

  const toggleStep = (index: number) => {
    setEditSteps(prev => prev.map((s, i) => i === index ? { ...s, enabled: !s.enabled } : s))
  }

  const updateStepName = (index: number, name: string) => {
    setEditSteps(prev => prev.map((s, i) => i === index ? { ...s, name } : s))
  }

  const handleDragStart = (index: number) => {
    dragItem.current = index
  }

  const handleDragEnter = (index: number) => {
    dragOver.current = index
  }

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return
    const items = [...editSteps]
    const draggedItem = items[dragItem.current]
    items.splice(dragItem.current, 1)
    items.splice(dragOver.current, 0, draggedItem)
    setEditSteps(items)
    dragItem.current = null
    dragOver.current = null
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">{t('pipeline.loading', 'Loading pipelines...')}</p>
      </div>
    )
  }

  // Editor view
  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-white text-sm">
            &larr; {t('pipeline.backToList', 'Back to pipelines')}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(null)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              {t('pipeline.cancel', 'Cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || editSteps.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? t('pipeline.saving', 'Saving...') : t('pipeline.save', 'Save Pipeline')}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400 text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
          </div>
        )}

        {/* Pipeline name and description */}
        <div className="bg-gray-800 rounded-xl p-5 space-y-3">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder={t('pipeline.namePlaceholder', 'Pipeline name')}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-lg font-bold placeholder-gray-500"
            maxLength={200}
          />
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder={t('pipeline.descPlaceholder', 'Description (optional)')}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-500"
            maxLength={500}
          />
        </div>

        {/* Steps editor with drag and drop */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold mb-4">{t('pipeline.steps', 'Pipeline Steps')}</h3>
          <div className="space-y-2">
            {editSteps.map((step, index) => (
              <div
                key={step.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`border-l-4 rounded-lg p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing transition-all ${getStepColor(step.type)} ${!step.enabled ? 'opacity-40' : ''}`}
              >
                {/* Drag handle */}
                <span className="text-gray-500 select-none">⠿</span>

                {/* Step number */}
                <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                  {index + 1}
                </span>

                {/* Icon */}
                <span className="text-lg">{getStepIcon(step.type)}</span>

                {/* Name (editable) */}
                <input
                  type="text"
                  value={step.name}
                  onChange={(e) => updateStepName(index, e.target.value)}
                  className="flex-1 bg-transparent border-none text-white text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                  maxLength={100}
                />

                {/* Type badge */}
                <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-400 uppercase">
                  {step.type}
                </span>

                {/* Toggle enable */}
                <button
                  onClick={() => toggleStep(index)}
                  className={`w-8 h-5 rounded-full transition-colors ${step.enabled ? 'bg-green-600' : 'bg-gray-600'}`}
                >
                  <span className={`block w-3 h-3 bg-white rounded-full transition-transform mx-0.5 ${step.enabled ? 'translate-x-3' : ''}`} />
                </button>

                {/* Remove */}
                <button
                  onClick={() => removeStep(index)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          {/* Arrow connector */}
          {editSteps.length > 0 && (
            <div className="flex justify-center my-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-600">
                <path d="M12 5v14M19 12l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Add step buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {STEP_TYPES.map((st) => (
              <button
                key={st.type}
                onClick={() => addStep(st.type)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
              >
                <span>{st.icon}</span>
                <span>{st.type.charAt(0).toUpperCase() + st.type.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // List view
  const userPipelines = pipelines.filter(p => p.isOwner)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{t('pipeline.title', 'Pipeline Builder')}</h2>
          <p className="text-sm text-gray-400 mt-1">
            {t('pipeline.subtitle', 'Create custom dev request pipelines with drag-and-drop steps')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            {t('pipeline.templates', 'Templates')}
          </button>
          <button
            onClick={handleCreateBlank}
            disabled={saving || userPipelines.length >= 20}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {t('pipeline.createNew', '+ New Pipeline')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Template picker */}
      {showTemplates && (
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold mb-3">{t('pipeline.pickTemplate', 'Start from a template')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                onClick={() => handleCreateFromTemplate(tmpl)}
                disabled={saving}
                className="bg-gray-900 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-left transition-colors disabled:opacity-50"
              >
                <p className="text-sm font-bold text-white">{tmpl.name}</p>
                <p className="text-xs text-gray-400 mt-1">{tmpl.description}</p>
                <div className="flex gap-1 mt-2">
                  {tmpl.steps.map((s) => (
                    <span key={s.id} className="text-sm" title={s.name}>{getStepIcon(s.type)}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pipelines list */}
      <div className="bg-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold mb-3">
          {t('pipeline.myPipelines', 'My Pipelines')} ({userPipelines.length})
        </h3>
        {userPipelines.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            {t('pipeline.noPipelines', 'No pipelines yet. Create one or start from a template.')}
          </p>
        ) : (
          <div className="space-y-2">
            {userPipelines.map((pipeline) => (
              <div
                key={pipeline.id}
                className="bg-gray-900 rounded-lg p-4 flex items-center justify-between hover:bg-gray-850 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white truncate">{pipeline.name}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      pipeline.status === 'Active' ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {pipeline.status}
                    </span>
                  </div>
                  {pipeline.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{pipeline.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-0.5">
                      {pipeline.steps.map((s) => (
                        <span key={s.id} className="text-xs" title={s.name}>{getStepIcon(s.type)}</span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">
                      {pipeline.steps.length} {t('pipeline.stepsCount', 'steps')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditing(pipeline)}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
                  >
                    {t('pipeline.edit', 'Edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(pipeline.id)}
                    disabled={deleting !== null}
                    className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-400 rounded text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {deleting === pipeline.id ? t('pipeline.deleting', 'Deleting...') : t('pipeline.delete', 'Delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {userPipelines.length >= 20 && (
          <p className="text-xs text-yellow-400 mt-2">
            {t('pipeline.maxPipelines', 'Maximum of 20 pipelines. Delete an existing one to create a new one.')}
          </p>
        )}
      </div>
    </div>
  )
}
