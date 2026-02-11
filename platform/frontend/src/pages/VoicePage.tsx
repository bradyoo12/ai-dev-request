import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getVoiceConfig, updateVoiceConfig, getVoiceStats, getVoiceLanguages, logTranscription } from '../api/voice'
import type { VoiceConfig, VoiceStats, VoiceLanguage } from '../api/voice'

export default function VoicePage() {
  const { t } = useTranslation()
  const [config, setConfig] = useState<VoiceConfig | null>(null)
  const [stats, setStats] = useState<VoiceStats | null>(null)
  const [languages, setLanguages] = useState<VoiceLanguage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [sessionStart, setSessionStart] = useState<number | null>(null)
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
    }
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [configRes, statsRes, langsRes] = await Promise.all([
        getVoiceConfig(),
        getVoiceStats(),
        getVoiceLanguages(),
      ])
      setConfig(configRes)
      setStats(statsRes)
      setLanguages(langsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('voice.errorLoading'))
    } finally {
      setLoading(false)
    }
  }

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition || !config) return

    const recognition = new SpeechRecognition()
    recognition.lang = config.language
    recognition.continuous = config.continuousMode
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += text + ' '
        } else {
          interim += text
        }
      }
      if (final) setTranscript(prev => prev + final)
      setInterimTranscript(interim)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        setError(t('voice.recognitionError'))
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setSessionStart(Date.now())
  }, [config, t])

  const stopListening = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimTranscript('')

    if (transcript && sessionStart) {
      const duration = Math.round((Date.now() - sessionStart) / 1000)
      try {
        await logTranscription(transcript, duration, config?.language)
        const newStats = await getVoiceStats()
        setStats(newStats)
      } catch {
        // Stats logging is non-critical
      }
    }
    setSessionStart(null)
  }, [transcript, sessionStart, config?.language])

  async function handleConfigChange(updates: Partial<VoiceConfig>) {
    try {
      const updated = await updateVoiceConfig(updates)
      setConfig(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('voice.errorSaving'))
    }
  }

  function copyTranscript() {
    navigator.clipboard.writeText(transcript)
  }

  function clearTranscript() {
    setTranscript('')
    setInterimTranscript('')
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">{t('voice.loading')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{t('voice.title')}</h3>
          <p className="text-sm text-gray-400 mt-1">{t('voice.description')}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {!supported && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-400">
          <p className="font-medium">{t('voice.notSupported')}</p>
          <p className="text-sm mt-1 text-yellow-400/70">{t('voice.notSupportedHint')}</p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.sessionCount}</div>
            <div className="text-sm text-gray-400">{t('voice.stats.sessions')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{formatDuration(stats.totalDurationSeconds)}</div>
            <div className="text-sm text-gray-400">{t('voice.stats.totalDuration')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{formatDuration(stats.averageDurationSeconds)}</div>
            <div className="text-sm text-gray-400">{t('voice.stats.avgDuration')}</div>
          </div>
        </div>
      )}

      {/* Voice Input Area */}
      {supported && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-white">{t('voice.inputTitle')}</h4>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {config && (
                <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                  {languages.find(l => l.code === config.language)?.name || config.language}
                </span>
              )}
            </div>
          </div>

          {/* Microphone Button */}
          <div className="flex flex-col items-center gap-4 py-6">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/30'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isListening ? (
                  <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>
                ) : (
                  <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></>
                )}
              </svg>
            </button>
            <span className={`text-sm ${isListening ? 'text-red-400' : 'text-gray-400'}`}>
              {isListening ? t('voice.listening') : t('voice.clickToStart')}
            </span>
          </div>

          {/* Transcript Display */}
          <div className="mt-4">
            <div className="bg-gray-900 rounded-lg p-4 min-h-[120px] max-h-[300px] overflow-y-auto">
              {transcript || interimTranscript ? (
                <p className="text-gray-200 whitespace-pre-wrap">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-gray-500 italic">{interimTranscript}</span>
                  )}
                </p>
              ) : (
                <p className="text-gray-600 italic">{t('voice.transcriptPlaceholder')}</p>
              )}
            </div>
            {transcript && (
              <div className="flex gap-2 mt-2 justify-end">
                <button
                  onClick={copyTranscript}
                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                >
                  {t('voice.copy')}
                </button>
                <button
                  onClick={clearTranscript}
                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                >
                  {t('voice.clear')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings */}
      {config && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="font-medium text-white mb-4">{t('voice.settings')}</h4>
          <div className="space-y-4">
            {/* Language */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">{t('voice.language')}</label>
              <select
                value={config.language}
                onChange={(e) => handleConfigChange({ language: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            {/* Continuous Mode */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-300">{t('voice.continuousMode')}</label>
                <p className="text-xs text-gray-500">{t('voice.continuousModeDesc')}</p>
              </div>
              <button
                onClick={() => handleConfigChange({ continuousMode: !config.continuousMode })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  config.continuousMode ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  config.continuousMode ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </div>

            {/* Auto-Punctuate */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-300">{t('voice.autoPunctuate')}</label>
                <p className="text-xs text-gray-500">{t('voice.autoPunctuateDesc')}</p>
              </div>
              <button
                onClick={() => handleConfigChange({ autoPunctuate: !config.autoPunctuate })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  config.autoPunctuate ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  config.autoPunctuate ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </div>

            {/* TTS */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-300">{t('voice.ttsEnabled')}</label>
                <p className="text-xs text-gray-500">{t('voice.ttsEnabledDesc')}</p>
              </div>
              <button
                onClick={() => handleConfigChange({ ttsEnabled: !config.ttsEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  config.ttsEnabled ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  config.ttsEnabled ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </div>

            {/* TTS Rate */}
            {config.ttsEnabled && (
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">{t('voice.ttsRate')}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={config.ttsRate}
                    onChange={(e) => handleConfigChange({ ttsRate: parseFloat(e.target.value) })}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-400 w-10 text-right">{config.ttsRate.toFixed(1)}x</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Web Speech API type declarations
interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: { transcript: string; confidence: number }
}

interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor
    webkitSpeechRecognition: SpeechRecognitionConstructor
  }
}
