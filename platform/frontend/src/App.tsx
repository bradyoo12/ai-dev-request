import { useState } from 'react'
import './App.css'
import { createRequest } from './api/requests'
import type { DevRequestResponse } from './api/requests'

type ViewState = 'form' | 'submitting' | 'success' | 'error'

function App() {
  const [request, setRequest] = useState('')
  const [email, setEmail] = useState('')
  const [viewState, setViewState] = useState<ViewState>('form')
  const [submittedRequest, setSubmittedRequest] = useState<DevRequestResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!request.trim()) return

    setViewState('submitting')
    setErrorMessage('')

    try {
      const result = await createRequest({
        description: request,
        contactEmail: email || undefined,
      })
      setSubmittedRequest(result)
      setViewState('success')
    } catch (error) {
      console.error('Failed to submit request:', error)
      setErrorMessage(error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.')
      setViewState('error')
    }
  }

  const handleReset = () => {
    setRequest('')
    setEmail('')
    setViewState('form')
    setSubmittedRequest(null)
    setErrorMessage('')
  }

  const exampleRequests = [
    '쇼핑몰 만들어주세요',
    '업무 자동화 봇 필요해요',
    '데이터 대시보드 원해요',
    'AI 챗봇 만들어주세요',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="p-6 border-b border-gray-700">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={handleReset}>
            🚀 AI Dev Request
          </h1>
          <nav className="space-x-4">
            <a href="#pricing" className="hover:text-blue-400">요금제</a>
            <a href="#" className="hover:text-blue-400">문의</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        {/* Hero Section */}
        <section className="text-center py-12">
          <h2 className="text-4xl font-bold mb-4">
            아이디어만 있으면 됩니다
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            AI가 분석하고, 제안하고, 만들어드립니다
          </p>
        </section>

        {/* Request Form / Success / Error States */}
        <section className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          {viewState === 'form' && (
            <form onSubmit={handleSubmit}>
              <label className="block text-lg font-medium mb-4">
                어떤 것을 만들고 싶으신가요?
              </label>
              <textarea
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder="예: 고객 예약을 받을 수 있는 미용실 웹사이트가 필요해요. 예약 시간 선택, 스타일리스트 선택, 카카오페이 결제가 가능했으면 좋겠어요..."
                className="w-full h-40 p-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              {/* Quick Examples */}
              <div className="mt-4 flex flex-wrap gap-2">
                {exampleRequests.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setRequest(example)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>

              {/* Email Input */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2 text-gray-400">
                  연락받으실 이메일 (선택)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={!request.trim()}
                className="mt-6 w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-medium text-lg transition-colors"
              >
                🔍 AI 분석 시작
              </button>
            </form>
          )}

          {viewState === 'submitting' && (
            <div className="text-center py-12">
              <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"></div>
              <h3 className="text-2xl font-bold mb-2">요청을 분석하고 있습니다...</h3>
              <p className="text-gray-400">잠시만 기다려 주세요</p>
            </div>
          )}

          {viewState === 'success' && submittedRequest && (
            <div className="text-center py-8">
              <div className="text-6xl mb-6">✅</div>
              <h3 className="text-2xl font-bold mb-4">요청이 접수되었습니다!</h3>
              <p className="text-gray-400 mb-6">
                AI가 요청을 분석하고 곧 제안서를 준비해드리겠습니다.
              </p>
              <div className="bg-gray-900 rounded-xl p-4 text-left mb-6">
                <div className="text-sm text-gray-400 mb-1">요청 ID</div>
                <div className="font-mono text-blue-400">{submittedRequest.id}</div>
                <div className="text-sm text-gray-400 mt-3 mb-1">요청 내용</div>
                <div className="text-gray-200">{submittedRequest.description}</div>
                <div className="text-sm text-gray-400 mt-3 mb-1">상태</div>
                <div className="inline-block px-3 py-1 bg-yellow-600 rounded-full text-sm">
                  {submittedRequest.status}
                </div>
              </div>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
              >
                새 요청 작성
              </button>
            </div>
          )}

          {viewState === 'error' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-6">❌</div>
              <h3 className="text-2xl font-bold mb-4">오류가 발생했습니다</h3>
              <p className="text-red-400 mb-6">{errorMessage}</p>
              <button
                onClick={() => setViewState('form')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}
        </section>

        {/* Features */}
        <section className="py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="text-xl font-bold mb-2">1. 요청</h3>
            <p className="text-gray-400">
              자연어로 원하는 것을 설명하세요. 전문 용어 없이도 괜찮아요.
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-xl font-bold mb-2">2. 분석 & 제안</h3>
            <p className="text-gray-400">
              AI가 요구사항을 분석하고 기술 스택과 견적을 제안합니다.
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="text-xl font-bold mb-2">3. 자동 제작</h3>
            <p className="text-gray-400">
              승인하면 AI가 코드를 생성하고 배포까지 자동으로 진행합니다.
            </p>
          </div>
        </section>

        {/* Pricing Preview */}
        <section id="pricing" className="py-12 text-center">
          <h3 className="text-2xl font-bold mb-6">합리적인 가격</h3>
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="bg-gray-800 p-6 rounded-xl w-64">
              <div className="text-lg font-bold">Starter</div>
              <div className="text-3xl font-bold my-2">₩49,000<span className="text-lg text-gray-400">/월</span></div>
              <div className="text-gray-400 text-sm">3개 프로젝트</div>
            </div>
            <div className="bg-blue-600 p-6 rounded-xl w-64 ring-2 ring-blue-400">
              <div className="text-lg font-bold">Pro</div>
              <div className="text-3xl font-bold my-2">₩149,000<span className="text-lg text-gray-200">/월</span></div>
              <div className="text-gray-200 text-sm">10개 프로젝트 + 전용 리소스</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 p-6 text-center text-gray-500">
        <p>© 2026 AI Dev Request Platform. Built with BradYoo Ecosystem.</p>
      </footer>
    </div>
  )
}

export default App
