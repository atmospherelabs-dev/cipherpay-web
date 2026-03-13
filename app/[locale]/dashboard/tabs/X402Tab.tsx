'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { CopyButton } from '@/components/CopyButton';
import type { X402Verification, ZecRates } from '@/lib/api';
import { zecToFiat, fiatLabel } from '@/lib/currency';

interface X402TabProps {
  x402Verifications: X402Verification[];
  loadingX402: boolean;
  loadX402: () => void;
  zecRates: ZecRates | null;
  displayCurrency: string;
}

export const X402Tab = memo(function X402Tab({
  x402Verifications, loadingX402, loadX402, zecRates, displayCurrency,
}: X402TabProps) {
  const t = useTranslations('dashboard.x402');
  const tc = useTranslations('common');

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">{t('title')}</span>
        <button onClick={loadX402} className="btn btn-small">{tc('refresh')}</button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', padding: '0 16px 12px', lineHeight: 1.5 }}>
        {t('subtitle')}
      </div>

      {loadingX402 ? (
        <div className="empty-state">
          <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--cp-cyan)', borderTopColor: 'transparent' }} />
        </div>
      ) : x402Verifications.length === 0 ? (
        <div className="empty-state">
          <div className="icon">&#9632;</div>
          <div>{t('noVerifications')}</div>
        </div>
      ) : (
        x402Verifications.map((v) => (
          <div key={v.id} className="invoice-card">
            <div className="invoice-header">
              <span className="invoice-id" style={{ fontSize: 10 }}>
                <CopyButton text={v.txid} label={v.txid.substring(0, 16) + '...'} />
              </span>
              <span className={`status-badge ${v.status === 'verified' ? 'status-confirmed' : 'status-expired'}`}>
                {v.status.toUpperCase()}
              </span>
            </div>
            <div className="invoice-meta">
              <span>
                <strong>
                  {v.amount_zec != null ? `${v.amount_zec.toFixed(8)} ZEC` : '—'}
                </strong>
                {v.amount_zec != null && fiatLabel(zecToFiat(v.amount_zec, zecRates, displayCurrency), displayCurrency)}
              </span>
              <span>{new Date(v.created_at + 'Z').toLocaleString()}</span>
            </div>
            {v.reason && (
              <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 6 }}>{v.reason}</div>
            )}
          </div>
        ))
      )}
    </div>
  );
});
