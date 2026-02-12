import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getPreferences,
  setPreference,
  deletePreference,
  deleteAllPreferences,
  getPreferenceSummary,
  regenerateSummary,
  type PreferenceRecord,
  type PreferenceSummary,
} from '../api/preferences'

const CATEGORIES = ['budget', 'tech', 'design', 'platform', 'decision_style'] as const

export default function PreferencePage() {
  const { t } = useTranslation()
  const [preferences, setPreferences] = useState<PreferenceRecord[]>([])
  const [summary, setSummary] = useState<PreferenceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newCategory, setNewCategory] = useState('budget')
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [adding, setAdding] = useState(false)

  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const [prefResult, summaryResult] = await Promise.all([
        getPreferences(filterCategory || undefined),
        getPreferenceSummary(),
      ])
      setPreferences(prefResult.preferences)
      setSummary(summaryResult)
    } catch {
      setError(t('preference.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [filterCategory])

  async function handleAdd() {
    if (!newKey.trim() || !newValue.trim()) return
    try {
      setAdding(true)
      await setPreference({ category: newCategory, key: newKey.trim(), value: newValue.trim() })
      setNewKey('')
      setNewValue('')
      setShowAddDialog(false)
      await loadData()
    } catch {
      setError(t('preference.addError'))
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await deletePreference(id)
      await loadData()
    } catch {
      setError(t('preference.deleteError'))
    }
  }

  async function handleDeleteAll() {
    try {
      await deleteAllPreferences()
      setDeleteAllConfirm(false)
      await loadData()
    } catch {
      setError(t('preference.deleteAllError'))
    }
  }

  async function handleRegenerateSummary() {
    try {
      const result = await regenerateSummary()
      setSummary(result)
    } catch {
      setError(t('preference.summaryError'))
    }
  }

  if (loading && preferences.length === 0) {
    return <div className="text-center py-8 text-warm-400">{t('preference.loading')}</div>
  }

  const grouped = preferences.reduce<Record<string, PreferenceRecord[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('preference.title')}</h3>
          <p className="text-sm text-warm-400 mt-1">{t('preference.description')}</p>
        </div>
        <div className="flex gap-2">
          {preferences.length > 0 && (
            <button
              onClick={() => setDeleteAllConfirm(true)}
              className="px-3 py-1.5 text-sm bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
            >
              {t('preference.deleteAll')}
            </button>
          )}
          <button
            onClick={() => setShowAddDialog(true)}
            className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t('preference.add')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {summary && summary.summaryText !== 'No preferences detected yet.' && (
        <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-purple-300">{t('preference.summaryTitle')}</h4>
            <button
              onClick={handleRegenerateSummary}
              className="text-xs text-purple-400 hover:text-purple-200 transition-colors"
            >
              {t('preference.regenerate')}
            </button>
          </div>
          <p className="text-sm text-warm-300">{summary.summaryText}</p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory('')}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            filterCategory === '' ? 'bg-purple-600 text-white' : 'bg-warm-700 text-warm-300 hover:bg-warm-600'
          }`}
        >
          {t('preference.filterAll')}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filterCategory === cat ? 'bg-purple-600 text-white' : 'bg-warm-700 text-warm-300 hover:bg-warm-600'
            }`}
          >
            {t(`preference.cat.${cat}`)}
          </button>
        ))}
      </div>

      {preferences.length === 0 ? (
        <div className="text-center py-12 bg-warm-800/50 rounded-lg">
          <p className="text-warm-400">{t('preference.empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, prefs]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-sm font-medium text-purple-300 uppercase tracking-wide">
                {t(`preference.cat.${category}`)}
              </h4>
              {prefs.map((p) => (
                <div key={p.id} className="bg-warm-800 rounded-lg p-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{p.key}</span>
                      <span className="text-sm text-warm-400">=</span>
                      <span className="text-sm text-purple-300">{p.value}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-warm-500">
                        {t('preference.confidence')}: {Math.round(p.confidence * 100)}%
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                        p.source === 'auto' ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'
                      }`}>
                        {p.source === 'auto' ? t('preference.sourceAuto') : t('preference.sourceManual')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-warm-500 hover:text-red-400 transition-colors text-sm shrink-0"
                  >
                    {t('memory.delete')}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {showAddDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAddDialog(false)} role="dialog" aria-modal="true" aria-labelledby="preference-add-dialog-title">
          <div className="bg-warm-800 rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 id="preference-add-dialog-title" className="text-lg font-semibold mb-4">{t('preference.addTitle')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('preference.categoryLabel')}</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 rounded-lg p-2 text-white text-sm"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{t(`preference.cat.${c}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('preference.keyLabel')}</label>
                <input
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 rounded-lg p-2 text-white text-sm"
                  placeholder={t('preference.keyPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('preference.valueLabel')}</label>
                <input
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 rounded-lg p-2 text-white text-sm"
                  placeholder={t('preference.valuePlaceholder')}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="px-4 py-2 text-sm text-warm-400 hover:text-white transition-colors"
                >
                  {t('tokens.confirm.cancel')}
                </button>
                <button
                  onClick={handleAdd}
                  disabled={adding || !newKey.trim() || !newValue.trim()}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {adding ? t('preference.adding') : t('preference.add')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteAllConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setDeleteAllConfirm(false)} role="dialog" aria-modal="true" aria-labelledby="preference-delete-dialog-title">
          <div className="bg-warm-800 rounded-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 id="preference-delete-dialog-title" className="text-lg font-semibold mb-2">{t('preference.deleteAllTitle')}</h3>
            <p className="text-sm text-warm-400 mb-4">{t('preference.deleteAllConfirm')}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteAllConfirm(false)}
                className="px-4 py-2 text-sm text-warm-400 hover:text-white transition-colors"
              >
                {t('tokens.confirm.cancel')}
              </button>
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('preference.deleteAll')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
