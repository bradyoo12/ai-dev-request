import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Globe, ShoppingCart, LayoutDashboard } from 'lucide-react'
import FadeIn from './motion/FadeIn'
import StaggerChildren, { staggerItemVariants } from './motion/StaggerChildren'

const featured = [
  {
    id: 'landing',
    nameKey: 'templates.landing.name',
    descriptionKey: 'templates.landing.description',
    icon: Globe,
    gradient: 'from-accent-blue to-accent-cyan',
    techStack: ['React', 'Tailwind CSS', 'Framer Motion'],
  },
  {
    id: 'ecommerce',
    nameKey: 'templates.ecommerce.name',
    descriptionKey: 'templates.ecommerce.description',
    icon: ShoppingCart,
    gradient: 'from-accent-emerald to-accent-cyan',
    techStack: ['Next.js', 'Stripe', 'PostgreSQL'],
  },
  {
    id: 'saas',
    nameKey: 'templates.saas.name',
    descriptionKey: 'templates.saas.description',
    icon: LayoutDashboard,
    gradient: 'from-accent-purple to-accent-blue',
    techStack: ['React', 'Chart.js', 'REST API'],
  },
]

export default function TemplatesSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section className="py-20">
      <FadeIn>
        <h3 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
          {t('templates.featured')}
        </h3>
        <p className="text-warm-500 text-center mb-14 max-w-lg mx-auto">
          {t('templates.featuredSubtitle')}
        </p>
      </FadeIn>

      <StaggerChildren staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {featured.map(tpl => {
          const Icon = tpl.icon
          return (
            <motion.div key={tpl.id} variants={staggerItemVariants}>
              <div className="glass-card rounded-2xl p-6 h-full flex flex-col group hover:ring-2 hover:ring-accent-blue/30 transition-all">
                <div className={`w-12 h-12 mb-4 rounded-xl bg-gradient-to-br ${tpl.gradient} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-bold mb-2 text-warm-100 group-hover:text-accent-blue transition-colors">
                  {t(tpl.nameKey)}
                </h4>
                <p className="text-warm-400 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                  {t(tpl.descriptionKey)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tpl.techStack.map(tech => (
                    <span key={tech} className="px-2 py-0.5 bg-warm-800/80 text-warm-300 rounded text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )
        })}
      </StaggerChildren>

      <FadeIn delay={0.3}>
        <div className="text-center">
          <button
            onClick={() => navigate('/templates')}
            className="px-8 py-3 bg-gradient-to-r from-accent-blue to-accent-purple hover:shadow-glow-blue rounded-2xl font-semibold transition-all"
          >
            {t('templates.viewAll')}
          </button>
        </div>
      </FadeIn>
    </section>
  )
}
