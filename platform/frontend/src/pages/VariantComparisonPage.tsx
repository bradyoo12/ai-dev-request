import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  generateVariants,
  getVariants,
  selectVariant,
  rateVariant,
  type GenerationVariant,
  type GeneratedFile,
} from '../api/generation-variants'

export default function VariantComparisonPage() {
  const { t } = useTranslation()
  const [requestId, setRequestId] = useState('')
  const [description, setDescription] = useState('')
  const [variants, setVariants] = useState<GenerationVariant[]>([])
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeVariant, setActiveVariant] = useState<GenerationVariant | null>(null)
  const [activeFile, setActiveFile] = useState<GeneratedFile | null>(null)

  async function handleGenerate() {
    if (!requestId.trim() || !description.trim()) return
    setGenerating(true)
    setError('')
    try {
      const result = await generateVariants(requestId.trim(), description.trim())
      setVariants(result)
      setActiveVariant(null)
      setActiveFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('variantComparison.error.generateFailed'))
    } finally {
      setGenerating(false)
    }
  }

  async function handleLoad() {
    if (!requestId.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await getVariants(requestId.trim())
      setVariants(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('variantComparison.error.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSelect(variantId: string) {
    setError('')
    try {
      await selectVariant(requestId, variantId)
      const updated = await getVariants(requestId)
      setVariants(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('variantComparison.error.selectFailed'))
    }
  }

  async function handleRate(variantId: string, rating: number) {
    setError('')
    try {
      const updated = await rateVariant(requestId, variantId, rating)
      setVariants(prev => prev.map(v => v.id === updated.id ? updated : v))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('variantComparison.error.rateFailed'))
    }
  }

  function getFiles(variant: GenerationVariant): GeneratedFile[] {
    try {
      return JSON.parse(variant.filesJson) as GeneratedFile[]
    } catch {
      return []
    }
  }

  const approachColors: Record<string, string> = {
    minimal: 'bg-green-600/20 text-green-400 border-green-700/50',
    balanced: 'bg-blue-600/20 text-blue-400 border-blue-700/50',
    'feature-rich': 'bg-purple-600/20 text-purple-400 border-purple-700/50',
  }

  const tierColors: Record<string, string> = {
    Haiku: 'text-green-400',
    Sonnet: 'text-blue-400',
    Opus: 'text-purple-400',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">{t('variantComparison.title')}</h3>
        <p className="text-gray-400 text-sm mb-4">{t('variantComparison.subtitle')}</p>

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded p-3 mb-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <input
            type="text"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder={t('variantComparison.requestIdPlaceholder')}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('variantComparison.descriptionPlaceholder')}
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating || !requestId.trim() || !description.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
            >
              {generating ? t('variantComparison.generating') : t('variantComparison.generate')}
            </button>
            <button
              onClick={handleLoad}
              disabled={loading || !requestId.trim()}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded transition-colors"
            >
              {loading ? t('variantComparison.loading') : t('variantComparison.loadExisting')}
            </button>
          </div>
        </div>
      </div>

      {/* Variant Cards - Side by Side */}
      {variants.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {variants.map((variant) => {
            const files = getFiles(variant)
            return (
              <div
                key={variant.id}
                className={`bg-gray-900 rounded-lg border transition-colors ${
                  variant.isSelected
                    ? 'border-green-500 ring-1 ring-green-500/30'
                    : activeVariant?.id === variant.id
                      ? 'border-blue-500'
                      : 'border-gray-700/50 hover:border-gray-600'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${approachColors[variant.approach] || 'bg-gray-600/20 text-gray-400 border-gray-700/50'}`}>
                      {variant.approach}
                    </span>
                    {variant.isSelected && (
                      <span className="px-2 py-0.5 bg-green-600/20 text-green-400 rounded text-xs font-medium">
                        {t('variantComparison.selected')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mt-2">{variant.description}</p>
                </div>

                {/* Metrics */}
                <div className="p-4 border-b border-gray-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">{t('variantComparison.files')}</p>
                      <p className="text-lg font-semibold text-white">{variant.fileCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('variantComparison.loc')}</p>
                      <p className="text-lg font-semibold text-white">{variant.linesOfCode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('variantComparison.dependencies')}</p>
                      <p className="text-lg font-semibold text-white">{variant.dependencyCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('variantComparison.bundleSize')}</p>
                      <p className="text-lg font-semibold text-white">{variant.estimatedBundleSizeKb} KB</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {t('variantComparison.model')}: <span className={tierColors[variant.modelTier] || 'text-gray-400'}>{variant.modelTier}</span>
                    </span>
                    <span className="text-gray-500">{variant.tokensUsed} tokens</span>
                  </div>
                </div>

                {/* File List */}
                <div className="p-4 border-b border-gray-800 max-h-[150px] overflow-y-auto">
                  <p className="text-xs text-gray-500 mb-2">{t('variantComparison.fileList')}</p>
                  <div className="space-y-1">
                    {files.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => { setActiveVariant(variant); setActiveFile(file) }}
                        className={`block w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                          activeFile?.path === file.path && activeVariant?.id === variant.id
                            ? 'bg-blue-900/30 text-blue-300'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                        }`}
                      >
                        {file.path}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating & Actions */}
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRate(variant.id, star)}
                        className={`text-lg transition-colors ${
                          star <= variant.rating ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400/50'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    {variant.rating > 0 && (
                      <span className="text-xs text-gray-500 ml-2">{variant.rating}/5</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleSelect(variant.id)}
                    disabled={variant.isSelected}
                    className={`w-full py-2 rounded text-sm font-medium transition-colors ${
                      variant.isSelected
                        ? 'bg-green-600/20 text-green-400 border border-green-700/50 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {variant.isSelected ? t('variantComparison.alreadySelected') : t('variantComparison.selectThis')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Code Preview */}
      {activeFile && activeVariant && (
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-300">
              {activeFile.path}
              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${approachColors[activeVariant.approach] || ''}`}>
                {activeVariant.approach}
              </span>
            </h5>
            <span className="text-xs text-gray-500">
              {activeFile.content.split('\n').length} {t('variantComparison.lines')}
            </span>
          </div>
          <div className="bg-gray-950 rounded-lg p-4 overflow-auto max-h-[500px]">
            <pre className="text-sm text-green-300 font-mono whitespace-pre-wrap">{activeFile.content}</pre>
          </div>
        </div>
      )}

      {/* Empty State */}
      {variants.length === 0 && !generating && !loading && (
        <div className="bg-gray-900 rounded-lg p-12 text-center">
          <p className="text-gray-400">{t('variantComparison.empty')}</p>
        </div>
      )}
    </div>
  )
}
