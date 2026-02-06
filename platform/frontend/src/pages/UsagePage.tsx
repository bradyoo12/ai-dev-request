import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getUsageSummary,
  getUsageTransactions,
  getUsageByProject,
  getUsageExportUrl,
  getUserId,
} from '../api/settings'
import type {
  UsageSummary,
  UsageTransaction,
  ProjectUsage,
} from '../api/settings'

export default function UsagePage() {
  const { t } = useTranslation()

  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [transactions, setTransactions] = useState<UsageTransaction[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [projects, setProjects] = useState<ProjectUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 15

  // Filters
  const [typeFilter, setTypeFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [summaryData, txData, projectData] = await Promise.all([
        getUsageSummary(),
        getUsageTransactions({
          page: 1,
          pageSize,
          type: typeFilter || undefined,
          action: actionFilter || undefined,
        }),
        getUsageByProject(),
      ])
      setSummary(summaryData)
      setTransactions(txData.transactions)
      setTotalCount(txData.totalCount)
      setProjects(projectData)
      setPage(1)
    } catch {
      // Silently handle
    } finally {
      setLoading(false)
    }
  }, [typeFilter, actionFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const loadPage = async (newPage: number) => {
    try {
      const txData = await getUsageTransactions({
        page: newPage,
        pageSize,
        type: typeFilter || undefined,
        action: actionFilter || undefined,
      })
      setTransactions(txData.transactions)
      setTotalCount(txData.totalCount)
      setPage(newPage)
    } catch {
      // Silently handle
    }
  }

  const getActionLabel = (action: string) => {
    const key = `settings.tokens.action.${action}`
    const translated = t(key)
    return translated === key ? action : translated
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'analysis': return 'text-blue-400'
      case 'proposal': return 'text-orange-400'
      case 'build': return 'text-red-400'
      case 'purchase': return 'text-green-400'
      case 'welcome_bonus': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleExport = () => {
    const url = getUsageExportUrl()
    // Add X-User-Id as query param for CSV download since we can't set headers on a link
    const downloadUrl = `${url}${url.includes('?') ? '&' : '?'}userId=${encodeURIComponent(getUserId())}`
    window.open(downloadUrl, '_blank')
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">{t('settings.loading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-5">
            <div className="text-gray-300 text-sm">{t('usage.summary.balance')}</div>
            <div className="text-2xl font-bold">{summary.balance.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">≈ ${summary.balanceValueUsd.toFixed(2)}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-5">
            <div className="text-gray-300 text-sm">{t('usage.summary.usedThisMonth')}</div>
            <div className="text-2xl font-bold text-orange-400">
              {summary.usedThisMonth > 0 ? '-' : ''}{summary.usedThisMonth.toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">
              {t('usage.summary.acrossProjects', { count: summary.projectsThisMonth })}
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-5">
            <div className="text-gray-300 text-sm">{t('usage.summary.addedThisMonth')}</div>
            <div className="text-2xl font-bold text-green-400">
              +{summary.addedThisMonth.toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">{t('usage.summary.purchasesAndBonus')}</div>
          </div>
        </div>
      )}

      {/* Per-Project Breakdown */}
      {projects.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">{t('usage.byProject.title')}</h3>
          <div className="space-y-3">
            {projects.map((p) => {
              const maxTotal = projects[0]?.total || 1
              return (
                <div key={p.projectId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono text-gray-300 truncate max-w-xs" title={p.projectId}>
                      {p.projectId.length > 12 ? `${p.projectId.substring(0, 8)}...` : p.projectId}
                    </span>
                    <span className="font-bold">{p.total} {t('settings.tokens.tokensUnit')}</span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden bg-gray-900">
                    {p.analysis > 0 && (
                      <div
                        className="bg-blue-500"
                        style={{ width: `${(p.analysis / maxTotal) * 100}%` }}
                        title={`${t('settings.tokens.action.analysis')}: ${p.analysis}`}
                      />
                    )}
                    {p.proposal > 0 && (
                      <div
                        className="bg-orange-500"
                        style={{ width: `${(p.proposal / maxTotal) * 100}%` }}
                        title={`${t('settings.tokens.action.proposal')}: ${p.proposal}`}
                      />
                    )}
                    {p.build > 0 && (
                      <div
                        className="bg-red-500"
                        style={{ width: `${(p.build / maxTotal) * 100}%` }}
                        title={`${t('settings.tokens.action.build')}: ${p.build}`}
                      />
                    )}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    {p.analysis > 0 && <span className="text-blue-400">{t('settings.tokens.action.analysis')}: {p.analysis}</span>}
                    {p.proposal > 0 && <span className="text-orange-400">{t('settings.tokens.action.proposal')}: {p.proposal}</span>}
                    {p.build > 0 && <span className="text-red-400">{t('settings.tokens.action.build')}: {p.build}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t('usage.transactions.title')}</h3>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            {t('usage.transactions.exportCsv')}
          </button>
        </div>

        <div className="flex gap-3 mb-4 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">{t('usage.transactions.allTypes')}</option>
            <option value="credit">{t('usage.transactions.credits')}</option>
            <option value="debit">{t('usage.transactions.debits')}</option>
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">{t('settings.tokens.allActions')}</option>
            <option value="welcome_bonus">{t('settings.tokens.action.welcome_bonus')}</option>
            <option value="purchase">{t('settings.tokens.action.purchase')}</option>
            <option value="analysis">{t('settings.tokens.action.analysis')}</option>
            <option value="proposal">{t('settings.tokens.action.proposal')}</option>
            <option value="build">{t('settings.tokens.action.build')}</option>
            <option value="staging">{t('settings.tokens.action.staging')}</option>
          </select>
        </div>

        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-6">{t('settings.tokens.noHistory')}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 px-2">{t('settings.tokens.historyDate')}</th>
                    <th className="text-left py-2 px-2">{t('settings.tokens.historyAction')}</th>
                    <th className="text-left py-2 px-2">{t('settings.tokens.historyDescription')}</th>
                    <th className="text-right py-2 px-2">{t('settings.tokens.historyAmount')}</th>
                    <th className="text-right py-2 px-2">{t('settings.tokens.historyBalanceAfter')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-700/50">
                      <td className="py-2 px-2 text-gray-400 whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className={`py-2 px-2 ${getActionColor(tx.action)}`}>
                        {getActionLabel(tx.action)}
                      </td>
                      <td className="py-2 px-2 text-gray-400">{tx.description}</td>
                      <td
                        className={`py-2 px-2 text-right font-medium ${
                          tx.amount > 0 ? 'text-green-400' : 'text-orange-400'
                        }`}
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount.toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-400">
                        {tx.balanceAfter.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm">
                <span className="text-gray-400">
                  {t('usage.transactions.showing', {
                    from: (page - 1) * pageSize + 1,
                    to: Math.min(page * pageSize, totalCount),
                    total: totalCount,
                  })}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadPage(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    &larr;
                  </button>
                  <button
                    onClick={() => loadPage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    &rarr;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
