import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import IterativeChat from '../components/IterativeChat'
import type { FileChange } from '../api/iteration'

interface CodeFile {
  path: string
  content: string
  language: string
}

export default function IterativeRefinementPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [currentFiles, setCurrentFiles] = useState<CodeFile[]>([])
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null)
  const [tokenBalance, setTokenBalance] = useState(0)
  const [layout, setLayout] = useState<'split' | 'chat-only' | 'code-only'>('split')
  const [previewUrl, setPreviewUrl] = useState<string>('')

  useEffect(() => {
    if (!id) {
      navigate('/')
      return
    }
    // Load initial project files
    loadProjectFiles()
  }, [id, navigate])

  const loadProjectFiles = async () => {
    // TODO: Implement loading project files from backend
    // For now, use placeholder
    setCurrentFiles([
      {
        path: 'src/App.tsx',
        content: '// Your code here',
        language: 'typescript'
      }
    ])
    setSelectedFile(currentFiles[0])
  }

  const handleFilesChanged = (changes: FileChange[]) => {
    // Update local file list based on changes
    setCurrentFiles(prev => {
      const updated = [...prev]
      changes.forEach(change => {
        if (change.operation === 'create') {
          updated.push({
            path: change.file,
            content: change.diff || '',
            language: getLanguageFromPath(change.file)
          })
        } else if (change.operation === 'modify') {
          const idx = updated.findIndex(f => f.path === change.file)
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              content: change.diff || updated[idx].content
            }
          }
        } else if (change.operation === 'delete') {
          const idx = updated.findIndex(f => f.path === change.file)
          if (idx !== -1) {
            updated.splice(idx, 1)
          }
        }
      })
      return updated
    })
  }

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase()
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      cs: 'csharp',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown'
    }
    return langMap[ext || ''] || 'plaintext'
  }

  const handleTokensUsed = (tokensUsed: number, newBalance: number) => {
    setTokenBalance(newBalance)
  }

  if (!id) return null

  return (
    <div className="min-h-screen bg-warm-950 text-white">
      {/* Top Bar */}
      <div className="bg-warm-900 border-b border-warm-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/sites')}
              className="text-warm-400 hover:text-white transition-colors"
            >
              ← {t('iteration.backToSites')}
            </button>
            <h1 className="text-xl font-bold">{t('iteration.pageTitle')}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-warm-400">
              {t('tokens.balance')}: <span className="text-white font-medium">{tokenBalance}</span>
            </div>

            {/* Layout Toggle */}
            <div className="flex gap-1 bg-warm-800 rounded-lg p-1">
              <button
                onClick={() => setLayout('chat-only')}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  layout === 'chat-only' ? 'bg-blue-600 text-white' : 'text-warm-400 hover:text-white'
                }`}
              >
                💬 {t('iteration.chatOnly')}
              </button>
              <button
                onClick={() => setLayout('split')}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  layout === 'split' ? 'bg-blue-600 text-white' : 'text-warm-400 hover:text-white'
                }`}
              >
                ⚡ {t('iteration.splitView')}
              </button>
              <button
                onClick={() => setLayout('code-only')}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  layout === 'code-only' ? 'bg-blue-600 text-white' : 'text-warm-400 hover:text-white'
                }`}
              >
                📝 {t('iteration.codeOnly')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-64px)] flex">
        {/* Chat Panel */}
        {(layout === 'split' || layout === 'chat-only') && (
          <div className={`${layout === 'split' ? 'w-1/3' : 'w-full'} border-r border-warm-800 p-4`}>
            <IterativeChat
              requestId={id}
              onTokensUsed={handleTokensUsed}
              onFilesChanged={handleFilesChanged}
            />
          </div>
        )}

        {/* Code Editor Panel */}
        {(layout === 'split' || layout === 'code-only') && (
          <div className={`${layout === 'split' ? 'w-1/3' : 'w-1/2'} flex flex-col border-r border-warm-800`}>
            {/* File Tabs */}
            <div className="bg-warm-900 border-b border-warm-800 px-4 py-2 overflow-x-auto">
              <div className="flex gap-2">
                {currentFiles.slice(0, 5).map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`px-3 py-1 rounded-t text-xs whitespace-nowrap transition-colors ${
                      selectedFile?.path === file.path
                        ? 'bg-warm-800 text-white'
                        : 'text-warm-400 hover:text-white hover:bg-warm-800/50'
                    }`}
                  >
                    {file.path.split('/').pop()}
                  </button>
                ))}
                {currentFiles.length > 5 && (
                  <span className="px-3 py-1 text-xs text-warm-500">
                    +{currentFiles.length - 5} more
                  </span>
                )}
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto bg-warm-900 p-4">
              {selectedFile ? (
                <div>
                  <div className="mb-2 text-sm text-warm-400 font-mono">
                    {selectedFile.path}
                  </div>
                  <pre className="bg-warm-800 rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm font-mono text-warm-100">
                      {selectedFile.content}
                    </code>
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-warm-500">
                  {t('iteration.selectFile')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Preview Panel */}
        {(layout === 'split' || layout === 'code-only') && (
          <div className={`${layout === 'split' ? 'w-1/3' : 'w-1/2'} flex flex-col bg-warm-900`}>
            <div className="bg-warm-900 border-b border-warm-800 px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('iteration.livePreview')}</span>
                <button
                  onClick={() => setPreviewUrl(prev => prev ? '' : `http://localhost:3000`)}
                  className="text-xs text-warm-400 hover:text-white transition-colors"
                >
                  {previewUrl ? '⏸' : '▶'} {previewUrl ? t('iteration.pausePreview') : t('iteration.startPreview')}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full bg-white"
                  title="Live Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-warm-500">
                  {t('iteration.previewNotStarted')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
