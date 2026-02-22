'use client';

import { useState } from 'react';
import { api, type RegisterResponse } from '@/lib/api';
import { validateEmail, validateWebhookUrl, validateLength } from '@/lib/validation';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CopyButton } from '@/components/CopyButton';
import Link from 'next/link';

export default function RegisterPage() {
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
      setError('UFVK must start with "uview" (mainnet) or "utest" (testnet)');
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
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
    setLoading(false);
  };

  if (result) {
    return (
      <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6, display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
          <Link href="/"><Logo size="sm" /></Link>
          <ThemeToggle />
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
          <div style={{ maxWidth: 500, width: '100%' }}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Merchant Created</span>
                <span className="status-badge status-confirmed">SUCCESS</span>
              </div>
              <div className="panel-body">
                <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 20 }}>
                  Save these credentials now. They will not be shown again.
                </p>

                <CredentialBlock label="API KEY (SERVER-SIDE ONLY)" value={result.api_key} />
                <CredentialBlock label="DASHBOARD TOKEN" value={result.dashboard_token} />
                <CredentialBlock label="WEBHOOK SECRET" value={result.webhook_secret} />

                <div style={{ marginTop: 16, padding: 12, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 4 }}>
                  <p style={{ fontSize: 10, color: 'var(--cp-yellow)', fontWeight: 600, letterSpacing: 1 }}>
                    THESE CREDENTIALS ARE SHOWN ONCE. COPY THEM TO A SAFE PLACE.
                  </p>
                </div>

                <Link href="/dashboard/login" className="btn-primary" style={{ width: '100%', marginTop: 16, textDecoration: 'none', textAlign: 'center' }}>
                  GO TO DASHBOARD
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
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <Link href="/"><Logo size="sm" /></Link>
        <ThemeToggle />
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: 500, width: '100%' }}>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Register Merchant</span>
            </div>
            <div className="panel-body">
              <div style={{ padding: 12, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 4, marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: 'var(--cp-purple)', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
                  SECURITY: USE A DEDICATED WALLET
                </div>
                <p style={{ fontSize: 10, color: 'var(--cp-text-muted)', lineHeight: 1.6 }}>
                  Do not use your personal wallet. Create a brand new wallet exclusively
                  for your store, and use its viewing key here. Sweep funds to cold storage regularly.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Store Name <span style={{ color: 'var(--cp-text-dim)' }}>(optional)</span></label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Store" className="input" />
                </div>

                <div className="form-group">
                  <label className="form-label">Unified Full Viewing Key (UFVK) <span style={{ color: 'var(--cp-red)' }}>*</span></label>
                  <textarea value={ufvk} onChange={(e) => setUfvk(e.target.value)} placeholder="uview1..." className="input" style={{ resize: 'vertical', minHeight: 70 }} required />
                  <p style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 4 }}>Read-only key for payment detection. Cannot spend funds.</p>
                </div>

                <div className="divider" />
                <div className="section-title">OPTIONAL</div>

                <div className="form-group">
                  <label className="form-label">Webhook URL</label>
                  <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://your-store.com/api/cipherpay-webhook" className="input" />
                </div>

                <div className="form-group">
                  <label className="form-label">Recovery Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="input" />
                  <p style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 4 }}>Only used for account recovery if you lose your token. No marketing, ever.</p>
                </div>

                {error && (
                  <div style={{ color: 'var(--cp-red)', fontSize: 11, marginBottom: 12 }}>{error}</div>
                )}

                <button type="submit" disabled={loading || !ufvk} className="btn-primary" style={{ width: '100%', opacity: loading || !ufvk ? 0.5 : 1 }}>
                  {loading ? 'CREATING...' : 'CREATE MERCHANT ACCOUNT'}
                </button>
              </form>

              <div className="divider" />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--cp-text-muted)' }}>
                  Already have an account?{' '}
                  <Link href="/dashboard/login" style={{ color: 'var(--cp-cyan)', textDecoration: 'none' }}>Sign in</Link>
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
