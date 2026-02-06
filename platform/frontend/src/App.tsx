import { useState } from 'react'
import './App.css'
import { createRequest, analyzeRequest } from './api/requests'
import type { DevRequestResponse, AnalysisResponse } from './api/requests'

type ViewState = 'form' | 'submitting' | 'analyzing' | 'analyzed' | 'error'

function App() {
  const [request, setRequest] = useState('')
  const [email, setEmail] = useState('')
  const [viewState, setViewState] = useState<ViewState>('form')
  const [submittedRequest, setSubmittedRequest] = useState<DevRequestResponse | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!request.trim()) return

    setViewState('submitting')
    setErrorMessage('')

    try {
      // Step 1: Create request
      const result = await createRequest({
        description: request,
        contactEmail: email || undefined,
      })
      setSubmittedRequest(result)

      // Step 2: Start AI analysis
      setViewState('analyzing')
      const analysis = await analyzeRequest(result.id)
      setAnalysisResult(analysis)
      setViewState('analyzed')
    } catch (error) {
      console.error('Failed to process request:', error)
      setErrorMessage(error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.')
      setViewState('error')
    }
  }

  const handleReset = () => {
    setRequest('')
    setEmail('')
    setViewState('form')
    setSubmittedRequest(null)
    setAnalysisResult(null)
    setErrorMessage('')
  }

  const exampleRequests = [
    '쇼핑몰 만들어주세요',
    '업무 자동화 봇 필요해요',
    '데이터 대시보드 원해요',
    'AI 챗봇 만들어주세요',
  ]

  const getComplexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'simple': return 'bg-green-600'
      case 'medium': return 'bg-yellow-600'
      case 'complex': return 'bg-orange-600'
      case 'enterprise': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const getComplexityLabel = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'simple': return '간단'
      case 'medium': return '보통'
      case 'complex': return '복잡'
      case 'enterprise': return '대규모'
      default: return complexity
    }
  }

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
        {/* Hero Section - only show on form state */}
        {viewState === 'form' && (
          <section className="text-center py-12">
            <h2 className="text-4xl font-bold mb-4">
              아이디어만 있으면 됩니다
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              AI가 분석하고, 제안하고, 만들어드립니다
            </p>
          </section>
        )}

        {/* Request Form / States */}
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
              <h3 className="text-2xl font-bold mb-2">요청을 접수하고 있습니다...</h3>
              <p className="text-gray-400">잠시만 기다려 주세요</p>
            </div>
          )}

          {viewState === 'analyzing' && (
            <div className="text-center py-12">
              <div className="animate-pulse">
                <div className="text-6xl mb-6">🤖</div>
              </div>
              <h3 className="text-2xl font-bold mb-2">AI가 요청을 분석하고 있습니다...</h3>
              <p className="text-gray-400 mb-4">요구사항을 추출하고 기술 스택을 분석 중입니다</p>
              <div className="flex justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          {viewState === 'analyzed' && analysisResult && submittedRequest && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">✅</div>
                <div>
                  <h3 className="text-2xl font-bold">분석 완료!</h3>
                  <p className="text-gray-400">{analysisResult.summary}</p>
                </div>
              </div>

              {/* Analysis Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-900 rounded-xl p-4 text-center">
                  <div className="text-gray-400 text-sm mb-1">분류</div>
                  <div className="font-bold">{analysisResult.category}</div>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 text-center">
                  <div className="text-gray-400 text-sm mb-1">복잡도</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm ${getComplexityColor(analysisResult.complexity)}`}>
                    {getComplexityLabel(analysisResult.complexity)}
                  </div>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 text-center">
                  <div className="text-gray-400 text-sm mb-1">예상 기간</div>
                  <div className="font-bold">{analysisResult.estimatedDays}일</div>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 text-center">
                  <div className="text-gray-400 text-sm mb-1">실현 가능성</div>
                  <div className="font-bold">{Math.round(analysisResult.feasibility.score * 100)}%</div>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-gray-900 rounded-xl p-4 mb-4">
                <h4 className="font-bold mb-3">📋 요구사항</h4>
                <div className="space-y-3">
                  {analysisResult.requirements.functional.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-1">기능 요구사항</div>
                      <ul className="list-disc list-inside text-gray-200 space-y-1">
                        {analysisResult.requirements.functional.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResult.requirements.integrations.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-1">외부 연동</div>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.requirements.integrations.map((int, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-700 rounded text-sm">{int}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="bg-gray-900 rounded-xl p-4 mb-4">
                <h4 className="font-bold mb-3">🛠 추천 기술 스택</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <div className="text-sm text-gray-400">Frontend</div>
                    <div className="text-blue-400">{analysisResult.suggestedStack.frontend || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Backend</div>
                    <div className="text-green-400">{analysisResult.suggestedStack.backend || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Database</div>
                    <div className="text-yellow-400">{analysisResult.suggestedStack.database || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Others</div>
                    <div className="text-gray-300">{analysisResult.suggestedStack.others?.join(', ') || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Risks/Questions */}
              {(analysisResult.feasibility.risks.length > 0 || analysisResult.feasibility.questions.length > 0) && (
                <div className="bg-gray-900 rounded-xl p-4 mb-6">
                  <h4 className="font-bold mb-3">⚠️ 고려사항</h4>
                  {analysisResult.feasibility.risks.length > 0 && (
                    <div className="mb-2">
                      <div className="text-sm text-orange-400 mb-1">리스크</div>
                      <ul className="list-disc list-inside text-gray-300 space-y-1">
                        {analysisResult.feasibility.risks.map((risk, i) => (
                          <li key={i}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResult.feasibility.questions.length > 0 && (
                    <div>
                      <div className="text-sm text-blue-400 mb-1">추가 확인 필요</div>
                      <ul className="list-disc list-inside text-gray-300 space-y-1">
                        {analysisResult.feasibility.questions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
                >
                  새 요청 작성
                </button>
                <button
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
                >
                  📄 제안서 받기
                </button>
              </div>
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

        {/* Features - only show on form state */}
        {viewState === 'form' && (
          <>
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
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 p-6 text-center text-gray-500">
        <p>© 2026 AI Dev Request Platform. Built with BradYoo Ecosystem.</p>
      </footer>
    </div>
  )
}

export default App
