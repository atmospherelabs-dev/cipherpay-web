'use client';

import { memo, useState } from 'react';
import { api, type MerchantInfo } from '@/lib/api';
import { CopyButton } from '@/components/CopyButton';
import { validateEmail, validateWebhookUrl, validateLength } from '@/lib/validation';
import { useToast } from '@/contexts/ToastContext';
import { currencyLabel, SUPPORTED_CURRENCIES } from '../utils/currency';

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

  const [editingName, setEditingName] = useState(!merchant.name);
  const [editName, setEditName] = useState(merchant.name || '');
  const [editingWebhook, setEditingWebhook] = useState(!merchant.webhook_url);
  const [editWebhookUrl, setEditWebhookUrl] = useState(merchant.webhook_url || '');
  const [editEmail, setEditEmail] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [revealedKey, setRevealedKey] = useState<{ type: string; value: string } | null>(null);

  const saveName = async () => {
    const err = validateLength(editName, 100, 'Store name');
    if (err) { showToast(err, true); return; }
    try {
      await api.updateMe({ name: editName });
      setEditingName(false);
      showToast('Name updated');
      await reloadMerchant();
    } catch { showToast('Failed to update name', true); }
  };

  const saveWebhookUrl = async () => {
    if (editWebhookUrl) {
      const err = validateWebhookUrl(editWebhookUrl);
      if (err) { showToast(err, true); return; }
    }
    try {
      await api.updateMe({ webhook_url: editWebhookUrl || '' });
      setEditingWebhook(!editWebhookUrl);
      showToast(editWebhookUrl ? 'Webhook URL saved' : 'Webhook URL removed');
      await reloadMerchant();
    } catch { showToast('Failed to update webhook URL', true); }
  };

  const saveEmail = async () => {
    const emailErr = validateEmail(editEmail);
    if (emailErr) { showToast(emailErr, true); return; }
    try {
      await api.updateMe({ recovery_email: editEmail });
      showToast('Recovery email saved');
      setEditEmail('');
      setEditingEmail(false);
      await reloadMerchant();
    } catch { showToast('Failed to save email', true); }
  };

  const removeEmail = async () => {
    if (!confirm('Remove your recovery email? You won\'t be able to recover your account if you lose your dashboard token.')) return;
    try {
      await api.updateMe({ recovery_email: '' });
      showToast('Recovery email removed');
      setEditEmail('');
      setEditingEmail(false);
      await reloadMerchant();
    } catch { showToast('Failed to remove email', true); }
  };

  const regenApiKey = async () => {
    if (!confirm('Regenerate your API key? The current key will stop working immediately. Any integrations using it will break.')) return;
    try {
      const resp = await api.regenerateApiKey();
      setRevealedKey({ type: 'API Key', value: resp.api_key });
      showToast('API key regenerated. Copy it now — it won\'t be shown again.');
    } catch { showToast('Failed to regenerate', true); }
  };

  const regenDashToken = async () => {
    if (!confirm('Regenerate your dashboard token? You will be logged out of all sessions and need the new token to log back in.')) return;
    try {
      const resp = await api.regenerateDashboardToken();
      setRevealedKey({ type: 'Dashboard Token', value: resp.dashboard_token });
      showToast('Dashboard token regenerated. Copy it now — it won\'t be shown again.');
    } catch { showToast('Failed to regenerate', true); }
  };

  const regenWebhookSecret = async () => {
    if (!confirm('Regenerate your webhook secret? You\'ll need to update the secret in your integrations.')) return;
    try {
      const resp = await api.regenerateWebhookSecret();
      setRevealedKey({ type: 'Webhook Secret', value: resp.webhook_secret });
      showToast('Webhook secret regenerated');
    } catch { showToast('Failed to regenerate', true); }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Settings</span>
      </div>
      <div className="panel-body">
        {/* 1. Store Name */}
        <div className="section-title">Store Name</div>
        {editingName ? (
          <div className="form-group" style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="My Store" className="input" style={{ flex: 1 }} />
            <button onClick={saveName} className="btn btn-small">SAVE</button>
            {editName && <button onClick={() => { setEditName(merchant.name || ''); setEditingName(false); }} className="btn btn-small btn-cancel">CANCEL</button>}
          </div>
        ) : (
          <div className="stat-row">
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cp-text)' }}>{editName}</span>
            <button onClick={() => setEditingName(true)} className="btn btn-small">EDIT</button>
          </div>
        )}

        <div className="divider" />

        {/* 2. Display Currency */}
        <div className="section-title">Display Currency</div>
        <select
          value={displayCurrency}
          onChange={(e) => { const c = e.target.value; setDisplayCurrency(c); localStorage.setItem('cp_currency', c); }}
          className="input"
          style={{ width: '100%', fontSize: 11, padding: '8px 12px', cursor: 'pointer' }}
        >
          {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{currencyLabel(c)}</option>)}
        </select>
        <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 6, lineHeight: 1.5 }}>
          Controls how fiat amounts and ZEC rates are displayed across the dashboard. Does not affect product prices or invoice amounts.
        </div>

        <div className="divider" />

        {/* 3. Recovery Email */}
        <div className="section-title">Recovery Email</div>
        {merchant.recovery_email_preview && !editingEmail ? (
          <>
            <div className="stat-row">
              <span style={{ fontSize: 11, color: 'var(--cp-green)' }}>{merchant.recovery_email_preview}</span>
              <span className="status-badge status-confirmed" style={{ fontSize: 8 }}>SET</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => setEditingEmail(true)} className="btn btn-small">CHANGE</button>
              <button onClick={removeEmail} className="btn btn-small" style={{ background: 'transparent', border: '1px solid var(--cp-red, #e55)', color: 'var(--cp-red, #e55)' }}>REMOVE</button>
            </div>
          </>
        ) : (
          <>
            <div className="form-group" style={{ display: 'flex', gap: 8 }}>
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="your@email.com" className="input" style={{ flex: 1 }} />
              <button onClick={saveEmail} className="btn btn-small">SAVE</button>
              {editingEmail && (
                <button onClick={() => { setEditingEmail(false); setEditEmail(''); }} className="btn btn-small" style={{ background: 'transparent', border: '1px solid var(--cp-text-dim)', color: 'var(--cp-text-dim)' }}>CANCEL</button>
              )}
            </div>
            <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 6, lineHeight: 1.5 }}>
              {editingEmail ? 'Enter a new email to replace the current one.' : 'Add an email to recover your account if you lose your dashboard token.'}
            </div>
          </>
        )}

        <div className="divider" />

        {/* 4. Derived Payment Address */}
        <div className="section-title">Derived Address</div>
        <div className="stat-row">
          <span style={{ fontSize: 9, color: 'var(--cp-text-muted)', wordBreak: 'break-all', maxWidth: '80%', fontFamily: 'monospace' }}>
            {merchant.payment_address}
          </span>
          <CopyButton text={merchant.payment_address} label="" />
        </div>
        <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 6, lineHeight: 1.5 }}>
          Auto-derived from your UFVK. Each invoice gets its own unique payment address for privacy and reliable detection.
        </div>

        <div className="divider" />

        {/* 5. Webhook URL */}
        <div className="section-title">Webhook URL</div>
        {editingWebhook ? (
          <div className="form-group" style={{ display: 'flex', gap: 8 }}>
            <input type="url" value={editWebhookUrl} onChange={(e) => setEditWebhookUrl(e.target.value)} placeholder="https://your-store.com/api/webhook" className="input" style={{ flex: 1, fontSize: 10 }} />
            <button onClick={saveWebhookUrl} className="btn btn-small">SAVE</button>
            {merchant.webhook_url && <button onClick={() => { setEditWebhookUrl(merchant.webhook_url || ''); setEditingWebhook(false); }} className="btn btn-small btn-cancel">CANCEL</button>}
          </div>
        ) : (
          <div className="stat-row">
            <span style={{ fontSize: 10, color: 'var(--cp-text-muted)', wordBreak: 'break-all', maxWidth: '80%', fontFamily: 'monospace' }}>
              {editWebhookUrl}
            </span>
            <button onClick={() => setEditingWebhook(true)} className="btn btn-small">EDIT</button>
          </div>
        )}
        <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 6, lineHeight: 1.5 }}>
          CipherPay will POST invoice events (confirmed, expired) to this URL.
        </div>

        <div className="divider" />

        {/* 6. Webhook Secret */}
        <div className="section-title">Webhook Secret</div>
        <div className="stat-row">
          <span style={{ fontSize: 10, color: 'var(--cp-text-dim)', fontFamily: 'monospace' }}>
            {merchant.webhook_secret_preview ? `${merchant.webhook_secret_preview.slice(0, 12)}${'•'.repeat(20)}` : 'Not generated'}
          </span>
          <button onClick={regenWebhookSecret} className="btn btn-small">REGENERATE</button>
        </div>
        <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 6, lineHeight: 1.5 }}>
          The full secret is only shown once when generated. Copy it immediately — it cannot be retrieved later.
        </div>

        <div className="divider" />

        {/* 7. API Keys */}
        <div className="section-title">API Keys</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={regenApiKey} className="btn" style={{ flex: 1 }}>REGENERATE API KEY</button>
          <button onClick={regenDashToken} className="btn" style={{ flex: 1 }}>REGENERATE DASHBOARD TOKEN</button>
        </div>
        <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 6, lineHeight: 1.5 }}>
          Keys are shown once when generated. Regenerating invalidates the old key immediately.
        </div>

        {revealedKey && (
          <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-cyan)', borderRadius: 4, padding: 12, marginTop: 8 }}>
            <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-cyan)', marginBottom: 6 }}>
              NEW {revealedKey.type.toUpperCase()} — COPY NOW
            </div>
            <div style={{ fontSize: 10, color: 'var(--cp-text)', wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: 8 }}>
              {revealedKey.value}
            </div>
            <CopyButton text={revealedKey.value} label="Copy" />
          </div>
        )}

        {/* 8. Danger Zone */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: '#ef4444', fontWeight: 600, marginBottom: 12 }}>DANGER ZONE</div>
          <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginBottom: 12, lineHeight: 1.5 }}>
            Permanently delete your account, products, and all data. This cannot be undone.
            You must settle any outstanding billing balance before deleting.
          </div>
          <button
            onClick={async () => {
              if (!confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) return;
              if (!confirm('This will delete ALL your products, invoices, and billing data. Type OK to confirm.')) return;
              try {
                await api.deleteAccount();
                window.location.href = '/';
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to delete account';
                showToast(msg, true);
              }
            }}
            className="btn"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
          >
            DELETE ACCOUNT
          </button>
        </div>
      </div>
    </div>
  );
});
