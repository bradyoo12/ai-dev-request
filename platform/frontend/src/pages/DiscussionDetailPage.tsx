import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { getDiscussion, addMessage, exportDiscussion } from '../api/discussions'
import type { DiscussionWithMessages } from '../api/discussions'
import { Send, ArrowLeft, Download, Sparkles } from 'lucide-react'

export default function DiscussionDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<DiscussionWithMessages | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [exporting, setExporting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) loadDiscussion()
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.messages])

  const loadDiscussion = async () => {
    if (!id) return
    try {
      setLoading(true)
      const result = await getDiscussion(id)
      setData(result)
    } catch (error) {
      console.error('Failed to load discussion:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!id || !message.trim() || sending) return

    try {
      setSending(true)
      await addMessage(id, { role: 'user', content: message })
      setMessage('')
      await loadDiscussion()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleExport = async () => {
    if (!id) return
    try {
      setExporting(true)
      const devRequest = await exportDiscussion(id)
      navigate(`/?requestId=${devRequest.id}`)
    } catch (error) {
      console.error('Failed to export discussion:', error)
    } finally {
      setExporting(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-white text-center">{t('common.loading', 'Loading...')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/discussions')}
              className="p-2 text-white/70 hover:text-white transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">{data.discussion.title}</h1>
              <p className="text-gray-400 text-sm">
                {new Date(data.discussion.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {data.discussion.status !== 'exported' && (
            <button
              onClick={handleExport}
              disabled={exporting || data.messages.length === 0}
              className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              {t('discussion.exportToRequest', 'Export to Dev Request')}
            </button>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-4" style={{ height: 'calc(100vh - 300px)', display: 'flex', flexDirection: 'column' }}>
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {data.messages.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-white/50 mx-auto mb-4" />
                <p className="text-white/70">
                  {t('discussion.startConversation', 'Start brainstorming! Ask questions, explore ideas, or discuss requirements.')}
                </p>
              </div>
            ) : (
              <>
                {data.messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        msg.role === 'user'
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('discussion.messagePlaceholder', 'Type your message...')}
              className="flex-1 bg-white/20 text-white placeholder-white/50 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-600 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              {t('common.send', 'Send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
