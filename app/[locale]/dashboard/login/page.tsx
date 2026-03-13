'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, merchant, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && merchant) {
      router.replace('/dashboard');
    }
  }, [authLoading, merchant, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.startsWith('cpay_dash_')) {
      setError(t('tokenPrefix'));
      return;
    }

    setLoading(true);
    setError('');

    const ok = await login(token);
    if (ok) {
      router.push('/dashboard');
    } else {
      setError(t('invalidToken'));
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6, display: 'flex', flexDirection: 'column' }}>
      <header className="site-header">
        <Link href="/"><Logo size="sm" /></Link>
        <ThemeToggle />
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: 400, width: '100%' }}>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">{t('title')}</span>
              <span className="status-badge status-confirmed">{t('secure')}</span>
            </div>
            <div className="panel-body">
              <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 20 }}>
                {t('description')}
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">{t('tokenLabel')}</label>
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
                  {loading ? t('submitting') : t('submit')}
                </button>
              </form>

              <div className="divider" />

              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 8 }}>
                  {t('noAccount')}
                </p>
                <Link href="/dashboard/register" style={{ fontSize: 11, color: 'var(--cp-cyan)', textDecoration: 'none' }}>
                  {t('register')}
                </Link>
              </div>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Link href="/dashboard/recover" style={{ fontSize: 10, color: 'var(--cp-text-dim)', textDecoration: 'none' }}>
                  {t('lostToken')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
