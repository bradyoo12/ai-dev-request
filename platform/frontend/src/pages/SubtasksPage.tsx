import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { StatusBadge } from '../components/StatusBadge'
import FadeIn from '../components/motion/FadeIn'
import StaggerChildren, { staggerItemVariants } from '../components/motion/StaggerChildren'
import {
  getSubtasks,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  approveAllSubtasks,
  generateSubtasks,
  type SubtaskItem,
  type CreateSubtaskInput,
} from '../api/subtasks'

/** Maps backend SubtaskStatus to StatusBadge-compatible strings */
function mapStatusForBadge(status: string): string {
  const map: Record<string, string> = {
    Pending: 'pending',
    Approved: 'success',
    InProgress: 'in-progress',
    Completed: 'completed',
    Blocked: 'error',
  }
  return map[status] || 'idle'
}

export default function SubtasksPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const { authUser } = useAuth()
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [approving, setApproving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const requestId = projectId || ''

  const loadSubtasks = useCallback(async () => {
    if (!requestId) return
    try {
      setLoading(true)
      setError('')
      const data = await getSubtasks(requestId)
      setSubtasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('subtasks.error.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [requestId, t])

  useEffect(() => {
    if (authUser && requestId) {
      loadSubtasks()
    } else {
      setLoading(false)
    }
  }, [authUser, requestId, loadSubtasks])

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      setError('')
      const data = await generateSubtasks(requestId)
      setSubtasks(data)
      showSuccess(t('subtasks.generateSuccess'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('subtasks.error.generateFailed'))
    } finally {
      setGenerating(false)
    }
  }

  const handleApproveAll = async () => {
    try {
      setApproving(true)
      setError('')
      await approveAllSubtasks(requestId)
      await loadSubtasks()
      showSuccess(t('subtasks.approveSuccess'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('subtasks.error.approveAllFailed'))
    } finally {
      setApproving(false)
    }
  }

  const handleAddSubtask = async () => {
    if (!newTitle.trim()) return
    try {
      setError('')
      const input: CreateSubtaskInput = {
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      }
      const created = await createSubtask(requestId, input)
      setSubtasks((prev) => [...prev, created])
      setNewTitle('')
      setNewDescription('')
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('subtasks.error.createFailed'))
    }
  }

  const handleDelete = async (subtaskId: string) => {
    if (!confirm(t('subtasks.deleteConfirm'))) return
    try {
      setError('')
      await deleteSubtask(requestId, subtaskId)
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId))
      if (expandedId === subtaskId) setExpandedId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('subtasks.error.deleteFailed'))
    }
  }

  const handleStatusChange = async (subtaskId: string, newStatus: string) => {
    try {
      setError('')
      const updated = await updateSubtask(requestId, subtaskId, { status: newStatus })
      setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? updated : s)))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('subtasks.error.updateFailed'))
    }
  }

  const handleInlineEdit = async (subtaskId: string) => {
    if (!editTitle.trim()) {
      setEditingId(null)
      return
    }
    try {
      setError('')
      const updated = await updateSubtask(requestId, subtaskId, { title: editTitle.trim() })
      setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? updated : s)))
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('subtasks.error.updateFailed'))
    }
  }

  const completedCount = subtasks.filter((s) => s.status === 'Completed').length
  const pendingCount = subtasks.filter((s) => s.status === 'Pending').length
  const totalEstimate = subtasks.reduce((sum, s) => sum + (s.estimatedHours || 0), 0)

  if (!authUser) {
    return (
      <div className="p-6">
        <p className="text-warm-400">Please log in to view subtasks.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-warm-300 bg-clip-text text-transparent">
              {t('subtasks.title')}
            </h1>
            {subtasks.length > 0 && (
              <p className="text-warm-400 text-sm mt-1">
                {t('subtasks.progress', { completed: completedCount, total: subtasks.length })}
                {totalEstimate > 0 && (
                  <span className="ml-3">
                    {t('subtasks.totalEstimate', { hours: `${totalEstimate}h` })}
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-warm-400 hover:text-white transition-colors text-sm"
          >
            Back
          </button>
        </div>
      </FadeIn>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-900/30 border border-green-700/50 text-green-400 px-4 py-3 rounded-xl text-sm"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <FadeIn delay={0.1}>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-accent-blue/20 text-accent-blue border border-accent-blue/30 rounded-xl hover:bg-accent-blue/30 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {generating ? t('subtasks.generating') : t('subtasks.generateSubtasks')}
          </button>
          {pendingCount > 0 && (
            <button
              onClick={handleApproveAll}
              disabled={approving}
              className="px-4 py-2 bg-green-900/20 text-green-400 border border-green-700/30 rounded-xl hover:bg-green-900/30 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {approving ? t('subtasks.approving') : t('subtasks.approveAll')}
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-warm-800/50 text-warm-300 border border-warm-700/50 rounded-xl hover:bg-warm-700/50 transition-colors text-sm font-medium"
          >
            + {t('subtasks.addSubtask')}
          </button>
        </div>
      </FadeIn>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t('subtasks.newSubtaskTitle')}
                className="w-full bg-warm-800/50 border border-warm-700/50 rounded-lg px-3 py-2 text-white placeholder-warm-500 focus:outline-none focus:border-accent-blue/50 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtask()
                  if (e.key === 'Escape') setShowAddForm(false)
                }}
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={t('subtasks.newSubtaskDescription')}
                rows={2}
                className="w-full bg-warm-800/50 border border-warm-700/50 rounded-lg px-3 py-2 text-white placeholder-warm-500 focus:outline-none focus:border-accent-blue/50 text-sm resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewTitle('')
                    setNewDescription('')
                  }}
                  className="px-3 py-1.5 text-warm-400 hover:text-white text-sm transition-colors"
                >
                  {t('subtasks.cancel')}
                </button>
                <button
                  onClick={handleAddSubtask}
                  disabled={!newTitle.trim()}
                  className="px-4 py-1.5 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/80 disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  {t('subtasks.save')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full" />
          <span className="ml-3 text-warm-400">{t('subtasks.loading')}</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && subtasks.length === 0 && (
        <FadeIn>
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-warm-400 mb-4">{t('subtasks.empty')}</p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-2.5 bg-gradient-to-r from-accent-blue to-accent-purple text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-medium"
            >
              {generating ? t('subtasks.generating') : t('subtasks.generateSubtasks')}
            </button>
          </div>
        </FadeIn>
      )}

      {/* Subtask List */}
      {!loading && subtasks.length > 0 && (
        <StaggerChildren>
          <div className="space-y-2">
            {subtasks.map((subtask) => (
              <motion.div
                key={subtask.id}
                variants={staggerItemVariants}
                layout
                className="glass-card overflow-hidden"
              >
                {/* Subtask row */}
                <div className="flex items-center gap-3 p-4">
                  {/* Status checkbox area */}
                  <button
                    onClick={() => {
                      if (subtask.status === 'Completed') {
                        handleStatusChange(subtask.id, 'Approved')
                      } else if (subtask.status !== 'Blocked') {
                        handleStatusChange(subtask.id, 'Completed')
                      }
                    }}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      subtask.status === 'Completed'
                        ? 'bg-green-500 border-green-500 text-white'
                        : subtask.status === 'Blocked'
                          ? 'border-red-500/50 cursor-not-allowed'
                          : 'border-warm-600 hover:border-accent-blue'
                    }`}
                  >
                    {subtask.status === 'Completed' && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Title (editable inline) */}
                  <div className="flex-1 min-w-0">
                    {editingId === subtask.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleInlineEdit(subtask.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleInlineEdit(subtask.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="w-full bg-warm-800/50 border border-accent-blue/50 rounded px-2 py-1 text-white text-sm focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span
                        className={`text-sm cursor-pointer hover:text-accent-blue transition-colors ${
                          subtask.status === 'Completed' ? 'line-through text-warm-500' : 'text-white'
                        }`}
                        onClick={() => {
                          setEditingId(subtask.id)
                          setEditTitle(subtask.title)
                        }}
                      >
                        {subtask.title}
                      </span>
                    )}
                  </div>

                  {/* Priority badge */}
                  {subtask.priority <= 1 && (
                    <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-orange-900/30 text-orange-400 border border-orange-700/30">
                      P{subtask.priority}
                    </span>
                  )}

                  {/* Status badge */}
                  <StatusBadge status={mapStatusForBadge(subtask.status)} />

                  {/* Estimated hours */}
                  {subtask.estimatedHours != null && subtask.estimatedHours > 0 && (
                    <span className="flex-shrink-0 text-xs text-warm-500">
                      {subtask.estimatedHours}h
                    </span>
                  )}

                  {/* Dependencies indicator */}
                  {subtask.dependencyIds.length > 0 && (
                    <span className="flex-shrink-0 text-xs text-warm-500">
                      {t('subtasks.dependencies', { count: subtask.dependencyIds.length })}
                    </span>
                  )}

                  {/* Expand/collapse */}
                  <button
                    onClick={() => setExpandedId(expandedId === subtask.id ? null : subtask.id)}
                    className="flex-shrink-0 text-warm-500 hover:text-white transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${expandedId === subtask.id ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(subtask.id)}
                    className="flex-shrink-0 text-warm-600 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {expandedId === subtask.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-warm-800/50 space-y-3">
                        {subtask.description && (
                          <div className="mt-3">
                            <label className="text-xs text-warm-500 uppercase tracking-wider">
                              {t('subtasks.detail.description')}
                            </label>
                            <p className="text-sm text-warm-300 mt-1">{subtask.description}</p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-4 mt-3">
                          <div>
                            <label className="text-xs text-warm-500 uppercase tracking-wider">
                              {t('subtasks.detail.status')}
                            </label>
                            <div className="mt-1">
                              <select
                                value={subtask.status}
                                onChange={(e) => handleStatusChange(subtask.id, e.target.value)}
                                className="bg-warm-800/50 border border-warm-700/50 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent-blue/50"
                              >
                                <option value="Pending">{t('subtasks.status.pending')}</option>
                                <option value="Approved">{t('subtasks.status.approved')}</option>
                                <option value="InProgress">{t('subtasks.status.inprogress')}</option>
                                <option value="Completed">{t('subtasks.status.completed')}</option>
                                <option value="Blocked">{t('subtasks.status.blocked')}</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-warm-500 uppercase tracking-wider">
                              {t('subtasks.detail.priority')}
                            </label>
                            <p className="text-sm text-warm-300 mt-1">P{subtask.priority}</p>
                          </div>
                          {subtask.estimatedHours != null && (
                            <div>
                              <label className="text-xs text-warm-500 uppercase tracking-wider">
                                {t('subtasks.detail.effort')}
                              </label>
                              <p className="text-sm text-warm-300 mt-1">
                                {subtask.estimatedHours}h
                              </p>
                            </div>
                          )}
                          {subtask.dependencyIds.length > 0 && (
                            <div>
                              <label className="text-xs text-warm-500 uppercase tracking-wider">
                                {t('subtasks.detail.dependsOn')}
                              </label>
                              <p className="text-sm text-warm-300 mt-1 font-mono">
                                {subtask.dependencyIds.map((id) => id.slice(0, 8)).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </StaggerChildren>
      )}

      {/* Progress bar */}
      {!loading && subtasks.length > 0 && (
        <FadeIn delay={0.3}>
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-warm-400">
                {t('subtasks.progress', { completed: completedCount, total: subtasks.length })}
              </span>
              <span className="text-sm text-warm-500">
                {subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-warm-800 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-accent-blue to-green-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0}%`,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  )
}
