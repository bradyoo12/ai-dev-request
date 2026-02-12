import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getProgress,
  completeStep,
  skipOnboarding,
  resetOnboarding,
  type OnboardingProgress,
} from '../api/onboarding'

const STEPS = [
  { key: 'account_created', icon: '👤' },
  { key: 'first_request', icon: '📝' },
  { key: 'analysis_viewed', icon: '🔍' },
  { key: 'proposal_reviewed', icon: '📋' },
  { key: 'build_completed', icon: '🔨' },
  { key: 'preview_deployed', icon: '🚀' },
]

export default function OnboardingPage() {
  const { t } = useTranslation()
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProgress()
  }, [])

  async function loadProgress() {
    setLoading(true)
    setError('')
    try {
      const p = await getProgress()
      setProgress(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('onboarding.error.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleCompleteStep(step: string) {
    setSaving(true)
    setError('')
    try {
      const p = await completeStep(step)
      setProgress(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('onboarding.error.stepFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSkip() {
    setSaving(true)
    setError('')
    try {
      const p = await skipOnboarding()
      setProgress(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('onboarding.error.skipFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setSaving(true)
    setError('')
    try {
      const p = await resetOnboarding()
      setProgress(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('onboarding.error.resetFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const completedSteps = progress?.completedSteps ?? []
  const isCompleted = progress?.status === 'completed'
  const isSkipped = progress?.status === 'skipped'
  const completionPercent = Math.round((completedSteps.length / STEPS.length) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-warm-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('onboarding.title')}</h3>
          {isCompleted ? (
            <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium">
              {t('onboarding.statusCompleted')}
            </span>
          ) : isSkipped ? (
            <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-sm font-medium">
              {t('onboarding.statusSkipped')}
            </span>
          ) : (
            <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium">
              {t('onboarding.statusActive')}
            </span>
          )}
        </div>
        <p className="text-warm-400 text-sm mb-4">{t('onboarding.description')}</p>

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded p-3 mb-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm text-warm-400 mb-1">
            <span>{t('onboarding.progress')}</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="w-full bg-warm-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                completionPercent === 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
        <p className="text-sm text-warm-500">
          {completedSteps.length} / {STEPS.length} {t('onboarding.stepsCompleted')}
        </p>
      </div>

      {/* Steps checklist */}
      <div className="bg-warm-900 rounded-lg p-6">
        <h4 className="text-md font-semibold mb-4">{t('onboarding.checklist')}</h4>
        <div className="space-y-3">
          {STEPS.map((step, index) => {
            const isDone = completedSteps.includes(step.key)
            const isCurrent = !isDone && index === completedSteps.length
            return (
              <div
                key={step.key}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isDone
                    ? 'border-green-700/50 bg-green-900/10'
                    : isCurrent
                    ? 'border-blue-700/50 bg-blue-900/10'
                    : 'border-warm-700/50 bg-warm-800/30'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isDone
                      ? 'bg-green-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-warm-700 text-warm-400'
                  }`}
                >
                  {isDone ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${isDone ? 'text-green-300' : isCurrent ? 'text-white' : 'text-warm-400'}`}>
                    <span className="mr-2">{step.icon}</span>
                    {t(`onboarding.steps.${step.key}.title`)}
                  </p>
                  <p className="text-sm text-warm-500">{t(`onboarding.steps.${step.key}.description`)}</p>
                </div>
                {isCurrent && !isCompleted && !isSkipped && (
                  <button
                    onClick={() => handleCompleteStep(step.key)}
                    disabled={saving}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-md transition-colors"
                  >
                    {saving ? t('onboarding.completing') : t('onboarding.markComplete')}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-warm-900 rounded-lg p-6">
        <h4 className="text-md font-semibold mb-4">{t('onboarding.actions')}</h4>
        <div className="flex gap-3">
          {!isCompleted && !isSkipped && (
            <button
              onClick={handleSkip}
              disabled={saving}
              className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-700/50 rounded-md text-sm transition-colors disabled:opacity-50"
            >
              {t('onboarding.skipButton')}
            </button>
          )}
          {(isCompleted || isSkipped) && (
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-4 py-2 bg-warm-700 hover:bg-warm-600 text-white rounded-md text-sm transition-colors disabled:opacity-50"
            >
              {t('onboarding.resetButton')}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {progress && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-warm-900 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{progress.currentStep}</p>
            <p className="text-sm text-warm-400">{t('onboarding.stats.currentStep')}</p>
          </div>
          <div className="bg-warm-900 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{completedSteps.length}</p>
            <p className="text-sm text-warm-400">{t('onboarding.stats.completed')}</p>
          </div>
          <div className="bg-warm-900 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{STEPS.length - completedSteps.length}</p>
            <p className="text-sm text-warm-400">{t('onboarding.stats.remaining')}</p>
          </div>
          <div className="bg-warm-900 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{completionPercent}%</p>
            <p className="text-sm text-warm-400">{t('onboarding.stats.progress')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
