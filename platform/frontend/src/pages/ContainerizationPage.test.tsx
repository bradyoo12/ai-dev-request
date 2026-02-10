import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string, fallback?: string) => fallback || key
  return { useTranslation: () => ({ t }) }
})

const mockGenerateDockerfile = vi.fn(() => Promise.resolve({
  id: 'cfg-1',
  projectId: 1,
  detectedStack: 'nodejs',
  dockerfile: 'FROM node:20-alpine AS builder\nWORKDIR /app\nCOPY . .\nRUN npm ci',
  composeFile: 'version: "3.8"\nservices:\n  app:\n    build: .',
  k8sManifest: null,
  registryUrl: null,
  imageName: 'project-1',
  imageTag: 'latest',
  buildStatus: 'pending',
  buildLogs: null,
  errorMessage: null,
  buildDurationMs: 0,
  createdAt: '2026-02-11T00:00:00Z',
  builtAt: null,
  deployedAt: null,
}))

vi.mock('../api/containerization', () => ({
  generateDockerfile: (...args: unknown[]) => mockGenerateDockerfile(...args),
  getContainerConfig: vi.fn(() => Promise.resolve({
    id: 'cfg-1',
    projectId: 1,
    detectedStack: 'nodejs',
    dockerfile: 'FROM node:20-alpine',
    composeFile: 'version: "3.8"',
    k8sManifest: null,
    registryUrl: null,
    imageName: 'project-1',
    imageTag: 'latest',
    buildStatus: 'built',
    buildLogs: '[]',
    errorMessage: null,
    buildDurationMs: 12500,
    createdAt: '2026-02-11T00:00:00Z',
    builtAt: '2026-02-11T01:00:00Z',
    deployedAt: null,
  })),
  triggerBuild: vi.fn(() => Promise.resolve({
    id: 'cfg-1',
    projectId: 1,
    buildStatus: 'built',
    buildDurationMs: 12500,
  })),
  getBuildStatus: vi.fn(() => Promise.resolve({
    projectId: 1,
    status: 'built',
    imageName: 'project-1',
    imageTag: 'latest',
    buildDurationMs: 12500,
    errorMessage: null,
    builtAt: '2026-02-11T01:00:00Z',
    deployedAt: null,
  })),
  getBuildLogs: vi.fn(() => Promise.resolve({
    projectId: 1,
    status: 'built',
    logs: JSON.stringify([
      { timestamp: '2026-02-11T00:00:00Z', message: 'Build started...' },
      { timestamp: '2026-02-11T00:00:01Z', message: 'Installing dependencies...' },
    ]),
  })),
  deployContainer: vi.fn(() => Promise.resolve({
    id: 'cfg-1',
    projectId: 1,
    buildStatus: 'deployed',
    deployedAt: '2026-02-11T02:00:00Z',
  })),
  generateK8sManifest: vi.fn(() => Promise.resolve({
    id: 'cfg-1',
    projectId: 1,
    k8sManifest: 'apiVersion: apps/v1\nkind: Deployment',
  })),
}))

import ContainerizationPage from './ContainerizationPage'

beforeEach(() => { vi.clearAllMocks() })

