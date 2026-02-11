import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getUpgradeStatus,
  updateSettings,
  getPerformanceMetrics,
  getVectorSearchStats,
  getDotNetFeatures,
  runBenchmark,
  type PlatformStatus,
  type PerformanceMetrics,
  type VectorSearchStats,
  type DotNetFeature,
  type BenchmarkResults,
} from '../api/platformupgrade'

export default function PlatformUpgradePage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<PlatformStatus | null>(null)
  const [perf, setPerf] = useState<PerformanceMetrics | null>(null)
  const [vectorStats, setVectorStats] = useState<VectorSearchStats | null>(null)
  const [features, setFeatures] = useState<DotNetFeature[]>([])
  const [benchmark, setBenchmark] = useState<BenchmarkResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [benchmarking, setBenchmarking] = useState(false)
  const [tab, setTab] = useState<'overview' | 'performance' | 'vector' | 'features' | 'benchmark'>('overview')

  const loadAll = async () => {
    setLoading(true)
    try {
      const [s, p, v, f] = await Promise.all([
        getUpgradeStatus(),
        getPerformanceMetrics(),
        getVectorSearchStats(),
        getDotNetFeatures(),
      ])
      setStatus(s)
      setPerf(p)
      setVectorStats(v)
      setFeatures(f)
    } catch {
      alert(t('platformUpgrade.error.load'))
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (field: string, value: boolean) => {
    try {
      await updateSettings({ [field]: value })
      if (status) setStatus({ ...status, [field]: value })
    } catch {
      alert(t('platformUpgrade.error.updateSettings'))
    }
  }

  const handleBenchmark = async () => {
    setBenchmarking(true)
    try {
      const result = await runBenchmark()
      setBenchmark(result)
    } catch {
      alert(t('platformUpgrade.error.benchmark'))
    } finally {
      setBenchmarking(false)
    }
  }

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'Data & AI': return 'bg-purple-100 text-purple-800'
      case 'Query': return 'bg-blue-100 text-blue-800'
      case 'Data': return 'bg-green-100 text-green-800'
      case 'Runtime': return 'bg-orange-100 text-orange-800'
      case 'Language': return 'bg-yellow-100 text-yellow-800'
      case 'DevTools': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{t('platformUpgrade.title')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('platformUpgrade.description')}</p>
      </div>

      {!status ? (
        <button onClick={loadAll} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
          {loading ? t('platformUpgrade.loading') : t('platformUpgrade.load')}
        </button>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{status.currentDotNetVersion}</div>
              <div className="text-sm text-gray-500">.NET</div>
            </div>
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{status.currentEfCoreVersion}</div>
              <div className="text-sm text-gray-500">EF Core</div>
            </div>
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">C# {status.currentCSharpVersion}</div>
              <div className="text-sm text-gray-500">{t('platformUpgrade.language')}</div>
            </div>
          </div>

          <div className="flex gap-2 border-b pb-2">
            {(['overview', 'performance', 'vector', 'features', 'benchmark'] as const).map((tb) => (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={`px-4 py-2 text-sm rounded-t-lg ${tab === tb ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t(`platformUpgrade.tab.${tb}`)}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('platformUpgrade.featureFlags')}</h3>
              <div className="space-y-3">
                {([
                  { key: 'vectorSearchEnabled' as const, label: t('platformUpgrade.vectorSearch'), desc: t('platformUpgrade.vectorSearchDesc') },
                  { key: 'nativeJsonColumnsEnabled' as const, label: t('platformUpgrade.nativeJson'), desc: t('platformUpgrade.nativeJsonDesc') },
                  { key: 'leftJoinLinqEnabled' as const, label: t('platformUpgrade.leftJoinLinq'), desc: t('platformUpgrade.leftJoinLinqDesc') },
                  { key: 'performanceProfilingEnabled' as const, label: t('platformUpgrade.profiling'), desc: t('platformUpgrade.profilingDesc') },
                ]).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between bg-white border rounded-lg p-4">
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-gray-500">{desc}</div>
                    </div>
                    <button
                      onClick={() => handleToggle(key, !status[key])}
                      className={`w-12 h-6 rounded-full transition-colors ${status[key] ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${status[key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'performance' && perf && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{perf.avgQueryTimeMs}ms</div>
                  <div className="text-sm text-gray-500">{t('platformUpgrade.perf.avgQuery')}</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{perf.p95QueryTimeMs}ms</div>
                  <div className="text-sm text-gray-500">P95</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{perf.p99QueryTimeMs}ms</div>
                  <div className="text-sm text-gray-500">P99</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{perf.totalQueriesExecuted.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{t('platformUpgrade.perf.totalQueries')}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{perf.cacheHitRate}%</div>
                  <div className="text-sm text-gray-500">{t('platformUpgrade.perf.cacheHit')}</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{perf.memoryUsageMb} MB</div>
                  <div className="text-sm text-gray-500">{t('platformUpgrade.perf.memory')}</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{perf.cpuUsagePercent}%</div>
                  <div className="text-sm text-gray-500">{t('platformUpgrade.perf.cpu')}</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{perf.throughputRequestsPerSec}</div>
                  <div className="text-sm text-gray-500">{t('platformUpgrade.perf.throughput')}</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'vector' && vectorStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{vectorStats.vectorIndexCount}</div>
                  <div className="text-sm text-gray-500">{t('platformUpgrade.vector.indexes')}</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{vectorStats.vectorDimensions}</div>
                  <div className="text-sm text-gray-500">{t('platformUpgrade.vector.dimensions')}</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{vectorStats.vectorSearchAvgMs}ms</div>
                  <div className="text-sm text-gray-500">{t('platformUpgrade.vector.avgSearch')}</div>
                </div>
              </div>
              <div className={`p-4 rounded-lg border ${vectorStats.enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${vectorStats.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="font-medium">{vectorStats.enabled ? t('platformUpgrade.vector.enabled') : t('platformUpgrade.vector.disabled')}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{t('platformUpgrade.vector.description')}</p>
              </div>
            </div>
          )}

          {tab === 'features' && (
            <div className="space-y-3">
              {features.map((f, i) => (
                <div key={i} className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{f.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${categoryColor(f.category)}`}>{f.category}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${f.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{f.status}</span>
                  </div>
                  <div className="text-sm text-gray-500">{f.description}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'benchmark' && (
            <div className="space-y-4">
              <button
                onClick={handleBenchmark}
                disabled={benchmarking}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {benchmarking ? t('platformUpgrade.benchmarking') : t('platformUpgrade.runBenchmark')}
              </button>
              {benchmark && (
                <div className="space-y-3">
                  {[
                    { label: t('platformUpgrade.bench.query'), old: `${benchmark.queryBenchmark.net9Ms}ms`, new_: `${benchmark.queryBenchmark.net10Ms}ms`, imp: benchmark.queryBenchmark.improvement },
                    { label: t('platformUpgrade.bench.serialization'), old: `${benchmark.serializationBenchmark.net9Ms}ms`, new_: `${benchmark.serializationBenchmark.net10Ms}ms`, imp: benchmark.serializationBenchmark.improvement },
                    { label: t('platformUpgrade.bench.startup'), old: `${benchmark.startupBenchmark.net9Ms}ms`, new_: `${benchmark.startupBenchmark.net10Ms}ms`, imp: benchmark.startupBenchmark.improvement },
                    { label: t('platformUpgrade.bench.memory'), old: `${benchmark.memoryBenchmark.net9Mb} MB`, new_: `${benchmark.memoryBenchmark.net10Mb} MB`, imp: benchmark.memoryBenchmark.improvement },
                  ].map((row, i) => (
                    <div key={i} className="bg-white border rounded-lg p-4">
                      <div className="font-medium mb-2">{row.label}</div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-gray-500">.NET 9:</span> <span className="font-mono">{row.old}</span>
                        </div>
                        <span className="text-gray-300">→</span>
                        <div className="text-sm">
                          <span className="text-gray-500">.NET 10:</span> <span className="font-mono text-green-600">{row.new_}</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">{row.imp} faster</span>
                      </div>
                    </div>
                  ))}
                  <div className="bg-white border rounded-lg p-4">
                    <div className="font-medium mb-2">{t('platformUpgrade.bench.vectorSearch')}</div>
                    <div className="flex gap-4 text-sm">
                      <span>Avg: <span className="font-mono text-green-600">{benchmark.vectorSearchBenchmark.avgMs}ms</span></span>
                      <span>P95: <span className="font-mono">{benchmark.vectorSearchBenchmark.p95Ms}ms</span></span>
                      <span>Throughput: <span className="font-mono text-blue-600">{benchmark.vectorSearchBenchmark.throughput}</span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
