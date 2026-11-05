'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { API_URL } from '@/lib/config';
import { api, type Invoice } from '@/lib/api';
import { checkoutToken, saveCheckoutAccess } from '@/lib/checkout-access';
import { canSend, formatCryptoUnits, formatQuoteSummary, NETWORK_NAMES, type CryptoAsset, type CryptoAttempt, type CryptoQuote, type CryptoEligibility, routeIsAvailable } from '@/lib/crosschain';
import { chainToWalletType, usePaymentWallet } from '@/hooks/usePaymentWallet';
import { PaymentIcon, PaymentJourney } from '@/components/PaymentJourney';
import { AssetIcon, PaymentAssetSelector, WalletIcon } from '@/components/PaymentAssetSelector';
import { QRCode } from '@/components/QRCode';
import styles from './CrosschainCheckout.module.css';

class PaymentError extends Error {
  constructor(message: string, public code?: string, public minimumOutputZatoshis?: string) { super(message); }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const id = /^invoices\/([^/]+)\/crosschain/.exec(path)?.[1];
  const token = id ? checkoutToken(decodeURIComponent(id)) : null;
  const response = await fetch(`${API_URL}/api/${path}`, {
    method: body === undefined ? 'GET' : 'POST', cache: 'no-store',
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { 'X-Checkout-Token': token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  const data = await response.json();
  if (!response.ok) throw new PaymentError(data.error || 'Payment service temporarily unavailable', data.code, data.minimumOutputZatoshis);
  return data as T;
}

export function CrosschainCheckout({ invoice, onActiveChange, onInvoice }: {
  invoice: Invoice;
  onActiveChange: (active: boolean) => void;
  onInvoice: (invoice: Invoice) => void;
}) {
  const t = useTranslations('checkout.crosschain');
  const methodId = useId();
  const wallet = usePaymentWallet();
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [eligibility, setEligibility] = useState<CryptoEligibility | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [eligibilityVersion, setEligibilityVersion] = useState(0);
  const [selected, setSelected] = useState(false);
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [assetId, setAssetId] = useState('');
  const [paymentMode, setPaymentMode] = useState<'wallet' | 'manual'>('wallet');
  const [refund, setRefund] = useState('');
  const [step, setStep] = useState<'asset' | 'method' | 'review'>('asset');
  const [quoteLoading, setQuoteLoading] = useState(false);
  const stepFocus = useRef<HTMLHeadingElement>(null);
  const [quote, setQuote] = useState<CryptoQuote | null>(null);
  const [attempt, setAttempt] = useState<CryptoAttempt>({ state: 'NONE' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [now, setNow] = useState(Date.now());
  const operation = useRef(false);
  const path = `invoices/${encodeURIComponent(invoice.id)}/crosschain`;
  const started = attempt.state !== 'NONE';
  const settled = invoice.status === 'confirmed' || invoice.status === 'refunded';
  const asset = attempt.quote?.asset || attempt.asset || assets.find(a => a.assetId === assetId);
  const eligibleRoute = !checkingEligibility && routeIsAvailable(eligibility, assetId);
  const compatible = !!asset && wallet.walletType === chainToWalletType(asset.blockchain);
  const useConnectedWallet = paymentMode === 'wallet' && compatible && wallet.connected;
  const availableWallets = asset ? wallet.getWalletsForChain(asset.blockchain) : [];
  const connectedWallet = availableWallets.find(w => w.name === wallet.walletName);

  useEffect(() => {
    // The invoice stream updates settlement fields only. Preserve the payment
    // method for the receipt when this page created the swap after its first GET.
    if (started && !invoice.is_crosschain) onInvoice({ ...invoice, is_crosschain: true });
  }, [started, invoice, onInvoice]);

  useEffect(() => {
    if (['KNOWN_DEPOSIT_TX', 'PROCESSING', 'SUCCESS'].includes(attempt.state)) setError('');
  }, [attempt.state]);

  const restore = useCallback(async () => {
    const a = await request<CryptoAttempt>(path);
    setAttempt(a);
    if (a.state !== 'NONE') setSelected(true);
    return a;
  }, [path]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      // Restore must succeed before offering another payment method. Otherwise a
      // transient outage could invite a second payment for an existing swap.
      try {
        if (!checkoutToken(invoice.id)) {
          try { const access = await api.checkoutAccess(invoice.id); saveCheckoutAccess(invoice.id, access.checkout_token); } catch { /* Public read-only link */ }
        }
        const [catalogResult, attemptResult] = await Promise.allSettled([
          request<{ enabled: boolean; assets: CryptoAsset[] }>('crosschain/assets'),
          request<CryptoAttempt>(path),
        ]);
        if (cancelled) return;
        if (attemptResult.status === 'rejected') throw attemptResult.reason;
        const a = attemptResult.value;
        // Token discovery can be down while a saved payment remains recoverable.
        const catalog = catalogResult.status === 'fulfilled'
          ? catalogResult.value : { enabled: true, assets: [] };
        setEnabled(catalog.enabled && a.enabled !== false);
        setAssets(catalog.assets);
        setAssetId(catalog.assets[0]?.assetId || '');
        setAttempt(a);
        setSelected(a.state !== 'NONE');
        setReady(true);
      } catch {
        if (!cancelled) setError(t('restoreError'));
      }
    };
    void init();
    return () => { cancelled = true; };
  }, [path, t]);

  useEffect(() => {
    if (!ready || !enabled || started || invoice.status !== 'pending') return;
    let cancelled = false;
    setCheckingEligibility(true);
    setEligibility(null);
    setQuote(null);
    const check = async () => {
      try {
        // Recover catalog discovery on retry too; a registry outage must not
        // silently remove the crypto option or mean "amount too small".
        const [result, catalog] = await Promise.all([
          request<CryptoEligibility>(`${path}/eligibility`),
          request<{ enabled: boolean; assets: CryptoAsset[] }>('crosschain/assets'),
        ]);
        if (cancelled) return;
        setAssets(catalog.assets);
        setEnabled(catalog.enabled && result.enabled !== false);
        setEligibility(result);
        const first = result.routes.find(r => r.state === 'AVAILABLE')?.assetId;
        const chosen = routeIsAvailable(result, assetId) ? assetId : first || assetId;
        setAssetId(chosen);
        const chosenAsset = catalog.assets.find(a => a.assetId === chosen);
        setRefund(paymentMode === 'wallet' && chosenAsset && wallet.walletType === chainToWalletType(chosenAsset.blockchain) ? wallet.address || '' : '');
      } catch {
        if (!cancelled) setEligibility({ state: 'UNKNOWN', routes: [], hasUnknown: true });
      } finally { if (!cancelled) setCheckingEligibility(false); }
    };
    void check();
    return () => { cancelled = true; };
  }, [ready, enabled, started, invoice.status, invoice.price_zatoshis, path, eligibilityVersion]);

  useEffect(() => {
    onActiveChange(!ready || started || (enabled && invoice.status === 'pending' && selected));
  }, [ready, enabled, selected, started, invoice.status, onActiveChange]);

  useEffect(() => {
    if (!selected && !started) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [selected, started]);

  useEffect(() => {
    if (!started || settled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const [a, inv] = await Promise.all([request<CryptoAttempt>(path), api.getInvoice(invoice.id)]);
        if (cancelled) return;
        setAttempt(a);
        onInvoice(inv);
      } catch {
        if (!cancelled) setAttempt(a => ({ ...a, stale: true }));
      }
      if (!cancelled) timer = setTimeout(poll, 12000);
    };
    timer = setTimeout(poll, 1000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [started, settled, path, invoice.id, onInvoice]);

  useEffect(() => {
    if (!started && useConnectedWallet && wallet.address) { setRefund(wallet.address); setQuote(null); }
  }, [wallet.address, useConnectedWallet, started, assetId]);

  const run = async (fn: () => Promise<void>) => {
    if (operation.current) return;
    operation.current = true; setBusy(true); setError('');
    try { await fn(); } catch (e) {
      setError(e instanceof PaymentError && e.code === 'BELOW_MINIMUM_OUTPUT' && /^\d+$/.test(e.minimumOutputZatoshis || '')
        ? t('belowMinimum', { amount: formatCryptoUnits(e.minimumOutputZatoshis!, 8) })
        : e instanceof Error ? e.message : t('unavailable'));
    }
    finally { operation.current = false; setBusy(false); }
  };

  useEffect(() => {
    if (!selected || step !== 'review' || started || !eligibleRoute || !refund.trim() || (paymentMode === 'wallet' && !useConnectedWallet)) return;
    let cancelled = false;
    setQuoteLoading(true); setQuote(null); setError('');
    request<CryptoQuote>(`${path}/preview`, { asset_id: assetId, refund_address: refund.trim() })
      .then(q => { if (!cancelled) setQuote(q); })
      .catch(e => { if (!cancelled) setError(e instanceof PaymentError && e.code === 'BELOW_MINIMUM_OUTPUT'
        ? t('belowMinimum', { amount: formatCryptoUnits(e.minimumOutputZatoshis!, 8) }) : e.message || t('unavailable')); })
      .finally(() => { if (!cancelled) setQuoteLoading(false); });
    return () => { cancelled = true; };
  }, [selected, step, started, eligibleRoute, assetId, refund, paymentMode, useConnectedWallet, path, t]);

  useEffect(() => {
    if (selected) stepFocus.current?.focus();
  }, [step, selected, started]);

  const create = () => run(async () => {
    if (!checkoutToken(invoice.id)) throw new Error(t('fullLinkRequired'));
    if (!eligibleRoute) throw new Error(t('availabilityUnknown'));
    try {
      const a = await request<CryptoAttempt>(path, { asset_id: assetId, refund_address: refund.trim() });
      setAttempt(a); setQuote(null);
      onInvoice(await api.getInvoice(invoice.id));
      // A committed quote can differ from the estimate. Always show its exact
      // amount before the buyer explicitly asks the wallet to send.

    } catch (e) {
      // A timeout may have occurred after the durable attempt was created.
      const restored = await restore();
      if (restored.state !== 'NONE') setQuote(null);
      throw e;
    }
  });

  const sendPayment = async () => {
    const a = await restore();
    if (!canSend(a) || !a.quote) throw new Error(t('alreadyStarted'));
    if (!wallet.address || wallet.walletType !== chainToWalletType(a.quote.asset.blockchain)) throw new Error(t('connectFirst'));
    const sameAddress = wallet.walletType === 'evm'
      ? wallet.address.toLowerCase() === a.quote.refundAddress.toLowerCase()
      : wallet.address === a.quote.refundAddress;
    if (!sameAddress) throw new Error(t('refundMismatch'));
    await wallet.prepareSend(a.quote.asset.blockchain);
    let token: string | undefined;
    try {
      const txid = await wallet.sendTransaction(a.quote.depositAddress!, formatCryptoUnits(a.quote.amountIn, a.quote.asset.decimals), a.quote.asset.decimals, a.quote.asset.contractAddress || undefined, a.quote.asset.blockchain, async () => {
        const lock = await request<{ token: string }>(`${path}/send`, { action: 'start' });
        token = lock.token;
        setAttempt({ ...a, sendStarted: true });
      });
      // Keep the lock even if recording the txid fails: wallet may have broadcast.
      setAttempt({ ...a, sendStarted: true, sentTxid: txid });
      await request(`${path}/send`, { action: 'submitted', token, txid });
    } catch (e) {
      if (!token) { await restore(); throw e; }
      const code = (e as { code?: number })?.code;
      if (code === 4001) {
        await request(`${path}/send`, { action: 'rejected', token });
        await restore();
        throw new Error(t('rejected'));
      }
      throw new Error(t('sendUncertain'));
    }
  };
  const send = () => run(sendPayment);

  const copy = async (value: string, key: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(key); setTimeout(() => setCopied(''), 2000); }
    catch { setError(t('copyError')); }
  };

  if (invoice.status === 'draft' || settled || invoice.status === 'detected') return null;
  if (!ready) return <div className={styles.panel} role="status">{error || t('loading')}{error && <button className="btn-secondary" onClick={() => window.location.reload()}>{t('retry')}</button>}</div>;
  if (!enabled && !started) return null;
  if (invoice.status !== 'pending' && !started) return null;

  const q = started ? attempt.quote : quote;
  const deadline = Date.parse(attempt.quote?.deadline || '');
  const expired = started && Number.isFinite(deadline) && now >= deadline;
  const funding = attempt.canManage !== false && attempt.state === 'PENDING_DEPOSIT' && !expired && !attempt.sendStarted && !attempt.stale;
  const availabilityState = checkingEligibility ? 'checking' : eligibility?.state === 'AVAILABLE' ? 'available' : eligibility?.state === 'UNAVAILABLE' ? 'unavailable' : 'unknown';
  const availabilityLabel = t(availabilityState === 'checking' ? 'availabilityCheckingLabel' : availabilityState === 'available' ? 'availabilityAvailableLabel' : availabilityState === 'unavailable' ? 'availabilityUnavailableLabel' : 'availabilityUnknownLabel');
  const showAvailability = selected && availabilityState !== 'available';
  const stepIndex = ['asset', 'method', 'review'].indexOf(step);
  const recapQuote = started ? attempt.quote : step === 'review' ? quote : null;
  const statusHint = ['CREATING', 'NEEDS_REVIEW', 'FAILED'].includes(attempt.state)
    ? t('recovery', { reference: invoice.memo_code })
    : attempt.state === 'REFUNDED' ? t('refundedHint')
    : attempt.state === 'INCOMPLETE_DEPOSIT' ? t('incompleteHint')
    : expired ? t('expiredHint')
    : attempt.stale ? t('stale')
    : invoice.status === 'underpaid' ? t('underpaid') : null;

  const goBack = () => { setStep(step === 'review' ? 'method' : 'asset'); setQuote(null); setError(''); };
  const walletChoices = <div className={styles.walletGrid}>{availableWallets.map(w => <button key={w.providerKey} type="button" className={styles.wallet} disabled={busy || wallet.switching} onClick={() => run(async () => { if (await wallet.connect(w)) { setPaymentMode('wallet'); setStep('review'); } })}>
    <WalletIcon name={w.name} icon={w.icon}/><span>{w.name}</span><span aria-hidden="true">→</span>
  </button>)}</div>;
  const selectedRoute = asset && <div className={styles.routeSummary}><AssetIcon asset={asset}/><span><strong>{asset.symbol}</strong><small>{NETWORK_NAMES[asset.blockchain]}</small></span></div>;
  const walletSummary = useConnectedWallet && <div className={styles.connected}><WalletIcon name={wallet.walletName || ''} icon={connectedWallet?.icon}/><span className={styles.connectedDetails}><strong>{wallet.walletName}</strong><small>{wallet.address?.slice(0,6)}…{wallet.address?.slice(-4)} · {t('connectedLabel')}</small></span><PaymentIcon kind="check"/></div>;

  return <section className={styles.root} aria-label={t('title')}>
    {!started && (!selected || step === 'asset' || showAvailability) && <>
      <div className={styles.tabs} role="group" aria-label={t('method')}>
        <button type="button" aria-pressed={!selected} disabled={busy} onClick={() => setSelected(false)}><span className={styles.methodTitle}><PaymentIcon kind="shield"/>{t('zec')}</span></button>
        <button type="button" className={styles.cryptoTab} aria-pressed={selected} disabled={busy} aria-describedby="crosschain-availability" onClick={() => setSelected(true)}>
          <span className={styles.methodTitle}>
            <span className={styles.tabAvailability} data-state={availabilityState} aria-hidden="true">
              {checkingEligibility ? <span className={styles.loadingDot}/> : <PaymentIcon kind="eye"/>}
            </span>
            {t('other')}
          </span>
        </button>
      </div>
      <span id="crosschain-availability" className={styles.srOnly} role="status" aria-live="polite">{t('other')}: {availabilityLabel}</span>
      {!selected && <p className={styles.methodPrivacy}><PaymentIcon kind="shield"/>{t('zecPrivacy')}</p>}
    </>}
    {selected && <div className={styles.panel}>
      {!started && <ol className={styles.stepper} aria-label={t('checkoutSteps')}>{(['asset','method','review'] as const).map((s,i)=><li key={s} aria-current={step===s?'step':undefined} data-state={i<stepIndex?'done':i===stepIndex?'active':'next'}><span>{i<stepIndex?<PaymentIcon kind="check"/>:i+1}</span>{t(s==='asset'?'chooseAsset':s==='method'?'chooseMethod':'reviewPayment')}</li>)}</ol>}
      {!started && <div className={styles.stepHeader}>
          <h3 tabIndex={-1} ref={stepFocus}>{t(step==='asset'?'chooseAsset':step==='method'?'chooseMethod':'reviewPayment')}</h3>
          {step !== 'asset' && <button type="button" disabled={busy} onClick={goBack}>← {t('back')}</button>}
        </div>}
      <div className={styles.recap}>
      <div className={styles.order}>
        <span>{invoice.merchant_name || 'CipherPay'}</span><h2>{invoice.product_name || t('title')}</h2>
        <strong>{new Intl.NumberFormat(undefined,{style:'currency',currency:invoice.currency || 'EUR'}).format(invoice.amount ?? invoice.price_eur)}</strong>
      </div>
      {(started || step !== 'asset') && <div className={styles.recapPayment}>
        {selectedRoute}
        {(recapQuote || (!started && step === 'review' && quoteLoading)) && <div className={styles.recapAmount}>
          <span>{t(started ? 'paymentAmount' : 'estimatedSend')}</span>
          {!started && quoteLoading ? <div className={styles.quoteLoading} role="status"><span className={styles.loadingDot} aria-hidden="true"/>{t('calculating')}</div>
            : recapQuote && <strong>{formatQuoteSummary(recapQuote.amountIn,recapQuote.asset.decimals,recapQuote.asset.symbol)} {recapQuote.asset.symbol}</strong>}
        </div>}
      </div>}
      {recapQuote && (started || (step === 'review' && !quoteLoading)) && <details className={styles.amountDetails} key={started ? 'payment' : 'quote'}>
        <summary>{t(started ? 'paymentDetails' : 'amountDetails')}</summary>
        <dl>
          <div><dt>{t('exactAmount')}</dt><dd>{formatCryptoUnits(recapQuote.amountIn,recapQuote.asset.decimals)} {recapQuote.asset.symbol}</dd></div>
          <div><dt>{t('invoiceTotalLabel')}</dt><dd>{formatCryptoUnits(String(invoice.price_zatoshis),8)} ZEC</dd></div>
          <div className={styles.refundDetail}><dt>{t('refundAddress',{network:NETWORK_NAMES[recapQuote.asset.blockchain]})}</dt><dd>{recapQuote.refundAddress}</dd></div>
          {started && <div><dt>{t('referenceLabel')}</dt><dd>{invoice.memo_code}</dd></div>}
        </dl>
        {started ? <>
          {walletSummary}
          <p>{t('fees')}</p>
          <p>{t('publicSource')} · NEAR Intents. {t('privacy')}</p>
        </> : <p>{t('quoteMayChange')}</p>}
      </details>}
      {!started && step === 'review' && (recapQuote || quoteLoading) && <p className={styles.hint}>{t('fees')}</p>}
      {!started && step === 'review' && quote && typeof quote.timeEstimate === 'number' && quote.timeEstimate>0 && <p className={styles.hint}>{t('estimate',{minutes:Math.max(1,Math.ceil(quote.timeEstimate/60))})}</p>}
      {started && <>
        <PaymentJourney attempt={attempt} expired={expired} awaitingWallet={busy && useConnectedWallet && !attempt.sentTxid && attempt.state === 'PENDING_DEPOSIT'} showReminder={!error && !statusHint}/>
        <div className={styles.status}>
          {attempt.canManage===false && <p>{t('fullLinkRequired')}</p>}
          {attempt.state==='NEEDS_REVIEW' && !attempt.quote && <p>{t('setupNotSent')}</p>}
          {!error && statusHint && <p>{statusHint}</p>}
        </div>
      </>}
      </div>
      {!started && showAvailability && <div className={styles.availabilityMessage} aria-busy={checkingEligibility}>
        {checkingEligibility ? <div className={styles.availabilityLoading}>
          <strong>{t('checkingAvailability')}</strong>
          <p>{t('checkingAvailabilityHint')}</p>
        </div> : <p>{eligibility?.state === 'UNAVAILABLE' ? t('amountUnavailable') : t('availabilityUnknown')}</p>}
        {!checkingEligibility && <button type="button" disabled={busy} onClick={() => setEligibilityVersion(v=>v+1)}>{t('checkAgain')}</button>}
      </div>}
      {!started && !showAvailability && <>
        <div className={styles.stepContent} key={step}>
          {step === 'asset' ? <>
            <PaymentAssetSelector assets={assets} selected={asset} disabled={busy || checkingEligibility} eligibility={eligibility} onChange={a=>{setAssetId(a.assetId);setQuote(null);setRefund('');setError('');}}/>
            <p className={styles.hint}>{t('networkMatch')}</p>
            <button className="btn-primary" type="button" disabled={!eligibleRoute || busy} onClick={()=>setStep('method')}>{t('next')}</button>
          </> : <>
            {step === 'method' ? <>
              <div className={styles.paymentChoices} role="tablist" aria-label={t('howToPay')} onKeyDown={e=>{
                if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
                e.preventDefault();
                const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
                const index = e.key==='Home' ? 0 : e.key==='End' ? tabs.length-1 : (tabs.indexOf(document.activeElement as HTMLButtonElement)+1)%tabs.length;
                tabs[index]?.focus(); tabs[index]?.click();
              }}>
                {(['wallet','manual'] as const).map(mode=><button key={mode} type="button" role="tab" id={`${methodId}-${mode}`} aria-controls={`${methodId}-panel`} aria-selected={paymentMode===mode} tabIndex={paymentMode===mode?0:-1} disabled={busy} onClick={()=>{if(paymentMode!==mode){setPaymentMode(mode);setRefund('');setError('');}}}>{t(mode==='wallet'?'walletTab':'manualTab')}</button>)}
              </div>
              <div className={styles.methodPanel} role="tabpanel" id={`${methodId}-panel`} aria-labelledby={`${methodId}-${paymentMode}`}>
              {paymentMode==='wallet' ? useConnectedWallet ? <>{walletSummary}<button className={styles.textButton} type="button" onClick={()=>{wallet.disconnect();setRefund('');}}>{t('disconnect')}</button><button type="button" className="btn-primary" onClick={()=>setStep('review')}>{t('reviewPayment')}</button></> : <>
                <p className={styles.hint}>{t('walletsForNetwork',{network:NETWORK_NAMES[asset?.blockchain || ''] || ''})}</p>{walletChoices}
                {!availableWallets.length && <p className={styles.hint}>{t('manualAvailable')}</p>}
              </> : <>
                <p className={styles.hint}>{t('manualChoiceHint')}</p>
                <label className={styles.label} htmlFor="crypto-refund">{t('refundAddress',{network:NETWORK_NAMES[asset?.blockchain || ''] || ''})}</label>
                <input id="crypto-refund" className={styles.input} value={refund} disabled={busy} spellCheck={false} autoComplete="off" placeholder={t('addressPlaceholder')} onChange={e=>setRefund(e.target.value)}/>
                <p className={styles.hint}>{t('refundHint')}</p>
                <button type="button" className="btn-primary" disabled={!refund.trim() || !eligibleRoute || busy} onClick={()=>setStep('review')}>{t('reviewPayment')}</button>
              </>}
              </div>
            </> : <>
              {!quoteLoading && quote && <>
                <div className={styles.paymentAction}>
                  {walletSummary}
                <button type="button" className="btn-primary" disabled={busy || !eligibleRoute} onClick={create}>{busy?t('loading'):t('reviewFinal')}</button>
                </div>
              </>}
              {!quoteLoading && !quote && error && <button type="button" className={styles.textButton} onClick={()=>{setStep('method');setError('');}}>{t('back')}</button>}
            </>}
          </>}
        </div>
      </>}
      {started && <>
        {funding && q && !busy && <>
          {useConnectedWallet ? <button type="button" className="btn-primary" disabled={busy || !canSend(attempt,now)} onClick={send}>{busy?t('confirmWallet'):t('payWallet',{wallet:wallet.walletName || ''})}</button> : <details className={styles.manual}><summary>{t('connectWallet')}</summary>{walletChoices}{!availableWallets.length && <p>{t('manualAvailable')}</p>}</details>}
          <details className={styles.manual} open={!useConnectedWallet}><summary>{t('manual')}</summary>
            <p>{t('networkOnly',{symbol:q.asset.symbol,network:NETWORK_NAMES[q.asset.blockchain]})}</p>
            <div className={styles.manualAmount}><span>{t('sendExactly')}</span><strong>{formatCryptoUnits(q.amountIn,q.asset.decimals)} {q.asset.symbol}</strong><button type="button" onClick={()=>copy(formatCryptoUnits(q.amountIn,q.asset.decimals),'amount')}>{copied==='amount'?t('copied'):t('copyAmount')}</button></div>
            <div className={styles.qr}><QRCode data={q.depositAddress!} size={208}/></div><code className={styles.address}>{q.depositAddress}</code>
            <div className={styles.buttons}><button type="button" onClick={()=>copy(q.depositAddress!,'address')}>{copied==='address'?t('copied'):t('copyAddress')}</button></div>
            {q.depositMemo && <p>{t('requiredMemo')}: <code>{q.depositMemo}</code></p>}
            <small>{t('sendBefore',{time:new Date(q.deadline!).toLocaleTimeString()})}</small>
          </details>
        </>}
      </>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {!started && <details className={styles.privacyDetails}><summary><PaymentIcon kind="eye"/>{t('publicSource')} · NEAR Intents</summary><p>{t('privacy')}</p></details>}
    </div>}
  </section>;
}
