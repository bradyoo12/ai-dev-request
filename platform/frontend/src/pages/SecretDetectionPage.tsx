import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  triggerSecretScan,
  getSecretScanResults,
  getSecretPatterns,
  generateSecureConfig,
  getSecureConfig,
  type SecretScanDetailResponse,
  type SecretPattern,
  type SecureConfigResponse,
} from '../api/secrets'

type ActiveTab = 'scan' | 'patterns' | 'config'

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-600 text-white',
  medium: 'bg-yellow-600 text-black',
  low: 'bg-blue-600 text-white',
}

const CONFIG_LANGUAGES = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'csharp', label: 'C# / .NET' },
  { id: 'python', label: 'Python' },
] as const

export default function SecretDetectionPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get('requestId') || ''

  const [scanResults, setScanResults] = useState<SecretScanDetailResponse | null>(null)
  const [patterns, setPatterns] = useState<SecretPattern[]>([])
  const [configResult, setConfigResult] = useState<SecureConfigResponse | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('scan')
  const [configLanguage, setConfigLanguage] = useState('typescript')
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPatterns()
    if (requestId) {
      loadExistingResults()
      loadExistingConfig()
    }
  }, [requestId])

  async function loadPatterns() {
    try {
      const data = await getSecretPatterns()
      setPatterns(data)
    } catch {
      // patterns are informational, don't block UI
    }
  }

  async function loadExistingResults() {
    setLoading(true)
    try {
      const data = await getSecretScanResults(requestId)
      if (data) setScanResults(data)
    } catch {
      // no existing results
    } finally {
      setLoading(false)
    }
  }

  async function loadExistingConfig() {
    try {
      const data = await getSecureConfig(requestId)
      if (data) setConfigResult(data)
    } catch {
      // no existing config
    }
  }

  async function handleScan() {
    if (!requestId) {
      setError(t('secrets.noProject', 'No project selected. Please provide a requestId.'))
      return
    }
    setScanning(true)
    setError('')
    try {
      await triggerSecretScan(requestId)
      const results = await getSecretScanResults(requestId)
      if (results) setScanResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  async function handleGenerateConfig() {
    if (!requestId) {
      setError(t('secrets.noProject', 'No project selected.'))
      return
    }
    setGenerating(true)
    setError('')
    try {
      const result = await generateSecureConfig(requestId, configLanguage)
      setConfigResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  if (!authUser) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-2">{t('secrets.title', 'Secret Detection')}</h2>
        <p className="text-warm-400">{t('secrets.loginRequired', 'Please log in to manage secrets.')}</p>
      </div>
    )
  }

  if (!requestId) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-2">{t('secrets.title', 'Secret Detection')}</h2>
        <p className="text-warm-400">{t('secrets.noProjectDesc', 'No project selected. Go to your project to scan for secrets.')}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
        >
          {t('secrets.goHome', 'Go to Dashboard')}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-warm-400 hover:text-white transition-colors">
          &larr;
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{t('secrets.title', 'Secret Detection & Configuration')}</h2>
          <p className="text-sm text-warm-400 mt-1">
            {t('secrets.description', 'Scan for hardcoded secrets and generate secure configuration files')}
          </p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
        >
          {scanning ? t('secrets.scanning', 'Scanning...') : t('secrets.runScan', 'Run Scan')}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {/* Summary Cards */}
      {scanResults && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Critical', count: scanResults.findings.filter(f => f.severity === 'critical').length, color: 'text-red-400' },
            { label: 'High', count: scanResults.findings.filter(f => f.severity === 'high').length, color: 'text-orange-400' },
            { label: 'Medium', count: scanResults.findings.filter(f => f.severity === 'medium').length, color: 'text-yellow-400' },
            { label: 'Low', count: scanResults.findings.filter(f => f.severity === 'low').length, color: 'text-blue-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-warm-800 rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-warm-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-warm-800 rounded-lg p-1">
        {(['scan', 'patterns', 'config'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
            }`}
          >
            {tab === 'scan' && t('secrets.tab.scan', 'Scan Results')}
            {tab === 'patterns' && t('secrets.tab.patterns', 'Patterns')}
            {tab === 'config' && t('secrets.tab.config', 'Secure Config')}
          </button>
        ))}
      </div>

      {/* Scan Results Tab */}
      {activeTab === 'scan' && (
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-8 text-warm-400">{t('secrets.loading', 'Loading...')}</div>
          )}

          {!loading && !scanResults && (
            <div className="text-center py-12 bg-warm-800/50 rounded-lg">
              <p className="text-warm-400">
                {t('secrets.noResults', 'No scan results yet. Click "Run Scan" to detect hardcoded secrets.')}
              </p>
            </div>
          )}

          {scanResults && scanResults.findings.length === 0 && (
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-6 text-center">
              <div className="text-green-400 text-lg font-medium mb-1">
                {t('secrets.noFindings', 'No secrets detected')}
              </div>
              <p className="text-sm text-warm-400">
                {t('secrets.cleanProject', 'Your project code appears clean of hardcoded secrets.')}
              </p>
            </div>
          )}

          {scanResults && scanResults.findings.length > 0 && (
            <div className="bg-warm-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-warm-700">
                <span className="text-sm font-medium text-white">
                  {t('secrets.findingsCount', `${scanResults.findingCount} findings`)}
                </span>
                <span className="text-xs text-warm-400 ml-2">
                  {t('secrets.scannedAt', `Scanned ${new Date(scanResults.scannedAt).toLocaleString()}`)}
                </span>
              </div>
              <div className="divide-y divide-warm-700">
                {scanResults.findings.map((finding, idx) => (
                  <div key={idx} className="px-4 py-3 hover:bg-warm-700/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLES[finding.severity] || 'bg-warm-600 text-white'}`}>
                        {finding.severity.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-white">{finding.patternName}</span>
                    </div>
                    <div className="text-xs text-warm-400 mb-1">{finding.description}</div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-warm-500">{finding.location}</span>
                      <code className="text-red-300 bg-warm-900 px-2 py-0.5 rounded">{finding.matchPreview}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patterns Tab */}
      {activeTab === 'patterns' && (
        <div className="bg-warm-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-warm-700">
            <span className="text-sm font-medium text-white">
              {t('secrets.patternsTitle', `${patterns.length} detection patterns active`)}
            </span>
          </div>
          <div className="divide-y divide-warm-700">
            {patterns.map((pattern) => (
              <div key={pattern.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLES[pattern.severity] || 'bg-warm-600 text-white'}`}>
                    {pattern.severity.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-white">{pattern.name}</span>
                </div>
                <div className="text-xs text-warm-400">{pattern.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secure Config Tab */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select
              value={configLanguage}
              onChange={(e) => setConfigLanguage(e.target.value)}
              className="bg-warm-800 border border-warm-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {CONFIG_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>{lang.label}</option>
              ))}
            </select>
            <button
              onClick={handleGenerateConfig}
              disabled={generating}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {generating ? t('secrets.generating', 'Generating...') : t('secrets.generateConfig', 'Generate Config Files')}
            </button>
          </div>

          {!configResult && (
            <div className="text-center py-12 bg-warm-800/50 rounded-lg">
              <p className="text-warm-400">
                {t('secrets.noConfig', 'No config files generated yet. Click "Generate Config Files" to create secure configuration templates.')}
              </p>
            </div>
          )}

          {configResult && (
            <div className="space-y-4">
              {/* .env.example */}
              <div className="bg-warm-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-warm-700">
                  <span className="text-xs font-mono text-warm-400">.env.example</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(configResult.envTemplate)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {t('secrets.copy', 'Copy')}
                  </button>
                </div>
                <pre className="p-4 text-xs text-warm-300 font-mono whitespace-pre overflow-auto max-h-64">
                  {configResult.envTemplate}
                </pre>
              </div>

              {/* .gitignore */}
              <div className="bg-warm-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-warm-700">
                  <span className="text-xs font-mono text-warm-400">.gitignore (secrets section)</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(configResult.gitignore)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {t('secrets.copy', 'Copy')}
                  </button>
                </div>
                <pre className="p-4 text-xs text-warm-300 font-mono whitespace-pre overflow-auto max-h-64">
                  {configResult.gitignore}
                </pre>
              </div>

              {/* Config Module */}
              <div className="bg-warm-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-warm-700">
                  <span className="text-xs font-mono text-warm-400">config module ({configResult.language})</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(configResult.configModule)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {t('secrets.copy', 'Copy')}
                  </button>
                </div>
                <pre className="p-4 text-xs text-warm-300 font-mono whitespace-pre overflow-auto max-h-64">
                  {configResult.configModule}
                </pre>
              </div>

              {/* Key Vault Config */}
              <div className="bg-warm-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-warm-700">
                  <span className="text-xs font-mono text-warm-400">Azure Key Vault integration</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(configResult.keyVaultConfig)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {t('secrets.copy', 'Copy')}
                  </button>
                </div>
                <pre className="p-4 text-xs text-warm-300 font-mono whitespace-pre overflow-auto max-h-64">
                  {configResult.keyVaultConfig}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
