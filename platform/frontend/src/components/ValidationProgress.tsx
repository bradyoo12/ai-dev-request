import { useTranslation } from 'react-i18next'

interface ValidationProgressProps {
  iterations: number
  maxIterations: number
  currentPhase: string
  passed: boolean
}

export default function ValidationProgress({ iterations, maxIterations, currentPhase, passed }: ValidationProgressProps) {
  const { t } = useTranslation()

  const progressPercent = Math.min((iterations / maxIterations) * 100, 100)

  const getPhaseLabel = () => {
    if (passed) return t('validation.passed')
    if (currentPhase === 'fixing') return t('validation.fixing', { current: iterations, max: maxIterations })
    if (currentPhase === 'maxRetries') return t('validation.maxRetries')
    return t('validation.validating')
  }

  const getPhaseColor = () => {
    if (passed) return 'text-green-400'
    if (currentPhase === 'maxRetries') return 'text-yellow-400'
    return 'text-blue-400'
  }

  const getBarColor = () => {
    if (passed) return 'bg-green-500'
    if (currentPhase === 'maxRetries') return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  return (
    <div className="bg-warm-900 rounded-xl p-4 mb-4" data-testid="validation-progress">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {passed ? (
            <span className="text-green-400 text-xl" data-testid="check-icon">&#10003;</span>
          ) : currentPhase === 'maxRetries' ? (
            <span className="text-yellow-400 text-xl" data-testid="warning-icon">&#9888;</span>
          ) : (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" data-testid="spinner-icon" />
          )}
          <span className={`font-medium ${getPhaseColor()}`}>{getPhaseLabel()}</span>
        </div>
        <span className="text-sm text-warm-400">
          {iterations}/{maxIterations}
        </span>
      </div>

      <div className="w-full bg-warm-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getBarColor()}`}
          style={{ width: `${progressPercent}%` }}
          data-testid="progress-bar"
        />
      </div>

      <div className="flex justify-between mt-2">
        {Array.from({ length: maxIterations }, (_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full border-2 ${
                i < iterations
                  ? passed
                    ? 'bg-green-500 border-green-500'
                    : 'bg-blue-500 border-blue-500'
                  : i === iterations && !passed && currentPhase !== 'maxRetries'
                    ? 'border-blue-500 animate-pulse'
                    : 'border-warm-600'
              }`}
              data-testid={`step-dot-${i}`}
            />
            <span className="text-[10px] text-warm-500 mt-1">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
