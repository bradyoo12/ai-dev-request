import { useTranslation } from 'react-i18next'

interface RiskBreakdown {
  compositeRiskScore: number
  complexityRisk: number
  filesChangedRisk: number
  testCoverageRisk: number
  securityRisk: number
}

interface RiskScoreBadgeProps {
  riskScore: number
  breakdown?: RiskBreakdown
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: { circle: 'w-16 h-16', text: 'text-lg', label: 'text-[10px]', bar: 'h-1', gap: 'gap-1' },
  md: { circle: 'w-24 h-24', text: 'text-3xl', label: 'text-xs', bar: 'h-1.5', gap: 'gap-2' },
  lg: { circle: 'w-32 h-32', text: 'text-4xl', label: 'text-sm', bar: 'h-2', gap: 'gap-3' },
}

function getRiskColor(risk: number) {
  if (risk >= 67) return { text: 'text-red-400', border: 'border-red-500', bg: 'bg-red-500', ring: 'ring-red-500/30' }
  if (risk >= 34) return { text: 'text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-500', ring: 'ring-yellow-500/30' }
  return { text: 'text-green-400', border: 'border-green-500', bg: 'bg-green-500', ring: 'ring-green-500/30' }
}

function getRiskLabel(risk: number, t: (key: string, fallback: string) => string) {
  if (risk >= 67) return t('riskBadge.highRisk', 'High Risk')
  if (risk >= 34) return t('riskBadge.mediumRisk', 'Medium Risk')
  return t('riskBadge.lowRisk', 'Low Risk')
}

export default function RiskScoreBadge({ riskScore, breakdown, size = 'md' }: RiskScoreBadgeProps) {
  const { t } = useTranslation()
  const config = sizeConfig[size]
  const colors = getRiskColor(riskScore)

  const riskFactors: { key: keyof RiskBreakdown; labelKey: string; fallback: string }[] = [
    { key: 'securityRisk', labelKey: 'riskBadge.factors.security', fallback: 'Security Risk' },
    { key: 'testCoverageRisk', labelKey: 'riskBadge.factors.testCoverage', fallback: 'Test Coverage Risk' },
    { key: 'complexityRisk', labelKey: 'riskBadge.factors.complexity', fallback: 'Complexity Risk' },
    { key: 'filesChangedRisk', labelKey: 'riskBadge.factors.filesChanged', fallback: 'Files Changed Risk' },
  ]

  return (
    <div className="bg-warm-800 rounded-xl p-5">
      <div className={`flex items-center ${config.gap}`}>
        {/* Circular badge */}
        <div className={`${config.circle} rounded-full border-2 ${colors.border} ring-4 ${colors.ring} flex flex-col items-center justify-center flex-shrink-0`}>
          <span className={`${config.text} font-bold ${colors.text}`}>{riskScore}</span>
        </div>

        <div className="ml-2">
          <p className={`${config.label} text-warm-400`}>{t('riskBadge.title', 'Composite Risk Score')}</p>
          <p className={`${config.label} font-medium ${colors.text}`}>{getRiskLabel(riskScore, t)}</p>
        </div>
      </div>

      {/* Risk breakdown bars */}
      {breakdown && (
        <div className="mt-4 space-y-2">
          {riskFactors.map((factor) => {
            const value = breakdown[factor.key]
            const factorColors = getRiskColor(value)
            const factorLabel = t(factor.labelKey, factor.fallback)
            return (
              <div key={factor.key} className="flex items-center gap-3">
                <span className="text-xs text-warm-400 w-32 text-right">{factorLabel}</span>
                <div className="flex-1 bg-warm-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={`${factorLabel}: ${value}%`}>
                  <div
                    className={`${config.bar} rounded-full transition-all ${factorColors.bg}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className={`text-xs font-bold w-8 ${factorColors.text}`}>{value}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
