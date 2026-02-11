import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectDocumentation, QaEntry, ProjectDocStats } from '../api/projectDocs'
import {
  listProjectDocs,
  generateProjectDoc,
  askProjectDoc,
  deleteProjectDoc,
  getProjectDocStats,
} from '../api/projectDocs'

type Tab = 'generate' | 'qa' | 'library' | 'stats'

export default function ProjectDocsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('generate')

  // Generate tab
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedDoc, setGeneratedDoc] = useState<ProjectDocumentation | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ architecture: true, components: true, api: true, setup: true })

  // Q&A tab
  const [docs, setDocs] = useState<ProjectDocumentation[]>([])
  const [selectedDocId, setSelectedDocId] = useState('')
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [qaDoc, setQaDoc] = useState<ProjectDocumentation | null>(null)

  // Library tab
  const [libraryDocs, setLibraryDocs] = useState<ProjectDocumentation[]>([])
  const [viewDoc, setViewDoc] = useState<ProjectDocumentation | null>(null)

  // Stats tab
  const [stats, setStats] = useState<ProjectDocStats | null>(null)

  useEffect(() => {
    if (tab === 'qa' || tab === 'library') {
      listProjectDocs().then((d) => {
        setDocs(d)
        setLibraryDocs(d)
        if (d.length > 0 && !selectedDocId) setSelectedDocId(d[0].id)
      }).catch(() => {})
    }
    if (tab === 'stats') {
      getProjectDocStats().then(setStats).catch(() => {})
    }
  }, [tab])

  const parseQaHistory = (json: string): QaEntry[] => {
    try { return JSON.parse(json) } catch { return [] }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleGenerate = async () => {
    if (!projectName.trim()) return
    setGenerating(true)
    try {
      const doc = await generateProjectDoc({ projectName, description })
      setGeneratedDoc(doc)
    } catch { /* ignore */ }
    setGenerating(false)
  }

  const handleAsk = async () => {
    if (!selectedDocId || !question.trim()) return
    setAsking(true)
    try {
      const updated = await askProjectDoc(selectedDocId, question)
      setQaDoc(updated)
      setQuestion('')
    } catch { /* ignore */ }
    setAsking(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteProjectDoc(id)
      setLibraryDocs(libraryDocs.filter(d => d.id !== id))
      setDocs(docs.filter(d => d.id !== id))
      if (viewDoc?.id === id) setViewDoc(null)
    } catch { /* ignore */ }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-900/30 text-yellow-400',
      generating: 'bg-blue-900/30 text-blue-400',
      completed: 'bg-green-900/30 text-green-400',
      failed: 'bg-red-900/30 text-red-400',
    }
    return colors[status] || 'bg-gray-700 text-gray-400'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('projectDocs.title', 'Project Documentation')}</h3>
      <p className="text-gray-400 text-sm mb-6">{t('projectDocs.subtitle', 'Auto-generate comprehensive documentation for your projects with architecture overview, component docs, API reference, and interactive Q&A.')}</p>

      <div className="flex gap-2 mb-6">
        {(['generate', 'qa', 'library', 'stats'] as Tab[]).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t2 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t(`projectDocs.tabs.${t2}`, t2 === 'qa' ? 'Q&A' : t2.charAt(0).toUpperCase() + t2.slice(1))}
          </button>
        ))}
      </div>

      {tab === 'generate' && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h4 className="font-medium mb-4">{t('projectDocs.generateTitle', 'Generate Documentation')}</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('projectDocs.projectName', 'Project Name')}</label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={t('projectDocs.projectNamePlaceholder', 'e.g., My E-Commerce Platform')}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('projectDocs.description', 'Project Description')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('projectDocs.descriptionPlaceholder', 'Describe your project features, tech stack, and key requirements... (e.g., React frontend with REST API, PostgreSQL database, JWT auth)')}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || !projectName.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {generating ? t('projectDocs.generating', 'Generating...') : t('projectDocs.generateBtn', 'Generate Documentation')}
              </button>
            </div>
          </div>

          {generatedDoc && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{generatedDoc.projectName}</h4>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{generatedDoc.sourceFilesCount} files</span>
                  <span>{generatedDoc.totalLinesAnalyzed.toLocaleString()} lines</span>
                  <span>{generatedDoc.generationTimeMs}ms</span>
                  <span className={`px-2 py-0.5 rounded ${statusBadge(generatedDoc.status)}`}>{generatedDoc.status}</span>
                </div>
              </div>

              {[
                { key: 'architecture', title: t('projectDocs.sections.architecture', 'Architecture Overview'), content: generatedDoc.architectureOverview },
                { key: 'components', title: t('projectDocs.sections.components', 'Component Documentation'), content: generatedDoc.componentDocs },
                { key: 'api', title: t('projectDocs.sections.api', 'API Reference'), content: generatedDoc.apiReference },
                { key: 'setup', title: t('projectDocs.sections.setup', 'Setup Guide'), content: generatedDoc.setupGuide },
              ].map((section) => (
                <div key={section.key} className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800 transition-colors"
                  >
                    <span className="font-medium text-sm">{section.title}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform ${expandedSections[section.key] ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {expandedSections[section.key] && (
                    <div className="px-4 pb-4 text-sm text-gray-300 whitespace-pre-wrap border-t border-gray-700 pt-3">
                      {section.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'qa' && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h4 className="font-medium mb-4">{t('projectDocs.qaTitle', 'Ask About Your Project')}</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('projectDocs.selectDoc', 'Select Documentation')}</label>
                <select
                  value={selectedDocId}
                  onChange={(e) => {
                    setSelectedDocId(e.target.value)
                    setQaDoc(docs.find(d => d.id === e.target.value) || null)
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {docs.length === 0 && <option value="">No documentation available</option>}
                  {docs.map((d) => (
                    <option key={d.id} value={d.id}>{d.projectName}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('projectDocs.questionPlaceholder', 'Ask a question about the project... (e.g., How is the API structured?)')}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleAsk}
                  disabled={asking || !selectedDocId || !question.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {asking ? t('projectDocs.asking', 'Asking...') : t('projectDocs.askBtn', 'Ask')}
                </button>
              </div>
            </div>
          </div>

          {qaDoc && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">{t('projectDocs.qaHistory', 'Q&A History')} - {qaDoc.projectName}</h4>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                {parseQaHistory(qaDoc.qaHistoryJson).length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">{t('projectDocs.noQa', 'No questions asked yet. Ask your first question above!')}</div>
                )}
                {parseQaHistory(qaDoc.qaHistoryJson).map((entry, i) => (
                  <div key={i} className="mb-4">
                    <div className="flex justify-end mb-2">
                      <div className="max-w-[80%] rounded-lg p-3 text-sm bg-blue-600 text-white">
                        {entry.question}
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-3 text-sm bg-gray-800 text-gray-200 border border-gray-700">
                        {entry.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'library' && (
        <div className="space-y-3">
          {libraryDocs.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">{t('projectDocs.noLibrary', 'No documentation generated yet. Go to the Generate tab to create your first!')}</div>
          )}
          {viewDoc && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{viewDoc.projectName}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(viewDoc.status)}`}>{viewDoc.status}</span>
                </div>
                <button onClick={() => setViewDoc(null)} className="text-sm text-gray-400 hover:text-white">Close</button>
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-3">
                {[
                  { title: 'Architecture Overview', content: viewDoc.architectureOverview },
                  { title: 'Component Docs', content: viewDoc.componentDocs },
                  { title: 'API Reference', content: viewDoc.apiReference },
                  { title: 'Setup Guide', content: viewDoc.setupGuide },
                ].map((section, i) => (
                  <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <h5 className="text-xs font-medium text-gray-400 mb-2">{section.title}</h5>
                    <div className="text-xs text-gray-300 whitespace-pre-wrap">{section.content}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-400">
                {viewDoc.sourceFilesCount} files, {viewDoc.totalLinesAnalyzed.toLocaleString()} lines, {viewDoc.generationTimeMs}ms generation time
              </div>
            </div>
          )}
          {libraryDocs.map((d) => (
            <div key={d.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => setViewDoc(d)}>
                <div className="font-medium text-sm">{d.projectName}</div>
                <div className="text-xs text-gray-400 mt-1">{d.sourceFilesCount} files, {d.totalLinesAnalyzed.toLocaleString()} lines analyzed</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(d.status)}`}>{d.status}</span>
                <span className="text-xs text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  {t('projectDocs.delete', 'Delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalDocs}</div>
              <div className="text-sm text-gray-400">{t('projectDocs.stats.totalDocs', 'Total Docs')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.totalFilesAnalyzed}</div>
              <div className="text-sm text-gray-400">{t('projectDocs.stats.filesAnalyzed', 'Files Analyzed')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.totalLinesAnalyzed.toLocaleString()}</div>
              <div className="text-sm text-gray-400">{t('projectDocs.stats.linesAnalyzed', 'Lines Analyzed')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.avgGenerationTimeMs}ms</div>
              <div className="text-sm text-gray-400">{t('projectDocs.stats.avgGenTime', 'Avg Generation Time')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.totalTokensUsed.toLocaleString()}</div>
              <div className="text-sm text-gray-400">{t('projectDocs.stats.tokensUsed', 'Tokens Used')}</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'stats' && !stats && (
        <div className="text-center py-12 text-gray-500 text-sm">{t('projectDocs.stats.loading', 'Loading stats...')}</div>
      )}
    </div>
  )
}
