import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listValidations, validateOperation, deleteValidation, getValidationStats, getOperationTypes } from '../api/hybridvalidation'
import type { HybridValidation, ValidateResponse, OperationType, ValidationStats } from '../api/hybridvalidation'

type Tab = 'validate' | 'history' | 'operations' | 'stats'

export default function HybridValidationPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('validate')
  const [project, setProject] = useState('')
  const [opType, setOpType] = useState('db-migration')
  const [aiOutput, setAiOutput] = useState('')
  const [result, setResult] = useState<ValidateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HybridValidation[]>([])
  const [operations, setOperations] = useState<OperationType[]>([])
  const [stats, setStats] = useState<ValidationStats>({ total: 0, byType: [] })

  useEffect(() => {
    if (tab === 'history') listValidations().then(setHistory)
    if (tab === 'operations') getOperationTypes().then(setOperations)
    if (tab === 'stats') getValidationStats().then(setStats)
  }, [tab])

  const handleValidate = async () => {
    if (!project || !aiOutput) return
    setLoading(true)
    try {
      const r = await validateOperation(project, opType, aiOutput)
      setResult(r)
    } finally {
      setLoading(false)
    }
  }

  const severityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-600'
      case 'medium': return 'bg-yellow-600'
      default: return 'bg-gray-600'
    }
  }

  const resultColor = (r: string) => {
    switch (r) {
      case 'passed': return 'text-green-400'
      case 'failed': return 'text-red-400'
      case 'retried': return 'text-yellow-400'
      default: return 'text-warm-400'
    }
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('hybrid.title', 'Hybrid AI + Deterministic Validation')}</h3>
      <div className="flex gap-2 mb-6">
        {(['validate', 'history', 'operations', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-400 hover:text-white'}`}
          >{t(`hybrid.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}</button>
        ))}
      </div>

      {tab === 'validate' && (
        <div className="bg-warm-800 rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('hybrid.project', 'Project Name')}</label>
              <input value={project} onChange={e => setProject(e.target.value)} placeholder="my-project"
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('hybrid.opType', 'Operation Type')}</label>
              <select value={opType} onChange={e => setOpType(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white">
                <option value="db-migration">Database Migration</option>
                <option value="git-operation">Git Operation</option>
                <option value="file-operation">File Operation</option>
                <option value="api-validation">API Validation</option>
                <option value="security-check">Security Check</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-warm-400 mb-1">{t('hybrid.aiOutput', 'AI-Generated Output')}</label>
            <textarea value={aiOutput} onChange={e => setAiOutput(e.target.value)}
              placeholder="Paste AI-generated code, SQL, or operation details..."
              className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white h-32 resize-none" />
          </div>
          <button onClick={handleValidate} disabled={loading || !project || !aiOutput}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? t('hybrid.validating', 'Validating...') : t('hybrid.validate', 'Validate')}
          </button>

          {result && (
            <div className="mt-6 bg-warm-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">{t('hybrid.result', 'Validation Result')}</h4>
                <span className={`text-lg font-bold ${resultColor(result.validationResult)}`}>
                  {result.validationResult.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-sm">{t('hybrid.confidence', 'Confidence')}</div>
                  <div className="text-xl font-bold text-white">{(result.confidenceScore * 100).toFixed(1)}%</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-sm">{t('hybrid.retries', 'Retries')}</div>
                  <div className="text-xl font-bold text-white">{result.retryCount} / 3</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-sm">{t('hybrid.time', 'Validation Time')}</div>
                  <div className="text-xl font-bold text-white">{result.validationTimeMs.toFixed(0)}ms</div>
                </div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-warm-400 mb-2">{t('hybrid.rules', 'Rules Applied')}</div>
                <div className="flex flex-wrap gap-2">
                  {result.passedRules.map(r => (
                    <span key={r} className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs">{r}</span>
                  ))}
                  {result.failedRules.map(r => (
                    <span key={r} className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs">{r}</span>
                  ))}
                </div>
              </div>
              {result.usedFallback && (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 mb-4">
                  <div className="text-yellow-400 text-sm font-medium">{t('hybrid.fallback', 'Fallback Applied')}</div>
                  <div className="text-white text-sm mt-1">{result.fallbackAction}</div>
                </div>
              )}
              <div className="bg-warm-800 rounded-lg p-3">
                <div className="text-warm-400 text-sm mb-1">{t('hybrid.recommendation', 'Recommendation')}</div>
                <div className="text-white text-sm">{result.recommendation}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 && <div className="text-warm-400 text-center py-8">{t('hybrid.noHistory', 'No validation history yet')}</div>}
          {history.map(v => (
            <div key={v.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{v.projectName}</span>
                  <span className="bg-warm-700 text-warm-300 px-2 py-0.5 rounded text-xs">{v.operationType}</span>
                  <span className={`font-medium text-xs ${resultColor(v.validationResult)}`}>{v.validationResult}</span>
                </div>
                <div className="text-warm-400 text-sm mt-1">
                  {t('hybrid.rulesPassed', 'Rules')}: {v.rulesPassedCount}/{v.rulesPassedCount + v.rulesFailedCount} |
                  {t('hybrid.confidence', 'Confidence')}: {(v.confidenceScore * 100).toFixed(1)}% |
                  {v.usedFallback && ` ${t('hybrid.fallbackUsed', 'Fallback used')} |`}
                  {new Date(v.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button onClick={async () => { await deleteValidation(v.id); setHistory(h => h.filter(x => x.id !== v.id)) }}
                className="text-red-400 hover:text-red-300 text-sm">{t('common.delete', 'Delete')}</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'operations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operations.map(op => (
            <div key={op.id} className="bg-warm-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">{op.name}</h4>
                <span className={`${severityColor(op.severity)} text-white text-xs px-2 py-1 rounded`}>{op.severity}</span>
              </div>
              <p className="text-warm-400 text-sm mb-3">{op.description}</p>
              <div className="text-sm text-warm-400 mb-2">{t('hybrid.validationRules', 'Validation Rules')}:</div>
              <ul className="space-y-1">
                {op.rules.map(r => (
                  <li key={r} className="text-warm-300 text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="bg-warm-800 rounded-lg p-5 border border-dashed border-warm-600">
            <h4 className="text-white font-semibold mb-3">{t('hybrid.howItWorks', 'How It Works')}</h4>
            <ol className="space-y-2 text-warm-400 text-sm list-decimal list-inside">
              <li>{t('hybrid.step1', 'AI generates solution output')}</li>
              <li>{t('hybrid.step2', 'Deterministic validator checks against rules')}</li>
              <li>{t('hybrid.step3', 'If validation fails, AI retries with error context')}</li>
              <li>{t('hybrid.step4', 'Max 3 retries, then fallback to safe defaults')}</li>
            </ol>
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div>
          <div className="bg-warm-800 rounded-lg p-6 mb-4">
            <div className="text-warm-400 text-sm">{t('hybrid.totalValidations', 'Total Validations')}</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.byType.map(s => (
              <div key={s.type} className="bg-warm-800 rounded-lg p-4">
                <div className="text-white font-medium">{s.type}</div>
                <div className="text-warm-400 text-sm mt-1">
                  {t('hybrid.stats.count', 'Count')}: {s.count} | {t('hybrid.stats.avgConf', 'Avg Confidence')}: {(s.avgConfidence * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
