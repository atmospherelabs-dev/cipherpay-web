'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { api, type Invoice, type LumaPassData } from '@/lib/api';
import { validateZcashAddress } from '@/lib/validation';
import { currencySymbol } from '@/lib/currency';
import { QRCode } from '@/components/QRCode';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Link } from '@/i18n/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { Spinner } from '@/components/Spinner';

function useCountdown(expiresAt: string) {
  const [text, setText] = useState('');
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); setText('EXPIRED'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(`${m}:${s.toString().padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return { text, expired };
}

function truncateAddress(addr: string): string {
  if (addr.length <= 24) return addr;
  return `${addr.slice(0, 14)}...${addr.slice(-10)}`;
}

function CopyIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function isSafeReturnUrl(url: string, merchantOrigin?: string | null): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname;
    if (host.endsWith('.myshopify.com') || host.endsWith('.cipherpay.app') || host === 'cipherpay.app') return true;
    if (merchantOrigin) return parsed.origin === merchantOrigin;
    return false;
  } catch {
    return false;
  }
}

function getShopOrigin(returnUrl: string | null): string | null {
  if (!returnUrl) return null;
  try { return new URL(returnUrl).origin; } catch { return null; }
}

export default function CheckoutClient({ invoiceId }: { invoiceId: string }) {
  const t = useTranslations('checkout');
  const tc = useTranslations('common');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [refundAddr, setRefundAddr] = useState('');
  const [refundSaved, setRefundSaved] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [ticketMeta, setTicketMeta] = useState<{ event_date?: string | null; event_location?: string | null; price_label?: string | null }>({});
  const [lumaPass, setLumaPass] = useState<LumaPassData | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get('return_url') || null;
  const returnUrl = rawReturnUrl && isSafeReturnUrl(rawReturnUrl, invoice?.merchant_origin) ? rawReturnUrl : null;
  const shopOrigin = getShopOrigin(returnUrl);
  const { theme, toggleTheme, mounted } = useTheme();

  useEffect(() => {
    if (!mounted) return;
    const requested = searchParams.get('theme') as 'dark' | 'light' | null;
    if (requested && requested !== theme) toggleTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    api.getInvoice(invoiceId).then(setInvoice).catch((e) => setError(e.message));
  }, [invoiceId]);

  const handleFinalize = async () => {
    setFinalizing(true);
    setFinalizeError(null);
    try {
      const finalized = await api.finalizeInvoice(invoiceId);
      setInvoice(finalized);
    } catch (e: unknown) {
      setFinalizeError(e instanceof Error ? e.message : 'Failed to lock rate. Please try again.');
    } finally {
      setFinalizing(false);
    }
  };

  useEffect(() => {
    if (!invoice || invoice.status === 'confirmed' || invoice.status === 'expired' || invoice.status === 'draft') return;
    const es = api.streamInvoice(invoiceId);
    eventSourceRef.current = es;
    es.addEventListener('status', (event) => {
      try {
        const data = JSON.parse(event.data);
        setInvoice((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.status,
            detected_txid: data.txid || prev.detected_txid,
            received_zatoshis: data.received_zatoshis ?? prev.received_zatoshis,
            price_zatoshis: data.price_zatoshis ?? prev.price_zatoshis,
          };
        });
        if (data.status === 'detected' || data.status === 'confirmed' || data.status === 'expired') es.close();
      } catch { /* ignore */ }
    });
    es.onerror = () => {};
    return () => { es.close(); eventSourceRef.current = null; };
  }, [invoice?.status, invoiceId]);

  const [ticketPending, setTicketPending] = useState(false);

  // Private event: poll for CipherPay ticket
  useEffect(() => {
    if (!invoice) return;
    if (!invoice.is_event) return;
    if (invoice.is_luma) return;
    if (invoice.status !== 'detected' && invoice.status !== 'confirmed') return;
    if (ticketCode) return;
    let cancelled = false;
    let retries = 0;

    const poll = () => {
      api.getTicketByInvoice(invoice.id)
        .then((ticket) => {
          if (!cancelled) {
            setTicketCode(ticket.code);
            setTicketMeta({ event_date: ticket.event_date, event_location: ticket.event_location, price_label: ticket.price_label });
            setTicketPending(false);
          }
        })
        .catch(() => {
          if (cancelled) return;
          retries++;
          if (invoice.status === 'confirmed') {
            if (retries < 3) { setTimeout(poll, 2000); return; }
            setTicketPending(false);
            return;
          }
          if (retries >= 60) { setTicketPending(false); return; }
          setTicketPending(true);
          setTimeout(poll, 5000);
        });
    };
    poll();
    return () => { cancelled = true; };
  }, [invoice?.status, invoice?.id, invoice?.is_event, invoice?.is_luma, ticketCode]);

  // Luma event: poll for Luma pass
  useEffect(() => {
    if (!invoice) return;
    if (!invoice.is_luma) return;
    if (invoice.status !== 'detected' && invoice.status !== 'confirmed') return;
    if (lumaPass?.status === 'registered' || lumaPass?.status === 'failed') return;
    let cancelled = false;
    let retries = 0;

    const poll = () => {
      api.getLumaPass(invoice.id)
        .then((data) => {
          if (cancelled) return;
          if (data.status === 'registered' || data.status === 'failed') {
            setLumaPass(data);
            setTicketPending(false);
          } else if (data.status === 'pending') {
            setTicketPending(true);
            retries++;
            if (retries < 60) setTimeout(poll, 3000);
          } else {
            setTicketPending(true);
            retries++;
            if (retries < 60) setTimeout(poll, 5000);
          }
        })
        .catch(() => {
          if (cancelled) return;
          retries++;
          if (retries < 60) setTimeout(poll, 5000);
        });
    };
    poll();
    return () => { cancelled = true; };
  }, [invoice?.status, invoice?.id, invoice?.is_luma, lumaPass?.status]);

  const address = invoice?.payment_address || '';
  const zcashUri = invoice?.zcash_uri || '';

  const countdown = useCountdown(invoice?.expires_at || new Date().toISOString());

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setToast(t('labelCopied', { label }));
      setTimeout(() => setToast(''), 2000);
    });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13 }}>
        <div className="checkout-status expired" style={{ maxWidth: 420, width: '100%' }}>
          <div>{t('invoiceNotFound')}</div>
          <div style={{ fontSize: 10, marginTop: 6, color: 'var(--cp-text-muted)', fontWeight: 400 }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  const formatFiat = (amt: number, cur: string) => {
    const sym = currencySymbol(cur);
    return amt < 0.01 ? `${sym}${amt}` : `${sym}${amt.toFixed(2)}`;
  };
  const invCurrency = invoice.currency || 'EUR';
  const invAmount = invoice.amount != null ? invoice.amount : invoice.price_eur;
  const primaryPrice = formatFiat(invAmount, invCurrency);
  const secondaryPrice = invCurrency !== 'EUR' ? formatFiat(invoice.price_eur, 'EUR') : (invoice.price_usd ? formatFiat(invoice.price_usd, 'USD') : null);
  const showReceipt = invoice.status === 'detected' || invoice.status === 'confirmed';
  const isUnderpaid = invoice.status === 'underpaid';
  const remainingZatoshis = invoice.price_zatoshis - invoice.received_zatoshis;
  const remainingZec = remainingZatoshis > 0 ? remainingZatoshis / 1e8 : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      <header className="site-header">
        <Link href="/"><Logo size="sm" /></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(invoice.status === 'pending' || isUnderpaid) && <span className="tag">{invoice.is_donation ? t('donation') : countdown.text}</span>}
          {showReceipt && <span className="tag">{t('paid')}</span>}
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center" style={{ padding: '32px 24px' }}>
        <div style={{ maxWidth: 440, width: '100%' }}>

          {/* ── Draft: pre-checkout (Lock Rate & Pay) ── */}
          {invoice.status === 'draft' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 28, padding: '20px 0', borderBottom: '1px solid var(--cp-border)' }}>
                {invoice.merchant_name && (
                  <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--cp-text-muted)', marginBottom: 8 }}>
                    {invoice.merchant_name.toUpperCase()}
                  </div>
                )}
                {invoice.product_name && (
                  <div style={{ fontSize: 14, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 12 }}>
                    {invoice.product_name}
                  </div>
                )}
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--cp-text)' }}>
                  {primaryPrice}
                </div>
                <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 8, lineHeight: 1.6 }}>
                  {t('draftMessage')}
                </div>
              </div>

              <button
                onClick={handleFinalize}
                disabled={finalizing}
                className="btn-primary"
                style={{ width: '100%', textTransform: 'uppercase', padding: '16px 0', fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}
              >
                {finalizing ? t('lockingRate') : t('lockRate')}
              </button>

              {finalizeError && (
                <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 12 }}>{finalizeError}</div>
              )}

              <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1, lineHeight: 1.6 }}>
                {t('rateExplanation')}
              </div>
            </div>
          )}

          {/* ── Payment UI ── */}
          {invoice.status === 'pending' && (
            <div style={{ textAlign: 'center' }}>

              {/* Order info — prominent */}
              <div style={{ marginBottom: 28, padding: '20px 0', borderBottom: '1px solid var(--cp-border)' }}>
                {invoice.is_donation ? (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 16, color: 'var(--cp-text)', fontWeight: 700, lineHeight: 1.3 }}>
                      {invoice.donation_meta?.campaign_name || invoice.product_name || t('donationTo', { org: invoice.merchant_name || '' })}
                    </div>
                    {invoice.merchant_name && (
                      <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 4 }}>
                        {t('donationBy', { org: invoice.merchant_name })}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {invoice.merchant_name && (
                      <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--cp-text-muted)', marginBottom: 8 }}>
                        {invoice.merchant_name.toUpperCase()}
                      </div>
                    )}
                    {(invoice.product_name || invoice.size) && (
                      <div style={{ fontSize: 14, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 12 }}>
                        {invoice.product_name}{invoice.size ? ` · ${invoice.size}` : ''}
                      </div>
                    )}
                  </>
                )}
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--cp-text)' }}>
                  {primaryPrice}{secondaryPrice && <span style={{ fontSize: 16, color: 'var(--cp-text-muted)', fontWeight: 400, marginInlineStart: 8 }}>{secondaryPrice}</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--cp-cyan)', marginTop: 4 }}>≈ {invoice.price_zec.toFixed(8)} ZEC</div>
                <div style={{ marginTop: 12, fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1 }}>
                  {t('expiresIn', { time: countdown.text })}
                </div>
              </div>

              {/* QR Code — dense mode: smaller logo + lower error correction for long Zcash URIs */}
              {zcashUri && (
                <div className="qr-container" style={{ marginBottom: 12 }}>
                  <QRCode data={zcashUri} size={300} dense />
                </div>
              )}

              {/* Address pill — always visible under QR */}
              <button
                onClick={() => {
                  copy(address, 'Address');
                  setCopiedAddress(true);
                  setTimeout(() => setCopiedAddress(false), 2000);
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--cp-bg)',
                  border: `1px solid ${copiedAddress ? 'rgba(86, 212, 200, 0.4)' : 'var(--cp-border)'}`,
                  borderRadius: 20,
                  padding: '6px 14px', cursor: 'pointer', fontSize: 10,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  color: 'var(--cp-cyan)', transition: 'border-color 0.3s',
                  marginBottom: 8,
                }}
              >
                <span>{truncateAddress(address)}</span>
                {copiedAddress ? <CheckIcon size={10} /> : <CopyIcon size={10} />}
              </button>

              <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', lineHeight: 1.6, marginBottom: 20, opacity: 0.7 }}>
                {t('mempoolHint')}
              </div>

              {/* Open in Wallet */}
              {zcashUri && (
                <a href={zcashUri} className="btn-primary" style={{ width: '100%', textTransform: 'uppercase', marginBottom: 24 }}>
                  {t('openInWallet')}
                </a>
              )}

              {/* Advanced toggle (CLI, refund address) */}
              <button
                type="button"
                onClick={() => setShowManual(!showManual)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <div style={{ flex: 1, height: 1, background: 'var(--cp-border)' }} />
                <span style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ transition: 'transform 0.2s', transform: showManual ? 'rotate(90deg)' : 'rotate(0deg)', fontSize: 8 }}>▸</span>
                  {t('manualPayment')}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--cp-border)' }} />
              </button>

              {showManual && (
                <div style={{ marginTop: 20 }}>
                  {/* Pay with CLI */}
                  {invoice?.id && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>
                        {t('payWithCli')}
                      </div>
                      <div
                        onClick={() => copy(`zipher pay ${typeof window !== 'undefined' ? window.location.origin : ''}/pay/${invoice.id}`, 'Command')}
                        style={{
                          background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 6,
                          padding: '10px 14px', cursor: 'pointer', fontSize: 10,
                          fontFamily: 'var(--font-geist-mono), monospace',
                          color: 'var(--cp-cyan)', display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', gap: 8, transition: 'border-color 0.15s',
                        }}
                      >
                        <code style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          zipher pay {typeof window !== 'undefined' ? window.location.origin : ''}/pay/{invoice.id}
                        </code>
                        <CopyIcon size={11} />
                      </div>
                    </div>
                  )}

                  {/* Refund address (hidden for donations) */}
                  {!invoice.is_donation && <div style={{ borderTop: '1px solid var(--cp-border)', paddingTop: 16, marginBottom: 16, textAlign: 'start' }}>
                    <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 1, marginBottom: 4 }}>
                      {t('refundAddress')} <span style={{ fontWeight: 400 }}>({t('optional')})</span>
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', opacity: 0.7, marginBottom: 8, lineHeight: 1.5 }}>
                      {t('refundPrivacyHint')}
                      {invoice?.is_event && (
                        <> {t('refundEventHint')}</>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        value={refundAddr}
                        onChange={(e) => { setRefundAddr(e.target.value); setRefundSaved(false); }}
                        placeholder="u1..."
                        className="input"
                        style={{ fontSize: 10, flex: 1 }}
                      />
                      <button
                        onClick={async () => {
                          if (!refundAddr.trim()) return;
                          const addrErr = validateZcashAddress(refundAddr.trim());
                          if (addrErr) { setToast(addrErr); return; }
                          try {
                            await api.saveRefundAddress(invoiceId, refundAddr.trim());
                            setRefundSaved(true);
                            setTimeout(() => setRefundSaved(false), 2000);
                          } catch (e: unknown) {
                            setToast(e instanceof Error ? e.message : 'Failed to save');
                          }
                        }}
                        className="btn"
                        style={{ fontSize: 10, whiteSpace: 'nowrap' }}
                      >
                        {refundSaved ? tc('saved') : tc('save')}
                      </button>
                    </div>
                  </div>}
                </div>
              )}

            </div>
          )}

          {/* ── Underpaid: partial payment received ── */}
          {isUnderpaid && (
            <div style={{ textAlign: 'center' }}>
              <div className="checkout-status underpaid" style={{ marginBottom: 24, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{t('partialReceived')}</div>
                <div style={{ fontSize: 11, marginTop: 8, color: 'var(--cp-text-muted)', fontWeight: 400 }}>
                  {t('receivedOf', { received: (invoice.received_zatoshis / 1e8).toFixed(8), total: invoice.price_zec.toFixed(8) })}
                </div>
                <div style={{ fontSize: 12, marginTop: 12, color: '#f97316', fontWeight: 600 }}>
                  {t('sendRemaining', { remaining: remainingZec.toFixed(8) })}
                </div>
              </div>

              {/* Updated QR for remaining amount */}
              {address && remainingZec > 0 && (
                <div className="qr-container" style={{ marginBottom: 12 }}>
                  <QRCode data={`zcash:${address}?amount=${remainingZec.toFixed(8)}`} size={300} dense />
                </div>
              )}

              <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1, marginBottom: 16 }}>
                {t('scanRemaining')}
              </div>

              {address && remainingZec > 0 && (
                <a href={`zcash:${address}?amount=${remainingZec.toFixed(8)}`} className="btn-primary" style={{ width: '100%', textTransform: 'uppercase', marginBottom: 24 }}>
                  {t('openInWallet')}
                </a>
              )}

              {/* Payment Address */}
              <div style={{ textAlign: 'start', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--cp-text-muted)', letterSpacing: 1 }}>{t('paymentAddress')}</span>
                  <button
                    onClick={() => copy(address, 'Address')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--cp-cyan)', cursor: 'pointer', fontSize: 9, letterSpacing: 1, fontFamily: 'inherit', padding: 0 }}
                  >
                    <CopyIcon size={11} /> {tc('copy')}
                  </button>
                </div>
                <div
                  onClick={() => copy(address, 'Address')}
                  style={{
                    background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4,
                    padding: '10px 12px', cursor: 'pointer', fontSize: 10, color: 'var(--cp-cyan)',
                    wordBreak: 'break-all', lineHeight: 1.5,
                  }}
                >
                  {truncateAddress(address)}
                </div>
              </div>

              <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1 }}>
                {t('expiresIn', { time: countdown.text })}
              </div>
            </div>
          )}

          {/* ── Receipt (detected or confirmed) ── */}
          {showReceipt && (
            <ConfirmedReceipt invoice={invoice} returnUrl={returnUrl} ticketCode={ticketCode} ticketPending={ticketPending} ticketMeta={ticketMeta} lumaPass={lumaPass} />
          )}

          {/* ── Expired ── */}
          {invoice.status === 'expired' && (
            <div className="checkout-status expired">
              <div>{t('invoiceExpired')}</div>

              {/* In-flight payment detected on an expired subscription invoice */}
              {invoice.subscription_id && (invoice.received_zatoshis > 0 || invoice.detected_txid) ? (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--cp-cyan)', fontWeight: 600, marginBottom: 8 }}>
                    {t('paymentDetected')}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', fontWeight: 400, lineHeight: 1.6 }}>
                    {t('paymentDetectedDesc')}
                  </div>
                </div>
              ) : invoice.subscription_id ? (
                /* Expired subscription invoice — allow re-finalization */
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', fontWeight: 400, marginBottom: 16, lineHeight: 1.6 }}>
                    {t('expiredRetry')}
                  </div>
                  <button
                    onClick={handleFinalize}
                    disabled={finalizing}
                    className="btn-primary"
                    style={{ width: '100%', textTransform: 'uppercase', padding: '14px 0', fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}
                  >
                    {finalizing ? t('lockingRate') : t('lockRate')}
                  </button>
                  {finalizeError && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 8 }}>{finalizeError}</div>
                  )}
                </div>
              ) : invoice.received_zatoshis > 0 ? (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', fontWeight: 400, marginBottom: 12 }}>
                    {t('partialExpired', { amount: (invoice.received_zatoshis / 1e8).toFixed(8) })}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      value={refundAddr}
                      onChange={(e) => { setRefundAddr(e.target.value); setRefundSaved(false); }}
                      placeholder="u1..."
                      className="input"
                      style={{ fontSize: 10, flex: 1 }}
                    />
                    <button
                      onClick={async () => {
                        if (!refundAddr.trim()) return;
                        const addrErr = validateZcashAddress(refundAddr.trim());
                        if (addrErr) { setToast(addrErr); return; }
                        try {
                          await api.saveRefundAddress(invoiceId, refundAddr.trim());
                          setRefundSaved(true);
                          setTimeout(() => setRefundSaved(false), 3000);
                        } catch (e: unknown) {
                          setToast(e instanceof Error ? e.message : 'Failed to save');
                        }
                      }}
                      className="btn"
                      style={{ fontSize: 10, whiteSpace: 'nowrap' }}
                    >
                      {refundSaved ? tc('saved') : tc('save')}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 10, marginTop: 6, color: 'var(--cp-text-muted)', fontWeight: 400 }}>
                  {t('expiredMessage')}
                </div>
              )}
              {shopOrigin && (
                <a
                  href={shopOrigin}
                  className="btn"
                  style={{ display: 'inline-block', marginTop: 16, textDecoration: 'none', textTransform: 'uppercase' }}
                >
                  {t('backToStore')}
                </a>
              )}
            </div>
          )}
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--cp-border)', padding: '16px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--cp-text-muted)', letterSpacing: 1 }}>
          Powered by <span style={{ color: 'var(--cp-cyan)' }}>CipherPay</span>
        </span>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

async function saveReceiptImage(el: HTMLElement, ticketCode: string) {
  el.style.padding = '16px';
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(el, {
    backgroundColor: '#0a0e14',
    scale: 2,
    useCORS: true,
  });
  el.style.padding = '0';
  const link = document.createElement('a');
  link.download = `ticket-${ticketCode.slice(4, 12)}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function ReceiptDetails({ invoice, row, label, primaryPrice, secondaryPrice, t }: {
  invoice: Invoice; row: React.CSSProperties; label: React.CSSProperties;
  primaryPrice: string; secondaryPrice: string | null;
  t: ReturnType<typeof useTranslations>;
}) {
  const locale = useLocale();
  const isDonation = !!invoice.is_donation;

  return (
    <>
      <div style={{ border: '1px solid var(--cp-border)', borderRadius: 6, padding: '0 20px' }}>
        {!isDonation && invoice.merchant_name && (
          <div style={row}>
            <span style={label}>{t('merchant')}</span>
            <span style={{ fontWeight: 600 }}>{invoice.merchant_name}</span>
          </div>
        )}
        <div style={row}>
          <span style={label}>{isDonation ? t('campaign') : t('item')}</span>
          {isDonation ? (
            invoice.donation_meta?.slug ? (
              <a href={`/${locale}/donate/${invoice.donation_meta.slug}`} style={{ fontWeight: 600, color: 'var(--cp-cyan, #56D4C8)', textDecoration: 'none' }}>
                {invoice.donation_meta?.campaign_name || invoice.product_name || t('donationTo', { org: invoice.merchant_name || '' })}
              </a>
            ) : (
              <span style={{ fontWeight: 600 }}>
                {invoice.donation_meta?.campaign_name || invoice.product_name || t('donationTo', { org: invoice.merchant_name || '' })}
              </span>
            )
          ) : (
            <span style={{ fontWeight: 600 }}>
              {invoice.product_name}{invoice.size ? ` · ${invoice.size}` : ''}
            </span>
          )}
        </div>
        {isDonation && invoice.merchant_name && (
          <div style={row}>
            <span style={label}>{t('organizer')}</span>
            <span style={{ fontWeight: 600 }}>{invoice.merchant_name}</span>
          </div>
        )}
        <div style={row}>
          <span style={label}>{t('amount')}</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{primaryPrice}{secondaryPrice && <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--cp-text-muted)', marginInlineStart: 6 }}>{secondaryPrice}</span>}</span>
        </div>
        <div style={row}>
          <span style={label}>{t('zecPaid')}</span>
          <span style={{ color: 'var(--cp-cyan)', fontWeight: 600 }}>
            {invoice.received_zatoshis > 0 ? (invoice.received_zatoshis / 1e8).toFixed(8) : invoice.price_zec.toFixed(8)}
          </span>
        </div>
        <div style={row}>
          <span style={label}>{t('reference')}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 }}>{invoice.memo_code}</span>
        </div>
        {invoice.detected_txid && (() => {
          const isTestnet = invoice.payment_address?.startsWith('utest');
          const explorerBase = isTestnet ? 'https://testnet.cipherscan.app' : 'https://cipherscan.app';
          return (
            <div style={{ ...row, borderBottom: 'none', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
              <span style={label}>{t('txid')}</span>
              <a
                href={`${explorerBase}/tx/${invoice.detected_txid}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 9, color: 'var(--cp-cyan)', wordBreak: 'break-all', lineHeight: 1.5, textDecoration: 'none' }}
              >
                {invoice.detected_txid}
              </a>
            </div>
          );
        })()}
      </div>
      {invoice.overpaid && invoice.received_zatoshis > invoice.price_zatoshis && !invoice.is_donation && (
        <div style={{
          marginTop: 16, padding: '14px 20px', borderRadius: 6,
          background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)',
          fontSize: 11, color: '#f97316', lineHeight: 1.6,
        }}>
          {t('overpaidMessage', { amount: ((invoice.received_zatoshis - invoice.price_zatoshis) / 1e8).toFixed(8) })}
        </div>
      )}
    </>
  );
}

function ConfirmedReceipt({ invoice, returnUrl, ticketCode, ticketPending, ticketMeta, lumaPass }: {
  invoice: Invoice; returnUrl: string | null; ticketCode: string | null; ticketPending: boolean;
  ticketMeta?: { event_date?: string | null; event_location?: string | null; price_label?: string | null };
  lumaPass?: LumaPassData | null;
}) {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const receiptRef = useRef<HTMLDivElement>(null);
  const isDonation = !!invoice.is_donation;
  const shouldRedirect = returnUrl && !ticketPending && !isDonation;
  const [redirectIn, setRedirectIn] = useState(shouldRedirect ? 5 : -1);

  useEffect(() => {
    if (shouldRedirect && redirectIn < 0) setRedirectIn(5);
  }, [shouldRedirect, redirectIn]);

  useEffect(() => {
    if (!shouldRedirect || redirectIn <= 0) return;
    const id = setTimeout(() => setRedirectIn(prev => prev - 1), 1000);
    return () => clearTimeout(id);
  }, [redirectIn, shouldRedirect]);

  useEffect(() => {
    if (redirectIn === 0 && returnUrl) {
      window.location.href = returnUrl;
    }
  }, [redirectIn, returnUrl]);

  const formatFiat2 = (amt: number, cur: string) => {
    const sym = currencySymbol(cur);
    return amt < 0.01 ? `${sym}${amt}` : `${sym}${amt.toFixed(2)}`;
  };
  const invCurrency = invoice.currency || 'EUR';
  const invAmount = invoice.amount != null ? invoice.amount : invoice.price_eur;
  const primaryPrice = formatFiat2(invAmount, invCurrency);
  const secondaryPrice = invCurrency !== 'EUR' ? formatFiat2(invoice.price_eur, 'EUR') : (invoice.price_usd ? formatFiat2(invoice.price_usd, 'USD') : null);

  const row: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 0', borderBottom: '1px solid var(--cp-border)',
    fontSize: 12,
  };
  const label: React.CSSProperties = { color: 'var(--cp-text-muted)', letterSpacing: 1, fontSize: 10 };

  return (
    <div>
      {isDonation ? (
        <div style={{
          marginTop: 0, marginBottom: 20, borderRadius: 6,
          border: '1px solid rgba(86, 212, 200, 0.15)',
          background: 'linear-gradient(180deg, rgba(86, 212, 200, 0.06) 0%, transparent 100%)',
          padding: '28px 20px 24px', textAlign: 'center',
        }}>
          <div style={{
            fontSize: 11, letterSpacing: 3, fontWeight: 700,
            background: 'linear-gradient(135deg, #5B9CF6, #56D4C8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 14,
          }}>
            {t('thankYouDonation')}
          </div>

          {invoice.donation_meta?.campaign_name && (
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>
              {invoice.donation_meta.slug ? (
                <a href={`/${locale}/donate/${invoice.donation_meta.slug}`} style={{ color: 'var(--cp-text)', textDecoration: 'none' }}>
                  {invoice.donation_meta.campaign_name}
                </a>
              ) : invoice.donation_meta.campaign_name}
            </div>
          )}
          {invoice.merchant_name && (
            <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 16 }}>
              {t('donationBy', { org: invoice.merchant_name })}
            </div>
          )}

          <div style={{
            fontSize: 12, color: 'var(--cp-text-dim)', lineHeight: 1.7,
            maxWidth: 340, margin: '0 auto',
          }}>
            {invoice.donation_meta?.thank_you || t('donationConfirmed')}
          </div>

          {invoice.donation_meta?.contact_email && (
            <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 14, opacity: 0.7 }}>
              {t('donationContact', { email: invoice.donation_meta.contact_email })}
            </div>
          )}

          {invoice.donation_meta?.slug && (
            <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'center' }}>
              <a
                href={`https://x.com/intent/tweet?${new URLSearchParams({
                  text: invoice.donation_meta.social_share_text || t('donationShareDefault'),
                  url: `${typeof window !== 'undefined' ? window.location.origin : ''}/${locale}/donate/${invoice.donation_meta.slug}`,
                }).toString()}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 20px', fontSize: 11, fontWeight: 600,
                  borderRadius: 6, border: '1px solid rgba(86, 212, 200, 0.2)',
                  background: 'rgba(86, 212, 200, 0.08)', color: 'var(--cp-text)',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(86, 212, 200, 0.14)';
                  e.currentTarget.style.borderColor = 'rgba(86, 212, 200, 0.35)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(86, 212, 200, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(86, 212, 200, 0.2)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                {t('shareDonation')}
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="checkout-status confirmed" style={{ marginTop: 0, marginBottom: 20, padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{t('paymentAccepted')}</div>
        </div>
      )}

      {ticketPending && !ticketCode && !lumaPass && (
        <div style={{
          marginTop: 18, border: '1px solid var(--cp-border)', borderRadius: 6, padding: '24px 20px',
          textAlign: 'center',
        }}>
          <Spinner size={20} />
          <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginTop: 12, fontWeight: 600 }}>
            {invoice.is_luma ? t('lumaRegistering') : t('ticketGenerating')}
          </div>
          <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 6, lineHeight: 1.6 }}>
            {invoice.is_luma ? t('lumaRegisteringHint') : t('ticketGeneratingHint')}
          </div>
        </div>
      )}

      {lumaPass?.status === 'registered' && (
        <>
          <div ref={receiptRef} style={{ borderRadius: 6, background: 'var(--cp-bg, #0a0e14)' }}>
            <div style={{ border: '1px solid var(--cp-border)', borderRadius: 6, padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 16 }}>
                {t('lumaYoureIn')}
              </div>

              {lumaPass.guest?.check_in_qr_code && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 1.5, marginBottom: 8 }}>
                    {t('lumaCheckInQr')}
                  </div>
                  <div className="qr-container">
                    <QRCode data={lumaPass.guest.check_in_qr_code} size={180} />
                  </div>
                </div>
              )}

              {(lumaPass.event_date || lumaPass.event_location || lumaPass.ticket_type) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', marginBottom: 14 }}>
                  {lumaPass.event_title && (
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cp-text)' }}>{lumaPass.event_title}</div>
                  )}
                  {lumaPass.event_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--cp-text-muted)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <span>{(() => { try { return new Date(lumaPass.event_date!).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return lumaPass.event_date; } })()}</span>
                    </div>
                  )}
                  {lumaPass.event_location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--cp-text-muted)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span>{lumaPass.event_location}</span>
                    </div>
                  )}
                  {lumaPass.ticket_type && (
                    <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', fontWeight: 600, letterSpacing: 0.5 }}>
                      {t('lumaTicketTier')}: {lumaPass.ticket_type}
                    </div>
                  )}
                </div>
              )}

              <div style={{ fontSize: 10, color: 'var(--cp-cyan)', fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>
                {t('lumaPaidWithZcash')}
              </div>

              <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', lineHeight: 1.6, marginBottom: 16 }}>
                {t('lumaEmailNote')}
              </div>

              {lumaPass.luma_event_url && (
                <a
                  href={lumaPass.luma_event_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    display: 'inline-block', color: '#E8C48D', borderColor: 'rgba(232,196,141,0.3)',
                    fontSize: 10, letterSpacing: 1.5, padding: '10px 24px', textDecoration: 'none',
                  }}
                >
                  {t('lumaOpenOnLuma')} ↗
                </a>
              )}
            </div>
          </div>

          <button
            onClick={() => receiptRef.current && saveReceiptImage(receiptRef.current, invoice.id)}
            className="btn"
            style={{
              display: 'block', width: '100%', marginTop: 16,
              fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase',
              padding: '12px 0',
              color: 'var(--cp-cyan)', borderColor: 'rgba(86,212,200,0.3)',
            }}
          >
            {t('ticketSave')}
          </button>
        </>
      )}

      {lumaPass?.status === 'failed' && (
        <div style={{ marginTop: 18, border: '1px solid var(--cp-border)', borderRadius: 6, padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', lineHeight: 1.6 }}>
            {t('lumaRegistrationFailed')}
          </div>
          <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 8, lineHeight: 1.6 }}>
            {t('lumaRegistrationFailedHint')}
          </div>
        </div>
      )}

      {ticketCode && (
        <>
          <div ref={receiptRef} style={{ borderRadius: 6, background: 'var(--cp-bg, #0a0e14)' }}>
            <div style={{ border: '1px solid var(--cp-border)', borderRadius: 6, padding: '20px 20px 16px', marginBottom: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', letterSpacing: 1.5, marginBottom: 12 }}>
                  {t('ticketLabel')}
                </div>
                <div className="qr-container">
                  <QRCode data={ticketCode} size={180} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--cp-cyan)', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: 10 }}>
                  {ticketCode}
                </div>
              </div>

              {(ticketMeta?.event_date || ticketMeta?.event_location || ticketMeta?.price_label) && (
                <div style={{
                  borderTop: '1px solid var(--cp-border)', paddingTop: 12, marginTop: 4,
                  display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
                }}>
                  {ticketMeta.event_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--cp-text-muted)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <span>{(() => { try { return new Date(ticketMeta.event_date!).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ticketMeta.event_date; } })()}</span>
                    </div>
                  )}
                  {ticketMeta.event_location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--cp-text-muted)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span>{ticketMeta.event_location}</span>
                    </div>
                  )}
                  {ticketMeta.price_label && (
                    <div style={{ fontSize: 10, color: 'var(--cp-cyan)', fontWeight: 600, letterSpacing: 0.5 }}>
                      {ticketMeta.price_label}
                    </div>
                  )}
                </div>
              )}
            </div>

            <ReceiptDetails invoice={invoice} row={row} label={label} primaryPrice={primaryPrice} secondaryPrice={secondaryPrice} t={t} />
          </div>

          <button
            onClick={() => receiptRef.current && saveReceiptImage(receiptRef.current, ticketCode)}
            className="btn"
            style={{
              display: 'block', width: '100%', marginTop: 16,
              fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase',
              padding: '12px 0',
              color: 'var(--cp-cyan)', borderColor: 'rgba(86,212,200,0.3)',
            }}
          >
            {t('ticketSave')}
          </button>
        </>
      )}

      {!ticketCode && !ticketPending && !lumaPass && (
        <ReceiptDetails invoice={invoice} row={row} label={label} primaryPrice={primaryPrice} secondaryPrice={secondaryPrice} t={t} />
      )}

      {returnUrl && (
        <div style={{ marginTop: 24 }}>
          <a
            href={returnUrl}
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ display: 'block', width: '100%', textDecoration: 'none', textAlign: 'center', textTransform: 'uppercase', padding: '14px 0' }}
          >
            {t('backTo', { store: returnUrl ? (() => { try { return new URL(returnUrl).hostname; } catch { return 'Store'; } })() : 'Store' })}
          </a>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1 }}>
            {redirectIn > 0 ? t('redirectingIn', { seconds: redirectIn }) : t('redirecting')}
          </div>
        </div>
      )}

      {!returnUrl && !ticketPending && (
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1 }}>
          {isDonation ? t('donationClosePage') : t('canClosePage')}
        </div>
      )}
    </div>
  );
}