describe('ContainerizationPage', () => {
  it('renders the page with title', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<ContainerizationPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Docker Containerization')
  })

  it('shows project ID input', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<ContainerizationPage />)
      container = result.container
    })
    const input = container!.querySelector('[data-testid="project-id-input"]')
    expect(input).toBeTruthy()
  })

  it('shows generate button', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<ContainerizationPage />)
      container = result.container
    })
    const btn = container!.querySelector('[data-testid="generate-btn"]')
    expect(btn).toBeTruthy()
    expect(btn!.textContent).toContain('Generate Dockerfile')
  })

  it('shows load config button', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<ContainerizationPage />)
      container = result.container
    })
    const btn = container!.querySelector('[data-testid="load-config-btn"]')
    expect(btn).toBeTruthy()
    expect(btn!.textContent).toContain('Load Config')
  })

  it('shows error when generating without project ID', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<ContainerizationPage />)
      container = result.container
    })
    const btn = container!.querySelector('[data-testid="generate-btn"]') as HTMLElement
    await act(async () => {
      btn.click()
    })
    expect(container!.textContent).toContain('Please enter a valid project ID')
  })

  it('displays dockerfile preview after generation', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<ContainerizationPage />)
      container = result.container
    })

    // Set project ID
    const input = container!.querySelector('[data-testid="project-id-input"]') as HTMLInputElement
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )!.set!
      nativeInputValueSetter.call(input, '1')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    // Click generate
    const btn = container!.querySelector('[data-testid="generate-btn"]') as HTMLElement
    await act(async () => {
      btn.click()
    })

    // Check that dockerfile preview appears
    const preview = container!.querySelector('[data-testid="dockerfile-preview"]')
    expect(preview).toBeTruthy()
    expect(preview!.textContent).toContain('FROM node:20-alpine')
  })

  it('shows detected stack after generation', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<ContainerizationPage />)
      container = result.container
    })

    const input = container!.querySelector('[data-testid="project-id-input"]') as HTMLInputElement
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )!.set!
      nativeInputValueSetter.call(input, '1')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const btn = container!.querySelector('[data-testid="generate-btn"]') as HTMLElement
    await act(async () => {
      btn.click()
    })

    const stack = container!.querySelector('[data-testid="detected-stack"]')
    expect(stack).toBeTruthy()
    expect(stack!.textContent).toContain('Node.js')
  })

  it('shows build status badge after generation', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<ContainerizationPage />)
      container = result.container
    })

    const input = container!.querySelector('[data-testid="project-id-input"]') as HTMLInputElement
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )!.set!
      nativeInputValueSetter.call(input, '1')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const btn = container!.querySelector('[data-testid="generate-btn"]') as HTMLElement
    await act(async () => {
      btn.click()
    })

    const status = container!.querySelector('[data-testid="build-status"]')
    expect(status).toBeTruthy()
    expect(status!.textContent).toContain('pending')
  })

  it('shows action buttons after config is loaded', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<ContainerizationPage />)
      container = result.container
    })

    const input = container!.querySelector('[data-testid="project-id-input"]') as HTMLInputElement
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )!.set!
      nativeInputValueSetter.call(input, '1')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const btn = container!.querySelector('[data-testid="generate-btn"]') as HTMLElement
    await act(async () => {
      btn.click()
    })

    expect(container!.querySelector('[data-testid="build-btn"]')).toBeTruthy()
    expect(container!.querySelector('[data-testid="deploy-btn"]')).toBeTruthy()
    expect(container!.querySelector('[data-testid="refresh-status-btn"]')).toBeTruthy()
    expect(container!.querySelector('[data-testid="load-logs-btn"]')).toBeTruthy()
  })

  it('shows registry configuration inputs after config is loaded', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<ContainerizationPage />)
      container = result.container
    })

    const input = container!.querySelector('[data-testid="project-id-input"]') as HTMLInputElement
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )!.set!
      nativeInputValueSetter.call(input, '1')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const btn = container!.querySelector('[data-testid="generate-btn"]') as HTMLElement
    await act(async () => {
      btn.click()
    })

    expect(container!.querySelector('[data-testid="registry-url-input"]')).toBeTruthy()
    expect(container!.querySelector('[data-testid="image-tag-input"]')).toBeTruthy()
  })

  it('shows K8s generation button after config is loaded', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<ContainerizationPage />)
      container = result.container
    })

    const input = container!.querySelector('[data-testid="project-id-input"]') as HTMLInputElement
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )!.set!
      nativeInputValueSetter.call(input, '1')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const btn = container!.querySelector('[data-testid="generate-btn"]') as HTMLElement
    await act(async () => {
      btn.click()
    })

    const k8sBtn = container!.querySelector('[data-testid="generate-k8s-btn"]')
    expect(k8sBtn).toBeTruthy()
    expect(k8sBtn!.textContent).toContain('Generate K8s Manifest')
  })

  it('shows compose file toggle after generation', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<ContainerizationPage />)
      container = result.container
    })

    const input = container!.querySelector('[data-testid="project-id-input"]') as HTMLInputElement
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )!.set!
      nativeInputValueSetter.call(input, '1')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const btn = container!.querySelector('[data-testid="generate-btn"]') as HTMLElement
    await act(async () => {
      btn.click()
    })

    const toggleBtn = container!.querySelector('[data-testid="toggle-compose"]')
    expect(toggleBtn).toBeTruthy()
    expect(toggleBtn!.textContent).toContain('docker-compose.yml')
  })

  it('shows image name and tag after generation', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<ContainerizationPage />)
      container = result.container
    })

    const input = container!.querySelector('[data-testid="project-id-input"]') as HTMLInputElement
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )!.set!
      nativeInputValueSetter.call(input, '1')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const btn = container!.querySelector('[data-testid="generate-btn"]') as HTMLElement
    await act(async () => {
      btn.click()
    })

    expect(container!.textContent).toContain('project-1:latest')
  })
})
