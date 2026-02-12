import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  browseTemplates,
  getCategories,
  getPopularTemplates,
  importTemplate,
  rateTemplate,
  submitTemplate,
} from '../api/marketplace'
import type {
  MarketplaceTemplate,
  MarketplaceCategoryCount,
  SubmitTemplatePayload,
} from '../api/marketplace'

type SortBy = 'popular' | 'newest' | 'rating'
type View = 'browse' | 'detail' | 'submit'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'web-app', label: 'Web App' },
  { key: 'api', label: 'API' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'automation', label: 'Automation' },
  { key: 'data-pipeline', label: 'Data Pipeline' },
]

export default function MarketplacePage() {
  const { t } = useTranslation()

  const [view, setView] = useState<View>('browse')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([])
  const [categories, setCategoriesData] = useState<MarketplaceCategoryCount[]>([])
  const [popularTemplates, setPopularTemplates] = useState<MarketplaceTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<MarketplaceTemplate | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortBy>('popular')
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)

  // Submit form state
  const [submitForm, setSubmitForm] = useState<SubmitTemplatePayload>({
    authorId: 0,
    name: '',
    description: '',
    category: 'web-app',
    techStack: '',
    tags: '',
    templateData: '{}',
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const category = selectedCategory === 'all' ? undefined : selectedCategory
      const search = searchQuery.trim() || undefined
      const [browseResult, cats, popular] = await Promise.all([
        browseTemplates(category, undefined, search, sortBy),
        getCategories(),
        getPopularTemplates(6),
      ])
      setTemplates(browseResult.templates)
      setCategoriesData(cats)
      setPopularTemplates(popular)
    } catch {
      setError(t('marketplace.loadError', 'Failed to load marketplace data'))
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchQuery, sortBy, t])

  useEffect(() => { loadData() }, [loadData])

  const handleImport = async (template: MarketplaceTemplate) => {
    try {
      setError('')
      const result = await importTemplate(template.id, 0)
      if (result.success) {
        setSuccess(t('marketplace.importSuccess', `Template "${template.name}" imported successfully!`))
        loadData()
      }
    } catch {
      setError(t('marketplace.importError', 'Failed to import template'))
    }
  }

  const handleRate = async (templateId: string, rating: number) => {
    try {
      setError('')
      const result = await rateTemplate(templateId, 0, rating)
      if (result.success) {
        setUserRating(rating)
        setSuccess(t('marketplace.rateSuccess', 'Rating submitted!'))
        if (selectedTemplate && selectedTemplate.id === templateId) {
          setSelectedTemplate({
            ...selectedTemplate,
            rating: result.newRating,
            ratingCount: result.newRatingCount,
          })
        }
        loadData()
      }
    } catch {
      setError(t('marketplace.rateError', 'Failed to submit rating'))
    }
  }

  const handleSubmit = async () => {
    try {
      setError('')
      if (!submitForm.name.trim() || !submitForm.description.trim()) {
        setError(t('marketplace.submitValidation', 'Name and description are required'))
        return
      }
      await submitTemplate(submitForm)
      setSuccess(t('marketplace.submitSuccess', 'Template submitted for review!'))
      setView('browse')
      setSubmitForm({
        authorId: 0,
        name: '',
        description: '',
        category: 'web-app',
        techStack: '',
        tags: '',
        templateData: '{}',
      })
      loadData()
    } catch {
      setError(t('marketplace.submitError', 'Failed to submit template'))
    }
  }

  const parseTechStack = (techStack: string): string[] => {
    try {
      return JSON.parse(techStack)
    } catch {
      return techStack ? techStack.split(',').map(s => s.trim()) : []
    }
  }

  const parseTags = (tags: string | null | undefined): string[] => {
    if (!tags) return []
    try {
      return JSON.parse(tags)
    } catch {
      return tags.split(',').map(s => s.trim())
    }
  }

  const renderStars = (rating: number, interactive = false, templateId?: string) => {
    const displayRating = interactive ? (hoverRating || userRating || rating) : rating
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={`text-lg transition-colors ${
              star <= displayRating ? 'text-yellow-400' : 'text-warm-600'
            } ${interactive ? 'hover:text-yellow-300 cursor-pointer' : 'cursor-default'}`}
            onClick={() => interactive && templateId && handleRate(templateId, star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          >
            *
          </button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-warm-400" data-testid="marketplace-loading">
        {t('marketplace.loading', 'Loading marketplace...')}
      </div>
    )
  }

  // === Detail View ===
  if (view === 'detail' && selectedTemplate) {
    const techStackItems = parseTechStack(selectedTemplate.techStack)
    const tagItems = parseTags(selectedTemplate.tags)

    return (
      <div className="space-y-6" data-testid="marketplace-detail">
        <button
          onClick={() => { setView('browse'); setSelectedTemplate(null); setUserRating(0) }}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          &larr; {t('marketplace.backToBrowse', 'Back to Marketplace')}
        </button>

        <div className="bg-warm-900 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">{selectedTemplate.name}</h3>
              <div className="flex items-center gap-3 mt-2">
                <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded">
                  {selectedTemplate.category}
                </span>
                {selectedTemplate.isOfficial && (
                  <span className="bg-green-600/20 text-green-400 text-xs px-2 py-1 rounded">
                    {t('marketplace.official', 'Official')}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleImport(selectedTemplate)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {t('marketplace.importTemplate', 'Import Template')}
            </button>
          </div>

          <p className="text-warm-300 mb-4">{selectedTemplate.description}</p>

          {/* Tech Stack Badges */}
          {techStackItems.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-warm-400 mb-2">{t('marketplace.techStack', 'Tech Stack')}</div>
              <div className="flex flex-wrap gap-2">
                {techStackItems.map(tech => (
                  <span key={tech} className="bg-warm-800 text-warm-300 text-xs px-2 py-1 rounded">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tagItems.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-warm-400 mb-2">{t('marketplace.tags', 'Tags')}</div>
              <div className="flex flex-wrap gap-2">
                {tagItems.map(tag => (
                  <span key={tag} className="bg-purple-600/20 text-purple-300 text-xs px-2 py-1 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-warm-800">
            <div className="flex items-center gap-2">
              {renderStars(selectedTemplate.rating, true, selectedTemplate.id)}
              <span className="text-sm text-warm-400">
                {selectedTemplate.rating.toFixed(1)} ({selectedTemplate.ratingCount})
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-warm-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              {selectedTemplate.downloadCount} {t('marketplace.downloads', 'downloads')}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // === Submit View ===
  if (view === 'submit') {
    return (
      <div className="space-y-6" data-testid="marketplace-submit">
        <button
          onClick={() => setView('browse')}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          &larr; {t('marketplace.backToBrowse', 'Back to Marketplace')}
        </button>

        <div className="bg-warm-900 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">{t('marketplace.submitTitle', 'Submit a Template')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('marketplace.templateName', 'Template Name')}</label>
              <input
                type="text"
                value={submitForm.name}
                onChange={e => setSubmitForm({ ...submitForm, name: e.target.value })}
                className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none"
                placeholder="My Awesome Template"
              />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('marketplace.description', 'Description')}</label>
              <textarea
                value={submitForm.description}
                onChange={e => setSubmitForm({ ...submitForm, description: e.target.value })}
                rows={3}
                className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none resize-none"
                placeholder="Describe what this template does..."
              />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('marketplace.category', 'Category')}</label>
              <select
                value={submitForm.category}
                onChange={e => setSubmitForm({ ...submitForm, category: e.target.value })}
                className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700"
              >
                {CATEGORIES.filter(c => c.key !== 'all').map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('marketplace.techStackLabel', 'Tech Stack (comma-separated)')}</label>
              <input
                type="text"
                value={submitForm.techStack}
                onChange={e => setSubmitForm({ ...submitForm, techStack: e.target.value })}
                className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none"
                placeholder="React, TypeScript, Node.js"
              />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('marketplace.tagsLabel', 'Tags (comma-separated)')}</label>
              <input
                type="text"
                value={submitForm.tags || ''}
                onChange={e => setSubmitForm({ ...submitForm, tags: e.target.value })}
                className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none"
                placeholder="saas, starter, fullstack"
              />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('marketplace.templateDataLabel', 'Template Data (JSON)')}</label>
              <textarea
                value={submitForm.templateData}
                onChange={e => setSubmitForm({ ...submitForm, templateData: e.target.value })}
                rows={4}
                className="w-full bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none resize-none font-mono"
                placeholder="{}"
              />
            </div>
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {t('marketplace.submitBtn', 'Submit Template')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // === Browse View ===
  return (
    <div className="space-y-6" data-testid="marketplace-browse">
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}
      {success && (
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-green-400">
          {success}
          <button onClick={() => setSuccess('')} className="ml-2 text-green-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg>
            {t('marketplace.title', 'Template Marketplace')}
          </span>
        </h3>
        <button
          onClick={() => setView('submit')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {t('marketplace.submitTemplate', 'Submit Template')}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('marketplace.searchPlaceholder', 'Search templates...')}
            className="w-full bg-warm-800 text-white rounded-lg px-4 py-2 text-sm border border-warm-700 focus:border-blue-500 outline-none"
            data-testid="marketplace-search"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortBy)}
          className="bg-warm-800 text-white rounded-lg px-3 py-2 text-sm border border-warm-700"
          data-testid="marketplace-sort"
        >
          <option value="popular">{t('marketplace.sortPopular', 'Popular')}</option>
          <option value="newest">{t('marketplace.sortNewest', 'Newest')}</option>
          <option value="rating">{t('marketplace.sortRating', 'Highest Rated')}</option>
        </select>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 bg-warm-800 rounded-lg p-1 overflow-x-auto whitespace-nowrap">
        {CATEGORIES.map(cat => {
          const catCount = categories.find(c => c.category === cat.key)?.count || 0
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                selectedCategory === cat.key ? 'bg-blue-600 text-white' : 'text-warm-400 hover:text-white'
              }`}
            >
              {cat.label}
              {cat.key !== 'all' && catCount > 0 && (
                <span className="ml-1 text-warm-500">({catCount})</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Popular Section (only when browsing 'all' with no search) */}
      {selectedCategory === 'all' && !searchQuery && popularTemplates.length > 0 && (
        <div>
          <h4 className="text-md font-bold mb-3">{t('marketplace.popularTitle', 'Popular Templates')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                parseTechStack={parseTechStack}
                renderStars={renderStars}
                onSelect={() => { setSelectedTemplate(template); setView('detail'); setUserRating(0) }}
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Templates Grid */}
      <div>
        <h4 className="text-md font-bold mb-3">
          {t('marketplace.allTemplates', 'All Templates')}
          <span className="text-warm-500 text-sm font-normal ml-2">({templates.length})</span>
        </h4>
        {templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                parseTechStack={parseTechStack}
                renderStars={renderStars}
                onSelect={() => { setSelectedTemplate(template); setView('detail'); setUserRating(0) }}
                t={t}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-warm-400">
            {t('marketplace.noTemplates', 'No templates found. Try adjusting your search or filters.')}
          </div>
        )}
      </div>
    </div>
  )
}

// === Template Card Component ===

function TemplateCard({
  template,
  parseTechStack,
  renderStars,
  onSelect,
  t,
}: {
  template: MarketplaceTemplate
  parseTechStack: (ts: string) => string[]
  renderStars: (rating: number) => React.ReactNode
  onSelect: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}) {
  const techStackItems = parseTechStack(template.techStack).slice(0, 3)

  return (
    <div
      onClick={onSelect}
      className="bg-warm-900 rounded-xl p-4 cursor-pointer hover:bg-warm-800 transition-colors border border-warm-800 hover:border-warm-700"
      data-testid="template-card"
    >
      <div className="flex items-start justify-between mb-2">
        <h5 className="font-bold text-sm truncate flex-1">{template.name}</h5>
        {template.isOfficial && (
          <span className="bg-green-600/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
            {t('marketplace.official', 'Official')}
          </span>
        )}
      </div>
      <p className="text-warm-400 text-xs mb-3 line-clamp-2">{template.description}</p>

      {/* Tech Stack Badges */}
      <div className="flex flex-wrap gap-1 mb-3">
        {techStackItems.map(tech => (
          <span key={tech} className="bg-warm-800 text-warm-300 text-[10px] px-1.5 py-0.5 rounded">
            {tech}
          </span>
        ))}
        {parseTechStack(template.techStack).length > 3 && (
          <span className="text-warm-500 text-[10px]">+{parseTechStack(template.techStack).length - 3}</span>
        )}
      </div>

      {/* Rating & Downloads */}
      <div className="flex items-center justify-between text-xs text-warm-400">
        <div className="flex items-center gap-1">
          {renderStars(template.rating)}
          <span>{template.rating.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          {template.downloadCount}
        </div>
      </div>
    </div>
  )
}
