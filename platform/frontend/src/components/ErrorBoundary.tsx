import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import i18n from '../i18n'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const t = (key: string) => i18n.t(key)

      return (
        <div className="min-h-screen bg-warm-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-warm-900 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-white mb-2">
              {t('errorBoundary.title')}
            </h1>
            <p className="text-warm-400 text-sm mb-6">
              {t('errorBoundary.description')}
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs text-red-400 bg-warm-800 rounded-lg p-3 mb-6 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium text-white transition-colors"
              >
                {t('errorBoundary.retry')}
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 bg-warm-700 hover:bg-warm-600 rounded-xl text-sm font-medium text-white transition-colors"
              >
                {t('errorBoundary.goHome')}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
