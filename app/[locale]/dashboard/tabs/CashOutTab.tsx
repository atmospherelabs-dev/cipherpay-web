'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { CopyButton } from '@/components/CopyButton';
import type { MerchantInfo, ZecRates } from '@/lib/api';
import { currencySymbol, zecToFiat, fiatLabel } from '@/lib/currency';

interface CashOutTabProps {
  merchant: MerchantInfo;
  zecRates: ZecRates | null;
  displayCurrency: string;
}

export const CashOutTab = memo(function CashOutTab({
  merchant, zecRates, displayCurrency,
}: CashOutTabProps) {
  const t = useTranslations('dashboard.cashOut');
  const totalFiat = zecToFiat(merchant.stats.total_zec, zecRates, displayCurrency);
  const sym = currencySymbol(displayCurrency);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('title')}</span>
        </div>
        <div className="panel-body" style={{ padding: '12px 24px' }}>
          <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', lineHeight: 1.7, margin: 0 }}>
            {t('description')}
          </p>
        </div>
      </div>

      {/* Volume summary */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('volumeTitle')}</span>
          <span style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 0.5 }}>
            {t('informational')}
          </span>
        </div>
        <div className="panel-body" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--cp-text)', lineHeight: 1 }}>
              {merchant.stats.total_zec.toFixed(4)}
            </span>
            <span style={{ fontSize: 12, color: 'var(--cp-text-muted)', fontWeight: 500 }}>ZEC</span>
          </div>
          {totalFiat !== null && (
            <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginTop: 4 }}>
              {sym}{totalFiat.toFixed(2)} {displayCurrency}
            </div>
          )}
          <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 8 }}>
            {t('volumeNote', { count: merchant.stats.confirmed })}
          </div>
        </div>
      </div>

      {/* Non-custodial notice */}
      <div className="panel" style={{ borderColor: 'rgba(86,212,200,0.15)' }}>
        <div className="panel-body" style={{ padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>&#9432;</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cp-text)', marginBottom: 4 }}>
              {t('nonCustodialTitle')}
            </div>
            <p style={{ fontSize: 10, color: 'var(--cp-text-muted)', lineHeight: 1.7, margin: 0 }}>
              {t('nonCustodialDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Off-ramp options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Zipher card */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title" style={{ color: 'var(--cp-cyan)' }}>{t('zipherTitle')}</span>
            <span className="status-badge status-confirmed" style={{ fontSize: 8 }}>{t('recommended')}</span>
          </div>
          <div className="panel-body" style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', lineHeight: 1.7, margin: 0 }}>
              {t('zipherDesc')}
            </p>
            <div style={{
              background: 'var(--cp-bg)',
              border: '1px solid var(--cp-border)',
              borderRadius: 6,
              padding: '10px 14px',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: 10,
              color: 'var(--cp-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}>
              <code>npm i -g @cipherpay/zipher-cli</code>
              <CopyButton text="npm i -g @cipherpay/zipher-cli" label="" />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a
                href="https://zipher.to"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-small"
                style={{ fontSize: 9, textDecoration: 'none', borderColor: 'var(--cp-cyan)', color: 'var(--cp-cyan)' }}
              >
                Website
              </a>
              <a
                href="https://github.com/atmospherelabs-dev/zipher-app"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-small"
                style={{ fontSize: 9, textDecoration: 'none' }}
              >
                GitHub
              </a>
              <a
                href="https://www.npmjs.com/package/@cipherpay/zipher-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-small"
                style={{ fontSize: 9, textDecoration: 'none' }}
              >
                npm
              </a>
            </div>
          </div>
        </div>

        {/* Loofta card */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">{t('looftaTitle')}</span>
          </div>
          <div className="panel-body" style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', lineHeight: 1.7, margin: 0 }}>
              {t('looftaDesc')}
            </p>
            <a
              href="https://swap.loofta.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ fontSize: 10, textDecoration: 'none', textAlign: 'center' }}
            >
              {t('openLoofta')}
            </a>
          </div>
        </div>

        {/* Peer card */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">{t('peerTitle')}</span>
          </div>
          <div className="panel-body" style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', lineHeight: 1.7, margin: 0 }}>
              {t('peerDesc')}
            </p>
            <a
              href="https://peer.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ fontSize: 10, textDecoration: 'none', textAlign: 'center' }}
            >
              {t('openPeer')}
            </a>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('howTitle')}</span>
        </div>
        <div className="panel-body" style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(['step1', 'step2', 'step3'] as const).map((step, i) => (
              <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: '1px solid var(--cp-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 600, color: 'var(--cp-cyan)',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cp-text)', marginBottom: 2 }}>
                    {t(`${step}Title`)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', lineHeight: 1.6 }}>
                    {t(`${step}Desc`)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
