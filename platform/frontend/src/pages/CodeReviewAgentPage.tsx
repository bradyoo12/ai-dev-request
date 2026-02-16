import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { submitCodeReview } from '../api/codeReviewAgent'
import type { CodeReviewAgentResponse } from '../api/codeReviewAgent'
import CodeReviewPanel from '../components/CodeReviewPanel'

const LANGUAGES = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'csharp', label: 'C#' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
]

export default function CodeReviewAgentPage() {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('typescript')
  const [fileName, setFileName] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [result, setResult] = useState<CodeReviewAgentResponse | null>(null)
  const [error, setError] = useState('')

  const handleReview = async () => {
    if (!code.trim()) return

    try {
      setError('')
      setReviewing(true)
      setResult(null)
      const response = await submitCodeReview({
        code,
        language,
        fileName: fileName || 'untitled',
      })
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('codeReviewAgent.reviewButton'))
    } finally {
      setReviewing(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('codeReviewAgent.title')}</h1>
        <p className="text-sm text-warm-400 mt-1">{t('codeReviewAgent.description')}</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Input Section */}
      <div className="bg-warm-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-warm-400 mb-1 block">{t('codeReviewAgent.language')}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-warm-900 border border-warm-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-warm-400 mb-1 block">File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g., main.ts"
              className="w-full bg-warm-900 border border-warm-700 rounded-lg px-3 py-2 text-sm text-white placeholder-warm-600"
            />
          </div>
        </div>

        <div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('codeReviewAgent.inputPlaceholder')}
            rows={16}
            className="w-full bg-warm-900 border border-warm-700 rounded-lg px-4 py-3 text-sm text-white font-mono placeholder-warm-600 resize-y"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleReview}
            disabled={reviewing || !code.trim()}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reviewing ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                {t('codeReviewAgent.reviewing')}
              </span>
            ) : (
              t('codeReviewAgent.reviewButton')
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && <CodeReviewPanel review={result} />}
    </div>
  )
}
