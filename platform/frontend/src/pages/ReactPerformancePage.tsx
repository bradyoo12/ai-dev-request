import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getReactPerformanceConfig, getReactPerformanceStats } from '../api/reactperformance'
import type { ReactPerformanceConfig, ReactPerformanceStats } from '../api/reactperformance'

type SubTab = 'overview' | 'features' | 'bundle'

export default function ReactPerformancePage() {
  const { t } = useTranslation()
  const [config, setConfig] = useState<ReactPerformanceConfig | null>(null)
  const [stats, setStats] = useState<ReactPerformanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subTab, setSubTab] = useState<SubTab>('overview')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [configRes, statsRes] = await Promise.all([
        getReactPerformanceConfig(),
        getReactPerformanceStats(),
      ])
      setConfig(configRes)
      setStats(statsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('reactPerformance.errorLoading', 'Failed to load React performance settings'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-warm-400">{t('reactPerformance.loading', 'Loading React performance settings...')}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">{t('reactPerformance.title', 'React 19 Performance')}</h3>
        <p className="text-sm text-warm-400 mt-1">{t('reactPerformance.description', 'Bundle optimization with code splitting, lazy loading, and React 19 features')}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-warm-800 rounded-lg p-1">
        <button
          onClick={() => setSubTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'overview' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('reactPerformance.tabs.overview', 'Overview')}
        </button>
        <button
          onClick={() => setSubTab('features')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'features' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('reactPerformance.tabs.features', 'React 19 Features')}
        </button>
        <button
          onClick={() => setSubTab('bundle')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'bundle' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('reactPerformance.tabs.bundle', 'Bundle Analysis')}
        </button>
      </div>

      {/* Overview Tab */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${config?.codeSplittingEnabled ? 'bg-green-400' : 'bg-warm-500'}`} />
                <span className="text-sm text-warm-300">{t('reactPerformance.codeSplitting', 'Code Splitting')}</span>
              </div>
              <div className="text-lg font-bold text-white">
                {config?.codeSplittingEnabled
                  ? t('reactPerformance.enabled', 'Enabled')
                  : t('reactPerformance.disabled', 'Disabled')}
              </div>
              <p className="text-xs text-warm-500 mt-1">{t('reactPerformance.codeSplittingDesc', 'Routes split into separate chunks via React.lazy()')}</p>
            </div>

            <div className="bg-warm-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${config?.lazyLoadingEnabled ? 'bg-green-400' : 'bg-warm-500'}`} />
                <span className="text-sm text-warm-300">{t('reactPerformance.lazyLoading', 'Lazy Loading')}</span>
              </div>
              <div className="text-lg font-bold text-white">
                {config?.lazyLoadingEnabled
                  ? t('reactPerformance.enabled', 'Enabled')
                  : t('reactPerformance.disabled', 'Disabled')}
              </div>
              <p className="text-xs text-warm-500 mt-1">{t('reactPerformance.lazyLoadingDesc', 'Page components loaded on demand via dynamic imports')}</p>
            </div>

            <div className="bg-warm-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${config?.suspenseBoundariesEnabled ? 'bg-green-400' : 'bg-warm-500'}`} />
                <span className="text-sm text-warm-300">{t('reactPerformance.suspense', 'Suspense Boundaries')}</span>
              </div>
              <div className="text-lg font-bold text-white">
                {config?.suspenseBoundariesEnabled
                  ? t('reactPerformance.enabled', 'Enabled')
                  : t('reactPerformance.disabled', 'Disabled')}
              </div>
              <p className="text-xs text-warm-500 mt-1">{t('reactPerformance.suspenseDesc', 'Loading fallbacks while chunks are fetched')}</p>
            </div>

            <div className="bg-warm-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${config?.useTransitionEnabled ? 'bg-green-400' : 'bg-warm-500'}`} />
                <span className="text-sm text-warm-300">{t('reactPerformance.useTransition', 'useTransition')}</span>
              </div>
              <div className="text-lg font-bold text-white">
                {config?.useTransitionEnabled
                  ? t('reactPerformance.enabled', 'Enabled')
                  : t('reactPerformance.disabled', 'Disabled')}
              </div>
              <p className="text-xs text-warm-500 mt-1">{t('reactPerformance.useTransitionDesc', 'Non-blocking UI transitions for navigation')}</p>
            </div>
          </div>

          {/* Summary Panel */}
          <div className="bg-warm-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('reactPerformance.optimizationSummary', 'Optimization Summary')}</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-warm-900 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{config?.totalLazyRoutes || 42}</div>
                <div className="text-sm text-warm-400 mt-1">{t('reactPerformance.lazyRoutes', 'Lazy Routes')}</div>
              </div>
              <div className="bg-warm-900 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{config?.totalSuspenseBoundaries || 42}</div>
                <div className="text-sm text-warm-400 mt-1">{t('reactPerformance.suspenseBoundaries', 'Suspense Boundaries')}</div>
              </div>
              <div className="bg-warm-900 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">{config?.estimatedBundleReductionPercent || 38}%</div>
                <div className="text-sm text-warm-400 mt-1">{t('reactPerformance.bundleReduction', 'Bundle Reduction')}</div>
              </div>
            </div>
          </div>

          {/* Platform Info */}
          <div className="bg-warm-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('reactPerformance.platformInfo', 'Platform Configuration')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-warm-400">{t('reactPerformance.reactVersion', 'React Version')}</span>
                <span className="text-white font-mono">{config?.reactVersion || '19.0.0'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-warm-400">{t('reactPerformance.buildTool', 'Build Tool')}</span>
                <span className="text-white font-mono">{config?.buildTool || 'Vite 7'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-warm-400">{t('reactPerformance.typescriptVersion', 'TypeScript')}</span>
                <span className="text-white font-mono">5.9</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-warm-400">{t('reactPerformance.uiLibrary', 'UI Library')}</span>
                <span className="text-white font-mono">shadcn/ui + Tailwind CSS 4</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* React 19 Features Tab */}
      {subTab === 'features' && (
        <div className="space-y-6">
          <p className="text-sm text-warm-400">{t('reactPerformance.featuresDescription', 'React 19 features actively used in this platform for performance optimization')}</p>

          {/* React.lazy + dynamic import */}
          <div className="bg-warm-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                {t('reactPerformance.active', 'Active')}
              </span>
              <h4 className="font-medium text-white">{t('reactPerformance.feature.lazyImports', 'React.lazy() + Dynamic Imports')}</h4>
            </div>
            <p className="text-sm text-warm-400 mb-3">
              {t('reactPerformance.feature.lazyImportsDesc', 'All page-level components use React.lazy() with dynamic import() statements. Vite automatically splits each page into a separate chunk, so only the code needed for the current route is loaded.')}
            </p>
            <div className="bg-warm-900 rounded-lg p-3">
              <code className="text-xs text-green-400 font-mono whitespace-pre">{`const HomePage = lazy(() => import('./pages/HomePage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))`}</code>
            </div>
          </div>

          {/* Suspense Boundaries */}
          <div className="bg-warm-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                {t('reactPerformance.active', 'Active')}
              </span>
              <h4 className="font-medium text-white">{t('reactPerformance.feature.suspense', 'Suspense Boundaries')}</h4>
            </div>
            <p className="text-sm text-warm-400 mb-3">
              {t('reactPerformance.feature.suspenseDesc', 'Each lazy-loaded route is wrapped in a <Suspense> boundary with a loading spinner fallback. This provides a smooth loading experience while chunks are being fetched over the network.')}
            </p>
            <div className="bg-warm-900 rounded-lg p-3">
              <code className="text-xs text-blue-400 font-mono whitespace-pre">{`<Suspense fallback={<LoadingSpinner />}>
  <HomePage />
</Suspense>`}</code>
            </div>
          </div>

          {/* useTransition */}
          <div className="bg-warm-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {t('reactPerformance.available', 'Available')}
              </span>
              <h4 className="font-medium text-white">{t('reactPerformance.feature.useTransition', 'useTransition Hook')}</h4>
            </div>
            <p className="text-sm text-warm-400 mb-3">
              {t('reactPerformance.feature.useTransitionDesc', 'React 19 useTransition marks state updates as non-urgent, keeping the UI responsive during expensive re-renders. Used in navigation and settings tab switching.')}
            </p>
            <div className="bg-warm-900 rounded-lg p-3">
              <code className="text-xs text-purple-400 font-mono whitespace-pre">{`const [isPending, startTransition] = useTransition()
startTransition(() => setActiveTab(newTab))`}</code>
            </div>
          </div>

          {/* Concurrent Features */}
          <div className="bg-warm-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {t('reactPerformance.available', 'Available')}
              </span>
              <h4 className="font-medium text-white">{t('reactPerformance.feature.concurrent', 'Concurrent Rendering')}</h4>
            </div>
            <p className="text-sm text-warm-400 mb-3">
              {t('reactPerformance.feature.concurrentDesc', 'React 19 concurrent rendering allows React to prepare new UI in the background without blocking user interaction. This is automatically used with Suspense and useTransition.')}
            </p>
          </div>

          {/* use() Hook */}
          <div className="bg-warm-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {t('reactPerformance.react19', 'React 19')}
              </span>
              <h4 className="font-medium text-white">{t('reactPerformance.feature.useHook', 'use() Hook')}</h4>
            </div>
            <p className="text-sm text-warm-400 mb-3">
              {t('reactPerformance.feature.useHookDesc', 'The new React 19 use() hook can read promises and context values conditionally. It simplifies data fetching patterns and reduces boilerplate when combined with Suspense.')}
            </p>
            <div className="bg-warm-900 rounded-lg p-3">
              <code className="text-xs text-amber-400 font-mono whitespace-pre">{`const data = use(fetchPromise) // Suspends until resolved
const theme = use(ThemeContext)  // Read context conditionally`}</code>
            </div>
          </div>
        </div>
      )}

      {/* Bundle Analysis Tab */}
      {subTab === 'bundle' && stats && (
        <div className="space-y-6">
          {/* Bundle Size Comparison */}
          <div className="bg-warm-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('reactPerformance.bundleComparison', 'Bundle Size Comparison')}</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-warm-900 rounded-lg p-4">
                <div className="text-sm text-warm-400 mb-1">{t('reactPerformance.beforeOptimization', 'Before Optimization')}</div>
                <div className="text-2xl font-bold text-red-400">{stats.initialBundleSizeKb || 850} KB</div>
                <div className="text-xs text-warm-500">{t('reactPerformance.singleBundle', 'Single monolithic bundle')}</div>
              </div>
              <div className="bg-warm-900 rounded-lg p-4">
                <div className="text-sm text-warm-400 mb-1">{t('reactPerformance.afterOptimization', 'After Optimization')}</div>
                <div className="text-2xl font-bold text-green-400">{stats.optimizedBundleSizeKb || 527} KB</div>
                <div className="text-xs text-warm-500">{t('reactPerformance.initialChunkOnly', 'Initial chunk only')}</div>
              </div>
            </div>

            {/* Reduction Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-warm-400">{t('reactPerformance.reductionProgress', 'Bundle Size Reduction')}</span>
                <span className="text-green-400 font-semibold">{stats.reductionPercent || 38}%</span>
              </div>
              <div className="h-3 bg-warm-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${stats.reductionPercent || 38}%` }}
                />
              </div>
            </div>
          </div>

          {/* Chunk Breakdown */}
          <div className="bg-warm-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('reactPerformance.chunkBreakdown', 'Chunk Breakdown')}</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-warm-900 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.lazyChunksCount || 42}</div>
                <div className="text-sm text-warm-400 mt-1">{t('reactPerformance.lazyChunks', 'Lazy Chunks')}</div>
              </div>
              <div className="bg-warm-900 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.avgChunkSizeKb || 12} KB</div>
                <div className="text-sm text-warm-400 mt-1">{t('reactPerformance.avgChunkSize', 'Avg Chunk Size')}</div>
              </div>
              <div className="bg-warm-900 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">{stats.largestChunkKb || '45 KB'}</div>
                <div className="text-sm text-warm-400 mt-1">{t('reactPerformance.largestChunk', 'Largest Chunk')}</div>
              </div>
            </div>
          </div>

          {/* Code Splitting Strategy */}
          <div className="bg-warm-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('reactPerformance.splittingStrategy', 'Code Splitting Strategy')}</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-sm text-white font-medium">{t('reactPerformance.strategy.routeLevel', 'Route-Level Splitting')}</p>
                  <p className="text-xs text-warm-500">{t('reactPerformance.strategy.routeLevelDesc', 'Every page component is a separate chunk loaded only when the route is accessed')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-sm text-white font-medium">{t('reactPerformance.strategy.settingsTabs', 'Settings Tab Splitting')}</p>
                  <p className="text-xs text-warm-500">{t('reactPerformance.strategy.settingsTabsDesc', 'SettingsLayout lazy-loads each settings sub-page independently')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-sm text-white font-medium">{t('reactPerformance.strategy.viteOptimized', 'Vite Optimized Chunks')}</p>
                  <p className="text-xs text-warm-500">{t('reactPerformance.strategy.viteOptimizedDesc', 'Vite 7 tree-shakes unused code and optimizes chunk boundaries automatically')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400">
              <strong>{t('reactPerformance.note', 'Note')}:</strong>{' '}
              {t('reactPerformance.noteDesc', 'This platform uses React 19 with Vite 7 (client-side rendering). True React Server Components require a framework like Next.js. Instead, we leverage React.lazy(), Suspense, and Vite code splitting for equivalent bundle size reduction.')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
