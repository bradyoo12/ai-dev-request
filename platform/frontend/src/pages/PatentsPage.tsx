import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Cpu,
  GitMerge,
  Layers,
  Bot,
  RefreshCw,
  Eye,
  HeartPulse,
  GitCompare,
  Database,
  Brain,
  Users,
  TestTube,
  Search,
  Puzzle,
  Plug,
  Mic,
  MessageSquare,
  FileCode,
  LayoutGrid,
} from 'lucide-react'
import FadeIn from '../components/motion/FadeIn'
import StaggerChildren, { staggerItemVariants } from '../components/motion/StaggerChildren'

type PatentTier = 'all' | 'tier1' | 'tier2' | 'tier3'
type PatentStatus = 'patent_pending' | 'filed' | 'under_analysis'

interface PatentItem {
  id: number
  titleKey: string
  patentAngleKey: string
  descriptionKey: string
  status: PatentStatus
  tier: 1 | 2 | 3
  icon: typeof ShieldCheck
  relatedFiles: string[]
}

const patents: PatentItem[] = [
  // Tier 1: High-Value Core Innovations
  {
    id: 1,
    titleKey: 'patents.item.1.title',
    patentAngleKey: 'patents.item.1.patentAngle',
    descriptionKey: 'patents.item.1.description',
    status: 'patent_pending',
    tier: 1,
    icon: ShieldCheck,
    relatedFiles: ['SelfHealingService.cs', 'CompilerValidationService.cs', 'SelfHealingTestService.cs'],
  },
  {
    id: 2,
    titleKey: 'patents.item.2.title',
    patentAngleKey: 'patents.item.2.patentAngle',
    descriptionKey: 'patents.item.2.description',
    status: 'patent_pending',
    tier: 1,
    icon: Cpu,
    relatedFiles: ['ModelRouterService.cs', 'CostTrackingService.cs', 'ModelRoutingConfig'],
  },
  {
    id: 3,
    titleKey: 'patents.item.3.title',
    patentAngleKey: 'patents.item.3.patentAngle',
    descriptionKey: 'patents.item.3.description',
    status: 'under_analysis',
    tier: 1,
    icon: Layers,
    relatedFiles: ['FileGenerationService.cs', 'GenerationManifest'],
  },
  {
    id: 4,
    titleKey: 'patents.item.4.title',
    patentAngleKey: 'patents.item.4.patentAngle',
    descriptionKey: 'patents.item.4.description',
    status: 'patent_pending',
    tier: 1,
    icon: GitMerge,
    relatedFiles: ['CodeSnapshot', 'CodeMergeController.cs'],
  },
  {
    id: 5,
    titleKey: 'patents.item.5.title',
    patentAngleKey: 'patents.item.5.patentAngle',
    descriptionKey: 'patents.item.5.description',
    status: 'patent_pending',
    tier: 1,
    icon: Bot,
    relatedFiles: ['BackgroundAgent', 'BackgroundAgentController.cs'],
  },
  {
    id: 6,
    titleKey: 'patents.item.6.title',
    patentAngleKey: 'patents.item.6.patentAngle',
    descriptionKey: 'patents.item.6.description',
    status: 'patent_pending',
    tier: 1,
    icon: RefreshCw,
    relatedFiles: ['WorkflowOrchestrationService.cs', 'WorkflowExecution'],
  },
  // Tier 2: Moderate-Value Differentiators
  {
    id: 7,
    titleKey: 'patents.item.7.title',
    patentAngleKey: 'patents.item.7.patentAngle',
    descriptionKey: 'patents.item.7.description',
    status: 'under_analysis',
    tier: 2,
    icon: Eye,
    relatedFiles: ['ComponentPreviewService.cs', 'ComponentPreview'],
  },
  {
    id: 8,
    titleKey: 'patents.item.8.title',
    patentAngleKey: 'patents.item.8.patentAngle',
    descriptionKey: 'patents.item.8.description',
    status: 'under_analysis',
    tier: 2,
    icon: HeartPulse,
    relatedFiles: ['DeploymentHealth', 'DeploymentHealthController.cs'],
  },
  {
    id: 9,
    titleKey: 'patents.item.9.title',
    patentAngleKey: 'patents.item.9.patentAngle',
    descriptionKey: 'patents.item.9.description',
    status: 'under_analysis',
    tier: 2,
    icon: GitCompare,
    relatedFiles: ['VariantGenerationService.cs', 'GenerationVariant'],
  },
  {
    id: 10,
    titleKey: 'patents.item.10.title',
    patentAngleKey: 'patents.item.10.patentAngle',
    descriptionKey: 'patents.item.10.description',
    status: 'under_analysis',
    tier: 2,
    icon: Database,
    relatedFiles: ['SchemaDesignerService.cs', 'DataSchema'],
  },
  {
    id: 11,
    titleKey: 'patents.item.11.title',
    patentAngleKey: 'patents.item.11.patentAngle',
    descriptionKey: 'patents.item.11.description',
    status: 'under_analysis',
    tier: 2,
    icon: Brain,
    relatedFiles: ['ClaudeProviderService.cs', 'AiModelConfig'],
  },
  {
    id: 12,
    titleKey: 'patents.item.12.title',
    patentAngleKey: 'patents.item.12.patentAngle',
    descriptionKey: 'patents.item.12.description',
    status: 'under_analysis',
    tier: 2,
    icon: Users,
    relatedFiles: ['CollaborativeEditingService.cs', 'CollaborativeSession'],
  },
  {
    id: 13,
    titleKey: 'patents.item.13.title',
    patentAngleKey: 'patents.item.13.patentAngle',
    descriptionKey: 'patents.item.13.description',
    status: 'under_analysis',
    tier: 2,
    icon: TestTube,
    relatedFiles: ['MultiAgentTestService.cs', 'MultiAgentTestSession', 'SelfHealingTestService.cs'],
  },
  {
    id: 14,
    titleKey: 'patents.item.14.title',
    patentAngleKey: 'patents.item.14.patentAngle',
    descriptionKey: 'patents.item.14.description',
    status: 'under_analysis',
    tier: 2,
    icon: Search,
    relatedFiles: ['MemoryExtractionService.cs', 'MemoryRetrievalService.cs', 'OrganizationalMemory'],
  },
  {
    id: 15,
    titleKey: 'patents.item.15.title',
    patentAngleKey: 'patents.item.15.patentAngle',
    descriptionKey: 'patents.item.15.description',
    status: 'under_analysis',
    tier: 2,
    icon: Puzzle,
    relatedFiles: ['AgentSkillService.cs', 'AgentSkill'],
  },
  // Tier 3: Supporting Features
  {
    id: 16,
    titleKey: 'patents.item.16.title',
    patentAngleKey: 'patents.item.16.patentAngle',
    descriptionKey: 'patents.item.16.description',
    status: 'under_analysis',
    tier: 3,
    icon: Plug,
    relatedFiles: ['McpIntegrationService.cs', 'McpConnection'],
  },
  {
    id: 17,
    titleKey: 'patents.item.17.title',
    patentAngleKey: 'patents.item.17.patentAngle',
    descriptionKey: 'patents.item.17.description',
    status: 'under_analysis',
    tier: 3,
    icon: Mic,
    relatedFiles: ['VoiceController.cs', 'VoiceConfig'],
  },
  {
    id: 18,
    titleKey: 'patents.item.18.title',
    patentAngleKey: 'patents.item.18.patentAngle',
    descriptionKey: 'patents.item.18.description',
    status: 'under_analysis',
    tier: 3,
    icon: MessageSquare,
    relatedFiles: ['GenerativeUiSession', 'GenerativeUiController.cs'],
  },
  {
    id: 19,
    titleKey: 'patents.item.19.title',
    patentAngleKey: 'patents.item.19.patentAngle',
    descriptionKey: 'patents.item.19.description',
    status: 'under_analysis',
    tier: 3,
    icon: FileCode,
    relatedFiles: ['ProjectIndex', 'ProjectIndexController.cs'],
  },
  {
    id: 20,
    titleKey: 'patents.item.20.title',
    patentAngleKey: 'patents.item.20.patentAngle',
    descriptionKey: 'patents.item.20.description',
    status: 'under_analysis',
    tier: 3,
    icon: LayoutGrid,
    relatedFiles: ['FrameworkConfig', 'FrameworkConfigController.cs'],
  },
]

