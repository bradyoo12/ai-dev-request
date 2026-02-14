import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { StatusBadge } from '../components/StatusBadge'
import FadeIn from '../components/motion/FadeIn'
import StaggerChildren, { staggerItemVariants } from '../components/motion/StaggerChildren'
import {
  getUserTickets,
  getTicketDetail,
  type TicketListItem,
  type TicketDetail,
} from '../api/ticket-progress'

const STATUS_FILTERS = [
  'All',
  'Submitted',
  'Analyzing',
  'Analyzed',
  'ProposalReady',
  'Approved',
  'Building',
  'Verifying',
  'Staging',
  'Completed',
  'Cancelled',
] as const

/** Maps backend RequestStatus enum values to StatusBadge-compatible status strings */
function mapStatusForBadge(status: string): string {
  const map: Record<string, string> = {
    Submitted: 'pending',
    Analyzing: 'in-progress',
    Analyzed: 'success',
    ProposalReady: 'waiting',
    Approved: 'success',
    Building: 'in-progress',
    Verifying: 'in-progress',
    Staging: 'starting',
    Completed: 'completed',
    Cancelled: 'cancelled',
  }
  return map[status] || 'idle'
}

/** All the status stages in chronological order for the timeline */
const STATUS_TIMELINE = [
  'Submitted',
  'Analyzing',
  'Analyzed',
  'ProposalReady',
  'Approved',
  'Building',
  'Verifying',
  'Staging',
  'Completed',
] as const

function getStatusIndex(status: string): number {
  return STATUS_TIMELINE.indexOf(status as typeof STATUS_TIMELINE[number])
}

