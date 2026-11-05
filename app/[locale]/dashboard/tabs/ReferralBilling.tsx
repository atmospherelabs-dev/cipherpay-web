'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, type ReferralSummary } from '@/lib/api';
import { formatCryptoUnits, NETWORK_NAMES, type CryptoAsset } from '@/lib/crosschain';
import { AssetIcon } from '@/components/PaymentAssetSelector';

export function ReferralBilling({ summary, assets, reload }: { summary: ReferralSummary; assets: CryptoAsset[]; reload: () => void }) {
  const t = useTranslations('dashboard.billing.referrals');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function apply() {
    setBusy(true); setMessage('');
    try { await api.applyReferral(code.trim()); setCode(''); reload(); }
    catch (e) { setMessage(e instanceof Error ? e.message : t('failed')); }
    finally { setBusy(false); }
  }
  return <details style={{ paddingTop: 4, marginTop: 12, fontSize: 12 }}>
    <summary style={{ cursor: 'pointer', padding: '8px 0', fontWeight: 600 }}>{t('title')}</summary>
    <p style={{ color: 'var(--cp-text-muted)', lineHeight: 1.6, margin: '8px 0 16px' }}>{t('terms')}</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
      <code style={{ overflowWrap: 'anywhere' }}>{summary.code}</code>
      <button className="btn btn-small" type="button" onClick={async () => { try { await navigator.clipboard.writeText(summary.code); setMessage(t('copied')); } catch { setMessage(t('failed')); } }}>{t('copy')}</button>
    </div>
    <p style={{ margin: '12px 0', color: 'var(--cp-text-muted)' }}>{t('count', { count: summary.referred_merchants })}</p>
    {summary.balances.map(balance => {
      const asset = balance.asset || assets.find(a => a.assetId === balance.asset_id);
      const zec = balance.asset_id === 'zec';
      return <div key={balance.asset_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', overflowWrap: 'anywhere' }}>
        {asset && <AssetIcon asset={asset} />}
        <span>{asset || zec ? `${formatCryptoUnits(balance.units, asset?.decimals ?? 8)} ${asset?.symbol ?? 'ZEC'}` : `${balance.units} ${t('baseUnits')}`}<br/>
          <small style={{ color: 'var(--cp-text-muted)' }}>{asset ? NETWORK_NAMES[asset.blockchain] || asset.blockchain : zec ? 'Zcash' : balance.asset_id}</small>
        </span>
      </div>;
    })}
    <p style={{ color: 'var(--cp-text-muted)', lineHeight: 1.6, margin: '12px 0 16px' }}>{t('held')}</p>
    {summary.applied ? <p>{t('applied')}</p> : <form onSubmit={e => { e.preventDefault(); void apply(); }} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <label style={{ flex: '1 1 180px', minWidth: 0 }}>{t('label')}<input className="input" style={{ width: '100%', marginTop: 8 }} value={code} onChange={e => setCode(e.target.value)} maxLength={40} autoComplete="off" disabled={busy} placeholder="CPREF-…" /></label>
      <button className="btn btn-small" style={{ alignSelf: 'end', minHeight: 38, opacity: busy || !code.trim() ? 0.5 : 1 }} disabled={busy || !code.trim()}>{t('apply')}</button>
    </form>}
    {message && <p role="status">{message}</p>}
  </details>;
}
