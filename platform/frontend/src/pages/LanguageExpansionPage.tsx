import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listExpansions, translateProject, deleteExpansion, getLangStats, getLanguages } from '../api/languageexpansion'
import type { LanguageExpansion, TranslateResponse, SupportedLanguage, LangStats } from '../api/languageexpansion'

type Tab = 'translate' | 'history' | 'languages' | 'stats'

export default function LanguageExpansionPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('translate')
  const [expansions, setExpansions] = useState<LanguageExpansion[]>([])
  const [languages, setLanguages] = useState<SupportedLanguage[]>([])
  const [stats, setStats] = useState<LangStats | null>(null)
  const [projectName, setProjectName] = useState('')
  const [targetLang, setTargetLang] = useState('ja')
  const [sourceLang, setSourceLang] = useState('en')
  const [result, setResult] = useState<TranslateResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tab === 'history') listExpansions().then(setExpansions).catch(() => {})
    if (tab === 'languages') getLanguages().then(setLanguages).catch(() => {})
    if (tab === 'stats') getLangStats().then(setStats).catch(() => {})
  }, [tab])

  const handleTranslate = async () => {
    if (!projectName.trim()) return
    setLoading(true)
    try { setResult(await translateProject(projectName, targetLang, sourceLang)) } catch { /* */ }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    try { await deleteExpansion(id); setExpansions(prev => prev.filter(e => e.id !== id)) } catch { /* */ }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'translate', label: t('langexp.tab.translate', 'Translate') },
    { key: 'history', label: t('langexp.tab.history', 'History') },
    { key: 'languages', label: t('langexp.tab.languages', 'Languages') },
    { key: 'stats', label: t('langexp.tab.stats', 'Stats') },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">{t('langexp.title', 'Language Expansion')}</h2>
      <p className="text-warm-400 text-sm mb-4">{t('langexp.subtitle', 'Expand to 70+ languages with AI-powered translation and RTL support')}</p>

      <div className="flex gap-2 mb-4">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${tab === tb.key ? 'bg-blue-600 text-white' : 'text-warm-400 hover:text-white'}`}
          >{tb.label}</button>
        ))}
      </div>

      {tab === 'translate' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('langexp.projectName', 'Project Name')}</label>
              <input value={projectName} onChange={e => setProjectName(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm" placeholder="my-app" />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('langexp.sourceLang', 'Source Language')}</label>
              <select value={sourceLang} onChange={e => setSourceLang(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm">
                <option value="en">English</option>
                <option value="ko">Korean</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('langexp.targetLang', 'Target Language')}</label>
              <select value={targetLang} onChange={e => setTargetLang(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm">
                <option value="ja">Japanese</option><option value="zh">Chinese</option><option value="es">Spanish</option>
                <option value="fr">French</option><option value="de">German</option><option value="pt">Portuguese</option>
                <option value="ar">Arabic</option><option value="hi">Hindi</option><option value="vi">Vietnamese</option>
                <option value="th">Thai</option>
              </select>
            </div>
          </div>
          <button onClick={handleTranslate} disabled={loading || !projectName.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? t('langexp.translating', 'Translating...') : t('langexp.translate', 'Translate Project')}
          </button>

          {result && (
            <div className="bg-warm-800 rounded-lg p-4 space-y-3">
              <h3 className="text-white font-medium">{t('langexp.result', 'Translation Result')}</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center"><div className="text-warm-400 text-xs">{t('langexp.coverage', 'Coverage')}</div><div className="text-white font-medium">{result.record.coveragePercent}%</div></div>
                <div className="text-center"><div className="text-warm-400 text-xs">{t('langexp.quality', 'Quality')}</div><div className="text-white font-medium">{result.record.qualityScore}</div></div>
                <div className="text-center"><div className="text-warm-400 text-xs">{t('langexp.keys', 'Keys')}</div><div className="text-white font-medium">{result.record.keysTranslated}/{result.record.totalKeys}</div></div>
                <div className="text-center"><div className="text-warm-400 text-xs">{t('langexp.rtl', 'RTL')}</div><div className={`font-medium ${result.record.rtlSupport ? 'text-yellow-400' : 'text-warm-500'}`}>{result.record.rtlSupport ? 'Yes' : 'No'}</div></div>
              </div>
              <div>
                <div className="text-warm-400 text-xs mb-1">{t('langexp.samples', 'Sample Translations')}</div>
                <div className="bg-warm-900 rounded p-3 space-y-1">
                  {result.sampleTranslations.map((s, i) => (
                    <div key={i} className="flex justify-between text-sm"><span className="text-warm-400">{s.source}</span><span className="text-white">{s.translated}</span></div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-warm-400 text-xs mb-1">{t('langexp.recommendations', 'Recommendations')}</div>
                <div className="space-y-1">{result.recommendations.map((r, i) => <div key={i} className="text-warm-300 text-sm">• {r}</div>)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2">
          {expansions.length === 0 && <p className="text-warm-400 text-sm">{t('langexp.noHistory', 'No translations yet.')}</p>}
          {expansions.map(e => (
            <div key={e.id} className="bg-warm-800 rounded-lg p-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{e.projectName} — {e.sourceLanguage} → {e.targetLanguage}</div>
                <div className="text-warm-400 text-xs mt-0.5">{e.coveragePercent}% coverage &middot; {e.qualityScore} quality &middot; {e.keysTranslated} keys{e.rtlSupport ? ' &middot; RTL' : ''}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded ${e.humanReviewed ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{e.humanReviewed ? 'Reviewed' : 'Machine'}</span>
                <button onClick={() => handleDelete(e.id)} className="text-warm-500 hover:text-red-400 text-xs">{t('common.delete', 'Delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'languages' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {languages.map(l => (
              <div key={l.code} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="text-white font-medium">{l.name}</span><span className="text-warm-400 text-sm">({l.native})</span></div>
                  <div className="text-warm-400 text-xs mt-1">{l.region} &middot; {l.code}</div>
                </div>
                {l.rtl && <span className="text-xs px-2 py-0.5 rounded bg-yellow-900 text-yellow-300">RTL</span>}
              </div>
            ))}
          </div>
          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">{t('langexp.features', 'Features')}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><div className="text-white text-sm font-medium">{t('langexp.feat.ai', 'AI Translation')}</div><div className="text-warm-400 text-xs mt-1">{t('langexp.feat.aiDesc', 'Context-aware AI translation that understands UI patterns and technical terminology')}</div></div>
              <div><div className="text-white text-sm font-medium">{t('langexp.feat.rtl', 'RTL Support')}</div><div className="text-warm-400 text-xs mt-1">{t('langexp.feat.rtlDesc', 'Full right-to-left layout support for Arabic, Hebrew, and other RTL languages')}</div></div>
              <div><div className="text-white text-sm font-medium">{t('langexp.feat.plural', 'Pluralization')}</div><div className="text-warm-400 text-xs mt-1">{t('langexp.feat.pluralDesc', 'Language-specific pluralization rules for accurate number formatting and grammar')}</div></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-4">
          {!stats || stats.totalTranslations === 0 ? (
            <p className="text-warm-400 text-sm">{t('langexp.noStats', 'No translation statistics yet.')}</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-warm-800 rounded-lg p-3 text-center"><div className="text-warm-400 text-xs">{t('langexp.stats.total', 'Total')}</div><div className="text-white text-lg font-bold">{stats.totalTranslations}</div></div>
                <div className="bg-warm-800 rounded-lg p-3 text-center"><div className="text-warm-400 text-xs">{t('langexp.stats.coverage', 'Avg Coverage')}</div><div className="text-white text-lg font-bold">{stats.avgCoveragePercent}%</div></div>
                <div className="bg-warm-800 rounded-lg p-3 text-center"><div className="text-warm-400 text-xs">{t('langexp.stats.quality', 'Avg Quality')}</div><div className="text-white text-lg font-bold">{stats.avgQualityScore}</div></div>
                <div className="bg-warm-800 rounded-lg p-3 text-center"><div className="text-warm-400 text-xs">{t('langexp.stats.reviewed', 'Human Reviewed')}</div><div className="text-white text-lg font-bold">{stats.humanReviewedPercent}%</div></div>
              </div>
              {stats.byLanguage.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">{t('langexp.stats.byLang', 'By Language')}</h3>
                  <div className="space-y-2">{stats.byLanguage.map(l => (
                    <div key={l.language} className="flex justify-between text-sm"><span className="text-warm-300">{l.language}</span><span className="text-warm-400">{l.count} translations &middot; {l.avgCoverage}% coverage &middot; {l.avgQuality} quality</span></div>
                  ))}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
