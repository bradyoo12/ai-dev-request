import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string, fallback?: string) => fallback || key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/marketplace', () => ({
  browseTemplates: vi.fn(() => Promise.resolve({
    templates: [
      {
        id: 'tmpl-1',
        authorId: 1,
        name: 'SaaS Starter Kit',
        description: 'Full-stack SaaS application with auth and billing',
        category: 'web-app',
        techStack: '["React","TypeScript","Node.js"]',
        tags: '["saas","starter","fullstack"]',
        templateData: '{}',
        previewImageUrl: null,
        rating: 4.5,
        ratingCount: 12,
        downloadCount: 250,
        status: 'published',
        isOfficial: true,
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: null,
      },
      {
        id: 'tmpl-2',
        authorId: 2,
        name: 'REST API Boilerplate',
        description: 'Quick start API with authentication and validation',
        category: 'api',
        techStack: '["Node.js","Express","PostgreSQL"]',
        tags: '["api","rest","backend"]',
        templateData: '{}',
        previewImageUrl: null,
        rating: 4.2,
        ratingCount: 8,
        downloadCount: 180,
        status: 'published',
        isOfficial: false,
        createdAt: '2026-02-05T00:00:00Z',
        updatedAt: null,
      },
    ],
    totalCount: 2,
  })),
  getCategories: vi.fn(() => Promise.resolve([
    { category: 'web-app', count: 5 },
    { category: 'api', count: 3 },
    { category: 'mobile', count: 2 },
  ])),
  getPopularTemplates: vi.fn(() => Promise.resolve([
    {
      id: 'tmpl-1',
      authorId: 1,
      name: 'SaaS Starter Kit',
      description: 'Full-stack SaaS application with auth and billing',
      category: 'web-app',
      techStack: '["React","TypeScript","Node.js"]',
      tags: '["saas","starter","fullstack"]',
      templateData: '{}',
      previewImageUrl: null,
      rating: 4.5,
      ratingCount: 12,
      downloadCount: 250,
      status: 'published',
      isOfficial: true,
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: null,
    },
  ])),
  importTemplate: vi.fn(() => Promise.resolve({ success: true, templateId: 'tmpl-1', templateName: 'SaaS Starter Kit', templateData: '{}' })),
  rateTemplate: vi.fn(() => Promise.resolve({ success: true, newRating: 4.6, newRatingCount: 13 })),
  submitTemplate: vi.fn(() => Promise.resolve({ id: 'new-tmpl', name: 'New Template' })),
}))

import MarketplacePage from './MarketplacePage'

beforeEach(() => { vi.clearAllMocks() })

describe('MarketplacePage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<MarketplacePage />)
    })
    expect(document.body).toBeTruthy()
  })

  it('shows marketplace title', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<MarketplacePage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Template Marketplace')
  })

  it('displays template cards', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<MarketplacePage />)
      container = result.container
    })
    expect(container!.textContent).toContain('SaaS Starter Kit')
    expect(container!.textContent).toContain('REST API Boilerplate')
  })

  it('shows category filter tabs', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<MarketplacePage />)
      container = result.container
    })
    expect(container!.textContent).toContain('All')
    expect(container!.textContent).toContain('Web App')
    expect(container!.textContent).toContain('API')
    expect(container!.textContent).toContain('Mobile')
  })

  it('shows sort options', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<MarketplacePage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Popular')
    expect(container!.textContent).toContain('Newest')
    expect(container!.textContent).toContain('Highest Rated')
  })

  it('shows popular templates section', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<MarketplacePage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Popular Templates')
  })

  it('shows all templates section with count', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<MarketplacePage />)
      container = result.container
    })
    expect(container!.textContent).toContain('All Templates')
    expect(container!.textContent).toContain('(2)')
  })

  it('displays download counts on cards', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<MarketplacePage />)
      container = result.container
    })
    expect(container!.textContent).toContain('250')
    expect(container!.textContent).toContain('180')
  })

  it('displays ratings on cards', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<MarketplacePage />)
      container = result.container
    })
    expect(container!.textContent).toContain('4.5')
    expect(container!.textContent).toContain('4.2')
  })

  it('shows official badge for official templates', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<MarketplacePage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Official')
  })

  it('shows search input', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<MarketplacePage />)
      container = result.container
    })
    const searchInput = container!.querySelector('[data-testid="marketplace-search"]')
    expect(searchInput).toBeTruthy()
  })

  it('shows submit template button', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<MarketplacePage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Submit Template')
  })
})
