'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Invoice, type MerchantInfo, type Product, type CreateProductRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CopyButton } from '@/components/CopyButton';
import Link from 'next/link';

type Tab = 'products' | 'invoices' | 'settings';

export default function DashboardClient({ merchant }: { merchant: MerchantInfo }) {
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  // Add product form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newVariants, setNewVariants] = useState('');
  const [creating, setCreating] = useState(false);

  // POS quick invoice
  const [posProductId, setPosProductId] = useState<string | null>(null);
  const [posCreating, setPosCreating] = useState(false);

  // Invoice detail expansion
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  // Settings
  const [editName, setEditName] = useState(merchant.name || '');
  const [revealedKey, setRevealedKey] = useState<{ type: string; value: string } | null>(null);

  const { logout } = useAuth();
  const router = useRouter();

  const showToast = (msg: string, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 3000);
  };

  const loadProducts = useCallback(async () => {
    try { setProducts(await api.listProducts()); } catch { /* */ }
    setLoadingProducts(false);
  }, []);

  const loadInvoices = useCallback(async () => {
    try { setInvoices(await api.myInvoices()); } catch { /* */ }
    setLoadingInvoices(false);
  }, []);

  useEffect(() => { loadProducts(); loadInvoices(); }, [loadProducts, loadInvoices]);

  const handleLogout = async () => { await logout(); router.push('/dashboard/login'); };

  const addProduct = async () => {
    if (!newSlug || !newName || !newPrice || parseFloat(newPrice) <= 0) {
      showToast('Slug, name and valid price required', true);
      return;
    }
    setCreating(true);
    try {
      const req: CreateProductRequest = {
        slug: newSlug.toLowerCase().replace(/\s+/g, '-'),
        name: newName,
        price_eur: parseFloat(newPrice),
        description: newDesc || undefined,
        variants: newVariants ? newVariants.split(',').map(v => v.trim()).filter(Boolean) : undefined,
      };
      await api.createProduct(req);
      setNewSlug(''); setNewName(''); setNewDesc(''); setNewPrice(''); setNewVariants('');
      setShowAddForm(false);
      loadProducts();
      showToast('Product added');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', true);
    }
    setCreating(false);
  };

  const deactivateProduct = async (id: string) => {
    try { await api.deactivateProduct(id); loadProducts(); showToast('Product deactivated'); }
    catch { showToast('Failed to deactivate', true); }
  };

  const quickPOS = async (productId: string) => {
    setPosProductId(productId);
    setPosCreating(true);
    try {
      const resp = await api.checkout({ product_id: productId });
      router.push(`/pay/${resp.invoice_id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'POS failed', true);
    }
    setPosCreating(false);
    setPosProductId(null);
  };

  const cancelInvoice = async (id: string) => {
    try { await api.cancelInvoice(id); loadInvoices(); showToast('Invoice cancelled'); }
    catch { showToast('Failed to cancel', true); }
  };

  const shipInvoice = async (id: string) => {
    try { await api.shipInvoice(id); loadInvoices(); showToast('Marked as shipped'); }
    catch { showToast('Failed to mark as shipped', true); }
  };

  const saveName = async () => {
    try {
      await api.updateMe({ name: editName });
      showToast('Name updated');
    } catch { showToast('Failed to update name', true); }
  };

  const regenApiKey = async () => {
    try {
      const resp = await api.regenerateApiKey();
      setRevealedKey({ type: 'API Key', value: resp.api_key });
      showToast('API key regenerated. Copy it now — it won\'t be shown again.');
    } catch { showToast('Failed to regenerate', true); }
  };

  const regenDashToken = async () => {
    try {
      const resp = await api.regenerateDashboardToken();
      setRevealedKey({ type: 'Dashboard Token', value: resp.dashboard_token });
      showToast('Dashboard token regenerated. Copy it now — it won\'t be shown again.');
    } catch { showToast('Failed to regenerate', true); }
  };

  const regenWebhookSecret = async () => {
    try {
      const resp = await api.regenerateWebhookSecret();
      setRevealedKey({ type: 'Webhook Secret', value: resp.webhook_secret });
      showToast('Webhook secret regenerated');
    } catch { showToast('Failed to regenerate', true); }
  };

  const checkoutOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const parseVariants = (v: string | null): string[] => {
    if (!v) return [];
    try { return JSON.parse(v); } catch { return []; }
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <Link href="/"><Logo size="sm" /></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="tag">DASHBOARD // TESTNET</span>
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
                {merchant.name && (
                  <div className="stat-row">
                    <span style={{ color: 'var(--cp-text-muted)' }}>Store</span>
                    <span style={{ fontWeight: 600, color: 'var(--cp-text)' }}>{merchant.name}</span>
                  </div>
                )}
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

            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: 0, marginTop: 16 }}>
              <button
                onClick={() => setTab('products')}
                className={tab === 'products' ? 'btn-primary' : 'btn'}
                style={{ borderRadius: '4px 0 0 0', flex: 1 }}
              >
                PRODUCTS
              </button>
              <button
                onClick={() => setTab('invoices')}
                className={tab === 'invoices' ? 'btn-primary' : 'btn'}
                style={{ borderRadius: 0, flex: 1 }}
              >
                INVOICES
              </button>
              <button
                onClick={() => setTab('settings')}
                className={tab === 'settings' ? 'btn-primary' : 'btn'}
                style={{ borderRadius: '0 4px 0 0', flex: 1 }}
              >
                SETTINGS
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {tab === 'products' ? (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">02 // Product Catalog</span>
                  <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-small">
                    {showAddForm ? 'CANCEL' : '+ ADD PRODUCT'}
                  </button>
                </div>

                {showAddForm && (
                  <div className="panel-body" style={{ borderBottom: '1px solid var(--cp-border)' }}>
                    <div className="form-group">
                      <label className="form-label">Slug (URL identifier)</label>
                      <input type="text" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="redacted-tee" className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="[REDACTED] Tee" className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description (optional)</label>
                      <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Premium privacy tee" rows={2} className="input" style={{ resize: 'vertical', minHeight: 50 }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price (EUR)</label>
                      <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="65" step="any" min="0.001" className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Variants (comma-separated, optional)</label>
                      <input type="text" value={newVariants} onChange={(e) => setNewVariants(e.target.value)} placeholder="S, M, L, XL" className="input" />
                    </div>
                    <button onClick={addProduct} disabled={creating} className="btn-primary" style={{ width: '100%', opacity: creating ? 0.5 : 1 }}>
                      {creating ? 'ADDING...' : 'ADD PRODUCT'}
                    </button>
                  </div>
                )}

                {loadingProducts ? (
                  <div className="empty-state">
                    <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--cp-cyan)', borderTopColor: 'transparent' }} />
                  </div>
                ) : products.filter(p => p.active === 1).length === 0 ? (
                  <div className="empty-state">
                    <div className="icon">&#9744;</div>
                    <div>No products yet. Add your first product above.</div>
                  </div>
                ) : (
                  products.filter(p => p.active === 1).map((product) => {
                    const variants = parseVariants(product.variants);
                    return (
                      <div key={product.id} className="invoice-card">
                        <div className="invoice-header">
                          <span className="invoice-id">{product.name}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cp-text)' }}>€{product.price_eur.toFixed(2)}</span>
                        </div>
                        <div className="invoice-meta">
                          <span style={{ color: 'var(--cp-text-dim)', fontSize: 10 }}>/{product.slug}</span>
                          {variants.length > 0 && (
                            <span style={{ fontSize: 10 }}>{variants.join(' · ')}</span>
                          )}
                        </div>
                        {product.description && (
                          <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 4 }}>{product.description}</div>
                        )}
                        <div className="invoice-actions">
                          <CopyButton text={`${checkoutOrigin}/buy/${product.id}`} label="Buy Link" />
                          <button
                            onClick={() => quickPOS(product.id)}
                            disabled={posCreating && posProductId === product.id}
                            className="btn btn-small"
                            style={{ color: 'var(--cp-green)', borderColor: 'rgba(34,197,94,0.5)' }}
                          >
                            {posCreating && posProductId === product.id ? 'CREATING...' : 'QUICK POS'}
                          </button>
                          <button onClick={() => deactivateProduct(product.id)} className="btn btn-small btn-cancel">
                            REMOVE
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : tab === 'invoices' ? (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">03 // Invoices</span>
                  <button onClick={loadInvoices} className="btn btn-small">REFRESH</button>
                </div>

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
                    const eurStr = inv.price_eur < 0.01 ? `€${inv.price_eur}` : `€${inv.price_eur.toFixed(2)}`;
                    const isExpanded = expandedInvoice === inv.id;
                    return (
                      <div key={inv.id} className="invoice-card" style={{ cursor: 'pointer' }} onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}>
                        <div className="invoice-header">
                          <span className="invoice-id">{inv.memo_code}</span>
                          <span className={`status-badge status-${inv.status}`}>{inv.status.toUpperCase()}</span>
                        </div>
                        <div className="invoice-meta">
                          <span>{inv.product_name || '—'} {inv.size || ''}</span>
                          <span><strong>{eurStr}</strong> / {inv.price_zec.toFixed(8)} ZEC</span>
                        </div>

                        {isExpanded && (
                          <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--cp-border)' }}>
                            {/* Full memo */}
                            <div className="stat-row">
                              <span style={{ color: 'var(--cp-text-muted)' }}>Memo</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cp-purple)' }}>
                                {inv.memo_code} <CopyButton text={inv.memo_code} label="" />
                              </span>
                            </div>

                            {/* Pricing */}
                            <div className="stat-row">
                              <span style={{ color: 'var(--cp-text-muted)' }}>Price</span>
                              <span>{eurStr} / {inv.price_zec.toFixed(8)} ZEC</span>
                            </div>
                            <div className="stat-row">
                              <span style={{ color: 'var(--cp-text-muted)' }}>Rate at Creation</span>
                              <span>1 ZEC = €{inv.zec_rate_at_creation.toFixed(2)}</span>
                            </div>

                            {/* Product info */}
                            {inv.product_name && (
                              <div className="stat-row">
                                <span style={{ color: 'var(--cp-text-muted)' }}>Product</span>
                                <span>{inv.product_name}{inv.size ? ` · ${inv.size}` : ''}</span>
                              </div>
                            )}

                            {/* Shipping */}
                            {(inv.shipping_alias || inv.shipping_address || inv.shipping_region) && (
                              <>
                                <div className="section-title" style={{ marginTop: 12 }}>SHIPPING</div>
                                {inv.shipping_alias && (
                                  <div className="stat-row">
                                    <span style={{ color: 'var(--cp-text-muted)' }}>Alias</span>
                                    <span>{inv.shipping_alias}</span>
                                  </div>
                                )}
                                {inv.shipping_address && (
                                  <div className="stat-row">
                                    <span style={{ color: 'var(--cp-text-muted)' }}>Address</span>
                                    <span style={{ maxWidth: 200, textAlign: 'right', wordBreak: 'break-word' }}>{inv.shipping_address}</span>
                                  </div>
                                )}
                                {inv.shipping_region && (
                                  <div className="stat-row">
                                    <span style={{ color: 'var(--cp-text-muted)' }}>Region</span>
                                    <span>{inv.shipping_region}</span>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Timeline */}
                            <div className="section-title" style={{ marginTop: 12 }}>TIMELINE</div>
                            <div className="stat-row">
                              <span style={{ color: 'var(--cp-text-muted)' }}>Created</span>
                              <span style={{ fontSize: 10 }}>{new Date(inv.created_at).toLocaleString()}</span>
                            </div>
                            {inv.detected_at && (
                              <div className="stat-row">
                                <span style={{ color: 'var(--cp-purple)' }}>Detected</span>
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
                            {inv.shipped_at && (
                              <div className="stat-row">
                                <span style={{ color: 'var(--cp-cyan)' }}>Shipped</span>
                                <span style={{ fontSize: 10 }}>{new Date(inv.shipped_at).toLocaleString()}</span>
                              </div>
                            )}
                            <div className="stat-row">
                              <span style={{ color: 'var(--cp-text-muted)' }}>Expires</span>
                              <span style={{ fontSize: 10 }}>{new Date(inv.expires_at).toLocaleString()}</span>
                            </div>

                            {/* Actions */}
                            <div className="invoice-actions" style={{ marginTop: 12 }}>
                              <CopyButton text={`${checkoutOrigin}/pay/${inv.id}`} label="Payment Link" />
                              {inv.status === 'confirmed' && (
                                <button onClick={() => shipInvoice(inv.id)} className="btn btn-small" style={{ color: 'var(--cp-cyan)', borderColor: 'var(--cp-cyan)' }}>
                                  MARK SHIPPED
                                </button>
                              )}
                              {inv.status === 'pending' && (
                                <button onClick={() => cancelInvoice(inv.id)} className="btn btn-small btn-cancel">CANCEL</button>
                              )}
                            </div>
                          </div>
                        )}

                        {!isExpanded && (
                          <div className="invoice-actions">
                            <CopyButton text={`${checkoutOrigin}/pay/${inv.id}`} label="Payment Link" />
                            {inv.status === 'confirmed' && (
                              <button onClick={(e) => { e.stopPropagation(); shipInvoice(inv.id); }} className="btn btn-small" style={{ color: 'var(--cp-cyan)', borderColor: 'var(--cp-cyan)' }}>
                                MARK SHIPPED
                              </button>
                            )}
                            {inv.status === 'pending' && (
                              <button onClick={(e) => { e.stopPropagation(); cancelInvoice(inv.id); }} className="btn btn-small btn-cancel">CANCEL</button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">04 // Settings</span>
                </div>
                <div className="panel-body">
                  {/* Store Name */}
                  <div className="section-title">Store Name</div>
                  <div className="form-group" style={{ display: 'flex', gap: 8 }}>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="My Store" className="input" style={{ flex: 1 }} />
                    <button onClick={saveName} className="btn btn-small">SAVE</button>
                  </div>

                  <div className="divider" />

                  {/* Webhook Secret */}
                  <div className="section-title">Webhook Secret</div>
                  <div className="stat-row">
                    <span style={{ fontSize: 10, color: 'var(--cp-text-dim)', wordBreak: 'break-all' }}>
                      {merchant.webhook_secret_preview || 'Not set'}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={regenWebhookSecret} className="btn btn-small">REGENERATE</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 4 }}>
                    Full secret is only shown when regenerated. Copy it immediately.
                  </div>

                  <div className="divider" />

                  {/* Key Regeneration */}
                  <div className="section-title">API Keys</div>
                  <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginBottom: 12 }}>
                    Keys are shown once when generated. Regenerating invalidates the old key immediately.
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button onClick={regenApiKey} className="btn" style={{ flex: 1 }}>REGENERATE API KEY</button>
                    <button onClick={regenDashToken} className="btn" style={{ flex: 1 }}>REGENERATE DASHBOARD TOKEN</button>
                  </div>

                  {revealedKey && (
                    <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-cyan)', borderRadius: 4, padding: 12, marginTop: 8 }}>
                      <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-cyan)', marginBottom: 6 }}>
                        NEW {revealedKey.type.toUpperCase()} — COPY NOW
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--cp-text)', wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: 8 }}>
                        {revealedKey.value}
                      </div>
                      <CopyButton text={revealedKey.value} label="Copy" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {toast && <div className={`toast ${toast.error ? 'error' : ''}`}>{toast.msg}</div>}
    </div>
  );
}
