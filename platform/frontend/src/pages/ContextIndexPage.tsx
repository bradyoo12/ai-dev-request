import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getProjectIndexSummary, getProjectIndexFiles, getDependencyGraph, retrieveContext } from '../api/projectindex'
import type { ProjectIndexSummary, ProjectIndexFile, DependencyEdge } from '../api/projectindex'

const LANG_COLORS: Record<string, string> = {
  TypeScript: 'text-blue-400 bg-blue-500/10',
  JavaScript: 'text-yellow-400 bg-yellow-500/10',
  CSharp: 'text-green-400 bg-green-500/10',
  CSS: 'text-pink-400 bg-pink-500/10',
  HTML: 'text-orange-400 bg-orange-500/10',
  JSON: 'text-warm-400 bg-warm-500/10',
}

export default function ContextIndexPage() {
  const { t } = useTranslation()
  const [projectId, setProjectId] = useState('')
  const [summary, setSummary] = useState<ProjectIndexSummary | null>(null)
  const [files, setFiles] = useState<ProjectIndexFile[]>([])
  const [deps, setDeps] = useState<DependencyEdge[]>([])
  const [retrievedFiles, setRetrievedFiles] = useState<ProjectIndexFile[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'files' | 'dependencies' | 'retrieve'>('files')
  const [filter, setFilter] = useState<'all' | 'indexed' | 'stale' | 'modified'>('all')

  async function loadProject() {
    if (!projectId.trim()) return
    try {
      setLoading(true)
      setError('')
      const [summaryRes, filesRes, depsRes] = await Promise.all([
        getProjectIndexSummary(projectId),
        getProjectIndexFiles(projectId),
        getDependencyGraph(projectId),
      ])
      setSummary(summaryRes)
      setFiles(filesRes)
      setDeps(depsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('contextIndex.error.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleRetrieve() {
    if (!projectId.trim() || !query.trim()) return
    try {
      setLoading(true)
      const result = await retrieveContext(projectId, query)
      setRetrievedFiles(result)
      setTab('retrieve')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('contextIndex.error.retrieveFailed'))
    } finally {
      setLoading(false)
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
    if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`
    return `${bytes} B`
  }

  const filteredFiles = files.filter(f => {
    if (filter === 'indexed') return f.isIndexed
    if (filter === 'stale') return f.needsReindex
    if (filter === 'modified') return f.isUserModified
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">{t('contextIndex.title')}</h3>
        <p className="text-sm text-warm-400 mt-1">{t('contextIndex.description')}</p>
      </div>

      {/* Project ID Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder={t('contextIndex.projectIdPlaceholder')}
          className="flex-1 bg-warm-800 border border-warm-700 rounded-lg px-3 py-2 text-sm text-white placeholder-warm-500"
        />
        <button
          onClick={loadProject}
          disabled={loading || !projectId.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-700 rounded-lg text-sm font-medium text-white transition-colors"
        >
          {loading ? t('contextIndex.loading') : t('contextIndex.load')}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-warm-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{summary.totalFiles}</div>
            <div className="text-sm text-warm-400">{t('contextIndex.stats.totalFiles')}</div>
          </div>
          <div className="bg-warm-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{summary.indexedFiles}</div>
            <div className="text-sm text-warm-400">{t('contextIndex.stats.indexed')}</div>
          </div>
          <div className="bg-warm-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">{summary.staleFiles}</div>
            <div className="text-sm text-warm-400">{t('contextIndex.stats.stale')}</div>
          </div>
          <div className="bg-warm-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{formatBytes(summary.totalSizeBytes)}</div>
            <div className="text-sm text-warm-400">{t('contextIndex.stats.totalSize')}</div>
          </div>
        </div>
      )}

      {/* Language Tags */}
      {summary && summary.languages.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {summary.languages.map(lang => (
            <span key={lang} className={`px-2 py-1 rounded text-xs ${LANG_COLORS[lang] || 'text-warm-400 bg-warm-700'}`}>
              {lang}
            </span>
          ))}
        </div>
      )}

      {/* Context Retrieval */}
      {summary && (
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="font-medium text-white mb-3">{t('contextIndex.retrieveTitle')}</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRetrieve()}
              placeholder={t('contextIndex.retrievePlaceholder')}
              className="flex-1 bg-warm-700 border border-warm-600 rounded px-3 py-2 text-sm text-white placeholder-warm-500"
            />
            <button
              onClick={handleRetrieve}
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-warm-700 rounded text-sm font-medium text-white transition-colors"
            >
              {t('contextIndex.retrieve')}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      {summary && (
        <div className="flex gap-1 bg-warm-800 rounded-lg p-1">
          <button
            onClick={() => setTab('files')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              tab === 'files' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
            }`}
          >
            {t('contextIndex.tab.files')} ({files.length})
          </button>
          <button
            onClick={() => setTab('dependencies')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              tab === 'dependencies' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
            }`}
          >
            {t('contextIndex.tab.dependencies')} ({deps.length})
          </button>
          {retrievedFiles.length > 0 && (
            <button
              onClick={() => setTab('retrieve')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                tab === 'retrieve' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
              }`}
            >
              {t('contextIndex.tab.retrieved')} ({retrievedFiles.length})
            </button>
          )}
        </div>
      )}

      {/* Files Tab */}
      {tab === 'files' && summary && (
        <div className="bg-warm-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-white">{t('contextIndex.fileList')}</h4>
            <div className="flex gap-1">
              {(['all', 'indexed', 'stale', 'modified'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    filter === f ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-400 hover:text-white'
                  }`}
                >
                  {t(`contextIndex.filter.${f}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filteredFiles.map(file => (
              <div key={file.id} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    file.needsReindex ? 'bg-yellow-400' : file.isIndexed ? 'bg-green-400' : 'bg-warm-500'
                  }`}></span>
                  <div className="min-w-0">
                    <div className="text-sm text-warm-200 truncate">{file.filePath}</div>
                    {file.summary && (
                      <div className="text-xs text-warm-500 truncate">{file.summary}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {file.language && (
                    <span className={`px-2 py-0.5 rounded text-xs ${LANG_COLORS[file.language] || 'text-warm-400 bg-warm-700'}`}>
                      {file.language}
                    </span>
                  )}
                  <span className="text-xs text-warm-500">{formatBytes(file.fileSize)}</span>
                  {file.isUserModified && (
                    <span className="text-xs text-orange-400">{t('contextIndex.modified')}</span>
                  )}
                  <span className="text-xs text-warm-500">
                    {file.dependencyCount} {t('contextIndex.deps')} / {file.dependentCount} {t('contextIndex.refs')}
                  </span>
                </div>
              </div>
            ))}
            {filteredFiles.length === 0 && (
              <div className="text-center py-8 text-warm-500 text-sm">{t('contextIndex.noFiles')}</div>
            )}
          </div>
        </div>
      )}

      {/* Dependencies Tab */}
      {tab === 'dependencies' && summary && (
        <div className="bg-warm-800 rounded-lg p-6">
          <h4 className="font-medium text-white mb-4">{t('contextIndex.dependencyGraph')}</h4>
          {deps.length > 0 ? (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {deps.map((edge, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1">
                  <span className="text-warm-300 truncate max-w-[40%]">{edge.from}</span>
                  <span className="text-warm-500">&rarr;</span>
                  <span className="text-blue-400 truncate max-w-[40%]">{edge.to}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-warm-500 text-sm">{t('contextIndex.noDeps')}</div>
          )}
        </div>
      )}

      {/* Retrieved Context Tab */}
      {tab === 'retrieve' && retrievedFiles.length > 0 && (
        <div className="bg-warm-800 rounded-lg p-6">
          <h4 className="font-medium text-white mb-4">{t('contextIndex.retrievedContext')}</h4>
          <div className="space-y-2">
            {retrievedFiles.map((file, i) => (
              <div key={file.id} className="flex items-center gap-3 py-2 border-b border-warm-700 last:border-0">
                <span className="text-xs text-warm-500 w-6">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-warm-200 truncate">{file.filePath}</div>
                  {file.summary && (
                    <div className="text-xs text-warm-500 truncate">{file.summary}</div>
                  )}
                </div>
                {file.language && (
                  <span className={`px-2 py-0.5 rounded text-xs ${LANG_COLORS[file.language] || 'text-warm-400 bg-warm-700'}`}>
                    {file.language}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!summary && !loading && !error && (
        <div className="bg-warm-800 rounded-lg p-12 text-center">
          <div className="text-warm-500 text-sm">{t('contextIndex.emptyState')}</div>
        </div>
      )}
    </div>
  )
}
