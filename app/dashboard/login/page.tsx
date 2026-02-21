'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.startsWith('cpay_dash_')) {
      setError('Token must start with cpay_dash_');
      return;
    }

    setLoading(true);
    setError('');

    const ok = await login(token);
    if (ok) {
      router.push('/dashboard');
    } else {
      setError('Invalid dashboard token');
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
        <div style={{ maxWidth: 400, width: '100%' }}>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Merchant Login</span>
              <span className="status-badge status-confirmed">SECURE</span>
            </div>
            <div className="panel-body">
              <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 20 }}>
                Paste your dashboard token to sign in.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Dashboard Token</label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="cpay_dash_..."
                    className="input"
                    autoFocus
                  />
                </div>

                {error && (
                  <div style={{ color: 'var(--cp-red)', fontSize: 11, marginBottom: 12 }}>{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="btn-primary"
                  style={{ width: '100%', opacity: loading || !token ? 0.5 : 1 }}
                >
                  {loading ? 'SIGNING IN...' : 'SIGN IN'}
                </button>
              </form>

              <div className="divider" />

              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 8 }}>
                  Don&apos;t have an account?
                </p>
                <Link href="/dashboard/register" style={{ fontSize: 11, color: 'var(--cp-cyan)', textDecoration: 'none' }}>
                  Register as a merchant
                </Link>
              </div>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Link href="/dashboard/recover" style={{ fontSize: 10, color: 'var(--cp-text-dim)', textDecoration: 'none' }}>
                  Lost your token?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
