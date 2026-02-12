import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getBillingOverview,
  updateAutoTopUp,
  getBillingAccount,
  getUsageSummary,
  getInvoices,
  getPricingPlans,
  subscribeToPlan,
  cancelSubscription,
  createPortalSession,
} from '../api/billing'
import { getTokenPackages } from '../api/settings'
import type {
  BillingOverview,
  AutoTopUpConfig,
  BillingAccount,
  UsageSummary,
  Invoice,
  PricingPlan,
} from '../api/billing'
import type { TokenPackage } from '../api/settings'

export default function BillingPage() {
  const { t } = useTranslation()

  // Existing billing state
  const [billing, setBilling] = useState<BillingOverview | null>(null)
  const [packages, setPackages] = useState<TokenPackage[]>([])

  // Usage-based billing state
  const [account, setAccount] = useState<BillingAccount | null>(null)
  const [usage, setUsage] = useState<UsageSummary | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [plans, setPlans] = useState<PricingPlan[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [error, setError] = useState('')

  const thresholdOptions = [50, 100, 200, 500]
  const monthlyLimitOptions = [
    { value: null, label: t('billing.autoTopUp.noLimit') },
    { value: 50, label: '$50' },
    { value: 100, label: '$100' },
    { value: 200, label: '$200' },
  ]

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [billingData, pkgs, accountData, usageData, invoiceData, planData] = await Promise.all([
        getBillingOverview(),
        getTokenPackages(),
        getBillingAccount(),
        getUsageSummary(),
        getInvoices(),
        getPricingPlans(),
      ])
      setBilling(billingData)
      setPackages(pkgs)
      setAccount(accountData)
      setUsage(usageData)
      setInvoices(invoiceData)
      setPlans(planData)
    } catch {
      setError(t('api.error.billingFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { loadData() }, [loadData])

  const handleToggleAutoTopUp = async () => {
    if (!billing) return
    const config = billing.autoTopUp
    await saveAutoTopUp({ ...config, isEnabled: !config.isEnabled })
  }

  const handleUpdateConfig = async (updates: Partial<AutoTopUpConfig>) => {
    if (!billing) return
    const config = { ...billing.autoTopUp, ...updates }
    await saveAutoTopUp(config)
  }

  const saveAutoTopUp = async (config: AutoTopUpConfig) => {
    setSaving(true)
    try {
      const updated = await updateAutoTopUp({
        isEnabled: config.isEnabled,
        threshold: config.threshold,
        tokenPackageId: config.tokenPackageId,
        monthlyLimitUsd: config.monthlyLimitUsd,
      })
      setBilling(prev => prev ? { ...prev, autoTopUp: updated } : prev)
    } catch {
      setError(t('api.error.autoTopUpFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleSubscribe = async (planId: string) => {
    setSubscribing(true)
    setError('')
    try {
      const updatedAccount = await subscribeToPlan(planId)
      setAccount(updatedAccount)
      // Reload usage summary after plan change
      const usageData = await getUsageSummary()
      setUsage(usageData)
      const invoiceData = await getInvoices()
      setInvoices(invoiceData)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('billing.subscribeFailed', 'Failed to subscribe'))
    } finally {
      setSubscribing(false)
    }
  }

  const handleCancelSubscription = async () => {
    setSubscribing(true)
    setError('')
    try {
      const updatedAccount = await cancelSubscription()
      setAccount(updatedAccount)
      const usageData = await getUsageSummary()
      setUsage(usageData)
      const invoiceData = await getInvoices()
      setInvoices(invoiceData)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('billing.cancelFailed', 'Failed to cancel'))
    } finally {
      setSubscribing(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const session = await createPortalSession()
      window.open(session.url, '_blank')
    } catch {
      setError(t('billing.portalFailed', 'Failed to open billing portal'))
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-900/50 text-green-400'
      case 'trialing': return 'bg-blue-900/50 text-blue-400'
      case 'past_due': return 'bg-yellow-900/50 text-yellow-400'
      case 'cancelled': return 'bg-red-900/50 text-red-400'
      default: return 'bg-warm-700 text-warm-400'
    }
  }

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-900/50 text-green-400'
      case 'pending': return 'bg-yellow-900/50 text-yellow-400'
      case 'cancelled': return 'bg-red-900/50 text-red-400'
      default: return 'bg-warm-700 text-warm-400'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-warm-400">
        {t('billing.loading')}
      </div>
    )
  }

  if (error && !account && !billing) {
    return (
      <div className="text-center py-12 text-red-400">{error}</div>
    )
  }

  const selectedPackage = packages.find(p => p.id === billing?.autoTopUp?.tokenPackageId)
  const requestsPercent = usage ? Math.min(100, (usage.requestsUsed / Math.max(1, usage.requestsLimit)) * 100) : 0

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Simulation notice */}
      {billing?.isSimulation && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-sm text-yellow-400">
          {t('billing.simulationNotice')}
        </div>
      )}

      {/* Current Plan Card */}
      {account && (
        <div className="bg-warm-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{t('billing.currentPlan', 'Current Plan')}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(account.status)}`}>
              {account.status}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-sm text-warm-400 mb-1">{t('billing.planName', 'Plan')}</div>
              <div className="text-xl font-bold capitalize">{account.plan}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-sm text-warm-400 mb-1">{t('billing.monthlyRate', 'Monthly Rate')}</div>
              <div className="text-xl font-bold">${account.monthlyRate.toFixed(2)}<span className="text-sm text-warm-400 font-normal">/mo</span></div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-sm text-warm-400 mb-1">{t('billing.period', 'Billing Period')}</div>
              <div className="text-sm">
                {new Date(account.periodStart).toLocaleDateString()} - {new Date(account.periodEnd).toLocaleDateString()}
              </div>
            </div>
          </div>
          {account.plan !== 'free' && account.status === 'active' && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleManageSubscription}
                className="px-4 py-2 bg-warm-700 hover:bg-warm-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {t('billing.manageSubscription', 'Manage Subscription')}
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={subscribing}
                className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {t('billing.cancelSubscription', 'Cancel Subscription')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Usage Meters */}
      {usage && (
        <div className="bg-warm-900 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">{t('billing.usageThisPeriod', 'Usage This Period')}</h3>
          <div className="space-y-4">
            {/* Requests progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-warm-400">{t('billing.requests', 'Requests')}</span>
                <span className="text-sm font-mono">
                  {usage.requestsUsed} / {usage.requestsLimit}
                </span>
              </div>
              <div className="w-full h-3 bg-warm-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    requestsPercent >= 100 ? 'bg-red-500' :
                    requestsPercent >= 80 ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(requestsPercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Tokens consumed */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-warm-400">{t('billing.tokensConsumed', 'Tokens Consumed')}</span>
              <span className="text-sm font-mono">{usage.tokensUsed.toLocaleString()}</span>
            </div>

            {/* Overage charges */}
            {usage.overageCharges > 0 && (
              <div className="flex items-center justify-between bg-yellow-900/20 rounded-lg p-3">
                <span className="text-sm text-yellow-400">{t('billing.overageCharges', 'Overage Charges')}</span>
                <span className="text-sm font-mono text-yellow-400">${usage.overageCharges.toFixed(2)}</span>
              </div>
            )}

            {/* Estimated total */}
            <div className="flex items-center justify-between border-t border-warm-700 pt-3">
              <span className="text-sm font-medium">{t('billing.estimatedTotal', 'Estimated Total')}</span>
              <span className="text-lg font-bold">${usage.totalEstimated.toFixed(2)}</span>
            </div>

            {/* Days remaining */}
            <div className="text-xs text-warm-500 text-right">
              {usage.daysRemaining} {t('billing.daysRemaining', 'days remaining in period')}
            </div>
          </div>
        </div>
      )}

      {/* Plan Comparison */}
      {plans.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-4">{t('billing.plans', 'Plans')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = account?.plan === plan.id
              return (
                <div
                  key={plan.id}
                  className={`bg-warm-900 rounded-xl p-6 border-2 transition-colors ${
                    isCurrent ? 'border-blue-500' : 'border-transparent hover:border-warm-700'
                  }`}
                >
                  <div className="mb-4">
                    <h4 className="text-lg font-bold">{plan.name}</h4>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">${plan.monthlyRate}</span>
                      <span className="text-warm-400 text-sm">/mo</span>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-warm-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 mt-0.5 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="w-full py-2 text-center bg-blue-900/50 text-blue-400 rounded-lg text-sm font-medium">
                      {t('billing.currentPlanBadge', 'Current Plan')}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribing}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {subscribing ? t('billing.subscribing', 'Subscribing...') : (
                        account && plans.findIndex(p => p.id === plan.id) < plans.findIndex(p => p.id === account.plan)
                          ? t('billing.downgrade', 'Downgrade')
                          : t('billing.upgrade', 'Upgrade')
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Invoice History */}
      {invoices.length > 0 && (
        <div className="bg-warm-900 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">{t('billing.invoiceHistory', 'Invoice History')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-warm-400 border-b border-warm-700">
                  <th className="text-left py-2 pr-4">{t('billing.date', 'Date')}</th>
                  <th className="text-left py-2 pr-4">{t('billing.description', 'Description')}</th>
                  <th className="text-right py-2 pr-4">{t('billing.amount', 'Amount')}</th>
                  <th className="text-center py-2">{t('billing.status', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-warm-800">
                    <td className="py-3 pr-4 text-warm-300">{new Date(invoice.date).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 text-warm-300">{invoice.description}</td>
                    <td className="py-3 pr-4 text-right font-mono">${invoice.amount.toFixed(2)}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getInvoiceStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Methods (existing) */}
      {billing && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{t('billing.paymentMethods')}</h3>
            <button className="text-sm text-blue-400 hover:text-blue-300">
              {t('billing.addCard')}
            </button>
          </div>

          {billing.paymentMethods.length === 0 ? (
            <div className="bg-warm-900 rounded-xl p-6 text-center text-warm-400">
              <p>{t('billing.noPaymentMethods')}</p>
              <p className="text-sm mt-2">{t('billing.addCardPrompt')}</p>
            </div>
          ) : (
            billing.paymentMethods.map(pm => (
              <div key={pm.id} className="bg-warm-900 rounded-xl p-5 mb-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warm-400"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                    <div>
                      <div className="font-medium">
                        {pm.brand} **** {pm.last4}
                        {pm.isDefault && (
                          <span className="ml-2 text-xs bg-green-800 text-green-300 px-2 py-0.5 rounded-full">
                            {t('billing.default')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-warm-400">
                        {t('billing.expires')} {pm.expMonth}/{pm.expYear}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!pm.isDefault && (
                      <button className="text-sm text-warm-400 hover:text-white">
                        {t('billing.setDefault')}
                      </button>
                    )}
                    <button className="text-sm text-red-400 hover:text-red-300">
                      {t('billing.remove')}
                    </button>
                  </div>
                </div>

                {/* Auto Top-Up section within default card */}
                {pm.isDefault && billing && (
                  <div className="bg-warm-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        <span className="font-medium">{t('billing.autoTopUp.title')}</span>
                      </div>
                      <button
                        onClick={handleToggleAutoTopUp}
                        disabled={saving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          billing.autoTopUp.isEnabled ? 'bg-green-600' : 'bg-warm-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            billing.autoTopUp.isEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {billing.autoTopUp.isEnabled ? (
                      <div className="space-y-3">
                        {/* Failure warning */}
                        {billing.autoTopUp.lastFailedAt && (
                          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-400">
                            <div className="font-medium">{t('billing.autoTopUp.failedTitle')}</div>
                            <div>{billing.autoTopUp.failureReason}</div>
                          </div>
                        )}

                        {/* Threshold */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-warm-400">{t('billing.autoTopUp.threshold')}</span>
                          <select
                            value={billing.autoTopUp.threshold}
                            onChange={e => handleUpdateConfig({ threshold: Number(e.target.value) })}
                            className="bg-warm-700 text-white text-sm rounded-lg px-3 py-1.5 border border-warm-600"
                          >
                            {thresholdOptions.map(v => (
                              <option key={v} value={v}>{v} {t('settings.tokens.tokensUnit')}</option>
                            ))}
                          </select>
                        </div>

                        {/* Package */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-warm-400">{t('billing.autoTopUp.package')}</span>
                          <select
                            value={billing.autoTopUp.tokenPackageId}
                            onChange={e => handleUpdateConfig({ tokenPackageId: Number(e.target.value) })}
                            className="bg-warm-700 text-white text-sm rounded-lg px-3 py-1.5 border border-warm-600"
                          >
                            {packages.map(pkg => (
                              <option key={pkg.id} value={pkg.id}>
                                {pkg.name} / ${pkg.priceUsd.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Monthly limit */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-warm-400">{t('billing.autoTopUp.monthlyLimit')}</span>
                          <select
                            value={billing.autoTopUp.monthlyLimitUsd ?? ''}
                            onChange={e => handleUpdateConfig({
                              monthlyLimitUsd: e.target.value ? Number(e.target.value) : null
                            })}
                            className="bg-warm-700 text-white text-sm rounded-lg px-3 py-1.5 border border-warm-600"
                          >
                            {monthlyLimitOptions.map((opt, i) => (
                              <option key={i} value={opt.value ?? ''}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Summary */}
                        <div className="bg-warm-900/50 rounded-lg p-3 text-sm text-warm-400">
                          {t('billing.autoTopUp.summary', {
                            amount: selectedPackage ? `$${selectedPackage.priceUsd.toFixed(2)}` : '',
                            tokens: selectedPackage?.tokenAmount ?? 0,
                            threshold: billing.autoTopUp.threshold,
                          })}
                        </div>

                        {/* Monthly spent */}
                        {billing.autoTopUp.monthlySpentUsd > 0 && (
                          <div className="text-xs text-warm-500">
                            {t('billing.autoTopUp.monthlySpent', {
                              amount: `$${billing.autoTopUp.monthlySpentUsd.toFixed(2)}`,
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-warm-400">
                        <p>{t('billing.autoTopUp.disabledDescription')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
