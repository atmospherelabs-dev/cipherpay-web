'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { api, type MerchantInfo, type PasskeyInfo, type ApiKeySummary, type ApiKeyType } from '@/lib/api';
import { CopyButton } from '@/components/CopyButton';
import { Spinner } from '@/components/Spinner';
import { validateEmail, validateWebhookUrl, validateLength } from '@/lib/validation';
import { useToast } from '@/contexts/ToastContext';
import { currencyLabel, SUPPORTED_CURRENCIES } from '@/lib/currency';
import { supportsWebAuthn, bufferToBase64url, base64urlToBuffer } from '@/contexts/AuthContext';

interface SettingsTabProps {
  merchant: MerchantInfo;
  displayCurrency: string;
  setDisplayCurrency: (c: string) => void;
  reloadMerchant: () => Promise<void>;
}

const SECTIONS = ['general', 'security', 'developer', 'integrations', 'danger'] as const;
type Section = typeof SECTIONS[number];

export const SettingsTab = memo(function SettingsTab({
  merchant, displayCurrency, setDisplayCurrency, reloadMerchant,
}: SettingsTabProps) {
  const { showToast } = useToast();
  const t = useTranslations('dashboard.settings');
  const tc = useTranslations('common');

  const [editingName, setEditingName] = useState(!merchant.name);
  const [editName, setEditName] = useState(merchant.name || '');
  const [editingWebhook, setEditingWebhook] = useState(!merchant.webhook_url);
  const [editWebhookUrl, setEditWebhookUrl] = useState(merchant.webhook_url || '');
  const [editEmail, setEditEmail] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [revealedKey, setRevealedKey] = useState<{ type: string; value: string } | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('general');

  const saveName = async () => {
    const err = validateLength(editName, 100, t('storeName'));
    if (err) { showToast(err, true); return; }
    try {
      await api.updateMe({ name: editName });
      setEditingName(false);
      showToast(t('toastNameUpdated'));
      await reloadMerchant();
    } catch { showToast(t('toastFailedName'), true); }
  };

  const saveWebhookUrl = async () => {
    if (editWebhookUrl) {
      const err = validateWebhookUrl(editWebhookUrl);
      if (err) { showToast(err, true); return; }
    }
    try {
      await api.updateMe({ webhook_url: editWebhookUrl || '' });
      setEditingWebhook(!editWebhookUrl);
      showToast(editWebhookUrl ? t('toastWebhookSaved') : t('toastWebhookRemoved'));
      await reloadMerchant();
    } catch { showToast(t('toastFailedWebhook'), true); }
  };

  const saveEmail = async () => {
    const emailErr = validateEmail(editEmail);
    if (emailErr) { showToast(emailErr, true); return; }
    try {
      await api.updateMe({ recovery_email: editEmail });
      showToast(t('toastEmailSaved'));
      setEditEmail('');
      setEditingEmail(false);
      await reloadMerchant();
    } catch { showToast(t('toastFailedEmail'), true); }
  };

  const removeEmail = async () => {
    if (!confirm(t('confirmRemoveEmail'))) return;
    try {
      await api.updateMe({ recovery_email: '' });
      showToast(t('toastEmailRemoved'));
      setEditEmail('');
      setEditingEmail(false);
      await reloadMerchant();
    } catch { showToast(t('toastFailedRemoveEmail'), true); }
  };

  const regenApiKey = async () => {
    if (!confirm(t('confirmRegenApiKey'))) return;
    try {
      const resp = await api.regenerateApiKey();
      setRevealedKey({ type: 'API Key', value: resp.api_key });
      showToast(t('toastApiKeyRegen'));
    } catch { showToast(t('toastFailedRegen'), true); }
  };

  const regenDashToken = async () => {
    if (!confirm(t('confirmRegenDashToken'))) return;
    try {
      const resp = await api.regenerateDashboardToken();
      setRevealedKey({ type: 'Dashboard Token', value: resp.dashboard_token });
      showToast(t('toastDashTokenRegen'));
    } catch { showToast(t('toastFailedRegen'), true); }
  };

  const regenWebhookSecret = async () => {
    if (!confirm(t('confirmRegenWebhook'))) return;
    try {
      const resp = await api.regenerateWebhookSecret();
      setRevealedKey({ type: 'Webhook Secret', value: resp.webhook_secret });
      showToast(t('toastWebhookSecretRegen'));
    } catch { showToast(t('toastFailedRegen'), true); }
  };

  const scrollToSection = (section: Section) => {
    setActiveSection(section);
    const el = document.getElementById(`settings-${section}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sectionLabels: Record<Section, string> = {
    general: t('sectionGeneral'),
    security: t('sectionSecurity'),
    developer: t('sectionDeveloper'),
    integrations: t('sectionIntegrations'),
    danger: t('sectionDanger'),
  };

  return (
    <div className="settings-layout">
      {/* Section Nav */}
      <nav className="settings-nav">
        {SECTIONS.map(s => (
          <button
            key={s}
            className={`settings-nav-item${activeSection === s ? ' active' : ''}${s === 'danger' ? ' danger' : ''}`}
            onClick={() => scrollToSection(s)}
          >
            {sectionLabels[s]}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="settings-content">
        {/* GENERAL */}
        <section id="settings-general" className="settings-section">
          <h3 className="settings-section-title">{t('sectionGeneral')}</h3>

          {/* Store Name */}
          <div className="settings-card">
            <div className="settings-card-label">{t('storeName')}</div>
            {editingName ? (
              <div className="settings-field-row">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={t('storeNamePlaceholder')} className="input" style={{ flex: 1, minWidth: 0 }} />
                <button onClick={saveName} className="btn btn-small">{tc('save')}</button>
                {editName && <button onClick={() => { setEditName(merchant.name || ''); setEditingName(false); }} className="btn btn-small btn-cancel">{tc('cancel')}</button>}
              </div>
            ) : (
              <div className="settings-field-row">
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cp-text)' }}>{editName}</span>
                <button onClick={() => setEditingName(true)} className="btn btn-small">{tc('edit')}</button>
              </div>
            )}
          </div>

          {/* Display Currency */}
          <div className="settings-card">
            <div className="settings-card-label">{t('displayCurrency')}</div>
            <select
              value={displayCurrency}
              onChange={(e) => { const c = e.target.value; setDisplayCurrency(c); localStorage.setItem('cp_currency', c); }}
              className="input"
              style={{ width: '100%', fontSize: 11, padding: '8px 12px', cursor: 'pointer' }}
            >
              {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{currencyLabel(c)}</option>)}
            </select>
            <div className="settings-help">{t('displayCurrencyHelp')}</div>
          </div>

          {/* Recovery Email */}
          <div className="settings-card">
            <div className="settings-card-label">{t('recoveryEmail')}</div>
            {merchant.recovery_email_preview && !editingEmail ? (
              <>
                <div className="settings-field-row">
                  <span style={{ fontSize: 11, color: 'var(--cp-green)' }}>{merchant.recovery_email_preview}</span>
                  <span className="status-badge status-confirmed" style={{ fontSize: 9 }}>{tc('set')}</span>
                </div>
                <div className="settings-actions">
                  <button onClick={() => setEditingEmail(true)} className="btn btn-small">{t('emailChange')}</button>
                  <button onClick={removeEmail} className="btn btn-small" style={{ background: 'transparent', border: '1px solid var(--cp-red)', color: 'var(--cp-red)' }}>{t('emailRemove')}</button>
                </div>
              </>
            ) : (
              <>
                <div className="settings-field-row">
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder={t('emailPlaceholder')} className="input" style={{ flex: 1, minWidth: 0 }} />
                  <button onClick={saveEmail} className="btn btn-small">{tc('save')}</button>
                  {editingEmail && (
                    <button onClick={() => { setEditingEmail(false); setEditEmail(''); }} className="btn btn-small btn-cancel">{tc('cancel')}</button>
                  )}
                </div>
                <div className="settings-help">
                  {editingEmail ? t('emailChangeHelp') : t('emailAddHelp')}
                </div>
              </>
            )}
          </div>
        </section>

        {/* SECURITY */}
        <section id="settings-security" className="settings-section">
          <h3 className="settings-section-title">{t('sectionSecurity')}</h3>

          {/* Passkeys */}
          <div className="settings-card">
            <PasskeySettings merchant={merchant} reloadMerchant={reloadMerchant} />
          </div>

          {/* POS PIN */}
          <div className="settings-card" id="pos-pin-settings">
            <POSPinSettings />
          </div>
        </section>

        {/* DEVELOPER */}
        <section id="settings-developer" className="settings-section">
          <h3 className="settings-section-title">{t('sectionDeveloper')}</h3>

          {/* Payment Address */}
          <div className="settings-card">
            <div className="settings-card-label">{t('derivedAddress')}</div>
            <div className="settings-field-row" style={{ flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 9, color: 'var(--cp-text-muted)', wordBreak: 'break-all', fontFamily: 'monospace', flex: '1 1 0', minWidth: 0 }}>
                {merchant.payment_address}
              </span>
              <CopyButton text={merchant.payment_address} label="" />
            </div>
            <div className="settings-help">{t('derivedAddressHelp')}</div>
          </div>

          {/* Webhook URL */}
          <div className="settings-card">
            <div className="settings-card-label">{t('webhookUrl')}</div>
            {editingWebhook ? (
              <div className="settings-field-row">
                <input type="url" value={editWebhookUrl} onChange={(e) => setEditWebhookUrl(e.target.value)} placeholder={t('webhookPlaceholder')} className="input" style={{ flex: 1, minWidth: 0, fontSize: 10 }} />
                <button onClick={saveWebhookUrl} className="btn btn-small">{tc('save')}</button>
                {merchant.webhook_url && <button onClick={() => { setEditWebhookUrl(merchant.webhook_url || ''); setEditingWebhook(false); }} className="btn btn-small btn-cancel">{tc('cancel')}</button>}
              </div>
            ) : (
              <div className="settings-field-row" style={{ flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--cp-text-muted)', wordBreak: 'break-all', fontFamily: 'monospace', flex: '1 1 0', minWidth: 0 }}>
                  {editWebhookUrl}
                </span>
                <button onClick={() => setEditingWebhook(true)} className="btn btn-small">{tc('edit')}</button>
              </div>
            )}
            <div className="settings-help">{t('webhookUrlHelp')}</div>
          </div>

          {/* Webhook Secret */}
          <div className="settings-card">
            <div className="settings-card-label">{t('webhookSecret')}</div>
            <div className="settings-field-row">
              <span style={{ fontSize: 10, color: 'var(--cp-text-dim)', fontFamily: 'monospace' }}>
                {merchant.webhook_secret_preview ? `${merchant.webhook_secret_preview.slice(0, 12)}${'•'.repeat(20)}` : t('notGenerated')}
              </span>
              <button onClick={regenWebhookSecret} className="btn btn-small">{t('regenerate')}</button>
            </div>
            <div className="settings-help">{t('webhookSecretHelp')}</div>
          </div>

          {/* Legacy API Keys */}
          <div className="settings-card">
            <div className="settings-card-label">{t('apiKeys')}</div>
            <div className="settings-actions">
              <button onClick={regenApiKey} className="btn" style={{ flex: 1 }}>{t('regenApiKey')}</button>
              <button onClick={regenDashToken} className="btn" style={{ flex: 1 }}>{t('regenDashToken')}</button>
            </div>
            <div className="settings-help">{t('apiKeysHelp')}</div>

            {revealedKey && (
              <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-cyan)', borderRadius: 4, padding: 12, marginTop: 12 }}>
                <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-cyan)', marginBottom: 6 }}>
                  {t('newKeyTitle', { type: revealedKey.type.toUpperCase() })}
                </div>
                <div style={{ fontSize: 10, color: 'var(--cp-text)', wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: 8 }}>
                  {revealedKey.value}
                </div>
                <CopyButton text={revealedKey.value} label={t('copyLabel')} />
              </div>
            )}
          </div>

          {/* Scoped API Keys */}
          <div className="settings-card">
            <ScopedKeysSection />
          </div>
        </section>

        {/* INTEGRATIONS */}
        <section id="settings-integrations" className="settings-section">
          <h3 className="settings-section-title">{t('sectionIntegrations')}</h3>

          <div className="settings-card">
            <LumaSettings merchant={merchant} reloadMerchant={reloadMerchant} />
          </div>
        </section>

        {/* DANGER */}
        <section id="settings-danger" className="settings-section">
          <h3 className="settings-section-title settings-section-title--danger">{t('sectionDanger')}</h3>

          <div className="settings-card settings-card--danger">
            <div className="settings-card-label" style={{ color: 'var(--cp-red)' }}>{t('dangerZone')}</div>
            <div className="settings-help" style={{ marginBottom: 12 }}>
              {t('dangerDesc')}
            </div>
            <button
              onClick={async () => {
                if (!confirm(t('confirmDelete'))) return;
                if (!confirm(t('confirmDelete2'))) return;
                try {
                  await api.deleteAccount();
                  window.location.href = '/';
                } catch (e: unknown) {
                  const msg = e instanceof Error ? e.message : t('toastFailedDelete');
                  showToast(msg, true);
                }
              }}
              className="btn"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--cp-red)' }}
            >
              {t('deleteAccount')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
});

function PasskeySettings({ merchant, reloadMerchant }: { merchant: MerchantInfo; reloadMerchant: () => Promise<void> }) {
  const tp = useTranslations('dashboard.passkeys');
  const { showToast } = useToast();
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [step, setStep] = useState<'idle' | 'confirm' | 'registering'>('idle');
  const [token, setToken] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'add' } | { type: 'delete'; id: string } | null>(null);

  const webauthnOk = typeof window !== 'undefined' && supportsWebAuthn();

  const loadPasskeys = useCallback(async () => {
    try {
      const resp = await api.listPasskeys();
      setPasskeys(resp.passkeys);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadPasskeys(); }, [loadPasskeys]);

  const resetFlow = () => {
    setStep('idle');
    setToken('');
    setTokenError('');
    setConfirmAction(null);
  };

  const startAdd = () => {
    setConfirmAction({ type: 'add' });
    setStep('confirm');
    setToken('');
    setTokenError('');
  };

  const startDelete = (id: string) => {
    setConfirmAction({ type: 'delete', id });
    setStep('confirm');
    setToken('');
    setTokenError('');
  };

  const submitConfirm = async () => {
    if (!token.startsWith('cpay_dash_')) {
      setTokenError(tp('reauthInvalid'));
      return;
    }
    try {
      await api.passkeyReauth({ token });
    } catch {
      setTokenError(tp('reauthFailed'));
      return;
    }

    if (confirmAction?.type === 'add') {
      setStep('registering');
      setAdding(true);
      try {
        const { challenge_id, options } = await api.passkeyRegisterBegin();

        const publicKey: PublicKeyCredentialCreationOptions = {
          challenge: base64urlToBuffer(options.publicKey.challenge),
          rp: options.publicKey.rp,
          user: {
            ...options.publicKey.user,
            id: base64urlToBuffer(options.publicKey.user.id),
          },
          pubKeyCredParams: options.publicKey.pubKeyCredParams,
          timeout: options.publicKey.timeout,
          attestation: options.publicKey.attestation || 'none',
          excludeCredentials: (options.publicKey.excludeCredentials || []).map(
            (c: { id: string; type: string; transports?: string[] }) => ({
              id: base64urlToBuffer(c.id),
              type: c.type,
              transports: c.transports,
            }),
          ),
          authenticatorSelection: options.publicKey.authenticatorSelection,
        };

        const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
        if (!credential) { setAdding(false); resetFlow(); return; }

        const attestResp = credential.response as AuthenticatorAttestationResponse;
        const serialized = {
          id: credential.id,
          rawId: bufferToBase64url(credential.rawId),
          type: credential.type,
          response: {
            attestationObject: bufferToBase64url(attestResp.attestationObject),
            clientDataJSON: bufferToBase64url(attestResp.clientDataJSON),
          },
        };

        await api.passkeyRegisterComplete({ challenge_id, credential: serialized });
        showToast(tp('added'));
        await loadPasskeys();
        await reloadMerchant();
      } catch {
        showToast(tp('addFailed'), true);
      }
      setAdding(false);
      resetFlow();

    } else if (confirmAction?.type === 'delete') {
      setDeletingId(confirmAction.id);
      try {
        await api.deletePasskey(confirmAction.id);
        showToast(tp('removed'));
        await loadPasskeys();
        await reloadMerchant();
      } catch {
        showToast(tp('removeFailed'), true);
      }
      setDeletingId(null);
      resetFlow();
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return iso; }
  };

  if (!webauthnOk) return null;

  return (
    <div>
      <div className="settings-card-label">{tp('title')}</div>
      <div className="settings-help" style={{ marginBottom: 12 }}>
        {tp('description')}
      </div>

      {loading ? (
        <div style={{ padding: 16, textAlign: 'center' }}><Spinner /></div>
      ) : (
        <>
          {passkeys.map((pk) => (
            <div key={pk.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--cp-text)' }}>
                  {pk.label || tp('defaultLabel')}
                </div>
                <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 2 }}>
                  {tp('addedOn', { date: formatDate(pk.created_at) })}
                  {pk.last_used_at && ` · ${tp('lastUsed', { date: formatDate(pk.last_used_at) })}`}
                </div>
              </div>
              <button
                onClick={() => startDelete(pk.id)}
                disabled={deletingId === pk.id || step !== 'idle'}
                className="btn btn-small"
                style={{ color: 'var(--cp-red)', borderColor: 'rgba(239,68,68,0.3)', fontSize: 9 }}
              >
                {deletingId === pk.id ? <Spinner size={10} /> : tp('remove')}
              </button>
            </div>
          ))}

          {step === 'confirm' && (
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid var(--cp-border)',
              borderRadius: 4, padding: 14, marginTop: 12,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cp-text)', marginBottom: 6 }}>
                {confirmAction?.type === 'add' ? tp('confirmAddTitle') : tp('confirmRemoveTitle')}
              </div>
              <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginBottom: 10 }}>
                {tp('reauthDesc')}
              </div>
              <div className="settings-field-row">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => { setToken(e.target.value); setTokenError(''); }}
                  placeholder="cpay_dash_..."
                  className="input"
                  style={{ flex: 1, fontSize: 10 }}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitConfirm(); }}
                  autoFocus
                />
                <button onClick={submitConfirm} className="btn btn-small">
                  {tp('reauthSubmit')}
                </button>
                <button onClick={resetFlow} className="btn btn-small btn-cancel">
                  {tp('cancel')}
                </button>
              </div>
              {tokenError && (
                <div style={{ color: 'var(--cp-red)', fontSize: 9, marginTop: 6 }}>{tokenError}</div>
              )}
            </div>
          )}

          {step === 'registering' && (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 11 }}>
              <Spinner /> <span style={{ marginInlineStart: 8 }}>{tp('waitingBrowser')}</span>
            </div>
          )}

          {step === 'idle' && (
            <button
              onClick={startAdd}
              disabled={adding}
              className="btn"
              style={{ marginTop: passkeys.length > 0 ? 12 : 0 }}
            >
              {tp('addPasskey')}
            </button>
          )}
        </>
      )}

      {merchant.last_token_login_at && (
        <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 12 }}>
          {tp('lastTokenLogin', { date: formatDate(merchant.last_token_login_at) })}
        </div>
      )}
    </div>
  );
}

function ScopedKeysSection() {
  const t = useTranslations('dashboard.settings');
  const { showToast } = useToast();
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<ApiKeyType>('restricted');
  const [revealed, setRevealed] = useState<{ key: string; label: string; type: ApiKeyType } | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const resp = await api.listApiKeys();
      setKeys(resp.keys);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return iso; }
  };

  const submitCreate = async () => {
    const label = newLabel.trim();
    if (!label) { showToast(t('scopedKeysToastLabelRequired'), true); return; }
    setCreating(true);
    try {
      const resp = await api.createApiKey({ type: newType, label });
      setRevealed({ key: resp.key, label: resp.label, type: resp.key_type });
      setNewLabel('');
      setShowCreate(false);
      showToast(t('scopedKeysToastCreated'));
      await load();
    } catch {
      showToast(t('scopedKeysToastFailed'), true);
    }
    setCreating(false);
  };

  const submitRevoke = async (id: string) => {
    if (!confirm(t('scopedKeysConfirmRevoke'))) return;
    setRevoking(id);
    try {
      await api.revokeApiKey(id);
      showToast(t('scopedKeysToastRevoked'));
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('scopedKeysToastRevokeFailed');
      showToast(msg, true);
    }
    setRevoking(null);
  };

  return (
    <div>
      <div className="settings-card-label">{t('scopedKeys')}</div>
      <div className="settings-help" style={{ marginBottom: 12 }}>
        {t('scopedKeysHelp')}
      </div>

      {loading ? (
        <div style={{ padding: 16, textAlign: 'center' }}><Spinner /></div>
      ) : (
        <>
          {keys.length === 0 && !showCreate && (
            <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', padding: '8px 0' }}>
              {t('scopedKeysEmpty')}
            </div>
          )}

          {keys.map((k) => {
            const isRestricted = k.key_type === 'restricted';
            return (
              <div key={k.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--cp-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {k.label}
                    </span>
                    <span style={{
                      fontSize: 8, fontWeight: 600, letterSpacing: 0.5,
                      color: isRestricted ? 'var(--cp-warm)' : 'var(--cp-cyan)',
                      background: isRestricted ? 'rgba(232,196,141,0.1)' : 'rgba(86,212,200,0.1)',
                      padding: '1px 6px', borderRadius: 3, flexShrink: 0,
                    }}>
                      {isRestricted ? t('scopedKeysTypeBadgeRestricted') : t('scopedKeysTypeBadgeFull')}
                    </span>
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', fontFamily: 'monospace' }}>
                    {k.key_prefix}...
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 2 }}>
                    {t('scopedKeysCreated', { date: formatDate(k.created_at) || '' })}
                    {' · '}
                    {k.last_used_at
                      ? t('scopedKeysLastUsed', { date: formatDate(k.last_used_at) || '' })
                      : t('scopedKeysNeverUsed')}
                  </div>
                </div>
                <button
                  onClick={() => submitRevoke(k.id)}
                  disabled={revoking === k.id}
                  className="btn btn-small"
                  style={{ color: 'var(--cp-red)', borderColor: 'rgba(239,68,68,0.3)', fontSize: 9, flexShrink: 0 }}
                >
                  {revoking === k.id ? <Spinner size={10} /> : t('scopedKeysRevoke')}
                </button>
              </div>
            );
          })}

          {revealed && (
            <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-cyan)', borderRadius: 4, padding: 12, marginTop: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-cyan)', marginBottom: 6 }}>
                {t('newKeyTitle', { type: (revealed.type === 'restricted' ? t('scopedKeysTypeBadgeRestricted') : t('scopedKeysTypeBadgeFull')) + ' KEY' })}
              </div>
              <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginBottom: 6 }}>
                {revealed.label}
              </div>
              <div style={{ fontSize: 10, color: 'var(--cp-text)', wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: 8 }}>
                {revealed.key}
              </div>
              <CopyButton text={revealed.key} label={t('copyLabel')} />
            </div>
          )}

          {showCreate ? (
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid var(--cp-border)',
              borderRadius: 4, padding: 14, marginTop: 12,
            }}>
              <div className="settings-field-row" style={{ marginBottom: 8 }}>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder={t('scopedKeysLabelPlaceholder')}
                  className="input"
                  style={{ flex: 1, fontSize: 11 }}
                  maxLength={100}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') submitCreate(); }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--cp-text-muted)', cursor: 'pointer' }}>
                  <input type="radio" checked={newType === 'restricted'} onChange={() => setNewType('restricted')} />
                  {t('scopedKeysTypeRestricted')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--cp-text-muted)', cursor: 'pointer' }}>
                  <input type="radio" checked={newType === 'full'} onChange={() => setNewType('full')} />
                  {t('scopedKeysTypeFull')}
                </label>
              </div>
              <div className="settings-actions">
                <button onClick={submitCreate} disabled={creating} className="btn btn-small">
                  {creating ? <Spinner size={10} /> : t('scopedKeysCreateConfirm')}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setNewLabel(''); }}
                  className="btn btn-small btn-cancel"
                >
                  {t('scopedKeysCreateCancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setShowCreate(true); setRevealed(null); }}
              className="btn"
              style={{ marginTop: 12 }}
            >
              {t('scopedKeysCreate')}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function POSPinSettings() {
  const tp = useTranslations('pos.settings');
  const { showToast } = useToast();
  const [hasPin, setHasPin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.hasPosPin()
      .then(r => setHasPin(r.has_pin))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      showToast(tp('tooShort'), true);
      return;
    }
    if (newPin !== confirmPin) {
      showToast(tp('mismatch'), true);
      return;
    }
    setSaving(true);
    try {
      await api.setPosPin(newPin);
      setHasPin(true);
      setEditing(false);
      setNewPin('');
      setConfirmPin('');
      showToast(tp('saved'));
    } catch {
      showToast(tp('failed'), true);
    }
    setSaving(false);
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await api.removePosPin();
      setHasPin(false);
      showToast(tp('removed'));
    } catch {
      showToast(tp('failed'), true);
    }
    setSaving(false);
  };

  if (!loaded) return null;

  return (
    <div>
      <div className="settings-card-label" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>{tp('title')}</span>
        <span className={`status-badge ${hasPin ? 'status-confirmed' : 'status-pending'}`} style={{ fontSize: 8 }}>
          {hasPin ? tp('currentPin') : tp('noPin')}
        </span>
      </div>
      <div className="settings-help" style={{ marginBottom: 12 }}>
        {tp('description')}
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 300 }}>
          <label style={{ fontSize: 10, color: 'var(--cp-text-muted)' }}>{tp('newPinLabel')}</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="input"
            style={{ fontSize: 18, letterSpacing: 12, textAlign: 'center', maxWidth: 160 }}
            autoFocus
          />
          <label style={{ fontSize: 10, color: 'var(--cp-text-muted)' }}>{tp('confirmLabel')}</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="input"
            style={{ fontSize: 18, letterSpacing: 12, textAlign: 'center', maxWidth: 160 }}
          />
          <div className="settings-actions" style={{ marginTop: 4 }}>
            <button className="btn btn-small" disabled={saving} onClick={handleSave}>
              {saving ? tp('saving') : tp('save')}
            </button>
            <button className="btn btn-small btn-cancel" onClick={() => { setEditing(false); setNewPin(''); setConfirmPin(''); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="settings-actions">
          <button className="btn btn-small" onClick={() => setEditing(true)}>
            {hasPin ? tp('changePin') : tp('setPin')}
          </button>
          {hasPin && (
            <button
              className="btn btn-small"
              style={{ color: 'var(--cp-red)', borderColor: 'rgba(239,68,68,0.3)' }}
              onClick={handleRemove}
              disabled={saving}
            >
              {tp('removePin')}
            </button>
          )}
          <a
            href="/pos"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-small"
            style={{ color: 'var(--cp-cyan)', borderColor: 'rgba(0,212,255,0.3)' }}
          >
            {tp('openPos')} ↗
          </a>
        </div>
      )}
    </div>
  );
}

function LumaSettings({ merchant, reloadMerchant }: { merchant: MerchantInfo; reloadMerchant: () => Promise<void> }) {
  const tl = useTranslations('dashboard.luma');
  const { showToast } = useToast();
  const [lumaKey, setLumaKey] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <div>
      <div className="settings-card-label" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>{tl('title')}</span>
        <span style={{
          fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
          color: merchant.has_luma_key ? 'var(--cp-green)' : 'var(--cp-text-dim)',
          background: merchant.has_luma_key ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
          padding: '2px 7px', borderRadius: 3,
        }}>
          {merchant.has_luma_key ? tl('connected') : tl('notConfigured')}
        </span>
      </div>
      <div className="form-group" style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginBottom: 4, display: 'block' }}>{tl('apiKeyLabel')}</label>
        <div className="settings-field-row">
          <input
            type="password"
            value={lumaKey}
            onChange={(e) => setLumaKey(e.target.value)}
            placeholder={merchant.has_luma_key ? '••••••••••••••••' : tl('apiKeyPlaceholder')}
            className="input"
            style={{ fontSize: 10, flex: 1, minWidth: 0 }}
          />
          <button
            className="btn btn-small"
            disabled={saving || !lumaKey.trim()}
            style={{ opacity: saving || !lumaKey.trim() ? 0.5 : 1 }}
            onClick={async () => {
              setSaving(true);
              try {
                await api.updateMe({ luma_api_key: lumaKey.trim() });
                showToast(tl('toastKeySaved'));
                setLumaKey('');
                await reloadMerchant();
              } catch {
                showToast(tl('toastKeyFailed'), true);
              }
              setSaving(false);
            }}
          >
            {saving ? tl('savingKey') : tl('saveKey')}
          </button>
          {merchant.has_luma_key && (
            <button
              className="btn btn-small"
              style={{ color: 'var(--cp-red)', borderColor: 'rgba(239,68,68,0.3)' }}
              onClick={async () => {
                try {
                  await api.updateMe({ luma_api_key: '' });
                  showToast(tl('toastKeyRemoved'));
                  await reloadMerchant();
                } catch {
                  showToast(tl('toastKeyFailed'), true);
                }
              }}
            >
              {tl('removeKey')}
            </button>
          )}
        </div>
      </div>
      <div className="settings-help">{tl('apiKeyHelp')}</div>
    </div>
  );
}
