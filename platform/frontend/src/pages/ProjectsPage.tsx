import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getProjects, type ProjectSummary } from '../api/projects'

export default function ProjectsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getProjects()
      setProjects(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.requestFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function getStatusBadge(status: string) {
    switch (status) {
      case 'Active':
        return (
          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
            {t('projects.status.active')}
          </span>
        )
      case 'Paused':
        return (
          <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">
            {t('projects.status.paused')}
          </span>
        )
      case 'Archived':
        return (
          <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded">
            {t('projects.status.archived')}
          </span>
        )
      default:
        return null
    }
  }

  function getDeploymentStatusBadge(status: string) {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('running') || statusLower.includes('deployed')) {
      return <span className="text-green-400">●</span>
    }
    if (statusLower.includes('building') || statusLower.includes('deploying')) {
      return <span className="text-yellow-400">●</span>
    }
    if (statusLower.includes('failed')) {
      return <span className="text-red-400">●</span>
    }
    return <span className="text-gray-400">●</span>
  }

  function formatCost(cost: number): string {
    return `$${cost.toFixed(2)}`
  }

  function formatDate(date?: string): string {
    if (!date) return t('projects.never')
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <section className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('projects.title')}</h1>
          <p className="text-warm-400 mt-1">{t('projects.subtitle')}</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 min-h-[44px] bg-blue-500 hover:bg-blue-600 rounded transition-colors self-start sm:self-auto"
        >
          {t('projects.newProject')}
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('projects.searchPlaceholder')}
          className="flex-1 px-4 py-2 bg-warm-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <span className="ml-3 text-warm-400">{t('projects.loading')}</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Projects Grid */}
      {!loading && !error && (
        <>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-warm-400">
              {searchTerm
                ? t('projects.noResults')
                : t('projects.noProjects')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="bg-warm-800 rounded-lg p-5 hover:bg-warm-700 cursor-pointer transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold truncate">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getDeploymentStatusBadge(project.deploymentStatus)}
                        <span className="text-xs text-warm-400">
                          {project.deploymentStatus}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>

                  {/* URL */}
                  {project.productionUrl && (
                    <div className="mb-3">
                      <a
                        href={project.productionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-blue-400 hover:text-blue-300 truncate block"
                      >
                        {project.productionUrl}
                      </a>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <div className="text-warm-500 text-xs">
                        {t('projects.dailyCost')}
                      </div>
                      <div className="text-white font-semibold">
                        {formatCost(project.dailyCost)}
                      </div>
                    </div>
                    <div>
                      <div className="text-warm-500 text-xs">
                        {t('projects.plan')}
                      </div>
                      <div className="text-white font-semibold truncate">
                        {project.planName}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-xs text-warm-500 pt-3 border-t border-warm-700">
                    {t('projects.lastDeployed')}: {formatDate(project.lastDeployedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
