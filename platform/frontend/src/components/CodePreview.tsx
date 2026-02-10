import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  SandpackProvider,
  SandpackLayout,
  SandpackFileExplorer,
  SandpackCodeEditor,
  SandpackPreview,
} from '@codesandbox/sandpack-react'

type ViewportMode = 'desktop' | 'tablet' | 'mobile'

interface CodePreviewProps {
  files: Record<string, string>
  projectName?: string
}

const viewportWidths: Record<ViewportMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

export default function CodePreview({ files, projectName }: CodePreviewProps) {
  const { t } = useTranslation()
  const [viewport, setViewport] = useState<ViewportMode>('desktop')
  const [copiedFile, setCopiedFile] = useState<string | null>(null)

  const handleCopyCode = async (filename: string) => {
    const content = files[filename]
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      setCopiedFile(filename)
      setTimeout(() => setCopiedFile(null), 2000)
    } catch {
      // clipboard fallback - ignore
    }
  }

  // Get the list of filenames for the copy dropdown
  const fileNames = Object.keys(files)

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h4 className="font-bold text-blue-400">
            {projectName || t('codePreview.title')}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {/* Viewport Switcher */}
          <div className="flex bg-gray-900 rounded-lg p-0.5">
            {(['desktop', 'tablet', 'mobile'] as ViewportMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewport(mode)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewport === mode
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t(`codePreview.viewport.${mode}`)}
              </button>
            ))}
          </div>

          {/* Copy Code Dropdown */}
          <div className="relative group">
            <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors">
              {t('codePreview.copyCode')}
            </button>
            <div className="absolute right-0 top-full mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 hidden group-hover:block">
              {fileNames.map((filename) => (
                <button
                  key={filename}
                  onClick={() => handleCopyCode(filename)}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg font-mono"
                >
                  {copiedFile === filename
                    ? t('codePreview.copied')
                    : filename}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sandpack Editor */}
      <SandpackProvider
        template="react-ts"
        files={files}
        theme="dark"
        options={{
          visibleFiles: fileNames,
          activeFile: fileNames[0] || '/App.tsx',
        }}
      >
        <SandpackLayout
          style={{
            border: 'none',
            borderRadius: 0,
            backgroundColor: '#0f172a',
          }}
        >
          <SandpackFileExplorer
            style={{
              height: '500px',
              minWidth: '160px',
              maxWidth: '200px',
            }}
          />
          <SandpackCodeEditor
            showTabs
            showLineNumbers
            showInlineErrors
            wrapContent
            style={{
              height: '500px',
              minWidth: '300px',
            }}
          />
          <div
            style={{
              width: viewportWidths[viewport],
              maxWidth: viewport === 'desktop' ? '100%' : viewportWidths[viewport],
              transition: 'width 0.3s ease',
              flexShrink: 0,
            }}
          >
            <SandpackPreview
              showOpenInCodeSandbox={false}
              showRefreshButton
              style={{
                height: '500px',
              }}
            />
          </div>
        </SandpackLayout>
      </SandpackProvider>

      {/* Footer info */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
        <span>
          {t('codePreview.files')}: {fileNames.length}
        </span>
        <span>{t('codePreview.livePreview')}</span>
      </div>
    </div>
  )
}
