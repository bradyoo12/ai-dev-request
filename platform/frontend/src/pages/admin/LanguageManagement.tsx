import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getAuthHeaders } from '../../api/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface AdminLanguage {
  id: number
  code: string
  name: string
  nativeName: string
  isDefault: boolean
  isActive: boolean
  translationProgress: number
  translatedKeys: number
  totalKeys: number
  createdAt: string
}

interface TranslationEntry {
  namespace: string
  key: string
  referenceValue: string
  value: string
  isMissing: boolean
}

export default function LanguageManagement() {
  const { t } = useTranslation()
  const [languages, setLanguages] = useState<AdminLanguage[]>([])
  const [selectedLang, setSelectedLang] = useState<string | null>(null)
  const [translations, setTranslations] = useState<TranslationEntry[]>([])
  const [editedTranslations, setEditedTranslations] = useState<Record<string, string>>({})
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [missingOnly, setMissingOnly] = useState(false)
  const [newLang, setNewLang] = useState({ code: '', name: '', nativeName: '', copyFromCode: '' })

  useEffect(() => {
    fetchLanguages()
  }, [])

  const fetchLanguages = async () => {
    const res = await fetch(`${API_BASE_URL}/api/languages/admin`, {
      headers: getAuthHeaders(),
    })
    if (res.ok) setLanguages(await res.json())
  }

  const fetchTranslations = async (locale: string) => {
    const params = new URLSearchParams()
    if (missingOnly) params.set('missingOnly', 'true')
    const res = await fetch(`${API_BASE_URL}/api/translations/admin/${locale}?${params}`, {
      headers: getAuthHeaders(),
    })
    if (res.ok) {
      const data = await res.json()
      setTranslations(data)
      setEditedTranslations({})
    }
  }

  const handleSelectLanguage = (code: string) => {
    setSelectedLang(code)
    fetchTranslations(code)
  }

  const handleAddLanguage = async () => {
    const res = await fetch(`${API_BASE_URL}/api/languages/admin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        code: newLang.code,
        name: newLang.name,
        nativeName: newLang.nativeName,
        isActive: true,
        copyFromCode: newLang.copyFromCode || undefined,
      }),
    })
    if (res.ok) {
      setShowAddDialog(false)
      setNewLang({ code: '', name: '', nativeName: '', copyFromCode: '' })
      fetchLanguages()
    }
  }

  const handleDeleteLanguage = async (code: string) => {
    if (!confirm(`Delete language "${code}"?`)) return
    const res = await fetch(`${API_BASE_URL}/api/languages/admin/${code}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (res.ok) {
      fetchLanguages()
      if (selectedLang === code) {
        setSelectedLang(null)
        setTranslations([])
      }
    }
  }

  const handleSaveTranslations = async () => {
    if (!selectedLang || Object.keys(editedTranslations).length === 0) return

    const updates = Object.entries(editedTranslations).map(([compositeKey, value]) => {
      const [ns, ...keyParts] = compositeKey.split(':')
      return { namespace: ns, key: keyParts.join(':'), value }
    })

    const res = await fetch(`${API_BASE_URL}/api/translations/admin/${selectedLang}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ translations: updates }),
    })

    if (res.ok) {
      setEditedTranslations({})
      fetchTranslations(selectedLang)
      fetchLanguages()
    }
  }

  const handleExport = async (code: string) => {
    const res = await fetch(`${API_BASE_URL}/api/translations/admin/${code}/export`, {
      headers: getAuthHeaders(),
    })
    if (res.ok) {
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${code}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleImport = async (code: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      const data = JSON.parse(text)
      const res = await fetch(`${API_BASE_URL}/api/translations/admin/${code}/import`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (res.ok) {
        fetchTranslations(code)
        fetchLanguages()
      }
    }
    input.click()
  }

  const filteredTranslations = translations.filter(entry => {
    if (filterText) {
      const search = filterText.toLowerCase()
      return entry.key.toLowerCase().includes(search) ||
        entry.referenceValue.toLowerCase().includes(search) ||
        entry.value.toLowerCase().includes(search)
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="p-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">Admin &gt; {t('admin.languages.title')}</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Language List */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{t('admin.languages.title')}</h2>
            <button
              onClick={() => setShowAddDialog(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
            >
              {t('admin.languages.addLanguage')}
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                <th className="pb-2">{t('admin.languages.code')}</th>
                <th className="pb-2">{t('admin.languages.name')}</th>
                <th className="pb-2">{t('admin.languages.status')}</th>
                <th className="pb-2">{t('admin.languages.progress')}</th>
                <th className="pb-2">{t('admin.languages.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {languages.map(lang => (
                <tr key={lang.code} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 font-mono">{lang.code}</td>
                  <td className="py-3">{lang.nativeName} ({lang.name})</td>
                  <td className="py-3">
                    {lang.isDefault ? (
                      <span className="px-2 py-1 bg-blue-600 rounded text-xs">{t('admin.languages.default')}</span>
                    ) : lang.isActive ? (
                      <span className="px-2 py-1 bg-green-600 rounded text-xs">{t('admin.languages.active')}</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-600 rounded text-xs">{t('admin.languages.inactive')}</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.round(lang.translationProgress)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400">{Math.round(lang.translationProgress)}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectLanguage(lang.code)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs transition-colors"
                      >
                        {t('admin.languages.edit')}
                      </button>
                      <button
                        onClick={() => handleExport(lang.code)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs transition-colors"
                      >
                        Export
                      </button>
                      {!lang.isDefault && (
                        <button
                          onClick={() => handleDeleteLanguage(lang.code)}
                          className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded text-xs transition-colors"
                        >
                          {t('admin.languages.delete')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Translation Editor */}
        {selectedLang && (
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {t('admin.translations.title')} — {languages.find(l => l.code === selectedLang)?.nativeName} ({selectedLang})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleImport(selectedLang)}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
                >
                  {t('admin.translations.importJson')}
                </button>
                <button
                  onClick={() => handleExport(selectedLang)}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
                >
                  {t('admin.translations.exportJson')}
                </button>
                <button
                  onClick={handleSaveTranslations}
                  disabled={Object.keys(editedTranslations).length === 0}
                  className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm transition-colors"
                >
                  {t('admin.translations.save')} ({Object.keys(editedTranslations).length})
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                placeholder={t('admin.translations.filter')}
                className="flex-1 p-2 bg-gray-900 border border-gray-700 rounded text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={missingOnly}
                  onChange={e => {
                    setMissingOnly(e.target.checked)
                    fetchTranslations(selectedLang)
                  }}
                />
                {t('admin.translations.missingOnly')}
              </label>
            </div>

            {/* Translation Table */}
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-800">
                  <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                    <th className="pb-2 w-1/4">{t('admin.translations.key')}</th>
                    <th className="pb-2 w-1/4">{t('admin.translations.reference')}</th>
                    <th className="pb-2 w-1/2">{t('admin.translations.translation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTranslations.map(entry => {
                    const compositeKey = `${entry.namespace}:${entry.key}`
                    const currentValue = editedTranslations[compositeKey] ?? entry.value
                    return (
                      <tr key={compositeKey} className={`border-b border-gray-700/30 ${entry.isMissing ? 'bg-yellow-900/10' : ''}`}>
                        <td className="py-2 font-mono text-xs text-gray-400">{entry.namespace}.{entry.key}</td>
                        <td className="py-2 text-sm text-gray-300">{entry.referenceValue}</td>
                        <td className="py-2">
                          <input
                            type="text"
                            value={currentValue}
                            onChange={e => setEditedTranslations(prev => ({ ...prev, [compositeKey]: e.target.value }))}
                            className={`w-full p-1.5 bg-gray-900 border rounded text-sm ${
                              entry.isMissing ? 'border-yellow-600' : 'border-gray-700'
                            }`}
                            placeholder={entry.isMissing ? '⚠️ Missing' : ''}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Language Dialog */}
        {showAddDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-96">
              <h3 className="text-lg font-bold mb-4">Add New Language</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Language Code</label>
                  <input
                    type="text"
                    value={newLang.code}
                    onChange={e => setNewLang(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="en"
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Language Name</label>
                  <input
                    type="text"
                    value={newLang.name}
                    onChange={e => setNewLang(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="English"
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Native Name</label>
                  <input
                    type="text"
                    value={newLang.nativeName}
                    onChange={e => setNewLang(prev => ({ ...prev, nativeName: e.target.value }))}
                    placeholder="English"
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Copy translations from</label>
                  <select
                    value={newLang.copyFromCode}
                    onChange={e => setNewLang(prev => ({ ...prev, copyFromCode: e.target.value }))}
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
                  >
                    <option value="">Empty (start from scratch)</option>
                    {languages.map(l => (
                      <option key={l.code} value={l.code}>{l.nativeName} ({l.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLanguage}
                  disabled={!newLang.code || !newLang.name || !newLang.nativeName}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded transition-colors"
                >
                  Add Language
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
