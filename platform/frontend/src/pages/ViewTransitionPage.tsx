import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { ViewTransitionConfig, TransitionPreset, EasingFunction, GenerateCssResult, DemoPage, ViewTransitionStats } from '../api/viewtransition'
import { getViewTransitionConfig, updateViewTransitionConfig, getTransitionPresets, getEasingFunctions, generateCss, getDemoPages, getViewTransitionStats } from '../api/viewtransition'

type Tab = 'presets' | 'configure' | 'preview' | 'stats'

export default function ViewTransitionPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('presets')
  const [config, setConfig] = useState<ViewTransitionConfig | null>(null)
  const [presets, setPresets] = useState<TransitionPreset[]>([])
  const [easings, setEasings] = useState<EasingFunction[]>([])
  const [cssResult, setCssResult] = useState<GenerateCssResult | null>(null)
  const [demoPages, setDemoPages] = useState<DemoPage[]>([])
  const [stats, setStats] = useState<ViewTransitionStats | null>(null)
  const [activeDemoPage, setActiveDemoPage] = useState('home')
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    getViewTransitionConfig().then(setConfig).catch(() => {})
    getTransitionPresets().then(setPresets).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'configure') getEasingFunctions().then(setEasings).catch(() => {})
    if (tab === 'preview') getDemoPages().then(setDemoPages).catch(() => {})
    if (tab === 'stats') getViewTransitionStats().then(setStats).catch(() => {})
  }, [tab])

  const handleSelectPreset = async (presetId: string) => {
    try {
      await updateViewTransitionConfig({ transitionPreset: presetId })
      setConfig((prev) => prev ? { ...prev, transitionPreset: presetId } : prev)
    } catch { /* ignore */ }
  }

  const handleToggle = async (key: string, value: boolean) => {
    try {
      await updateViewTransitionConfig({ [key]: value } as Partial<ViewTransitionConfig>)
      setConfig((prev) => prev ? { ...prev, [key]: value } : prev)
    } catch { /* ignore */ }
  }

  const handleGenerateCss = async () => {
    if (!config) return
    try {
      const result = await generateCss(config.transitionPreset, config.transitionDurationMs, config.easingFunction)
      setCssResult(result)
    } catch { /* ignore */ }
  }

  const handleDemoNavigate = (pageId: string) => {
    setAnimating(true)
    setTimeout(() => {
      setActiveDemoPage(pageId)
      setTimeout(() => setAnimating(false), config?.transitionDurationMs || 300)
    }, 50)
  }

  const categoryColors: Record<string, string> = {
    'Basic': 'bg-green-900/30 text-green-400',
    'Combined': 'bg-blue-900/30 text-blue-400',
    'Advanced': 'bg-purple-900/30 text-purple-400',
    'Framer Motion': 'bg-orange-900/30 text-orange-400',
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('viewTransition.title', 'View Transitions')}</h3>
      <p className="text-gray-400 text-sm mb-6">{t('viewTransition.subtitle', 'Add smooth animated page transitions to generated projects')}</p>

      <div className="flex gap-2 mb-6">
        {(['presets', 'configure', 'preview', 'stats'] as Tab[]).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t2 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t(`viewTransition.tabs.${t2}`, t2.charAt(0).toUpperCase() + t2.slice(1))}
          </button>
        ))}
      </div>

      {tab === 'presets' && (
        <div className="space-y-4">
          {['Basic', 'Combined', 'Advanced', 'Framer Motion'].map((category) => {
            const categoryPresets = presets.filter((p) => p.category === category)
            if (categoryPresets.length === 0) return null
            return (
              <div key={category}>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[category] || ''}`}>{category}</span>
                  {category === 'Framer Motion' && <span className="text-xs text-gray-500">{t('viewTransition.requiresFramer', 'Requires Framer Motion')}</span>}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryPresets.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`bg-gray-800 border rounded-lg p-4 cursor-pointer transition-all ${
                        config?.transitionPreset === preset.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{preset.name}</span>
                        <span className="text-xs text-gray-500">{preset.duration}ms</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{preset.description}</p>
                      <code className="text-xs text-gray-500 font-mono">{preset.css}</code>
                      {config?.transitionPreset === preset.id && (
                        <div className="mt-2 text-xs text-blue-400 font-medium">{t('viewTransition.selected', 'Selected')}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'configure' && config && (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">{t('viewTransition.duration', 'Transition Duration')}</h4>
            <div className="flex items-center gap-4 bg-gray-800 border border-gray-700 rounded-lg p-4">
              <input
                type="range"
                min={100}
                max={1000}
                step={50}
                value={config.transitionDurationMs}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  setConfig({ ...config, transitionDurationMs: val })
                  updateViewTransitionConfig({ transitionDurationMs: val })
                }}
                className="flex-1"
              />
              <span className="text-sm font-mono w-16 text-right">{config.transitionDurationMs}ms</span>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">{t('viewTransition.easing', 'Easing Function')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {easings.map((easing) => (
                <button
                  key={easing.id}
                  onClick={() => {
                    updateViewTransitionConfig({ easingFunction: easing.id })
                    setConfig({ ...config, easingFunction: easing.id })
                  }}
                  className={`p-3 rounded-lg border text-left ${
                    config.easingFunction === easing.id ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-800'
                  }`}
                >
                  <div className="font-medium text-sm">{easing.name}</div>
                  <div className="text-xs text-gray-400">{easing.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">{t('viewTransition.options', 'Animation Options')}</h4>
            <div className="space-y-3">
              {([
                { key: 'enableViewTransitions' as const, label: t('viewTransition.enableVT', 'View Transitions API'), desc: t('viewTransition.enableVTDesc', 'Use browser-native View Transitions for zero-JS-cost page animations') },
                { key: 'enableFramerMotion' as const, label: t('viewTransition.enableFM', 'Framer Motion'), desc: t('viewTransition.enableFMDesc', 'Include Framer Motion for spring physics and layout animations') },
                { key: 'enablePageTransitions' as const, label: t('viewTransition.enablePage', 'Page Transitions'), desc: t('viewTransition.enablePageDesc', 'Animate route changes between pages') },
                { key: 'enableComponentAnimations' as const, label: t('viewTransition.enableComp', 'Component Animations'), desc: t('viewTransition.enableCompDesc', 'Add enter/exit animations to individual components') },
                { key: 'enableLoadingAnimations' as const, label: t('viewTransition.enableLoading', 'Loading Animations'), desc: t('viewTransition.enableLoadingDesc', 'Animated skeleton loaders and spinners') },
              ]).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div>
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs text-gray-400">{desc}</div>
                  </div>
                  <button
                    onClick={() => handleToggle(key, !config[key])}
                    className={`w-12 h-6 rounded-full transition-colors ${config[key] ? 'bg-blue-600' : 'bg-gray-600'}`}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${config[key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'preview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">{t('viewTransition.currentPreset', 'Current Preset')}</div>
              <div className="font-medium">{config?.transitionPreset || 'fade'} — {config?.transitionDurationMs || 300}ms — {config?.easingFunction || 'ease-in-out'}</div>
            </div>
            <button onClick={handleGenerateCss} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              {t('viewTransition.generateCss', 'Generate CSS')}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">{t('viewTransition.liveDemo', 'Live Demo')}</h4>
              <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                <div className="flex gap-1 p-2 bg-gray-800 border-b border-gray-700">
                  {demoPages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => handleDemoNavigate(page.id)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        activeDemoPage === page.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {page.name}
                    </button>
                  ))}
                </div>
                <div className="h-48 flex items-center justify-center relative overflow-hidden">
                  {demoPages.filter((p) => p.id === activeDemoPage).map((page) => (
                    <div
                      key={page.id}
                      className="text-center transition-all"
                      style={{
                        opacity: animating ? 0 : 1,
                        transform: animating ? 'translateY(10px)' : 'translateY(0)',
                        transition: `all ${config?.transitionDurationMs || 300}ms ${config?.easingFunction || 'ease-in-out'}`,
                      }}
                    >
                      <div className="w-16 h-16 rounded-xl mx-auto mb-3" style={{ backgroundColor: page.color }} />
                      <div className="font-medium">{page.name}</div>
                      <div className="text-xs text-gray-400">{page.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">{t('viewTransition.generatedCode', 'Generated CSS')}</h4>
              {cssResult ? (
                <div className="space-y-3">
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-2">{t('viewTransition.keyframes', 'Keyframe Animation')}</div>
                    <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{cssResult.css}</pre>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-2">{t('viewTransition.viewTransitionApi', 'View Transition API')}</div>
                    <pre className="text-sm text-blue-400 font-mono whitespace-pre-wrap">{cssResult.viewTransitionCss}</pre>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 bg-gray-800/50 rounded-lg border border-dashed border-gray-600">
                  <p className="text-sm text-gray-500">{t('viewTransition.cssPlaceholder', 'Click "Generate CSS" to see the output')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.currentPreset}</div>
              <div className="text-sm text-gray-400">{t('viewTransition.stats.preset', 'Current Preset')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.durationMs}ms</div>
              <div className="text-sm text-gray-400">{t('viewTransition.stats.duration', 'Duration')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.browserSupport}</div>
              <div className="text-sm text-gray-400">{t('viewTransition.stats.browserSupport', 'Browser Support')}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('viewTransition.stats.framerMotion', 'Framer Motion')}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${stats.framerMotionEnabled ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                  {stats.framerMotionEnabled ? t('viewTransition.enabled', 'Enabled') : t('viewTransition.disabled', 'Disabled')}
                </span>
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('viewTransition.stats.projects', 'Projects with Transitions')}</span>
                <span className="font-bold">{stats.projectsWithTransitions}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
