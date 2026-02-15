import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react'
import { refundableScenarios, nonRefundableScenarios } from '../data/claims-policy'

interface PaymentDisclaimerProps {
  /** When true, shows a checkbox that must be checked before proceeding */
  requireAgreement?: boolean
  /** Called when agreement checkbox state changes */
  onAgreementChange?: (agreed: boolean) => void
  /** Whether the user has agreed (controlled mode) */
  agreed?: boolean
}

export default function PaymentDisclaimer({
  requireAgreement = false,
  onAgreementChange,
  agreed = false,
}: PaymentDisclaimerProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-warm-900 border border-warm-700 rounded-xl overflow-hidden">
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-warm-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span className="text-sm font-medium text-warm-200">
            {t('billing.disclaimer.title')}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-warm-400 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-warm-700">
          {/* Key policy statements */}
          <div className="mt-3 space-y-2">
            <p className="text-sm text-warm-300">
              {t('billing.disclaimer.nonRefundable')}
            </p>
            <p className="text-sm text-warm-300">
              {t('billing.disclaimer.claims')}
            </p>
          </div>

          {/* Refundable scenarios */}
          <div>
            <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">
              {t('billing.disclaimer.refundableTitle')}
            </h4>
            <ul className="space-y-1.5">
              {refundableScenarios.map((scenario) => (
                <li key={scenario.id} className="flex items-start gap-2 text-sm text-warm-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t(scenario.i18nKey)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Non-refundable scenarios */}
          <div>
            <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
              {t('billing.disclaimer.nonRefundableTitle')}
            </h4>
            <ul className="space-y-1.5">
              {nonRefundableScenarios.map((scenario) => (
                <li key={scenario.id} className="flex items-start gap-2 text-sm text-warm-400">
                  <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{t(scenario.i18nKey)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Agreement checkbox */}
      {requireAgreement && (
        <div className="px-4 py-3 border-t border-warm-700 bg-warm-800/30">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => onAgreementChange?.(e.target.checked)}
              className="w-4 h-4 rounded border-warm-600 bg-warm-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="text-sm text-warm-300">
              {t('billing.disclaimer.agree')}
            </span>
          </label>
        </div>
      )}
    </div>
  )
}
