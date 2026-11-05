'use client';

import { useTranslations } from 'next-intl';
import type { CrosschainBillingSummary } from '@/lib/api';
import { formatCryptoUnits, NETWORK_NAMES } from '@/lib/crosschain';
import { AssetIcon } from '@/components/PaymentAssetSelector';

export function CrosschainBilling({ summary }: { summary: CrosschainBillingSummary }) {
  const t = useTranslations('dashboard.billing');
  return <section aria-labelledby="crosschain-billing-title" style={{ paddingBottom: 24, marginBottom: 12, borderBottom: '1px solid var(--cp-border)' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
      <h3 id="crosschain-billing-title" style={{ fontSize: 15, margin: 0 }}>{t('crosschainTitle')}</h3>
      {summary.enabled && <span style={{ fontSize: 12, color: 'var(--cp-text-muted)' }}>{t('crosschainRate', { rate: summary.total_bps / 100 })}</span>}
    </div>
    <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--cp-text-muted)', margin: '8px 0 20px' }}>{t('crosschainExplanation')}</p>
    <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-text-dim)', textTransform: 'uppercase' }}>{t('crosschainCollected')}</div>
    {summary.assets.map(({ asset, received_units }) => <div key={asset.assetId} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
      <AssetIcon asset={asset} />
      <div style={{ minWidth: 0 }}>
        <strong style={{ fontSize: 20, color: 'var(--cp-cyan)', overflowWrap: 'anywhere' }}>{formatCryptoUnits(received_units, asset.decimals)} {asset.symbol}</strong>
        <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 3 }}>{NETWORK_NAMES[asset.blockchain] || asset.blockchain}</div>
      </div>
    </div>)}
    {!summary.assets.length && <p style={{ fontSize: 12, color: 'var(--cp-text-muted)' }}>{t('crosschainNone')}</p>}
    {(summary.provider_handled_count ?? 0) > 0 && <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--cp-green)' }}>{t('crosschainHandledCount', { count: summary.provider_handled_count ?? 0 })}</div>
      <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--cp-text-muted)', margin: '6px 0 0' }}>{t('crosschainHandledExplanation')}</p>
    </div>}
    {summary.pending_count > 0 && <p role="status" style={{ fontSize: 12, color: 'var(--cp-yellow)' }}>{t('crosschainPending', { count: summary.pending_count })}</p>}
    {summary.recent.length > 0 && <details style={{ marginTop: 20, fontSize: 12 }}>
      <summary style={{ cursor: 'pointer', color: 'var(--cp-text-muted)', padding: '8px 0' }}>{t('crosschainRecent')}</summary>
      {summary.recent.map(row => <div key={row.invoice_id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 0', borderTop: '1px solid var(--cp-border)' }}>
        <div>
          <div>{row.reference}</div>
          <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 4 }}>{row.asset.symbol} · {NETWORK_NAMES[row.asset.blockchain] || row.asset.blockchain}</div>
        </div>
        <div style={{ textAlign: 'end', overflowWrap: 'anywhere', maxWidth: '100%' }}>
          {row.state === 'collected' && row.received_units !== null ? <>
            <div>{formatCryptoUnits(row.received_units, row.asset.decimals)} {row.asset.symbol}</div>
            <div style={{ fontSize: 11, color: 'var(--cp-green)', marginTop: 4 }}>{t('crosschainPaid')}</div>
          </> : row.state === 'provider_handled' ? <span style={{ color: 'var(--cp-green)' }}>{t('crosschainHandled')}</span> : <span style={{ color: 'var(--cp-yellow)' }}>{t('crosschainVerifying')}</span>}
        </div>
      </div>)}
    </details>}
  </section>;
}