const tierFilters: { key: PatentTier; labelKey: string }[] = [
  { key: 'all', labelKey: 'patents.filter.all' },
  { key: 'tier1', labelKey: 'patents.filter.tier1' },
  { key: 'tier2', labelKey: 'patents.filter.tier2' },
  { key: 'tier3', labelKey: 'patents.filter.tier3' },
]

function statusBadgeClass(status: PatentStatus): string {
  switch (status) {
    case 'patent_pending':
      return 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
    case 'filed':
      return 'bg-green-500/20 text-green-300 border border-green-500/30'
    case 'under_analysis':
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    default:
      return 'bg-warm-700/30 text-warm-300 border border-warm-600/30'
  }
}

function tierGradient(tier: 1 | 2 | 3): string {
  switch (tier) {
    case 1:
      return 'from-accent-blue to-accent-purple'
    case 2:
      return 'from-accent-emerald to-accent-cyan'
    case 3:
      return 'from-accent-amber to-accent-rose'
  }
}

function tierBorderGlow(tier: 1 | 2 | 3): string {
  switch (tier) {
    case 1:
      return 'hover:ring-accent-purple/30'
    case 2:
      return 'hover:ring-accent-cyan/30'
    case 3:
      return 'hover:ring-accent-amber/30'
  }
}

