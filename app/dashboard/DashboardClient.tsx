'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Invoice, type MerchantInfo, type CreateInvoiceRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CopyButton } from '@/components/CopyButton';
import Link from 'next/link';

const PRODUCTS = [
  { name: '[REDACTED] Tee', price: 65 },
  { name: '[ZERO KNOWLEDGE] Tee', price: 65 },
  { name: '[CLASSIFIED] Tee', price: 65 },
  { name: '[DO NOT TRACK] Tee', price: 65 },
  { name: 'Custom', price: 0 },
];

const SIZES = ['S', 'M', 'L', 'XL'];

export default function DashboardClient({ merchant }: { merchant: MerchantInfo }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [customPrice, setCustomPrice] = useState('');
  const [selectedSize, setSelectedSize] = useState(1);
  const [shippingAlias, setShippingAlias] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  const { logout } = useAuth();
  const router = useRouter();

  const showToast = (msg: string, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 3000);
  };

  const loadInvoices = useCallback(async () => {
    try { setInvoices(await api.myInvoices()); } catch { /* session expired */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const handleLogout = async () => { await logout(); router.push('/dashboard/login'); };

  const createInvoice = async () => {
    const product = PRODUCTS[selectedProduct];
    const isCustom = product.name === 'Custom';
    const price = isCustom ? parseFloat(customPrice) : product.price;
    if (!price || price <= 0) { showToast('Enter a valid price', true); return; }

    setCreating(true);
    try {
      const req: CreateInvoiceRequest = {
        price_eur: price,
        product_name: product.name === 'Custom' ? undefined : product.name,
        size: SIZES[selectedSize],
        shipping_alias: shippingAlias || undefined,
        shipping_address: shippingAddress || undefined,
      };
      const data = await api.createInvoice(req);
      loadInvoices();
      showToast('Invoice created: ' + data.memo_code);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', true);
    }
    setCreating(false);
  };

  const cancelInvoice = async (id: string) => {
    try { await api.cancelInvoice(id); loadInvoices(); showToast('Invoice cancelled'); }
    catch { showToast('Failed to cancel', true); }
  };

  const isCustom = PRODUCTS[selectedProduct].name === 'Custom';
  const checkoutOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <Link href="/"><Logo size="sm" /></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="tag">TEST CONSOLE // TESTNET</span>
          <ThemeToggle />
          <button onClick={handleLogout} style={{ fontSize: 11, color: 'var(--cp-text-muted)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 1, fontFamily: 'inherit' }}>
            SIGN OUT
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <div className="grid-layout">

          {/* Left Column */}
          <div>
            {/* Merchant Info */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">01 // Merchant</span>
                <span className="status-badge status-confirmed">ACTIVE</span>
              </div>
              <div className="panel-body">
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Merchant ID</span>
                  <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {merchant.id.substring(0, 8)}...
                    <CopyButton text={merchant.id} label="" />
                  </span>
                </div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Address</span>
                  <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--cp-cyan)', fontSize: 9 }}>{merchant.payment_address.substring(0, 16)}...</span>
                    <CopyButton text={merchant.payment_address} label="" />
                  </span>
                </div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Invoices</span>
                  <span style={{ fontWeight: 500 }}>{merchant.stats.total_invoices}</span>
                </div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Confirmed</span>
                  <span style={{ fontWeight: 500, color: 'var(--cp-green)' }}>{merchant.stats.confirmed}</span>
                </div>
                <div className="stat-row">
                  <span style={{ color: 'var(--cp-text-muted)' }}>Total Received</span>
                  <span style={{ fontWeight: 500, color: 'var(--cp-cyan)' }}>{merchant.stats.total_zec.toFixed(8)} ZEC</span>
                </div>
              </div>
            </div>

            {/* Create Invoice */}
            <div className="panel" style={{ marginTop: 16 }}>
              <div className="panel-header">
                <span className="panel-title">02 // Create Invoice</span>
              </div>
              <div className="panel-body">
                <div className="form-group">
                  <label className="form-label">Product</label>
                  <select value={selectedProduct} onChange={(e) => setSelectedProduct(Number(e.target.value))} className="input">
                    {PRODUCTS.map((p, i) => (
                      <option key={i} value={i}>{p.name === 'Custom' ? 'Custom Amount' : `${p.name} — ${p.price} EUR`}</option>
                    ))}
                  </select>
                </div>

                {isCustom && (
                  <div className="form-group">
                    <label className="form-label">Price (EUR)</label>
                    <input type="number" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="65" step="any" min="0.001" className="input" />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Size</label>
                  <select value={selectedSize} onChange={(e) => setSelectedSize(Number(e.target.value))} className="input">
                    {SIZES.map((s, i) => <option key={i} value={i}>{s}</option>)}
                  </select>
                </div>

                <div className="divider" />
                <div className="section-title">Shipping (encrypted, auto-purged)</div>

                <div className="form-group">
                  <label className="form-label">Alias</label>
                  <input type="text" value={shippingAlias} onChange={(e) => setShippingAlias(e.target.value)} placeholder="anon_buyer_42" className="input" />
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="123 Privacy St, Zurich CH-8001" rows={2} className="input" style={{ resize: 'vertical', minHeight: 60 }} />
                </div>

                <button onClick={createInvoice} disabled={creating} className="btn-primary" style={{ width: '100%', opacity: creating ? 0.5 : 1 }}>
                  {creating ? 'CREATING...' : 'CREATE INVOICE'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Invoice List */}
          <div>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Invoices</span>
                <button onClick={loadInvoices} className="btn btn-small">REFRESH</button>
              </div>

              {loading ? (
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
                  const eurStr = inv.price_eur < 0.01 ? `€${inv.price_eur}` : `€${inv.price_eur.toFixed(2)}`;
                  return (
                    <div key={inv.id} className="invoice-card">
                      <div className="invoice-header">
                        <span className="invoice-id">{inv.memo_code}</span>
                        <span className={`status-badge status-${inv.status}`}>{inv.status.toUpperCase()}</span>
                      </div>
                      <div className="invoice-meta">
                        <span>{inv.product_name || '—'} {inv.size || ''}</span>
                        <span><strong>{eurStr}</strong> / {inv.price_zec.toFixed(8)} ZEC</span>
                      </div>
                      <div className="invoice-actions">
                        <CopyButton text={`${checkoutOrigin}/pay/${inv.id}`} label="Payment Link" />
                        {inv.status === 'pending' && (
                          <button onClick={() => cancelInvoice(inv.id)} className="btn btn-small btn-cancel">CANCEL</button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {toast && <div className={`toast ${toast.error ? 'error' : ''}`}>{toast.msg}</div>}
    </div>
  );
}
