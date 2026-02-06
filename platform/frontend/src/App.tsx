import { useState } from 'react'
import './App.css'

function App() {
  const [request, setRequest] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!request.trim()) return

    setIsSubmitting(true)
    // TODO: Connect to backend API
    console.log('Submitting request:', request)
    setTimeout(() => {
      setIsSubmitting(false)
      alert('요청이 접수되었습니다! (데모)')
    }, 1000)
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
          <h1 className="text-2xl font-bold">🚀 AI Dev Request</h1>
          <nav className="space-x-4">
            <a href="#" className="hover:text-blue-400">요금제</a>
            <a href="#" className="hover:text-blue-400">문의</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto p-6">
        <section className="text-center py-12">
          <h2 className="text-4xl font-bold mb-4">
            아이디어만 있으면 됩니다
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            AI가 분석하고, 제안하고, 만들어드립니다
          </p>
        </section>

        {/* Request Form */}
        <section className="bg-gray-800 rounded-2xl p-8 shadow-xl">
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

            <button
              type="submit"
              disabled={isSubmitting || !request.trim()}
              className="mt-6 w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-medium text-lg transition-colors"
            >
              {isSubmitting ? '분석 중...' : '🔍 AI 분석 시작'}
            </button>
          </form>
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
        <section className="py-12 text-center">
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
