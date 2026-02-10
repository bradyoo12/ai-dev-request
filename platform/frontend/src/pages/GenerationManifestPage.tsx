import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getManifest,
  validateConsistency,
  resolveConflicts,
  getGeneratedFiles,
  type ManifestResponse,
  type ManifestFile,
  type CrossReference,
  type ValidationIssue,
  type GeneratedFileInfo,
} from '../api/generation'

type Tab = 'files' | 'dependencies' | 'validation'

export default function GenerationManifestPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('projectId') || ''

  const [activeTab, setActiveTab] = useState<Tab>('files')
  const [manifest, setManifest] = useState<ManifestResponse | null>(null)
  const [files, setFiles] = useState<ManifestFile[]>([])
  const [crossRefs, setCrossRefs] = useState<CrossReference[]>([])
  const [issues, setIssues] = useState<ValidationIssue[]>([])
  const [fileInfos, setFileInfos] = useState<GeneratedFileInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (projectId) loadData()
  }, [projectId])

  async function loadData() {
    setLoading(true)
    try {
      const [manifestData, filesData] = await Promise.all([
        getManifest(projectId),
        getGeneratedFiles(projectId),
      ])
      if (manifestData) {
        setManifest(manifestData)
        try { setFiles(JSON.parse(manifestData.filesJson)) } catch { setFiles([]) }
        try { setCrossRefs(JSON.parse(manifestData.crossReferencesJson)) } catch { setCrossRefs([]) }
        try { setIssues(JSON.parse(manifestData.validationResultsJson)) } catch { setIssues([]) }
      }
      setFileInfos(filesData)
    } catch {
      // No existing data
    } finally {
      setLoading(false)
    }
  }

  async function handleValidate() {
    if (!projectId) return
    setValidating(true)
    setError('')
    try {
      const result = await validateConsistency(projectId)
      setManifest(result)
      try { setIssues(JSON.parse(result.validationResultsJson)) } catch { setIssues([]) }
      setActiveTab('validation')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setValidating(false)
    }
  }

  async function handleResolve() {
    if (!projectId) return
    setResolving(true)
    setError('')
    try {
      const result = await resolveConflicts(projectId)
      setManifest(result)
      try { setIssues(JSON.parse(result.validationResultsJson)) } catch { setIssues([]) }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resolution failed')
    } finally {
      setResolving(false)
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case 'passed': return 'text-green-400 bg-green-900/40'
      case 'resolved': return 'text-blue-400 bg-blue-900/40'
      case 'failed': return 'text-red-400 bg-red-900/40'
      default: return 'text-gray-400 bg-gray-700'
    }
  }

  function issueStatusColor(status: string) {
    switch (status) {
      case 'error': return 'text-red-400 bg-red-900/40'
      case 'warning': return 'text-yellow-400 bg-yellow-900/40'
      case 'resolved': return 'text-green-400 bg-green-900/40'
      default: return 'text-gray-400 bg-gray-700'
    }
  }

  function languageColor(lang: string) {
    switch (lang) {
      case 'TypeScript': return 'text-blue-400 bg-blue-900/40'
      case 'JavaScript': return 'text-yellow-400 bg-yellow-900/40'
      case 'C#': return 'text-purple-400 bg-purple-900/40'
      case 'Python': return 'text-green-400 bg-green-900/40'
      case 'CSS': return 'text-pink-400 bg-pink-900/40'
      case 'HTML': return 'text-orange-400 bg-orange-900/40'
      default: return 'text-gray-400 bg-gray-700'
    }
  }

  const filteredFiles = files.filter(f =>
    !searchQuery || f.path.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFileInfos = fileInfos.filter(f =>
    !searchQuery || f.path.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!authUser) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-2">{t('generation.title', 'Generation Manifest')}</h2>
        <p className="text-gray-400">{t('generation.loginRequired', 'Please log in to view generation data.')}</p>
      </div>
    )
  }

  if (!projectId) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-2">{t('generation.title', 'Generation Manifest')}</h2>
        <p className="text-gray-400">{t('generation.noProject', 'No project selected. Go to your project to view its generation manifest.')}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition-colors"
        >
          {t('generation.goHome', 'Go to Dashboard')}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors">
          &larr;
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{t('generation.title', 'Generation Manifest')}</h2>
          <p className="text-sm text-gray-400 mt-1">{t('generation.description', 'Multi-file generation with cross-file consistency validation')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleValidate}
            disabled={validating || !manifest}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            {validating ? t('generation.validating', 'Validating...') : t('generation.validate', 'Validate')}
          </button>
          {manifest && manifest.validationStatus === 'failed' && (
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {resolving ? t('generation.resolving', 'Resolving...') : t('generation.resolve', 'Resolve Conflicts')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {/* Summary Cards */}
      {manifest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{manifest.fileCount}</div>
            <div className="text-xs text-gray-400 mt-1">{t('generation.files', 'Files')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{manifest.crossReferenceCount}</div>
            <div className="text-xs text-gray-400 mt-1">{t('generation.crossRefs', 'Cross-References')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${manifest.issueCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {manifest.issueCount}
            </div>
            <div className="text-xs text-gray-400 mt-1">{t('generation.issues', 'Issues')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${statusColor(manifest.validationStatus)}`}>
              {manifest.validationStatus.toUpperCase()}
            </span>
            <div className="text-xs text-gray-400 mt-1">{t('generation.status', 'Status')}</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
        {(['files', 'dependencies', 'validation'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'files' && `${t('generation.tab.files', 'Files')} (${files.length})`}
            {tab === 'dependencies' && `${t('generation.tab.dependencies', 'Dependencies')} (${crossRefs.length})`}
            {tab === 'validation' && `${t('generation.tab.validation', 'Validation')} (${issues.length})`}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-400">{t('generation.loading', 'Loading...')}</div>
      )}

      {/* Files Tab */}
      {!loading && activeTab === 'files' && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder={t('generation.searchPlaceholder', 'Search files...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />

          {filteredFileInfos.length === 0 && filteredFiles.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400">{t('generation.noFiles', 'No files in manifest. Create a manifest first.')}</p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-gray-500 font-medium">
                <div className="col-span-5">{t('generation.filePath', 'File Path')}</div>
                <div className="col-span-2">{t('generation.language', 'Language')}</div>
                <div className="col-span-1 text-center">{t('generation.size', 'Size')}</div>
                <div className="col-span-1 text-center">{t('generation.exports', 'Exp')}</div>
                <div className="col-span-1 text-center">{t('generation.imports', 'Imp')}</div>
                <div className="col-span-1 text-center">{t('generation.deps', 'Deps')}</div>
                <div className="col-span-1 text-center">{t('generation.dependents', 'Used')}</div>
              </div>
              {(filteredFileInfos.length > 0 ? filteredFileInfos : filteredFiles).map((file, i) => {
                const info = 'exportCount' in file ? file as GeneratedFileInfo : null
                const mf = !info ? file as ManifestFile : null
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 bg-gray-800 rounded-lg px-3 py-2 text-sm">
                    <div className="col-span-5 text-white truncate font-mono text-xs" title={file.path}>{file.path}</div>
                    <div className="col-span-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${languageColor(file.language)}`}>{file.language}</span>
                    </div>
                    <div className="col-span-1 text-center text-gray-400 text-xs">{file.size > 1024 ? `${(file.size / 1024).toFixed(1)}K` : `${file.size}B`}</div>
                    <div className="col-span-1 text-center text-gray-400 text-xs">{info ? info.exportCount : mf?.exports.length ?? 0}</div>
                    <div className="col-span-1 text-center text-gray-400 text-xs">{info ? info.importCount : mf?.imports.length ?? 0}</div>
                    <div className="col-span-1 text-center text-gray-400 text-xs">{info ? info.dependencyCount : '-'}</div>
                    <div className="col-span-1 text-center text-gray-400 text-xs">{info ? info.dependentCount : '-'}</div>
                  </div>
                )
              })}
              <div className="text-xs text-gray-500 text-right pt-2">
                {(filteredFileInfos.length > 0 ? filteredFileInfos.length : filteredFiles.length)} / {files.length} {t('generation.filesLabel', 'files')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dependencies Tab */}
      {!loading && activeTab === 'dependencies' && (
        <div className="space-y-3">
          {crossRefs.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400">{t('generation.noDeps', 'No cross-file dependencies detected.')}</p>
            </div>
          ) : (
            <>
              {/* Dependency graph as list */}
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-gray-500 font-medium">
                  <div className="col-span-4">{t('generation.source', 'Source File')}</div>
                  <div className="col-span-1 text-center">-&gt;</div>
                  <div className="col-span-4">{t('generation.target', 'Target File')}</div>
                  <div className="col-span-3">{t('generation.symbol', 'Symbol')}</div>
                </div>
                {crossRefs.map((ref, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 bg-gray-800 rounded-lg px-3 py-2 text-sm">
                    <div className="col-span-4 text-white truncate font-mono text-xs" title={ref.sourceFile}>{ref.sourceFile}</div>
                    <div className="col-span-1 text-center text-gray-500">
                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">{ref.referenceType}</span>
                    </div>
                    <div className="col-span-4 text-blue-400 truncate font-mono text-xs" title={ref.targetFile}>{ref.targetFile}</div>
                    <div className="col-span-3 text-gray-400 truncate text-xs" title={ref.symbol}>{ref.symbol}</div>
                  </div>
                ))}
              </div>

              {/* File dependency summary */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-3">{t('generation.depSummary', 'Dependency Summary')}</h3>
                <div className="space-y-2">
                  {Array.from(new Set(crossRefs.map(r => r.sourceFile))).map(src => {
                    const deps = crossRefs.filter(r => r.sourceFile === src)
                    return (
                      <div key={src} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-white truncate flex-shrink-0 max-w-[200px]" title={src}>{src.split('/').pop()}</span>
                        <span className="text-xs text-gray-500">depends on</span>
                        <div className="flex gap-1 flex-wrap">
                          {deps.map((d, j) => (
                            <span key={j} className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-blue-300 font-mono">{d.targetFile.split('/').pop()}</span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Validation Tab */}
      {!loading && activeTab === 'validation' && (
        <div className="space-y-3">
          {issues.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400">
                {manifest?.validationStatus === 'passed'
                  ? t('generation.noIssues', 'All checks passed. Cross-file consistency is valid.')
                  : t('generation.noValidation', 'No validation results. Click Validate to check consistency.')}
              </p>
            </div>
          ) : (
            issues.map((issue, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${issueStatusColor(issue.status)}`}>
                        {issue.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">{issue.rule}</span>
                    </div>
                    <p className="text-sm text-white">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-xs mt-2 text-blue-300 bg-blue-900/20 rounded p-2">
                        {t('generation.suggestion', 'Suggestion')}: {issue.suggestion}
                      </p>
                    )}
                    {issue.affectedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {issue.affectedFiles.map((f, j) => (
                          <span key={j} className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300 font-mono">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
