import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
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

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error)
    console.error('[ErrorBoundary] Component stack:', info.componentStack)
  }

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const t = (key: string) => i18n.t(key)

      return (
        <div className="min-h-screen bg-warm-950 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-3">
              {t('errorBoundary.title')}
            </h1>
            <p className="text-warm-400 mb-8 leading-relaxed">
              {t('errorBoundary.message')}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleGoHome}
                className="px-5 py-2.5 rounded-xl bg-warm-800 hover:bg-warm-700 text-warm-200 font-medium transition-colors"
              >
                {t('errorBoundary.goHome')}
              </button>
              <button
                onClick={this.handleRetry}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                {t('errorBoundary.retry')}
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-warm-500 cursor-pointer text-sm hover:text-warm-400 transition-colors">
                  {t('errorBoundary.details')}
                </summary>
                <pre className="mt-3 p-4 bg-warm-900 border border-warm-700 rounded-xl text-xs text-red-300 overflow-x-auto whitespace-pre-wrap">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
