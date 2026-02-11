import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { listApiKeys, generateApiKey, revokeApiKey } from '../api/apikeys'
import type { ApiKey } from '../api/apikeys'

export default function ApiCliPage() {
  const { t } = useTranslation()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [keyName, setKeyName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const loadKeys = useCallback(async () => {
    try {
      const data = await listApiKeys()
      setKeys(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('apiCli.loadError', 'Failed to load API keys'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadKeys()
  }, [loadKeys])

  const handleGenerate = async () => {
    try {
      setError('')
      setGenerating(true)
      const result = await generateApiKey(keyName || 'Default')
      setNewKey(result.key)
      setKeyName('')
      await loadKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('apiCli.generateError', 'Failed to generate key'))
    } finally {
      setGenerating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    try {
      setError('')
      setRevoking(id)
      await revokeApiKey(id)
      await loadKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('apiCli.revokeError', 'Failed to revoke key'))
    } finally {
      setRevoking(null)
    }
  }

  const handleCopy = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">{t('apiCli.loading', 'Loading API keys...')}</p>
      </div>
    )
  }

  const activeKeys = keys.filter(k => k.status === 'Active')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold">{t('apiCli.title', 'API & CLI')}</h2>
        <p className="text-sm text-gray-400 mt-1">
          {t('apiCli.subtitle', 'Manage API keys for programmatic access to the platform')}
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* New key alert */}
      {newKey && (
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-4">
          <p className="text-sm text-green-400 font-medium mb-2">
            {t('apiCli.keyCreated', 'API key created! Copy it now — it won\'t be shown again.')}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-900 text-gray-200 px-3 py-2 rounded font-mono text-xs break-all">
              {newKey}
            </code>
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-green-700 hover:bg-green-600 text-white rounded text-xs font-medium transition-colors"
            >
              {copied ? t('apiCli.copied', 'Copied!') : t('apiCli.copy', 'Copy')}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-300"
          >
            {t('apiCli.dismiss', 'Dismiss')}
          </button>
        </div>
      )}

      {/* Generate new key */}
      <div className="bg-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold mb-3">{t('apiCli.generateTitle', 'Generate New Key')}</h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder={t('apiCli.keyNamePlaceholder', 'Key name (e.g., CI/CD, Development)')}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
            maxLength={100}
          />
          <button
            onClick={handleGenerate}
            disabled={generating || activeKeys.length >= 5}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {generating ? t('apiCli.generating', 'Generating...') : t('apiCli.generate', 'Generate Key')}
          </button>
        </div>
        {activeKeys.length >= 5 && (
          <p className="text-xs text-yellow-400 mt-2">
            {t('apiCli.maxKeys', 'Maximum of 5 active keys. Revoke an existing key to generate a new one.')}
          </p>
        )}
      </div>

      {/* Active Keys */}
      <div className="bg-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold mb-3">
          {t('apiCli.activeKeys', 'API Keys')} ({keys.length})
        </h3>
        {keys.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            {t('apiCli.noKeys', 'No API keys yet. Generate one above to get started.')}
          </p>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className={`bg-gray-900 rounded-lg p-3 flex items-center justify-between ${
                  key.status === 'Revoked' ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{key.name}</p>
                    <p className="text-xs font-mono text-gray-500">{key.keyPrefix}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    key.status === 'Active'
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-red-900/50 text-red-400'
                  }`}>
                    {key.status === 'Active' ? t('apiCli.active', 'Active') : t('apiCli.revoked', 'Revoked')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs text-gray-500">
                    <p>{t('apiCli.requests', 'Requests')}: {key.requestCount}</p>
                    <p>{new Date(key.createdAt).toLocaleDateString()}</p>
                  </div>
                  {key.status === 'Active' && (
                    <button
                      onClick={() => handleRevoke(key.id)}
                      disabled={revoking !== null}
                      className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-400 rounded text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {revoking === key.id ? t('apiCli.revoking', 'Revoking...') : t('apiCli.revoke', 'Revoke')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Start Guide */}
      <div className="bg-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold mb-3">{t('apiCli.quickStart', 'Quick Start')}</h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">{t('apiCli.curlExample', 'cURL — Submit a dev request')}</p>
            <pre className="bg-gray-900 rounded p-3 text-xs text-gray-300 font-mono overflow-x-auto">
{`curl -X POST ${window.location.origin}/api/requests \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"description": "Build a REST API"}'`}
            </pre>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">{t('apiCli.statusExample', 'Check request status')}</p>
            <pre className="bg-gray-900 rounded p-3 text-xs text-gray-300 font-mono overflow-x-auto">
{`curl ${window.location.origin}/api/requests/REQUEST_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
