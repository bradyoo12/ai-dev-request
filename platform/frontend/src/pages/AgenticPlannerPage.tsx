import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AgenticPlan, PlanStep, AgenticPlanStats } from '../api/agenticplan'
import { listPlans, generatePlan, approvePlan, executePlan, getAgenticPlanStats } from '../api/agenticplan'

type Tab = 'create' | 'plans' | 'stats'

export default function AgenticPlannerPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('create')
  const [prompt, setPrompt] = useState('')
  const [planName, setPlanName] = useState('')
  const [plan, setPlan] = useState<AgenticPlan | null>(null)
  const [plans, setPlans] = useState<AgenticPlan[]>([])
  const [stats, setStats] = useState<AgenticPlanStats | null>(null)
  const [generating, setGenerating] = useState(false)
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    if (tab === 'plans') listPlans().then(setPlans).catch(() => {})
    if (tab === 'stats') getAgenticPlanStats().then(setStats).catch(() => {})
  }, [tab])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    try {
      const result = await generatePlan(prompt, planName || 'Untitled Plan')
      setPlan(result)
    } catch { /* ignore */ }
    setGenerating(false)
  }

  const handleApprove = async () => {
    if (!plan) return
    try {
      const result = await approvePlan(plan.id)
      setPlan(result)
    } catch { /* ignore */ }
  }

  const handleExecute = async () => {
    if (!plan) return
    setExecuting(true)
    try {
      const result = await executePlan(plan.id)
      setPlan(result)
    } catch { /* ignore */ }
    setExecuting(false)
  }

  const parseSteps = (json: string): PlanStep[] => { try { return JSON.parse(json) } catch { return [] } }

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'running': return 'text-blue-400'
      case 'failed': return 'text-red-400'
      case 'approved': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-700 text-gray-300',
      approved: 'bg-yellow-900/30 text-yellow-400',
      running: 'bg-blue-900/30 text-blue-400',
      completed: 'bg-green-900/30 text-green-400',
      failed: 'bg-red-900/30 text-red-400',
    }
    return colors[status] || 'bg-gray-700 text-gray-400'
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('agenticPlan.title', 'Agentic Planner')}</h3>
      <p className="text-gray-400 text-sm mb-6">{t('agenticPlan.subtitle', 'Break down complex requests into multi-step execution plans with AI')}</p>

      <div className="flex gap-2 mb-6">
        {(['create', 'plans', 'stats'] as Tab[]).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t2 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t(`agenticPlan.tabs.${t2}`, t2.charAt(0).toUpperCase() + t2.slice(1))}
          </button>
        ))}
      </div>

      {tab === 'create' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2">{t('agenticPlan.describe', 'Describe what you want to build')}</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('agenticPlan.placeholder', 'Build a dashboard with user authentication, API backend, and data visualization...')}
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">{t('agenticPlan.planName', 'Plan Name')}</label>
                <input
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="My App Plan"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {generating ? t('agenticPlan.generating', 'Planning...') : t('agenticPlan.generate', 'Generate Plan')}
              </button>
            </div>
          </div>

          {plan && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{plan.planName}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(plan.status)}`}>{plan.status}</span>
                </div>
                <div className="flex gap-2">
                  {plan.status === 'draft' && (
                    <button onClick={handleApprove} className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition-colors">
                      {t('agenticPlan.approve', 'Approve Plan')}
                    </button>
                  )}
                  {(plan.status === 'approved' || !plan.requiresApproval) && plan.status !== 'completed' && (
                    <button onClick={handleExecute} disabled={executing} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors">
                      {executing ? t('agenticPlan.executing', 'Executing...') : t('agenticPlan.execute', 'Execute Plan')}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">{t('agenticPlan.progress', 'Progress')}: {plan.completedSteps}/{plan.totalSteps}</span>
                  <div className="w-48 h-2 bg-gray-700 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${plan.totalSteps > 0 ? (plan.completedSteps / plan.totalSteps) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  {parseSteps(plan.stepsJson).map((step, i) => (
                    <div key={step.id} className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg p-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                        step.status === 'running' ? 'bg-blue-900/30 text-blue-400' :
                        step.status === 'failed' ? 'bg-red-900/30 text-red-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {step.status === 'completed' ? '✓' : i + 1}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${statusColor(step.status)}`}>{step.name}</div>
                        <div className="text-xs text-gray-500">{step.description}</div>
                      </div>
                      {step.timeMs > 0 && (
                        <div className="text-xs text-gray-500">{step.timeMs}ms</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{plan.totalSteps}</div>
                  <div className="text-xs text-gray-400">{t('agenticPlan.steps', 'Steps')}</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{plan.completedSteps}</div>
                  <div className="text-xs text-gray-400">{t('agenticPlan.completed', 'Completed')}</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{plan.totalTokensUsed.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">{t('agenticPlan.tokens', 'Tokens')}</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{plan.totalTimeMs}ms</div>
                  <div className="text-xs text-gray-400">{t('agenticPlan.time', 'Time')}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'plans' && (
        <div className="space-y-3">
          {plans.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">{t('agenticPlan.noPlans', 'No plans yet. Create your first plan!')}</div>
          )}
          {plans.map((p) => (
            <div key={p.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{p.planName}</div>
                <div className="text-xs text-gray-400 mt-1">{p.totalSteps} steps, {p.completedSteps} completed</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(p.status)}`}>{p.status}</span>
                <span className="text-xs text-gray-500">{new Date(p.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalPlans}</div>
              <div className="text-sm text-gray-400">{t('agenticPlan.stats.plans', 'Total Plans')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.completedPlans}</div>
              <div className="text-sm text-gray-400">{t('agenticPlan.stats.completed', 'Completed')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.successRate}%</div>
              <div className="text-sm text-gray-400">{t('agenticPlan.stats.successRate', 'Success Rate')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalStepsExecuted}</div>
              <div className="text-sm text-gray-400">{t('agenticPlan.stats.stepsExecuted', 'Steps Executed')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.averageStepsPerPlan}</div>
              <div className="text-sm text-gray-400">{t('agenticPlan.stats.avgSteps', 'Avg Steps/Plan')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalTokensUsed.toLocaleString()}</div>
              <div className="text-sm text-gray-400">{t('agenticPlan.stats.tokens', 'Tokens Used')}</div>
            </div>
          </div>
          {stats.recentPlans.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">{t('agenticPlan.stats.recent', 'Recent Plans')}</h4>
              <div className="space-y-2">
                {stats.recentPlans.map((p, i) => (
                  <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{p.planName}</span>
                      <span className="text-xs text-gray-400 ml-2">{p.completedSteps}/{p.totalSteps} steps</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(p.status)}`}>{p.status}</span>
                      <span className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
