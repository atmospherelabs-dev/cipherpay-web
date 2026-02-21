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

function truncateAddress(addr: string, front = 12, back = 8): string {
  if (addr.length <= front + back + 3) return addr;
  return `${addr.slice(0, front)}...${addr.slice(-back)}`;
}

function getShopOrigin(returnUrl: string | null): string | null {
  if (!returnUrl) return null;
  try {
    const url = new URL(returnUrl);
    return url.origin;
  } catch {
    return null;
  }
}

export default function CheckoutClient({ invoiceId }: { invoiceId: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [refundAddr, setRefundAddr] = useState('');
  const [refundSaved, setRefundSaved] = useState(false);
  const [showFullAddr, setShowFullAddr] = useState(false);
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

  const eurStr = invoice.price_eur < 0.01 ? `€${invoice.price_eur}` : `€${invoice.price_eur.toFixed(2)}`;
  const showReceipt = invoice.status === 'detected' || invoice.status === 'confirmed';

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {invoice.status === 'pending' && <span className="tag">{countdown.text}</span>}
          {showReceipt && <span className="tag">PAID</span>}
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center" style={{ padding: '32px 24px' }}>
        <div style={{ maxWidth: 420, width: '100%' }}>

          {/* ── Payment UI ── */}
          {invoice.status === 'pending' && (
            <div style={{ textAlign: 'center' }}>
              {/* Merchant + Product */}
              <div style={{ marginBottom: 24 }}>
                {invoice.merchant_name && (
                  <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--cp-text-dim)', marginBottom: 6 }}>
                    {invoice.merchant_name.toUpperCase()}
                  </div>
                )}
                {(invoice.product_name || invoice.size) && (
                  <div style={{ fontSize: 12, color: 'var(--cp-text-muted)' }}>
                    {invoice.product_name}{invoice.size ? ` · ${invoice.size}` : ''}
                  </div>
                )}
              </div>

              {/* QR Code — hero */}
              {zcashUri && (
                <div className="qr-container" style={{ marginBottom: 20 }}>
                  <QRCode data={zcashUri} size={240} />
                </div>
              )}

              {/* Price */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--cp-text)' }}>{eurStr}</div>
                <div style={{ fontSize: 13, color: 'var(--cp-cyan)', marginTop: 4 }}>≈ {invoice.price_zec.toFixed(8)} ZEC</div>
              </div>

              {/* Address + Memo — side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 16 }}>
                {/* Address */}
                <div
                  onClick={() => copy(address, 'Address')}
                  style={{
                    background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4,
                    padding: '10px 12px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 1, marginBottom: 4 }}>ADDRESS</div>
                  <div
                    style={{ fontSize: 10, color: 'var(--cp-cyan)', wordBreak: 'break-all', lineHeight: 1.4 }}
                    onClick={(e) => { e.stopPropagation(); setShowFullAddr(!showFullAddr); copy(address, 'Address'); }}
                  >
                    {showFullAddr ? address : truncateAddress(address, 16, 12)}
                  </div>
                </div>

                {/* Memo */}
                <div
                  onClick={() => copy(invoice.memo_code, 'Memo')}
                  style={{
                    background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4,
                    padding: '10px 12px', cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.15s',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 130,
                  }}
                >
                  <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 1, marginBottom: 4 }}>MEMO</div>
                  <div style={{ fontSize: 13, letterSpacing: 2, color: 'var(--cp-purple)', fontWeight: 600 }}>
                    {invoice.memo_code}
                  </div>
                </div>
              </div>

              {/* Open in Wallet */}
              {zcashUri && (
                <a href={zcashUri} className="btn-primary" style={{ width: '100%', textDecoration: 'none', textTransform: 'uppercase', marginBottom: 20 }}>
                  Open in Wallet
                </a>
              )}

              {/* Refund address */}
              <div style={{ borderTop: '1px solid var(--cp-border)', paddingTop: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', letterSpacing: 1, marginBottom: 6, textAlign: 'left' }}>
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
                      await navigator.clipboard.writeText(refundAddr).catch(() => {});
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

              {/* Cancel */}
              {shopOrigin && (
                <div style={{ marginTop: 16 }}>
                  <a
                    href={shopOrigin}
                    style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1, textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--cp-text-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--cp-text-dim)')}
                  >
                    CANCEL
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ── Receipt (detected or confirmed) ── */}
          {showReceipt && (
            <ConfirmedReceipt invoice={invoice} returnUrl={returnUrl} />
          )}

          {/* ── Expired ── */}
          {invoice.status === 'expired' && (
            <div className="checkout-status expired">
              <div>INVOICE EXPIRED</div>
              <div style={{ fontSize: 10, marginTop: 6, color: 'var(--cp-text-muted)', fontWeight: 400 }}>
                Create a new invoice to continue
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

  const eurStr = invoice.price_eur < 0.01 ? `€${invoice.price_eur}` : `€${invoice.price_eur.toFixed(2)}`;

  const row: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid var(--cp-border)',
    fontSize: 11,
  };
  const label: React.CSSProperties = { color: 'var(--cp-text-muted)', letterSpacing: 1, fontSize: 10 };

  return (
    <div>
      <div className={`checkout-status ${isConfirmed ? 'confirmed' : 'detected'}`} style={{ marginBottom: 24 }}>
        <div>{isConfirmed ? 'PAYMENT CONFIRMED' : 'PAYMENT SUCCESSFUL'}</div>
        {!isConfirmed && (
          <div className="pulse" style={{ fontSize: 10, marginTop: 6, color: 'var(--cp-text-muted)', fontWeight: 400 }}>
            Confirming on blockchain...
          </div>
        )}
      </div>

      <div style={{ border: '1px solid var(--cp-border)', borderRadius: 6, padding: '0 20px' }}>
        {invoice.merchant_name && (
          <div style={row}>
            <span style={label}>MERCHANT</span>
            <span>{invoice.merchant_name}</span>
          </div>
        )}

        {invoice.product_name && (
          <div style={row}>
            <span style={label}>ITEM</span>
            <span>{invoice.product_name}{invoice.size ? ` · ${invoice.size}` : ''}</span>
          </div>
        )}

        <div style={row}>
          <span style={label}>AMOUNT</span>
          <span>{eurStr}</span>
        </div>

        <div style={row}>
          <span style={label}>ZEC PAID</span>
          <span style={{ color: 'var(--cp-cyan)' }}>{invoice.price_zec.toFixed(8)}</span>
        </div>

        <div style={row}>
          <span style={label}>MEMO</span>
          <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{invoice.memo_code}</span>
        </div>

        {invoice.detected_txid && (
          <div style={{ ...row, borderBottom: 'none', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span style={label}>TXID</span>
            <span style={{ fontSize: 9, color: 'var(--cp-cyan)', wordBreak: 'break-all', lineHeight: 1.5 }}>
              {invoice.detected_txid}
            </span>
          </div>
        )}
      </div>

      {returnUrl && (
        <div style={{ marginTop: 20 }}>
          <a
            href={returnUrl}
            className="btn-primary"
            style={{ display: 'block', width: '100%', textDecoration: 'none', textAlign: 'center', textTransform: 'uppercase' }}
          >
            ← Back to Store
          </a>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1 }}>
            {redirectIn > 0 ? `REDIRECTING IN ${redirectIn}s...` : 'REDIRECTING...'}
          </div>
        </div>
      )}

      {!returnUrl && (
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1 }}>
          YOU CAN CLOSE THIS PAGE
        </div>
      )}
    </div>
  );
}
