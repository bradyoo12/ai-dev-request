import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GitBranch, Loader2 } from 'lucide-react'
import {
  getOrCreateBranch,
  autoCommit,
  syncToRemote,
  createPullRequest,
  getCommitHistory,
  type DevRequestBranch,
  type CommitHistoryEntry,
} from '../api/git-branch'
import BranchIndicator from '../components/BranchIndicator'
import CommitTimeline from '../components/CommitTimeline'

export default function BranchPerChatPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Demo state - using a fake dev request ID
  const demoDevRequestId = '00000000-0000-0000-0000-000000000001'
  const [branch, setBranch] = useState<DevRequestBranch | null>(null)
  const [commits, setCommits] = useState<CommitHistoryEntry[]>([])
  const [commitsLoading, setCommitsLoading] = useState(false)

  // Form state for auto-commit demo
  const [commitMessage, setCommitMessage] = useState('')
  const [committing, setCommitting] = useState(false)

  useEffect(() => {
    loadBranch()
  }, [])

  async function loadBranch() {
    setLoading(true)
    setError('')
    try {
      const branchData = await getOrCreateBranch(demoDevRequestId)
      setBranch(branchData)

      if (branchData.id) {
        await loadCommits(branchData.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load branch')
    } finally {
      setLoading(false)
    }
  }

  async function loadCommits(branchId: string) {
    setCommitsLoading(true)
    try {
      const history = await getCommitHistory(branchId)
      setCommits(history)
    } catch (err) {
      console.error('Failed to load commits:', err)
    } finally {
      setCommitsLoading(false)
    }
  }

  async function handleAutoCommit() {
    if (!branch || !commitMessage.trim()) return

    setCommitting(true)
    setError('')
    try {
      await autoCommit({
        branchId: branch.id,
        commitMessage: commitMessage,
        changedFiles: ['src/App.tsx', 'package.json', 'README.md'],
      })

      setCommitMessage('')
      await loadBranch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to commit')
    } finally {
      setCommitting(false)
    }
  }

  async function handleSync() {
    if (!branch) return

    setLoading(true)
    setError('')
    try {
      await syncToRemote(branch.id)
      await loadBranch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreatePR() {
    if (!branch) return

    setLoading(true)
    setError('')
    try {
      await createPullRequest({
        branchId: branch.id,
        title: `Dev Request: ${branch.branchName}`,
        description: 'Auto-generated pull request from AI Dev Platform',
      })
      await loadBranch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create PR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GitBranch className="w-8 h-8 text-accent-500" />
            <h1 className="text-3xl font-bold text-warm-100">
              {t('branchPerChat.title', 'Branch-per-Chat Workflow')}
            </h1>
          </div>
          <p className="text-warm-400">
            {t('branchPerChat.description', 'Automatic git branch management for every dev request')}
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && !branch && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
          </div>
        )}

        {/* Branch indicator */}
        {branch && (
          <div className="mb-6">
            <BranchIndicator
              branch={branch}
              onSync={handleSync}
              onCreatePR={handleCreatePR}
            />
          </div>
        )}

        {/* Auto-commit demo */}
        {branch && (
          <div className="mb-6 bg-warm-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-warm-100 mb-4">
              {t('branchPerChat.autoCommit', 'Auto-Commit Demo')}
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder={t('branchPerChat.commitMessagePlaceholder', 'Enter commit message...')}
                className="flex-1 bg-warm-700 border border-warm-600 rounded px-4 py-2 text-warm-100 placeholder-warm-400 focus:outline-none focus:border-accent-500"
                disabled={committing}
              />
              <button
                onClick={handleAutoCommit}
                disabled={committing || !commitMessage.trim()}
                className="px-6 py-2 bg-accent-600 hover:bg-accent-700 disabled:bg-warm-700 disabled:text-warm-400 text-white rounded font-medium transition-colors flex items-center gap-2"
              >
                {committing && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('branchPerChat.commit', 'Commit')}
              </button>
            </div>
            <p className="mt-2 text-xs text-warm-400">
              {t('branchPerChat.autoCommitNote', 'This simulates auto-committing AI-generated code changes')}
            </p>
          </div>
        )}

        {/* Commit timeline */}
        {branch && (
          <CommitTimeline commits={commits} loading={commitsLoading} />
        )}

        {/* Info section */}
        <div className="mt-8 bg-warm-800 rounded-lg p-6 border border-warm-700">
          <h2 className="text-lg font-semibold text-warm-100 mb-3">
            {t('branchPerChat.features', 'Key Features')}
          </h2>
          <ul className="space-y-2 text-warm-300">
            <li className="flex items-start gap-2">
              <span className="text-accent-500 mt-1">•</span>
              <span>{t('branchPerChat.feature1', 'Automatic branch creation for each dev request')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-500 mt-1">•</span>
              <span>{t('branchPerChat.feature2', 'Auto-commit every AI-generated code change')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-500 mt-1">•</span>
              <span>{t('branchPerChat.feature3', 'Two-way sync between IDE and platform')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-500 mt-1">•</span>
              <span>{t('branchPerChat.feature4', 'PR workflow to protect main branch')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-500 mt-1">•</span>
              <span>{t('branchPerChat.feature5', 'Automatic preview deployments per branch')}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
