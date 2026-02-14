import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

interface GeneratedAgent {
  agentJson: string
  name: string
  description: string
  category: string
  suggestedTags: string[]
}

interface ExampleAgent {
  title: string
  description: string
  category: string
  examplePrompt: string
}

export default function AgentBuilderPage() {
  const { t } = useTranslation()
  const { authUser } = useAuth()

  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedAgent, setGeneratedAgent] = useState<GeneratedAgent | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [examples, setExamples] = useState<ExampleAgent[]>([])
  const [showExamples, setShowExamples] = useState(false)

  const loadExamples = async () => {
    try {
      const response = await fetch('/api/agent-builder/examples', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      if (!response.ok) throw new Error('Failed to load examples')
      const data = await response.json()
      setExamples(data)
      setShowExamples(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load examples')
    }
  }

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please provide a description for your agent')
      return
    }

    setGenerating(true)
    setError('')
    setGeneratedAgent(null)

    try {
      const response = await fetch('/api/agent-builder/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          description,
          userId: authUser?.id || 'anonymous',
          modelId: 'claude-sonnet-4-5-20250929',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate agent')
      }

      const data = await response.json()
      setGeneratedAgent(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate agent')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedAgent) return

    setSaving(true)
    setError('')

    try {
      const agentData = JSON.parse(generatedAgent.agentJson)

      const response = await fetch('/api/agent-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: authUser?.id || 'anonymous',
          name: agentData.name,
          description: agentData.description,
          category: agentData.category,
          instructionContent: agentData.instructionContent,
          scriptsJson: agentData.scriptsJson,
          resourcesJson: agentData.resourcesJson,
          tagsJson: agentData.tagsJson,
          version: agentData.version,
          author: agentData.author,
          isPublic: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save agent')
      }

      // Reset form
      setDescription('')
      setGeneratedAgent(null)
      alert('Agent saved successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agent')
    } finally {
      setSaving(false)
    }
  }

  const useExample = (example: ExampleAgent) => {
    setDescription(example.examplePrompt)
    setShowExamples(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-2">{t('settings.agentBuilder.title', 'AI Agent Builder')}</h2>
        <p className="text-warm-300">
          {t('settings.agentBuilder.description', 'Create specialized AI agents using natural language. Build Slack bots, customer service agents, monitoring automations, and more.')}
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Examples Button */}
      <div className="flex justify-end">
        <button
          onClick={loadExamples}
          className="px-4 py-2 bg-warm-700 hover:bg-warm-600 rounded-lg transition-colors text-sm"
        >
          {t('settings.agentBuilder.showExamples', 'Show Examples')}
        </button>
      </div>

      {/* Examples Dialog */}
      {showExamples && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{t('settings.agentBuilder.examples', 'Example Agents')}</h3>
              <button
                onClick={() => setShowExamples(false)}
                className="text-warm-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="space-y-3">
              {examples.map((example, index) => (
                <div
                  key={index}
                  className="bg-warm-900 rounded-xl p-4 hover:bg-warm-700/50 transition-colors cursor-pointer"
                  onClick={() => useExample(example)}
                >
                  <div className="font-bold mb-1">{example.title}</div>
                  <div className="text-warm-400 text-sm mb-2">{example.description}</div>
                  <div className="text-xs text-warm-500">
                    <span className="bg-warm-700 rounded px-2 py-1">{example.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generator Form */}
      <div className="bg-warm-800 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">{t('settings.agentBuilder.describeAgent', 'Describe Your Agent')}</h3>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('settings.agentBuilder.placeholder', 'Describe what you want your agent to do. For example: "Create a Slack bot that monitors #engineering channel and sends daily summaries to #updates every evening at 5 PM."')}
          className="w-full h-40 bg-warm-900 border border-warm-700 rounded-lg p-4 text-white placeholder-warm-500 resize-none"
          disabled={generating}
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={generating || !description.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                {t('settings.agentBuilder.generating', 'Generating...')}
              </span>
            ) : (
              t('settings.agentBuilder.generate', 'Generate Agent')
            )}
          </button>
        </div>
      </div>

      {/* Generated Agent Preview */}
      {generatedAgent && (
        <div className="bg-warm-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">{t('settings.agentBuilder.preview', 'Generated Agent')}</h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-warm-400">{t('settings.agentBuilder.name', 'Name')}</label>
              <div className="text-xl font-bold">{generatedAgent.name}</div>
            </div>

            <div>
              <label className="text-sm text-warm-400">{t('settings.agentBuilder.description', 'Description')}</label>
              <div className="text-warm-200">{generatedAgent.description}</div>
            </div>

            <div>
              <label className="text-sm text-warm-400">{t('settings.agentBuilder.category', 'Category')}</label>
              <div className="text-warm-200">{generatedAgent.category}</div>
            </div>

            {generatedAgent.suggestedTags.length > 0 && (
              <div>
                <label className="text-sm text-warm-400">{t('settings.agentBuilder.tags', 'Suggested Tags')}</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {generatedAgent.suggestedTags.map((tag, index) => (
                    <span key={index} className="bg-warm-700 rounded-full px-3 py-1 text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm text-warm-400">{t('settings.agentBuilder.jsonConfig', 'Full Configuration (JSON)')}</label>
              <pre className="mt-2 bg-warm-900 border border-warm-700 rounded-lg p-4 text-sm overflow-x-auto">
                {JSON.stringify(JSON.parse(generatedAgent.agentJson), null, 2)}
              </pre>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    {t('settings.agentBuilder.saving', 'Saving...')}
                  </span>
                ) : (
                  t('settings.agentBuilder.save', 'Save Agent')
                )}
              </button>
              <button
                onClick={() => setGeneratedAgent(null)}
                className="px-6 py-3 bg-warm-700 hover:bg-warm-600 rounded-lg font-medium transition-colors"
              >
                {t('settings.agentBuilder.discard', 'Discard')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-4 text-sm text-blue-300">
        <strong>{t('settings.agentBuilder.tip', 'Tip:')}</strong> {t('settings.agentBuilder.tipText', 'Be specific about what you want your agent to do, when it should act, and how it should communicate. The more details you provide, the better the generated agent will be.')}
      </div>
    </div>
  )
}
