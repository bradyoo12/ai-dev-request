import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CodePreview from '../components/CodePreview'
import { getProjectFiles } from '../api/requests'
import { sampleProjectFiles } from '../utils/sampleProject'

export default function PreviewPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const projectId = searchParams.get('projectId')
  const projectName = searchParams.get('name')
  const requestId = searchParams.get('requestId')

  const [files, setFiles] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSample, setIsSample] = useState(false)

  useEffect(() => {
    if (!requestId) {
      setFiles(sampleProjectFiles)
      setIsSample(true)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getProjectFiles(requestId)
      .then((data) => {
        if (cancelled) return
        if (data && data.files && Object.keys(data.files).length > 0) {
          setFiles(data.files)
          setIsSample(false)
        } else {
          setFiles(sampleProjectFiles)
          setIsSample(true)
        }
      })
      .catch(() => {
        if (cancelled) return
        setError(t('codePreview.loadError'))
        setFiles(sampleProjectFiles)
        setIsSample(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [requestId, t])

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-warm-400 hover:text-white transition-colors"
        >
          &larr;
        </button>
        <div>
          <h2 className="text-2xl font-bold">{t('codePreview.title')}</h2>
          {projectId && (
            <p className="text-sm text-warm-400">
              {t('codePreview.projectId')}: {projectId}
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-warm-400">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>{t('codePreview.loading')}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400 text-sm">
          {error}
        </div>
      )}

      {isSample && !loading && (
        <div className="mb-4 px-4 py-2 bg-warm-800 border border-warm-700 rounded-lg text-warm-400 text-sm">
          {t('codePreview.sampleData')}
        </div>
      )}

      {!loading && files && (
        <CodePreview
          files={files}
          projectName={projectName || undefined}
        />
      )}
    </section>
  )
}
