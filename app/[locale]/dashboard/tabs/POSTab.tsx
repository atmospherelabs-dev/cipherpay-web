'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api, type Product } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Spinner } from '@/components/Spinner';
import { currencySymbol } from '@/lib/currency';

interface POSTabProps {
  products: Product[];
  loadingProducts: boolean;
}

function getDefaultPrice(product: Product) {
  const activePrices = (product.prices || []).filter(p => p.active === 1);
  if (product.default_price_id) {
    const dp = activePrices.find(p => p.id === product.default_price_id);
    if (dp) return dp;
  }
  return activePrices[0] || null;
}

export const POSTab = memo(function POSTab({ products, loadingProducts }: POSTabProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const t = useTranslations('dashboard.pos');
  const tc = useTranslations('common');

  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkingOut, setCheckingOut] = useState(false);

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
    const dp = product ? getDefaultPrice(product) : null;
    return sum + (dp ? dp.unit_amount * qty : 0);
  }, 0);
  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartCurrencies = [...new Set(Object.keys(cart).map(pid => {
    const p = products.find(pr => pr.id === pid);
    const dp = p ? getDefaultPrice(p) : null;
    return dp?.currency || 'EUR';
  }))];
  const cartCurrency = cartCurrencies.length === 1 ? cartCurrencies[0] : 'EUR';
  const cartMixedCurrency = cartCurrencies.length > 1;
  const cartSymbol = currencySymbol(cartCurrency);
  const cartSummary = Object.entries(cart)
    .map(([pid, qty]) => {
      const product = products.find(p => p.id === pid);
      return product ? `${qty}x ${product.name}` : '';
    })
    .filter(Boolean)
    .join(', ');

  const posCartCheckout = async () => {
    if (cartTotal <= 0 || cartMixedCurrency) return;
    setCheckingOut(true);
    try {
      const resp = await api.createInvoice({
        product_name: cartSummary,
        amount: Math.round(cartTotal * 100) / 100,
        currency: cartCurrency,
      });
      setCart({});
      router.push(`/pay/${resp.invoice_id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('toastCheckoutFailed'), true);
    }
    setCheckingOut(false);
  };

  const activeProducts = products.filter(p =>
    p.active === 1 &&
    !(p.prices || []).every(pr => pr.price_type === 'recurring')
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">{t('title')}</span>
        {cartItemCount > 0 && (
          <button onClick={() => setCart({})} className="btn btn-small btn-cancel">{t('clear')}</button>
        )}
      </div>
      <div className="panel-subtitle">
        {t('subtitle')}
      </div>

      {loadingProducts ? (
        <div className="empty-state">
          <Spinner />
        </div>
      ) : activeProducts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">&#9744;</div>
          <div>{t('addProductsFirst')}</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, padding: 16 }}>
            {activeProducts.map((product) => {
              const qty = cart[product.id] || 0;
              const dp = getDefaultPrice(product);
              return (
                <div
                  key={product.id}
                  className="pos-card"
                  style={{
                    border: `1px solid ${qty > 0 ? 'var(--cp-cyan)' : 'var(--cp-border)'}`,
                    borderRadius: 4,
                    padding: 12,
                    background: qty > 0 ? 'rgba(6, 182, 212, 0.05)' : 'transparent',
                    transition: 'all 0.15s',
                    cursor: qty === 0 ? 'pointer' : 'default',
                  }}
                  onClick={() => { if (qty === 0) cartAdd(product.id); }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--cp-text)' }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cp-text)', marginBottom: 8 }}>
                    {dp ? (
                      <>
                        {currencySymbol(dp.currency)}{dp.unit_amount.toFixed(2)}
                        <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--cp-text-dim)', marginLeft: 4 }}>{dp.currency}</span>
                      </>
                    ) : '—'}
                  </div>
                  {qty > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => cartRemove(product.id)}
                        style={{
                          width: 28, height: 28, border: '1px solid var(--cp-border)',
                          borderRadius: 4, background: 'transparent', color: 'var(--cp-text)',
                          fontSize: 16, cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        −
                      </button>
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center', color: 'var(--cp-cyan)' }}>
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
                  ) : (
                    <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 0.5 }}>
                      {t('tapToAdd')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cart summary + checkout */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--cp-border)' }}>
            {cartItemCount > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', letterSpacing: 1, marginBottom: 6 }}>{t('orderSummary')}</div>
                {Object.entries(cart).map(([pid, qty]) => {
                  const product = products.find(p => p.id === pid);
                  if (!product) return null;
                  const dp = getDefaultPrice(product);
                  const price = dp ? dp.unit_amount : 0;
                  return (
                    <div key={pid} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', color: 'var(--cp-text-muted)' }}>
                      <span>{qty}x {product.name}</span>
                      <span>{dp ? currencySymbol(dp.currency) : ''}{(price * qty).toFixed(2)}</span>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--cp-border)' }}>
                  <span>{tc('total')}</span>
                  <span>{cartSymbol}{cartTotal.toFixed(2)}</span>
                </div>
                {cartMixedCurrency && (
                  <div style={{ fontSize: 10, color: 'var(--cp-yellow)', marginTop: 6 }}>
                    {t('mixedCurrency')}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={posCartCheckout}
              disabled={cartItemCount === 0 || checkingOut || cartMixedCurrency}
              className="btn-primary"
              style={{
                width: '100%', padding: '14px 0', fontSize: 13, letterSpacing: 2,
                opacity: cartItemCount === 0 || checkingOut || cartMixedCurrency ? 0.4 : 1,
              }}
            >
              {checkingOut ? t('creatingInvoice') : cartItemCount === 0 ? t('addItemsToCheckout') : t('checkout', { symbol: cartSymbol, total: cartTotal.toFixed(2) })}
            </button>
          </div>
        </>
      )}
    </div>
  );
});
