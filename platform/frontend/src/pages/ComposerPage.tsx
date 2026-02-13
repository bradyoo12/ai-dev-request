import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../api/composer'

type Tab = 'compose' | 'plans' | 'modes' | 'stats'

export default function ComposerPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('compose')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{t('composer.title', 'Multi-File Composer')}</h2>
        <p className="text-warm-400 mt-1">{t('composer.subtitle', 'Edit multiple files simultaneously with Plan Mode — outline steps before executing changes')}</p>
      </div>
      <div className="flex gap-2">
        {(['compose', 'plans', 'modes', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-300 hover:bg-warm-600'}`}>
            {t(`composer.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'compose' && <ComposeTab />}
      {tab === 'plans' && <PlansTab />}
      {tab === 'modes' && <ModesTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function ComposeTab() {
  const { t } = useTranslation()
  const [project, setProject] = useState('')
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState('plan-first')
  const [model, setModel] = useState('sonnet')
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<api.CreatePlanResponse | null>(null)

  const handleCreate = async () => {
    if (!project.trim() || !prompt.trim()) return
    setCreating(true)
    try {
      const res = await api.createPlan(project, prompt, mode, model)
      setResult(res)
    } catch { /* ignore */ }
    setCreating(false)
  }

  const handleApprove = async (approved: boolean) => {
    if (!result) return
    try {
      const updated = await api.approvePlan(result.plan.id, approved)
      setResult({ ...result, plan: updated })
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">{t('composer.newEdit', 'New Multi-File Edit')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('composer.projectName', 'Project Name')}</label>
            <input value={project} onChange={e => setProject(e.target.value)} placeholder="my-app" className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('composer.planMode', 'Plan Mode')}</label>
              <select value={mode} onChange={e => setMode(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
                <option value="plan-first">{t('composer.modePlan', 'Plan First')}</option>
                <option value="direct">{t('composer.modeDirect', 'Direct Edit')}</option>
                <option value="interactive">{t('composer.modeInteractive', 'Interactive')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('composer.model', 'Model')}</label>
              <select value={model} onChange={e => setModel(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
                <option value="haiku">Haiku (Fast)</option>
                <option value="sonnet">Sonnet (Balanced)</option>
                <option value="opus">Opus (Most Capable)</option>
              </select>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm text-warm-400 mb-1">{t('composer.prompt', 'Edit Instructions')}</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} placeholder={t('composer.promptPlaceholder', 'Describe the changes you want to make across files...')} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white resize-none" />
        </div>
        <button onClick={handleCreate} disabled={creating || !project.trim() || !prompt.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {creating ? t('composer.creating', 'Creating Plan...') : t('composer.createBtn', 'Create Plan')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">{t('composer.planOverview', 'Plan Overview')}</h4>
              <span className={`px-2 py-1 text-xs rounded ${result.plan.status === 'completed' ? 'bg-green-600 text-white' : result.plan.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                {result.plan.status}
              </span>
            </div>
            <p className="text-warm-300 text-sm mb-3">{result.plan.planSummary}</p>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{result.plan.totalSteps}</div>
                <div className="text-xs text-warm-400">{t('composer.steps', 'Steps')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">{result.plan.filesChanged}</div>
                <div className="text-xs text-warm-400">{t('composer.files', 'Files')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">+{result.plan.linesAdded}</div>
                <div className="text-xs text-warm-400">{t('composer.added', 'Added')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-400">-{result.plan.linesRemoved}</div>
                <div className="text-xs text-warm-400">{t('composer.removed', 'Removed')}</div>
              </div>
            </div>
            {result.plan.status === 'planning' && (
              <div className="flex gap-3">
                <button onClick={() => handleApprove(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{t('composer.approve', 'Approve & Execute')}</button>
                <button onClick={() => handleApprove(false)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">{t('composer.reject', 'Reject')}</button>
              </div>
            )}
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">{t('composer.diffPreview', 'Diff Preview')}</h4>
            <div className="space-y-2">
              {result.steps.map(s => (
                <div key={s.step} className="p-3 bg-warm-900 rounded-lg font-mono text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-warm-300">{s.step}. {s.description}</span>
                    <span className={`px-2 py-0.5 text-xs rounded ${s.changeType === 'create' ? 'bg-green-600 text-white' : s.changeType === 'delete' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                      {s.changeType}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-warm-400">{s.file}</span>
                    <span className="text-green-400">+{s.linesAdded}</span>
                    <span className="text-red-400">-{s.linesRemoved}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlansTab() {
  const { t } = useTranslation()
  const [plans, setPlans] = useState<api.ComposerPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.listPlans().then(setPlans).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('composer.loading', 'Loading...')}</div>
  if (plans.length === 0) return <div className="text-warm-400">{t('composer.noPlans', 'No composer plans yet.')}</div>

  return (
    <div className="space-y-3">
      {plans.map(p => (
        <div key={p.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">{p.projectName}</div>
            <div className="text-sm text-warm-400">{p.planMode} · {p.modelTier} · {p.filesChanged} {t('composer.filesLabel', 'files')} · +{p.linesAdded}/-{p.linesRemoved}</div>
            <div className="text-xs text-warm-500 mt-1">{p.planSummary}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs rounded ${p.status === 'completed' ? 'bg-green-600 text-white' : p.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
              {p.status}
            </span>
            <button onClick={async () => { await api.deletePlan(p.id); setPlans(prev => prev.filter(x => x.id !== p.id)) }} className="text-red-400 hover:text-red-300 text-sm">
              {t('composer.delete', 'Delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ModesTab() {
  const { t } = useTranslation()
  const [modes, setModes] = useState<api.ComposerMode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getModes().then(setModes).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('composer.loading', 'Loading...')}</div>

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('composer.modesTitle', 'Composer Modes')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modes.map(m => (
            <div key={m.id} className="p-4 bg-warm-700 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: m.color }} />
                <h4 className="text-white font-medium">{m.name}</h4>
              </div>
              <p className="text-sm text-warm-400">{m.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('composer.modelsTitle', 'Model Tiers')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Haiku', desc: t('composer.haikuDesc', 'Fast model for simple edits — 2x speed, lowest cost'), color: '#10B981', speed: '2x' },
            { name: 'Sonnet', desc: t('composer.sonnetDesc', 'Balanced model for most tasks — good quality and speed'), color: '#3B82F6', speed: '1x' },
            { name: 'Opus', desc: t('composer.opusDesc', 'Most capable model for complex changes — highest quality'), color: '#8B5CF6', speed: '0.5x' },
          ].map(m => (
            <div key={m.name} className="p-4 bg-warm-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-white font-medium">{m.name}</span>
                </div>
                <span className="text-xs text-warm-400">{m.speed} speed</span>
              </div>
              <p className="text-sm text-warm-400">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatsTab() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<api.ComposerStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getComposerStats().then(setStats).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('composer.loading', 'Loading...')}</div>
  if (!stats || stats.totalPlans === 0) return <div className="text-warm-400">{t('composer.noStats', 'No composer statistics yet.')}</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { value: stats.totalPlans, label: t('composer.stats.plans', 'Plans') },
          { value: stats.totalFiles, label: t('composer.stats.files', 'Files Changed') },
          { value: `+${stats.totalLinesAdded}`, label: t('composer.stats.added', 'Lines Added'), color: 'text-green-400' },
          { value: `-${stats.totalLinesRemoved}`, label: t('composer.stats.removed', 'Lines Removed'), color: 'text-red-400' },
          { value: `${stats.approvalRate}%`, label: t('composer.stats.approval', 'Approval Rate'), color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value}</div>
            <div className="text-sm text-warm-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('composer.stats.byMode', 'By Plan Mode')}</h4>
          <div className="space-y-2">
            {stats.byMode.map(m => (
              <div key={m.mode} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{m.mode}</span>
                <span className="text-warm-400 text-sm">{m.count} {t('composer.plansLabel', 'plans')}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('composer.stats.byModel', 'By Model Tier')}</h4>
          <div className="space-y-2">
            {stats.byModel.map(m => (
              <div key={m.model} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{m.model}</span>
                <span className="text-warm-400 text-sm">{m.count} {t('composer.plansLabel', 'plans')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
