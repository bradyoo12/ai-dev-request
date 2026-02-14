import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Globe, ShoppingCart, FileText, LayoutDashboard, Smartphone, Server } from 'lucide-react'
import FadeIn from '../components/motion/FadeIn'
import StaggerChildren, { staggerItemVariants } from '../components/motion/StaggerChildren'

type TemplateCategory = 'all' | 'landingPage' | 'ecommerce' | 'blog' | 'saas' | 'mobileApp' | 'apiBackend'

interface TemplateItem {
  id: string
  nameKey: string
  descriptionKey: string
  category: TemplateCategory
  icon: typeof Globe
  gradient: string
  techStack: string[]
  prompt: string
  framework?: string
}

const templates: TemplateItem[] = [
  {
    id: 'landing',
    nameKey: 'templates.landing.name',
    descriptionKey: 'templates.landing.description',
    category: 'landingPage',
    icon: Globe,
    gradient: 'from-accent-blue to-accent-cyan',
    techStack: ['React', 'Tailwind CSS', 'Framer Motion'],
    prompt: 'Build a modern responsive landing page with a hero section, features grid, testimonials carousel, pricing table, and call-to-action section. Include smooth scroll animations and a mobile-friendly navigation.',
    framework: 'react',
  },
  {
    id: 'ecommerce',
    nameKey: 'templates.ecommerce.name',
    descriptionKey: 'templates.ecommerce.description',
    category: 'ecommerce',
    icon: ShoppingCart,
    gradient: 'from-accent-emerald to-accent-cyan',
    techStack: ['Next.js', 'Stripe', 'PostgreSQL', 'Tailwind CSS'],
    prompt: 'Build a full-featured e-commerce store with product catalog, shopping cart, checkout flow with Stripe payment, user accounts, order history, and admin dashboard for product management.',
    framework: 'nextjs',
  },
  {
    id: 'blog',
    nameKey: 'templates.blog.name',
    descriptionKey: 'templates.blog.description',
    category: 'blog',
    icon: FileText,
    gradient: 'from-accent-amber to-accent-rose',
    techStack: ['React', 'Markdown', 'SEO', 'RSS'],
    prompt: 'Build a blog and content platform with markdown editor, categories, tags, full-text search, SEO optimization, RSS feed, and responsive reading experience with dark mode.',
    framework: 'react',
  },
  {
    id: 'saas',
    nameKey: 'templates.saas.name',
    descriptionKey: 'templates.saas.description',
    category: 'saas',
    icon: LayoutDashboard,
    gradient: 'from-accent-purple to-accent-blue',
    techStack: ['React', 'Chart.js', 'Auth', 'REST API'],
    prompt: 'Build a SaaS admin dashboard with analytics charts, user management, role-based access control, billing integration, activity logs, and real-time data views with dark theme.',
    framework: 'react',
  },
  {
    id: 'mobile',
    nameKey: 'templates.mobile.name',
    descriptionKey: 'templates.mobile.description',
    category: 'mobileApp',
    icon: Smartphone,
    gradient: 'from-accent-rose to-accent-purple',
    techStack: ['React Native', 'Expo', 'Push Notifications'],
    prompt: 'Build a cross-platform mobile app with tab navigation, authentication screens, push notifications, profile management, settings page, and native UI components using React Native and Expo.',
    framework: 'react-native',
  },
  {
    id: 'api',
    nameKey: 'templates.api.name',
    descriptionKey: 'templates.api.description',
    category: 'apiBackend',
    icon: Server,
    gradient: 'from-accent-cyan to-accent-emerald',
    techStack: ['.NET 10', 'PostgreSQL', 'JWT Auth', 'Swagger'],
    prompt: 'Build a production-ready REST API server with JWT authentication, PostgreSQL database with EF Core ORM, request validation, rate limiting, CORS configuration, and auto-generated Swagger/OpenAPI documentation.',
  },
]

const categories: { key: TemplateCategory; labelKey: string }[] = [
  { key: 'all', labelKey: 'templates.category.all' },
  { key: 'landingPage', labelKey: 'templates.category.landingPage' },
  { key: 'ecommerce', labelKey: 'templates.category.ecommerce' },
  { key: 'blog', labelKey: 'templates.category.blog' },
  { key: 'saas', labelKey: 'templates.category.saas' },
  { key: 'mobileApp', labelKey: 'templates.category.mobileApp' },
  { key: 'apiBackend', labelKey: 'templates.category.apiBackend' },
]

export default function TemplatesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('all')

  const filtered = activeCategory === 'all'
    ? templates
    : templates.filter(tpl => tpl.category === activeCategory)

  const handleUseTemplate = (tpl: TemplateItem) => {
    const params = new URLSearchParams({ template: tpl.prompt })
    if (tpl.framework) params.set('framework', tpl.framework)
    navigate(`/?${params.toString()}`)
  }

  return (
    <div className="py-8 space-y-8">
      <FadeIn>
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            {t('templates.title')}
          </h1>
          <p className="text-warm-400 max-w-2xl mx-auto">
            {t('templates.subtitle')}
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === cat.key
                  ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-glow-blue'
                  : 'bg-warm-800/80 text-warm-300 hover:bg-warm-700 border border-warm-700/30'
              }`}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </div>
      </FadeIn>

      <StaggerChildren staggerDelay={0.08} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(tpl => {
          const Icon = tpl.icon
          return (
            <motion.div key={tpl.id} variants={staggerItemVariants}>
              <div className="glass-card rounded-2xl p-6 h-full flex flex-col group hover:ring-2 hover:ring-accent-blue/30 transition-all">
                <div className={`w-14 h-14 mb-4 rounded-2xl bg-gradient-to-br ${tpl.gradient} flex items-center justify-center`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-warm-100 group-hover:text-accent-blue transition-colors">
                  {t(tpl.nameKey)}
                </h3>
                <p className="text-warm-400 text-sm leading-relaxed mb-4 flex-1">
                  {t(tpl.descriptionKey)}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tpl.techStack.map(tech => (
                    <span key={tech} className="px-2 py-0.5 bg-warm-800/80 text-warm-300 rounded text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleUseTemplate(tpl)}
                  className="w-full py-2.5 bg-gradient-to-r from-accent-blue to-accent-purple hover:shadow-glow-blue rounded-xl font-medium text-sm transition-all"
                >
                  {t('templates.useTemplate')}
                </button>
              </div>
            </motion.div>
          )
        })}
      </StaggerChildren>
    </div>
  )
}
