import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../api/whitelabel';
import type { Tenant, TenantDetail, Partner, UsageSummary } from '../api/whitelabel';

export default function WhiteLabelPage() {
  const { t } = useTranslation();
  const { authUser } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail view
  const [selectedTenant, setSelectedTenant] = useState<TenantDetail | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [tab, setTab] = useState<'branding' | 'partners' | 'usage'>('branding');

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [creating, setCreating] = useState(false);

  // Add partner dialog
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerMargin, setPartnerMargin] = useState('10');

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      setTenants(await api.getTenants());
    } catch { setError(t('wl.loadError')); }
    setLoading(false);
  }, [t]);

  useEffect(() => { if (authUser) loadTenants(); }, [authUser, loadTenants]);

  if (!authUser) return <p className="text-center py-12 text-warm-400">{t('wl.loginRequired')}</p>;

  const openDetail = async (id: number) => {
    try {
      const detail = await api.getTenant(id);
      setSelectedTenant(detail);
      setTab('branding');
      const [p, u] = await Promise.all([api.getPartners(id), api.getUsageSummary(id)]);
      setPartners(p);
      setUsage(u);
    } catch { setError(t('wl.detailError')); }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    setCreating(true);
    try {
      await api.createTenant(newName.trim(), newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''));
      setShowCreate(false);
      setNewName('');
      setNewSlug('');
      await loadTenants();
    } catch { setError(t('wl.createError')); }
    setCreating(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteTenant(id);
      setSelectedTenant(null);
      await loadTenants();
    } catch { setError(t('wl.deleteError')); }
  };

  const handleAddPartner = async () => {
    if (!selectedTenant || !partnerName.trim()) return;
    try {
      await api.addPartner(selectedTenant.id, partnerName.trim(), partnerEmail.trim() || undefined, parseFloat(partnerMargin) || 10);
      setShowAddPartner(false);
      setPartnerName('');
      setPartnerEmail('');
      setPartnerMargin('10');
      setPartners(await api.getPartners(selectedTenant.id));
    } catch { setError(t('wl.addPartnerError')); }
  };

  const handleRemovePartner = async (partnerId: number) => {
    if (!selectedTenant) return;
    try {
      await api.removePartner(partnerId);
      setPartners(await api.getPartners(selectedTenant.id));
    } catch { setError(t('wl.removePartnerError')); }
  };

  // -- Detail View --
  if (selectedTenant) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedTenant(null)} className="text-sm text-blue-400 hover:underline">{t('wl.backToList')}</button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{selectedTenant.name}</h2>
            <p className="text-warm-400 text-sm">{selectedTenant.slug}{selectedTenant.customDomain ? ` / ${selectedTenant.customDomain}` : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded text-xs ${selectedTenant.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {selectedTenant.isActive ? t('wl.active') : t('wl.inactive')}
            </span>
            <button onClick={() => handleDelete(selectedTenant.id)} className="text-sm text-red-400 hover:text-red-300">{t('wl.delete')}</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-warm-700 pb-2">
          {(['branding', 'partners', 'usage'] as const).map(t2 => (
            <button key={t2} onClick={() => setTab(t2)}
              className={`px-3 py-1 rounded-t text-sm ${tab === t2 ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'}`}>
              {t(`wl.tab.${t2}`)}
            </button>
          ))}
        </div>

        {/* Branding Tab */}
        {tab === 'branding' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-warm-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-warm-300 mb-3">{t('wl.brandPreview')}</h3>
                <div className="bg-warm-900 rounded-lg p-4 space-y-2">
                  {selectedTenant.logoUrl && <img src={selectedTenant.logoUrl} alt="Logo" className="h-8" />}
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: selectedTenant.primaryColor || '#3b82f6' }} />
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: selectedTenant.secondaryColor || '#6b7280' }} />
                  </div>
                  {selectedTenant.welcomeMessage && <p className="text-xs text-warm-400">{selectedTenant.welcomeMessage}</p>}
                </div>
              </div>
              <div className="bg-warm-800 rounded-lg p-4 space-y-2">
                <h3 className="text-sm font-medium text-warm-300 mb-3">{t('wl.details')}</h3>
                <p className="text-xs text-warm-400">{t('wl.domain')}: {selectedTenant.customDomain || '-'}</p>
                <p className="text-xs text-warm-400">{t('wl.primaryColor')}: {selectedTenant.primaryColor || '#3b82f6'}</p>
                <p className="text-xs text-warm-400">{t('wl.secondaryColor')}: {selectedTenant.secondaryColor || '#6b7280'}</p>
                <p className="text-xs text-warm-400">{t('wl.aiPrompt')}: {selectedTenant.aiPromptGuidelines ? t('wl.configured') : t('wl.notConfigured')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Partners Tab */}
        {tab === 'partners' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-warm-300">{t('wl.partners')}</h3>
              <button onClick={() => setShowAddPartner(true)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">{t('wl.addPartner')}</button>
            </div>
            {partners.length === 0 ? (
              <p className="text-warm-500 text-sm">{t('wl.noPartners')}</p>
            ) : (
              <div className="space-y-2">
                {partners.map(p => (
                  <div key={p.id} className="bg-warm-800 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{p.companyName}</p>
                      <p className="text-xs text-warm-400">{p.contactEmail || '-'} &middot; {t('wl.margin')}: {p.marginPercent}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${p.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{p.status}</span>
                      <button onClick={() => handleRemovePartner(p.id)} className="text-xs text-red-400 hover:text-red-300">{t('wl.remove')}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Partner Dialog */}
            {showAddPartner && (
              <div className="bg-warm-800 rounded-lg p-4 space-y-3 border border-warm-600">
                <h4 className="text-sm font-medium">{t('wl.addPartnerTitle')}</h4>
                <input value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder={t('wl.companyPlaceholder')}
                  className="w-full bg-warm-900 border border-warm-600 rounded px-3 py-2 text-sm" />
                <input value={partnerEmail} onChange={e => setPartnerEmail(e.target.value)} placeholder={t('wl.emailPlaceholder')}
                  className="w-full bg-warm-900 border border-warm-600 rounded px-3 py-2 text-sm" />
                <input value={partnerMargin} onChange={e => setPartnerMargin(e.target.value)} placeholder={t('wl.marginPlaceholder')} type="number" min="0" max="100"
                  className="w-full bg-warm-900 border border-warm-600 rounded px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <button onClick={handleAddPartner} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">{t('wl.add')}</button>
                  <button onClick={() => setShowAddPartner(false)} className="px-3 py-1 bg-warm-600 hover:bg-warm-500 rounded text-sm">{t('wl.cancel')}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Usage Tab */}
        {tab === 'usage' && usage && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-warm-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{usage.totalTokens.toLocaleString()}</p>
                <p className="text-xs text-warm-400">{t('wl.totalTokens')}</p>
              </div>
              <div className="bg-warm-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{usage.totalActions}</p>
                <p className="text-xs text-warm-400">{t('wl.totalActions')}</p>
              </div>
            </div>
            {usage.actionBreakdown.length > 0 && (
              <div className="bg-warm-800 rounded-lg p-4 space-y-2">
                <h3 className="text-sm font-medium text-warm-300 mb-2">{t('wl.breakdown')}</h3>
                {usage.actionBreakdown.map(b => (
                  <div key={b.action} className="flex justify-between text-sm">
                    <span className="text-warm-300">{b.action}</span>
                    <span className="text-warm-400">{b.tokens.toLocaleString()} tokens ({b.count}x)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    );
  }

  // -- List View --
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('wl.title')}</h1>
          <p className="text-warm-400 text-sm mt-1">{t('wl.description')}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">{t('wl.create')}</button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Create Dialog */}
      {showCreate && (
        <div className="bg-warm-800 rounded-lg p-4 space-y-3 border border-warm-600">
          <h3 className="text-lg font-medium">{t('wl.createTitle')}</h3>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={t('wl.namePlaceholder')}
            className="w-full bg-warm-900 border border-warm-600 rounded px-3 py-2 text-sm" />
          <input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder={t('wl.slugPlaceholder')}
            className="w-full bg-warm-900 border border-warm-600 rounded px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:opacity-50">
              {creating ? t('wl.creating') : t('wl.create')}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1 bg-warm-600 hover:bg-warm-500 rounded text-sm">{t('wl.cancel')}</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-warm-400 text-center py-8">{t('wl.loading')}</p>
      ) : tenants.length === 0 ? (
        <div className="text-center py-12 text-warm-500">
          <p className="text-lg">{t('wl.empty')}</p>
          <p className="text-sm mt-1">{t('wl.emptyHint')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tenants.map(tenant => (
            <div key={tenant.id} onClick={() => openDetail(tenant.id)}
              className="bg-warm-800 rounded-lg p-4 cursor-pointer hover:bg-warm-750 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {tenant.primaryColor && <div className="w-4 h-4 rounded" style={{ backgroundColor: tenant.primaryColor }} />}
                  <div>
                    <h3 className="font-medium">{tenant.name}</h3>
                    <p className="text-xs text-warm-400">{tenant.slug}{tenant.customDomain ? ` / ${tenant.customDomain}` : ''}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${tenant.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                  {tenant.isActive ? t('wl.active') : t('wl.inactive')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
