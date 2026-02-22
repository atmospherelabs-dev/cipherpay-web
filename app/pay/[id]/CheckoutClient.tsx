'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, type Invoice } from '@/lib/api';
import { QRCode } from '@/components/QRCode';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

function buildZcashUri(address: string, amount: number, memo: string): string {
  const memoB64 = btoa(memo).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `zcash:${address}?amount=${amount.toFixed(8)}&memo=${memoB64}`;
}

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
  const eventSourceRef = useRef<EventSource | null>(null);

  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('return_url') || null;
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

  useEffect(() => {
    if (!invoice || invoice.status === 'confirmed' || invoice.status === 'expired') return;
    const es = api.streamInvoice(invoiceId);
    eventSourceRef.current = es;
    es.addEventListener('status', (event) => {
      try {
        const data = JSON.parse(event.data);
        setInvoice((prev) => prev ? { ...prev, status: data.status, detected_txid: data.txid || prev.detected_txid } : prev);
        if (data.status === 'confirmed' || data.status === 'expired') es.close();
      } catch { /* ignore */ }
    });
    es.onerror = () => {};
    return () => { es.close(); eventSourceRef.current = null; };
  }, [invoice?.status, invoiceId]);

  const address = invoice?.payment_address || '';
  const zcashUri = useMemo(() => {
    if (!invoice) return '';
    if (invoice.zcash_uri) return invoice.zcash_uri;
    if (address) return buildZcashUri(address, invoice.price_zec, invoice.memo_code);
    return '';
  }, [invoice, address]);

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

  const isUsd = invoice.currency === 'USD';
  const eurStr = invoice.price_eur < 0.01 ? `€${invoice.price_eur}` : `€${invoice.price_eur.toFixed(2)}`;
  const usdStr = invoice.price_usd ? (invoice.price_usd < 0.01 ? `$${invoice.price_usd}` : `$${invoice.price_usd.toFixed(2)}`) : null;
  const primaryPrice = isUsd && usdStr ? usdStr : eurStr;
  const secondaryPrice = isUsd ? eurStr : usdStr;
  const showReceipt = invoice.status === 'detected' || invoice.status === 'confirmed';

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {invoice.status === 'pending' && <span className="tag">{countdown.text}</span>}
          {showReceipt && <span className="tag">PAID</span>}
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center" style={{ padding: '32px 24px' }}>
        <div style={{ maxWidth: 440, width: '100%' }}>

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
                <a href={zcashUri} className="btn-primary" style={{ width: '100%', textDecoration: 'none', textTransform: 'uppercase', marginBottom: 24 }}>
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

              {/* Memo — CRITICAL */}
              <div style={{ textAlign: 'left', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--cp-purple)', letterSpacing: 1, fontWeight: 600 }}>⚠ REQUIRED MEMO</span>
                  <button
                    onClick={() => copy(invoice.memo_code, 'Memo')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--cp-purple)', cursor: 'pointer', fontSize: 9, letterSpacing: 1, fontFamily: 'inherit', padding: 0 }}
                  >
                    <CopyIcon size={11} /> COPY
                  </button>
                </div>
                <div style={{ fontSize: 9, color: 'var(--cp-text-muted)', marginBottom: 6, lineHeight: 1.5 }}>
                  You must include this memo in your transaction or your payment will not be detected.
                </div>
                <div
                  onClick={() => copy(invoice.memo_code, 'Memo')}
                  style={{
                    background: 'var(--cp-bg)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 4,
                    padding: '12px', cursor: 'pointer', fontSize: 16, letterSpacing: 3, color: 'var(--cp-purple)',
                    fontWeight: 700, textAlign: 'center', transition: 'border-color 0.15s',
                  }}
                >
                  {invoice.memo_code}
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
                      setRefundSaved(true);
                      setTimeout(() => setRefundSaved(false), 2000);
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

          {/* ── Receipt ── */}
          {showReceipt && (
            <ConfirmedReceipt invoice={invoice} returnUrl={returnUrl} />
          )}

          {/* ── Expired ── */}
          {invoice.status === 'expired' && (
            <div className="checkout-status expired">
              <div>INVOICE EXPIRED</div>
              <div style={{ fontSize: 10, marginTop: 6, color: 'var(--cp-text-muted)', fontWeight: 400 }}>
                This invoice has expired. Please create a new order.
              </div>
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
  const isConfirmed = invoice.status === 'confirmed';
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

  const isUsd = invoice.currency === 'USD';
  const eurStr = invoice.price_eur < 0.01 ? `€${invoice.price_eur}` : `€${invoice.price_eur.toFixed(2)}`;
  const usdStr = invoice.price_usd ? (invoice.price_usd < 0.01 ? `$${invoice.price_usd}` : `$${invoice.price_usd.toFixed(2)}`) : null;
  const primaryPrice = isUsd && usdStr ? usdStr : eurStr;
  const secondaryPrice = isUsd ? eurStr : usdStr;

  const row: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 0', borderBottom: '1px solid var(--cp-border)',
    fontSize: 12,
  };
  const label: React.CSSProperties = { color: 'var(--cp-text-muted)', letterSpacing: 1, fontSize: 10 };

  return (
    <div>
      <div className={`checkout-status ${isConfirmed ? 'confirmed' : 'detected'}`} style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{isConfirmed ? 'PAYMENT CONFIRMED' : 'PAYMENT SUCCESSFUL'}</div>
        {!isConfirmed && (
          <div className="pulse" style={{ fontSize: 10, marginTop: 8, color: 'var(--cp-text-muted)', fontWeight: 400 }}>
            Confirming on blockchain...
          </div>
        )}
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
          <span style={{ color: 'var(--cp-cyan)', fontWeight: 600 }}>{invoice.price_zec.toFixed(8)}</span>
        </div>

        <div style={row}>
          <span style={label}>MEMO</span>
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

      {returnUrl && (
        <div style={{ marginTop: 24 }}>
          <a
            href={returnUrl}
            className="btn-primary"
            style={{ display: 'block', width: '100%', textDecoration: 'none', textAlign: 'center', textTransform: 'uppercase', padding: '14px 0' }}
          >
            ← Back to Store
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
