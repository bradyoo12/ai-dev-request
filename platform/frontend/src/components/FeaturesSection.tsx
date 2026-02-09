import { useTranslation } from 'react-i18next'
import { FileText, Search, Lightbulb, Hammer, Rocket } from 'lucide-react'

export default function FeaturesSection() {
  const { t } = useTranslation()

  const steps = [
    { icon: FileText, color: 'from-blue-500 to-blue-600', title: t('steps.request.title'), description: t('steps.request.description') },
    { icon: Search, color: 'from-purple-500 to-purple-600', title: t('steps.analysis.title'), description: t('steps.analysis.description') },
    { icon: Lightbulb, color: 'from-yellow-500 to-orange-500', title: t('steps.proposal.title'), description: t('steps.proposal.description') },
    { icon: Hammer, color: 'from-green-500 to-emerald-600', title: t('steps.build.title'), description: t('steps.build.description') },
    { icon: Rocket, color: 'from-pink-500 to-rose-600', title: t('steps.deploy.title'), description: t('steps.deploy.description') },
  ]

  return (
    <section id="how-it-works" className="py-16">
      <h3 className="text-3xl font-bold text-center mb-12">{t('features.howItWorks')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={i} className="relative group">
              <div className="bg-gray-800 rounded-xl p-6 text-center transition-all hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10 h-full">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-xs text-gray-500 mb-2 font-medium">{t('features.step', { num: i + 1 })}</div>
                <h4 className="font-bold mb-2">{step.title}</h4>
                <p className="text-gray-400 text-sm">{step.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 text-gray-600 text-lg">&#x25B6;</div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
