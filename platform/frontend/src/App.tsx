import { useState } from 'react'
import './App.css'
import { createRequest, analyzeRequest, generateProposal, approveProposal, startBuild } from './api/requests'
import type { DevRequestResponse, AnalysisResponse, ProposalResponse, ProductionResponse } from './api/requests'

type ViewState = 'form' | 'submitting' | 'analyzing' | 'analyzed' | 'generatingProposal' | 'proposal' | 'approving' | 'building' | 'completed' | 'error'

function App() {
  const [request, setRequest] = useState('')
  const [email, setEmail] = useState('')
  const [viewState, setViewState] = useState<ViewState>('form')
  const [submittedRequest, setSubmittedRequest] = useState<DevRequestResponse | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [proposalResult, setProposalResult] = useState<ProposalResponse | null>(null)
  const [productionResult, setProductionResult] = useState<ProductionResponse | null>(null)
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

  const handleGenerateProposal = async () => {
    if (!submittedRequest) return

    setViewState('generatingProposal')
    try {
      const proposal = await generateProposal(submittedRequest.id)
      setProposalResult(proposal)
      setViewState('proposal')
    } catch (error) {
      console.error('Failed to generate proposal:', error)
      setErrorMessage(error instanceof Error ? error.message : '제안서 생성 중 오류가 발생했습니다.')
      setViewState('error')
    }
  }

  const handleApproveAndBuild = async () => {
    if (!submittedRequest) return

    setViewState('approving')
    try {
      await approveProposal(submittedRequest.id)
      setViewState('building')
      const production = await startBuild(submittedRequest.id)
      setProductionResult(production)
      setViewState('completed')
    } catch (error) {
      console.error('Failed to build:', error)
      setErrorMessage(error instanceof Error ? error.message : '빌드 중 오류가 발생했습니다.')
      setViewState('error')
    }
  }

  const handleReset = () => {
    setRequest('')
    setEmail('')
    setViewState('form')
    setSubmittedRequest(null)
    setAnalysisResult(null)
    setProposalResult(null)
    setProductionResult(null)
    setErrorMessage('')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount)
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

      <main className="max-w-4xl mx-auto p-6">
        {viewState === 'form' && (
          <section className="text-center py-12">
            <h2 className="text-4xl font-bold mb-4">아이디어만 있으면 됩니다</h2>
            <p className="text-xl text-gray-400 mb-8">AI가 분석하고, 제안하고, 만들어드립니다</p>
          </section>
        )}

        <section className="bg-gray-800 rounded-2xl p-8 shadow-xl">
          {viewState === 'form' && (
            <form onSubmit={handleSubmit}>
              <label className="block text-lg font-medium mb-4">어떤 것을 만들고 싶으신가요?</label>
              <textarea
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder="예: 고객 예약을 받을 수 있는 미용실 웹사이트가 필요해요..."
                className="w-full h-40 p-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {exampleRequests.map((example) => (
                  <button key={example} type="button" onClick={() => setRequest(example)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm transition-colors">
                    {example}
                  </button>
                ))}
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2 text-gray-400">연락받으실 이메일 (선택)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={!request.trim()}
                className="mt-6 w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-medium text-lg transition-colors">
                🔍 AI 분석 시작
              </button>
            </form>
          )}

          {viewState === 'submitting' && (
            <div className="text-center py-12">
              <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"></div>
              <h3 className="text-2xl font-bold mb-2">요청을 접수하고 있습니다...</h3>
            </div>
          )}

          {viewState === 'analyzing' && (
            <div className="text-center py-12">
              <div className="animate-pulse"><div className="text-6xl mb-6">🤖</div></div>
              <h3 className="text-2xl font-bold mb-2">AI가 요청을 분석하고 있습니다...</h3>
              <p className="text-gray-400">요구사항을 추출하고 기술 스택을 분석 중입니다</p>
            </div>
          )}

          {viewState === 'analyzed' && analysisResult && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">✅</div>
                <div>
                  <h3 className="text-2xl font-bold">분석 완료!</h3>
                  <p className="text-gray-400">{analysisResult.summary}</p>
                </div>
              </div>

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

              <div className="flex gap-4">
                <button onClick={handleReset}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors">
                  새 요청 작성
                </button>
                <button onClick={handleGenerateProposal}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">
                  📄 제안서 받기
                </button>
              </div>
            </div>
          )}

          {viewState === 'generatingProposal' && (
            <div className="text-center py-12">
              <div className="animate-pulse"><div className="text-6xl mb-6">📝</div></div>
              <h3 className="text-2xl font-bold mb-2">제안서를 작성하고 있습니다...</h3>
              <p className="text-gray-400">아키텍처, 견적, 일정을 계획 중입니다</p>
            </div>
          )}

          {viewState === 'proposal' && proposalResult && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">📋</div>
                <div>
                  <h3 className="text-2xl font-bold">{proposalResult.proposal.title}</h3>
                  <p className="text-gray-400">{proposalResult.proposal.summary}</p>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl p-6 mb-6">
                <h4 className="font-bold mb-4 text-lg">💰 견적</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-300 text-sm">개발 비용</div>
                    <div className="text-3xl font-bold">{formatCurrency(proposalResult.proposal.pricing.development.amount)}</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-sm">월 운영비</div>
                    <div className="text-2xl font-bold">{formatCurrency(proposalResult.proposal.pricing.monthly.total)}</div>
                  </div>
                </div>
                {proposalResult.proposal.pricing.development.breakdown.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-700">
                    <div className="text-sm text-gray-300 mb-2">상세 내역</div>
                    {proposalResult.proposal.pricing.development.breakdown.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{item.item}</span>
                        <span>{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-gray-900 rounded-xl p-4 mb-4">
                <h4 className="font-bold mb-3">📅 일정 (총 {proposalResult.proposal.timeline.totalDays}일)</h4>
                <div className="space-y-2">
                  {proposalResult.proposal.milestones.map((milestone, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {milestone.phase}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{milestone.name}</div>
                        <div className="text-gray-400 text-sm">{milestone.description}</div>
                        <div className="text-blue-400 text-sm">{milestone.durationDays}일</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scope */}
              <div className="bg-gray-900 rounded-xl p-4 mb-4">
                <h4 className="font-bold mb-3">✅ 포함 범위</h4>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  {proposalResult.proposal.scope.included.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                {proposalResult.proposal.scope.excluded.length > 0 && (
                  <>
                    <h4 className="font-bold mt-4 mb-2 text-orange-400">❌ 제외 범위</h4>
                    <ul className="list-disc list-inside text-gray-400 space-y-1">
                      {proposalResult.proposal.scope.excluded.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* Terms */}
              <div className="bg-gray-900 rounded-xl p-4 mb-6">
                <h4 className="font-bold mb-3">📜 계약 조건</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-400">결제:</span> {proposalResult.proposal.terms.payment}</div>
                  <div><span className="text-gray-400">보증:</span> {proposalResult.proposal.terms.warranty}</div>
                  <div><span className="text-gray-400">지원:</span> {proposalResult.proposal.terms.support}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button onClick={handleReset}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors">
                  새 요청 작성
                </button>
                <button onClick={handleApproveAndBuild}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-medium transition-colors">
                  ✅ 승인 및 제작 시작
                </button>
              </div>
            </div>
          )}

          {viewState === 'approving' && (
            <div className="text-center py-12">
              <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-6"></div>
              <h3 className="text-2xl font-bold mb-2">제안서를 승인하고 있습니다...</h3>
            </div>
          )}

          {viewState === 'building' && (
            <div className="text-center py-12">
              <div className="animate-pulse"><div className="text-6xl mb-6">🔨</div></div>
              <h3 className="text-2xl font-bold mb-2">프로젝트를 생성하고 있습니다...</h3>
              <p className="text-gray-400">AI가 코드를 작성하고 있습니다. 잠시만 기다려주세요.</p>
              <div className="mt-6 flex justify-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}

          {viewState === 'completed' && productionResult && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">🎉</div>
                <div>
                  <h3 className="text-2xl font-bold">프로젝트 생성 완료!</h3>
                  <p className="text-gray-400">{productionResult.production.message}</p>
                </div>
              </div>

              <div className="bg-green-900/30 border border-green-700 rounded-xl p-6 mb-6">
                <h4 className="font-bold mb-4 text-green-400">📁 프로젝트 정보</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">프로젝트 ID</div>
                    <div className="font-mono">{productionResult.production.projectId}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">프로젝트 타입</div>
                    <div>{productionResult.production.projectType}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">생성된 파일</div>
                    <div>{productionResult.production.filesGenerated}개</div>
                  </div>
                  <div>
                    <div className="text-gray-400">상태</div>
                    <div className="text-green-400">{productionResult.production.status}</div>
                  </div>
                </div>
              </div>

              {productionResult.production.setupCommands.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 mb-4">
                  <h4 className="font-bold mb-3">⚙️ 설정 명령어</h4>
                  <div className="bg-black rounded-lg p-3 font-mono text-sm overflow-x-auto">
                    {productionResult.production.setupCommands.map((cmd, i) => (
                      <div key={i} className="text-green-400">$ {cmd}</div>
                    ))}
                  </div>
                </div>
              )}

              {productionResult.production.envVariables.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 mb-6">
                  <h4 className="font-bold mb-3">🔐 필요한 환경 변수</h4>
                  <div className="space-y-2">
                    {productionResult.production.envVariables.map((env, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <code className="bg-gray-800 px-2 py-1 rounded">{env.name}</code>
                        <span className="text-gray-400">{env.description}</span>
                        {env.required && <span className="text-red-400 text-xs">(필수)</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button onClick={handleReset}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors">
                  새 요청 작성
                </button>
                <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">
                  📥 프로젝트 다운로드
                </button>
              </div>
            </div>
          )}

          {viewState === 'error' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-6">❌</div>
              <h3 className="text-2xl font-bold mb-4">오류가 발생했습니다</h3>
              <p className="text-red-400 mb-6">{errorMessage}</p>
              <button onClick={() => setViewState('form')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors">
                다시 시도
              </button>
            </div>
          )}
        </section>

        {viewState === 'form' && (
          <>
            <section className="py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="text-xl font-bold mb-2">1. 요청</h3>
                <p className="text-gray-400">자연어로 원하는 것을 설명하세요.</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="text-xl font-bold mb-2">2. 분석 & 제안</h3>
                <p className="text-gray-400">AI가 요구사항을 분석하고 견적을 제안합니다.</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="text-3xl mb-3">🤖</div>
                <h3 className="text-xl font-bold mb-2">3. 자동 제작</h3>
                <p className="text-gray-400">승인하면 AI가 코드를 생성하고 배포합니다.</p>
              </div>
            </section>

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

      <footer className="border-t border-gray-700 p-6 text-center text-gray-500">
        <p>© 2026 AI Dev Request Platform. Built with BradYoo Ecosystem.</p>
      </footer>
    </div>
  )
}

export default App
