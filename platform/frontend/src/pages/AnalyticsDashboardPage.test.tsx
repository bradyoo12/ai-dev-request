import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string, fallback?: string) => fallback || key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/analytics-dashboard', () => ({
  getDashboardMetrics: vi.fn(() => Promise.resolve({
    activeUsers: 42,
    totalRequests: 128,
    completionRate: 75.5,
    avgBuildTimeMinutes: 3.2,
    totalEvents: 500,
    period: 'weekly',
  })),
  getFunnelData: vi.fn(() => Promise.resolve({
    stages: [
      { name: 'Request Created', count: 100, conversionRate: 100, dropOffRate: 0 },
      { name: 'Analysis Completed', count: 85, conversionRate: 85, dropOffRate: 15 },
      { name: 'Proposal Viewed', count: 70, conversionRate: 70, dropOffRate: 30 },
      { name: 'Build Started', count: 50, conversionRate: 50, dropOffRate: 50 },
      { name: 'Build Completed', count: 40, conversionRate: 40, dropOffRate: 60 },
      { name: 'Preview Deployed', count: 30, conversionRate: 30, dropOffRate: 70 },
    ],
    period: 'weekly',
  })),
  getUsageBreakdown: vi.fn(() => Promise.resolve([
    { eventType: 'page_view', count: 200, uniqueUsers: 50 },
    { eventType: 'request_created', count: 100, uniqueUsers: 40 },
    { eventType: 'analysis_completed', count: 85, uniqueUsers: 35 },
  ])),
  getTrends: vi.fn(() => Promise.resolve([
    { date: '2026-02-05', value: 30 },
    { date: '2026-02-06', value: 45 },
    { date: '2026-02-07', value: 38 },
    { date: '2026-02-08', value: 52 },
    { date: '2026-02-09', value: 60 },
    { date: '2026-02-10', value: 48 },
    { date: '2026-02-11', value: 55 },
  ])),
}))

import AnalyticsDashboardPage from './AnalyticsDashboardPage'

beforeEach(() => { vi.clearAllMocks() })

describe('AnalyticsDashboardPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<AnalyticsDashboardPage />)
    })
    expect(document.body).toBeTruthy()
  })

  it('shows product analytics title', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<AnalyticsDashboardPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Product Analytics')
  })

  it('displays active users metric', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<AnalyticsDashboardPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Active Users')
    expect(container!.textContent).toContain('42')
  })

  it('displays total requests metric', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<AnalyticsDashboardPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Total Requests')
    expect(container!.textContent).toContain('128')
  })

  it('displays completion rate metric', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<AnalyticsDashboardPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Completion Rate')
    expect(container!.textContent).toContain('75.5%')
  })

  it('displays avg build time metric', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<AnalyticsDashboardPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Avg Build Time')
    expect(container!.textContent).toContain('3.2m')
  })

  it('shows conversion funnel section', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<AnalyticsDashboardPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Conversion Funnel')
    expect(container!.textContent).toContain('Request Created')
    expect(container!.textContent).toContain('Preview Deployed')
  })

  it('shows feature usage breakdown section', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<AnalyticsDashboardPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Feature Usage Breakdown')
    expect(container!.textContent).toContain('page_view')
    expect(container!.textContent).toContain('request_created')
  })

  it('shows trends section', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<AnalyticsDashboardPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Trends')
  })

  it('shows period filter buttons', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<AnalyticsDashboardPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Daily')
    expect(container!.textContent).toContain('Weekly')
    expect(container!.textContent).toContain('Monthly')
  })

  it('shows trend metric selector', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<AnalyticsDashboardPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Total Events')
  })
})
