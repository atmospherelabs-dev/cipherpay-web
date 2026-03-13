'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/Spinner';
import type { X402Verification, ZecRates } from '@/lib/api';
import { zecToFiat, fiatLabel } from '@/lib/currency';

interface X402TabProps {
  x402Verifications: X402Verification[];
  loadingX402: boolean;
  loadX402: () => void;
  zecRates: ZecRates | null;
  displayCurrency: string;
  isTestnet: boolean;
}

export const X402Tab = memo(function X402Tab({
  x402Verifications, loadingX402, loadX402, zecRates, displayCurrency, isTestnet,
}: X402TabProps) {
  const t = useTranslations('dashboard.x402');
  const tc = useTranslations('common');

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">{t('title')}</span>
        <button onClick={loadX402} className="btn btn-small">{tc('refresh')}</button>
      </div>
      <div className="panel-subtitle">
        {t('subtitle')}
      </div>

      {loadingX402 ? (
        <div className="empty-state">
          <Spinner />
        </div>
      ) : x402Verifications.length === 0 ? (
        <div className="empty-state">
          <div className="icon">&#9632;</div>
          <div>{t('noVerifications')}</div>
        </div>
      ) : (
        <>
          {x402Verifications.map((v) => {
            const date = new Date(v.created_at.endsWith('Z') ? v.created_at : v.created_at + 'Z');
            const dateStr = isNaN(date.getTime()) ? v.created_at : date.toLocaleString();
            return (
              <div key={v.id} className="invoice-card">
                <div className="invoice-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cp-text)' }}>
                      {v.amount_zec != null ? `${v.amount_zec.toFixed(8)} ZEC` : '—'}
                    </span>
                    {v.amount_zec != null && (
                      <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>
                        {fiatLabel(zecToFiat(v.amount_zec, zecRates, displayCurrency), displayCurrency)}
                      </span>
                    )}
                  </div>
                  <span className={`status-badge ${v.status === 'verified' ? 'status-confirmed' : 'status-expired'}`}>
                    {v.status.toUpperCase()}
                  </span>
                </div>
              <div className="invoice-meta" style={{ justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--cp-text-dim)' }}>{t('txid')}</span>
                  <a
                    href={`${isTestnet ? 'https://testnet.cipherscan.app' : 'https://cipherscan.app'}/tx/${v.txid}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-link"
                    style={{ fontSize: 10, fontFamily: 'var(--font-geist-mono), monospace' }}
                  >
                    {v.txid.substring(0, 12)}...
                  </a>
                </span>
                <span style={{ color: 'var(--cp-text-dim)' }}>{dateStr}</span>
              </div>
                {v.reason && (
                  <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 6 }}>{v.reason}</div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
});
