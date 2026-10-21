'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { NETWORK_NAMES, formatCryptoUnits, type CryptoEligibility, type CryptoAsset } from '@/lib/crosschain';
import styles from './CrosschainCheckout.module.css';

export function AssetIcon({ asset }: { asset: CryptoAsset }) {
  return <span className={styles.assetIcon} aria-hidden="true">
    <img src={`/tokens/${asset.symbol.toLowerCase()}.png`} alt="" width={36} height={36} />
    <img className={styles.networkBadge} src={`/chains/${asset.blockchain}.png`} alt="" width={17} height={17} />
  </span>;
}

export function WalletIcon({ icon, name }: { icon?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  // Render extension-supplied SVGs only as images, never as inline markup.
  const safe = icon && (/^data:image\//.test(icon) || (icon.startsWith('/') && !icon.startsWith('//')));
  const source = name.toLowerCase() === 'phantom' ? '/wallets/phantom.svg' : safe ? icon : undefined;
  return source && !failed
    ? <img className={styles.walletIcon} src={source} alt="" width={30} height={30} onError={() => setFailed(true)} />
    : <span className={styles.walletFallback} aria-hidden="true">{name.slice(0, 1)}</span>;
}

export function PaymentAssetSelector({ assets, selected, disabled, eligibility, onChange }: {
  assets: CryptoAsset[]; selected: CryptoAsset | undefined; disabled: boolean; eligibility: CryptoEligibility | null; onChange: (asset: CryptoAsset) => void;
}) {
  const t = useTranslations('checkout.crosschain');
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const filtered = assets.filter(a => `${a.symbol} ${NETWORK_NAMES[a.blockchain] || a.blockchain}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <span className={styles.srOnly} id="crypto-asset-label">{t('payWith')}</span>
    <button type="button" className={styles.assetTrigger} aria-labelledby="crypto-asset-label crypto-asset-value" aria-haspopup="dialog" disabled={disabled}
      onClick={() => { setQuery(''); dialog.current?.showModal(); }}>
      {selected && <AssetIcon asset={selected} />}
      <span className={styles.assetText} id="crypto-asset-value"><strong>{selected?.symbol || t('selectToken')}</strong><small>{selected && NETWORK_NAMES[selected.blockchain]}</small></span>
      <span aria-hidden="true">⌄</span>
    </button>
    <dialog ref={dialog} className={styles.assetDialog} aria-labelledby="asset-dialog-title" onClick={e => { if (e.target === dialog.current) dialog.current.close(); }}>
      <div className={styles.dialogBody}>
        <div className={styles.dialogHeader}><h3 id="asset-dialog-title">{t('selectToken')}</h3><button type="button" aria-label={t('close')} onClick={() => dialog.current?.close()}>×</button></div>
        <input className={styles.input} aria-label={t('searchTokens')} placeholder={t('searchTokens')} value={query} onChange={e => setQuery(e.target.value)} autoFocus />
        <p className={styles.hint}>{t('networkMatch')}</p>
        <div className={styles.assetList}>
          {filtered.map(a => {
            const route = eligibility?.routes.find(r => r.assetId === a.assetId);
            const available = route?.state === 'AVAILABLE';
            const reason = route?.state === 'BELOW_MINIMUM' && /^\d+$/.test(route.minimumOutputZatoshis || '')
              ? t('routeMinimum', { amount: formatCryptoUnits(route.minimumOutputZatoshis!, 8) }) : route?.state === 'BELOW_MINIMUM' && /^\d+(\.\d{1,2})?$/.test(route.minimumSwapUsd || '') ? t('routeMinimumUsd', { amount: route.minimumSwapUsd! }) : t('routeUnknown');
            return <button type="button" key={a.assetId} className={styles.assetOption} disabled={!available} aria-pressed={a.assetId === selected?.assetId}
            onClick={() => { onChange(a); dialog.current?.close(); }}>
            <AssetIcon asset={a} /><span className={styles.assetText}><strong>{a.symbol}</strong><small>{NETWORK_NAMES[a.blockchain]}</small>{!available && <small className={styles.routeReason}>{reason}</small>}</span>
            {a.assetId === selected?.assetId && <span className={styles.check} aria-hidden="true">✓</span>}
          </button>; })}
          {!filtered.length && <p className={styles.hint}>{t('noTokens')}</p>}
        </div>
      </div>
    </dialog>
  </>;
}
