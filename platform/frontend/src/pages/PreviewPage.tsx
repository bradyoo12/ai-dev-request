import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CodePreview from '../components/CodePreview'
import { sampleProjectFiles } from '../utils/sampleProject'

export default function PreviewPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const projectId = searchParams.get('projectId')
  const projectName = searchParams.get('name')

  // TODO: When real project file data is available from the backend,
  // fetch files by projectId here. For now, use the sample project.
  const files = sampleProjectFiles

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          &larr;
        </button>
        <div>
          <h2 className="text-2xl font-bold">{t('codePreview.title')}</h2>
          {projectId && (
            <p className="text-sm text-gray-400">
              {t('codePreview.projectId')}: {projectId}
            </p>
          )}
        </div>
      </div>

      <CodePreview
        files={files}
        projectName={projectName || undefined}
      />
    </section>
  )
}
