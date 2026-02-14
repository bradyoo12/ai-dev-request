import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { StatusBadge } from './StatusBadge'
import FadeIn from './motion/FadeIn'
import StaggerChildren, { staggerItemVariants } from './motion/StaggerChildren'
import {
  getSubtasks,
  approvePlan,
  rejectPlan,
  type SubtaskItem,
} from '../api/subtasks'

interface SubtaskListProps {
  requestId: string
  requestStatus: string
  onPlanApproved?: () => void
  onPlanRejected?: () => void
}

/** Maps SubtaskStatus to StatusBadge-compatible status strings */
function mapSubtaskStatus(status: string): string {
  const map: Record<string, string> = {
    Pending: 'pending',
    Approved: 'success',
    InProgress: 'in-progress',
    Completed: 'completed',
    Blocked: 'waiting',
  }
  return map[status] || 'idle'
}

/** Format estimated hours for display */
function formatHours(hours?: number): string {
  if (hours == null) return '-'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours === Math.floor(hours)) return `${hours}h`
  return `${hours.toFixed(1)}h`
}

/** Effort color based on estimated hours */
function effortColor(hours?: number): string {
  if (hours == null) return 'bg-warm-700 text-warm-400 border-warm-600'
  if (hours <= 1) return 'bg-green-900/50 text-green-400 border-green-700/50'
  if (hours <= 4) return 'bg-teal-900/50 text-teal-400 border-teal-700/50'
  if (hours <= 8) return 'bg-blue-900/50 text-blue-400 border-blue-700/50'
  if (hours <= 24) return 'bg-orange-900/50 text-orange-400 border-orange-700/50'
  return 'bg-red-900/50 text-red-400 border-red-700/50'
}

