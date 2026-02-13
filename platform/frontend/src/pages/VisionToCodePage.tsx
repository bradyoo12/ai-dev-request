import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../api/visiontocode'

type Tab = 'generate' | 'history' | 'image-types' | 'stats'

export default function VisionToCodePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('generate')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{t('vision.title', 'Vision to Code')}</h2>
        <p className="text-warm-400 mt-1">{t('vision.subtitle', 'Generate React components from screenshots, mockups, and hand-drawn sketches')}</p>
      </div>
      <div className="flex gap-2">
        {(['generate', 'history', 'image-types', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-300 hover:bg-warm-600'}`}>
            {t(`vision.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1).replace('-', ' '))}
          </button>
        ))}
      </div>
      {tab === 'generate' && <GenerateTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'image-types' && <ImageTypesTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function GenerateTab() {
  const { t } = useTranslation()
  const [imageName, setImageName] = useState('')
  const [imageType, setImageType] = useState('screenshot')
  const [framework, setFramework] = useState('react')
  const [stylingEngine, setStylingEngine] = useState('tailwind')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<api.GenerateResponse | null>(null)

  const handleGenerate = async () => {
    if (!imageName.trim()) return
    setRunning(true)
    try {
      const res = await api.generate(imageName, imageType, framework, stylingEngine)
      setResult(res)
    } catch { /* ignore */ }
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">{t('vision.generateTitle', 'Generate Code from Image')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('vision.imageName', 'Image / File Name')}</label>
            <input value={imageName} onChange={e => setImageName(e.target.value)} placeholder="dashboard-screenshot.png" className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('vision.imageType', 'Image Type')}</label>
            <select value={imageType} onChange={e => setImageType(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="screenshot">{t('vision.typeScreenshot', 'Screenshot')}</option>
              <option value="mockup">{t('vision.typeMockup', 'Mockup / Figma')}</option>
              <option value="sketch">{t('vision.typeSketch', 'Hand-drawn Sketch')}</option>
              <option value="wireframe">{t('vision.typeWireframe', 'Wireframe')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('vision.framework', 'Framework')}</label>
            <select value={framework} onChange={e => setFramework(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="react">React</option>
              <option value="vue">Vue</option>
              <option value="html">HTML</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('vision.styling', 'Styling Engine')}</label>
            <select value={stylingEngine} onChange={e => setStylingEngine(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="tailwind">Tailwind CSS</option>
              <option value="css-modules">CSS Modules</option>
              <option value="styled-components">Styled Components</option>
            </select>
          </div>
        </div>
        <button onClick={handleGenerate} disabled={running || !imageName.trim()} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          {running ? t('vision.generating', 'Generating...') : t('vision.generateBtn', 'Generate Code')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{result.result.componentsGenerated}</div>
              <div className="text-sm text-warm-400">{t('vision.components', 'Components')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{result.result.linesOfCode}</div>
              <div className="text-sm text-warm-400">{t('vision.linesOfCode', 'Lines of Code')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{Math.round(result.result.styleMatchScore * 100)}%</div>
              <div className="text-sm text-warm-400">{t('vision.styleMatch', 'Style Match')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{result.result.processingMs}ms</div>
              <div className="text-sm text-warm-400">{t('vision.processing', 'Processing Time')}</div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">{t('vision.generatedComponents', 'Generated Components')}</h4>
            <div className="space-y-2">
              {result.generatedComponents.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-warm-900 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-xs rounded ${c.type === 'layout' ? 'bg-blue-600 text-white' : c.type === 'primitive' ? 'bg-purple-600 text-white' : 'bg-green-600 text-white'}`}>{c.type}</span>
                    <span className="text-white font-medium">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-warm-400">{c.lines} lines</span>
                    <span className={`font-medium ${c.confidence > 0.85 ? 'text-green-400' : c.confidence > 0.7 ? 'text-yellow-400' : 'text-red-400'}`}>{Math.round(c.confidence * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">{t('vision.styleAnalysis', 'Style Analysis')}</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-warm-900 rounded">
                  <span className="text-warm-400 text-sm">{t('vision.primaryColor', 'Primary Color')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: result.styleAnalysis.primaryColor }} />
                    <span className="text-white text-sm font-mono">{result.styleAnalysis.primaryColor}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-warm-900 rounded">
                  <span className="text-warm-400 text-sm">{t('vision.secondaryColor', 'Secondary Color')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: result.styleAnalysis.secondaryColor }} />
                    <span className="text-white text-sm font-mono">{result.styleAnalysis.secondaryColor}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-warm-900 rounded">
                  <span className="text-warm-400 text-sm">{t('vision.font', 'Font Family')}</span>
                  <span className="text-white text-sm">{result.styleAnalysis.fontFamily}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-warm-900 rounded">
                  <span className="text-warm-400 text-sm">{t('vision.borderRadius', 'Border Radius')}</span>
                  <span className="text-white text-sm">{result.styleAnalysis.borderRadius}</span>
                </div>
              </div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">{t('vision.accuracyBreakdown', 'Accuracy Breakdown')}</h4>
              <div className="space-y-2">
                {result.accuracyBreakdown.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-warm-900 rounded text-sm">
                    <span className="text-warm-400">{a.metric}</span>
                    <div className="flex items-center gap-3">
                      <span className={`font-medium ${a.score > 0.85 ? 'text-green-400' : a.score > 0.7 ? 'text-yellow-400' : 'text-red-400'}`}>{Math.round(a.score * 100)}%</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${a.rating === 'Excellent' ? 'bg-green-600 text-white' : a.rating === 'Good' ? 'bg-blue-600 text-white' : 'bg-yellow-600 text-white'}`}>{a.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HistoryTab() {
  const { t } = useTranslation()
  const [items, setItems] = useState<api.VisionToCodeResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.listGenerations().then(setItems).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('vision.loading', 'Loading...')}</div>
  if (items.length === 0) return <div className="text-warm-400">{t('vision.noHistory', 'No generation history yet.')}</div>

  return (
    <div className="space-y-3">
      {items.map(r => (
        <div key={r.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">{r.imageName}</div>
            <div className="text-sm text-warm-400">{r.imageType} · {r.framework} + {r.stylingEngine} · {r.componentsGenerated} components · {r.linesOfCode} lines</div>
            <div className="text-xs text-warm-500 mt-1">{r.processingMs}ms · {Math.round(r.styleMatchScore * 100)}% match · {r.refinements} refinements</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs rounded ${r.status === 'completed' ? 'bg-green-600 text-white' : r.status === 'failed' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
              {r.status}
            </span>
            <button onClick={async () => { await api.deleteGeneration(r.id); setItems(prev => prev.filter(x => x.id !== r.id)) }} className="text-red-400 hover:text-red-300 text-sm">
              {t('vision.delete', 'Delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ImageTypesTab() {
  const { t } = useTranslation()
  const [types, setTypes] = useState<api.ImageTypeInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getImageTypes().then(setTypes).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('vision.loading', 'Loading...')}</div>

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('vision.imageTypesTitle', 'Supported Image Types')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {types.map(tp => (
            <div key={tp.id} className="p-4 bg-warm-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tp.color }} />
                  <h4 className="text-white font-medium">{tp.name}</h4>
                </div>
              </div>
              <p className="text-sm text-warm-400">{tp.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('vision.featuresTitle', 'Vision-to-Code Features')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: t('vision.feat.decomposition', 'Component Decomposition'), desc: t('vision.feat.decompositionDesc', 'AI breaks the UI into reusable component hierarchy with proper naming'), stat: 'Auto-split' },
            { name: t('vision.feat.styleMatch', 'Style Matching'), desc: t('vision.feat.styleMatchDesc', 'Extracts colors, typography, spacing, and border radius from images'), stat: '90%+ accuracy' },
            { name: t('vision.feat.iterative', 'Iterative Refinement'), desc: t('vision.feat.iterativeDesc', 'Annotate the image and request targeted changes to generated code'), stat: 'Unlimited' },
          ].map(f => (
            <div key={f.name} className="p-4 bg-warm-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{f.name}</span>
                <span className="text-xs text-green-400">{f.stat}</span>
              </div>
              <p className="text-sm text-warm-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatsTab() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<api.VisionStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getVisionStats().then(setStats).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('vision.loading', 'Loading...')}</div>
  if (!stats || stats.totalGenerations === 0) return <div className="text-warm-400">{t('vision.noStats', 'No vision statistics yet.')}</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: stats.totalGenerations, label: t('vision.stats.generations', 'Total Generations') },
          { value: stats.totalComponents, label: t('vision.stats.components', 'Components Generated'), color: 'text-blue-400' },
          { value: `${stats.avgStyleMatch ? Math.round(stats.avgStyleMatch * 100) : 0}%`, label: t('vision.stats.avgMatch', 'Avg Style Match'), color: 'text-green-400' },
          { value: stats.totalLines, label: t('vision.stats.totalLines', 'Total Lines Generated'), color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value}</div>
            <div className="text-sm text-warm-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('vision.stats.byImageType', 'By Image Type')}</h4>
          <div className="space-y-2">
            {stats.byImageType?.map(it => (
              <div key={it.imageType} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{it.imageType}</span>
                <span className="text-warm-400 text-sm">{it.count} runs · {Math.round(it.avgMatch * 100)}% match</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('vision.stats.byFramework', 'By Framework')}</h4>
          <div className="space-y-2">
            {stats.byFramework?.map(f => (
              <div key={f.framework} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{f.framework}</span>
                <span className="text-warm-400 text-sm">{f.count} runs · {f.avgLines} avg lines</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
