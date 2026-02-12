import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getAiElementsConfig,
  updateAiElementsConfig,
  getAiElementComponents,
  startStream,
  getAiElementsStats,
} from '../api/aiElements'
import type {
  AiElementsConfig,
  AiElementComponent,
  AiElementsStats,
} from '../api/aiElements'

type SubTab = 'stream' | 'components' | 'stats'

const SAMPLE_CODE = `import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StreamingPreviewProps {
  code: string
  language: string
  onCopy: () => void
  onDeploy: () => void
}

export function StreamingPreview({
  code,
  language,
  onCopy,
  onDeploy,
}: StreamingPreviewProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    return () => setVisible(false)
  }, [code])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-xl border border-white/10 bg-warm-900/80 backdrop-blur-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
            <span className="text-xs text-warm-400 font-mono">{language}</span>
            <div className="flex gap-2">
              <button onClick={onCopy} className="text-xs text-warm-400 hover:text-white transition-colors">
                Copy
              </button>
              <button onClick={onDeploy} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Deploy
              </button>
            </div>
          </div>
          <pre className="p-4 text-sm font-mono text-warm-200 overflow-x-auto">
            <code>{code}</code>
          </pre>
        </motion.div>
      )}
    </AnimatePresence>
  )
}`

const REASONING_STEPS = [
  'Analyzing the prompt for component requirements...',
  'Identifying React patterns: functional component with hooks',
  'Selecting animation library: framer-motion for smooth transitions',
  'Structuring props interface with TypeScript for type safety',
  'Adding copy and deploy action handlers to response actions',
  'Applying glass-morphism design with backdrop blur effects',
  'Generating streaming preview component with syntax highlighting',
  'Finalizing code output with proper imports and exports',
]

const ICON_MAP: Record<string, React.ReactNode> = {
  'message-square': <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  'brain': <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/><path d="M19 9H5a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2z"/><path d="M12 14v8"/><path d="M8 18h8"/></svg>,
  'code': <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  'zap': <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  'edit-3': <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>,
}

const CATEGORY_COLORS: Record<string, string> = {
  display: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  insight: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  action: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  input: 'text-green-400 bg-green-500/10 border-green-500/30',
}

