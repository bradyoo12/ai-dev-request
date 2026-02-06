import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getBillingOverview, updateAutoTopUp } from '../api/billing'
import { getTokenPackages } from '../api/settings'
import type { BillingOverview, AutoTopUpConfig } from '../api/billing'
import type { TokenPackage } from '../api/settings'

export default function BillingPage() {
  const { t } = useTranslation()
  const [billing, setBilling] = useState<BillingOverview | null>(null)
  const [packages, setPackages] = useState<TokenPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      const [billingData, pkgs] = await Promise.all([
        getBillingOverview(),
        getTokenPackages(),
      ])
      setBilling(billingData)
      setPackages(pkgs)
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

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        {t('billing.loading')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">{error}</div>
    )
  }

  if (!billing) return null

  const selectedPackage = packages.find(p => p.id === billing.autoTopUp.tokenPackageId)

  return (
    <div className="space-y-6">
      {/* Simulation notice */}
      {billing.isSimulation && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-sm text-yellow-400">
          {t('billing.simulationNotice')}
        </div>
      )}

      {/* Payment Methods */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t('billing.paymentMethods')}</h3>
          <button className="text-sm text-blue-400 hover:text-blue-300">
            {t('billing.addCard')}
          </button>
        </div>

        {billing.paymentMethods.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-6 text-center text-gray-400">
            <p>{t('billing.noPaymentMethods')}</p>
            <p className="text-sm mt-2">{t('billing.addCardPrompt')}</p>
          </div>
        ) : (
          billing.paymentMethods.map(pm => (
            <div key={pm.id} className="bg-gray-900 rounded-xl p-5 mb-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{pm.brand === 'Visa' ? '💳' : '💳'}</span>
                  <div>
                    <div className="font-medium">
                      {pm.brand} •••• {pm.last4}
                      {pm.isDefault && (
                        <span className="ml-2 text-xs bg-green-800 text-green-300 px-2 py-0.5 rounded-full">
                          {t('billing.default')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {t('billing.expires')} {pm.expMonth}/{pm.expYear}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!pm.isDefault && (
                    <button className="text-sm text-gray-400 hover:text-white">
                      {t('billing.setDefault')}
                    </button>
                  )}
                  <button className="text-sm text-red-400 hover:text-red-300">
                    {t('billing.remove')}
                  </button>
                </div>
              </div>

              {/* Auto Top-Up section within default card */}
              {pm.isDefault && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">⚡</span>
                      <span className="font-medium">{t('billing.autoTopUp.title')}</span>
                    </div>
                    <button
                      onClick={handleToggleAutoTopUp}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        billing.autoTopUp.isEnabled ? 'bg-green-600' : 'bg-gray-600'
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
                        <span className="text-sm text-gray-400">{t('billing.autoTopUp.threshold')}</span>
                        <select
                          value={billing.autoTopUp.threshold}
                          onChange={e => handleUpdateConfig({ threshold: Number(e.target.value) })}
                          className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600"
                        >
                          {thresholdOptions.map(v => (
                            <option key={v} value={v}>{v} {t('settings.tokens.tokensUnit')}</option>
                          ))}
                        </select>
                      </div>

                      {/* Package */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">{t('billing.autoTopUp.package')}</span>
                        <select
                          value={billing.autoTopUp.tokenPackageId}
                          onChange={e => handleUpdateConfig({ tokenPackageId: Number(e.target.value) })}
                          className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600"
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
                        <span className="text-sm text-gray-400">{t('billing.autoTopUp.monthlyLimit')}</span>
                        <select
                          value={billing.autoTopUp.monthlyLimitUsd ?? ''}
                          onChange={e => handleUpdateConfig({
                            monthlyLimitUsd: e.target.value ? Number(e.target.value) : null
                          })}
                          className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600"
                        >
                          {monthlyLimitOptions.map((opt, i) => (
                            <option key={i} value={opt.value ?? ''}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Summary */}
                      <div className="bg-gray-900/50 rounded-lg p-3 text-sm text-gray-400">
                        {t('billing.autoTopUp.summary', {
                          amount: selectedPackage ? `$${selectedPackage.priceUsd.toFixed(2)}` : '',
                          tokens: selectedPackage?.tokenAmount ?? 0,
                          threshold: billing.autoTopUp.threshold,
                        })}
                      </div>

                      {/* Monthly spent */}
                      {billing.autoTopUp.monthlySpentUsd > 0 && (
                        <div className="text-xs text-gray-500">
                          {t('billing.autoTopUp.monthlySpent', {
                            amount: `$${billing.autoTopUp.monthlySpentUsd.toFixed(2)}`,
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">
                      <p>{t('billing.autoTopUp.disabledDescription')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
