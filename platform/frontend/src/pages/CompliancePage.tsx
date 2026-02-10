import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  triggerSecurityScan,
  getSbomReport,
  getVulnerabilities,
  getLicenseAnalysis,
  exportSbom,
  type SbomComponent,
  type SbomReportResponse,
  type VulnerabilityResponse,
  type LicenseAnalysis,
  type SecurityScanResponse,
} from '../api/security'

type Tab = 'sbom' | 'vulnerabilities' | 'licenses'

export default function CompliancePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get('requestId') || ''

  const [activeTab, setActiveTab] = useState<Tab>('sbom')
  const [sbomReport, setSbomReport] = useState<SbomReportResponse | null>(null)
  const [components, setComponents] = useState<SbomComponent[]>([])
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityResponse[]>([])
  const [licenseAnalysis, setLicenseAnalysis] = useState<LicenseAnalysis | null>(null)
  const [scanResult, setScanResult] = useState<SecurityScanResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (requestId) loadExistingData()
  }, [requestId])

  async function loadExistingData() {
    setLoading(true)
    try {
      const [sbom, vulns, licenses] = await Promise.all([
        getSbomReport(requestId),
        getVulnerabilities(requestId),
        getLicenseAnalysis(requestId),
      ])
      if (sbom) {
        setSbomReport(sbom)
        try {
          setComponents(JSON.parse(sbom.componentsJson))
        } catch { setComponents([]) }
      }
      setVulnerabilities(vulns)
      setLicenseAnalysis(licenses)
    } catch {
      // No existing data — user needs to run a scan
    } finally {
      setLoading(false)
    }
  }

  async function handleScan() {
    if (!requestId) {
      setError('No project selected. Please provide a requestId.')
      return
    }
    setScanning(true)
    setError('')
    try {
      const result = await triggerSecurityScan(requestId)
      setScanResult(result)
      await loadExistingData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  async function handleExport(format: 'cyclonedx' | 'spdx') {
    try {
      const blob = await exportSbom(requestId, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sbom-${requestId.substring(0, 8)}.${format}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  function severityColor(severity: string) {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/40'
      case 'high': return 'text-orange-400 bg-orange-900/40'
      case 'medium': return 'text-yellow-400 bg-yellow-900/40'
      case 'low': return 'text-green-400 bg-green-900/40'
      default: return 'text-gray-400 bg-gray-700'
    }
  }

  function licenseCategoryColor(category: string) {
    switch (category) {
      case 'permissive': return 'text-green-400 bg-green-900/40'
      case 'copyleft': return 'text-orange-400 bg-orange-900/40'
      case 'public_domain': return 'text-blue-400 bg-blue-900/40'
      default: return 'text-gray-400 bg-gray-700'
    }
  }

  const filteredComponents = components.filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!authUser) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-2">{t('compliance.title', 'Compliance Dashboard')}</h2>
        <p className="text-gray-400">{t('compliance.loginRequired', 'Please log in to view compliance data.')}</p>
      </div>
    )
  }

  if (!requestId) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-2">{t('compliance.title', 'Compliance Dashboard')}</h2>
        <p className="text-gray-400">{t('compliance.noProject', 'No project selected. Go to your project and run a security scan.')}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition-colors"
        >
          {t('compliance.goHome', 'Go to Dashboard')}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors">
          &larr;
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{t('compliance.title', 'Compliance Dashboard')}</h2>
          <p className="text-sm text-gray-400 mt-1">{t('compliance.description', 'SBOM, vulnerability scanning, and license compliance')}</p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
        >
          {scanning ? t('compliance.scanning', 'Scanning...') : t('compliance.runScan', 'Run Security Scan')}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {/* Scan Summary */}
      {(scanResult || sbomReport) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{sbomReport?.dependencyCount ?? scanResult?.dependencyCount ?? 0}</div>
            <div className="text-xs text-gray-400 mt-1">{t('compliance.dependencies', 'Dependencies')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">
              {vulnerabilities.filter(v => v.severity === 'critical').length}
            </div>
            <div className="text-xs text-gray-400 mt-1">{t('compliance.critical', 'Critical')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">
              {vulnerabilities.filter(v => v.severity === 'high').length}
            </div>
            <div className="text-xs text-gray-400 mt-1">{t('compliance.high', 'High')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {vulnerabilities.filter(v => v.severity === 'medium' || v.severity === 'low').length}
            </div>
            <div className="text-xs text-gray-400 mt-1">{t('compliance.mediumLow', 'Medium/Low')}</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
        {(['sbom', 'vulnerabilities', 'licenses'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'sbom' && t('compliance.tab.sbom', 'SBOM')}
            {tab === 'vulnerabilities' && `${t('compliance.tab.vulnerabilities', 'Vulnerabilities')} (${vulnerabilities.length})`}
            {tab === 'licenses' && t('compliance.tab.licenses', 'Licenses')}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-400">{t('compliance.loading', 'Loading...')}</div>
      )}

      {/* SBOM Tab */}
      {!loading && activeTab === 'sbom' && (
        <div className="space-y-4">
          {/* Export Buttons */}
          {sbomReport && (
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('cyclonedx')}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
              >
                {t('compliance.exportCycloneDX', 'Export CycloneDX')}
              </button>
              <button
                onClick={() => handleExport('spdx')}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
              >
                {t('compliance.exportSPDX', 'Export SPDX')}
              </button>
            </div>
          )}

          {/* Search */}
          <input
            type="text"
            placeholder={t('compliance.searchPlaceholder', 'Search dependencies...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />

          {components.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400">{t('compliance.noSbom', 'No SBOM data. Run a security scan to generate.')}</p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-gray-500 font-medium">
                <div className="col-span-4">{t('compliance.package', 'Package')}</div>
                <div className="col-span-2">{t('compliance.version', 'Version')}</div>
                <div className="col-span-2">{t('compliance.ecosystem', 'Ecosystem')}</div>
                <div className="col-span-2">{t('compliance.type', 'Type')}</div>
                <div className="col-span-2">{t('compliance.license', 'License')}</div>
              </div>
              {filteredComponents.map((comp, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 bg-gray-800 rounded-lg px-3 py-2 text-sm">
                  <div className="col-span-4 text-white truncate" title={comp.name}>{comp.name}</div>
                  <div className="col-span-2 text-gray-400 font-mono text-xs">{comp.version}</div>
                  <div className="col-span-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">{comp.ecosystem}</span>
                  </div>
                  <div className="col-span-2 text-gray-400 text-xs">{comp.type}</div>
                  <div className="col-span-2 text-gray-400 text-xs">{comp.license || '-'}</div>
                </div>
              ))}
              <div className="text-xs text-gray-500 text-right pt-2">
                {filteredComponents.length} / {components.length} {t('compliance.packages', 'packages')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vulnerabilities Tab */}
      {!loading && activeTab === 'vulnerabilities' && (
        <div className="space-y-3">
          {vulnerabilities.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400">
                {sbomReport
                  ? t('compliance.noVulns', 'No vulnerabilities found. Your dependencies look clean!')
                  : t('compliance.noScanYet', 'No scan results. Run a security scan first.')}
              </p>
            </div>
          ) : (
            vulnerabilities.map((vuln) => (
              <div key={vuln.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${severityColor(vuln.severity)}`}>
                        {vuln.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">{vuln.vulnerabilityId}</span>
                    </div>
                    <h4 className="text-sm font-medium text-white">
                      {vuln.packageName}
                      <span className="text-gray-500 font-mono ml-1">@{vuln.packageVersion}</span>
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">{vuln.summary}</p>
                    {vuln.fixedVersion && (
                      <p className="text-xs mt-1">
                        <span className="text-gray-500">{t('compliance.fixAvailable', 'Fix available')}:</span>{' '}
                        <span className="text-green-400 font-mono">{vuln.fixedVersion}</span>
                      </p>
                    )}
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300 shrink-0">
                    {vuln.ecosystem}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Licenses Tab */}
      {!loading && activeTab === 'licenses' && (
        <div className="space-y-4">
          {!licenseAnalysis ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400">{t('compliance.noLicenseData', 'No license data. Run a security scan first.')}</p>
            </div>
          ) : (
            <>
              {/* Compatibility Status */}
              <div className={`rounded-lg p-4 ${
                licenseAnalysis.compatibilityStatus === 'compatible'
                  ? 'bg-green-900/20 border border-green-800'
                  : 'bg-orange-900/20 border border-orange-800'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${
                    licenseAnalysis.compatibilityStatus === 'compatible' ? 'text-green-400' : 'text-orange-400'
                  }`}>
                    {licenseAnalysis.compatibilityStatus === 'compatible' ? '✓' : '!'}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${
                      licenseAnalysis.compatibilityStatus === 'compatible' ? 'text-green-300' : 'text-orange-300'
                    }`}>
                      {licenseAnalysis.compatibilityStatus === 'compatible'
                        ? t('compliance.licensesCompatible', 'All licenses are compatible')
                        : t('compliance.licensesReview', 'Copyleft licenses detected - review required')}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {licenseAnalysis.totalPackages} {t('compliance.packages', 'packages')}, {licenseAnalysis.uniqueLicenses} {t('compliance.uniqueLicenses', 'unique licenses')}
                    </p>
                  </div>
                </div>
              </div>

              {/* License Groups */}
              <div className="space-y-2">
                {licenseAnalysis.licenseGroups.map((group) => (
                  <div key={group.license} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{group.license}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${licenseCategoryColor(group.category)}`}>
                          {group.category}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">{group.count} {t('compliance.packages', 'packages')}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {group.packages.slice(0, 10).map((pkg) => (
                        <span key={pkg} className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                          {pkg}
                        </span>
                      ))}
                      {group.packages.length > 10 && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-500">
                          +{group.packages.length - 10} {t('compliance.more', 'more')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
