import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface FixHistoryEntry {
  iteration: number
  issues: string[]
  fixDescription: string
}

interface FixHistoryDisplayProps {
  fixHistory: FixHistoryEntry[] | undefined
  validationPassed: boolean
  iterations: number
}

export default function FixHistoryDisplay({ fixHistory, validationPassed, iterations }: FixHistoryDisplayProps) {
  const { t } = useTranslation()
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  if (!fixHistory || fixHistory.length === 0) return null

  const toggleExpand = (iteration: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(iteration)) {
        next.delete(iteration)
      } else {
        next.add(iteration)
      }
      return next
    })
  }

  return (
    <div className="bg-warm-900 rounded-xl p-4 mb-4" data-testid="fix-history-display">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-warm-300">{t('validation.fixHistory')}</h4>
        <div className="flex items-center gap-2">
          <span className="text-sm text-warm-400">
            {t('validation.iterations')}: {iterations}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              validationPassed
                ? 'bg-green-600 text-white'
                : 'bg-yellow-600 text-white'
            }`}
            data-testid="validation-badge"
          >
            {validationPassed ? t('validation.passed') : t('validation.maxRetries')}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {fixHistory.map((entry) => {
          const isExpanded = expandedItems.has(entry.iteration)
          return (
            <div key={entry.iteration} className="bg-warm-800 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleExpand(entry.iteration)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-warm-750 transition-colors"
                data-testid={`fix-history-toggle-${entry.iteration}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-warm-300">
                    #{entry.iteration}
                  </span>
                  <span className="text-xs text-warm-500">
                    {entry.issues.length} {t('validation.issuesFound')}
                  </span>
                </div>
                <span className={`text-warm-400 text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  &#9660;
                </span>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 border-t border-warm-700" data-testid={`fix-history-content-${entry.iteration}`}>
                  <div className="mt-2">
                    <div className="text-xs text-red-400 font-medium mb-1">
                      {entry.issues.length} {t('validation.issuesFound')}:
                    </div>
                    <ul className="list-disc list-inside text-xs text-warm-400 space-y-0.5 mb-2">
                      {entry.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs text-blue-400 font-medium mb-1">
                      {t('validation.fixApplied')}:
                    </div>
                    <p className="text-xs text-warm-400">{entry.fixDescription}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
