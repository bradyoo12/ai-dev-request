import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@codesandbox/sandpack-react', () => ({
  SandpackProvider: ({ children }: any) => <div data-testid="sandpack-provider">{children}</div>,
  SandpackLayout: ({ children }: any) => <div data-testid="sandpack-layout">{children}</div>,
  SandpackFileExplorer: () => <div data-testid="sandpack-file-explorer" />,
  SandpackCodeEditor: () => <div data-testid="sandpack-code-editor" />,
  SandpackPreview: () => <div data-testid="sandpack-preview" />,
}))

import CodePreview from './CodePreview'

describe('CodePreview', () => {
  const files = {
    '/App.tsx': 'export default function App() { return <div>Hello</div> }',
    '/index.css': 'body { margin: 0; }',
  }

  it('renders title', () => {
    render(<CodePreview files={files} />)
    expect(screen.getByText('codePreview.title')).toBeInTheDocument()
  })

  it('renders custom project name', () => {
    render(<CodePreview files={files} projectName="My Project" />)
    expect(screen.getByText('My Project')).toBeInTheDocument()
  })

  it('renders viewport switcher', () => {
    render(<CodePreview files={files} />)
    expect(screen.getByText('codePreview.viewport.desktop')).toBeInTheDocument()
    expect(screen.getByText('codePreview.viewport.tablet')).toBeInTheDocument()
    expect(screen.getByText('codePreview.viewport.mobile')).toBeInTheDocument()
  })

  it('renders sandpack components', () => {
    render(<CodePreview files={files} />)
    expect(screen.getByTestId('sandpack-provider')).toBeInTheDocument()
    expect(screen.getByTestId('sandpack-layout')).toBeInTheDocument()
  })

  it('renders file count', () => {
    render(<CodePreview files={files} />)
    expect(screen.getByText('codePreview.livePreview')).toBeInTheDocument()
  })

  it('renders copy code button', () => {
    render(<CodePreview files={files} />)
    expect(screen.getByText('codePreview.copyCode')).toBeInTheDocument()
  })
})
