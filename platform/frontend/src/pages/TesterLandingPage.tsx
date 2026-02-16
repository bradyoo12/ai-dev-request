import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Rocket, Star, Gift, Trophy, Bug, FileSearch, TestTube, Award,
  ChevronRight, CheckCircle, Clock, Send
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { submitApplication, getMyApplication } from '../api/tester'
import type { TesterApplication } from '../api/tester'

const TesterLandingPage = () => {
  const { t } = useTranslation()
  const { authUser, requireAuth } = useAuth()
  const navigate = useNavigate()

  const [existingApplication, setExistingApplication] = useState<TesterApplication | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [motivation, setMotivation] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('Beginner')
  const [interestedAreas, setInterestedAreas] = useState<string[]>([])

  useEffect(() => {
    if (authUser) {
      loadExistingApplication()
    }
  }, [authUser])

  async function loadExistingApplication() {
    try {
      setLoading(true)
      const app = await getMyApplication()
      setExistingApplication(app)
    } catch {
      // No existing application
    } finally {
      setLoading(false)
    }
  }

  const areaOptions = [
    'UI/UX', 'API', 'Performance', 'Security', 'Mobile', 'Accessibility', 'Localization', 'AI Features'
  ]

  function toggleArea(area: string) {
    setInterestedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!requireAuth()) return

    if (!name.trim() || !email.trim() || !motivation.trim()) {
      setError(t('tester.form.error.required'))
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const result = await submitApplication({
        name: name.trim(),
        email: email.trim(),
        motivation: motivation.trim(),
        experienceLevel,
        interestedAreas: interestedAreas.join(','),
      })
      setExistingApplication(result)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tester.form.error.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const benefits = [
    { icon: Rocket, titleKey: 'tester.benefit.earlyAccess.title', descKey: 'tester.benefit.earlyAccess.desc' },
    { icon: Star, titleKey: 'tester.benefit.shape.title', descKey: 'tester.benefit.shape.desc' },
    { icon: Gift, titleKey: 'tester.benefit.credits.title', descKey: 'tester.benefit.credits.desc' },
    { icon: Trophy, titleKey: 'tester.benefit.recognition.title', descKey: 'tester.benefit.recognition.desc' },
  ]

  const creditRewards = [
    { type: 'feature_review', icon: FileSearch, points: 30, credits: 30 },
    { type: 'bug_report', icon: Bug, points: 50, credits: 50 },
    { type: 'critical_bug_report', icon: Bug, points: 100, credits: 100 },
    { type: 'test_completion', icon: TestTube, points: 20, credits: 20 },
    { type: 'monthly_bonus', icon: Award, points: 50, credits: 50 },
  ]

  const tiers = [
    { name: 'Bronze', minPoints: 0, multiplier: '1x', color: 'text-orange-400' },
    { name: 'Silver', minPoints: 500, multiplier: '1.5x', color: 'text-gray-300' },
    { name: 'Gold', minPoints: 2000, multiplier: '2x', color: 'text-yellow-400' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-16 px-4"
      >
        <div className="inline-flex items-center gap-2 bg-accent-blue/10 text-accent-blue px-4 py-2 rounded-full text-sm font-medium mb-6">
          <TestTube className="w-4 h-4" />
          {t('tester.badge')}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {t('tester.title')}
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          {t('tester.subtitle')}
        </p>
        <div className="flex items-center justify-center gap-4">
          <a href="#apply" className="bg-accent-blue hover:bg-accent-blue/90 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
            {t('tester.cta.apply')}
            <ChevronRight className="w-4 h-4" />
          </a>
          {authUser && existingApplication?.status === 'approved' && (
            <button
              onClick={() => navigate('/testers/dashboard')}
              className="border border-gray-600 text-gray-300 hover:border-accent-blue hover:text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t('tester.cta.dashboard')}
            </button>
          )}
        </div>
      </motion.section>

      {/* Benefits Section */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">{t('tester.benefits.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.titleKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-dark-card border border-dark-border rounded-xl p-6 text-center hover:border-accent-blue/50 transition-colors"
            >
              <div className="w-12 h-12 bg-accent-blue/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="w-6 h-6 text-accent-blue" />
              </div>
              <h3 className="text-white font-semibold mb-2">{t(benefit.titleKey)}</h3>
              <p className="text-gray-400 text-sm">{t(benefit.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Credit Rewards Table */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">{t('tester.rewards.title')}</h2>
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">{t('tester.rewards.type')}</th>
                <th className="text-center text-gray-400 text-sm font-medium px-6 py-4">{t('tester.rewards.points')}</th>
                <th className="text-center text-gray-400 text-sm font-medium px-6 py-4">{t('tester.rewards.credits')}</th>
              </tr>
            </thead>
            <tbody>
              {creditRewards.map(reward => (
                <tr key={reward.type} className="border-b border-dark-border/50 hover:bg-dark-hover transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <reward.icon className="w-5 h-5 text-accent-blue" />
                    <span className="text-white">{t(`tester.contribution.${reward.type}`)}</span>
                  </td>
                  <td className="text-center px-6 py-4 text-gray-300">{reward.points}</td>
                  <td className="text-center px-6 py-4 text-green-400 font-medium">+{reward.credits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tester Tiers */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">{t('tester.tiers.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-dark-card border border-dark-border rounded-xl p-6 text-center hover:border-accent-blue/50 transition-colors"
            >
              <Trophy className={`w-10 h-10 mx-auto mb-3 ${tier.color}`} />
              <h3 className={`text-xl font-bold mb-2 ${tier.color}`}>{t(`tester.tier.${tier.name.toLowerCase()}`)}</h3>
              <p className="text-gray-400 text-sm mb-3">
                {tier.minPoints === 0
                  ? t('tester.tiers.default')
                  : t('tester.tiers.minPoints', { points: tier.minPoints })}
              </p>
              <div className="bg-dark-bg rounded-lg px-4 py-2">
                <span className="text-white font-semibold">{tier.multiplier}</span>
                <span className="text-gray-400 text-sm ml-1">{t('tester.tiers.creditMultiplier')}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="py-12 px-4 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">{t('tester.form.title')}</h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full" />
          </div>
        ) : existingApplication ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-dark-card border border-dark-border rounded-xl p-8 text-center"
          >
            {existingApplication.status === 'approved' ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{t('tester.application.approved')}</h3>
                <p className="text-gray-400 mb-4">{t('tester.application.approvedDesc')}</p>
                <button
                  onClick={() => navigate('/testers/dashboard')}
                  className="bg-accent-blue hover:bg-accent-blue/90 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {t('tester.cta.dashboard')}
                </button>
              </>
            ) : existingApplication.status === 'rejected' ? (
              <>
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-400 text-2xl">!</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t('tester.application.rejected')}</h3>
                <p className="text-gray-400">{t('tester.application.rejectedDesc')}</p>
              </>
            ) : (
              <>
                <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{t('tester.application.pending')}</h3>
                <p className="text-gray-400">{t('tester.application.pendingDesc')}</p>
              </>
            )}
          </motion.div>
        ) : success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-card border border-green-500/30 rounded-xl p-8 text-center"
          >
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{t('tester.form.success')}</h3>
            <p className="text-gray-400">{t('tester.form.successDesc')}</p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-dark-card border border-dark-border rounded-xl p-8 space-y-6"
          >
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('tester.form.name')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('tester.form.namePlaceholder')}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-accent-blue focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('tester.form.email')} *
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('tester.form.emailPlaceholder')}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-accent-blue focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('tester.form.motivation')} *
              </label>
              <textarea
                value={motivation}
                onChange={e => setMotivation(e.target.value)}
                placeholder={t('tester.form.motivationPlaceholder')}
                rows={4}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-accent-blue focus:outline-none transition-colors resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                {t('tester.form.experienceLevel')} *
              </label>
              <div className="flex gap-4">
                {['Beginner', 'Intermediate', 'Expert'].map(level => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="experienceLevel"
                      value={level}
                      checked={experienceLevel === level}
                      onChange={e => setExperienceLevel(e.target.value)}
                      className="w-4 h-4 accent-accent-blue"
                    />
                    <span className="text-gray-300 text-sm">{t(`tester.level.${level.toLowerCase()}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                {t('tester.form.interestedAreas')}
              </label>
              <div className="flex flex-wrap gap-2">
                {areaOptions.map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArea(area)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      interestedAreas.includes(area)
                        ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                        : 'border-dark-border text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t('tester.form.submit')}
                </>
              )}
            </button>
          </motion.form>
        )}
      </section>
    </div>
  )
}

export default TesterLandingPage
