import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams('requestId=test-id')],
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}))

vi.mock('../api/compiler', () => ({
  triggerCompilation: vi.fn(() => Promise.resolve({
    resultId: 'r1',
    success: true,
    errors: [],
    warnings: [],
    rawOutput: '',
    retryCount: 0,
  })),
  getCompilationResult: vi.fn(() => Promise.resolve(null)),
  triggerAutoFix: vi.fn(() => Promise.resolve({
    resultId: 'r2',
    success: true,
    errors: [],
    warnings: [],
    rawOutput: '',
    retryCount: 1,
  })),
  getSupportedLanguages: vi.fn(() => Promise.resolve([
    { id: 'typescript', name: 'TypeScript', command: 'npx tsc', extensions: ['.ts'] },
    { id: 'dotnet', name: '.NET', command: 'dotnet build', extensions: ['.cs'] },
  ])),
}))

import CompilerValidationPage from './CompilerValidationPage'

beforeEach(() => { vi.clearAllMocks() })

describe('CompilerValidationPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<CompilerValidationPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
