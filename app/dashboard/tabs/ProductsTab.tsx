'use client';

import { memo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Product, type CreateProductRequest, type UpdateProductRequest } from '@/lib/api';
import { CopyButton } from '@/components/CopyButton';
import { validateLength } from '@/lib/validation';
import { currencySymbol, SUPPORTED_CURRENCIES } from '../utils/currency';
import { useToast } from '@/contexts/ToastContext';

import type { TabAction } from '../DashboardClient';

interface ProductsTabProps {
  products: Product[];
  loadingProducts: boolean;
  reloadProducts: () => void;
  checkoutOrigin: string;
  displayCurrency: string;
  initialAction?: TabAction;
  clearAction?: () => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function HelperText({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 4, lineHeight: 1.4 }}>
      {children}
    </div>
  );
}

export const ProductsTab = memo(function ProductsTab({
  products, loadingProducts, reloadProducts, checkoutOrigin, displayCurrency, initialAction, clearAction,
}: ProductsTabProps) {
  const { showToast } = useToast();
  const router = useRouter();

  // ── Create form state ──
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (initialAction === 'add-product') {
      setShowAddForm(true);
      clearAction?.();
    }
  }, [initialAction, clearAction]);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCurrency, setNewCurrency] = useState<string>(displayCurrency);
  const [newProductPriceType, setNewProductPriceType] = useState<'one_time' | 'recurring'>('one_time');
  const [newProductInterval, setNewProductInterval] = useState('month');
  const [newProductIntervalCount, setNewProductIntervalCount] = useState(1);
  const [creating, setCreating] = useState(false);
  const [extraPrices, setExtraPrices] = useState<{ amount: string; currency: string }[]>([]);
  const [showExtraPriceForm, setShowExtraPriceForm] = useState(false);
  const [extraPriceAmount, setExtraPriceAmount] = useState('');
  const [extraPriceCurrency, setExtraPriceCurrency] = useState('USD');
  const [newMetadata, setNewMetadata] = useState<{ key: string; value: string }[]>([]);

  // ── Edit form state ──
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editPriceType, setEditPriceType] = useState<'one_time' | 'recurring'>('one_time');
  const [editInterval, setEditInterval] = useState('month');
  const [editIntervalCount, setEditIntervalCount] = useState(1);
  const [editMetadata, setEditMetadata] = useState<{ key: string; value: string }[]>([]);
  const [savingProduct, setSavingProduct] = useState(false);

  // ── Detail view state ──
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [addingPrice, setAddingPrice] = useState(false);
  const [newPriceAmount, setNewPriceAmount] = useState('');
  const [newPriceCurrency, setNewPriceCurrency] = useState('EUR');

  const [pendingPriceEdits, setPendingPriceEdits] = useState<Record<string, { amount?: string; currency?: string }>>({});
  const [pendingNewPrices, setPendingNewPrices] = useState<{ amount: string; currency: string }[]>([]);
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set());

  const [posProductId, setPosProductId] = useState<string | null>(null);
  const [posCreating, setPosCreating] = useState(false);

  // Auto-generate slug from name when not manually edited
  useEffect(() => {
    if (!slugTouched) {
      setNewSlug(slugify(newName));
    }
  }, [newName, slugTouched]);

  const addProduct = async () => {
    if (!newName || !newPrice || parseFloat(newPrice) <= 0) {
      showToast('Name and valid price required', true);
      return;
    }
    const nameErr = validateLength(newName, 200, 'Name');
    if (nameErr) { showToast(nameErr, true); return; }
    setCreating(true);
    try {
      if (newProductPriceType === 'recurring' && !newProductInterval) {
        showToast('Billing interval required for recurring', true);
        setCreating(false);
        return;
      }
      const metadataObj = newMetadata.reduce((acc, { key, value }) => {
        if (key.trim()) acc[key.trim()] = value;
        return acc;
      }, {} as Record<string, string>);

      const req: CreateProductRequest = {
        slug: newSlug || undefined,
        name: newName,
        unit_amount: parseFloat(newPrice),
        currency: newCurrency,
        description: newDesc || undefined,
        metadata: Object.keys(metadataObj).length > 0 ? metadataObj : undefined,
        price_type: newProductPriceType,
        billing_interval: newProductPriceType === 'recurring' ? newProductInterval : undefined,
        interval_count: newProductPriceType === 'recurring' ? newProductIntervalCount : undefined,
      };
      const product = await api.createProduct(req);
      for (const ep of extraPrices) {
        const amount = parseFloat(ep.amount);
        if (amount > 0) {
          await api.createPrice({
            product_id: product.id, currency: ep.currency, unit_amount: amount,
            price_type: newProductPriceType,
            billing_interval: newProductPriceType === 'recurring' ? newProductInterval : undefined,
            interval_count: newProductPriceType === 'recurring' ? newProductIntervalCount : undefined,
          });
        }
      }
      setNewName(''); setNewSlug(''); setSlugTouched(false); setNewDesc(''); setNewPrice(''); setNewCurrency(displayCurrency);
      setNewProductPriceType('one_time'); setNewProductInterval('month'); setNewProductIntervalCount(1);
      setExtraPrices([]); setShowExtraPriceForm(false); setExtraPriceAmount('');
      setExtraPriceCurrency('USD');
      setNewMetadata([]);
      setShowAddForm(false);
      reloadProducts();
      showToast('Product added');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', true);
    }
    setCreating(false);
  };

  const deactivateProduct = async (id: string) => {
    try { await api.deactivateProduct(id); reloadProducts(); showToast('Product deleted'); }
    catch { showToast('Failed to delete', true); }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product.id);
    setEditProdName(product.name);
    setEditProdDesc(product.description || '');
    const activePrices = (product.prices || []).filter(p => p.active === 1);
    const firstPrice = activePrices[0];
    setEditPriceType((firstPrice?.price_type as 'one_time' | 'recurring') || 'one_time');
    setEditInterval(firstPrice?.billing_interval || 'month');
    setEditIntervalCount(firstPrice?.interval_count || 1);
    const meta = product.metadata || {};
    setEditMetadata(Object.entries(meta).map(([key, value]) => ({ key, value })));
    setPendingPriceEdits({});
    setPendingNewPrices([]);
    setPendingRemovals(new Set());
    setAddingPrice(false);
  };

  const cancelEditProduct = () => {
    setEditingProduct(null);
    setPendingPriceEdits({});
    setPendingNewPrices([]);
    setPendingRemovals(new Set());
    setAddingPrice(false);
  };

  const saveProduct = async (productId: string) => {
    if (!editProdName) { showToast('Name is required', true); return; }

    const product = products.find(p => p.id === productId);
    const currentActive = (product?.prices || []).filter(p => p.active === 1);
    const survivingCount = currentActive.filter(p => !pendingRemovals.has(p.id)).length + pendingNewPrices.length;
    if (survivingCount === 0) {
      showToast('Product must have at least one price', true);
      return;
    }

    setSavingProduct(true);
    try {
      const metadataObj = editMetadata.reduce((acc, { key, value }) => {
        if (key.trim()) acc[key.trim()] = value;
        return acc;
      }, {} as Record<string, string>);

      const req: UpdateProductRequest = {
        name: editProdName,
        description: editProdDesc || undefined,
        metadata: Object.keys(metadataObj).length > 0 ? metadataObj : undefined,
      };
      await api.updateProduct(productId, req);

      const originalType = currentActive[0]?.price_type || 'one_time';
      const originalInterval = currentActive[0]?.billing_interval || 'month';
      const originalIntervalCount = currentActive[0]?.interval_count || 1;
      const typeChanged = editPriceType !== originalType
        || (editPriceType === 'recurring' && (editInterval !== originalInterval || editIntervalCount !== originalIntervalCount));

      for (const [priceId, edits] of Object.entries(pendingPriceEdits)) {
        const update: Record<string, unknown> = {};
        if (edits.amount !== undefined) {
          const amount = parseFloat(edits.amount);
          if (amount > 0) update.unit_amount = amount;
        }
        if (edits.currency) update.currency = edits.currency;
        if (Object.keys(update).length > 0) {
          await api.updatePrice(priceId, update as Parameters<typeof api.updatePrice>[1]);
        }
      }

      if (typeChanged) {
        for (const price of currentActive) {
          if (pendingRemovals.has(price.id)) continue;
          await api.updatePrice(price.id, {
            price_type: editPriceType,
            billing_interval: editPriceType === 'recurring' ? editInterval : undefined,
            interval_count: editPriceType === 'recurring' ? editIntervalCount : undefined,
          } as Parameters<typeof api.updatePrice>[1]);
        }
      }

      for (const np of pendingNewPrices) {
        const amount = parseFloat(np.amount);
        if (amount > 0) {
          await api.createPrice({
            product_id: productId, currency: np.currency, unit_amount: amount,
            price_type: editPriceType,
            billing_interval: editPriceType === 'recurring' ? editInterval : undefined,
            interval_count: editPriceType === 'recurring' ? editIntervalCount : undefined,
          });
        }
      }

      for (const priceId of pendingRemovals) {
        await api.deactivatePrice(priceId);
      }

      setEditingProduct(null);
      setPendingPriceEdits({});
      setPendingNewPrices([]);
      setPendingRemovals(new Set());
      setAddingPrice(false);
      reloadProducts();
      showToast('Product updated');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update', true);
    }
    setSavingProduct(false);
  };

  const stageNewPrice = () => {
    const amount = parseFloat(newPriceAmount);
    if (!amount || amount <= 0) { showToast('Valid amount required', true); return; }
    setPendingNewPrices([...pendingNewPrices, {
      amount: newPriceAmount, currency: newPriceCurrency,
    }]);
    setAddingPrice(false);
    setNewPriceAmount(''); setNewPriceCurrency('EUR');
  };

  const toggleRemovePrice = (priceId: string) => {
    setPendingRemovals(prev => {
      const next = new Set(prev);
      if (next.has(priceId)) {
        next.delete(priceId);
      } else {
        next.add(priceId);
        const { [priceId]: _, ...rest } = pendingPriceEdits;
        setPendingPriceEdits(rest);
      }
      return next;
    });
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

  const priceSym = currencySymbol;
  const hasPendingChanges = Object.keys(pendingPriceEdits).length > 0 || pendingNewPrices.length > 0 || pendingRemovals.size > 0;

  // ─── Metadata editor component ───
  function MetadataEditor({ entries, onChange }: { entries: { key: string; value: string }[]; onChange: (e: { key: string; value: string }[]) => void }) {
    return (
      <div>
        {entries.map((entry, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
            <input
              type="text" value={entry.key} placeholder="Key"
              onChange={(e) => { const next = [...entries]; next[i] = { ...next[i], key: e.target.value }; onChange(next); }}
              className="input" style={{ flex: 1, fontSize: 11 }}
            />
            <input
              type="text" value={entry.value} placeholder="Value"
              onChange={(e) => { const next = [...entries]; next[i] = { ...next[i], value: e.target.value }; onChange(next); }}
              className="input" style={{ flex: 1, fontSize: 11 }}
            />
            <button
              onClick={() => onChange(entries.filter((_, j) => j !== i))}
              style={{ background: 'none', border: 'none', color: 'var(--cp-red, #ef4444)', cursor: 'pointer', fontSize: 9, fontFamily: 'inherit', letterSpacing: 0.5, padding: 0, opacity: 0.7, flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...entries, { key: '', value: '' }])}
          style={{ background: 'none', border: 'none', color: 'var(--cp-cyan)', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit', letterSpacing: 0.5, padding: 0 }}
        >
          + Add metadata
        </button>
      </div>
    );
  }

  // ─── Price editing row (reusable for edit mode) ───
  function PriceEditRow({ price, isMarkedForRemoval, edits }: {
    price: { id: string; unit_amount: number; currency: string; price_type?: string | null; billing_interval?: string | null; interval_count?: number | null };
    isMarkedForRemoval: boolean;
    edits: { amount?: string; currency?: string };
  }) {
    const displayAmount = edits.amount !== undefined ? edits.amount : price.unit_amount.toString();
    const displayCurr = edits.currency || price.currency;
    const hasEdits = Object.keys(edits).length > 0;

    const updatePriceEdit = (field: string, value: string) => {
      const current = pendingPriceEdits[price.id] || {};
      const updated = { ...current, [field]: value };
      const isOriginalAmount = field === 'amount' && value === price.unit_amount.toString();
      const isOriginalCurrency = field === 'currency' && value === price.currency;
      if (isOriginalAmount) delete updated.amount;
      if (isOriginalCurrency) delete updated.currency;
      if (Object.keys(updated).length === 0) {
        const { [price.id]: _, ...rest } = pendingPriceEdits;
        setPendingPriceEdits(rest);
      } else {
        setPendingPriceEdits({ ...pendingPriceEdits, [price.id]: updated });
      }
    };

    return (
      <div style={{ padding: '12px 0', borderBottom: '1px solid var(--cp-border)', opacity: isMarkedForRemoval ? 0.4 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isMarkedForRemoval ? (
              <>
                <span style={{ fontSize: 12, fontWeight: 500, textDecoration: 'line-through' }}>
                  {priceSym(price.currency)}{price.unit_amount.toFixed(2)}
                </span>
                <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>{price.currency}</span>
                <span style={{ fontSize: 9, color: 'var(--cp-red, #ef4444)', fontStyle: 'italic' }}>will be removed</span>
              </>
            ) : (
              <>
                <input
                  type="number" value={displayAmount}
                  onChange={(e) => updatePriceEdit('amount', e.target.value)}
                  step="any" min="0.001" className="input"
                  style={{ width: 100, fontSize: 12, padding: '5px 8px', fontWeight: 500, borderColor: hasEdits ? 'var(--cp-cyan)' : undefined }}
                />
                <select value={displayCurr} onChange={(e) => updatePriceEdit('currency', e.target.value)} className="input" style={{ width: 72, fontSize: 11, padding: '5px 4px', textAlign: 'center' }}>
                  {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!isMarkedForRemoval && (
              <CopyButton text={price.id} label={price.id.length > 18 ? price.id.slice(0, 16) + '...' : price.id} />
            )}
            <button onClick={() => toggleRemovePrice(price.id)} style={{ background: 'none', border: 'none', color: isMarkedForRemoval ? 'var(--cp-cyan)' : 'var(--cp-red, #ef4444)', cursor: 'pointer', fontSize: 9, fontFamily: 'inherit', letterSpacing: 0.5, padding: 0, opacity: 0.7 }}>
              {isMarkedForRemoval ? 'UNDO' : 'REMOVE'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Detail view ───────────────────────────────────────────────
  if (selectedProduct) {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) { setSelectedProduct(null); return null; }
    const activePrices = (product.prices || []).filter(p => p.active === 1);
    const isEditing = editingProduct === product.id;
    const defaultPrice = product.default_price_id
      ? activePrices.find(p => p.id === product.default_price_id) || activePrices[0]
      : activePrices[0];
    const apiBase = checkoutOrigin.replace('localhost:3000', 'localhost:3080').replace(/^(https?:\/\/)(?:www\.)?/, '$1').replace('cipherpay.app', 'api.cipherpay.app');
    const snippet = defaultPrice
      ? `curl -X POST ${apiBase}/api/checkout \\\n  -H "Content-Type: application/json" \\\n  -d '{"price_id": "${defaultPrice.id}"}'`
      : `curl -X POST ${apiBase}/api/checkout \\\n  -H "Content-Type: application/json" \\\n  -d '{"product_id": "${product.id}"}'`;

    const metadata = product.metadata || {};
    const metaEntries = Object.entries(metadata);

    return (
      <div className="panel">
        {/* ── Header ── */}
        <div className="panel-header">
          <button
            onClick={() => { setSelectedProduct(null); setEditingProduct(null); setAddingPrice(false); setPendingPriceEdits({}); }}
            style={{ background: 'none', border: 'none', color: 'var(--cp-cyan)', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit', letterSpacing: 1, padding: 0 }}
          >
            &larr; BACK TO PRODUCTS
          </button>
          {isEditing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => saveProduct(product.id)} disabled={savingProduct} className="btn-primary" style={{ fontSize: 10, opacity: savingProduct ? 0.5 : 1 }}>
                {savingProduct ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
              <button onClick={cancelEditProduct} className="btn" style={{ fontSize: 10 }}>CANCEL</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => startEditProduct(product)} className="btn-primary" style={{ fontSize: 10 }}>EDIT PRODUCT</button>
              <button
                onClick={() => quickPOS(product.id)}
                disabled={posCreating && posProductId === product.id}
                className="btn"
                style={{ fontSize: 10, color: 'var(--cp-green)', borderColor: 'var(--cp-green)', opacity: posCreating && posProductId === product.id ? 0.5 : 1 }}
              >
                {posCreating && posProductId === product.id ? 'CREATING...' : 'QUICK POS'}
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          /* ── Edit mode ── */
          <div className="panel-body" style={{ padding: 0 }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--cp-border)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--cp-text-muted)', letterSpacing: 1, marginBottom: 14 }}>PRODUCT DETAILS</div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" value={editProdName} onChange={(e) => setEditProdName(e.target.value)} className="input" />
                <HelperText>Visible to customers at checkout.</HelperText>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea value={editProdDesc} onChange={(e) => setEditProdDesc(e.target.value)} placeholder="Optional" className="input" rows={2} style={{ resize: 'vertical', minHeight: 50 }} />
                <HelperText>Appears on the checkout page below the product name.</HelperText>
              </div>
            </div>

            {/* Edit: payment type */}
            <div style={{ padding: 20, borderBottom: '1px solid var(--cp-border)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--cp-text-muted)', letterSpacing: 1, marginBottom: 14 }}>PAYMENT TYPE</div>
              <div style={{ display: 'flex', gap: 0, marginBottom: 4 }}>
                <button
                  type="button"
                  onClick={() => setEditPriceType('one_time')}
                  style={{
                    flex: 1, padding: '10px 0', fontSize: 11, fontFamily: 'inherit', fontWeight: 600, letterSpacing: 0.5,
                    background: editPriceType === 'one_time' ? 'var(--cp-surface)' : 'transparent',
                    color: editPriceType === 'one_time' ? 'var(--cp-cyan)' : 'var(--cp-text-dim)',
                    border: '1px solid',
                    borderColor: editPriceType === 'one_time' ? 'var(--cp-cyan)' : 'var(--cp-border)',
                    borderRadius: '4px 0 0 4px', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  ONE-TIME
                </button>
                <button
                  type="button"
                  onClick={() => setEditPriceType('recurring')}
                  style={{
                    flex: 1, padding: '10px 0', fontSize: 11, fontFamily: 'inherit', fontWeight: 600, letterSpacing: 0.5,
                    background: editPriceType === 'recurring' ? 'var(--cp-surface)' : 'transparent',
                    color: editPriceType === 'recurring' ? 'var(--cp-cyan)' : 'var(--cp-text-dim)',
                    border: '1px solid',
                    borderColor: editPriceType === 'recurring' ? 'var(--cp-cyan)' : 'var(--cp-border)',
                    borderRadius: '0 4px 4px 0', borderLeft: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  RECURRING
                </button>
              </div>
              <HelperText>
                {editPriceType === 'one_time'
                  ? 'Charge a single payment for this product.'
                  : 'Charge on a recurring schedule. An invoice will be generated each billing period.'}
              </HelperText>
              {editPriceType === 'recurring' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>Bill every</span>
                  <input type="number" value={editIntervalCount} onChange={(e) => setEditIntervalCount(parseInt(e.target.value) || 1)} min="1" max="365" className="input" style={{ width: 52, textAlign: 'center' }} />
                  <select value={editInterval} onChange={(e) => setEditInterval(e.target.value)} className="input" style={{ width: 100 }}>
                    <option value="day">day(s)</option>
                    <option value="week">week(s)</option>
                    <option value="month">month(s)</option>
                    <option value="year">year(s)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Edit: pricing */}
            <div style={{ padding: 20, borderBottom: '1px solid var(--cp-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--cp-text-muted)', letterSpacing: 1 }}>PRICING</span>
                {hasPendingChanges && (
                  <span style={{ fontSize: 9, color: 'var(--cp-cyan)' }}>Unsaved changes</span>
                )}
              </div>
              {activePrices.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>No prices yet. Add one to enable checkout.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {activePrices.map(price => (
                    <PriceEditRow
                      key={price.id}
                      price={price}
                      isMarkedForRemoval={pendingRemovals.has(price.id)}
                      edits={pendingPriceEdits[price.id] || {}}
                    />
                  ))}
                </div>
              )}

              {/* Staged new prices */}
              {pendingNewPrices.map((np, i) => (
                <div key={`new-${i}`} style={{ padding: '12px 0', borderBottom: '1px solid var(--cp-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--cp-cyan)' }}>{priceSym(np.currency)}{parseFloat(np.amount).toFixed(2)}</span>
                      <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>{np.currency}</span>
                      <span style={{ fontSize: 9, color: 'var(--cp-cyan)', fontStyle: 'italic' }}>new</span>
                    </div>
                    <button onClick={() => setPendingNewPrices(pendingNewPrices.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--cp-red, #ef4444)', cursor: 'pointer', fontSize: 9, fontFamily: 'inherit', letterSpacing: 0.5, padding: 0, opacity: 0.7 }}>
                      REMOVE
                    </button>
                  </div>
                </div>
              ))}

              {/* Add new price form */}
              {addingPrice ? (
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(0,255,255,0.02)', borderRadius: 6, border: '1px solid var(--cp-border)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 80px' }}>
                      <label className="form-label" style={{ fontSize: 9 }}>Amount</label>
                      <input type="number" value={newPriceAmount} onChange={(e) => setNewPriceAmount(e.target.value)} placeholder="29.99" step="any" min="0.001" className="input" style={{ fontSize: 11 }} />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: 9 }}>Currency</label>
                      <select value={newPriceCurrency} onChange={(e) => setNewPriceCurrency(e.target.value)} className="input" style={{ width: 72, textAlign: 'center', fontSize: 11 }}>
                        {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                    <button onClick={stageNewPrice} className="btn-primary" style={{ fontSize: 10 }}>ADD</button>
                    <button onClick={() => { setAddingPrice(false); setNewPriceAmount(''); }} className="btn" style={{ fontSize: 10 }}>CANCEL</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingPrice(true)} style={{ background: 'none', border: 'none', color: 'var(--cp-cyan)', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit', letterSpacing: 0.5, padding: 0, marginTop: 12 }}>
                  + Add price
                </button>
              )}
            </div>

            {/* Edit: metadata */}
            <div style={{ padding: 20, borderBottom: '1px solid var(--cp-border)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--cp-text-muted)', letterSpacing: 1, marginBottom: 6 }}>METADATA</div>
              <HelperText>Store additional structured information for your own use. Not shown to customers.</HelperText>
              <div style={{ marginTop: 12 }}>
                <MetadataEditor entries={editMetadata} onChange={setEditMetadata} />
              </div>
            </div>

            {/* Danger zone */}
            <div style={{ padding: '14px 20px' }}>
              <button
                onClick={() => { deactivateProduct(product.id); setSelectedProduct(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--cp-red, #ef4444)', cursor: 'pointer', fontSize: 9, fontFamily: 'inherit', letterSpacing: 1, padding: 0, opacity: 0.7 }}
              >
                DELETE PRODUCT
              </button>
            </div>
          </div>
        ) : (
          /* ── View mode ── */
          <div className="panel-body" style={{ padding: 0 }}>
            {/* Section 1: Product info */}
            <div style={{ padding: 20, borderBottom: '1px solid var(--cp-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--cp-text)' }}>{product.name}</span>
                {activePrices.some(p => p.price_type === 'recurring') ? (
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, color: 'var(--cp-cyan)', background: 'rgba(0,255,255,0.08)', padding: '3px 8px', borderRadius: 3, border: '1px solid rgba(0,255,255,0.15)' }}>RECURRING</span>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.5, color: 'var(--cp-text-dim)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 3, border: '1px solid var(--cp-border)' }}>ONE-TIME</span>
                )}
              </div>
              {product.description && (
                <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 8, lineHeight: 1.5 }}>{product.description}</div>
              )}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 8 }}>
                <span>Created {new Date(product.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Section 2: Pricing */}
            <div style={{ padding: 20, borderBottom: '1px solid var(--cp-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--cp-text-muted)', letterSpacing: 1 }}>PRICING</span>
                <span style={{ fontSize: 9, color: 'var(--cp-text-dim)' }}>{activePrices.length} active</span>
              </div>
              {activePrices.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>No active prices. Click EDIT PRODUCT to add one.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {activePrices.map(price => {
                    const isRecurring = price.price_type === 'recurring';
                    const intervalStr = isRecurring
                      ? `/ ${(price.interval_count ?? 1) > 1 ? (price.interval_count ?? 1) + ' ' : ''}${price.billing_interval ?? 'month'}${(price.interval_count ?? 1) > 1 ? 's' : ''}`
                      : '';
                    return (
                      <div key={price.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--cp-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--cp-text)' }}>
                            {priceSym(price.currency)}{price.unit_amount.toFixed(2)}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--cp-text-dim)', fontWeight: 400 }}>{price.currency}</span>
                          {isRecurring && (
                            <span style={{ fontSize: 11, color: 'var(--cp-text-muted)', fontWeight: 400 }}>{intervalStr}</span>
                          )}
                        </div>
                        <CopyButton text={price.id} label={price.id.length > 24 ? price.id.slice(0, 22) + '...' : price.id} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 3: Details */}
            <div style={{ padding: 20, borderBottom: '1px solid var(--cp-border)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--cp-text-muted)', letterSpacing: 1, marginBottom: 14 }}>DETAILS</div>
              <div className="stat-row" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>Product ID</span>
                <CopyButton text={product.id} label={product.id.length > 28 ? product.id.slice(0, 26) + '...' : product.id} />
              </div>
              <div className="stat-row" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>Slug</span>
                <span style={{ fontSize: 10, color: 'var(--cp-text)' }}>/{product.slug}</span>
              </div>
              <div className="stat-row">
                <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>Buy Link</span>
                <CopyButton text={`${checkoutOrigin}/buy/${product.id}`} label={`${checkoutOrigin.replace(/^https?:\/\//, '')}/buy/...`} />
              </div>
            </div>

            {/* Section 4: Metadata */}
            {metaEntries.length > 0 && (
              <div style={{ padding: 20, borderBottom: '1px solid var(--cp-border)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--cp-text-muted)', letterSpacing: 1, marginBottom: 14 }}>METADATA</div>
                {metaEntries.map(([key, value]) => (
                  <div key={key} className="stat-row" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>{key}</span>
                    <span style={{ fontSize: 10, color: 'var(--cp-text)' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Section 5: Integration */}
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--cp-text-muted)', letterSpacing: 1, marginBottom: 14 }}>API INTEGRATION</div>
              <div style={{ position: 'relative' }}>
                <pre style={{
                  fontSize: 10, lineHeight: 1.5,
                  background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 6,
                  padding: '12px 14px', overflowX: 'auto', color: 'var(--cp-text-muted)', margin: 0,
                  fontFamily: 'var(--font-geist-mono), monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>
                  {snippet}
                </pre>
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <CopyButton text={snippet} label="" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── List view ───────────────────────────────────────────────
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Product Catalog</span>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-small">
          {showAddForm ? 'CANCEL' : '+ ADD PRODUCT'}
        </button>
      </div>

      {showAddForm && (
        <div className="panel-body" style={{ borderBottom: '1px solid var(--cp-border)' }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Premium Privacy Tee" className="input" />
            <HelperText>Name of the product or service, visible to customers at checkout.</HelperText>
          </div>
          <div className="form-group">
            <label className="form-label">URL slug</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <span style={{ fontSize: 11, color: 'var(--cp-text-dim)', background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRight: 'none', borderRadius: '4px 0 0 4px', padding: '7px 8px', lineHeight: 1 }}>/</span>
              <input
                type="text" value={newSlug}
                onChange={(e) => { setNewSlug(e.target.value); setSlugTouched(true); }}
                placeholder="premium-privacy-tee" className="input"
                style={{ borderRadius: '0 4px 4px 0', flex: 1, fontSize: 11 }}
              />
            </div>
            <HelperText>Auto-generated from name. Used in checkout URLs. Only letters, numbers, and hyphens.</HelperText>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Describe your product or service" rows={2} className="input" style={{ resize: 'vertical', minHeight: 50 }} />
            <HelperText>Appears at checkout below the product name. Optional.</HelperText>
          </div>
          <div className="form-group">
            <label className="form-label">Payment type</label>
            <div style={{ display: 'flex', gap: 0, marginBottom: 4 }}>
              <button
                type="button"
                onClick={() => setNewProductPriceType('one_time')}
                style={{
                  flex: 1, padding: '10px 0', fontSize: 11, fontFamily: 'inherit', fontWeight: 600, letterSpacing: 0.5,
                  background: newProductPriceType === 'one_time' ? 'var(--cp-surface)' : 'transparent',
                  color: newProductPriceType === 'one_time' ? 'var(--cp-cyan)' : 'var(--cp-text-dim)',
                  border: '1px solid',
                  borderColor: newProductPriceType === 'one_time' ? 'var(--cp-cyan)' : 'var(--cp-border)',
                  borderRadius: '4px 0 0 4px', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                ONE-TIME
              </button>
              <button
                type="button"
                onClick={() => setNewProductPriceType('recurring')}
                style={{
                  flex: 1, padding: '10px 0', fontSize: 11, fontFamily: 'inherit', fontWeight: 600, letterSpacing: 0.5,
                  background: newProductPriceType === 'recurring' ? 'var(--cp-surface)' : 'transparent',
                  color: newProductPriceType === 'recurring' ? 'var(--cp-cyan)' : 'var(--cp-text-dim)',
                  border: '1px solid',
                  borderColor: newProductPriceType === 'recurring' ? 'var(--cp-cyan)' : 'var(--cp-border)',
                  borderRadius: '0 4px 4px 0', borderLeft: 'none', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                RECURRING
              </button>
            </div>
            <HelperText>
              {newProductPriceType === 'one_time'
                ? 'Charge a single payment for this product.'
                : 'Charge on a recurring schedule. An invoice will be generated each billing period.'}
            </HelperText>
          </div>
          <div className="form-group">
            <label className="form-label">Price</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="65.00" step="any" min="0.001" className="input" style={{ flex: 1 }} />
              <select value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)} className="input" style={{ width: 80, textAlign: 'center' }}>
                {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <HelperText>The amount to charge in the selected fiat currency. Converted to ZEC at checkout.</HelperText>
            {newProductPriceType === 'recurring' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>Bill every</span>
                <input type="number" value={newProductIntervalCount} onChange={(e) => setNewProductIntervalCount(parseInt(e.target.value) || 1)} min="1" max="365" className="input" style={{ width: 52, textAlign: 'center' }} />
                <select value={newProductInterval} onChange={(e) => setNewProductInterval(e.target.value)} className="input" style={{ width: 100 }}>
                  <option value="day">day(s)</option>
                  <option value="week">week(s)</option>
                  <option value="month">month(s)</option>
                  <option value="year">year(s)</option>
                </select>
              </div>
            )}
          </div>
          {/* Additional prices */}
          {extraPrices.length > 0 && (
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 10 }}>Additional Prices</label>
              {extraPrices.map((ep, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11 }}>{currencySymbol(ep.currency)} {parseFloat(ep.amount).toFixed(2)} {ep.currency}</span>
                  <button onClick={() => setExtraPrices(extraPrices.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--cp-red, #ef4444)', cursor: 'pointer', fontSize: 9, fontFamily: 'inherit' }}>REMOVE</button>
                </div>
              ))}
            </div>
          )}
          {showExtraPriceForm ? (
            <div className="form-group" style={{ padding: 12, background: 'rgba(0,255,255,0.02)', borderRadius: 6, border: '1px solid var(--cp-border)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 80px' }}>
                  <label className="form-label" style={{ fontSize: 9 }}>Amount</label>
                  <input type="number" value={extraPriceAmount} onChange={(e) => setExtraPriceAmount(e.target.value)} placeholder="29.99" step="any" min="0.001" className="input" style={{ fontSize: 11 }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 9 }}>Currency</label>
                  <select value={extraPriceCurrency} onChange={(e) => setExtraPriceCurrency(e.target.value)} className="input" style={{ width: 72, textAlign: 'center', fontSize: 11 }}>
                    {SUPPORTED_CURRENCIES.filter(c => c !== newCurrency && !extraPrices.some(ep => ep.currency === c)).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => {
                  const amt = parseFloat(extraPriceAmount);
                  if (!amt || amt <= 0) { showToast('Valid amount required', true); return; }
                  setExtraPrices([...extraPrices, {
                    amount: extraPriceAmount, currency: extraPriceCurrency,
                  }]);
                  setExtraPriceAmount('');
                  const remaining = SUPPORTED_CURRENCIES.filter(c => c !== newCurrency && !extraPrices.some(ep => ep.currency === c) && c !== extraPriceCurrency);
                  setExtraPriceCurrency(remaining[0] || 'USD');
                  setShowExtraPriceForm(false);
                }} className="btn-primary" style={{ fontSize: 10 }}>ADD</button>
                <button onClick={() => { setShowExtraPriceForm(false); setExtraPriceAmount(''); }} className="btn" style={{ fontSize: 10 }}>CANCEL</button>
              </div>
            </div>
          ) : (
            <div className="form-group" style={{ paddingTop: 0 }}>
              <button onClick={() => setShowExtraPriceForm(true)} style={{ background: 'none', border: 'none', color: 'var(--cp-cyan)', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit', letterSpacing: 0.5, padding: 0 }}>
                + Add a price by currency
              </button>
              <HelperText>Add pricing in another currency. Customers choose which currency to pay in.</HelperText>
            </div>
          )}
          {/* Metadata */}
          <div className="form-group">
            <label className="form-label">Metadata</label>
            <HelperText>Store additional structured information for your own use. Not shown to customers.</HelperText>
            <div style={{ marginTop: 8 }}>
              <MetadataEditor entries={newMetadata} onChange={setNewMetadata} />
            </div>
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
          const activePrices = (product.prices || []).filter(p => p.active === 1);
          const defaultPrice = product.default_price_id
            ? activePrices.find(p => p.id === product.default_price_id) || activePrices[0]
            : activePrices[0];
          return (
            <div
              key={product.id}
              className="invoice-card"
              onClick={() => setSelectedProduct(product.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="invoice-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="invoice-id">{product.name}</span>
                  {activePrices.some(p => p.price_type === 'recurring') ? (
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.5, color: 'var(--cp-cyan)', background: 'rgba(0,255,255,0.08)', padding: '2px 7px', borderRadius: 3 }}>RECURRING</span>
                  ) : (
                    <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: 0.5, color: 'var(--cp-text-dim)', background: 'rgba(255,255,255,0.04)', padding: '2px 7px', borderRadius: 3 }}>ONE-TIME</span>
                  )}
                </div>
                {defaultPrice ? (
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cp-text)' }}>
                    {priceSym(defaultPrice.currency)}{defaultPrice.unit_amount.toFixed(2)}
                    <span style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginLeft: 4 }}>{defaultPrice.currency}</span>
                    {defaultPrice.price_type === 'recurring' && (
                      <span style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginLeft: 2 }}>
                        /{defaultPrice.billing_interval ?? 'mo'}
                      </span>
                    )}
                  </span>
                ) : (
                  <span style={{ fontSize: 10, color: 'var(--cp-text-dim)', fontStyle: 'italic' }}>No active prices</span>
                )}
              </div>
              <div className="invoice-meta">
                <span style={{ color: 'var(--cp-text-dim)', fontSize: 10 }}>/{product.slug}</span>
                {activePrices.length > 1 && (
                  <span style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>{activePrices.length} prices</span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
});
