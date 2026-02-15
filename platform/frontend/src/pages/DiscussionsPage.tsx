import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getDiscussions, createDiscussion, deleteDiscussion } from '../api/discussions'
import type { Discussion } from '../api/discussions'
import { MessageCircle, Plus, Trash2, ArrowRight } from 'lucide-react'

export default function DiscussionsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadDiscussions()
  }, [])

  const loadDiscussions = async () => {
    try {
      setLoading(true)
      const data = await getDiscussions()
      setDiscussions(data)
    } catch (error) {
      console.error('Failed to load discussions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      setCreating(true)
      const newDiscussion = await createDiscussion({ title: 'New Discussion' })
      navigate(`/discussions/${newDiscussion.id}`)
    } catch (error) {
      console.error('Failed to create discussion:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(t('discussion.confirmDelete', 'Are you sure you want to archive this discussion?'))) return

    try {
      await deleteDiscussion(id)
      await loadDiscussions()
    } catch (error) {
      console.error('Failed to delete discussion:', error)
    }
  }

  if (loading) {
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
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {t('discussion.title', 'Discussion Mode')}
            </h1>
            <p className="text-gray-300">
              {t('discussion.subtitle', 'Brainstorm ideas and explore features before implementation')}
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 bg-white text-purple-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {t('discussion.create', 'New Discussion')}
          </button>
        </div>

        {discussions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-12 text-center"
          >
            <MessageCircle className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {t('discussion.empty', 'No discussions yet')}
            </h3>
            <p className="text-gray-300 mb-6">
              {t('discussion.emptyDescription', 'Start a new discussion to brainstorm ideas before building')}
            </p>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="bg-white text-purple-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50"
            >
              {t('discussion.createFirst', 'Start Your First Discussion')}
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {discussions.map((discussion) => (
              <motion.div
                key={discussion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/discussions/${discussion.id}`)}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 cursor-pointer hover:bg-white/15 transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageCircle className="w-5 h-5 text-white/70" />
                      <h3 className="text-xl font-semibold text-white">{discussion.title}</h3>
                      {discussion.status === 'exported' && (
                        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                          {t('discussion.exported', 'Exported')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{new Date(discussion.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(discussion.id, e)}
                      className="p-2 text-gray-400 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white/90 transition" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
