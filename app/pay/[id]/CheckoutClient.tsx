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

export default function CheckoutClient({ invoiceId }: { invoiceId: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [refundAddr, setRefundAddr] = useState('');
  const [refundSaved, setRefundSaved] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Honor ?theme=dark|light and ?return_url from the redirect URL
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('return_url') || null;
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
  const showPaymentUI = invoice.status === 'pending' || invoice.status === 'detected';

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {showPaymentUI && <span className="tag">{countdown.text}</span>}
          {invoice.status === 'confirmed' && <span className="tag">PAID</span>}
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center" style={{ padding: '48px 24px' }}>
        <div style={{ maxWidth: 440, width: '100%' }}>

          {showPaymentUI && (
            <div className="checkout-preview">
              {invoice.merchant_name && (
                <div style={{ fontSize: 11, letterSpacing: 1, color: 'var(--cp-text-muted)', marginBottom: 8 }}>
                  {invoice.merchant_name.toUpperCase()}
                </div>
              )}
              <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-text-dim)' }}>PAY WITH SHIELDED ZEC</div>

              {(invoice.product_name || invoice.size) && (
                <div style={{ fontSize: 12, color: 'var(--cp-text)', marginTop: 8 }}>
                  {invoice.product_name}{invoice.size ? ` · ${invoice.size}` : ''}
                </div>
              )}

              <div className="price">{eurStr}</div>
              <div className="price-zec">≈ {invoice.price_zec.toFixed(8)} ZEC</div>

              {zcashUri && (
                <div className="qr-container">
                  <QRCode data={zcashUri} size={200} />
                </div>
              )}

              {address && (
                <>
                  <div className="memo-label" style={{ marginTop: 12 }}>SEND TO ADDRESS</div>
                  <div className="memo-box address" onClick={() => copy(address, 'Address')}>{address}</div>
                </>
              )}

              <div className="memo-label">INCLUDE THIS MEMO</div>
              <div className="memo-box memo" onClick={() => copy(invoice.memo_code, 'Memo')}>{invoice.memo_code}</div>

              <div className="memo-label" style={{ marginTop: 16 }}>REFUND ADDRESS <span style={{ color: 'var(--cp-text-dim)', fontWeight: 400 }}>(OPTIONAL)</span></div>
              <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginBottom: 6, lineHeight: 1.5 }}>
                Provide a Zcash address to receive a refund if needed.
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

              <div className="timer">Expires in {countdown.text}</div>
            </div>
          )}

          {invoice.status === 'detected' && (
            <div className="checkout-status detected">
              <div className="pulse">PAYMENT DETECTED IN MEMPOOL</div>
              <div style={{ fontSize: 10, marginTop: 6, color: 'var(--cp-text-muted)', fontWeight: 400 }}>
                Waiting for block confirmation...
              </div>
              {invoice.detected_txid && (
                <div style={{ fontSize: 9, marginTop: 4, color: 'var(--cp-text-dim)', wordBreak: 'break-all', fontWeight: 400 }}>
                  txid: {invoice.detected_txid}
                </div>
              )}
            </div>
          )}

          {invoice.status === 'confirmed' && (
            <>
              <div className="checkout-status confirmed">
                <div>PAYMENT CONFIRMED</div>
                <div style={{ fontSize: 10, marginTop: 6, color: 'var(--cp-text-muted)', fontWeight: 400 }}>
                  {invoice.product_name && <span>{invoice.product_name}{invoice.size ? ` · ${invoice.size}` : ''} — </span>}
                  Transaction included in block
                </div>
              </div>
              {invoice.detected_txid && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <div className="memo-label">TXID</div>
                  <div style={{ fontSize: 9, color: 'var(--cp-cyan)', wordBreak: 'break-all' }}>{invoice.detected_txid}</div>
                </div>
              )}
              {returnUrl && (
                <a
                  href={returnUrl}
                  className="btn"
                  style={{ display: 'block', width: '100%', marginTop: 20, textDecoration: 'none', textAlign: 'center', textTransform: 'uppercase' }}
                >
                  ← Back to Store
                </a>
              )}
            </>
          )}

          {invoice.status === 'expired' && (
            <div className="checkout-status expired">
              <div>INVOICE EXPIRED</div>
              <div style={{ fontSize: 10, marginTop: 6, color: 'var(--cp-text-muted)', fontWeight: 400 }}>
                Create a new invoice to continue
              </div>
            </div>
          )}

          {showPaymentUI && zcashUri && (
            <a href={zcashUri} className="btn-primary" style={{ width: '100%', marginTop: 16, textDecoration: 'none', textTransform: 'uppercase' }}>
              Open in Wallet
            </a>
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
