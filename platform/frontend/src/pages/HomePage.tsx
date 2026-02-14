import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { createRequest, analyzeRequest, generateProposal, approveProposal, startBuild, exportZip, exportToGitHub, getVersions, rollbackToVersion, getTemplates, getGitHubStatus, syncToGitHub, InsufficientTokensError, generateSubtasks, approveSubtask, rejectSubtask, approveAllSubtasks } from '../api/requests'
import { createSite, getSiteDetail } from '../api/sites'
import type { SiteResponse } from '../api/sites'
import type { DevRequestResponse, AnalysisResponse, ProposalResponse, ProductionResponse, GitHubExportResponse, ProjectVersion, ProjectTemplate, GitHubSyncStatus, SubTaskDto } from '../api/requests'
import { checkTokens, getPricingPlans } from '../api/settings'
import type { TokenCheck, PricingPlanData } from '../api/settings'
import { useAuth } from '../contexts/AuthContext'
import { detectCurrency, formatCurrency as formatCurrencyUtil } from '../utils/currency'
import PlanSelectionDialog from '../components/PlanSelectionDialog'
import RefinementChat from '../components/RefinementChat'
import HeroSection from '../components/HeroSection'
import StatsSection from '../components/StatsSection'
import FeaturesSection from '../components/FeaturesSection'
import PricingSection from '../components/PricingSection'
import TemplatesSection from '../components/TemplatesSection'
import StepIndicator from '../components/StepIndicator'
import LivePreview from '../components/LivePreview'
import MobilePreview from '../components/MobilePreview'
import ValidationProgress from '../components/ValidationProgress'
import FixHistoryDisplay from '../components/FixHistoryDisplay'
import CostSavingsDisplay from '../components/CostSavingsDisplay'
import QualityConfidenceBadge from '../components/QualityConfidenceBadge'
import PowerLevelSelector from '../components/PowerLevelSelector'
import type { PowerLevel } from '../components/PowerLevelSelector'
import ModelQuickSelector from '../components/ModelQuickSelector'
import CreditEstimateCard from '../components/CreditEstimateCard'
import CreditEstimatePreview from '../components/CreditEstimatePreview'

