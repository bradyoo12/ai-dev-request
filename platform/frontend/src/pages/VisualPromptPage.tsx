import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { ComponentListItem, ComponentDetail, VisualPromptStats, ComponentCategory } from '../api/visualprompt'
import { listComponents, getComponent, generateComponent, refineComponent, getGallery, getVisualPromptStats, getCategories } from '../api/visualprompt'

type Tab = 'generate' | 'gallery' | 'components' | 'stats'

export default function VisualPromptPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('generate')
  const [prompt, setPrompt] = useState('')
  const [componentName, setComponentName] = useState('')
  const [category, setCategory] = useState('custom')
  const [generating, setGenerating] = useState(false)
  const [activeComponent, setActiveComponent] = useState<ComponentDetail | null>(null)
  const [refinePrompt, setRefinePrompt] = useState('')
  const [components, setComponents] = useState<ComponentListItem[]>([])
  const [gallery, setGallery] = useState<ComponentListItem[]>([])
  const [stats, setStats] = useState<VisualPromptStats | null>(null)
  const [categories, setCategories] = useState<ComponentCategory[]>([])
  const [filterCategory, setFilterCategory] = useState('all')

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'components') listComponents(filterCategory).then(setComponents).catch(() => {})
    if (tab === 'gallery') getGallery(filterCategory).then(setGallery).catch(() => {})
    if (tab === 'stats') getVisualPromptStats().then(setStats).catch(() => {})
  }, [tab, filterCategory])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    try {
      const result = await generateComponent({ prompt, componentName: componentName || undefined, category })
      setActiveComponent(result)
      setPrompt('')
      setComponentName('')
    } catch { /* ignore */ }
    setGenerating(false)
  }

  const handleRefine = async () => {
    if (!refinePrompt.trim() || !activeComponent) return
    setGenerating(true)
    try {
      const result = await refineComponent(activeComponent.id, refinePrompt)
      setActiveComponent(result)
      setRefinePrompt('')
    } catch { /* ignore */ }
    setGenerating(false)
  }

  const handleViewComponent = async (id: string) => {
    try {
      const detail = await getComponent(id)
      setActiveComponent(detail)
      setTab('generate')
    } catch { /* ignore */ }
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('visualPrompt.title', 'Visual Prompt-to-UI')}</h3>
      <p className="text-warm-400 text-sm mb-6">{t('visualPrompt.subtitle', 'Describe a UI component and see it generated instantly with live preview')}</p>

      <div className="flex gap-2 mb-6">
        {(['generate', 'gallery', 'components', 'stats'] as Tab[]).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t2 ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`visualPrompt.tabs.${t2}`, t2.charAt(0).toUpperCase() + t2.slice(1))}
          </button>
        ))}
      </div>

      {tab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('visualPrompt.promptLabel', 'Describe your UI component')}</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('visualPrompt.promptPlaceholder', 'e.g., A pricing table with 3 tiers and a monthly/yearly toggle...')}
                className="w-full bg-warm-800 border border-warm-600 rounded-lg p-3 text-white text-sm h-32 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('visualPrompt.nameLabel', 'Component Name')}</label>
                <input
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  placeholder="PricingTable"
                  className="w-full bg-warm-800 border border-warm-600 rounded-lg p-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('visualPrompt.categoryLabel', 'Category')}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-warm-800 border border-warm-600 rounded-lg p-2 text-white text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? t('visualPrompt.generating', 'Generating...') : t('visualPrompt.generateBtn', 'Generate Component')}
            </button>

            {activeComponent && (
              <div className="space-y-3">
                <h4 className="font-medium">{t('visualPrompt.conversation', 'Conversation')}</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activeComponent.conversation.map((msg, i) => (
                    <div key={i} className={`p-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-900/30 text-blue-200' : 'bg-warm-800 text-warm-300'}`}>
                      <span className="font-medium">{msg.role === 'user' ? 'You' : 'AI'}:</span> {msg.content}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    placeholder={t('visualPrompt.refinePlaceholder', 'Describe changes...')}
                    className="flex-1 bg-warm-800 border border-warm-600 rounded-lg p-2 text-white text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                  />
                  <button
                    onClick={handleRefine}
                    disabled={generating || !refinePrompt.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {t('visualPrompt.refineBtn', 'Refine')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            {activeComponent ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{activeComponent.componentName}</h4>
                  <div className="flex items-center gap-2 text-xs text-warm-400">
                    <span>{t('visualPrompt.iterations', 'Iterations')}: {activeComponent.iterationCount}</span>
                    <span>·</span>
                    <span>{activeComponent.generationTimeMs}ms</span>
                    <span>·</span>
                    <span>{activeComponent.tokensUsed} {t('visualPrompt.tokens', 'tokens')}</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 min-h-[200px]">
                  <div dangerouslySetInnerHTML={{ __html: activeComponent.generatedHtml }} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t('visualPrompt.code', 'Code')}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(activeComponent.generatedCode)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      {t('visualPrompt.copyCode', 'Copy Code')}
                    </button>
                  </div>
                  <pre className="bg-warm-900 border border-warm-700 rounded-lg p-3 text-xs text-green-400 overflow-x-auto max-h-64 overflow-y-auto">
                    {activeComponent.generatedCode}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-warm-800/50 rounded-lg border border-dashed border-warm-600">
                <div className="text-center text-warm-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                  <p className="text-sm">{t('visualPrompt.previewPlaceholder', 'Your generated component will appear here')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'gallery' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${filterCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400'}`}
            >
              {t('visualPrompt.allCategories', 'All')}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterCategory(c.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${filterCategory === c.id ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
          {gallery.length === 0 ? (
            <div className="text-center py-12 text-warm-500">
              <p>{t('visualPrompt.emptyGallery', 'No components in gallery yet. Generate some components to see them here.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gallery.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => handleViewComponent(comp.id)}
                  className="bg-warm-800 border border-warm-700 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{comp.componentName}</span>
                    <span className="text-xs bg-warm-700 px-2 py-0.5 rounded">{comp.category}</span>
                  </div>
                  <p className="text-xs text-warm-400 line-clamp-2 mb-3">{comp.promptText}</p>
                  <div className="flex items-center gap-3 text-xs text-warm-500">
                    <span>{comp.viewCount} {t('visualPrompt.views', 'views')}</span>
                    <span>{comp.forkCount} {t('visualPrompt.forks', 'forks')}</span>
                    <span>{comp.likeCount} {t('visualPrompt.likes', 'likes')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'components' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${filterCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400'}`}
            >
              {t('visualPrompt.allCategories', 'All')}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterCategory(c.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${filterCategory === c.id ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
          {components.length === 0 ? (
            <div className="text-center py-12 text-warm-500">
              <p>{t('visualPrompt.noComponents', 'No components yet. Start by generating one!')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {components.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => handleViewComponent(comp.id)}
                  className="bg-warm-800 border border-warm-700 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{comp.componentName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${comp.status === 'generated' ? 'bg-green-900/30 text-green-400' : 'bg-warm-700 text-warm-400'}`}>{comp.status}</span>
                      <span className="text-xs bg-warm-700 px-2 py-0.5 rounded">{comp.category}</span>
                    </div>
                    <p className="text-xs text-warm-400 line-clamp-1">{comp.promptText}</p>
                  </div>
                  <div className="text-xs text-warm-500 text-right">
                    <div>{comp.iterationCount} {t('visualPrompt.iterations', 'iterations')}</div>
                    <div>{new Date(comp.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-warm-800 border border-warm-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalComponents}</div>
              <div className="text-sm text-warm-400">{t('visualPrompt.stats.totalComponents', 'Total Components')}</div>
            </div>
            <div className="bg-warm-800 border border-warm-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalIterations}</div>
              <div className="text-sm text-warm-400">{t('visualPrompt.stats.totalIterations', 'Total Iterations')}</div>
            </div>
            <div className="bg-warm-800 border border-warm-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalTokensUsed.toLocaleString()}</div>
              <div className="text-sm text-warm-400">{t('visualPrompt.stats.tokensUsed', 'Tokens Used')}</div>
            </div>
            <div className="bg-warm-800 border border-warm-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
              <div className="text-sm text-warm-400">{t('visualPrompt.stats.totalCost', 'Total Cost')}</div>
            </div>
            <div className="bg-warm-800 border border-warm-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.avgGenerationTimeMs}ms</div>
              <div className="text-sm text-warm-400">{t('visualPrompt.stats.avgGenTime', 'Avg Generation Time')}</div>
            </div>
            <div className="bg-warm-800 border border-warm-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.categoriesUsed}</div>
              <div className="text-sm text-warm-400">{t('visualPrompt.stats.categoriesUsed', 'Categories Used')}</div>
            </div>
            <div className="bg-warm-800 border border-warm-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.exportedCount}</div>
              <div className="text-sm text-warm-400">{t('visualPrompt.stats.exported', 'Exported')}</div>
            </div>
            <div className="bg-warm-800 border border-warm-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.publicCount}</div>
              <div className="text-sm text-warm-400">{t('visualPrompt.stats.public', 'Public')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
