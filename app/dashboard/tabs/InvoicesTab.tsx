'use client';

import { memo, useState, useEffect, useMemo } from 'react';
import { api, type Invoice, type Product, type ZecRates } from '@/lib/api';
import type { TabAction } from '../DashboardClient';
import { CopyButton } from '@/components/CopyButton';
import { RefundModal } from '../components/RefundModal';
import { currencySymbol, fiatPrice, fiatStr, SUPPORTED_CURRENCIES } from '../utils/currency';
import { useToast } from '@/contexts/ToastContext';

interface InvoicesTabProps {
  invoices: Invoice[];
  loadingInvoices: boolean;
  reloadInvoices: () => void;
  products: Product[];
  zecRates: ZecRates | null;
  displayCurrency: string;
  checkoutOrigin: string;
  initialAction?: TabAction;
  clearAction?: () => void;
}

function getInvoiceType(inv: Invoice, recurringPriceIds: Set<string>): 'billing' | 'recurring' | 'payment' {
  if (inv.product_name === 'Fee Settlement') return 'billing';
  if (inv.price_id && recurringPriceIds.has(inv.price_id)) return 'recurring';
  return 'payment';
}

const TYPE_BADGE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  billing:   { label: 'PLATFORM',  color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  recurring: { label: 'RECURRING', color: 'var(--cp-purple, #a855f7)', bg: 'rgba(168,85,247,0.1)' },
  payment:   { label: 'ONE-TIME',  color: 'var(--cp-text-dim)', bg: 'rgba(255,255,255,0.03)' },
};