type ViewState = 'form' | 'submitting' | 'analyzing' | 'analyzed' | 'generatingProposal' | 'proposal' | 'approving' | 'building' | 'verifying' | 'completed' | 'error'

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { setTokenBalance, requireAuth } = useAuth()

  const [request, setRequest] = useState('')
  const [email, setEmail] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [framework, setFramework] = useState('')
  const [selectedModel, setSelectedModel] = useState('claude:claude-sonnet-4-5-20250929')
  const [powerLevel, setPowerLevel] = useState<PowerLevel>('standard')
  const [viewState, setViewState] = useState<ViewState>('form')
  const [submittedRequest, setSubmittedRequest] = useState<DevRequestResponse | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [proposalResult, setProposalResult] = useState<ProposalResponse | null>(null)
  const [subtasks, setSubtasks] = useState<SubTaskDto[]>([])
  const [subtasksLoading, setSubtasksLoading] = useState(false)
  const [productionResult, setProductionResult] = useState<ProductionResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [insufficientDialog, setInsufficientDialog] = useState<{ required: number; balance: number; shortfall: number; action: string } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ action: string; tokenCheck: TokenCheck; onConfirm: () => void } | null>(null)
  const [showPlanSelection, setShowPlanSelection] = useState(false)
  const [pricingPlans, setPricingPlans] = useState<PricingPlanData[]>([])
  const [exportingZip, setExportingZip] = useState(false)
  const [githubDialog, setGithubDialog] = useState(false)
  const [githubToken, setGithubToken] = useState('')
  const [githubRepoName, setGithubRepoName] = useState('')
  const [exportingGithub, setExportingGithub] = useState(false)
  const [githubResult, setGithubResult] = useState<GitHubExportResponse | null>(null)
  const [deployStatus, setDeployStatus] = useState<SiteResponse | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [versions, setVersions] = useState<ProjectVersion[]>([])
  const [rollingBack, setRollingBack] = useState(false)
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [githubSync, setGithubSync] = useState<GitHubSyncStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const deployPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    }
  }, [location.hash])

  useEffect(() => {
    const loadPricingPlans = async () => {
      try {
        const plans = await getPricingPlans()
        setPricingPlans(plans)
      } catch {
        // Use empty array; PricingSection has built-in fallback plans
        setPricingPlans([])
      }
    }

    const loadTemplates = async () => {
      setLoadingTemplates(true)
      try {
        const data = await getTemplates()
        setTemplates(data)
      } catch {
        // Use empty array; template section is hidden when empty
        setTemplates([])
      } finally {
        setLoadingTemplates(false)
      }
    }

    loadPricingPlans()
    loadTemplates()
  }, [])

  const handleScreenshotSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return // 5MB limit
    setScreenshotFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setScreenshotPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleScreenshotRemove = useCallback(() => {
    setScreenshotFile(null)
    setScreenshotPreview(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleScreenshotSelect(file)
  }, [handleScreenshotSelect])

  const handleExportZip = async () => {
    if (!submittedRequest) return
    setExportingZip(true)
    try {
      const blob = await exportZip(submittedRequest.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${productionResult?.production.projectName || 'project'}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export ZIP:', err)
      setErrorMessage(err instanceof Error ? err.message : t('export.zipFailed'))
    } finally {
      setExportingZip(false)
    }
  }

  const handleExportGitHub = async () => {
    if (!submittedRequest || !githubToken.trim()) return
    setExportingGithub(true)
    try {
      const result = await exportToGitHub(submittedRequest.id, githubToken, githubRepoName || undefined)
      setGithubResult(result)
      setGithubSync({ linked: true, repoUrl: result.repoUrl, repoFullName: result.repoFullName })
      setGithubDialog(false)
      setGithubToken('')
      setGithubRepoName('')
    } catch (err) {
      console.error('Failed to export to GitHub:', err)
      setErrorMessage(err instanceof Error ? err.message : t('export.githubFailed'))
    } finally {
      setExportingGithub(false)
    }
  }

  const handleRollback = async (versionId: string) => {
    if (!submittedRequest) return
    setRollingBack(true)
    try {
      const result = await rollbackToVersion(submittedRequest.id, versionId)
      setVersions(prev => [result, ...prev])
    } catch (err) {
      console.error('Rollback failed:', err)
      setErrorMessage(err instanceof Error ? err.message : t('version.rollbackFailed'))
    } finally {
      setRollingBack(false)
    }
  }

  const handleGitHubSync = async () => {
    if (!submittedRequest || !githubSync?.linked) return
    const token = prompt(t('githubSync.tokenPrompt'))
    if (!token?.trim()) return
    setSyncing(true)
    try {
      await syncToGitHub(submittedRequest.id, token)
    } catch (err) {
      console.error('GitHub sync failed:', err)
      setErrorMessage(err instanceof Error ? err.message : t('githubSync.failed'))
    } finally {
      setSyncing(false)
    }
  }

  const handleDeploy = async () => {
    if (!submittedRequest || !productionResult) return
    setDeploying(true)
    try {
      const site = await createSite(submittedRequest.id, productionResult.production.projectName)
      setDeployStatus(site)

      // Poll for deploy status updates
      deployPollRef.current = setInterval(async () => {
        try {
          const detail = await getSiteDetail(site.id)
          setDeployStatus(detail)
          if (detail.status === 'Running' || detail.status === 'Failed') {
            if (deployPollRef.current) clearInterval(deployPollRef.current)
            deployPollRef.current = null
            setDeploying(false)
          }
        } catch {
          // ignore polling errors
        }
      }, 3000)
    } catch (err) {
      console.error('Failed to deploy:', err)
      setErrorMessage(err instanceof Error ? err.message : t('deploy.failed'))
      setDeploying(false)
    }
  }

  // Close dialogs on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDialog) setConfirmDialog(null)
        else if (githubDialog) { setGithubDialog(false); setGithubToken(''); setGithubRepoName('') }
        else if (insufficientDialog) setInsufficientDialog(null)
      }
    }
    if (confirmDialog || githubDialog || insufficientDialog) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [confirmDialog, githubDialog, insufficientDialog])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (deployPollRef.current) clearInterval(deployPollRef.current)
    }
  }, [])

  const handleReset = () => {
    setRequest('')
    setEmail('')
    setScreenshotFile(null)
    setScreenshotPreview(null)
    setPowerLevel('standard')
    setViewState('form')
    setSubmittedRequest(null)
    setAnalysisResult(null)
    setProposalResult(null)
    setProductionResult(null)
    setErrorMessage('')
    setGithubResult(null)
    setDeployStatus(null)
    if (deployPollRef.current) clearInterval(deployPollRef.current)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!request.trim()) return
    if (!requireAuth()) return

    setViewState('submitting')
    setErrorMessage('')

    try {
      let screenshotBase64: string | undefined
      let screenshotMediaType: string | undefined

      if (screenshotFile && screenshotPreview) {
        // Extract base64 data from data URL (remove "data:image/png;base64," prefix)
        const dataUrl = screenshotPreview
        const commaIndex = dataUrl.indexOf(',')
        screenshotBase64 = dataUrl.substring(commaIndex + 1)
        screenshotMediaType = screenshotFile.type
      }

      const result = await createRequest({
        description: request,
        contactEmail: email || undefined,
        screenshotBase64,
        screenshotMediaType,
        framework: framework || undefined,
        powerLevel: powerLevel || undefined,
        preferredModel: selectedModel || undefined,
      })
      setSubmittedRequest(result)

      setViewState('analyzing')
      const analysis = await analyzeRequest(result.id)
      setAnalysisResult(analysis)
      if (analysis.newBalance != null) setTokenBalance(analysis.newBalance)
      setViewState('analyzed')
    } catch (error) {
      if (error instanceof InsufficientTokensError) {
        setInsufficientDialog(error)
        setViewState('form')
        return
      }
      console.error('Failed to process request:', error)
      setErrorMessage(error instanceof Error ? error.message : t('error.requestFailed'))
      setViewState('error')
    }
  }

  const handleGenerateProposal = async () => {
    if (!submittedRequest) return

    try {
      const check = await checkTokens('proposal')
      if (!check.hasEnough) {
        setInsufficientDialog({ required: check.tokenCost, balance: check.currentBalance, shortfall: check.shortfall, action: 'proposal' })
        return
      }
      setConfirmDialog({
        action: 'proposal',
        tokenCheck: check,
        onConfirm: async () => {
          setConfirmDialog(null)
          setViewState('generatingProposal')
          try {
            const proposal = await generateProposal(submittedRequest.id)
            setProposalResult(proposal)
            if (proposal.newBalance != null) setTokenBalance(proposal.newBalance)
            setViewState('proposal')
          } catch (err) {
            if (err instanceof InsufficientTokensError) {
              setInsufficientDialog(err)
              setViewState('analyzed')
              return
            }
            console.error('Failed to generate proposal:', err)
            setErrorMessage(err instanceof Error ? err.message : t('error.proposalFailed'))
            setViewState('error')
          }
        }
      })
    } catch {
      setViewState('generatingProposal')
      try {
        const proposal = await generateProposal(submittedRequest.id)
        setProposalResult(proposal)
        if (proposal.newBalance != null) setTokenBalance(proposal.newBalance)
        setViewState('proposal')
      } catch (err) {
        console.error('Failed to generate proposal:', err)
        setErrorMessage(err instanceof Error ? err.message : t('error.proposalFailed'))
        setViewState('error')
      }
    }
  }

  const executeBuild = async () => {
    if (!submittedRequest) return
    setViewState('approving')
    try {
      await approveProposal(submittedRequest.id)
      setViewState('building')
      const production = await startBuild(submittedRequest.id)
      setProductionResult(production)
      if (production.newBalance != null) setTokenBalance(production.newBalance)
      if (production.production.verificationScore != null) {
        setViewState('verifying')
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      setViewState('completed')

      // Fetch version history and GitHub sync status
      if (submittedRequest) {
        getVersions(submittedRequest.id).then(setVersions).catch(() => {})
        getGitHubStatus(submittedRequest.id).then(setGithubSync).catch(() => {})
      }
    } catch (err) {
      if (err instanceof InsufficientTokensError) {
        setInsufficientDialog(err)
        setViewState('proposal')
        return
      }
      console.error('Failed to build:', err)
      setErrorMessage(err instanceof Error ? err.message : t('error.buildFailed'))
      setViewState('error')
    }
  }

  const handlePlanSelected = (_planId: number) => {
    setShowPlanSelection(false)
    executeBuild()
  }

  const handleGenerateSubtasks = async () => {
    if (!submittedRequest) return
    setSubtasksLoading(true)
    try {
      const result = await generateSubtasks(submittedRequest.id)
      setSubtasks(result)
    } catch (err) {
      console.error('Failed to generate subtasks:', err)
    } finally {
      setSubtasksLoading(false)
    }
  }

  const handleApproveSubtask = async (subtaskId: string) => {
    if (!submittedRequest) return
    try {
      const updated = await approveSubtask(submittedRequest.id, subtaskId)
      setSubtasks(prev => prev.map(s => s.id === subtaskId ? updated : s))
    } catch (err) {
      console.error('Failed to approve subtask:', err)
    }
  }

  const handleRejectSubtask = async (subtaskId: string) => {
    if (!submittedRequest) return
    try {
      const updated = await rejectSubtask(submittedRequest.id, subtaskId)
      setSubtasks(prev => prev.map(s => s.id === subtaskId ? updated : s))
    } catch (err) {
      console.error('Failed to reject subtask:', err)
    }
  }

  const handleApproveAllSubtasks = async () => {
    if (!submittedRequest) return
    try {
      const result = await approveAllSubtasks(submittedRequest.id)
      setSubtasks(result)
    } catch (err) {
      console.error('Failed to approve all subtasks:', err)
    }
  }

  const allSubtasksApproved = subtasks.length > 0 && subtasks.every(s => s.status === 'Approved' || s.status === 'Rejected')
  const hasSubtasks = subtasks.length > 0

  const handleApproveAndBuild = async () => {
    if (!submittedRequest) return

    try {
      const check = await checkTokens('build')
      if (!check.hasEnough) {
        setInsufficientDialog({ required: check.tokenCost, balance: check.currentBalance, shortfall: check.shortfall, action: 'build' })
        return
      }
      setConfirmDialog({
        action: 'build',
        tokenCheck: check,
        onConfirm: () => {
          setConfirmDialog(null)
          setShowPlanSelection(true)
        }
      })
    } catch {
      setShowPlanSelection(true)
    }
  }

  const detectedCurrency = useMemo(() => detectCurrency(i18n.language), [i18n.language])

  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, detectedCurrency)
  }

  const exampleRequests = [
    t('form.example.shopping'),
    t('form.example.automation'),
    t('form.example.dashboard'),
    t('form.example.chatbot'),
  ]

  const getComplexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'simple': return 'bg-green-600'
      case 'medium': return 'bg-yellow-600'
      case 'complex': return 'bg-orange-600'
      case 'enterprise': return 'bg-red-600'
      default: return 'bg-warm-600'
    }
  }

  const getComplexityLabel = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'simple': return t('complexity.simple')
      case 'medium': return t('complexity.medium')
      case 'complex': return t('complexity.complex')
      case 'enterprise': return t('complexity.enterprise')
      default: return complexity
    }
  }

  return (
    <>
      {viewState === 'form' && (
        <HeroSection onScrollToForm={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })} />
      )}

      <section ref={formRef} className="glass-card rounded-2xl p-8 shadow-premium-xl">
        <StepIndicator viewState={viewState} />
        {viewState === 'form' && (
          <form onSubmit={handleSubmit}>
            {templates.length > 0 && !loadingTemplates && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-warm-400">{t('template.title')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {templates.map((tpl) => (
                    <button key={tpl.id} type="button"
                      onClick={() => {
                        setRequest(tpl.promptTemplate)
                        if (tpl.framework) setFramework(tpl.framework)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setRequest(tpl.promptTemplate)
                          if (tpl.framework) setFramework(tpl.framework)
                        }
                      }}
                      aria-label={`Select template: ${tpl.name}`}
                      className="text-left p-4 glass-card rounded-xl transition-all group hover:ring-2 hover:ring-accent-blue/50 focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:outline-none">
                      <div className="font-medium text-sm group-hover:text-accent-blue group-focus-visible:text-accent-blue transition-colors">{tpl.name}</div>
                      <div className="text-xs text-warm-500 mt-1 line-clamp-2">{tpl.description}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="px-1.5 py-0.5 bg-accent-blue/20 text-accent-blue rounded text-[10px]">{tpl.framework}</span>
                        {tpl.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 bg-warm-800/80 text-warm-400 rounded text-[10px]">{tag}</span>
                        ))}
                      </div>
                      {tpl.usageCount > 0 && (
                        <div className="text-[10px] text-warm-600 mt-2">{t('template.used', { count: tpl.usageCount })}</div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-warm-500">{t('template.hint')}</p>
              </div>
            )}
            <label className="block text-lg font-medium mb-4">{t('form.label')}</label>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder={t('form.placeholder')}
              className="w-full h-40 p-5 bg-warm-950/80 border border-warm-700/50 rounded-2xl text-warm-100 placeholder-warm-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue/30 resize-none transition-all font-sans text-base leading-relaxed"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {exampleRequests.map((example) => (
                <button key={example} type="button" onClick={() => setRequest(example)}
                  className="px-4 py-1.5 bg-warm-800/80 hover:bg-warm-700 border border-warm-700/30 rounded-full text-sm text-warm-300 transition-all hover:text-white hover:border-warm-600/50">
                  {example}
                </button>
              ))}
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2 text-warm-400">{t('form.emailLabel')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full p-3 bg-warm-950/80 border border-warm-700/50 rounded-xl text-warm-100 placeholder-warm-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue/30 transition-all" />
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2 text-warm-400">{t('screenshot.label')}</label>
              {screenshotPreview ? (
                <div className="relative inline-block">
                  <img src={screenshotPreview} alt={screenshotFile?.name ? `Uploaded screenshot: ${screenshotFile.name}` : 'Screenshot preview'} className="max-h-48 rounded-xl border border-warm-700" />
                  <button type="button" onClick={handleScreenshotRemove}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 rounded-full text-xs flex items-center justify-center transition-colors"
                    aria-label={t('screenshot.remove', 'Remove screenshot')}>
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('screenshot-input')?.click()}
                  className={`w-full p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                    isDragging ? 'border-accent-blue bg-accent-blue/10' : 'border-warm-700/50 hover:border-warm-500/50 hover:bg-warm-900/50'
                  }`}
                >
                  <div className="text-warm-400 text-sm">
                    <div className="text-2xl mb-2">📸</div>
                    {t('screenshot.dropzone')}
                  </div>
                  <input id="screenshot-input" type="file" accept="image/*" className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleScreenshotSelect(e.target.files[0]) }} />
                </div>
              )}
              <p className="mt-1 text-xs text-warm-500">{t('screenshot.hint')}</p>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2 text-warm-400">{t('framework.label')}</label>
              <div className="flex flex-wrap gap-2 mb-2">
                <button type="button" onClick={() => setFramework('')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    framework === '' ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-glow-blue' : 'bg-warm-800/80 text-warm-300 hover:bg-warm-700 border border-warm-700/30'
                  }`}>
                  {t('framework.auto')}
                </button>
              </div>
              <div className="text-xs text-warm-500 mb-1">{t('framework.web')}</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { value: 'react', label: 'React' },
                  { value: 'vue', label: 'Vue' },
                  { value: 'svelte', label: 'Svelte' },
                  { value: 'nextjs', label: 'Next.js' },
                  { value: 'nuxt', label: 'Nuxt' },
                  { value: 'angular', label: 'Angular' },
                ].map((fw) => (
                  <button key={fw.value} type="button" onClick={() => setFramework(fw.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      framework === fw.value ? 'bg-accent-blue text-white' : 'bg-warm-800/80 text-warm-300 hover:bg-warm-700 border border-warm-700/30'
                    }`}>
                    {fw.label}
                  </button>
                ))}
              </div>
              <div className="text-xs text-warm-500 mb-1">{t('framework.mobile')}</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'flutter', label: 'Flutter' },
                  { value: 'react-native', label: 'React Native' },
                ].map((fw) => (
                  <button key={fw.value} type="button" onClick={() => setFramework(fw.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      framework === fw.value ? 'bg-accent-purple text-white' : 'bg-warm-800/80 text-warm-300 hover:bg-warm-700 border border-warm-700/30'
                    }`}>
                    {fw.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-warm-500">{t('framework.hint')}</p>
            </div>
            <ModelQuickSelector value={selectedModel} onChange={setSelectedModel} />
            <PowerLevelSelector value={powerLevel} onChange={setPowerLevel} />
            <CreditEstimatePreview />
            <button type="submit" disabled={!request.trim()}
              className="mt-6 w-full py-4 bg-gradient-to-r from-accent-blue to-accent-purple hover:shadow-glow-blue disabled:from-warm-700 disabled:to-warm-700 disabled:cursor-not-allowed rounded-2xl font-semibold text-lg transition-all btn-premium">
              {t('form.submit')}
            </button>
          </form>
        )}

        {viewState === 'submitting' && (
          <div className="text-center py-12" aria-live="polite">
            <div className="animate-spin w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full mx-auto mb-6" role="status" aria-label={t('status.submitting')}></div>
            <h3 className="text-2xl font-bold mb-2">{t('status.submitting')}</h3>
          </div>
        )}

        {viewState === 'analyzing' && (
          <div className="text-center py-12" aria-live="polite">
            <div className="animate-pulse"><div className="text-6xl mb-6">🤖</div></div>
            <h3 className="text-2xl font-bold mb-2">{t('status.analyzing')}</h3>
            <p className="text-warm-400">{t('status.analyzingDetail')}</p>
          </div>
        )}

        {viewState === 'analyzed' && analysisResult && (
          <div className="py-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">✅</div>
              <div>
                <h3 className="text-2xl font-bold">{t('status.analyzed')}</h3>
                <p className="text-warm-400">{analysisResult.summary}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-warm-900 rounded-xl p-4 text-center">
                <div className="text-warm-400 text-sm mb-1">{t('analysis.category')}</div>
                <div className="font-bold">{analysisResult.category}</div>
                {analysisResult.platform && analysisResult.platform !== 'web' && (
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      analysisResult.platform === 'mobile' ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white'
                    }`}>
                      {analysisResult.platform === 'mobile' ? t('analysis.platformMobile') : t('analysis.platformFullstack')}
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-warm-900 rounded-xl p-4 text-center">
                <div className="text-warm-400 text-sm mb-1">{t('analysis.complexity')}</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm ${getComplexityColor(analysisResult.complexity)}`}>
                  {getComplexityLabel(analysisResult.complexity)}
                </div>
              </div>
              <div className="bg-warm-900 rounded-xl p-4 text-center">
                <div className="text-warm-400 text-sm mb-1">{t('analysis.estimatedDuration')}</div>
                <div className="font-bold">{t('analysis.days', { count: analysisResult.estimatedDays })}</div>
              </div>
              <div className="bg-warm-900 rounded-xl p-4 text-center">
                <div className="text-warm-400 text-sm mb-1">{t('analysis.feasibility')}</div>
                <div className="font-bold">{Math.round(analysisResult.feasibility.score * 100)}%</div>
              </div>
            </div>

            {analysisResult.tokensUsed != null && (
              <div className="bg-warm-900/50 rounded-lg p-3 mb-4 text-sm text-warm-400 text-center">
                {t('tokens.used', { count: analysisResult.tokensUsed })} &bull; {t('tokens.remaining', { count: analysisResult.newBalance ?? 0 })}
              </div>
            )}

            <CreditEstimateCard
              complexity={analysisResult.complexity}
              analysisTokensUsed={analysisResult.tokensUsed}
              completedSteps={['analysis']}
            />

            <div className="flex gap-4">
              <button onClick={handleReset}
                className="flex-1 py-3 bg-warm-800 hover:bg-warm-700 rounded-xl font-medium transition-colors">
                {t('button.newRequest')}
              </button>
              <button onClick={handleGenerateProposal}
                className="flex-1 py-3 bg-accent-blue hover:bg-accent-blue/90 rounded-xl font-medium transition-colors">
                {t('button.getProposal')}
              </button>
            </div>
          </div>
        )}

        {viewState === 'generatingProposal' && (
          <div className="text-center py-12" aria-live="polite">
            <div className="animate-pulse"><div className="text-6xl mb-6">📝</div></div>
            <h3 className="text-2xl font-bold mb-2">{t('status.generatingProposal')}</h3>
            <p className="text-warm-400">{t('status.generatingProposalDetail')}</p>
          </div>
        )}

        {viewState === 'proposal' && proposalResult && (
          <div className="py-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">📋</div>
              <div>
                <h3 className="text-2xl font-bold">{proposalResult.proposal.title}</h3>
                <p className="text-warm-400">{proposalResult.proposal.summary}</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-accent-blue/20 to-accent-purple/10 border border-accent-blue/20 rounded-2xl p-6 mb-6">
              <h4 className="font-bold mb-4 text-lg">{t('proposal.estimate')}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-warm-300 text-sm">{t('proposal.developmentCost')}</div>
                  <div className="text-3xl font-bold">{formatCurrency(proposalResult.proposal.pricing.development.amount)}</div>
                </div>
                <div>
                  <div className="text-warm-300 text-sm">{t('proposal.monthlyCost')}</div>
                  <div className="text-2xl font-bold">{formatCurrency(proposalResult.proposal.pricing.monthly.total)}</div>
                </div>
              </div>
              {proposalResult.proposal.pricing.development.breakdown.length > 0 && (
                <div className="mt-4 pt-4 border-t border-accent-blue/30">
                  <div className="text-sm text-warm-300 mb-2">{t('proposal.breakdown')}</div>
                  {proposalResult.proposal.pricing.development.breakdown.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.item}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {analysisResult && (
              <CreditEstimateCard
                complexity={analysisResult.complexity}
                analysisTokensUsed={analysisResult.tokensUsed}
                proposalTokensUsed={proposalResult.tokensUsed}
                completedSteps={['analysis', 'proposal']}
              />
            )}

            <div className="bg-warm-900 rounded-xl p-4 mb-4">
              <h4 className="font-bold mb-3">{t('proposal.timelineTotal', { days: proposalResult.proposal.timeline.totalDays })}</h4>
              <div className="space-y-2">
                {proposalResult.proposal.milestones.map((milestone, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-purple rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {milestone.phase}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{milestone.name}</div>
                      <div className="text-warm-400 text-sm">{milestone.description}</div>
                      <div className="text-accent-blue text-sm">{t('proposal.durationDays', { count: milestone.durationDays })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtasks Section */}
            <div className="bg-warm-900 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold">{t('subtasks.title')}</h4>
                {!hasSubtasks && (
                  <button
                    onClick={handleGenerateSubtasks}
                    disabled={subtasksLoading}
                    className="px-3 py-1.5 bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {subtasksLoading ? t('subtasks.generating') : t('subtasks.generate')}
                  </button>
                )}
                {hasSubtasks && !allSubtasksApproved && (
                  <button
                    onClick={handleApproveAllSubtasks}
                    className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    {t('subtasks.approveAll')}
                  </button>
                )}
              </div>
              {!hasSubtasks && !subtasksLoading && (
                <p className="text-warm-400 text-sm">{t('subtasks.description')}</p>
              )}
              {subtasksLoading && (
                <div className="text-center py-4">
                  <div className="animate-pulse text-warm-400">{t('subtasks.generating')}</div>
                </div>
              )}
              {hasSubtasks && (
                <div className="space-y-2">
                  {subtasks.map((subtask, i) => (
                    <div key={subtask.id} className="flex items-start gap-3 bg-warm-800 rounded-lg p-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          backgroundColor: subtask.status === 'Approved' ? 'rgba(34, 197, 94, 0.2)' :
                            subtask.status === 'Rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                          color: subtask.status === 'Approved' ? '#22c55e' :
                            subtask.status === 'Rejected' ? '#ef4444' : '#9ca3af'
                        }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{subtask.title}</div>
                        {subtask.description && (
                          <div className="text-warm-400 text-xs mt-0.5 line-clamp-2">{subtask.description}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            subtask.status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                            subtask.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-warm-700 text-warm-400'
                          }`}>
                            {t(`subtasks.status.${subtask.status.toLowerCase()}`)}
                          </span>
                          {subtask.estimatedCredits && (
                            <span className="text-xs text-warm-500">{subtask.estimatedCredits} {t('subtasks.credits')}</span>
                          )}
                          {subtask.dependsOnSubTaskId && (
                            <span className="text-xs text-warm-500">{t('subtasks.dependsOn', { order: subtasks.findIndex(s => s.id === subtask.dependsOnSubTaskId) + 1 })}</span>
                          )}
                        </div>
                      </div>
                      {subtask.status === 'Pending' && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleApproveSubtask(subtask.id)}
                            className="p-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-md transition-colors"
                            title={t('subtasks.approve')}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button
                            onClick={() => handleRejectSubtask(subtask.id)}
                            className="p-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-md transition-colors"
                            title={t('subtasks.reject')}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-warm-900 rounded-xl p-4 mb-4">
              <h4 className="font-bold mb-3">{t('proposal.includedScope')}</h4>
              <ul className="list-disc list-inside text-warm-300 space-y-1">
                {proposalResult.proposal.scope.included.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              {proposalResult.proposal.scope.excluded.length > 0 && (
                <>
                  <h4 className="font-bold mt-4 mb-2 text-orange-400">{t('proposal.excludedScope')}</h4>
                  <ul className="list-disc list-inside text-warm-400 space-y-1">
                    {proposalResult.proposal.scope.excluded.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="bg-warm-900 rounded-xl p-4 mb-6">
              <h4 className="font-bold mb-3">{t('proposal.terms')}</h4>
              <div className="space-y-2 text-sm">
                <div><span className="text-warm-400">{t('proposal.termsPayment')}</span> {proposalResult.proposal.terms.payment}</div>
                <div><span className="text-warm-400">{t('proposal.termsWarranty')}</span> {proposalResult.proposal.terms.warranty}</div>
                <div><span className="text-warm-400">{t('proposal.termsSupport')}</span> {proposalResult.proposal.terms.support}</div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={handleReset}
                className="flex-1 py-3 bg-warm-800 hover:bg-warm-700 rounded-xl font-medium transition-colors">
                {t('button.newRequest')}
              </button>
              <button onClick={handleApproveAndBuild}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-medium transition-colors">
                {t('button.approveAndBuild')}
              </button>
            </div>
          </div>
        )}

        {viewState === 'approving' && (
          <div className="text-center py-12" aria-live="polite">
            <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-6" role="status" aria-label={t('status.approving')}></div>
            <h3 className="text-2xl font-bold mb-2">{t('status.approving')}</h3>
          </div>
        )}

        {viewState === 'building' && (
          <div className="text-center py-12" aria-live="polite">
            <div className="animate-pulse"><div className="text-6xl mb-6">🔨</div></div>
            <h3 className="text-2xl font-bold mb-2">{t('status.building')}</h3>
            <p className="text-warm-400">{t('status.buildingDetail')}</p>
            {analysisResult && ['complex', 'enterprise'].includes(analysisResult.complexity.toLowerCase()) && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-900/40 border border-purple-700/50 rounded-full">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping" />
                <span className="text-sm text-purple-300 font-medium">{t('status.extendedThinking')}</span>
              </div>
            )}
            <div className="mt-6 mb-4 flex justify-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <div className="mt-4 max-w-md mx-auto text-left">
              <ValidationProgress
                iterations={0}
                maxIterations={3}
                currentPhase="validating"
                passed={false}
              />
            </div>
          </div>
        )}

        {viewState === 'verifying' && (
          <div className="text-center py-12" aria-live="polite">
            <div className="animate-pulse"><div className="text-6xl mb-6">🔍</div></div>
            <h3 className="text-2xl font-bold mb-2">{t('status.verifying')}</h3>
            <p className="text-warm-400">{t('status.verifyingDetail')}</p>
            <div className="mt-6 mb-4 flex justify-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <div className="mt-4 max-w-md mx-auto text-left">
              <ValidationProgress
                iterations={productionResult?.production.validationIterations ?? 1}
                maxIterations={3}
                currentPhase={productionResult?.production.fixHistory?.length ? 'fixing' : 'validating'}
                passed={false}
              />
            </div>
          </div>
        )}

        {viewState === 'completed' && productionResult && (
          <div className="py-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">🎉</div>
              <div>
                <h3 className="text-2xl font-bold">{t('status.completed')}</h3>
                <p className="text-warm-400">{productionResult.production.message}</p>
              </div>
            </div>

            <div className="bg-green-900/30 border border-green-700 rounded-xl p-6 mb-6">
              <h4 className="font-bold mb-4 text-green-400">{t('completed.projectInfo')}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-warm-400">{t('completed.projectId')}</div>
                  <div className="font-mono">{productionResult.production.projectId}</div>
                </div>
                <div>
                  <div className="text-warm-400">{t('completed.projectType')}</div>
                  <div>{productionResult.production.projectType}</div>
                </div>
                <div>
                  <div className="text-warm-400">{t('completed.filesGenerated')}</div>
                  <div>{t('completed.filesCount', { count: productionResult.production.filesGenerated })}</div>
                </div>
                <div>
                  <div className="text-warm-400">{t('completed.projectStatus')}</div>
                  <div className="text-green-400">{productionResult.production.status}</div>
                </div>
              </div>
            </div>

            {productionResult.production.verificationScore != null && (
              <div className={`rounded-xl p-4 mb-4 ${
                productionResult.production.verificationPassed
                  ? 'bg-purple-900/30 border border-purple-700'
                  : 'bg-orange-900/30 border border-orange-700'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-purple-400">{t('verification.title')}</h4>
                  <div className={`text-2xl font-bold ${
                    productionResult.production.verificationScore >= 80 ? 'text-green-400' :
                    productionResult.production.verificationScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {productionResult.production.verificationScore}/100
                  </div>
                </div>
                <p className="text-sm text-warm-400">{productionResult.production.verificationSummary}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    productionResult.production.verificationPassed
                      ? 'bg-green-600 text-white'
                      : 'bg-orange-600 text-white'
                  }`}>
                    {productionResult.production.verificationPassed ? t('verification.passed') : t('verification.needsReview')}
                  </span>
                </div>
              </div>
            )}

            {productionResult.production.qualityConfidenceScore != null && (
              <div className="mb-4">
                <QualityConfidenceBadge
                  score={productionResult.production.qualityConfidenceScore}
                  dimensions={productionResult.production.qualityReviewDimensions}
                />
              </div>
            )}

            <FixHistoryDisplay
              fixHistory={productionResult.production.fixHistory}
              validationPassed={productionResult.production.validationPassed ?? true}
              iterations={productionResult.production.validationIterations ?? 1}
            />

            {submittedRequest && (
              <CostSavingsDisplay requestId={submittedRequest.id} />
            )}

            {analysisResult && (
              <CreditEstimateCard
                complexity={analysisResult.complexity}
                analysisTokensUsed={analysisResult.tokensUsed}
                proposalTokensUsed={proposalResult?.tokensUsed}
                buildTokensUsed={productionResult.tokensUsed}
                completedSteps={['analysis', 'proposal', 'build']}
              />
            )}

            {productionResult.production.accessibilityScore != null && (
              <div className={`rounded-xl p-4 mb-4 ${
                productionResult.production.accessibilityScore >= 85
                  ? 'bg-blue-900/30 border border-accent-blue/30'
                  : 'bg-yellow-900/30 border border-yellow-700'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-accent-blue">{t('accessibility.title')}</h4>
                  <div className={`text-2xl font-bold ${
                    productionResult.production.accessibilityScore >= 85 ? 'text-green-400' :
                    productionResult.production.accessibilityScore >= 70 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {productionResult.production.accessibilityScore}/100
                  </div>
                </div>
                <p className="text-sm text-warm-400">{productionResult.production.accessibilitySummary}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    productionResult.production.accessibilityScore >= 85
                      ? 'bg-green-600 text-white'
                      : 'bg-yellow-600 text-white'
                  }`}>
                    {productionResult.production.accessibilityScore >= 85 ? t('accessibility.passed') : t('accessibility.needsWork')}
                  </span>
                  {(productionResult.production.accessibilityIssueCount ?? 0) > 0 && (
                    <span className="text-xs text-warm-400">
                      {t('accessibility.issuesFound', { count: productionResult.production.accessibilityIssueCount })}
                    </span>
                  )}
                </div>
              </div>
            )}

            {productionResult.production.testFilesGenerated != null && productionResult.production.testFilesGenerated > 0 && (
              <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-purple-400">{t('tests.title')}</h4>
                  <div className={`text-2xl font-bold ${
                    (productionResult.production.testCoverageEstimate ?? 0) >= 80 ? 'text-green-400' :
                    (productionResult.production.testCoverageEstimate ?? 0) >= 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {productionResult.production.testCoverageEstimate ?? 0}%
                  </div>
                </div>
                <p className="text-sm text-warm-400">{productionResult.production.testSummary}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-warm-400">
                  <span>{t('tests.files', { count: productionResult.production.testFilesGenerated })}</span>
                  <span>{t('tests.cases', { count: productionResult.production.totalTestCount ?? 0 })}</span>
                  {productionResult.production.testFramework && (
                    <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-medium">
                      {productionResult.production.testFramework}
                    </span>
                  )}
                </div>
              </div>
            )}

            {productionResult.production.codeReviewScore != null && (
              <div className="bg-warm-900 border border-warm-700 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-cyan-400">{t('codeReview.title')}</h4>
                  <div className={`text-2xl font-bold ${
                    (productionResult.production.codeReviewScore ?? 0) >= 85 ? 'text-green-400' :
                    (productionResult.production.codeReviewScore ?? 0) >= 70 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {productionResult.production.codeReviewScore}/100
                  </div>
                </div>
                <p className="text-sm text-warm-400 mb-3">{productionResult.production.codeReviewSummary}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-warm-800 rounded-lg p-2">
                    <div className="text-xs text-warm-500">{t('codeReview.security')}</div>
                    <div className={`text-lg font-bold ${
                      (productionResult.production.securityScore ?? 0) >= 85 ? 'text-green-400' :
                      (productionResult.production.securityScore ?? 0) >= 70 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{productionResult.production.securityScore}</div>
                  </div>
                  <div className="bg-warm-800 rounded-lg p-2">
                    <div className="text-xs text-warm-500">{t('codeReview.performance')}</div>
                    <div className={`text-lg font-bold ${
                      (productionResult.production.performanceScore ?? 0) >= 85 ? 'text-green-400' :
                      (productionResult.production.performanceScore ?? 0) >= 70 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{productionResult.production.performanceScore}</div>
                  </div>
                  <div className="bg-warm-800 rounded-lg p-2">
                    <div className="text-xs text-warm-500">{t('codeReview.quality')}</div>
                    <div className={`text-lg font-bold ${
                      (productionResult.production.codeQualityScore ?? 0) >= 85 ? 'text-green-400' :
                      (productionResult.production.codeQualityScore ?? 0) >= 70 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{productionResult.production.codeQualityScore}</div>
                  </div>
                </div>
                {(productionResult.production.codeReviewIssueCount ?? 0) > 0 && (
                  <p className="text-xs text-warm-400 mt-2">
                    {t('codeReview.issuesFound', { count: productionResult.production.codeReviewIssueCount })}
                  </p>
                )}
              </div>
            )}

            {productionResult.production.ciCdWorkflowCount != null && productionResult.production.ciCdWorkflowCount > 0 && (
              <div className="bg-indigo-900/30 border border-indigo-700 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-indigo-400">{t('cicd.title')}</h4>
                  <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-xs font-medium">
                    {productionResult.production.ciCdProvider}
                  </span>
                </div>
                <p className="text-sm text-warm-400 mb-3">{productionResult.production.ciCdSummary}</p>
                <div className="flex items-center gap-3 text-xs text-warm-400">
                  <span>{t('cicd.workflows', { count: productionResult.production.ciCdWorkflowCount })}</span>
                  {productionResult.production.ciCdRequiredSecrets && productionResult.production.ciCdRequiredSecrets.length > 0 && (
                    <span>{t('cicd.secrets', { count: productionResult.production.ciCdRequiredSecrets.length })}</span>
                  )}
                </div>
                {productionResult.production.ciCdRequiredSecrets && productionResult.production.ciCdRequiredSecrets.length > 0 && (
                  <div className="mt-3 bg-indigo-950/50 rounded-lg p-3">
                    <div className="text-xs text-indigo-300 font-medium mb-1">{t('cicd.requiredSecrets')}</div>
                    <div className="flex flex-wrap gap-1">
                      {productionResult.production.ciCdRequiredSecrets.map((secret, i) => (
                        <code key={i} className="px-2 py-0.5 bg-indigo-900 text-indigo-200 rounded text-xs">
                          {secret}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {productionResult.production.hasDatabase && (
              <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-emerald-400">{t('database.title')}</h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-xs font-medium">
                    {productionResult.production.databaseProvider}
                  </span>
                </div>
                <p className="text-sm text-warm-400 mb-3">{productionResult.production.databaseSummary}</p>
                <div className="flex items-center gap-3 text-xs text-warm-400 mb-3">
                  <span>{t('database.tables', { count: productionResult.production.databaseTableCount ?? 0 })}</span>
                  <span>{t('database.relationships', { count: productionResult.production.databaseRelationshipCount ?? 0 })}</span>
                </div>
                {productionResult.production.databaseTables && productionResult.production.databaseTables.length > 0 && (
                  <div className="bg-emerald-950/50 rounded-lg p-3">
                    <div className="text-xs text-emerald-300 font-medium mb-1">{t('database.tableList')}</div>
                    <div className="flex flex-wrap gap-1">
                      {productionResult.production.databaseTables.map((table, i) => (
                        <code key={i} className="px-2 py-0.5 bg-emerald-900 text-emerald-200 rounded text-xs">
                          {table}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {productionResult.production.setupCommands.length > 0 && (
              <div className="bg-warm-900 rounded-xl p-4 mb-4">
                <h4 className="font-bold mb-3">{t('completed.setupCommands')}</h4>
                <div className="bg-black rounded-lg p-3 font-mono text-sm overflow-x-auto">
                  {productionResult.production.setupCommands.map((cmd, i) => (
                    <div key={i} className="text-green-400">$ {cmd}</div>
                  ))}
                </div>
              </div>
            )}

            {productionResult.production.envVariables.length > 0 && (
              <div className="bg-warm-900 rounded-xl p-4 mb-6">
                <h4 className="font-bold mb-3">{t('completed.envVariables')}</h4>
                <div className="space-y-2">
                  {productionResult.production.envVariables.map((env, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <code className="bg-warm-800 px-2 py-1 rounded">{env.name}</code>
                      <span className="text-warm-400">{env.description}</span>
                      {env.required && <span className="text-red-400 text-xs">{t('completed.required')}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submittedRequest && (
              <MobilePreview
                requestId={submittedRequest.id}
                previewUrl={productionResult.production.stagingUrl}
                platform={analysisResult?.platform || productionResult.production.projectType}
              />
            )}

            {submittedRequest && (
              <div className="mb-6">
                <RefinementChat
                  requestId={submittedRequest.id}
                  onTokensUsed={(_tokensUsed, newBalance) => {
                    setTokenBalance(newBalance)
                  }}
                />
              </div>
            )}

            {deployStatus && (
              <div aria-live="polite" className={`rounded-xl p-4 mb-4 ${
                deployStatus.status === 'Running'
                  ? 'bg-green-900/30 border border-green-700'
                  : deployStatus.status === 'Failed'
                    ? 'bg-red-900/30 border border-red-700'
                    : 'bg-blue-900/30 border border-accent-blue/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-emerald-400">{t('deploy.title')}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    deployStatus.status === 'Running' ? 'bg-green-600 text-white' :
                    deployStatus.status === 'Failed' ? 'bg-red-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {t(`deploy.status.${deployStatus.status.toLowerCase()}`)}
                  </span>
                </div>
                {deploying && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                    <span className="text-sm text-warm-400">{t('deploy.inProgress')}</span>
                  </div>
                )}
                {deployStatus.status === 'Running' && deployStatus.previewUrl && (
                  <p className="text-sm text-green-300">{t('deploy.liveReady')}</p>
                )}
                {deployStatus.status === 'Failed' && (
                  <p className="text-sm text-red-400">{t('deploy.failedMessage')}</p>
                )}
              </div>
            )}

            {deployStatus?.status === 'Running' && deployStatus.previewUrl && (
              <LivePreview previewUrl={deployStatus.previewUrl} />
            )}

            {githubResult && (
              <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400 font-bold">{t('export.githubSuccess')}</span>
                </div>
                <p className="text-sm text-warm-300 mb-2">
                  {t('export.filesUploaded', { uploaded: githubResult.filesUploaded, total: githubResult.totalFiles })}
                </p>
                <a href={githubResult.repoUrl} target="_blank" rel="noopener noreferrer"
                  className="text-accent-blue hover:text-blue-300 text-sm underline">
                  {githubResult.repoFullName}
                </a>
              </div>
            )}

            {githubSync?.linked && (
              <div className="bg-warm-900 border border-warm-700 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-warm-300">{t('githubSync.title')}</h4>
                  <span className="px-2 py-0.5 rounded bg-green-600 text-white text-xs font-medium">
                    {t('githubSync.linked')}
                  </span>
                </div>
                <a href={githubSync.repoUrl} target="_blank" rel="noopener noreferrer"
                  className="text-accent-blue hover:text-blue-300 text-sm underline block mb-3">
                  {githubSync.repoFullName}
                </a>
                <button onClick={handleGitHubSync} disabled={syncing}
                  className="px-4 py-2 bg-warm-800 hover:bg-warm-700 disabled:bg-warm-800 rounded-lg text-sm font-medium transition-colors">
                  {syncing ? t('githubSync.syncing') : t('githubSync.syncNow')}
                </button>
              </div>
            )}

            {versions.length > 0 && (
              <div className="bg-warm-900 rounded-xl p-4 mb-4">
                <h4 className="font-bold mb-3">{t('version.title')}</h4>
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between bg-warm-800 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          v.source === 'rollback' ? 'bg-yellow-600 text-white'
                            : v.source === 'rebuild' ? 'bg-blue-600 text-white'
                            : 'bg-warm-600 text-warm-200'
                        }`}>v{v.versionNumber}</span>
                        <div>
                          <div className="text-sm font-medium">{v.label}</div>
                          <div className="text-xs text-warm-500">
                            {v.fileCount} {t('version.files')} · {new Date(v.createdAt).toLocaleString(i18n.language)}
                          </div>
                        </div>
                      </div>
                      {v.versionNumber < versions[0].versionNumber && (
                        <button onClick={() => handleRollback(v.id)} disabled={rollingBack}
                          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 rounded-lg text-xs font-medium transition-colors">
                          {rollingBack ? t('version.rollingBack') : t('version.rollback')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button onClick={handleReset}
                className="flex-1 min-w-[120px] py-3 bg-warm-800 hover:bg-warm-700 rounded-xl font-medium transition-colors">
                {t('button.newRequest')}
              </button>
              <button
                onClick={() => navigate(`/preview?projectId=${productionResult.production.projectId}&name=${encodeURIComponent(productionResult.production.projectName || '')}&requestId=${submittedRequest?.id || ''}`)}
                className="flex-1 min-w-[120px] py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors">
                {t('codePreview.openPreview')}
              </button>
              {!deployStatus && (
                <button onClick={handleDeploy} disabled={deploying}
                  className="flex-1 min-w-[120px] py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded-xl font-medium transition-colors">
                  {deploying ? t('deploy.deploying') : t('deploy.deployNow')}
                </button>
              )}
              <button onClick={handleExportZip} disabled={exportingZip}
                className="flex-1 min-w-[120px] py-3 bg-accent-blue hover:bg-accent-blue/90 disabled:bg-blue-800 rounded-xl font-medium transition-colors">
                {exportingZip ? t('export.downloading') : t('button.downloadProject')}
              </button>
              <button onClick={() => setGithubDialog(true)}
                className="flex-1 min-w-[120px] py-3 bg-warm-900 hover:bg-warm-800 border border-warm-600 rounded-xl font-medium transition-colors">
                {t('export.toGitHub')}
              </button>
            </div>
          </div>
        )}

        {viewState === 'error' && (
          <div className="text-center py-8" role="alert">
            <div className="text-6xl mb-6" aria-hidden="true">❌</div>
            <h3 className="text-2xl font-bold mb-4">{t('error.title')}</h3>
            <p className="text-red-400 mb-6">{errorMessage}</p>
            <button onClick={() => setViewState('form')}
              className="px-6 py-3 bg-accent-blue hover:bg-accent-blue/90 rounded-xl font-medium transition-colors">
              {t('button.tryAgain')}
            </button>
          </div>
        )}
      </section>

      {viewState === 'form' && (
        <>
          <StatsSection />
          <FeaturesSection />
          <TemplatesSection />
          <PricingSection plans={pricingPlans} onSelectPlan={(planId) => {
            if (planId === 'enterprise') {
              window.location.href = 'mailto:contact@ai-dev-request.kr?subject=Enterprise%20Plan%20Inquiry'
            } else if (planId === 'free') {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            } else {
              navigate('/settings?tab=billing')
            }
          }} />
        </>
      )}

      {/* Token Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-warm-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
          <div className="glass-heavy rounded-2xl p-6 max-w-md shadow-premium-xl w-full">
            <h3 id="confirm-dialog-title" className="text-xl font-bold mb-4">{t(`tokens.confirm.${confirmDialog.action}.title`)}</h3>
            <p className="text-warm-400 mb-4">{t(`tokens.confirm.${confirmDialog.action}.description`)}</p>
            <div className="bg-warm-900 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-warm-400">{t('tokens.confirm.cost')}</span>
                <span className="font-bold">{confirmDialog.tokenCheck.tokenCost} {t('settings.tokens.tokensUnit')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-400">{t('tokens.confirm.balance')}</span>
                <span>{confirmDialog.tokenCheck.currentBalance} &rarr; {confirmDialog.tokenCheck.currentBalance - confirmDialog.tokenCheck.tokenCost} {t('settings.tokens.tokensUnit')}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2 bg-warm-800 hover:bg-warm-700 rounded-lg transition-colors">
                {t('tokens.confirm.cancel')}
              </button>
              <button onClick={confirmDialog.onConfirm}
                className="flex-1 py-2 bg-accent-blue hover:bg-accent-blue/90 rounded-lg font-medium transition-colors">
                {t(`tokens.confirm.${confirmDialog.action}.button`)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Selection Dialog */}
      {showPlanSelection && analysisResult && (
        <PlanSelectionDialog
          complexity={analysisResult.complexity}
          tokenCost={300}
          onSelect={handlePlanSelected}
          onCancel={() => setShowPlanSelection(false)}
        />
      )}

      {/* GitHub Export Dialog */}
      {githubDialog && (
        <div className="fixed inset-0 bg-warm-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="github-dialog-title">
          <div className="glass-heavy rounded-2xl p-6 max-w-md shadow-premium-xl w-full">
            <h3 id="github-dialog-title" className="text-xl font-bold mb-4">{t('export.githubTitle')}</h3>
            <p className="text-warm-400 text-sm mb-4">{t('export.githubDescription')}</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('export.accessToken')}</label>
                <input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)}
                  placeholder={t('export.accessTokenPlaceholder')}
                  className="w-full p-2 bg-warm-950/80 border border-warm-700/50 rounded-xl text-warm-100 placeholder-warm-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue/30 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('export.repoName')}</label>
                <input type="text" value={githubRepoName} onChange={(e) => setGithubRepoName(e.target.value)}
                  placeholder={productionResult?.production.projectName || 'my-project'}
                  className="w-full p-2 bg-warm-950/80 border border-warm-700/50 rounded-xl text-warm-100 placeholder-warm-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue/30 transition-all" />
                <p className="text-xs text-warm-500 mt-1">{t('export.repoNameHint')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setGithubDialog(false); setGithubToken(''); setGithubRepoName('') }}
                className="flex-1 py-2 bg-warm-800 hover:bg-warm-700 rounded-lg transition-colors">
                {t('tokens.confirm.cancel')}
              </button>
              <button onClick={handleExportGitHub} disabled={!githubToken.trim() || exportingGithub}
                className="flex-1 py-2 bg-warm-900 hover:bg-warm-800 border border-warm-600 disabled:opacity-50 rounded-lg font-medium transition-colors">
                {exportingGithub ? t('export.pushing') : t('export.pushToGitHub')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Tokens Dialog */}
      {insufficientDialog && (
        <div className="fixed inset-0 bg-warm-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="insufficient-dialog-title">
          <div className="glass-heavy rounded-2xl p-6 max-w-md shadow-premium-xl w-full">
            <h3 id="insufficient-dialog-title" className="text-xl font-bold mb-4 text-orange-400">{t('tokens.insufficient.title')}</h3>
            <p className="text-warm-400 mb-4">
              {t(`tokens.confirm.${insufficientDialog.action}.title`)} {t('tokens.insufficient.requires', { count: insufficientDialog.required })}
            </p>
            <div className="bg-warm-900 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-warm-400">{t('tokens.insufficient.yourBalance')}</span>
                <span className="font-bold">{insufficientDialog.balance} {t('settings.tokens.tokensUnit')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-400">{t('tokens.insufficient.needed')}</span>
                <span className="text-orange-400 font-bold">+{insufficientDialog.shortfall} {t('settings.tokens.tokensUnit')}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setInsufficientDialog(null)}
                className="flex-1 py-2 bg-warm-800 hover:bg-warm-700 rounded-lg transition-colors">
                {t('tokens.confirm.cancel')}
              </button>
              <button onClick={() => { setInsufficientDialog(null); navigate('/settings') }}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors">
                {t('settings.tokens.buyTokens')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
