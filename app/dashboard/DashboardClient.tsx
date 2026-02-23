'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Invoice, type MerchantInfo, type Product, type CreateProductRequest, type UpdateProductRequest, type BillingSummary } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail, validateWebhookUrl, validateLength } from '@/lib/validation';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CopyButton } from '@/components/CopyButton';
import Link from 'next/link';

type Tab = 'products' | 'invoices' | 'pos' | 'billing' | 'settings';

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
  const [newCurrency, setNewCurrency] = useState<'EUR' | 'USD'>('EUR');
  const [creating, setCreating] = useState(false);

  // Product editing
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdVariants, setEditProdVariants] = useState('');
  const [editProdCurrency, setEditProdCurrency] = useState<'EUR' | 'USD'>('EUR');
  const [savingProduct, setSavingProduct] = useState(false);

  // POS quick invoice
  const [posProductId, setPosProductId] = useState<string | null>(null);
  const [posCreating, setPosCreating] = useState(false);

  // POS cart
  const [cart, setCart] = useState<Record<string, number>>({});
  const [posCheckingOut, setPosCheckingOut] = useState(false);

  // Invoice detail expansion
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  // Payment link creation
  const [showPayLinkForm, setShowPayLinkForm] = useState(false);
  const [payLinkAmount, setPayLinkAmount] = useState('');
  const [payLinkDesc, setPayLinkDesc] = useState('');
  const [payLinkCurrency, setPayLinkCurrency] = useState<'EUR' | 'USD'>('EUR');
  const [payLinkCreating, setPayLinkCreating] = useState(false);
  const [payLinkResult, setPayLinkResult] = useState<string | null>(null);

  // Settings
  const [editingName, setEditingName] = useState(!merchant.name);
  const [editName, setEditName] = useState(merchant.name || '');
  const [editingWebhook, setEditingWebhook] = useState(!merchant.webhook_url);
  const [editWebhookUrl, setEditWebhookUrl] = useState(merchant.webhook_url || '');
  const [editEmail, setEditEmail] = useState('');
  const [revealedKey, setRevealedKey] = useState<{ type: string; value: string } | null>(null);

  // Billing
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [billingSettling, setBillingSettling] = useState(false);

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

  const loadBilling = useCallback(async () => {
    try { setBilling(await api.getBilling()); } catch { /* billing not available */ }
  }, []);

  useEffect(() => { loadProducts(); loadInvoices(); loadBilling(); }, [loadProducts, loadInvoices, loadBilling]);

  const handleLogout = async () => { await logout(); router.push('/dashboard/login'); };

  const settleBilling = async () => {
    setBillingSettling(true);
    try {
      const resp = await api.settleBilling();
      showToast(`Settlement invoice created: ${resp.outstanding_zec.toFixed(6)} ZEC`);
      if (resp.invoice_id) {
        window.open(`/pay/${resp.invoice_id}`, '_blank');
      }
      loadBilling();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to settle', true);
    }
    setBillingSettling(false);
  };

  const billingBlocked = billing?.fee_enabled &&
    (billing.billing_status === 'past_due' || billing.billing_status === 'suspended');

  const addProduct = async () => {
    if (!newSlug || !newName || !newPrice || parseFloat(newPrice) <= 0) {
      showToast('Slug, name and valid price required', true);
      return;
    }
    const slugErr = validateLength(newSlug, 100, 'Slug');
    if (slugErr) { showToast(slugErr, true); return; }
    const nameErr = validateLength(newName, 200, 'Name');
    if (nameErr) { showToast(nameErr, true); return; }
    setCreating(true);
    try {
      const req: CreateProductRequest = {
        slug: newSlug.toLowerCase().replace(/\s+/g, '-'),
        name: newName,
        price_eur: parseFloat(newPrice),
        currency: newCurrency,
        description: newDesc || undefined,
        variants: newVariants ? newVariants.split(',').map(v => v.trim()).filter(Boolean) : undefined,
      };
      await api.createProduct(req);
      setNewSlug(''); setNewName(''); setNewDesc(''); setNewPrice(''); setNewVariants(''); setNewCurrency('EUR');
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

  const startEditProduct = (product: Product) => {
    setEditingProduct(product.id);
    setEditProdName(product.name);
    setEditProdDesc(product.description || '');
    setEditProdPrice(product.price_eur.toString());
    setEditProdCurrency((product.currency === 'USD' ? 'USD' : 'EUR') as 'EUR' | 'USD');
    setEditProdVariants(parseVariants(product.variants).join(', '));
  };

  const cancelEditProduct = () => {
    setEditingProduct(null);
  };

  const saveProduct = async (productId: string) => {
    if (!editProdName || !editProdPrice || parseFloat(editProdPrice) <= 0) {
      showToast('Name and valid price required', true);
      return;
    }
    setSavingProduct(true);
    try {
      const req: UpdateProductRequest = {
        name: editProdName,
        description: editProdDesc || undefined,
        price_eur: parseFloat(editProdPrice),
        currency: editProdCurrency,
        variants: editProdVariants ? editProdVariants.split(',').map(v => v.trim()).filter(Boolean) : [],
      };
      await api.updateProduct(productId, req);
      setEditingProduct(null);
      loadProducts();
      showToast('Product updated');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update', true);
    }
    setSavingProduct(false);
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

  const cartAdd = (productId: string) => {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };
  const cartRemove = (productId: string) => {
    setCart(prev => {
      const qty = (prev[productId] || 0) - 1;
      if (qty <= 0) { const { [productId]: _, ...rest } = prev; return rest; }
      return { ...prev, [productId]: qty };
    });
  };
  const cartTotal = Object.entries(cart).reduce((sum, [pid, qty]) => {
    const product = products.find(p => p.id === pid);
    return sum + (product ? product.price_eur * qty : 0);
  }, 0);
  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartCurrencies = [...new Set(Object.keys(cart).map(pid => {
    const p = products.find(pr => pr.id === pid);
    return p?.currency || 'EUR';
  }))];
  const cartCurrency = cartCurrencies.length === 1 ? cartCurrencies[0] : 'EUR';
  const cartMixedCurrency = cartCurrencies.length > 1;
  const cartSymbol = cartCurrency === 'USD' ? '$' : '€';
  const cartSummary = Object.entries(cart)
    .map(([pid, qty]) => {
      const product = products.find(p => p.id === pid);
      return product ? `${qty}x ${product.name}` : '';
    })
    .filter(Boolean)
    .join(', ');

  const posCartCheckout = async () => {
    if (cartTotal <= 0 || cartMixedCurrency) return;
    setPosCheckingOut(true);
    try {
      const resp = await api.createInvoice({
        product_name: cartSummary,
        price_eur: Math.round(cartTotal * 100) / 100,
        currency: cartCurrency,
      });
      setCart({});
      router.push(`/pay/${resp.invoice_id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Checkout failed', true);
    }
    setPosCheckingOut(false);
  };

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
        price_eur: Math.round(amount * 100) / 100,
        currency: payLinkCurrency,
      });
      const link = `${checkoutOrigin}/pay/${resp.invoice_id}`;
      setPayLinkResult(link);
      loadInvoices();
      showToast('Payment link created');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create link', true);
    }
    setPayLinkCreating(false);
  };

  const cancelInvoice = async (id: string) => {
    try { await api.cancelInvoice(id); loadInvoices(); showToast('Invoice cancelled'); }
    catch { showToast('Failed to cancel', true); }
  };

  const refundInvoice = async (id: string) => {
    try {
      const resp = await api.refundInvoice(id);
      loadInvoices();
      showToast(resp.refund_address ? 'Marked as refunded — see refund address below' : 'Marked as refunded');
    } catch { showToast('Failed to mark as refunded', true); }
  };

  const saveName = async () => {
    const err = validateLength(editName, 100, 'Store name');
    if (err) { showToast(err, true); return; }
    try {
      await api.updateMe({ name: editName });
      setEditingName(false);
      showToast('Name updated');
    } catch { showToast('Failed to update name', true); }
  };

  const saveWebhookUrl = async () => {
    if (editWebhookUrl) {
      const err = validateWebhookUrl(editWebhookUrl);
      if (err) { showToast(err, true); return; }
    }
    try {
      await api.updateMe({ webhook_url: editWebhookUrl || '' });
      setEditingWebhook(!editWebhookUrl);
      showToast(editWebhookUrl ? 'Webhook URL saved' : 'Webhook URL removed');
    } catch { showToast('Failed to update webhook URL', true); }
  };

  const saveEmail = async () => {
    const emailErr = validateEmail(editEmail);
    if (emailErr) { showToast(emailErr, true); return; }
    try {
      await api.updateMe({ recovery_email: editEmail });
      showToast('Recovery email saved');
      setEditEmail('');
    } catch { showToast('Failed to save email', true); }
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

      {/* Billing status banners */}
      {billing?.fee_enabled && billing.billing_status === 'suspended' && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', letterSpacing: 1 }}>ACCOUNT SUSPENDED</div>
            <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginTop: 4 }}>
              Outstanding balance: {billing.outstanding_zec.toFixed(6)} ZEC. Pay to restore service.
            </div>
          </div>
          <button onClick={settleBilling} disabled={billingSettling} className="btn" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.5)' }}>
            {billingSettling ? 'CREATING...' : 'PAY NOW'}
          </button>
        </div>
      )}
      {billing?.fee_enabled && billing.billing_status === 'past_due' && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: 1 }}>PAST DUE</div>
            <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', marginTop: 2 }}>
              Outstanding: {billing.outstanding_zec.toFixed(6)} ZEC. Invoice/product creation is blocked until paid.
            </div>
          </div>
          <button onClick={settleBilling} disabled={billingSettling} className="btn" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.5)' }}>
            {billingSettling ? 'CREATING...' : 'PAY NOW'}
          </button>
        </div>
      )}

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

            {/* Navigation */}
            <nav style={{ marginTop: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--cp-text-dim)', padding: '8px 14px 4px', fontWeight: 600 }}><span style={{ color: 'var(--cp-cyan)', opacity: 0.4 }}>//</span> STORE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {([
                  { key: 'products' as Tab, label: 'PRODUCTS' },
                  { key: 'pos' as Tab, label: `POS${cartItemCount > 0 ? ` (${cartItemCount})` : ''}` },
                  { key: 'invoices' as Tab, label: 'INVOICES' },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: tab === key ? 'var(--cp-surface)' : 'transparent',
                      border: tab === key ? '1px solid var(--cp-border)' : '1px solid transparent',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 11, letterSpacing: 1.5, fontWeight: tab === key ? 600 : 400,
                      color: tab === key ? 'var(--cp-cyan)' : 'var(--cp-text-muted)',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--cp-border)', margin: '8px 0' }} />

              <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--cp-text-dim)', padding: '4px 14px 4px', fontWeight: 600 }}><span style={{ color: 'var(--cp-cyan)', opacity: 0.4 }}>//</span> ACCOUNT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {([
                  { key: 'billing' as Tab, label: 'BILLING' },
                  { key: 'settings' as Tab, label: 'SETTINGS' },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: tab === key ? 'var(--cp-surface)' : 'transparent',
                      border: tab === key ? '1px solid var(--cp-border)' : '1px solid transparent',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 11, letterSpacing: 1.5, fontWeight: tab === key ? 600 : 400,
                      color: tab === key ? 'var(--cp-cyan)' : 'var(--cp-text-muted)',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                    {key === 'billing' && billing?.fee_enabled && billing.outstanding_zec > 0.00001 && (
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: billing.billing_status === 'active' ? '#f59e0b' : '#ef4444',
                        flexShrink: 0,
                      }} />
                    )}
                  </button>
                ))}
              </div>
            </nav>
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
                      <label className="form-label">Price</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="65" step="any" min="0.001" className="input" style={{ flex: 1 }} />
                        <select
                          value={newCurrency}
                          onChange={(e) => setNewCurrency(e.target.value as 'EUR' | 'USD')}
                          className="input"
                          style={{ width: 80, textAlign: 'center' }}
                        >
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Variants (optional)</label>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                          const selected = newVariants.split(',').map(v => v.trim()).filter(Boolean).includes(size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                const current = newVariants.split(',').map(v => v.trim()).filter(Boolean);
                                const next = selected ? current.filter(v => v !== size) : [...current, size];
                                setNewVariants(next.join(', '));
                              }}
                              className={selected ? 'btn-primary' : 'btn'}
                              style={{ minWidth: 40, padding: '6px 10px', fontSize: 11 }}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                      <input type="text" value={newVariants} onChange={(e) => setNewVariants(e.target.value)} placeholder="Custom: Red, Blue, Green" className="input" style={{ fontSize: 10 }} />
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
                    const isEditing = editingProduct === product.id;
                    return (
                      <div key={product.id} className="invoice-card">
                        {isEditing ? (
                          <div onClick={(e) => e.stopPropagation()}>
                            <div className="form-group">
                              <label className="form-label">Name</label>
                              <input type="text" value={editProdName} onChange={(e) => setEditProdName(e.target.value)} className="input" />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Price</label>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input type="number" value={editProdPrice} onChange={(e) => setEditProdPrice(e.target.value)} step="any" min="0.001" className="input" style={{ flex: 1 }} />
                                <select
                                  value={editProdCurrency}
                                  onChange={(e) => setEditProdCurrency(e.target.value as 'EUR' | 'USD')}
                                  className="input"
                                  style={{ width: 80, textAlign: 'center' }}
                                >
                                  <option value="EUR">EUR</option>
                                  <option value="USD">USD</option>
                                </select>
                              </div>
                            </div>
                            <div className="form-group">
                              <label className="form-label">Description</label>
                              <input type="text" value={editProdDesc} onChange={(e) => setEditProdDesc(e.target.value)} placeholder="Optional" className="input" />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Variants</label>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                                  const selected = editProdVariants.split(',').map(v => v.trim()).filter(Boolean).includes(size);
                                  return (
                                    <button
                                      key={size}
                                      type="button"
                                      onClick={() => {
                                        const current = editProdVariants.split(',').map(v => v.trim()).filter(Boolean);
                                        const next = selected ? current.filter(v => v !== size) : [...current, size];
                                        setEditProdVariants(next.join(', '));
                                      }}
                                      className={selected ? 'btn-primary' : 'btn'}
                                      style={{ minWidth: 40, padding: '6px 10px', fontSize: 11 }}
                                    >
                                      {size}
                                    </button>
                                  );
                                })}
                              </div>
                              <input type="text" value={editProdVariants} onChange={(e) => setEditProdVariants(e.target.value)} placeholder="Custom: Red, Blue, Green" className="input" style={{ fontSize: 10 }} />
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              <button onClick={() => saveProduct(product.id)} disabled={savingProduct} className="btn-primary" style={{ flex: 1, opacity: savingProduct ? 0.5 : 1 }}>
                                {savingProduct ? 'SAVING...' : 'SAVE'}
                              </button>
                              <button onClick={cancelEditProduct} className="btn" style={{ flex: 1 }}>CANCEL</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="invoice-header">
                              <span className="invoice-id">{product.name}</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cp-text)' }}>
                                {product.currency === 'USD' ? '$' : '€'}{product.price_eur.toFixed(2)}
                                {product.currency === 'USD' && <span style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginLeft: 4 }}>USD</span>}
                              </span>
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
                              <button onClick={() => startEditProduct(product)} className="btn btn-small">EDIT</button>
                              <button
                                onClick={() => quickPOS(product.id)}
                                disabled={posCreating && posProductId === product.id}
                                className="btn btn-small"
                                style={{ color: 'var(--cp-green)', borderColor: 'rgba(34,197,94,0.5)' }}
                              >
                                {posCreating && posProductId === product.id ? 'CREATING...' : 'QUICK POS'}
                              </button>
                              <button onClick={() => deactivateProduct(product.id)} className="btn btn-small btn-cancel">REMOVE</button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : tab === 'pos' ? (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">POS // Point of Sale</span>
                  {cartItemCount > 0 && (
                    <button onClick={() => setCart({})} className="btn btn-small btn-cancel">CLEAR</button>
                  )}
                </div>

                {loadingProducts ? (
                  <div className="empty-state">
                    <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--cp-cyan)', borderTopColor: 'transparent' }} />
                  </div>
                ) : products.filter(p => p.active === 1).length === 0 ? (
                  <div className="empty-state">
                    <div className="icon">&#9744;</div>
                    <div>Add products first to use POS.</div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, padding: 16 }}>
                      {products.filter(p => p.active === 1).map((product) => {
                        const qty = cart[product.id] || 0;
                        return (
                          <div
                            key={product.id}
                            style={{
                              border: `1px solid ${qty > 0 ? 'var(--cp-cyan)' : 'var(--cp-border)'}`,
                              borderRadius: 4,
                              padding: 12,
                              background: qty > 0 ? 'rgba(6, 182, 212, 0.05)' : 'transparent',
                              transition: 'all 0.15s',
                            }}
                          >
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--cp-text)' }}>
                              {product.name}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cp-text)', marginBottom: 8 }}>
                              {product.currency === 'USD' ? '$' : '€'}{product.price_eur.toFixed(2)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button
                                onClick={() => cartRemove(product.id)}
                                disabled={qty === 0}
                                style={{
                                  width: 28, height: 28, border: '1px solid var(--cp-border)',
                                  borderRadius: 4, background: 'transparent', color: 'var(--cp-text)',
                                  fontSize: 16, cursor: qty === 0 ? 'not-allowed' : 'pointer',
                                  opacity: qty === 0 ? 0.3 : 1, fontFamily: 'inherit',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                −
                              </button>
                              <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center', color: qty > 0 ? 'var(--cp-cyan)' : 'var(--cp-text-dim)' }}>
                                {qty}
                              </span>
                              <button
                                onClick={() => cartAdd(product.id)}
                                style={{
                                  width: 28, height: 28, border: '1px solid var(--cp-cyan)',
                                  borderRadius: 4, background: 'transparent', color: 'var(--cp-cyan)',
                                  fontSize: 16, cursor: 'pointer', fontFamily: 'inherit',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Cart summary + checkout */}
                    <div style={{ padding: '16px', borderTop: '1px solid var(--cp-border)' }}>
                      {cartItemCount > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1, marginBottom: 6 }}>ORDER SUMMARY</div>
                          {Object.entries(cart).map(([pid, qty]) => {
                            const product = products.find(p => p.id === pid);
                            if (!product) return null;
                            return (
                              <div key={pid} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', color: 'var(--cp-text-muted)' }}>
                                <span>{qty}x {product.name}</span>
                                <span>{product.currency === 'USD' ? '$' : '€'}{(product.price_eur * qty).toFixed(2)}</span>
                              </div>
                            );
                          })}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--cp-border)' }}>
                            <span>TOTAL</span>
                            <span>{cartSymbol}{cartTotal.toFixed(2)}</span>
                          </div>
                          {cartMixedCurrency && (
                            <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 6 }}>
                              Mixed currencies in cart. Remove items until all are the same currency.
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        onClick={posCartCheckout}
                        disabled={cartItemCount === 0 || posCheckingOut || cartMixedCurrency}
                        className="btn-primary"
                        style={{
                          width: '100%', padding: '14px 0', fontSize: 13, letterSpacing: 2,
                          opacity: cartItemCount === 0 || posCheckingOut || cartMixedCurrency ? 0.4 : 1,
                        }}
                      >
                        {posCheckingOut ? 'CREATING INVOICE...' : cartItemCount === 0 ? 'ADD ITEMS TO CHECKOUT' : `CHECKOUT — ${cartSymbol}${cartTotal.toFixed(2)}`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : tab === 'invoices' ? (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">03 // Invoices</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setShowPayLinkForm(!showPayLinkForm); setPayLinkResult(null); }} className="btn btn-small">
                      {showPayLinkForm ? 'CANCEL' : '+ PAYMENT LINK'}
                    </button>
                    <button onClick={loadInvoices} className="btn btn-small">REFRESH</button>
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
                          onChange={(e) => setPayLinkCurrency(e.target.value as 'EUR' | 'USD')}
                          className="input"
                          style={{ width: 80, textAlign: 'center' }}
                        >
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
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
                    const eurStr = inv.price_eur < 0.01 ? `€${inv.price_eur}` : `€${inv.price_eur.toFixed(2)}`;
                    const isExpanded = expandedInvoice === inv.id;
                    const isOverpaid = inv.received_zatoshis > inv.price_zatoshis && inv.price_zatoshis > 0;
                    return (
                      <div key={inv.id} className="invoice-card" style={{ cursor: 'pointer' }} onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}>
                        <div className="invoice-header">
                          <span className="invoice-id">{inv.memo_code}</span>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {isOverpaid && inv.status === 'confirmed' && (
                              <span className="status-badge" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', fontSize: 8 }}>OVERPAID</span>
                            )}
                            <span className={`status-badge status-${inv.status}`}>{inv.status.toUpperCase()}</span>
                          </div>
                        </div>
                        <div className="invoice-meta">
                          <span>{inv.product_name || '—'} {inv.size || ''}</span>
                          <span><strong>{eurStr}</strong> / {inv.price_zec.toFixed(8)} ZEC</span>
                        </div>
                        {(inv.status === 'underpaid' || isOverpaid) && inv.received_zatoshis > 0 && (
                          <div style={{ fontSize: 10, color: inv.status === 'underpaid' ? '#f97316' : 'var(--cp-text-muted)', marginTop: 4 }}>
                            Received: {(inv.received_zatoshis / 1e8).toFixed(8)} / {inv.price_zec.toFixed(8)} ZEC
                          </div>
                        )}

                        {isExpanded && (
                          <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--cp-border)' }}>
                            <div className="stat-row">
                              <span style={{ color: 'var(--cp-text-muted)' }}>Reference</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cp-purple)' }}>
                                {inv.memo_code} <CopyButton text={inv.memo_code} label="" />
                              </span>
                            </div>

                            {/* Pricing */}
                            <div className="stat-row">
                              <span style={{ color: 'var(--cp-text-muted)' }}>Price</span>
                              <span>{eurStr} / {inv.price_zec.toFixed(8)} ZEC</span>
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
                              <span>1 ZEC = €{inv.zec_rate_at_creation.toFixed(2)}</span>
                            </div>

                            {/* Product info */}
                            {inv.product_name && (
                              <div className="stat-row">
                                <span style={{ color: 'var(--cp-text-muted)' }}>Product</span>
                                <span>{inv.product_name}{inv.size ? ` · ${inv.size}` : ''}</span>
                              </div>
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
                            {inv.refunded_at && (
                              <div className="stat-row">
                                <span style={{ color: '#f59e0b' }}>Refunded</span>
                                <span style={{ fontSize: 10 }}>{new Date(inv.refunded_at).toLocaleString()}</span>
                              </div>
                            )}
                            <div className="stat-row">
                              <span style={{ color: 'var(--cp-text-muted)' }}>Expires</span>
                              <span style={{ fontSize: 10 }}>{new Date(inv.expires_at).toLocaleString()}</span>
                            </div>

                            {/* Refund Address */}
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

                            {/* Actions */}
                            <div className="invoice-actions" style={{ marginTop: 12 }}>
                              <CopyButton text={`${checkoutOrigin}/pay/${inv.id}`} label="Payment Link" />
                              {inv.status === 'confirmed' && (
                                <button onClick={() => refundInvoice(inv.id)} className="btn btn-small" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.5)' }}>
                                  REFUND
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
                              <button onClick={(e) => { e.stopPropagation(); refundInvoice(inv.id); }} className="btn btn-small" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.5)' }}>
                                REFUND
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
            ) : tab === 'billing' ? (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">04 // Billing</span>
                  {billing?.fee_enabled && (
                    <span className={`status-badge ${billing.billing_status === 'active' ? 'status-confirmed' : billing.billing_status === 'past_due' ? 'status-detected' : 'status-expired'}`} style={{ fontSize: 8 }}>
                      {billing.billing_status.toUpperCase().replace('_', ' ')}
                    </span>
                  )}
                </div>
                <div className="panel-body">
                  {!billing?.fee_enabled ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cp-green)', marginBottom: 8 }}>NO FEES</div>
                      <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', lineHeight: 1.6 }}>
                        This instance is running in self-hosted mode.<br />
                        No transaction fees are applied.
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Overview */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                        <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 12, textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Fee Rate</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cp-text)' }}>{(billing.fee_rate * 100).toFixed(1)}%</div>
                        </div>
                        <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 12, textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Trust Tier</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: billing.trust_tier === 'trusted' ? 'var(--cp-green)' : billing.trust_tier === 'standard' ? 'var(--cp-cyan)' : 'var(--cp-text-muted)' }}>
                            {billing.trust_tier.toUpperCase()}
                          </div>
                        </div>
                        <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 12, textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Status</div>
                          <div style={{
                            fontSize: 18, fontWeight: 700,
                            color: billing.billing_status === 'active' ? 'var(--cp-green)' :
                              billing.billing_status === 'past_due' ? '#f59e0b' : '#ef4444'
                          }}>
                            {billing.billing_status.toUpperCase().replace('_', ' ')}
                          </div>
                        </div>
                      </div>

                      {/* Current Cycle */}
                      {billing.current_cycle ? (
                        <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 16, marginBottom: 16 }}>
                          <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-cyan)', marginBottom: 12, fontWeight: 600 }}>CURRENT CYCLE</div>
                          <div className="stat-row" style={{ marginBottom: 6 }}>
                            <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>Period</span>
                            <span style={{ fontSize: 11 }}>
                              {new Date(billing.current_cycle.period_start).toLocaleDateString()} — {new Date(billing.current_cycle.period_end).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="stat-row" style={{ marginBottom: 6 }}>
                            <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>Total Fees</span>
                            <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{billing.total_fees_zec.toFixed(8)} ZEC</span>
                          </div>
                          <div className="stat-row" style={{ marginBottom: 6 }}>
                            <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>Auto-Collected</span>
                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--cp-green)' }}>{billing.auto_collected_zec.toFixed(8)} ZEC</span>
                          </div>
                          <div className="stat-row" style={{ marginBottom: 6 }}>
                            <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>Outstanding</span>
                            <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: billing.outstanding_zec > 0.00001 ? '#f59e0b' : 'var(--cp-green)' }}>
                              {billing.outstanding_zec.toFixed(8)} ZEC
                            </span>
                          </div>
                          {billing.current_cycle.grace_until && (
                            <div className="stat-row">
                              <span style={{ color: 'var(--cp-text-muted)', fontSize: 11 }}>Grace Until</span>
                              <span style={{ fontSize: 11, color: '#f59e0b' }}>
                                {new Date(billing.current_cycle.grace_until).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4, padding: 16, marginBottom: 16, textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--cp-text-muted)' }}>
                            No active billing cycle yet. A cycle starts when your first invoice is confirmed.
                          </div>
                        </div>
                      )}

                      {/* Settle button */}
                      {billing.outstanding_zec > 0.00001 && (
                        <button onClick={settleBilling} disabled={billingSettling} className="btn" style={{ width: '100%', marginBottom: 16 }}>
                          {billingSettling ? 'CREATING INVOICE...' : `SETTLE NOW — ${billing.outstanding_zec.toFixed(6)} ZEC`}
                        </button>
                      )}

                      {/* How it works */}
                      <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', lineHeight: 1.7 }}>
                        <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-text-muted)', marginBottom: 6, fontWeight: 600 }}>HOW IT WORKS</div>
                        A {(billing.fee_rate * 100).toFixed(1)}% fee is added as a second output in payment QR codes (ZIP 321).
                        When buyers scan the QR, the fee is auto-collected. If a buyer copies the address manually,
                        the fee accrues and is billed at cycle end. Consistent on-time payment upgrades your trust tier,
                        extending billing cycles and grace periods.
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">05 // Settings</span>
                </div>
                <div className="panel-body">
                  {/* Store Name */}
                  <div className="section-title">Store Name</div>
                  {editingName ? (
                    <div className="form-group" style={{ display: 'flex', gap: 8 }}>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="My Store" className="input" style={{ flex: 1 }} />
                      <button onClick={saveName} className="btn btn-small">SAVE</button>
                      {editName && <button onClick={() => { setEditName(merchant.name || ''); setEditingName(false); }} className="btn btn-small btn-cancel">CANCEL</button>}
                    </div>
                  ) : (
                    <div className="stat-row">
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cp-text)' }}>{editName}</span>
                      <button onClick={() => setEditingName(true)} className="btn btn-small">EDIT</button>
                    </div>
                  )}

                  <div className="divider" />

                  {/* Derived Payment Address (read-only) */}
                  <div className="section-title">Derived Address</div>
                  <div className="stat-row">
                    <span style={{ fontSize: 9, color: 'var(--cp-cyan)', wordBreak: 'break-all', maxWidth: '75%' }}>
                      {merchant.payment_address}
                    </span>
                    <CopyButton text={merchant.payment_address} label="" />
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 4, lineHeight: 1.5 }}>
                    Auto-derived from your UFVK. Each invoice gets its own unique payment address for privacy and reliable detection.
                  </div>

                  <div className="divider" />

                  {/* Recovery Email */}
                  <div className="section-title">Recovery Email</div>
                  {merchant.recovery_email_preview ? (
                    <div className="stat-row">
                      <span style={{ fontSize: 11, color: 'var(--cp-green)' }}>{merchant.recovery_email_preview}</span>
                      <span className="status-badge status-confirmed" style={{ fontSize: 8 }}>SET</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginBottom: 8 }}>
                        Add an email to recover your account if you lose your dashboard token.
                      </div>
                      <div className="form-group" style={{ display: 'flex', gap: 8 }}>
                        <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="your@email.com" className="input" style={{ flex: 1 }} />
                        <button onClick={saveEmail} className="btn btn-small">SAVE</button>
                      </div>
                    </>
                  )}

                  <div className="divider" />

                  {/* Webhook URL */}
                  <div className="section-title">Webhook URL</div>
                  {editingWebhook ? (
                    <>
                      <div className="form-group" style={{ display: 'flex', gap: 8 }}>
                        <input type="url" value={editWebhookUrl} onChange={(e) => setEditWebhookUrl(e.target.value)} placeholder="https://your-store.com/api/webhook" className="input" style={{ flex: 1, fontSize: 10 }} />
                        <button onClick={saveWebhookUrl} className="btn btn-small">SAVE</button>
                        {merchant.webhook_url && <button onClick={() => { setEditWebhookUrl(merchant.webhook_url || ''); setEditingWebhook(false); }} className="btn btn-small btn-cancel">CANCEL</button>}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 4 }}>
                        CipherPay will POST invoice events (confirmed, expired) to this URL.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="stat-row">
                        <span style={{ fontSize: 10, color: 'var(--cp-cyan)', wordBreak: 'break-all', maxWidth: '75%' }}>
                          {editWebhookUrl}
                        </span>
                        <button onClick={() => setEditingWebhook(true)} className="btn btn-small">EDIT</button>
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: 4 }}>
                        CipherPay will POST invoice events (confirmed, expired) to this URL.
                      </div>
                    </>
                  )}

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
