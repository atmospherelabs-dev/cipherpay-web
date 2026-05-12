'use client';

import { memo, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Product, Price } from '@/lib/api';
import { currencySymbol } from '@/lib/currency';
import type { CartItem } from './page';

interface CatalogProps {
  products: Product[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onCheckout: () => void;
  onCustomAmount: () => void;
  onLock: () => void;
  merchantName: string;
}

function getDefaultPrice(product: Product): Price | null {
  const activePrices = (product.prices || []).filter(p => p.active === 1);
  if (product.default_price_id) {
    const dp = activePrices.find(p => p.id === product.default_price_id);
    if (dp) return dp;
  }
  return activePrices[0] || null;
}

function getCategory(product: Product): string {
  if (product.metadata?.category) return product.metadata.category;
  return '';
}

export const Catalog = memo(function Catalog({
  products, cart, setCart, onCheckout, onCustomAmount, onLock, merchantName,
}: CatalogProps) {
  const t = useTranslations('pos.catalog');
  const tc = useTranslations('common');

  const [activeCategory, setActiveCategory] = useState<string>('__all');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem('cp_pos_favorites');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      const c = getCategory(p);
      if (c) cats.add(c);
    });
    return Array.from(cats).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategory === '__favorites') {
      list = list.filter(p => favorites.has(p.id));
    } else if (activeCategory !== '__all') {
      list = list.filter(p => getCategory(p) === activeCategory);
    }
    const favFirst = [...list].sort((a, b) => {
      const aF = favorites.has(a.id) ? 0 : 1;
      const bF = favorites.has(b.id) ? 0 : 1;
      return aF - bF;
    });
    return favFirst;
  }, [products, activeCategory, favorites]);

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      try { localStorage.setItem('cp_pos_favorites', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const addToCart = (product: Product) => {
    const dp = getDefaultPrice(product);
    if (!dp) return;
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: dp.unit_amount,
        currency: dp.currency,
        qty: 1,
      }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === productId);
      if (idx < 0) return prev;
      const newQty = prev[idx].qty + delta;
      if (newQty <= 0) return prev.filter((_, i) => i !== idx);
      const next = [...prev];
      next[idx] = { ...next[idx], qty: newQty };
      return next;
    });
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const cartCurrency = cart.length > 0 ? cart[0].currency : 'EUR';
  const sym = currencySymbol(cartCurrency);

  return (
    <div className="pos-catalog-screen">
      {/* Header */}
      <div className="pos-header">
        <div className="pos-header-left">
          <img src="/logo-mark.png" alt="" className="pos-header-logo" />
          <span className="pos-header-name">{merchantName || 'CipherPay POS'}</span>
        </div>
        <button className="pos-lock-btn" onClick={onLock}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>{t('lock')}</span>
        </button>
      </div>

      <div className="pos-main">
        {/* Left: Product Grid */}
        <div className="pos-grid-panel">
          {/* Category tabs */}
          <div className="pos-category-tabs">
            <button
              className={`pos-cat-tab${activeCategory === '__all' ? ' active' : ''}`}
              onClick={() => setActiveCategory('__all')}
            >
              {t('all')}
            </button>
            {favorites.size > 0 && (
              <button
                className={`pos-cat-tab${activeCategory === '__favorites' ? ' active' : ''}`}
                onClick={() => setActiveCategory('__favorites')}
              >
                {t('favorites')}
              </button>
            )}
            {categories.map(c => (
              <button
                key={c}
                className={`pos-cat-tab${activeCategory === c ? ' active' : ''}`}
                onClick={() => setActiveCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="pos-product-grid">
            {filteredProducts.map(product => {
              const dp = getDefaultPrice(product);
              const inCart = cart.find(i => i.productId === product.id);
              const isFav = favorites.has(product.id);
              return (
                <button
                  key={product.id}
                  className={`pos-product-card${inCart ? ' in-cart' : ''}`}
                  onClick={() => addToCart(product)}
                >
                  <button
                    className={`pos-fav-btn${isFav ? ' active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                    aria-label={isFav ? t('unfavorite') : t('favorite')}
                  >
                    {isFav ? '\u2605' : '\u2606'}
                  </button>
                  <div className="pos-product-name">{product.name}</div>
                  <div className="pos-product-price">
                    {dp ? `${currencySymbol(dp.currency)}${dp.unit_amount.toFixed(2)}` : '—'}
                  </div>
                  {inCart && <div className="pos-product-badge">{inCart.qty}</div>}
                </button>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="pos-empty-grid">{t('noProducts')}</div>
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="pos-cart-panel">
          <div className="pos-cart-title">{t('currentSale')}</div>

          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="pos-cart-empty">{t('emptyCart')}</div>
            ) : (
              cart.map(item => (
                <div key={item.productId} className="pos-cart-item">
                  <div className="pos-cart-item-info">
                    <span className="pos-cart-item-name">{item.name}</span>
                    <span className="pos-cart-item-subtotal">
                      {currencySymbol(item.currency)}{(item.price * item.qty).toFixed(2)}
                    </span>
                  </div>
                  <div className="pos-cart-item-controls">
                    <button className="pos-qty-btn" onClick={() => updateQty(item.productId, -1)}>−</button>
                    <span className="pos-qty-value">{item.qty}</span>
                    <button className="pos-qty-btn" onClick={() => updateQty(item.productId, 1)}>+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pos-cart-footer">
            <div className="pos-cart-total">
              <span>{tc('total')}</span>
              <span>{sym}{cartTotal.toFixed(2)}</span>
            </div>
            <button
              className="pos-checkout-btn"
              disabled={cart.length === 0}
              onClick={onCheckout}
            >
              {cart.length === 0 ? t('addItems') : t('charge', { amount: `${sym}${cartTotal.toFixed(2)}` })}
            </button>
            <button className="pos-custom-btn" onClick={onCustomAmount}>
              {t('customAmount')}
            </button>
            {cart.length > 0 && (
              <button className="pos-clear-btn" onClick={() => setCart([])}>
                {t('clearCart')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
