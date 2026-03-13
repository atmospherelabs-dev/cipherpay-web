'use client';

import { useState } from 'react';
import { api, type RegisterResponse } from '@/lib/api';
import { validateEmail, validateWebhookUrl, validateLength } from '@/lib/validation';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CopyButton } from '@/components/CopyButton';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const [name, setName] = useState('');
  const [ufvk, setUfvk] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RegisterResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (name) {
      const nameErr = validateLength(name, 100, 'Store name');
      if (nameErr) { setError(nameErr); setLoading(false); return; }
    }
    const ufvkLen = validateLength(ufvk, 2000, 'UFVK');
    if (ufvkLen) { setError(ufvkLen); setLoading(false); return; }
    if (!ufvk.startsWith('uview') && !ufvk.startsWith('utest')) {
      setError(t('ufvkError'));
      setLoading(false);
      return;
    }
    if (webhookUrl) {
      const urlErr = validateWebhookUrl(webhookUrl);
      if (urlErr) { setError(`Webhook URL: ${urlErr}`); setLoading(false); return; }
    }
    if (email) {
      const emailErr = validateEmail(email);
      if (emailErr) { setError(`Email: ${emailErr}`); setLoading(false); return; }
    }

    try {
      const res = await api.register({
        name: name || undefined,
        ufvk,
        webhook_url: webhookUrl || undefined,
        email: email || undefined,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registrationFailed'));
    }
    setLoading(false);
  };

  if (result) {
    return (
      <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6, display: 'flex', flexDirection: 'column' }}>
        <header className="site-header">
          <Link href="/"><Logo size="sm" /></Link>
          <ThemeToggle />
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
          <div style={{ maxWidth: 500, width: '100%' }}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{t('successTitle')}</span>
                <span className="status-badge status-confirmed">{t('successBadge')}</span>
              </div>
              <div className="panel-body">
                <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 20 }}>
                  {t('successDesc')}
                </p>

                <CredentialBlock label={t('apiKeyLabel')} value={result.api_key} />
                <p style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: -8, marginBottom: 16, paddingLeft: 2 }}>
                  {t('apiKeyHelp')}
                </p>

                <CredentialBlock label={t('dashTokenLabel')} value={result.dashboard_token} />
                <p style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: -8, marginBottom: 16, paddingLeft: 2 }}>
                  {t('dashTokenHelp')}
                </p>

                <CredentialBlock label={t('webhookSecretLabel')} value={result.webhook_secret} />
                <p style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: -8, marginBottom: 16, paddingLeft: 2 }}>
                  {t('webhookSecretHelp')}
                </p>

                <div style={{ marginTop: 16, padding: 12, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 4 }}>
                  <p style={{ fontSize: 10, color: 'var(--cp-yellow)', fontWeight: 600, letterSpacing: 1 }}>
                    {t('credentialsWarning')}
                  </p>
                </div>

                <Link href="/dashboard/login" className="btn-primary" style={{ width: '100%', marginTop: 16, textAlign: 'center' }}>
                  {t('goToDashboard')}
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6, display: 'flex', flexDirection: 'column' }}>
      <header className="site-header">
        <Link href="/"><Logo size="sm" /></Link>
        <ThemeToggle />
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: 500, width: '100%' }}>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">{t('title')}</span>
            </div>
            <div className="panel-body">
              <div style={{ padding: 12, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 4, marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: 'var(--cp-purple)', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
                  {t('securityTitle')}
                </div>
                <p style={{ fontSize: 10, color: 'var(--cp-text-muted)', lineHeight: 1.6 }}>
                  {t('securityDesc')}
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">{t('nameLabel')} <span style={{ color: 'var(--cp-text-dim)' }}>({t('nameOptional')})</span></label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Store" className="input" />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('ufvkLabel')} <span style={{ color: 'var(--cp-red)' }}>*</span></label>
                  <textarea value={ufvk} onChange={(e) => setUfvk(e.target.value)} placeholder="uview1..." className="input" style={{ resize: 'vertical', minHeight: 70 }} required />
                  <p style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 4 }}>{t('ufvkHelp')}</p>
                </div>

                <div className="divider" />
                <div className="section-title">{t('optionalSection')}</div>

                <div className="form-group">
                  <label className="form-label">{t('webhookLabel')}</label>
                  <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://your-store.com/api/cipherpay-webhook" className="input" />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('emailLabel')}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="input" />
                  <p style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 4 }}>{t('emailHelp')}</p>
                </div>

                {error && (
                  <div style={{ color: 'var(--cp-red)', fontSize: 11, marginBottom: 12 }}>{error}</div>
                )}

                <button type="submit" disabled={loading || !ufvk} className="btn-primary" style={{ width: '100%', opacity: loading || !ufvk ? 0.5 : 1 }}>
                  {loading ? t('submitting') : t('submit')}
                </button>
              </form>

              <div className="divider" />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--cp-text-muted)' }}>
                  {t('hasAccount')}{' '}
                  <Link href="/dashboard/login" style={{ color: 'var(--cp-cyan)', textDecoration: 'none' }}>{t('signIn')}</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function CredentialBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 12, background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-muted)' }}>{label}</span>
        <CopyButton text={value} label="" />
      </div>
      <code style={{ fontSize: 10, wordBreak: 'break-all', display: 'block', color: 'var(--cp-cyan)' }}>{value}</code>
    </div>
  );
}
