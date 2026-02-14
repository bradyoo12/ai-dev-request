import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { StatusBadge } from './StatusBadge'
import StaggerChildren, { staggerItemVariants } from './motion/StaggerChildren'
import {
  approveSubTask,
  approveAllSubTasks,
  type SubTask,
} from '../api/subtasks'

interface SubTaskListProps {
  requestId: string
  subTasks: SubTask[]
  onRefresh: () => void
}

export default function SubTaskList({ requestId, subTasks, onRefresh }: SubTaskListProps) {
  const { t } = useTranslation()
  const [approving, setApproving] = useState<string | null>(null)
  const [approvingAll, setApprovingAll] = useState(false)

  const hasPending = subTasks.some((s) => s.status === 'Pending')

  const handleApprove = async (subtaskId: string) => {
    try {
      setApproving(subtaskId)
      await approveSubTask(requestId, subtaskId)
      onRefresh()
    } catch {
      // silent fail
    } finally {
      setApproving(null)
    }
  }

  const handleApproveAll = async () => {
    try {
      setApprovingAll(true)
      await approveAllSubTasks(requestId)
      onRefresh()
    } catch {
      // silent fail
    } finally {
      setApprovingAll(false)
    }
  }

  // Build a map of subtask IDs to titles for dependency display
  const subtaskMap = new Map(subTasks.map((s) => [s.id, s.title]))

  if (subTasks.length === 0) {
    return null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-warm-400 uppercase tracking-wider">
          {t('subtasks.title')}
        </h4>
        {hasPending && (
          <button
            onClick={handleApproveAll}
            disabled={approvingAll}
            className="px-3 py-1 text-xs font-medium rounded-lg bg-gradient-to-r from-accent-blue to-accent-purple text-white transition-all hover:shadow-glow-blue hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {approvingAll ? (
              <span className="flex items-center gap-1.5">
                <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                {t('subtasks.approving')}
              </span>
            ) : (
              t('subtasks.approveAll')
            )}
          </button>
        )}
      </div>

      <StaggerChildren className="space-y-2" staggerDelay={0.04}>
        {subTasks.map((subTask) => (
          <motion.div
            key={subTask.id}
            variants={staggerItemVariants}
            className="bg-warm-800/50 rounded-lg p-3 border border-warm-700/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <span className="text-xs text-warm-500 font-mono mt-0.5 shrink-0">
                  {subTask.order}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-warm-100 leading-snug">
                    {subTask.title}
                  </p>
                  {subTask.description && (
                    <p className="text-xs text-warm-400 mt-1 line-clamp-2">
                      {subTask.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {subTask.dependsOnSubTaskId && (
                      <span className="text-[10px] text-warm-500">
                        {t('subtasks.dependsOn')}: {subtaskMap.get(subTask.dependsOnSubTaskId) || t('subtasks.dependency')}
                      </span>
                    )}
                    {subTask.estimatedCredits != null && (
                      <span className="text-[10px] text-warm-500">
                        {subTask.estimatedCredits} {t('subtasks.credits')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={t(`subtasks.status.${subTask.status.toLowerCase()}`)} />
                {subTask.status === 'Pending' && (
                  <button
                    onClick={() => handleApprove(subTask.id)}
                    disabled={approving === subTask.id}
                    className="px-2 py-0.5 text-[10px] font-medium rounded bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 transition-colors disabled:opacity-50"
                  >
                    {approving === subTask.id ? '...' : t('subtasks.approve')}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </StaggerChildren>
    </div>
  )
}
