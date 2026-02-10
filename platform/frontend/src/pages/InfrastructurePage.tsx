import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  analyzeInfrastructure,
  getInfrastructureConfig,
  updateInfrastructureConfig,
  generateBicep,
  getCostEstimation,
  downloadTemplates,
  type InfrastructureConfig,
  type CostEstimation,
} from '../api/infrastructure'

const ALL_SERVICES = [
  { id: 'container_apps', label: 'Azure Container Apps', description: 'Serverless container hosting with auto-scaling' },
  { id: 'postgresql', label: 'PostgreSQL Flexible Server', description: 'Managed relational database' },
  { id: 'blob_storage', label: 'Azure Blob Storage', description: 'Object storage for files and assets' },
  { id: 'app_insights', label: 'Application Insights', description: 'Monitoring, logging, and diagnostics' },
  { id: 'static_web_apps', label: 'Azure Static Web Apps', description: 'Global CDN hosting for frontend SPA' },
] as const

const TIERS = [
  { id: 'Free', label: 'Free', description: 'Development & testing' },
  { id: 'Basic', label: 'Basic', description: 'Small production workloads' },
  { id: 'Standard', label: 'Standard', description: 'Production with SLA' },
] as const

type ActiveTab = 'config' | 'preview' | 'deploy'

export default function InfrastructurePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get('requestId') || ''

  const [config, setConfig] = useState<InfrastructureConfig | null>(null)
  const [costEstimation, setCostEstimation] = useState<CostEstimation | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedTier, setSelectedTier] = useState('Basic')
  const [activeTab, setActiveTab] = useState<ActiveTab>('config')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (requestId) loadExistingConfig()
  }, [requestId])

  async function loadExistingConfig() {
    setLoading(true)
    try {
      const existing = await getInfrastructureConfig(requestId)
      if (existing) {
        setConfig(existing)
        setSelectedServices(existing.selectedServices)
        setSelectedTier(existing.tier)
        const cost = await getCostEstimation(requestId)
        setCostEstimation(cost)
      }
    } catch {
      // No existing config
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyze() {
    if (!requestId) {
      setError('No project selected. Please provide a requestId.')
      return
    }
    setAnalyzing(true)
    setError('')
    try {
      const result = await analyzeInfrastructure(requestId)
      setConfig(result)
      setSelectedServices(result.selectedServices)
      setSelectedTier(result.tier)
      const cost = await getCostEstimation(requestId)
      setCostEstimation(cost)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleServiceToggle(serviceId: string) {
    const updated = selectedServices.includes(serviceId)
      ? selectedServices.filter(s => s !== serviceId)
      : [...selectedServices, serviceId]

    setSelectedServices(updated)
    setError('')

    try {
      const result = await updateInfrastructureConfig(requestId, updated, selectedTier)
      setConfig(result)
      const cost = await getCostEstimation(requestId)
      setCostEstimation(cost)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  async function handleTierChange(tier: string) {
    setSelectedTier(tier)
    setError('')

    try {
      const result = await updateInfrastructureConfig(requestId, selectedServices, tier)
      setConfig(result)
      const cost = await getCostEstimation(requestId)
      setCostEstimation(cost)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    try {
      const result = await generateBicep(requestId)
      setConfig(result)
      setActiveTab('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function handleDownload() {
    try {
      const blob = await downloadTemplates(requestId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `infrastructure-${requestId.substring(0, 8)}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    }
  }

  if (!authUser) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-2">{t('infrastructure.title', 'Infrastructure')}</h2>
        <p className="text-gray-400">{t('infrastructure.loginRequired', 'Please log in to manage infrastructure.')}</p>
      </div>
    )
  }

  if (!requestId) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-2">{t('infrastructure.title', 'Infrastructure')}</h2>
        <p className="text-gray-400">{t('infrastructure.noProject', 'No project selected. Go to your project to configure infrastructure.')}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
        >
          {t('infrastructure.goHome', 'Go to Dashboard')}
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
          <h2 className="text-2xl font-bold">{t('infrastructure.title', 'Infrastructure as Code')}</h2>
          <p className="text-sm text-gray-400 mt-1">{t('infrastructure.description', 'Configure and generate Azure Bicep templates for your project')}</p>
        </div>
        {!config && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            {analyzing ? t('infrastructure.analyzing', 'Analyzing...') : t('infrastructure.analyze', 'Analyze Requirements')}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-400">{t('infrastructure.loading', 'Loading...')}</div>
      )}

      {/* Analysis Summary */}
      {config?.analysisSummary && (
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-300 mb-2">{t('infrastructure.analysisSummary', 'Analysis Summary')}</h3>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap">{config.analysisSummary}</pre>
        </div>
      )}

      {/* Tab Navigation */}
      {config && (
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(['config', 'preview', 'deploy'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'config' && t('infrastructure.tab.config', 'Configuration')}
              {tab === 'preview' && t('infrastructure.tab.preview', 'Bicep Preview')}
              {tab === 'deploy' && t('infrastructure.tab.deploy', 'Deploy')}
            </button>
          ))}
        </div>
      )}

      {/* Config Tab */}
      {config && activeTab === 'config' && (
        <div className="space-y-6">
          {/* Service Selector */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">{t('infrastructure.services', 'Azure Services')}</h3>
            <div className="space-y-3">
              {ALL_SERVICES.map((service) => (
                <label
                  key={service.id}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedServices.includes(service.id)
                      ? 'bg-blue-900/30 border border-blue-700'
                      : 'bg-gray-900 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="mt-1 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-white">{service.label}</div>
                    <div className="text-xs text-gray-400">{service.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Tier Selector */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">{t('infrastructure.tier', 'Pricing Tier')}</h3>
            <div className="grid grid-cols-3 gap-3">
              {TIERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => handleTierChange(tier.id)}
                  className={`p-4 rounded-lg text-center transition-colors border ${
                    selectedTier === tier.id
                      ? 'bg-blue-900/40 border-blue-600 text-white'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium text-sm">{tier.label}</div>
                  <div className="text-xs mt-1 text-gray-500">{tier.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cost Estimation */}
          {costEstimation && (
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">{t('infrastructure.costEstimation', 'Cost Estimation')}</h3>
              <div className="space-y-2">
                {costEstimation.lineItems.map((item) => (
                  <div key={item.service} className="flex items-center justify-between py-2 border-b border-gray-700/50">
                    <span className="text-sm text-gray-300">{item.displayName}</span>
                    <span className="text-sm font-medium text-white">
                      {item.monthlyCostUsd === 0 ? 'Free' : `$${item.monthlyCostUsd.toFixed(2)}/mo`}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-bold text-white">{t('infrastructure.totalCost', 'Total Estimated')}</span>
                  <span className="text-lg font-bold text-blue-400">
                    {costEstimation.totalMonthlyCostUsd === 0
                      ? 'Free'
                      : `$${costEstimation.totalMonthlyCostUsd.toFixed(2)}/mo`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={generating || selectedServices.length === 0}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {generating
                ? t('infrastructure.generating', 'Generating...')
                : t('infrastructure.generateBicep', 'Generate Bicep Templates')}
            </button>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {config && activeTab === 'preview' && (
        <div className="space-y-4">
          {!config.generatedBicepMain ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400">{t('infrastructure.noTemplates', 'No templates generated yet. Go to Configuration and click Generate.')}</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors"
                >
                  {t('infrastructure.downloadZip', 'Download ZIP')}
                </button>
                <button
                  onClick={() => {
                    if (config.generatedBicepMain) {
                      navigator.clipboard.writeText(config.generatedBicepMain)
                    }
                  }}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
                >
                  {t('infrastructure.copyBicep', 'Copy main.bicep')}
                </button>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px]">
                <div className="text-xs text-gray-500 mb-2 font-mono">main.bicep</div>
                <pre className="text-xs text-gray-300 font-mono whitespace-pre">{config.generatedBicepMain}</pre>
              </div>

              {config.generatedBicepParameters && (
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[200px]">
                  <div className="text-xs text-gray-500 mb-2 font-mono">main.bicepparam</div>
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre">{config.generatedBicepParameters}</pre>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Deploy Tab */}
      {config && activeTab === 'deploy' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">{t('infrastructure.deployInstructions', 'Deploy with Azure Developer CLI')}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">{t('infrastructure.step1', '1. Install Azure Developer CLI (azd)')}</p>
                <div className="bg-gray-900 rounded-lg p-3">
                  <code className="text-xs text-green-400 font-mono">curl -fsSL https://aka.ms/install-azd.sh | bash</code>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">{t('infrastructure.step2', '2. Download and extract the templates')}</p>
                <button
                  onClick={handleDownload}
                  disabled={!config.generatedBicepMain}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-xs font-medium transition-colors"
                >
                  {t('infrastructure.downloadZip', 'Download ZIP')}
                </button>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">{t('infrastructure.step3', '3. Initialize and deploy')}</p>
                <div className="bg-gray-900 rounded-lg p-3 space-y-1">
                  <div><code className="text-xs text-green-400 font-mono">azd auth login</code></div>
                  <div><code className="text-xs text-green-400 font-mono">azd init</code></div>
                  <div><code className="text-xs text-green-400 font-mono">azd up</code></div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">{t('infrastructure.stepAlt', 'Alternative: Deploy with Azure CLI')}</p>
                <div className="bg-gray-900 rounded-lg p-3 space-y-1">
                  <div><code className="text-xs text-green-400 font-mono">az login</code></div>
                  <div><code className="text-xs text-green-400 font-mono">az group create --name myResourceGroup --location koreacentral</code></div>
                  <div><code className="text-xs text-green-400 font-mono">az deployment group create --resource-group myResourceGroup --template-file main.bicep --parameters main.bicepparam</code></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
