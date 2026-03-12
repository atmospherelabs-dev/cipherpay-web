'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, type Invoice } from '@/lib/api';
import { validateZcashAddress } from '@/lib/validation';
import { currencySymbol } from '@/app/dashboard/utils/currency';
import { QRCode } from '@/components/QRCode';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

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

function isSafeReturnUrl(url: string, merchantOrigin?: string | null): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    if (merchantOrigin) {
      return parsed.origin === merchantOrigin;
    }
    // No merchant origin: only allow cipherpay domains or Shopify admin
    const host = parsed.hostname;
    return host.endsWith('.cipherpay.app') || host === 'cipherpay.app'
      || host.endsWith('.myshopify.com');
  } catch {
    return false;
  }
}

function getShopOrigin(returnUrl: string | null): string | null {
  if (!returnUrl) return null;
  try { return new URL(returnUrl).origin; } catch { return null; }
}

export default function CheckoutClient({ invoiceId }: { invoiceId: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [refundAddr, setRefundAddr] = useState('');
  const [refundSaved, setRefundSaved] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
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

  const address = invoice?.payment_address || '';
  const zcashUri = invoice?.zcash_uri || '';

  const countdown = useCountdown(invoice?.expires_at || new Date().toISOString());

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setToast(`${label} copied`);
      setTimeout(() => setToast(''), 2000);
    });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13 }}>
        <div className="checkout-status expired" style={{ maxWidth: 420, width: '100%' }}>
          <div>INVOICE NOT FOUND</div>
          <div style={{ fontSize: 10, marginTop: 6, color: 'var(--cp-text-muted)', fontWeight: 400 }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--cp-cyan)', borderTopColor: 'transparent' }} />
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
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {(invoice.status === 'pending' || isUnderpaid) && <span className="tag">{countdown.text}</span>}
          {showReceipt && <span className="tag">PAID</span>}
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
                  Your payment is ready. Click below to lock in the<br />
                  real-time ZEC exchange rate and begin your 15-minute checkout window.
                </div>
              </div>

              <button
                onClick={handleFinalize}
                disabled={finalizing}
                className="btn-primary"
                style={{ width: '100%', textTransform: 'uppercase', padding: '16px 0', fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}
              >
                {finalizing ? 'LOCKING RATE...' : 'LOCK RATE & PAY'}
              </button>

              {finalizeError && (
                <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 12 }}>{finalizeError}</div>
              )}

              <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1, lineHeight: 1.6 }}>
                The ZEC amount will be calculated at the exact moment you click.<br />
                You will have 15 minutes to complete the payment.
              </div>
            </div>
          )}

          {/* ── Payment UI ── */}
          {invoice.status === 'pending' && (
            <div style={{ textAlign: 'center' }}>

              {/* Order info — prominent */}
              <div style={{ marginBottom: 28, padding: '20px 0', borderBottom: '1px solid var(--cp-border)' }}>
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
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--cp-text)' }}>
                  {primaryPrice}{secondaryPrice && <span style={{ fontSize: 16, color: 'var(--cp-text-muted)', fontWeight: 400, marginLeft: 8 }}>{secondaryPrice}</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--cp-cyan)', marginTop: 4 }}>≈ {invoice.price_zec.toFixed(8)} ZEC</div>
              </div>

              {/* QR Code */}
              {zcashUri && (
                <div className="qr-container" style={{ marginBottom: 12 }}>
                  <QRCode data={zcashUri} size={200} />
                </div>
              )}

              {/* Instruction */}
              <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1, marginBottom: 16, lineHeight: 1.6 }}>
                SCAN WITH YOUR ZCASH WALLET<br />
                <span style={{ color: 'var(--cp-text-muted)' }}>or send manually using the details below</span>
              </div>

              {/* Open in Wallet */}
              {zcashUri && (
                <a href={zcashUri} className="btn-primary" style={{ width: '100%', textTransform: 'uppercase', marginBottom: 24 }}>
                  Open in Wallet
                </a>
              )}

              {/* Manual payment section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--cp-border)' }} />
                <span style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 2 }}>MANUAL PAYMENT</span>
                <div style={{ flex: 1, height: 1, background: 'var(--cp-border)' }} />
              </div>

              {/* Payment Address */}
              <div style={{ textAlign: 'left', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--cp-text-muted)', letterSpacing: 1 }}>PAYMENT ADDRESS</span>
                  <button
                    onClick={() => copy(address, 'Address')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--cp-cyan)', cursor: 'pointer', fontSize: 9, letterSpacing: 1, fontFamily: 'inherit', padding: 0 }}
                  >
                    <CopyIcon size={11} /> COPY
                  </button>
                </div>
                <div
                  onClick={() => copy(address, 'Address')}
                  style={{
                    background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4,
                    padding: '10px 12px', cursor: 'pointer', fontSize: 10, color: 'var(--cp-cyan)',
                    wordBreak: 'break-all', lineHeight: 1.5, transition: 'border-color 0.15s',
                  }}
                >
                  {truncateAddress(address)}
                </div>
              </div>

              {/* Refund address */}
              <div style={{ borderTop: '1px solid var(--cp-border)', paddingTop: 16, marginBottom: 16, textAlign: 'left' }}>
                <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 1, marginBottom: 6 }}>
                  REFUND ADDRESS <span style={{ fontWeight: 400 }}>(OPTIONAL)</span>
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
                    {refundSaved ? 'SAVED ✓' : 'SAVE'}
                  </button>
                </div>
              </div>

              {/* Timer */}
              <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1 }}>
                Expires in {countdown.text}
              </div>
            </div>
          )}

          {/* ── Underpaid: partial payment received ── */}
          {isUnderpaid && (
            <div style={{ textAlign: 'center' }}>
              <div className="checkout-status underpaid" style={{ marginBottom: 24, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>PARTIAL PAYMENT RECEIVED</div>
                <div style={{ fontSize: 11, marginTop: 8, color: 'var(--cp-text-muted)', fontWeight: 400 }}>
                  Received {(invoice.received_zatoshis / 1e8).toFixed(8)} / {invoice.price_zec.toFixed(8)} ZEC
                </div>
                <div style={{ fontSize: 12, marginTop: 12, color: '#f97316', fontWeight: 600 }}>
                  Send the remaining {remainingZec.toFixed(8)} ZEC to complete your payment
                </div>
              </div>

              {/* Updated QR for remaining amount */}
              {address && remainingZec > 0 && (
                <div className="qr-container" style={{ marginBottom: 12 }}>
                  <QRCode data={`zcash:${address}?amount=${remainingZec.toFixed(8)}`} size={200} />
                </div>
              )}

              <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1, marginBottom: 16 }}>
                SCAN TO SEND REMAINING BALANCE
              </div>

              {address && remainingZec > 0 && (
                <a href={`zcash:${address}?amount=${remainingZec.toFixed(8)}`} className="btn-primary" style={{ width: '100%', textTransform: 'uppercase', marginBottom: 24 }}>
                  Open in Wallet
                </a>
              )}

              {/* Payment Address */}
              <div style={{ textAlign: 'left', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--cp-text-muted)', letterSpacing: 1 }}>PAYMENT ADDRESS</span>
                  <button
                    onClick={() => copy(address, 'Address')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--cp-cyan)', cursor: 'pointer', fontSize: 9, letterSpacing: 1, fontFamily: 'inherit', padding: 0 }}
                  >
                    <CopyIcon size={11} /> COPY
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
                Expires in {countdown.text}
              </div>
            </div>
          )}

          {/* ── Receipt ── */}
          {showReceipt && (
            <ConfirmedReceipt invoice={invoice} returnUrl={returnUrl} />
          )}

          {/* ── Expired ── */}
          {invoice.status === 'expired' && (
            <div className="checkout-status expired">
              <div>INVOICE EXPIRED</div>

              {/* In-flight payment detected on an expired subscription invoice */}
              {invoice.subscription_id && (invoice.received_zatoshis > 0 || invoice.detected_txid) ? (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--cp-cyan)', fontWeight: 600, marginBottom: 8 }}>
                    PAYMENT DETECTED
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', fontWeight: 400, lineHeight: 1.6 }}>
                    A payment has been detected and is waiting for network confirmation.
                    This page will update automatically once confirmed.
                  </div>
                </div>
              ) : invoice.subscription_id ? (
                /* Expired subscription invoice — allow re-finalization */
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', fontWeight: 400, marginBottom: 16, lineHeight: 1.6 }}>
                    Your checkout window expired. Click below to get a fresh<br />
                    ZEC exchange rate and restart the 15-minute payment window.
                  </div>
                  <button
                    onClick={handleFinalize}
                    disabled={finalizing}
                    className="btn-primary"
                    style={{ width: '100%', textTransform: 'uppercase', padding: '14px 0', fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}
                  >
                    {finalizing ? 'LOCKING RATE...' : 'LOCK RATE & PAY'}
                  </button>
                  {finalizeError && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 8 }}>{finalizeError}</div>
                  )}
                </div>
              ) : invoice.received_zatoshis > 0 ? (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', fontWeight: 400, marginBottom: 12 }}>
                    A partial payment of {(invoice.received_zatoshis / 1e8).toFixed(8)} ZEC was received.
                    Enter your refund address below to request a refund from the merchant.
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
                      {refundSaved ? 'SAVED ✓' : 'SAVE'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 10, marginTop: 6, color: 'var(--cp-text-muted)', fontWeight: 400 }}>
                  This invoice has expired. Please create a new order.
                </div>
              )}
              {shopOrigin && (
                <a
                  href={shopOrigin}
                  className="btn"
                  style={{ display: 'inline-block', marginTop: 16, textDecoration: 'none', textTransform: 'uppercase' }}
                >
                  ← Back to Store
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

function ConfirmedReceipt({ invoice, returnUrl }: { invoice: Invoice; returnUrl: string | null }) {
  const [redirectIn, setRedirectIn] = useState(returnUrl ? 5 : -1);

  useEffect(() => {
    if (!returnUrl || redirectIn <= 0) return;
    const id = setTimeout(() => setRedirectIn(prev => prev - 1), 1000);
    return () => clearTimeout(id);
  }, [redirectIn, returnUrl]);

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
      <div className="checkout-status confirmed" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>PAYMENT ACCEPTED</div>
      </div>

      <div style={{ border: '1px solid var(--cp-border)', borderRadius: 6, padding: '0 24px' }}>
        {invoice.merchant_name && (
          <div style={row}>
            <span style={label}>MERCHANT</span>
            <span style={{ fontWeight: 600 }}>{invoice.merchant_name}</span>
          </div>
        )}

        {invoice.product_name && (
          <div style={row}>
            <span style={label}>ITEM</span>
            <span style={{ fontWeight: 600 }}>{invoice.product_name}{invoice.size ? ` · ${invoice.size}` : ''}</span>
          </div>
        )}

        <div style={row}>
          <span style={label}>AMOUNT</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{primaryPrice}{secondaryPrice && <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--cp-text-muted)', marginLeft: 6 }}>{secondaryPrice}</span>}</span>
        </div>

        <div style={row}>
          <span style={label}>ZEC PAID</span>
          <span style={{ color: 'var(--cp-cyan)', fontWeight: 600 }}>
            {invoice.received_zatoshis > 0 ? (invoice.received_zatoshis / 1e8).toFixed(8) : invoice.price_zec.toFixed(8)}
          </span>
        </div>

        <div style={row}>
          <span style={label}>REFERENCE</span>
          <span style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 }}>{invoice.memo_code}</span>
        </div>

        {invoice.detected_txid && (
          <div style={{ ...row, borderBottom: 'none', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <span style={label}>TXID</span>
            <span style={{ fontSize: 9, color: 'var(--cp-cyan)', wordBreak: 'break-all', lineHeight: 1.5 }}>
              {invoice.detected_txid}
            </span>
          </div>
        )}
      </div>

      {invoice.overpaid && invoice.received_zatoshis > invoice.price_zatoshis && (
        <div style={{
          marginTop: 16, padding: '14px 20px', borderRadius: 6,
          background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)',
          fontSize: 11, color: '#f97316', lineHeight: 1.6,
        }}>
          An overpayment of {((invoice.received_zatoshis - invoice.price_zatoshis) / 1e8).toFixed(8)} ZEC was detected.
          Contact the merchant for a refund of the excess.
        </div>
      )}

      {returnUrl && (
        <div style={{ marginTop: 24 }}>
          <a
            href={returnUrl}
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ display: 'block', width: '100%', textDecoration: 'none', textAlign: 'center', textTransform: 'uppercase', padding: '14px 0' }}
          >
            ← Back to {returnUrl ? (() => { try { return new URL(returnUrl).hostname; } catch { return 'Store'; } })() : 'Store'}
          </a>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1 }}>
            {redirectIn > 0 ? `REDIRECTING IN ${redirectIn}s...` : 'REDIRECTING...'}
          </div>
        </div>
      )}

      {!returnUrl && (
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1 }}>
          YOU CAN CLOSE THIS PAGE
        </div>
      )}
    </div>
  );
}
