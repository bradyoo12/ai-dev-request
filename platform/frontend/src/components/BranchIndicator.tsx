import { useTranslation } from 'react-i18next'
import { GitBranch, GitCommit, GitPullRequest, CheckCircle } from 'lucide-react'
import type { DevRequestBranch } from '../api/git-branch'

interface BranchIndicatorProps {
  branch: DevRequestBranch
  onSync?: () => void
  onCreatePR?: () => void
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
      return { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500' }
    case 'merged':
      return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500' }
    case 'abandoned':
      return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500' }
    case 'stale':
      return { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500' }
    default:
      return { text: 'text-warm-400', bg: 'bg-warm-500/10', border: 'border-warm-500' }
  }
}

export default function BranchIndicator({ branch, onSync, onCreatePR }: BranchIndicatorProps) {
  const { t } = useTranslation()
  const colors = getStatusColor(branch.status)

  return (
    <div className={`bg-warm-800 rounded-lg p-4 border ${colors.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch className={`w-5 h-5 ${colors.text}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-warm-100">
                {branch.branchName}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${colors.bg} ${colors.text}`}>
                {branch.status}
              </span>
            </div>
            <p className="text-xs text-warm-400 mt-0.5">
              {t('branch.basedOn', 'Based on')} <span className="font-mono">{branch.baseBranch}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-warm-400">
          <div className="flex items-center gap-1.5">
            <GitCommit className="w-4 h-4" />
            <span>{branch.totalCommits} {t('branch.commits', 'commits')}</span>
          </div>

          {branch.hasPullRequest && (
            <a
              href={branch.pullRequestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <GitPullRequest className="w-4 h-4" />
              <span>#{branch.pullRequestNumber}</span>
            </a>
          )}
        </div>
      </div>

      {/* Sync status */}
      {branch.lastSyncedAt && (
        <div className="mt-3 pt-3 border-t border-warm-700">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-warm-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>
                {t('branch.lastSynced', 'Last synced')}: {new Date(branch.lastSyncedAt).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onSync && (
                <button
                  onClick={onSync}
                  className="px-3 py-1 bg-warm-700 hover:bg-warm-600 text-warm-100 rounded transition-colors"
                >
                  {t('branch.sync', 'Sync')}
                </button>
              )}

              {!branch.hasPullRequest && onCreatePR && (
                <button
                  onClick={onCreatePR}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  {t('branch.createPR', 'Create PR')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
