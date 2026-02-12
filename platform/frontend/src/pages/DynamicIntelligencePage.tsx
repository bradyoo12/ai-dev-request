import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PowerLevel } from '../components/PowerLevelSelector'
import { POWER_LEVELS } from '../components/PowerLevelSelector'

export default function DynamicIntelligencePage() {
  const { t } = useTranslation()
  const [defaultLevel, setDefaultLevel] = useState<PowerLevel>('standard')
  const [showReasoning, setShowReasoning] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold">{t('dynamicIntelligence.settings.title')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('dynamicIntelligence.settings.description')}</p>
      </div>

      {/* Default Power Level */}
      <div className="bg-warm-800 rounded-xl p-6">
        <h4 className="font-semibold mb-4">{t('dynamicIntelligence.defaultLevel')}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {POWER_LEVELS.map((pl) => {
            const isSelected = defaultLevel === pl.level
            return (
              <button
                key={pl.level}
                type="button"
                onClick={() => setDefaultLevel(pl.level)}
                className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-accent-blue bg-accent-blue/10 shadow-glow-blue'
                    : 'border-warm-700/50 bg-warm-900/50 hover:border-warm-500/50 hover:bg-warm-800/50'
                } cursor-pointer`}
                aria-pressed={isSelected}
                data-testid={`settings-power-level-${pl.level}`}
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

      {/* Show Reasoning Toggle */}
      <div className="bg-warm-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">{t('dynamicIntelligence.showReasoning')}</h4>
            <p className="text-warm-400 text-sm mt-1">
              {t('dynamicIntelligence.showReasoningDescription', 'Display step-by-step AI reasoning when using Extended Thinking or High Power modes')}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showReasoning}
            onClick={() => setShowReasoning(!showReasoning)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showReasoning ? 'bg-accent-blue' : 'bg-warm-600'
            }`}
            data-testid="show-reasoning-toggle"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showReasoning ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Cost Comparison Table */}
      <div className="bg-warm-800 rounded-xl p-6">
        <h4 className="font-semibold mb-4">{t('dynamicIntelligence.costComparison', 'Cost Comparison')}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-warm-400 border-b border-warm-700">
                <th className="text-left py-2 pr-4">{t('dynamicIntelligence.table.level', 'Level')}</th>
                <th className="text-left py-2 pr-4">{t('dynamicIntelligence.table.model', 'Model')}</th>
                <th className="text-left py-2 pr-4">{t('dynamicIntelligence.table.speed', 'Speed')}</th>
                <th className="text-left py-2 pr-4">{t('dynamicIntelligence.table.cost', 'Cost')}</th>
                <th className="text-left py-2">{t('dynamicIntelligence.table.bestFor', 'Best For')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-warm-700/50">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">{'\u26A1'}</span>
                    <span>{t('dynamicIntelligence.standard.label')}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-warm-400">Claude Sonnet</td>
                <td className="py-3 pr-4">
                  <span className="px-2 py-0.5 bg-green-900/50 text-green-300 rounded-full text-xs">
                    {t('dynamicIntelligence.table.fast', 'Fast')}
                  </span>
                </td>
                <td className="py-3 pr-4 text-warm-300">1x</td>
                <td className="py-3 text-warm-400">{t('dynamicIntelligence.table.standardBestFor', 'Simple projects, landing pages')}</td>
              </tr>
              <tr className="border-b border-warm-700/50">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">{'\uD83E\uDDE0'}</span>
                    <span>{t('dynamicIntelligence.extended.label')}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-warm-400">Claude Sonnet + Extended Thinking</td>
                <td className="py-3 pr-4">
                  <span className="px-2 py-0.5 bg-yellow-900/50 text-yellow-300 rounded-full text-xs">
                    {t('dynamicIntelligence.table.moderate', 'Moderate')}
                  </span>
                </td>
                <td className="py-3 pr-4 text-warm-300">2x</td>
                <td className="py-3 text-warm-400">{t('dynamicIntelligence.table.extendedBestFor', 'Complex logic, multi-page apps')}</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">{'\uD83D\uDE80'}</span>
                    <span>{t('dynamicIntelligence.highPower.label')}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-warm-400">Claude Opus</td>
                <td className="py-3 pr-4">
                  <span className="px-2 py-0.5 bg-orange-900/50 text-orange-300 rounded-full text-xs">
                    {t('dynamicIntelligence.table.thorough', 'Thorough')}
                  </span>
                </td>
                <td className="py-3 pr-4 text-warm-300">5x</td>
                <td className="py-3 text-warm-400">{t('dynamicIntelligence.table.highPowerBestFor', 'Enterprise, full-stack systems')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