export default function PatentsPage() {
  const { t } = useTranslation()
  const [activeTier, setActiveTier] = useState<PatentTier>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const filtered = activeTier === 'all'
    ? patents
    : patents.filter(p => `tier${p.tier}` === activeTier)

  const tier1 = filtered.filter(p => p.tier === 1)
  const tier2 = filtered.filter(p => p.tier === 2)
  const tier3 = filtered.filter(p => p.tier === 3)

  const toggleExpand = (id: number) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const renderPatentCard = (patent: PatentItem) => {
    const Icon = patent.icon
    const isExpanded = expandedId === patent.id

    return (
      <motion.div key={patent.id} variants={staggerItemVariants}>
        <div
          className={`glass-card rounded-2xl p-6 h-full flex flex-col group hover:ring-2 ${tierBorderGlow(patent.tier)} transition-all cursor-pointer`}
          onClick={() => toggleExpand(patent.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpand(patent.id) }}
        >
          <div className="flex items-start gap-4 mb-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tierGradient(patent.tier)} flex items-center justify-center shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-medium text-warm-500">#{patent.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadgeClass(patent.status)}`}>
                  {t(`patents.status.${patent.status}`)}
                </span>
              </div>
              <h3 className="text-base font-bold text-warm-100 group-hover:text-white transition-colors leading-snug">
                {t(patent.titleKey)}
              </h3>
            </div>
          </div>

          <p className="text-sm text-warm-400 italic mb-3 leading-relaxed">
            {t(patent.patentAngleKey)}
          </p>

          <p className="text-sm text-warm-400 leading-relaxed flex-1">
            {t(patent.descriptionKey)}
          </p>

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-warm-700/30"
            >
              <p className="text-xs font-semibold text-warm-300 mb-2">{t('patents.relatedFiles')}</p>
              <div className="flex flex-wrap gap-1.5">
                {patent.relatedFiles.map(file => (
                  <span key={file} className="px-2 py-0.5 bg-warm-800/80 text-warm-300 rounded text-xs font-mono">
                    {file}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    )
  }

  const renderTierSection = (tierItems: PatentItem[], tierNum: 1 | 2 | 3) => {
    if (tierItems.length === 0) return null

    return (
      <div className="mb-10">
        <FadeIn>
          <div className="flex items-center gap-3 mb-6">
            <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${tierGradient(tierNum)}`} />
            <h2 className="text-xl font-bold text-warm-100">
              {t(`patents.tier${tierNum}.title`)}
            </h2>
            <span className="text-sm text-warm-500">
              ({tierItems.length} {t('patents.innovations')})
            </span>
          </div>
          <p className="text-sm text-warm-400 mb-6 -mt-2 ml-11">
            {t(`patents.tier${tierNum}.subtitle`)}
          </p>
        </FadeIn>
        <StaggerChildren staggerDelay={0.06} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tierItems.map(renderPatentCard)}
        </StaggerChildren>
      </div>
    )
  }

  const totalPending = patents.filter(p => p.status === 'patent_pending').length
  const totalAnalysis = patents.filter(p => p.status === 'under_analysis').length

  return (
    <div className="py-8 space-y-8">
      <FadeIn>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t('patents.badge')}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            <span className="gradient-text">{t('patents.title')}</span>
          </h1>
          <p className="text-warm-400 max-w-2xl mx-auto mb-6">
            {t('patents.subtitle')}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-4 mb-2">
            <div className="glass-card rounded-xl px-5 py-3 text-center">
              <div className="text-2xl font-bold gradient-text">{patents.length}</div>
              <div className="text-xs text-warm-500">{t('patents.stats.total')}</div>
            </div>
            <div className="glass-card rounded-xl px-5 py-3 text-center">
              <div className="text-2xl font-bold text-accent-blue">{totalPending}</div>
              <div className="text-xs text-warm-500">{t('patents.stats.pending')}</div>
            </div>
            <div className="glass-card rounded-xl px-5 py-3 text-center">
              <div className="text-2xl font-bold text-amber-400">{totalAnalysis}</div>
              <div className="text-xs text-warm-500">{t('patents.stats.analysis')}</div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Tier filter */}
      <FadeIn delay={0.1}>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tierFilters.map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveTier(filter.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTier === filter.key
                  ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-glow-blue'
                  : 'bg-warm-800/80 text-warm-300 hover:bg-warm-700 border border-warm-700/30'
              }`}
            >
              {t(filter.labelKey)}
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Patent tiers */}
      {renderTierSection(tier1, 1)}
      {renderTierSection(tier2, 2)}
      {renderTierSection(tier3, 3)}

      {/* Disclaimer */}
      <FadeIn delay={0.2}>
        <div className="glass-card rounded-2xl p-6 text-center max-w-2xl mx-auto">
          <p className="text-xs text-warm-500 leading-relaxed">
            {t('patents.disclaimer')}
          </p>
        </div>
      </FadeIn>
    </div>
  )
}
