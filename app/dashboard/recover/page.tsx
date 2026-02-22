'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { validateEmail } from '@/lib/validation';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';

export default function RecoverPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); setLoading(false); return; }

    try {
      await api.recover(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recovery request failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6, display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <Link href="/"><Logo size="sm" /></Link>
        <ThemeToggle />
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: 420, width: '100%' }}>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Account Recovery</span>
            </div>
            <div className="panel-body">
              {sent ? (
                <>
                  <div style={{ padding: 16, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 4, marginBottom: 16 }}>
                    <div style={{ fontSize: 10, color: 'var(--cp-green)', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
                      RECOVERY LINK SENT
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', lineHeight: 1.6 }}>
                      If an account with that email exists, a recovery link has been sent.
                      Check your inbox and click the link within 1 hour.
                    </p>
                  </div>

                  <Link href="/dashboard/login" className="btn" style={{ width: '100%', textDecoration: 'none', textAlign: 'center' }}>
                    BACK TO LOGIN
                  </Link>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 20 }}>
                    Enter the recovery email you registered with. We&apos;ll send a link
                    to get a new dashboard token.
                  </p>

                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="form-label">Recovery Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="input"
                        required
                        autoFocus
                      />
                    </div>

                    {error && (
                      <div style={{ color: 'var(--cp-red)', fontSize: 11, marginBottom: 12 }}>{error}</div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !email}
                      className="btn-primary"
                      style={{ width: '100%', opacity: loading || !email ? 0.5 : 1 }}
                    >
                      {loading ? 'SENDING...' : 'SEND RECOVERY LINK'}
                    </button>
                  </form>

                  <div className="divider" />

                  <div style={{ padding: 12, background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4 }}>
                    <p style={{ fontSize: 10, color: 'var(--cp-text-muted)', lineHeight: 1.6 }}>
                      <strong style={{ color: 'var(--cp-text)' }}>No recovery email?</strong>{' '}
                      Without one, you&apos;ll need to create a new merchant account with a different UFVK.
                    </p>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Link href="/dashboard/login" style={{ fontSize: 11, color: 'var(--cp-cyan)', textDecoration: 'none' }}>
                      Back to login
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
