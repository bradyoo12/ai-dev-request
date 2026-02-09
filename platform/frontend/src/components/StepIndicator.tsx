import { useTranslation } from 'react-i18next'
import { FileText, Brain, ClipboardList, Hammer, CheckCircle } from 'lucide-react'

type ViewState = 'form' | 'submitting' | 'analyzing' | 'analyzed' | 'generatingProposal' | 'proposal' | 'approving' | 'building' | 'verifying' | 'completed' | 'error'

interface StepIndicatorProps {
  viewState: ViewState
}

const steps = [
  { key: 'request', icon: FileText, states: ['form', 'submitting'] },
  { key: 'analysis', icon: Brain, states: ['analyzing', 'analyzed'] },
  { key: 'proposal', icon: ClipboardList, states: ['generatingProposal', 'proposal'] },
  { key: 'build', icon: Hammer, states: ['approving', 'building', 'verifying'] },
  { key: 'complete', icon: CheckCircle, states: ['completed'] },
] as const

function getStepIndex(viewState: ViewState): number {
  for (let i = 0; i < steps.length; i++) {
    if ((steps[i].states as readonly string[]).includes(viewState)) return i
  }
  return 0
}

function isLoading(viewState: ViewState): boolean {
  return ['submitting', 'analyzing', 'generatingProposal', 'approving', 'building', 'verifying'].includes(viewState)
}

export default function StepIndicator({ viewState }: StepIndicatorProps) {
  const { t } = useTranslation()
  const currentIndex = getStepIndex(viewState)

  if (viewState === 'form' || viewState === 'error') return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isActive = isCompleted || isCurrent
          const showPulse = isCurrent && isLoading(viewState)

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-500'
                  }`}
                >
                  {showPulse && (
                    <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-30" />
                  )}
                  <Icon size={18} className="relative z-10" />
                </div>
                <span
                  className={`mt-2 text-xs font-medium whitespace-nowrap transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {t(`wizard.step.${step.key}`)}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 mt-[-1.25rem] relative">
                  <div className="absolute inset-0 bg-gray-700 rounded" />
                  <div
                    className="absolute inset-y-0 left-0 bg-green-600 rounded transition-all duration-700 ease-out"
                    style={{ width: isCompleted ? '100%' : isCurrent ? '50%' : '0%' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
