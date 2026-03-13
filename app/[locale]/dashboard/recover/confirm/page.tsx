'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CopyButton } from '@/components/CopyButton';
import { Link } from '@/i18n/navigation';

function RecoverConfirmInner() {
  const t = useTranslations('recoverConfirm');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [dashboardToken, setDashboardToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const initiated = useRef(false);

  useEffect(() => {
    if (initiated.current) return;

    if (!token) {
      setError(t('noToken'));
      setLoading(false);
      return;
    }

    initiated.current = true;

    api.recoverConfirm(token)
      .then((res) => {
        setDashboardToken(res.dashboard_token);
        window.history.replaceState({}, '', window.location.pathname);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('recoveryFailed'));
      })
      .finally(() => setLoading(false));
  }, [token, t]);

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6, display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <Link href="/"><Logo size="sm" /></Link>
        <ThemeToggle />
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: 480, width: '100%' }}>
          {loading ? (
            <div className="panel">
              <div className="panel-body" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', letterSpacing: 1 }}>
                  {t('verifying')}
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{t('failedTitle')}</span>
                <span className="status-badge status-expired">{t('error')}</span>
              </div>
              <div className="panel-body">
                <p style={{ fontSize: 11, color: 'var(--cp-red)', marginBottom: 16 }}>{error}</p>
                <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 16 }}>
                  {t('expiredDesc')}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href="/dashboard/recover" className="btn" style={{ flex: 1, textAlign: 'center' }}>
                    {t('tryAgain')}
                  </Link>
                  <Link href="/dashboard/login" className="btn" style={{ flex: 1, textAlign: 'center' }}>
                    {t('login')}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{t('successTitle')}</span>
                <span className="status-badge status-confirmed">{t('success')}</span>
              </div>
              <div className="panel-body">
                <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 20 }}>
                  {t('successDesc')}
                </p>

                <div style={{ padding: 14, background: 'var(--cp-bg)', border: '1px solid var(--cp-cyan)', borderRadius: 4, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-cyan)' }}>{t('newToken')}</span>
                    <CopyButton text={dashboardToken!} label="" />
                  </div>
                  <code style={{ fontSize: 10, wordBreak: 'break-all', display: 'block', color: 'var(--cp-text)' }}>
                    {dashboardToken}
                  </code>
                </div>

                <div style={{ padding: 12, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 4, marginBottom: 16 }}>
                  <p style={{ fontSize: 10, color: 'var(--cp-yellow)', fontWeight: 600, letterSpacing: 1 }}>
                    {t('oldTokenInvalidated')}
                  </p>
                </div>

                <Link href="/dashboard/login" className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                  {t('signInWithNew')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function RecoverConfirmPage() {
  return (
    <Suspense>
      <RecoverConfirmInner />
    </Suspense>
  );
}
