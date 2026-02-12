import { useTranslation } from 'react-i18next'

interface QualityDimensions {
  architecture: number
  security: number
  performance: number
  accessibility: number
  maintainability: number
}

interface QualityConfidenceBadgeProps {
  score: number
  dimensions?: QualityDimensions
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: { circle: 'w-16 h-16', text: 'text-lg', label: 'text-[10px]', bar: 'h-1', gap: 'gap-1' },
  md: { circle: 'w-24 h-24', text: 'text-3xl', label: 'text-xs', bar: 'h-1.5', gap: 'gap-2' },
  lg: { circle: 'w-32 h-32', text: 'text-4xl', label: 'text-sm', bar: 'h-2', gap: 'gap-3' },
}

function getScoreColor(score: number) {
  if (score >= 80) return { text: 'text-green-400', border: 'border-green-500', bg: 'bg-green-500', ring: 'ring-green-500/30' }
  if (score >= 60) return { text: 'text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-500', ring: 'ring-yellow-500/30' }
  return { text: 'text-red-400', border: 'border-red-500', bg: 'bg-red-500', ring: 'ring-red-500/30' }
}

function getLabel(score: number, t: (key: string, fallback: string) => string) {
  if (score >= 80) return t('qualityBadge.excellent', 'Excellent')
  if (score >= 60) return t('qualityBadge.good', 'Good')
  return t('qualityBadge.needsWork', 'Needs Improvement')
}

export default function QualityConfidenceBadge({ score, dimensions, size = 'md' }: QualityConfidenceBadgeProps) {
  const { t } = useTranslation()
  const config = sizeConfig[size]
  const colors = getScoreColor(score)

  const dimensionKeys: { key: keyof QualityDimensions; labelKey: string; fallback: string }[] = [
    { key: 'architecture', labelKey: 'qualityBadge.dimensions.architecture', fallback: 'Architecture' },
    { key: 'security', labelKey: 'qualityBadge.dimensions.security', fallback: 'Security' },
    { key: 'performance', labelKey: 'qualityBadge.dimensions.performance', fallback: 'Performance' },
    { key: 'accessibility', labelKey: 'qualityBadge.dimensions.accessibility', fallback: 'Accessibility' },
    { key: 'maintainability', labelKey: 'qualityBadge.dimensions.maintainability', fallback: 'Maintainability' },
  ]

  return (
    <div className="bg-warm-800 rounded-xl p-5">
      <div className={`flex items-center ${config.gap}`}>
        {/* Circular badge */}
        <div className={`${config.circle} rounded-full border-2 ${colors.border} ring-4 ${colors.ring} flex flex-col items-center justify-center flex-shrink-0`}>
          <span className={`${config.text} font-bold ${colors.text}`}>{score}</span>
        </div>

        <div className="ml-2">
          <p className={`${config.label} text-warm-400`}>{t('qualityBadge.title', 'Quality Score')}</p>
          <p className={`${config.label} font-medium ${colors.text}`}>{getLabel(score, t)}</p>
        </div>
      </div>

      {/* Dimension breakdown bars */}
      {dimensions && (
        <div className="mt-4 space-y-2">
          {dimensionKeys.map((dim) => {
            const value = dimensions[dim.key]
            const dimColors = getScoreColor(value)
            return (
              <div key={dim.key} className="flex items-center gap-3">
                <span className="text-xs text-warm-400 w-28 text-right">{t(dim.labelKey, dim.fallback)}</span>
                <div className="flex-1 bg-warm-700 rounded-full overflow-hidden">
                  <div
                    className={`${config.bar} rounded-full transition-all ${dimColors.bg}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className={`text-xs font-bold w-8 ${dimColors.text}`}>{value}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