export default function AiElementsPage() {
  useTranslation()
  const [subTab, setSubTab] = useState<SubTab>('stream')
  const [config, setConfig] = useState<AiElementsConfig | null>(null)
  const [components, setComponents] = useState<AiElementComponent[]>([])
  const [stats, setStats] = useState<AiElementsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Stream tab state
  const [prompt, setPrompt] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedCode, setStreamedCode] = useState('')
  const [streamedIndex, setStreamedIndex] = useState(0)
  const [reasoningStep, setReasoningStep] = useState(0)
  const [showReasoning, setShowReasoning] = useState(true)
  const [copied, setCopied] = useState(false)
  const streamTimerRef = useRef<number | null>(null)
  const reasoningTimerRef = useRef<number | null>(null)
  const codeDisplayRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    loadData()
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current)
      if (reasoningTimerRef.current) clearInterval(reasoningTimerRef.current)
    }
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [configRes, componentsRes, statsRes] = await Promise.all([
        getAiElementsConfig(),
        getAiElementComponents(),
        getAiElementsStats(),
      ])
      setConfig(configRes)
      setComponents(componentsRes)
      setStats(statsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI Elements configuration')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfigChange(updates: Partial<AiElementsConfig>) {
    try {
      const updated = await updateAiElementsConfig(updates)
      setConfig(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
    }
  }

  const handleStartStream = useCallback(async () => {
    if (isStreaming) return

    try {
      await startStream(prompt || 'Generate a streaming preview component', 'typescript')
      setIsStreaming(true)
      setStreamedCode('')
      setStreamedIndex(0)
      setReasoningStep(0)

      // Simulate token-by-token streaming
      let idx = 0
      streamTimerRef.current = window.setInterval(() => {
        if (idx < SAMPLE_CODE.length) {
          const chunkSize = Math.floor(Math.random() * 3) + 1
          const nextIdx = Math.min(idx + chunkSize, SAMPLE_CODE.length)
          setStreamedCode(SAMPLE_CODE.substring(0, nextIdx))
          setStreamedIndex(nextIdx)
          idx = nextIdx
          if (codeDisplayRef.current) {
            codeDisplayRef.current.scrollTop = codeDisplayRef.current.scrollHeight
          }
        } else {
          if (streamTimerRef.current) clearInterval(streamTimerRef.current)
          setIsStreaming(false)
        }
      }, 15)

      // Simulate reasoning steps
      let step = 0
      reasoningTimerRef.current = window.setInterval(() => {
        if (step < REASONING_STEPS.length - 1) {
          step++
          setReasoningStep(step)
        } else {
          if (reasoningTimerRef.current) clearInterval(reasoningTimerRef.current)
        }
      }, 400)

      // Refresh stats after starting
      const newStats = await getAiElementsStats()
      setStats(newStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start stream')
      setIsStreaming(false)
    }
  }, [isStreaming, prompt])

  function handleCopy() {
    navigator.clipboard.writeText(streamedCode || SAMPLE_CODE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatTokens(tokens: number): string {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
    return String(tokens)
  }

  if (loading) {
    return <div className="text-center py-12 text-warm-400">Loading AI Elements...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">AI Elements & Streaming Preview</h3>
          <p className="text-sm text-warm-400 mt-1">
            Vercel AI-powered streaming code generation with live preview and reasoning panels
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex gap-1 bg-warm-800/50 rounded-lg p-1">
        <button
          onClick={() => setSubTab('stream')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'stream' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            Stream
          </span>
        </button>
        <button
          onClick={() => setSubTab('components')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'components' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            Components
          </span>
        </button>
        <button
          onClick={() => setSubTab('stats')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'stats' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            Stats
          </span>
        </button>
      </div>

      {/* ===== STREAM TAB ===== */}
      {subTab === 'stream' && (
        <div className="space-y-4">
          {/* Settings toggles */}
          {config && (
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Stream Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-warm-300">Streaming Display</label>
                    <p className="text-xs text-warm-500">Token-by-token code output</p>
                  </div>
                  <button
                    onClick={() => handleConfigChange({ streamingEnabled: !config.streamingEnabled })}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      config.streamingEnabled ? 'bg-blue-600' : 'bg-warm-600'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      config.streamingEnabled ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-warm-300">Reasoning Panel</label>
                    <p className="text-xs text-warm-500">Show AI thought process</p>
                  </div>
                  <button
                    onClick={() => handleConfigChange({ reasoningPanelEnabled: !config.reasoningPanelEnabled })}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      config.reasoningPanelEnabled ? 'bg-blue-600' : 'bg-warm-600'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      config.reasoningPanelEnabled ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-warm-300">Live Preview</label>
                    <p className="text-xs text-warm-500">Sandboxed component preview</p>
                  </div>
                  <button
                    onClick={() => handleConfigChange({ livePreviewEnabled: !config.livePreviewEnabled })}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      config.livePreviewEnabled ? 'bg-blue-600' : 'bg-warm-600'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      config.livePreviewEnabled ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-warm-300">Response Actions</label>
                    <p className="text-xs text-warm-500">Copy, edit, deploy buttons</p>
                  </div>
                  <button
                    onClick={() => handleConfigChange({ responseActionsEnabled: !config.responseActionsEnabled })}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      config.responseActionsEnabled ? 'bg-blue-600' : 'bg-warm-600'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      config.responseActionsEnabled ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Prompt Input */}
          <div className="bg-warm-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white">Streaming Code Generation</h4>
              {config && (
                <span className="text-xs text-warm-500 bg-warm-700 px-2 py-1 rounded">
                  {config.activeModel}
                </span>
              )}
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the component you want to generate... (e.g., 'Create a streaming preview component with copy and deploy actions')"
              className="w-full bg-warm-900 border border-warm-700 rounded-lg p-3 text-sm text-warm-200 placeholder-warm-500 resize-none focus:outline-none focus:border-blue-500 transition-colors"
              rows={3}
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    showReasoning ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-warm-700 text-warm-400'
                  }`}
                >
                  Reasoning {showReasoning ? 'On' : 'Off'}
                </button>
              </div>
              <button
                onClick={handleStartStream}
                disabled={isStreaming}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isStreaming
                    ? 'bg-warm-700 text-warm-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                }`}
              >
                {isStreaming ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" />
                    Streaming...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                    Start Stream
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Reasoning Panel */}
          {showReasoning && (isStreaming || streamedCode) && (
            <div className="bg-warm-800/50 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                  <path d="M12 2a3 3 0 0 0-3 3c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/><path d="M19 9H5a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2z"/><path d="M12 14v8"/><path d="M8 18h8"/>
                </svg>
                <h4 className="text-sm font-medium text-purple-400">AI Reasoning</h4>
                {isStreaming && (
                  <span className="ml-auto text-xs text-purple-400/60 animate-pulse">thinking...</span>
                )}
              </div>
              <div className="space-y-2">
                {REASONING_STEPS.slice(0, reasoningStep + 1).map((step, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 text-sm transition-opacity ${
                      i === reasoningStep && isStreaming ? 'text-purple-300' : 'text-warm-400'
                    }`}
                  >
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      i <= reasoningStep ? 'bg-purple-400' : 'bg-warm-600'
                    }`} />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code Streaming Output */}
          {(isStreaming || streamedCode) && (
            <div className="bg-warm-900 rounded-lg border border-warm-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-warm-700 bg-warm-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/60" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <span className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-xs text-warm-400 font-mono">StreamingPreview.tsx</span>
                </div>
                <div className="flex items-center gap-2">
                  {isStreaming && (
                    <span className="text-xs text-blue-400">
                      {streamedIndex} / {SAMPLE_CODE.length} chars
                    </span>
                  )}
                  {!isStreaming && streamedCode && (
                    <span className="text-xs text-green-400">Complete</span>
                  )}
                </div>
              </div>
              <pre
                ref={codeDisplayRef}
                className="p-4 text-sm font-mono text-warm-200 overflow-auto max-h-[400px] leading-relaxed"
              >
                <code>
                  {streamedCode}
                  {isStreaming && <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-0.5" />}
                </code>
              </pre>

              {/* Response Actions */}
              {!isStreaming && streamedCode && config?.responseActionsEnabled && (
                <div className="flex items-center gap-2 px-4 py-3 border-t border-warm-700 bg-warm-800/30">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 text-xs bg-warm-700 hover:bg-warm-600 text-warm-300 rounded-md transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button className="px-3 py-1.5 text-xs bg-warm-700 hover:bg-warm-600 text-warm-300 rounded-md transition-colors">
                    Edit
                  </button>
                  <button className="px-3 py-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-md transition-colors">
                    Deploy
                  </button>
                  <button className="px-3 py-1.5 text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 rounded-md transition-colors">
                    Add to Project
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Live Preview iframe */}
          {!isStreaming && streamedCode && config?.livePreviewEnabled && (
            <div className="bg-warm-800 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-warm-700">
                <h4 className="text-sm font-medium text-white">Live Component Preview</h4>
                <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/30">
                  Sandboxed
                </span>
              </div>
              <div className="p-4 bg-warm-900/50">
                <iframe
                  title="Component Preview"
                  sandbox="allow-scripts"
                  className="w-full h-[200px] rounded-lg border border-warm-700 bg-white"
                  srcDoc={`<!DOCTYPE html><html><head><style>body{font-family:system-ui;padding:20px;background:#1a1a2e;color:#e0e0e0;display:flex;align-items:center;justify-content:center;height:80vh;margin:0}.preview{background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:24px;text-align:center;max-width:400px;backdrop-filter:blur(10px)}.badge{background:rgba(59,130,246,0.2);color:#60a5fa;padding:4px 12px;border-radius:20px;font-size:12px;display:inline-block;margin-bottom:12px;border:1px solid rgba(59,130,246,0.3)}.title{font-size:18px;font-weight:600;margin:8px 0}.desc{color:#94a3b8;font-size:14px;line-height:1.5}</style></head><body><div class="preview"><span class="badge">Live Preview</span><div class="title">StreamingPreview Component</div><p class="desc">Component rendered successfully with streaming code generation and response actions.</p></div></body></html>`}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== COMPONENTS TAB ===== */}
      {subTab === 'components' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white">Available AI Element Components</h4>
            <span className="text-xs text-warm-500">{components.length} components</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {components.map((comp) => (
              <div
                key={comp.id}
                className="bg-warm-800 rounded-lg p-5 border border-warm-700 hover:border-warm-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${CATEGORY_COLORS[comp.category] || 'bg-warm-700 text-warm-400'}`}>
                    {ICON_MAP[comp.icon] || ICON_MAP['code']}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    comp.status === 'stable'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {comp.status}
                  </span>
                </div>
                <h5 className="text-white font-medium mb-1">{comp.name}</h5>
                <p className="text-sm text-warm-400 leading-relaxed">{comp.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${CATEGORY_COLORS[comp.category] || 'border-warm-600 text-warm-400'}`}>
                    {comp.category}
                  </span>
                  <span className="text-xs text-warm-500 font-mono">{comp.id}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Component Integration Guide */}
          <div className="bg-warm-800 rounded-lg p-5 border border-warm-700">
            <h4 className="font-medium text-white mb-3">Integration Guide</h4>
            <pre className="bg-warm-900 rounded-lg p-4 text-sm font-mono text-warm-300 overflow-x-auto">
{`import { MessageThread, ReasoningPanel, CodeBlock } from '@ai-elements/react'

function StreamingPreview({ streamId }) {
  return (
    <MessageThread streamId={streamId}>
      <ReasoningPanel collapsible />
      <CodeBlock
        language="typescript"
        streaming
        syntaxHighlight
        lineNumbers
      />
      <ResponseActions
        actions={['copy', 'edit', 'deploy', 'add-to-project']}
      />
    </MessageThread>
  )
}`}
            </pre>
          </div>
        </div>
      )}

      {/* ===== STATS TAB ===== */}
      {subTab === 'stats' && stats && (
        <div className="space-y-4">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.totalStreams}</div>
              <div className="text-sm text-warm-400">Total Streams</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{formatTokens(stats.totalTokensStreamed)}</div>
              <div className="text-sm text-warm-400">Tokens Streamed</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">{stats.totalComponentPreviews}</div>
              <div className="text-sm text-warm-400">Component Previews</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-amber-400">{formatTokens(stats.averageStreamTokens)}</div>
              <div className="text-sm text-warm-400">Avg Tokens/Stream</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-cyan-400">{stats.activeModel.split('-').slice(0, 2).join(' ')}</div>
              <div className="text-sm text-warm-400">Active Model</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-pink-400 capitalize">{stats.themeMode}</div>
              <div className="text-sm text-warm-400">Theme Mode</div>
            </div>
          </div>

          {/* Configuration Summary */}
          {config && (
            <div className="bg-warm-800 rounded-lg p-5">
              <h4 className="font-medium text-white mb-3">Feature Status</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between bg-warm-900/50 rounded-lg p-3">
                  <span className="text-sm text-warm-300">Streaming Display</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${config.streamingEnabled ? 'bg-green-500/10 text-green-400' : 'bg-warm-700 text-warm-500'}`}>
                    {config.streamingEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-warm-900/50 rounded-lg p-3">
                  <span className="text-sm text-warm-300">Reasoning Panel</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${config.reasoningPanelEnabled ? 'bg-green-500/10 text-green-400' : 'bg-warm-700 text-warm-500'}`}>
                    {config.reasoningPanelEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-warm-900/50 rounded-lg p-3">
                  <span className="text-sm text-warm-300">Live Preview</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${config.livePreviewEnabled ? 'bg-green-500/10 text-green-400' : 'bg-warm-700 text-warm-500'}`}>
                    {config.livePreviewEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-warm-900/50 rounded-lg p-3">
                  <span className="text-sm text-warm-300">Response Actions</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${config.responseActionsEnabled ? 'bg-green-500/10 text-green-400' : 'bg-warm-700 text-warm-500'}`}>
                    {config.responseActionsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Streams */}
          {stats.recentStreams.length > 0 && (
            <div className="bg-warm-800 rounded-lg p-5">
              <h4 className="font-medium text-white mb-3">Recent Streams</h4>
              <div className="space-y-2">
                {stats.recentStreams.map((stream, i) => (
                  <div key={i} className="flex items-center justify-between bg-warm-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-mono">
                        {stream.language.substring(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <div className="text-sm text-warm-200 truncate max-w-[300px]">
                          {stream.prompt || 'Stream session'}
                        </div>
                        <div className="text-xs text-warm-500">
                          {new Date(stream.startedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-warm-300">{formatTokens(stream.tokenCount)} tokens</div>
                      <div className="text-xs text-warm-500">{stream.language}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
