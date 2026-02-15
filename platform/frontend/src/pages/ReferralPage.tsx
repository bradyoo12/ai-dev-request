import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, UserPlus, CreditCard, Gift, Copy, Mail, Check, Link } from 'lucide-react'
import { getReferrals, generateReferralCode, getReferralStats } from '../api/referrals'
import type { Referral, ReferralStats } from '../api/referrals'
import { StatusBadge } from '../components/StatusBadge'

const ReferralPage = () => {
  const { t } = useTranslation()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referralCode, setReferralCode] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const referralLink = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : ''

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const [referralList, referralStats] = await Promise.all([
        getReferrals(),
        getReferralStats(),
      ])
      setReferrals(referralList)
      setStats(referralStats)

      // Find existing active referral code
      const activeCode = referralList.find(
        (r) => r.status === 'Pending' && !r.referredUserId
      )
      if (activeCode) {
        setReferralCode(activeCode.referralCode)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('referral.error.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateCode() {
    try {
      setGenerating(true)
      setError(null)
      const result = await generateReferralCode()
      setReferralCode(result.referralCode)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('referral.error.generateFailed'))
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopyLink() {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = referralLink
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleEmailShare() {
    if (!referralLink) return
    const subject = encodeURIComponent(t('referral.email.subject'))
    const body = encodeURIComponent(t('referral.email.body', { link: referralLink }))
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  function getStatusKey(status: string): string {
    switch (status) {
      case 'Pending':
        return 'pending'
      case 'SignedUp':
        return 'success'
      case 'Converted':
        return 'completed'
      default:
        return 'pending'
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('referral.title')}</h1>
          <p className="text-warm-400 mt-1">{t('referral.subtitle')}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-900/20 border border-red-800/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Referral Link Section */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Link className="w-5 h-5 text-accent-blue" />
          {t('referral.linkSection.title')}
        </h2>
        <p className="text-warm-400 text-sm">{t('referral.linkSection.description')}</p>

        {referralCode ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-3 bg-warm-800/50 rounded-xl text-sm font-mono text-warm-200 truncate">
                {referralLink}
              </div>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl text-sm font-medium hover:shadow-glow-blue transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t('referral.copied')}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {t('referral.copyLink')}
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-warm-500 text-sm">{t('referral.code')}:</span>
              <span className="font-mono text-accent-amber font-semibold">{referralCode}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm hover:bg-warm-800/50 transition-all"
              >
                <Copy className="w-4 h-4" />
                {t('referral.share.copyLink')}
              </button>
              <button
                onClick={handleEmailShare}
                className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm hover:bg-warm-800/50 transition-all"
              >
                <Mail className="w-4 h-4" />
                {t('referral.share.email')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleGenerateCode}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-purple rounded-xl text-sm font-medium hover:shadow-glow-blue transition-all disabled:opacity-50"
          >
            {generating ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {t('referral.generateCode')}
          </button>
        )}
      </div>

      {/* How It Works */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t('referral.howItWorks.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warm-800/30">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-blue/20 text-accent-blue font-bold text-sm shrink-0">1</div>
            <div>
              <p className="font-medium text-sm">{t('referral.howItWorks.step1.title')}</p>
              <p className="text-warm-400 text-xs mt-1">{t('referral.howItWorks.step1.description')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warm-800/30">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-purple/20 text-accent-purple font-bold text-sm shrink-0">2</div>
            <div>
              <p className="font-medium text-sm">{t('referral.howItWorks.step2.title')}</p>
              <p className="text-warm-400 text-xs mt-1">{t('referral.howItWorks.step2.description')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warm-800/30">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-amber/20 text-accent-amber font-bold text-sm shrink-0">3</div>
            <div>
              <p className="font-medium text-sm">{t('referral.howItWorks.step3.title')}</p>
              <p className="text-warm-400 text-xs mt-1">{t('referral.howItWorks.step3.description')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 text-center">
            <Users className="w-6 h-6 text-accent-blue mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalInvited}</p>
            <p className="text-warm-400 text-sm mt-1">{t('referral.stats.invited')}</p>
          </div>
          <div className="glass-card rounded-2xl p-5 text-center">
            <UserPlus className="w-6 h-6 text-accent-purple mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalSignedUp}</p>
            <p className="text-warm-400 text-sm mt-1">{t('referral.stats.signedUp')}</p>
          </div>
          <div className="glass-card rounded-2xl p-5 text-center">
            <CreditCard className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalConverted}</p>
            <p className="text-warm-400 text-sm mt-1">{t('referral.stats.converted')}</p>
          </div>
          <div className="glass-card rounded-2xl p-5 text-center">
            <Gift className="w-6 h-6 text-accent-amber mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalCreditsEarned}</p>
            <p className="text-warm-400 text-sm mt-1">{t('referral.stats.creditsEarned')}</p>
          </div>
        </div>
      )}

      {/* Referral History Table */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t('referral.history.title')}</h2>

        {referrals.length === 0 ? (
          <div className="text-center py-12 text-warm-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t('referral.history.empty')}</p>
            <p className="text-sm mt-1">{t('referral.history.emptyHint')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-warm-400 text-left border-b border-warm-700/30">
                  <th className="pb-3 pr-4">{t('referral.history.code')}</th>
                  <th className="pb-3 pr-4">{t('referral.history.status')}</th>
                  <th className="pb-3 pr-4">{t('referral.history.creditsEarned')}</th>
                  <th className="pb-3 pr-4">{t('referral.history.createdAt')}</th>
                  <th className="pb-3">{t('referral.history.signedUpAt')}</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id} className="border-b border-warm-800/30 hover:bg-warm-800/20">
                    <td className="py-3 pr-4 font-mono text-accent-blue">{referral.referralCode}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={getStatusKey(referral.status)} />
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-accent-amber font-medium">
                        {referral.totalCreditsEarned > 0 ? `+${referral.totalCreditsEarned}` : '0'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-warm-400">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-warm-400">
                      {referral.signedUpAt
                        ? new Date(referral.signedUpAt).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReferralPage
