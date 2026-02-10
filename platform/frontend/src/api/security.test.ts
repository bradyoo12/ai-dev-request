import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({
  default: { t: (key: string) => key },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockStorage: Record<string, string> = {}
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value }),
    removeItem: vi.fn((key: string) => { delete mockStorage[key] }),
    clear: vi.fn(() => Object.keys(mockStorage).forEach(k => delete mockStorage[k])),
  },
  writable: true,
})

import {
  triggerSecurityScan,
  getSbomReport,
  getVulnerabilities,
  getLicenseAnalysis,
  exportSbom,
} from './security'

beforeEach(() => {
  vi.clearAllMocks()
  Object.keys(mockStorage).forEach(k => delete mockStorage[k])
})

describe('security api', () => {
  const requestId = '123e4567-e89b-12d3-a456-426614174000'

  describe('triggerSecurityScan', () => {
    it('triggers scan successfully', async () => {
      const scanResponse = {
        sbomReportId: 'report-1',
        dependencyCount: 10,
        vulnerabilityCount: 2,
        criticalCount: 0,
        highCount: 1,
        mediumCount: 1,
        lowCount: 0,
        generatedAt: '2026-01-01T00:00:00Z',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(scanResponse),
      })

      const result = await triggerSecurityScan(requestId)
      expect(result).toEqual(scanResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/requests/${requestId}/security/scan`),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Scan failed' }),
      })

      await expect(triggerSecurityScan(requestId)).rejects.toThrow('Scan failed')
    })
  })

  describe('getSbomReport', () => {
    it('returns sbom report', async () => {
      const report = {
        id: 'report-1',
        format: 'CycloneDX',
        componentsJson: '[]',
        dependencyCount: 0,
        generatedAt: '2026-01-01T00:00:00Z',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(report),
      })

      const result = await getSbomReport(requestId)
      expect(result).toEqual(report)
    })

    it('returns null on 404', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      const result = await getSbomReport(requestId)
      expect(result).toBeNull()
    })
  })

  describe('getVulnerabilities', () => {
    it('returns vulnerabilities list', async () => {
      const vulns = [
        {
          id: 'v1',
          packageName: 'lodash',
          packageVersion: '4.17.20',
          ecosystem: 'npm',
          vulnerabilityId: 'CVE-2021-23337',
          severity: 'high',
          summary: 'Command injection',
          fixedVersion: '4.17.21',
          scannedAt: '2026-01-01T00:00:00Z',
        },
      ]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(vulns),
      })

      const result = await getVulnerabilities(requestId)
      expect(result).toEqual(vulns)
    })

    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      const result = await getVulnerabilities(requestId)
      expect(result).toEqual([])
    })
  })

  describe('getLicenseAnalysis', () => {
    it('returns license analysis', async () => {
      const analysis = {
        totalPackages: 10,
        uniqueLicenses: 3,
        licenseGroups: [],
        hasCopyleftLicenses: false,
        compatibilityStatus: 'compatible',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(analysis),
      })

      const result = await getLicenseAnalysis(requestId)
      expect(result).toEqual(analysis)
    })

    it('returns null on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      const result = await getLicenseAnalysis(requestId)
      expect(result).toBeNull()
    })
  })

  describe('exportSbom', () => {
    it('exports as blob', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/json' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      const result = await exportSbom(requestId, 'cyclonedx')
      expect(result).toEqual(mockBlob)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      await expect(exportSbom(requestId, 'spdx')).rejects.toThrow('Export failed')
    })
  })
})