export default function SubtaskList({
  requestId,
  requestStatus,
  onPlanApproved,
  onPlanRejected,
}: SubtaskListProps) {
  const { t } = useTranslation()
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const loadSubtasks = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getSubtasks(requestId)
      setSubtasks(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('subtasks.error.loadFailed')
      )
    } finally {
      setLoading(false)
    }
  }, [requestId, t])

  useEffect(() => {
    loadSubtasks()
  }, [loadSubtasks])

  const handleApprove = async () => {
    try {
      setApproving(true)
      await approvePlan(requestId)
      onPlanApproved?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('subtasks.error.approveFailed')
      )
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    try {
      setRejecting(true)
      await rejectPlan(requestId)
      setSubtasks([])
      onPlanRejected?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('subtasks.error.rejectFailed')
      )
    } finally {
      setRejecting(false)
    }
  }

  const completedCount = subtasks.filter(
    (s) => s.status === 'Completed'
  ).length
  const totalCount = subtasks.length
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const totalEstimatedHours = subtasks.reduce(
    (sum, s) => sum + (s.estimatedHours || 0),
    0
  )

  // Show approve/reject buttons only in plan review stages
  const canReviewPlan =
    requestStatus === 'Analyzed' || requestStatus === 'ProposalReady'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full" />
        <span className="ml-2 text-sm text-warm-400">
          {t('subtasks.loading')}
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-400">
        {error}
        <button
          onClick={loadSubtasks}
          className="ml-3 text-xs underline hover:text-red-300"
        >
          {t('subtasks.retry')}
        </button>
      </div>
    )
  }

  if (subtasks.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-warm-500">
        {t('subtasks.empty')}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header with progress */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-warm-400 uppercase tracking-wider">
            {t('subtasks.title')}
          </h4>
          <div className="flex items-center gap-3">
            {totalEstimatedHours > 0 && (
              <span className="text-xs text-warm-500">
                {t('subtasks.totalEstimate', {
                  hours: formatHours(totalEstimatedHours),
                })}
              </span>
            )}
            <span className="text-xs text-warm-500">
              {t('subtasks.progress', {
                completed: completedCount,
                total: totalCount,
              })}
            </span>
            <span className="text-xs font-medium text-accent-blue">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-warm-700 rounded-full mt-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </FadeIn>

      {/* Subtask list */}
      <StaggerChildren className="space-y-2" staggerDelay={0.04}>
        {subtasks.map((subtask, idx) => (
          <motion.div
            key={subtask.id}
            variants={staggerItemVariants}
            className="glass-card rounded-lg overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedId(expandedId === subtask.id ? null : subtask.id)
              }
              className="w-full p-3 text-left hover:bg-warm-800/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Order number */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-warm-700 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-warm-300">
                    {idx + 1}
                  </span>
                </div>

                {/* Title & meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-warm-100 line-clamp-1">
                    {subtask.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {subtask.estimatedHours != null && (
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${effortColor(
                          subtask.estimatedHours
                        )}`}
                      >
                        {formatHours(subtask.estimatedHours)}
                      </span>
                    )}
                    {subtask.dependencyIds.length > 0 && (
                      <span className="text-[10px] text-warm-500">
                        {t('subtasks.dependencies', {
                          count: subtask.dependencyIds.length,
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex-shrink-0">
                  <StatusBadge
                    status={t(
                      `subtasks.status.${subtask.status.toLowerCase()}`
                    )}
                    className={
                      mapSubtaskStatus(subtask.status) === 'in-progress'
                        ? 'animate-pulse'
                        : ''
                    }
                  />
                </div>
              </div>
            </button>

            {/* Expanded detail */}
            <AnimatePresence>
              {expandedId === subtask.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="border-t border-warm-700/50"
                >
                  <div className="p-3 space-y-2">
                    {subtask.description && (
                      <div>
                        <div className="text-[10px] text-warm-500 uppercase mb-0.5">
                          {t('subtasks.detail.description')}
                        </div>
                        <p className="text-xs text-warm-200 whitespace-pre-wrap">
                          {subtask.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-[10px] text-warm-500 uppercase">
                          {t('subtasks.detail.effort')}
                        </div>
                        <div className="text-xs text-warm-200">
                          {subtask.estimatedHours != null
                            ? formatHours(subtask.estimatedHours)
                            : t('subtasks.detail.notEstimated')}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-warm-500 uppercase">
                          {t('subtasks.detail.priority')}
                        </div>
                        <div className="text-xs text-warm-200">
                          {subtask.priority}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-warm-500 uppercase">
                          {t('subtasks.detail.status')}
                        </div>
                        <div className="text-xs text-warm-200">
                          {t(
                            `subtasks.status.${subtask.status.toLowerCase()}`
                          )}
                        </div>
                      </div>
                    </div>

                    {subtask.dependencyIds.length > 0 && (
                      <div>
                        <div className="text-[10px] text-warm-500 uppercase mb-0.5">
                          {t('subtasks.detail.dependsOn')}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {subtask.dependencyIds.map((depId) => {
                            const depSubtask = subtasks.find(
                              (s) => s.id === depId
                            )
                            const depIndex = subtasks.findIndex(
                              (s) => s.id === depId
                            )
                            return (
                              <span
                                key={depId}
                                className="inline-flex items-center px-1.5 py-0.5 rounded bg-warm-700 text-[10px] text-warm-300"
                              >
                                #{depIndex + 1}{' '}
                                {depSubtask?.title?.slice(0, 20) ||
                                  depId.slice(0, 8)}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </StaggerChildren>

      {/* Approve / Reject buttons */}
      {canReviewPlan && subtasks.length > 0 && (
        <FadeIn delay={0.2}>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleApprove}
              disabled={approving || rejecting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 rounded-xl text-sm font-medium text-white transition-all hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {approving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  {t('subtasks.approving')}
                </span>
              ) : (
                t('subtasks.approvePlan')
              )}
            </button>
            <button
              onClick={handleReject}
              disabled={approving || rejecting}
              className="flex-1 px-4 py-2 bg-warm-700 rounded-xl text-sm font-medium text-warm-300 transition-all hover:bg-warm-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rejecting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-warm-300 border-t-transparent rounded-full" />
                  {t('subtasks.rejecting')}
                </span>
              ) : (
                t('subtasks.rejectPlan')
              )}
            </button>
          </div>
        </FadeIn>
      )}
    </div>
  )
}
