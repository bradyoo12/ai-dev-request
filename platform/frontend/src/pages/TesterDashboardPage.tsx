import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Trophy, Bug, FileSearch, TestTube, Award, Star,
  TrendingUp, Gift, Clock, Users
} from 'lucide-react'
import { getDashboard } from '../api/tester'
import type { TesterDashboard } from '../api/tester'

const TesterDashboardPage = () => {
  const { t } = useTranslation()
  const [dashboard, setDashboard] = useState<TesterDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      setLoading(true)
      setError(null)
      const data = await getDashboard()
      setDashboard(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tester.dashboard.error'))
    } finally {
      setLoading(false)
    }
  }

  function getTierColor(tier: string) {
    switch (tier) {
      case 'Gold': return 'text-yellow-400'
      case 'Silver': return 'text-gray-300'
      default: return 'text-orange-400'
    }
  }

  function getTierBgColor(tier: string) {
    switch (tier) {
      case 'Gold': return 'bg-yellow-400/10 border-yellow-400/30'
      case 'Silver': return 'bg-gray-300/10 border-gray-300/30'
      default: return 'bg-orange-400/10 border-orange-400/30'
    }
  }

  function getContributionIcon(type: string) {
    switch (type) {
      case 'bug_report':
      case 'critical_bug_report':
        return Bug
      case 'feature_review':
        return FileSearch
      case 'test_completion':
        return TestTube
      case 'monthly_bonus':
        return Award
      default:
        return Star
    }
  }

  function getNextTier(tier: string) {
    switch (tier) {
      case 'Bronze': return { name: 'Silver', points: 500 }
      case 'Silver': return { name: 'Gold', points: 2000 }
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadDashboard}
            className="bg-accent-blue hover:bg-accent-blue/90 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {t('tester.dashboard.retry')}
          </button>
        </div>
      </div>
    )
  }

  if (!dashboard) return null

  const { profile, rank, recentContributions, leaderboard } = dashboard
  const nextTier = getNextTier(profile.tier)
  const tierProgress = nextTier
    ? Math.min(100, (profile.contributionPoints / nextTier.points) * 100)
    : 100

  const stats = [
    { label: t('tester.dashboard.totalContributions'), value: profile.bugsFound + profile.reviewsWritten + profile.testsCompleted, icon: TrendingUp, color: 'text-accent-blue' },
    { label: t('tester.dashboard.creditsEarned'), value: profile.totalCreditsEarned, icon: Gift, color: 'text-green-400' },
    { label: t('tester.dashboard.bugsFound'), value: profile.bugsFound, icon: Bug, color: 'text-red-400' },
    { label: t('tester.dashboard.reviewsWritten'), value: profile.reviewsWritten, icon: FileSearch, color: 'text-purple-400' },
    { label: t('tester.dashboard.rank'), value: `#${rank}`, icon: Trophy, color: 'text-yellow-400' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{t('tester.dashboard.title')}</h1>
            <p className="text-gray-400 mt-1">{t('tester.dashboard.subtitle')}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getTierBgColor(profile.tier)}`}>
            <Trophy className={`w-5 h-5 ${getTierColor(profile.tier)}`} />
            <span className={`font-semibold ${getTierColor(profile.tier)}`}>
              {t(`tester.tier.${profile.tier.toLowerCase()}`)}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-dark-card border border-dark-border rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-gray-400 text-xs">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Tier Progress */}
        {nextTier && (
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">{t('tester.dashboard.tierProgress')}</h3>
              <span className="text-gray-400 text-sm">
                {profile.contributionPoints} / {nextTier.points} {t('tester.dashboard.points')}
              </span>
            </div>
            <div className="w-full bg-dark-bg rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tierProgress}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-3 rounded-full bg-gradient-to-r from-accent-blue to-purple-500"
              />
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {t('tester.dashboard.nextTier', { tier: t(`tester.tier.${nextTier.name.toLowerCase()}`), points: nextTier.points - profile.contributionPoints })}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contribution History */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4">{t('tester.dashboard.contributionHistory')}</h3>
            {recentContributions.length === 0 ? (
              <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
                <TestTube className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">{t('tester.dashboard.noContributions')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentContributions.map((contribution, i) => {
                  const Icon = getContributionIcon(contribution.type)
                  return (
                    <motion.div
                      key={contribution.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="bg-dark-card border border-dark-border rounded-xl p-4 flex items-center gap-4"
                    >
                      <div className="w-10 h-10 bg-accent-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-accent-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {t(`tester.contribution.${contribution.type}`)}
                        </p>
                        <p className="text-gray-400 text-xs truncate">{contribution.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-green-400 text-sm font-medium">+{contribution.creditsAwarded} {t('tester.dashboard.credits')}</p>
                        <p className="text-gray-500 text-xs">+{contribution.pointsAwarded} {t('tester.dashboard.pts')}</p>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 text-xs flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(contribution.createdAt).toLocaleDateString()}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('tester.dashboard.leaderboard')}
            </h3>
            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
              {leaderboard.length === 0 ? (
                <div className="p-6 text-center">
                  <Trophy className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">{t('tester.dashboard.noLeaderboard')}</p>
                </div>
              ) : (
                <div className="divide-y divide-dark-border/50">
                  {leaderboard.map(entry => (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        entry.userId === profile.userId ? 'bg-accent-blue/5' : ''
                      }`}
                    >
                      <span className={`text-sm font-bold w-6 text-center ${
                        entry.rank === 1 ? 'text-yellow-400' :
                        entry.rank === 2 ? 'text-gray-300' :
                        entry.rank === 3 ? 'text-orange-400' :
                        'text-gray-500'
                      }`}>
                        #{entry.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">
                          {entry.userId === profile.userId ? t('tester.dashboard.you') : entry.userId.slice(0, 8) + '...'}
                        </p>
                        <p className={`text-xs ${getTierColor(entry.tier)}`}>
                          {t(`tester.tier.${entry.tier.toLowerCase()}`)}
                        </p>
                      </div>
                      <span className="text-gray-300 text-sm font-medium">
                        {entry.contributionPoints} {t('tester.dashboard.pts')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default TesterDashboardPage
