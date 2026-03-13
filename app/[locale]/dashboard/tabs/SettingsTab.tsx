'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, type MerchantInfo } from '@/lib/api';
import { CopyButton } from '@/components/CopyButton';
import { validateEmail, validateWebhookUrl, validateLength } from '@/lib/validation';
import { useToast } from '@/contexts/ToastContext';
import { currencyLabel, SUPPORTED_CURRENCIES } from '@/lib/currency';

interface SettingsTabProps {
  merchant: MerchantInfo;
  displayCurrency: string;
  setDisplayCurrency: (c: string) => void;
  reloadMerchant: () => Promise<void>;
}

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

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">{t('title')}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', padding: '0 16px', marginBottom: -8, lineHeight: 1.5 }}>
        {t('subtitle')}
      </div>
      <div className="panel-body">
        {/* 1. Store Name */}
        <div className="section-title">{t('storeName')}</div>
        {editingName ? (
          <div className="form-group" style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={t('storeNamePlaceholder')} className="input" style={{ flex: 1 }} />
            <button onClick={saveName} className="btn btn-small">{tc('save')}</button>
            {editName && <button onClick={() => { setEditName(merchant.name || ''); setEditingName(false); }} className="btn btn-small btn-cancel">{tc('cancel')}</button>}
          </div>
        ) : (
          <div className="stat-row">
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cp-text)' }}>{editName}</span>
            <button onClick={() => setEditingName(true)} className="btn btn-small">{tc('edit')}</button>
          </div>
        )}

        <div className="divider" />

        {/* 2. Display Currency */}
        <div className="section-title">{t('displayCurrency')}</div>
        <select
          value={displayCurrency}
          onChange={(e) => { const c = e.target.value; setDisplayCurrency(c); localStorage.setItem('cp_currency', c); }}
          className="input"
          style={{ width: '100%', fontSize: 11, padding: '8px 12px', cursor: 'pointer' }}
        >
          {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{currencyLabel(c)}</option>)}
        </select>
        <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 6, lineHeight: 1.5 }}>
          {t('displayCurrencyHelp')}
        </div>

        <div className="divider" />

        {/* 3. Recovery Email */}
        <div className="section-title">{t('recoveryEmail')}</div>
        {merchant.recovery_email_preview && !editingEmail ? (
          <>
            <div className="stat-row">
              <span style={{ fontSize: 11, color: 'var(--cp-green)' }}>{merchant.recovery_email_preview}</span>
              <span className="status-badge status-confirmed" style={{ fontSize: 8 }}>{tc('set')}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => setEditingEmail(true)} className="btn btn-small">{t('emailChange')}</button>
              <button onClick={removeEmail} className="btn btn-small" style={{ background: 'transparent', border: '1px solid var(--cp-red, #e55)', color: 'var(--cp-red, #e55)' }}>{t('emailRemove')}</button>
            </div>
          </>
        ) : (
          <>
            <div className="form-group" style={{ display: 'flex', gap: 8 }}>
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder={t('emailPlaceholder')} className="input" style={{ flex: 1 }} />
              <button onClick={saveEmail} className="btn btn-small">{tc('save')}</button>
              {editingEmail && (
                <button onClick={() => { setEditingEmail(false); setEditEmail(''); }} className="btn btn-small" style={{ background: 'transparent', border: '1px solid var(--cp-text-dim)', color: 'var(--cp-text-dim)' }}>{tc('cancel')}</button>
              )}
            </div>
            <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 6, lineHeight: 1.5 }}>
              {editingEmail ? t('emailChangeHelp') : t('emailAddHelp')}
            </div>
          </>
        )}

        <div className="divider" />

        {/* 4. Derived Payment Address */}
        <div className="section-title">{t('derivedAddress')}</div>
        <div className="stat-row">
          <span style={{ fontSize: 9, color: 'var(--cp-text-muted)', wordBreak: 'break-all', maxWidth: '80%', fontFamily: 'monospace' }}>
            {merchant.payment_address}
          </span>
          <CopyButton text={merchant.payment_address} label="" />
        </div>
        <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 6, lineHeight: 1.5 }}>
          {t('derivedAddressHelp')}
        </div>

        <div className="divider" />

        {/* 5. Webhook URL */}
        <div className="section-title">{t('webhookUrl')}</div>
        {editingWebhook ? (
          <div className="form-group" style={{ display: 'flex', gap: 8 }}>
            <input type="url" value={editWebhookUrl} onChange={(e) => setEditWebhookUrl(e.target.value)} placeholder={t('webhookPlaceholder')} className="input" style={{ flex: 1, fontSize: 10 }} />
            <button onClick={saveWebhookUrl} className="btn btn-small">{tc('save')}</button>
            {merchant.webhook_url && <button onClick={() => { setEditWebhookUrl(merchant.webhook_url || ''); setEditingWebhook(false); }} className="btn btn-small btn-cancel">{tc('cancel')}</button>}
          </div>
        ) : (
          <div className="stat-row">
            <span style={{ fontSize: 10, color: 'var(--cp-text-muted)', wordBreak: 'break-all', maxWidth: '80%', fontFamily: 'monospace' }}>
              {editWebhookUrl}
            </span>
            <button onClick={() => setEditingWebhook(true)} className="btn btn-small">{tc('edit')}</button>
          </div>
        )}
        <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 6, lineHeight: 1.5 }}>
          {t('webhookUrlHelp')}
        </div>

        <div className="divider" />

        {/* 6. Webhook Secret */}
        <div className="section-title">{t('webhookSecret')}</div>
        <div className="stat-row">
          <span style={{ fontSize: 10, color: 'var(--cp-text-dim)', fontFamily: 'monospace' }}>
            {merchant.webhook_secret_preview ? `${merchant.webhook_secret_preview.slice(0, 12)}${'•'.repeat(20)}` : t('notGenerated')}
          </span>
          <button onClick={regenWebhookSecret} className="btn btn-small">{t('regenerate')}</button>
        </div>
        <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 6, lineHeight: 1.5 }}>
          {t('webhookSecretHelp')}
        </div>

        <div className="divider" />

        {/* 7. API Keys */}
        <div className="section-title">{t('apiKeys')}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={regenApiKey} className="btn" style={{ flex: 1 }}>{t('regenApiKey')}</button>
          <button onClick={regenDashToken} className="btn" style={{ flex: 1 }}>{t('regenDashToken')}</button>
        </div>
        <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 6, lineHeight: 1.5 }}>
          {t('apiKeysHelp')}
        </div>

        {revealedKey && (
          <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-cyan)', borderRadius: 4, padding: 12, marginTop: 8 }}>
            <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-cyan)', marginBottom: 6 }}>
              {t('newKeyTitle', { type: revealedKey.type.toUpperCase() })}
            </div>
            <div style={{ fontSize: 10, color: 'var(--cp-text)', wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: 8 }}>
              {revealedKey.value}
            </div>
            <CopyButton text={revealedKey.value} label={t('copyLabel')} />
          </div>
        )}

        {/* 8. Danger Zone */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: '#ef4444', fontWeight: 600, marginBottom: 12 }}>{t('dangerZone')}</div>
          <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginBottom: 12, lineHeight: 1.5 }}>
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
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
          >
            {t('deleteAccount')}
          </button>
        </div>
      </div>
    </div>
  );
});