export const InvoicesTab = memo(function InvoicesTab({
  invoices, loadingInvoices, reloadInvoices, products, displayCurrency, checkoutOrigin, initialAction, clearAction,
}: InvoicesTabProps) {
  const { showToast } = useToast();
  const sym = currencySymbol(displayCurrency);

  const recurringPriceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of products) {
      for (const price of (p.prices || [])) {
        if (price.price_type === 'recurring') ids.add(price.id);
      }
    }
    return ids;
  }, [products]);

  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [refundingInvoiceId, setRefundingInvoiceId] = useState<string | null>(null);

  const [showPayLinkForm, setShowPayLinkForm] = useState(false);

  useEffect(() => {
    if (initialAction === 'create-paylink') {
      setShowPayLinkForm(true);
      clearAction?.();
    }
  }, [initialAction, clearAction]);
  const [payLinkAmount, setPayLinkAmount] = useState('');
  const [payLinkDesc, setPayLinkDesc] = useState('');
  const [payLinkCurrency, setPayLinkCurrency] = useState<string>(displayCurrency);
  const [payLinkCreating, setPayLinkCreating] = useState(false);
  const [payLinkResult, setPayLinkResult] = useState<string | null>(null);

  const createPaymentLink = async () => {
    const amount = parseFloat(payLinkAmount);
    if (!amount || amount <= 0) {
      showToast('Enter a valid amount', true);
      return;
    }
    setPayLinkCreating(true);
    try {
      const resp = await api.createInvoice({
        product_name: payLinkDesc || undefined,
        amount: Math.round(amount * 100) / 100,
        currency: payLinkCurrency,
      });
      const link = `${checkoutOrigin}/pay/${resp.invoice_id}`;
      setPayLinkResult(link);
      reloadInvoices();
      showToast('Payment link created');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create link', true);
    }
    setPayLinkCreating(false);
  };

  const cancelInvoice = async (id: string) => {
    try { await api.cancelInvoice(id); reloadInvoices(); showToast('Invoice cancelled'); }
    catch { showToast('Failed to cancel', true); }
  };

  const exportInvoicesCSV = () => {
    const headers = ['Reference', 'Product', 'Status', 'Amount', 'Currency', 'Price (ZEC)', 'Received (ZEC)', 'Created', 'Confirmed', 'Refunded', 'Refund TxID', 'TxID'];
    const rows = invoices.map(inv => [
      inv.memo_code,
      inv.product_name || '',
      inv.status,
      fiatPrice(inv, displayCurrency).toFixed(2),
      inv.currency || displayCurrency,
      inv.price_zec.toFixed(8),
      inv.received_zatoshis > 0 ? (inv.received_zatoshis / 1e8).toFixed(8) : '',
      inv.created_at,
      inv.confirmed_at || '',
      inv.refunded_at || '',
      inv.refund_txid || '',
      inv.detected_txid || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cipherpay-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Invoices</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { setShowPayLinkForm(!showPayLinkForm); setPayLinkResult(null); }} className="btn btn-small">
              {showPayLinkForm ? 'CANCEL' : '+ PAYMENT LINK'}
            </button>
            {invoices.length > 0 && (
              <button onClick={exportInvoicesCSV} className="btn btn-small">EXPORT CSV</button>
            )}
            <button onClick={reloadInvoices} className="btn btn-small">REFRESH</button>
          </div>
        </div>

        {showPayLinkForm && (
          <div className="panel-body" style={{ borderBottom: '1px solid var(--cp-border)' }}>
            <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1, marginBottom: 8 }}>CREATE PAYMENT LINK</div>
            <div className="form-group">
              <label className="form-label">Amount</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" value={payLinkAmount} onChange={(e) => setPayLinkAmount(e.target.value)} placeholder="50.00" step="any" min="0.001" className="input" style={{ flex: 1 }} />
                <select
                  value={payLinkCurrency}
                  onChange={(e) => setPayLinkCurrency(e.target.value)}
                  className="input"
                  style={{ width: 80, textAlign: 'center' }}
                >
                  {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input type="text" value={payLinkDesc} onChange={(e) => setPayLinkDesc(e.target.value)} placeholder="Consulting session, donation, etc." className="input" />
            </div>
            <button onClick={createPaymentLink} disabled={payLinkCreating} className="btn-primary" style={{ width: '100%', opacity: payLinkCreating ? 0.5 : 1 }}>
              {payLinkCreating ? 'CREATING...' : 'CREATE LINK'}
            </button>
            {payLinkResult && (
              <div style={{ marginTop: 12, background: 'var(--cp-bg)', border: '1px solid var(--cp-green)', borderRadius: 4, padding: 12 }}>
                <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-green)', marginBottom: 6 }}>PAYMENT LINK READY</div>
                <div style={{ fontSize: 10, color: 'var(--cp-text)', wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: 8 }}>
                  {payLinkResult}
                </div>
                <CopyButton text={payLinkResult} label="Copy Link" />
              </div>
            )}
          </div>
        )}

        {loadingInvoices ? (
          <div className="empty-state">
            <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--cp-cyan)', borderTopColor: 'transparent' }} />
          </div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <div className="icon">&#9744;</div>
            <div>No invoices yet</div>
          </div>
        ) : (
          invoices.map((inv) => {
            const priceStr = fiatStr(inv, displayCurrency);
            const isExpanded = expandedInvoice === inv.id;
            const isOverpaid = inv.received_zatoshis > inv.price_zatoshis + 1000 && inv.price_zatoshis > 0;
            const invType = getInvoiceType(inv, recurringPriceIds);
            const typeBadge = TYPE_BADGE_STYLES[invType];
            return (
              <div key={inv.id} className="invoice-card" style={{ cursor: 'pointer' }} onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}>
                <div className="invoice-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="invoice-id">{inv.memo_code}</span>
                    <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: 0.5, color: typeBadge.color, background: typeBadge.bg, padding: '1px 6px', borderRadius: 3 }}>
                      {typeBadge.label}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>
                      {new Date(inv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {isOverpaid && inv.status === 'confirmed' && (
                      <span className="status-badge" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', fontSize: 8 }}>OVERPAID</span>
                    )}
                    <span className={`status-badge status-${inv.status}`}>{inv.status.toUpperCase()}</span>
                  </div>
                </div>
                <div className="invoice-meta">
                  <span>{inv.product_name || '—'} {inv.size || ''}</span>
                  <span><strong>{priceStr}</strong> / {inv.price_zec.toFixed(8)} ZEC</span>
                </div>

                {isExpanded && (
                  <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--cp-border)' }}>
                    <div className="stat-row">
                      <span style={{ color: 'var(--cp-text-muted)' }}>Reference</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {inv.memo_code} <CopyButton text={inv.memo_code} label="" />
                      </span>
                    </div>

                    {inv.received_zatoshis > 0 && (
                      <div className="stat-row">
                        <span style={{ color: isOverpaid ? '#f97316' : 'var(--cp-cyan)' }}>Received</span>
                        <span style={{ color: isOverpaid ? '#f97316' : 'var(--cp-cyan)', fontWeight: 600 }}>
                          {(inv.received_zatoshis / 1e8).toFixed(8)} ZEC
                        </span>
                      </div>
                    )}
                    <div className="stat-row">
                      <span style={{ color: 'var(--cp-text-muted)' }}>Rate at Creation</span>
                      <span>1 ZEC = {sym}{inv.zec_rate_at_creation.toFixed(2)}</span>
                    </div>

                    {inv.product_name && (
                      <div className="stat-row">
                        <span style={{ color: 'var(--cp-text-muted)' }}>Product</span>
                        <span>{inv.product_name}{inv.size ? ` · ${inv.size}` : ''}</span>
                      </div>
                    )}

                    <div className="section-title" style={{ marginTop: 12 }}>TIMELINE</div>
                    <div className="stat-row">
                      <span style={{ color: 'var(--cp-text-muted)' }}>Created</span>
                      <span style={{ fontSize: 10 }}>{new Date(inv.created_at).toLocaleString()}</span>
                    </div>
                    {inv.detected_at && (
                      <div className="stat-row">
                        <span style={{ color: 'var(--cp-text-muted)' }}>Detected</span>
                        <span style={{ fontSize: 10 }}>{new Date(inv.detected_at).toLocaleString()}</span>
                      </div>
                    )}
                    {inv.detected_txid && (
                      <div className="stat-row">
                        <span style={{ color: 'var(--cp-text-muted)' }}>TxID</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9 }}>
                          {inv.detected_txid.substring(0, 16)}...
                          <CopyButton text={inv.detected_txid} label="" />
                        </span>
                      </div>
                    )}
                    {inv.confirmed_at && (
                      <div className="stat-row">
                        <span style={{ color: 'var(--cp-green)' }}>Confirmed</span>
                        <span style={{ fontSize: 10 }}>{new Date(inv.confirmed_at).toLocaleString()}</span>
                      </div>
                    )}
                    {inv.refunded_at && (
                      <div className="stat-row">
                        <span style={{ color: '#f59e0b' }}>Refunded</span>
                        <span style={{ fontSize: 10 }}>{new Date(inv.refunded_at).toLocaleString()}</span>
                      </div>
                    )}
                    {!inv.confirmed_at && !inv.refunded_at && (
                      <div className="stat-row">
                        <span style={{ color: 'var(--cp-text-muted)' }}>Expires</span>
                        <span style={{ fontSize: 10 }}>{new Date(inv.expires_at).toLocaleString()}</span>
                      </div>
                    )}

                    {inv.refund_address && (inv.status === 'confirmed' || inv.status === 'refunded') && (
                      <>
                        <div className="section-title" style={{ marginTop: 12 }}>REFUND ADDRESS</div>
                        <div className="stat-row">
                          <span style={{ fontSize: 9, color: '#f59e0b', wordBreak: 'break-all', maxWidth: '80%' }}>
                            {inv.refund_address}
                          </span>
                          <CopyButton text={inv.refund_address} label="" />
                        </div>
                        {inv.status !== 'refunded' && (
                          <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 4 }}>
                            Send ZEC to this address to refund the buyer, then mark as refunded.
                          </div>
                        )}
                      </>
                    )}

                    {inv.refund_txid && (
                      <>
                        <div className="section-title" style={{ marginTop: 12 }}>REFUND TXID</div>
                        <div className="stat-row">
                          <span style={{ fontSize: 9, color: '#f59e0b', wordBreak: 'break-all', maxWidth: '80%' }}>
                            {inv.refund_txid}
                          </span>
                          <CopyButton text={inv.refund_txid} label="" />
                        </div>
                      </>
                    )}

                    <div className="stat-row" style={{ marginTop: 12 }}>
                      <CopyButton text={`${checkoutOrigin}/pay/${inv.id}`} label="Payment Link" />
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {inv.status === 'confirmed' && (
                          <button
                            onClick={() => setRefundingInvoiceId(inv.id)}
                            style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: 9, letterSpacing: 1, fontFamily: 'inherit', padding: 0, opacity: 0.7 }}
                          >
                            REFUND
                          </button>
                        )}
                        {inv.status === 'pending' && inv.product_name !== 'Fee Settlement' && (
                          <button
                            onClick={() => cancelInvoice(inv.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--cp-red, #ef4444)', cursor: 'pointer', fontSize: 9, letterSpacing: 1, fontFamily: 'inherit', padding: 0, opacity: 0.7 }}
                          >
                            CANCEL
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {refundingInvoiceId && (
        <RefundModal
          invoiceId={refundingInvoiceId}
          onClose={() => setRefundingInvoiceId(null)}
          onRefunded={reloadInvoices}
        />
      )}
    </>
  );
});
