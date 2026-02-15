import { useTranslation } from 'react-i18next'

export type PowerLevel = 'standard' | 'extended' | 'high_power'

export interface PowerLevelConfig {
  level: PowerLevel
  labelKey: string
  descriptionKey: string
  icon: string
  costMultiplier: number
}

const POWER_LEVELS: PowerLevelConfig[] = [
  {
    level: 'standard',
    labelKey: 'dynamicIntelligence.standard.label',
    descriptionKey: 'dynamicIntelligence.standard.description',
    icon: '\u26A1',
    costMultiplier: 1,
  },
  {
    level: 'extended',
    labelKey: 'dynamicIntelligence.extended.label',
    descriptionKey: 'dynamicIntelligence.extended.description',
    icon: '\uD83E\uDDE0',
    costMultiplier: 2,
  },
  {
    level: 'high_power',
    labelKey: 'dynamicIntelligence.highPower.label',
    descriptionKey: 'dynamicIntelligence.highPower.description',
    icon: '\uD83D\uDE80',
    costMultiplier: 5,
  },
]

interface PowerLevelSelectorProps {
  value: PowerLevel
  onChange: (level: PowerLevel) => void
  disabled?: boolean
}

export default function PowerLevelSelector({ value, onChange, disabled }: PowerLevelSelectorProps) {
  const { t } = useTranslation()

  return (
    <div className="mt-6">
      <label className="block text-sm font-medium mb-2 text-warm-400">
        {t('dynamicIntelligence.title')}
      </label>
      <p className="text-xs text-warm-500 mb-3">
        {t('dynamicIntelligence.description')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {POWER_LEVELS.map((pl) => {
          const isSelected = value === pl.level
          return (
            <button
              key={pl.level}
              type="button"
              disabled={disabled}
              onClick={() => onChange(pl.level)}
              className={`relative text-left p-4 min-h-[44px] rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-accent-blue bg-accent-blue/10 shadow-glow-blue'
                  : 'border-warm-700/50 bg-warm-900/50 hover:border-warm-500/50 hover:bg-warm-800/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              aria-pressed={isSelected}
              data-testid={`power-level-${pl.level}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl" aria-hidden="true">{pl.icon}</span>
                <span className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-warm-300'}`}>
                  {t(pl.labelKey)}
                </span>
              </div>
              <p className="text-xs text-warm-500 mb-2">{t(pl.descriptionKey)}</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                isSelected
                  ? 'bg-accent-blue/30 text-accent-blue'
                  : 'bg-warm-800 text-warm-400'
              }`}>
                {t('dynamicIntelligence.costMultiplier', { multiplier: pl.costMultiplier })}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { POWER_LEVELS }
