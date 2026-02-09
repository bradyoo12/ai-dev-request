import { useTranslation } from 'react-i18next'

export default function StatsSection() {
  const { t } = useTranslation()

  const stats = [
    { value: '150+', label: t('stats.projects') },
    { value: '50+', label: t('stats.users') },
    { value: '< 5min', label: t('stats.analysisTime') },
  ]

  const techLogos = ['Claude AI', 'Azure', 'React', '.NET']

  return (
    <section className="py-12">
      <div className="grid grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {stat.value}
            </div>
            <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-center items-center gap-6 text-sm text-gray-500">
        <span>Powered by</span>
        {techLogos.map((logo) => (
          <span key={logo} className="px-3 py-1.5 bg-gray-800 rounded-lg text-gray-400">{logo}</span>
        ))}
      </div>
    </section>
  )
}
