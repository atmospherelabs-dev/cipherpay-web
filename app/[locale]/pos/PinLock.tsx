'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { API_URL } from '@/lib/config';

interface PinLockProps {
  merchantName: string;
  merchantId?: string;
  onSuccess: () => void;
  onDashboardAuth?: () => void;
}

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 30_000;

export function PinLock({ merchantName, merchantId, onSuccess, onDashboardAuth }: PinLockProps) {
  const t = useTranslations('pos.pin');
  const locale = useLocale();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLocked = Date.now() < lockedUntil;

  const verify = useCallback(async (code: string) => {
    setVerifying(true);
    setError('');
    try {
      const storedMid = merchantId || localStorage.getItem('pos_merchant_id') || undefined;
      const payload: Record<string, string> = { pin: code };
      if (storedMid) payload.merchant_id = storedMid;

      const res = await fetch(`${API_URL}/api/auth/pos-session`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.merchant_id) {
          localStorage.setItem('pos_merchant_id', data.merchant_id);
        }
        onSuccess();
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (body.error === 'pos_pin_not_set') {
        if (onDashboardAuth) { onDashboardAuth(); return; }
        setError('__not_configured__');
      } else {
        const next = attempts + 1;
        setAttempts(next);
        if (next >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_MS);
          setError(t('locked'));
          setTimeout(() => { setLockedUntil(0); setAttempts(0); }, LOCKOUT_MS);
        } else {
          setError(t('wrong'));
        }
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setError(t('networkError'));
    }
    setPin('');
    setVerifying(false);
  }, [attempts, onDashboardAuth, onSuccess, t]);

  const handleDigit = useCallback((d: string) => {
    if (isLocked || verifying) return;
    setPin(prev => {
      const next = prev + d;
      setError('');
      if (next.length === PIN_LENGTH) {
        verify(next);
      }
      return next.length <= PIN_LENGTH ? next : prev;
    });
  }, [isLocked, verifying, verify]);

  const handleBackspace = useCallback(() => {
    if (isLocked || verifying) return;
    setPin(prev => prev.slice(0, -1));
  }, [isLocked, verifying]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === 'Backspace') handleBackspace();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDigit, handleBackspace]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  return (
    <div className="pos-pin-screen" ref={containerRef}>
      <div className="pos-pin-container">
        <img src="/logo-mark.png" alt="" className="pos-pin-logo" />
        <div className="pos-pin-merchant">{merchantName || 'CipherPay POS'}</div>
        <div className="pos-pin-label">{t('enterPin')}</div>

        <div className={`pos-pin-dots${shake ? ' pos-shake' : ''}`}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div key={i} className={`pos-pin-dot${i < pin.length ? ' filled' : ''}`} />
          ))}
        </div>

        {error === '__not_configured__' ? (
          <div className="pos-pin-error" style={{ lineHeight: 1.6 }}>
            {t('notConfigured')}{' '}
            <a
              href={`/${locale}/dashboard?tab=settings`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--cp-cyan, #06b6d4)', textDecoration: 'underline' }}
            >
              {t('openSettings')}
            </a>
          </div>
        ) : error ? (
          <div className="pos-pin-error">{error}</div>
        ) : null}

        <div className="pos-pin-pad">
          {digits.map((d, i) => {
            if (d === '') return <div key={i} className="pos-pin-key-spacer" />;
            if (d === 'back') {
              return (
                <button key={i} className="pos-pin-key" onClick={handleBackspace} disabled={isLocked || verifying}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                </button>
              );
            }
            return (
              <button key={i} className="pos-pin-key" onClick={() => handleDigit(d)} disabled={isLocked || verifying}>
                {d}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
