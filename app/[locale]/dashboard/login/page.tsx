'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from '@/i18n/navigation';
import { useAuth, supportsWebAuthn } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { MeshGradient } from '@/components/MeshGradient';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [webauthnSupported, setWebauthnSupported] = useState(false);
  const { login, loginWithPasskey, merchant, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && merchant) {
      router.replace('/dashboard');
    }
  }, [authLoading, merchant, router]);

  useEffect(() => {
    setWebauthnSupported(supportsWebAuthn());
  }, []);

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    setError('');
    const ok = await loginWithPasskey();
    if (ok) {
      router.push('/dashboard');
    } else {
      setError(t('passkeyFailed'));
      setShowTokenForm(true);
    }
    setPasskeyLoading(false);
  };

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
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <MeshGradient />
      <header className="site-header" style={{ position: 'relative', background: 'var(--cp-bg)' }}>
        <Link href="/"><Logo size="sm" /></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', position: 'relative' }}>
        <motion.div
          style={{ maxWidth: 400, width: '100%' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">{t('title')}</span>
              <span className="status-badge status-confirmed">{t('secure')}</span>
            </div>
            <div className="panel-body">
              <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 20 }}>
                {t('description')}
              </p>

              {webauthnSupported && !showTokenForm && (
                <>
                  <button
                    onClick={handlePasskeyLogin}
                    disabled={passkeyLoading}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      opacity: passkeyLoading ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    {passkeyLoading ? t('passkeyLoading') : t('passkeyButton')}
                  </button>

                  <button
                    onClick={() => setShowTokenForm(true)}
                    className="btn"
                    style={{
                      width: '100%',
                      marginTop: 10,
                      fontSize: 10,
                      color: 'var(--cp-text-dim)',
                    }}
                  >
                    {t('useToken')}
                  </button>
                </>
              )}

              {(!webauthnSupported || showTokenForm) && (
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

                  <button
                    type="submit"
                    disabled={loading || !token}
                    className="btn-primary"
                    style={{ width: '100%', opacity: loading || !token ? 0.5 : 1 }}
                  >
                    {loading ? t('submitting') : t('submit')}
                  </button>

                  {webauthnSupported && (
                    <button
                      type="button"
                      onClick={() => { setShowTokenForm(false); setError(''); }}
                      className="btn"
                      style={{ width: '100%', marginTop: 10, fontSize: 10, color: 'var(--cp-text-dim)' }}
                    >
                      {t('passkeyButton')}
                    </button>
                  )}
                </form>
              )}

              {error && (
                <div style={{ color: 'var(--cp-red)', fontSize: 11, marginTop: 12 }}>{error}</div>
              )}

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
        </motion.div>
      </main>
    </div>
  );
}
