import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject, getProjectCostBreakdown, type ProjectDetail, type ProjectCostBreakdown } from '../api/projects'
import { RealTimeLogViewer } from '../components/RealTimeLogViewer'

type TabType = 'overview' | 'cost' | 'plan' | 'logs'

export default function ProjectDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [costBreakdown, setCostBreakdown] = useState<ProjectCostBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    if (!id) return

    async function loadProject() {
      try {
        setLoading(true)
        const projectData = await getProject(id!)
        setProject(projectData)

        // Load cost breakdown if available
        if (projectData.costBreakdown) {
          setCostBreakdown(projectData.costBreakdown)
        } else {
          try {
            const breakdown = await getProjectCostBreakdown(id!)
            setCostBreakdown(breakdown)
          } catch {
            // Cost breakdown not available
          }
        }

        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : t('error.requestFailed'))
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [id, t])

  function formatCost(cost?: number): string {
    if (cost === undefined || cost === null) return '$0.00'
    return `$${cost.toFixed(2)}`
  }

  function formatDate(date?: string): string {
    if (!date) return t('projects.never')
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <section className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <span className="ml-3 text-warm-400">{t('projects.loading')}</span>
        </div>
      </section>
    )
  }

  if (error || !project) {
    return (
      <section className="p-6">
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error || t('projects.notFound')}
        </div>
      </section>
    )
  }

  return (
    <section className="p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/projects')}
          className="text-warm-400 hover:text-white transition-colors mb-4 flex items-center gap-2"
        >
          <span>&larr;</span>
          <span>{t('projects.backToProjects')}</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.productionUrl && (
              <a
                href={project.productionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
              >
                {project.productionUrl}
              </a>
            )}
          </div>
          <span
            className={`px-3 py-1 text-sm rounded ${
              project.status === 'Active'
                ? 'bg-green-500/20 text-green-400'
                : project.status === 'Paused'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {t(`projects.status.${project.status.toLowerCase()}`)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-warm-700">
        <div className="flex gap-6">
          {(['overview', 'cost', 'plan', 'logs'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-warm-400 hover:text-white'
              }`}
            >
              {t(`projects.tabs.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-warm-800 rounded-lg p-5 space-y-4">
              <h3 className="text-lg font-semibold">{t('projects.overview.info')}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-warm-500">{t('projects.overview.status')}</div>
                  <div className="text-white">{project.deploymentStatus}</div>
                </div>
                <div>
                  <div className="text-warm-500">{t('projects.overview.region')}</div>
                  <div className="text-white">{project.region || t('projects.overview.notAvailable')}</div>
                </div>
                <div>
                  <div className="text-warm-500">{t('projects.overview.container')}</div>
                  <div className="text-white">{project.containerAppName || t('projects.overview.notAvailable')}</div>
                </div>
                <div>
                  <div className="text-warm-500">{t('projects.overview.created')}</div>
                  <div className="text-white">{formatDate(project.createdAt)}</div>
                </div>
                <div>
                  <div className="text-warm-500">{t('projects.overview.lastDeployed')}</div>
                  <div className="text-white">{formatDate(project.lastDeployedAt)}</div>
                </div>
              </div>
            </div>

            <div className="bg-warm-800 rounded-lg p-5 space-y-4">
              <h3 className="text-lg font-semibold">{t('projects.overview.resources')}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-warm-500">{t('projects.overview.vcpu')}</div>
                  <div className="text-white">{project.containerVcpu || project.planVcpu || t('projects.overview.notAvailable')}</div>
                </div>
                <div>
                  <div className="text-warm-500">{t('projects.overview.memory')}</div>
                  <div className="text-white">{project.containerMemoryGb || project.planMemoryGb || t('projects.overview.notAvailable')}</div>
                </div>
                <div>
                  <div className="text-warm-500">{t('projects.overview.storage')}</div>
                  <div className="text-white">
                    {project.planStorageGb ? `${project.planStorageGb} GB` : t('projects.overview.notAvailable')}
                  </div>
                </div>
                <div>
                  <div className="text-warm-500">{t('projects.overview.bandwidth')}</div>
                  <div className="text-white">
                    {project.planBandwidthGb ? `${project.planBandwidthGb} GB` : t('projects.overview.notAvailable')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cost' && (
          <div className="space-y-6">
            {costBreakdown ? (
              <>
                <div className="bg-warm-800 rounded-lg p-6">
                  <h3 className="text-2xl font-bold mb-2">
                    {formatCost(costBreakdown.totalDailyCost)}
                    <span className="text-base font-normal text-warm-400 ml-2">
                      {t('projects.cost.perDay')}
                    </span>
                  </h3>
                  <div className="text-warm-400 text-sm">
                    {t('projects.cost.estimated')}: {formatCost(costBreakdown.totalDailyCost * 30)} {t('projects.cost.perMonth')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-warm-800 rounded-lg p-4">
                    <div className="text-warm-500 text-sm">{t('projects.cost.hosting')}</div>
                    <div className="text-2xl font-semibold mt-1">{formatCost(costBreakdown.hostingCost)}</div>
                  </div>
                  <div className="bg-warm-800 rounded-lg p-4">
                    <div className="text-warm-500 text-sm">{t('projects.cost.aiUsage')}</div>
                    <div className="text-2xl font-semibold mt-1">{formatCost(costBreakdown.aiUsageCost)}</div>
                  </div>
                  <div className="bg-warm-800 rounded-lg p-4">
                    <div className="text-warm-500 text-sm">{t('projects.cost.container')}</div>
                    <div className="text-2xl font-semibold mt-1">{formatCost(costBreakdown.containerCost)}</div>
                  </div>
                  <div className="bg-warm-800 rounded-lg p-4">
                    <div className="text-warm-500 text-sm">{t('projects.cost.storage')}</div>
                    <div className="text-2xl font-semibold mt-1">{formatCost(costBreakdown.storageCost)}</div>
                  </div>
                  <div className="bg-warm-800 rounded-lg p-4">
                    <div className="text-warm-500 text-sm">{t('projects.cost.bandwidth')}</div>
                    <div className="text-2xl font-semibold mt-1">{formatCost(costBreakdown.bandwidthCost)}</div>
                  </div>
                </div>

                <div className="text-xs text-warm-500">
                  {t('projects.cost.calculatedAt')}: {formatDate(costBreakdown.calculatedAt)}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-warm-400">
                {t('projects.cost.notAvailable')}
              </div>
            )}
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="bg-warm-800 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">{t('projects.plan.current')}</h3>
            <div className="space-y-3">
              <div>
                <div className="text-warm-500 text-sm">{t('projects.plan.name')}</div>
                <div className="text-2xl font-bold">{project.planName || t('projects.plan.noPlan')}</div>
              </div>
              {project.planCost !== undefined && (
                <div>
                  <div className="text-warm-500 text-sm">{t('projects.plan.cost')}</div>
                  <div className="text-xl font-semibold">
                    {formatCost(project.planCost)} {t('projects.plan.perMonth')}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-warm-700">
                <div>
                  <div className="text-warm-500 text-xs">{t('projects.plan.vcpu')}</div>
                  <div className="text-white font-semibold">{project.planVcpu || '-'}</div>
                </div>
                <div>
                  <div className="text-warm-500 text-xs">{t('projects.plan.memory')}</div>
                  <div className="text-white font-semibold">{project.planMemoryGb || '-'}</div>
                </div>
                <div>
                  <div className="text-warm-500 text-xs">{t('projects.plan.storage')}</div>
                  <div className="text-white font-semibold">
                    {project.planStorageGb ? `${project.planStorageGb} GB` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-warm-500 text-xs">{t('projects.plan.bandwidth')}</div>
                  <div className="text-white font-semibold">
                    {project.planBandwidthGb ? `${project.planBandwidthGb} GB` : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-warm-800 rounded-lg p-6 h-[600px]">
            <RealTimeLogViewer projectId={id!} />
          </div>
        )}
      </div>
    </section>
  )
}
