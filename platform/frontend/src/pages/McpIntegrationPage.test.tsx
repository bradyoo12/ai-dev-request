import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string, fallback?: string) => fallback || key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/mcp-integration', () => ({
  getPlatformTools: vi.fn(() => Promise.resolve([
    { name: 'create_request', description: 'Create a new AI development request', inputSchema: '{"type":"object","properties":{}}' },
    { name: 'analyze_request', description: 'Run AI analysis on a request', inputSchema: '{"type":"object","properties":{}}' },
  ])),
  callPlatformTool: vi.fn(() => Promise.resolve({
    success: true,
    result: '{"message":"ok"}',
    error: null,
  })),
  listServers: vi.fn(() => Promise.resolve([
    {
      id: 'srv-1',
      projectId: null,
      name: 'Test Server',
      serverUrl: 'https://mcp.example.com',
      transport: 'sse',
      status: 'connected',
      authType: null,
      availableTools: '[{"name":"example_tool","description":"An example tool","inputSchema":"{}"}]',
      availableResources: null,
      toolCallCount: 5,
      lastConnectedAt: '2024-01-01T00:00:00Z',
      errorMessage: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: null,
    },
  ])),
  registerServer: vi.fn(() => Promise.resolve({
    id: 'srv-2',
    name: 'New Server',
    serverUrl: 'https://new.example.com',
    status: 'disconnected',
  })),
  unregisterServer: vi.fn(() => Promise.resolve()),
  getServerStatus: vi.fn(() => Promise.resolve({
    connectionId: 'srv-1',
    name: 'Test Server',
    status: 'connected',
    lastConnectedAt: '2024-01-01T00:00:00Z',
    toolCount: 1,
    resourceCount: 0,
    toolCallCount: 5,
    errorMessage: null,
  })),
  discoverTools: vi.fn(() => Promise.resolve({
    id: 'srv-1',
    name: 'Test Server',
    status: 'connected',
    availableTools: '[{"name":"discovered_tool"}]',
  })),
  callExternalTool: vi.fn(() => Promise.resolve({
    success: true,
    result: '{"output":"done"}',
    error: null,
  })),
}))

import McpIntegrationPage from './McpIntegrationPage'

beforeEach(() => { vi.clearAllMocks() })

describe('McpIntegrationPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<McpIntegrationPage />)
    })
    expect(document.body).toBeTruthy()
  })

  it('shows platform tools section', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<McpIntegrationPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Platform MCP Tools')
  })

  it('displays platform tool names', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<McpIntegrationPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('create_request')
    expect(container!.textContent).toContain('analyze_request')
  })

  it('shows Test Tool buttons', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<McpIntegrationPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Test Tool')
  })

  it('shows external servers section', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<McpIntegrationPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('External MCP Servers')
  })

  it('displays registered server name', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<McpIntegrationPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Test Server')
  })

  it('shows server status indicator', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<McpIntegrationPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('connected')
  })

  it('shows Add Server button', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<McpIntegrationPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Add Server')
  })

  it('shows Discover Tools button', async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(<McpIntegrationPage />)
      container = result.container
    })
    expect(container!.textContent).toContain('Discover Tools')
  })
})
