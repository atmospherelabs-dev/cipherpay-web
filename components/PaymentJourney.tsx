'use client';

import { useTranslations } from 'next-intl';
import type { CryptoAttempt } from '@/lib/crosschain';
import { paymentProgress } from '@/lib/crosschain';
import styles from './CrosschainCheckout.module.css';

export function PaymentIcon({ kind }: { kind: 'shield' | 'eye' | 'check' | 'swap' | 'wallet' }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'shield' ? <><path d="M12 3 4.5 6v5c0 5 7.5 10 7.5 10s7.5-5 7.5-10V6Z"/><path d="m8.5 11.5 2.5 2.5 4.5-5"/></>
      : kind === 'eye' ? <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>
      : kind === 'check' ? <path d="m5 12 4 4L19 6"/>
      : kind === 'swap' ? <><path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/></>
      : <><rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 8h18m-5 5h5v4h-5z"/></>}
  </svg>;
}

export function PaymentJourney({ attempt, expired, awaitingWallet = false, showReminder = true }: { attempt: CryptoAttempt; expired: boolean; awaitingWallet?: boolean; showReminder?: boolean }) {
  const t = useTranslations('checkout.crosschain');
  const stage = paymentProgress(attempt);
  const paused = attempt.stale || expired || ['NEEDS_REVIEW','FAILED','INCOMPLETE_DEPOSIT','REFUNDED'].includes(attempt.state);
  const title = attempt.state === 'NEEDS_REVIEW' ? 'needsReview' : attempt.state === 'REFUNDED' ? 'refunded'
    : attempt.state === 'FAILED' ? 'failed' : attempt.state === 'INCOMPLETE_DEPOSIT' ? 'incomplete'
    : attempt.state === 'CREATING' ? 'creating' : attempt.stale ? 'statusPaused'
    : stage === 2 ? 'confirmingTitle' : stage === 1 ? 'converting' : expired ? 'depositClosed'
    : awaitingWallet ? 'confirmWallet' : attempt.sendStarted ? 'sent' : 'waiting';
  const processing = !awaitingWallet && (stage > 0 || attempt.sendStarted);
  return <div className={styles.journey} role="status" aria-live="polite">
    <span className={`${styles.paymentSpinner} ${paused ? styles.paused : ''}`} aria-hidden="true"/>
    <div><h3>{t(title)}</h3>
      {!paused && processing && showReminder && <p>{t('resumeHint')}</p>}
    </div>
  </div>;
}