export default function TicketProgressPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [tickets, setTickets] = useState<TicketListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const filterStatus = statusFilter === 'All' ? undefined : statusFilter
      const data = await getUserTickets(1, 50, filterStatus)
      setTickets(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tickets.error.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [statusFilter, t])

  useEffect(() => {
    if (authUser) {
      loadTickets()
    } else {
      setLoading(false)
    }
  }, [authUser, loadTickets])

  const handleTicketClick = async (ticketId: string) => {
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(null)
      return
    }
    try {
      setDetailLoading(true)
      const detail = await getTicketDetail(ticketId)
      setSelectedTicket(detail)
    } catch {
      // silently fail, the list item is still shown
    } finally {
      setDetailLoading(false)
    }
  }

  const filteredTickets = tickets.filter((ticket) =>
    ticket.descriptionPreview.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatDateTime(dateStr?: string): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Unauthenticated view
  if (!authUser) {
    return (
      <section className="p-6 space-y-6">
        <FadeIn>
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎫</div>
            <h1 className="text-3xl font-bold mb-2">{t('tickets.title')}</h1>
            <p className="text-warm-400 mb-6">{t('tickets.loginRequired')}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl text-sm font-medium transition-all hover:shadow-glow-blue hover:scale-[1.02]"
            >
              {t('tickets.goHome')}
            </button>
          </div>
        </FadeIn>
      </section>
    )
  }

  return (
    <section className="p-6 space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t('tickets.title')}</h1>
            <p className="text-warm-400 mt-1">{t('tickets.subtitle')}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl text-sm font-medium transition-all hover:shadow-glow-blue hover:scale-[1.02]"
          >
            {t('tickets.newRequest')}
          </button>
        </div>
      </FadeIn>

      {/* Status filter tabs */}
      <FadeIn delay={0.1}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-accent-blue text-white shadow-glow-blue'
                  : 'bg-warm-800 text-warm-400 hover:bg-warm-700 hover:text-white'
              }`}
            >
              {t(`tickets.filter.${status.toLowerCase()}`)}
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Search */}
      <FadeIn delay={0.15}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('tickets.searchPlaceholder')}
          className="w-full px-4 py-2 bg-warm-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/50 text-sm placeholder:text-warm-500"
        />
      </FadeIn>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full" />
          <span className="ml-3 text-warm-400">{t('tickets.loading')}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
          <button
            onClick={loadTickets}
            className="ml-4 text-sm underline hover:text-red-300"
          >
            {t('tickets.retry')}
          </button>
        </div>
      )}

      {/* Ticket List */}
      {!loading && !error && (
        <>
          {filteredTickets.length === 0 ? (
            <FadeIn>
              <div className="text-center py-12 text-warm-400">
                {searchTerm || statusFilter !== 'All'
                  ? t('tickets.noResults')
                  : t('tickets.empty')}
              </div>
            </FadeIn>
          ) : (
            <StaggerChildren className="space-y-3" staggerDelay={0.05}>
              {filteredTickets.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  variants={staggerItemVariants}
                  className="glass-card rounded-xl overflow-hidden"
                >
                  {/* Ticket list item */}
                  <button
                    onClick={() => handleTicketClick(ticket.id)}
                    className="w-full p-4 text-left hover:bg-warm-800/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-warm-100 line-clamp-2">
                          {ticket.descriptionPreview}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-warm-500">
                          <span>{t(`tickets.category.${ticket.category.toLowerCase()}`)}  </span>
                          <span>{t(`tickets.complexity.${ticket.complexity.toLowerCase()}`)}</span>
                          <span>{formatDate(ticket.createdAt)}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge
                          status={t(`tickets.status.${ticket.status.toLowerCase()}`)}
                          className={mapStatusForBadge(ticket.status) === 'in-progress' ? 'animate-pulse' : ''}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Detail panel (expanded) */}
                  {selectedTicket?.id === ticket.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="border-t border-warm-700/50"
                    >
                      {detailLoading ? (
                        <div className="p-4 flex items-center justify-center">
                          <div className="animate-spin w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full" />
                        </div>
                      ) : (
                        <div className="p-4 space-y-4">
                          {/* Full description */}
                          <div>
                            <h4 className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-1">
                              {t('tickets.detail.description')}
                            </h4>
                            <p className="text-sm text-warm-200 whitespace-pre-wrap">
                              {selectedTicket.description}
                            </p>
                          </div>

                          {/* Status timeline */}
                          <div>
                            <h4 className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">
                              {t('tickets.detail.timeline')}
                            </h4>
                            <div className="flex items-center gap-1 overflow-x-auto pb-2">
                              {STATUS_TIMELINE.map((stage, idx) => {
                                const currentIdx = getStatusIndex(selectedTicket.status)
                                const isCancelled = selectedTicket.status === 'Cancelled'
                                const isPast = !isCancelled && idx <= currentIdx
                                const isCurrent = !isCancelled && idx === currentIdx

                                return (
                                  <div key={stage} className="flex items-center">
                                    <div className="flex flex-col items-center min-w-[56px]">
                                      <div
                                        className={`w-3 h-3 rounded-full border-2 transition-colors ${
                                          isCurrent
                                            ? 'bg-accent-blue border-accent-blue shadow-glow-blue'
                                            : isPast
                                            ? 'bg-green-500 border-green-500'
                                            : 'bg-warm-700 border-warm-600'
                                        }`}
                                      />
                                      <span
                                        className={`text-[10px] mt-1 text-center leading-tight ${
                                          isCurrent
                                            ? 'text-accent-blue font-semibold'
                                            : isPast
                                            ? 'text-green-400'
                                            : 'text-warm-600'
                                        }`}
                                      >
                                        {t(`tickets.status.${stage.toLowerCase()}`)}
                                      </span>
                                    </div>
                                    {idx < STATUS_TIMELINE.length - 1 && (
                                      <div
                                        className={`h-0.5 w-4 mx-0.5 ${
                                          isPast && idx < currentIdx
                                            ? 'bg-green-500'
                                            : 'bg-warm-700'
                                        }`}
                                      />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Activity log */}
                          <div>
                            <h4 className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-2">
                              {t('tickets.detail.activity')}
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-2 text-warm-300">
                                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                <span className="text-warm-500">{formatDateTime(selectedTicket.createdAt)}</span>
                                <span>{t('tickets.activity.submitted')}</span>
                              </div>
                              {selectedTicket.analyzedAt && (
                                <div className="flex items-center gap-2 text-warm-300">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                  <span className="text-warm-500">{formatDateTime(selectedTicket.analyzedAt)}</span>
                                  <span>{t('tickets.activity.analyzed')}</span>
                                </div>
                              )}
                              {selectedTicket.proposedAt && (
                                <div className="flex items-center gap-2 text-warm-300">
                                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                                  <span className="text-warm-500">{formatDateTime(selectedTicket.proposedAt)}</span>
                                  <span>{t('tickets.activity.proposed')}</span>
                                </div>
                              )}
                              {selectedTicket.projectId && (
                                <div className="flex items-center gap-2 text-warm-300">
                                  <span className="w-2 h-2 rounded-full bg-accent-amber shrink-0" />
                                  <span>{t('tickets.activity.projectCreated')}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navigate(`/projects/${selectedTicket.projectId}`)
                                    }}
                                    className="text-accent-blue hover:underline"
                                  >
                                    {t('tickets.activity.viewProject')}
                                  </button>
                                </div>
                              )}
                              {selectedTicket.status === 'Cancelled' && (
                                <div className="flex items-center gap-2 text-warm-300">
                                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                  <span>{t('tickets.activity.cancelled')}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Meta info */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-warm-700/50">
                            <div>
                              <div className="text-[10px] text-warm-500 uppercase">{t('tickets.detail.category')}</div>
                              <div className="text-xs text-warm-200">{t(`tickets.category.${selectedTicket.category.toLowerCase()}`)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-warm-500 uppercase">{t('tickets.detail.complexity')}</div>
                              <div className="text-xs text-warm-200">{t(`tickets.complexity.${selectedTicket.complexity.toLowerCase()}`)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-warm-500 uppercase">{t('tickets.detail.created')}</div>
                              <div className="text-xs text-warm-200">{formatDate(selectedTicket.createdAt)}</div>
                            </div>
                            {selectedTicket.contactEmail && (
                              <div>
                                <div className="text-[10px] text-warm-500 uppercase">{t('tickets.detail.contact')}</div>
                                <div className="text-xs text-warm-200 truncate">{selectedTicket.contactEmail}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </StaggerChildren>
          )}
        </>
      )}
    </section>
  )
}
