import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getSupportPosts,
  getSupportPost,
  createSupportPost,
  setRewardCredit,
  updateSupportStatus,
  type SupportPost,
} from '../api/support'

const CATEGORIES = ['all', 'complaint', 'request', 'inquiry', 'other'] as const
const STATUSES = ['open', 'in_review', 'resolved', 'closed'] as const
const PAGE_SIZE = 10

function categoryBadgeClass(category: string): string {
  switch (category) {
    case 'complaint':
      return 'bg-red-500/20 text-red-300 border border-red-500/30'
    case 'request':
      return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    case 'inquiry':
      return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
    default:
      return 'bg-warm-700/30 text-warm-300 border border-warm-600/30'
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-green-500/20 text-green-300 border border-green-500/30'
    case 'in_review':
      return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
    case 'resolved':
      return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    case 'closed':
      return 'bg-warm-700/30 text-warm-400 border border-warm-600/30'
    default:
      return 'bg-warm-700/30 text-warm-300 border border-warm-600/30'
  }
}

export default function SupportBoardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { authUser, requireAuth } = useAuth()

  // List state
  const [posts, setPosts] = useState<SupportPost[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState<string>('all')
  const [sort, setSort] = useState<string>('newest')
  const [loading, setLoading] = useState(false)

  // Detail state
  const [selectedPost, setSelectedPost] = useState<SupportPost | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Write form state
  const [showWriteForm, setShowWriteForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState('inquiry')
  const [submitting, setSubmitting] = useState(false)

  // Admin reward state
  const [rewardInput, setRewardInput] = useState('')
  const [rewardSubmitting, setRewardSubmitting] = useState(false)
  const [statusSubmitting, setStatusSubmitting] = useState(false)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Use ref to store latest filter values to avoid useCallback dependency issues
  const filterRef = useRef({ page, category, sort })
  filterRef.current = { page, category, sort }

  const loadPosts = async () => {
    setLoading(true)
    try {
      const { page: p, category: c, sort: s } = filterRef.current
      const data = await getSupportPosts(p, PAGE_SIZE, c, s)
      setPosts(data.items)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load support posts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, sort])

  const handleViewPost = async (id: string) => {
    setDetailLoading(true)
    try {
      const post = await getSupportPost(id)
      setSelectedPost(post)
      setRewardInput(post.rewardCredit != null ? String(post.rewardCredit) : '')
    } catch (err) {
      console.error('Failed to load post:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleBackToList = () => {
    setSelectedPost(null)
  }

  const handleWritePost = () => {
    if (!requireAuth()) return
    setShowWriteForm(true)
  }

  const handleSubmitPost = async () => {
    if (!formTitle.trim() || !formContent.trim()) return
    setSubmitting(true)
    try {
      await createSupportPost(formTitle, formContent, formCategory)
      setFormTitle('')
      setFormContent('')
      setFormCategory('inquiry')
      setShowWriteForm(false)
      setPage(1)
      await loadPosts()
    } catch (err) {
      console.error('Failed to create post:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSetReward = async () => {
    if (!selectedPost || rewardInput === '') return
    setRewardSubmitting(true)
    try {
      const result = await setRewardCredit(selectedPost.id, parseFloat(rewardInput))
      setSelectedPost({
        ...selectedPost,
        rewardCredit: result.rewardCredit,
        rewardedByUserId: result.rewardedByUserId,
        rewardedAt: result.rewardedAt,
      })
      await loadPosts()
    } catch (err) {
      console.error('Failed to set reward:', err)
    } finally {
      setRewardSubmitting(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedPost) return
    setStatusSubmitting(true)
    try {
      const result = await updateSupportStatus(selectedPost.id, newStatus)
      setSelectedPost({ ...selectedPost, status: result.status })
      await loadPosts()
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setStatusSubmitting(false)
    }
  }

  // --- Detail view ---
  if (selectedPost) {
    return (
      <section>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-warm-400 hover:text-white transition-colors"
          >
            &larr;
          </button>
          <h2 className="text-2xl font-bold">{t('support.title')}</h2>
        </div>

        <button
          onClick={handleBackToList}
          className="text-warm-400 hover:text-white transition-colors mb-4 text-sm"
        >
          &larr; {t('support.backToList')}
        </button>

        {detailLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-warm-50">{selectedPost.title}</h3>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs ${categoryBadgeClass(selectedPost.category)}`}>
                  {t(`support.category.${selectedPost.category}`)}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadgeClass(selectedPost.status)}`}>
                  {t(`support.status.${selectedPost.status}`)}
                </span>
              </div>
            </div>

            <p className="text-warm-300 whitespace-pre-wrap">{selectedPost.content}</p>

            <div className="flex items-center gap-4 text-xs text-warm-500">
              <span>{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
              {selectedPost.rewardCredit != null && (
                <span className="text-accent-amber font-medium">
                  {t('support.reward')}: {selectedPost.rewardCredit} {t('support.credits')}
                </span>
              )}
            </div>

            {/* Admin section */}
            {authUser?.isAdmin && (
              <div className="pt-4 mt-4 border-t border-warm-700/30 space-y-4">
                <h4 className="text-sm font-semibold text-warm-200">{t('support.adminSection')}</h4>

                {/* Status update */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-warm-400">{t('support.changeStatus')}:</span>
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleUpdateStatus(s)}
                      disabled={statusSubmitting || selectedPost.status === s}
                      className={`px-3 py-1 rounded-lg text-xs transition-all ${
                        selectedPost.status === s
                          ? 'bg-accent-blue/30 text-accent-blue cursor-default'
                          : 'bg-warm-800/50 text-warm-300 hover:bg-warm-700/50 hover:text-white'
                      }`}
                    >
                      {t(`support.status.${s}`)}
                    </button>
                  ))}
                </div>

                {/* Reward credit */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-warm-400">{t('support.rewardCredit')}:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={rewardInput}
                    onChange={(e) => setRewardInput(e.target.value)}
                    className="w-32 px-3 py-1.5 bg-warm-800/50 border border-warm-700/50 rounded-lg text-sm text-warm-100 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                    placeholder="0.00"
                  />
                  <button
                    onClick={handleSetReward}
                    disabled={rewardSubmitting || rewardInput === ''}
                    className="px-3 py-1.5 bg-accent-amber/20 text-accent-amber border border-accent-amber/30 rounded-lg text-xs font-medium hover:bg-accent-amber/30 transition-all disabled:opacity-50"
                  >
                    {rewardSubmitting ? t('support.saving') : t('support.setReward')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    )
  }

  // --- Write form ---
  if (showWriteForm) {
    return (
      <section>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-warm-400 hover:text-white transition-colors"
          >
            &larr;
          </button>
          <h2 className="text-2xl font-bold">{t('support.title')}</h2>
        </div>

        <button
          onClick={() => setShowWriteForm(false)}
          className="text-warm-400 hover:text-white transition-colors mb-4 text-sm"
        >
          &larr; {t('support.backToList')}
        </button>

        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-warm-100">{t('support.writePost')}</h3>

          <div>
            <label className="block text-sm text-warm-300 mb-1">{t('support.form.category')}</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full px-3 py-2 bg-warm-800/50 border border-warm-700/50 rounded-lg text-sm text-warm-100 focus:outline-none focus:ring-1 focus:ring-accent-blue"
            >
              {CATEGORIES.filter((c) => c !== 'all').map((c) => (
                <option key={c} value={c}>
                  {t(`support.category.${c}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-warm-300 mb-1">{t('support.form.title')}</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2 bg-warm-800/50 border border-warm-700/50 rounded-lg text-sm text-warm-100 focus:outline-none focus:ring-1 focus:ring-accent-blue"
              placeholder={t('support.form.titlePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm text-warm-300 mb-1">{t('support.form.content')}</label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={6}
              maxLength={10000}
              className="w-full px-3 py-2 bg-warm-800/50 border border-warm-700/50 rounded-lg text-sm text-warm-100 focus:outline-none focus:ring-1 focus:ring-accent-blue resize-y"
              placeholder={t('support.form.contentPlaceholder')}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowWriteForm(false)}
              className="px-4 py-2 text-sm text-warm-400 hover:text-white transition-colors"
            >
              {t('support.form.cancel')}
            </button>
            <button
              onClick={handleSubmitPost}
              disabled={submitting || !formTitle.trim() || !formContent.trim()}
              className="px-5 py-2 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl text-sm font-medium transition-all hover:shadow-glow-blue hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('support.form.submitting') : t('support.form.submit')}
            </button>
          </div>
        </div>
      </section>
    )
  }

  // --- List view ---
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-warm-400 hover:text-white transition-colors"
        >
          &larr;
        </button>
        <h2 className="text-2xl font-bold">{t('support.title')}</h2>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                category === c
                  ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                  : 'bg-warm-800/50 text-warm-400 border border-warm-700/30 hover:text-white'
              }`}
            >
              {t(`support.category.${c}`)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1) }}
            className="px-3 py-1.5 bg-warm-800/50 border border-warm-700/50 rounded-lg text-xs text-warm-300 focus:outline-none focus:ring-1 focus:ring-accent-blue"
          >
            <option value="newest">{t('support.sort.newest')}</option>
            <option value="oldest">{t('support.sort.oldest')}</option>
          </select>

          {authUser && (
            <button
              onClick={handleWritePost}
              className="px-4 py-1.5 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl text-xs font-medium transition-all hover:shadow-glow-blue hover:scale-[1.02]"
            >
              {t('support.writePost')}
            </button>
          )}
        </div>
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-warm-500">{t('support.noPosts')}</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <button
              key={post.id}
              onClick={() => handleViewPost(post.id)}
              className="w-full text-left glass-card rounded-xl p-4 hover:bg-warm-800/30 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-warm-100 group-hover:text-white transition-colors truncate">
                    {post.title}
                  </h3>
                  <p className="text-sm text-warm-400 mt-1 line-clamp-2">{post.content}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${categoryBadgeClass(post.category)}`}>
                    {t(`support.category.${post.category}`)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadgeClass(post.status)}`}>
                    {t(`support.status.${post.status}`)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-warm-500">
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                {post.rewardCredit != null && (
                  <span className="text-accent-amber">
                    {post.rewardCredit} {t('support.credits')}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 bg-warm-800/50 border border-warm-700/30 rounded-lg text-xs text-warm-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {t('support.pagination.prev')}
          </button>
          <span className="text-xs text-warm-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 bg-warm-800/50 border border-warm-700/30 rounded-lg text-xs text-warm-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {t('support.pagination.next')}
          </button>
        </div>
      )}
    </section>
  )
}
