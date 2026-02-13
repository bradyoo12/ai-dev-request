import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter/index.css'
import '@fontsource-variable/jetbrains-mono/index.css'
import './index.css'
import './i18n'
import App from './App.tsx'

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  createRoot(rootElement).render(
    <StrictMode>
      <Suspense fallback={<div className="min-h-screen bg-warm-900 flex items-center justify-center text-white">Loading...</div>}>
        <App />
      </Suspense>
    </StrictMode>,
  )
} catch (error) {
  console.error('Failed to initialize React application:', error)
  const rootElement = document.getElementById('root')
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; background: #1a1514; display: flex; align-items: center; justify-center; padding: 24px; font-family: system-ui, sans-serif;">
        <div style="max-width: 500px; background: #2a2120; border-radius: 16px; padding: 32px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h1 style="color: white; margin-bottom: 8px; font-size: 20px;">Application Error</h1>
          <p style="color: #a8a29e; margin-bottom: 16px; font-size: 14px;">
            Failed to load the application. Please try refreshing the page.
          </p>
          <pre style="color: #fca5a5; background: #3a2f2e; border-radius: 8px; padding: 12px; text-align: left; overflow: auto; font-size: 12px;">
            ${error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    `
  }
}
