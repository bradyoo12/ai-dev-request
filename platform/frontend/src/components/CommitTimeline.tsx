import { useTranslation } from 'react-i18next'
import { GitCommit, FileText, Clock } from 'lucide-react'
import type { CommitHistoryEntry } from '../api/git-branch'

interface CommitTimelineProps {
  commits: CommitHistoryEntry[]
  loading?: boolean
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export default function CommitTimeline({ commits, loading = false }: CommitTimelineProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="bg-warm-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitCommit className="w-5 h-5 text-warm-400" />
          <h3 className="text-lg font-semibold text-warm-100">
            {t('commits.title', 'Commit History')}
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 bg-warm-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-warm-700 rounded w-3/4" />
                <div className="h-3 bg-warm-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!commits.length) {
    return (
      <div className="bg-warm-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitCommit className="w-5 h-5 text-warm-400" />
          <h3 className="text-lg font-semibold text-warm-100">
            {t('commits.title', 'Commit History')}
          </h3>
        </div>
        <div className="text-center py-8 text-warm-400">
          <GitCommit className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('commits.empty', 'No commits yet')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-warm-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <GitCommit className="w-5 h-5 text-warm-400" />
        <h3 className="text-lg font-semibold text-warm-100">
          {t('commits.title', 'Commit History')}
        </h3>
        <span className="ml-auto text-sm text-warm-400">
          {commits.length} {commits.length === 1 ? t('commits.commit', 'commit') : t('commits.commits', 'commits')}
        </span>
      </div>

      <div className="space-y-4">
        {commits.map((commit, index) => (
          <div key={commit.sha} className="relative">
            {/* Timeline line */}
            {index < commits.length - 1 && (
              <div className="absolute left-4 top-10 bottom-0 w-px bg-warm-700" />
            )}

            <div className="flex gap-4">
              {/* Commit indicator */}
              <div className="relative z-10 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-warm-700 border-2 border-warm-600 flex items-center justify-center">
                  <GitCommit className="w-4 h-4 text-warm-300" />
                </div>
              </div>

              {/* Commit details */}
              <div className="flex-1 pb-6">
                <div className="bg-warm-750 rounded-lg p-4 hover:bg-warm-700 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-warm-100 font-medium break-words">
                        {commit.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-warm-400">
                        <span className="font-mono">{commit.sha}</span>
                        <span>•</span>
                        <span>{commit.author}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-warm-400 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatRelativeTime(commit.timestamp)}</span>
                    </div>
                  </div>

                  {/* Changed files */}
                  {commit.filesChanged && commit.filesChanged.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-warm-700">
                      <div className="flex items-center gap-2 text-xs text-warm-400 mb-2">
                        <FileText className="w-3.5 h-3.5" />
                        <span>
                          {commit.filesChanged.length} {commit.filesChanged.length === 1 ? t('commits.fileChanged', 'file changed') : t('commits.filesChanged', 'files changed')}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {commit.filesChanged.slice(0, 5).map((file) => (
                          <div
                            key={file}
                            className="text-xs font-mono text-warm-300 truncate"
                            title={file}
                          >
                            {file}
                          </div>
                        ))}
                        {commit.filesChanged.length > 5 && (
                          <div className="text-xs text-warm-400">
                            + {commit.filesChanged.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
