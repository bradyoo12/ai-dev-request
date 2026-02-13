import { useTranslation } from 'react-i18next'

export type ModelTier = 'haiku' | 'sonnet' | 'opus'

export interface ModelOption {
  id: string
  tier: ModelTier
  name: string
  labelKey: string
  descriptionKey: string
  useCasesKey: string
  icon: string
  costMultiplier: number
  speedMultiplier: number
  badge: string
  badgeColor: string
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'claude:claude-haiku-4-5-20251001',
    tier: 'haiku',
    name: 'Claude Haiku 4.5',
    labelKey: 'modelSelector.haiku.label',
    descriptionKey: 'modelSelector.haiku.description',
    useCasesKey: 'modelSelector.haiku.useCases',
    icon: '⚡',
    costMultiplier: 0.3,
    speedMultiplier: 3,
    badge: 'FASTEST',
    badgeColor: 'green',
  },
  {
    id: 'claude:claude-sonnet-4-5-20250929',
    tier: 'sonnet',
    name: 'Claude Sonnet 4.5',
    labelKey: 'modelSelector.sonnet.label',
    descriptionKey: 'modelSelector.sonnet.description',
    useCasesKey: 'modelSelector.sonnet.useCases',
    icon: '🎯',
    costMultiplier: 1,
    speedMultiplier: 1,
    badge: 'BALANCED',
    badgeColor: 'blue',
  },
  {
    id: 'claude:claude-opus-4-6',
    tier: 'opus',
    name: 'Claude Opus 4.6',
    labelKey: 'modelSelector.opus.label',
    descriptionKey: 'modelSelector.opus.description',
    useCasesKey: 'modelSelector.opus.useCases',
    icon: '🚀',
    costMultiplier: 5,
    speedMultiplier: 0.5,
    badge: 'MOST CAPABLE',
    badgeColor: 'amber',
  },
]

interface ModelQuickSelectorProps {
  value: string
  onChange: (modelId: string) => void
  disabled?: boolean
  showCostInfo?: boolean
  compact?: boolean
}

export default function ModelQuickSelector({
  value,
  onChange,
  disabled,
  showCostInfo = true,
  compact = false,
}: ModelQuickSelectorProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-warm-300 mb-1">
          {t('modelSelector.title', 'AI Model')}
        </label>
        <p className="text-xs text-warm-500">
          {t('modelSelector.description', 'Choose between speed and capability for your request')}
        </p>
      </div>

      <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'} gap-3`}>
        {MODEL_OPTIONS.map((model) => {
          const isSelected = value === model.id
          const badgeColors = {
            green: 'bg-green-500/20 text-green-400 border-green-500/30',
            blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          }
          const borderColors = {
            green: 'border-green-500/60 bg-green-500/5 ring-1 ring-green-500/30',
            blue: 'border-blue-500/60 bg-blue-500/5 ring-1 ring-blue-500/30',
            amber: 'border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30',
          }

          return (
            <button
              key={model.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(model.id)}
              className={`relative text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? borderColors[model.badgeColor as keyof typeof borderColors]
                  : 'border-warm-700 bg-warm-800 hover:border-warm-600'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              aria-pressed={isSelected}
              data-testid={`model-selector-${model.tier}`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    badgeColors[model.badgeColor as keyof typeof badgeColors]
                  }`}
                >
                  {model.badge}
                </span>
                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-400"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )}
              </div>

              {/* Model Name */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl" aria-hidden="true">
                  {model.icon}
                </span>
                <span className="font-semibold text-sm text-white">{t(model.labelKey, model.name)}</span>
              </div>

              {/* Description */}
              <p className="text-xs text-warm-400 mb-2">
                {t(model.descriptionKey, 'Model description')}
              </p>

              {/* Use Cases */}
              {!compact && (
                <p className="text-xs text-warm-500 mb-3">
                  {t(model.useCasesKey, 'Use cases')}
                </p>
              )}

              {/* Cost & Speed Info */}
              {showCostInfo && (
                <div className="flex gap-2 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-warm-700 text-warm-200' : 'bg-warm-900 text-warm-400'
                    }`}
                  >
                    {model.costMultiplier}x {t('modelSelector.cost', 'cost')}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-warm-700 text-warm-200' : 'bg-warm-900 text-warm-400'
                    }`}
                  >
                    {model.speedMultiplier}x {t('modelSelector.speed', 'speed')}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Cost Tip */}
      {showCostInfo && !compact && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-xs text-blue-400">
            💡 {t('modelSelector.tip', 'Tip: Use Haiku for quick edits, Sonnet for everyday development, Opus for complex decisions.')}
          </p>
        </div>
      )}
    </div>
  )
}

export { MODEL_OPTIONS }
