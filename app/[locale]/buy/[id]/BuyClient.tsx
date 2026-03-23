'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { api, type PublicProduct, type CheckoutRequest, type Price } from '@/lib/api';
import { validateZcashAddress } from '@/lib/validation';
import { currencySymbol } from '@/lib/currency';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Spinner } from '@/components/Spinner';

const LOCALE_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', JP: 'JPY',
  BR: 'BRL', MX: 'MXN', AR: 'ARS', NG: 'NGN', IN: 'INR',
  CH: 'CHF', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR',
  NL: 'EUR', PT: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR',
  FI: 'EUR', GR: 'EUR', LU: 'EUR', SK: 'EUR', SI: 'EUR',
  EE: 'EUR', LV: 'EUR', LT: 'EUR', MT: 'EUR', CY: 'EUR',
};

function detectCurrency(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale.split('-').pop()?.toUpperCase();
    if (region && LOCALE_CURRENCY[region]) return LOCALE_CURRENCY[region];
  } catch { /* fallback below */ }
  return 'USD';
}

function pickBestPrice(prices: Price[]): Price {
  const detected = detectCurrency();
  return prices.find(p => p.currency === detected) || prices[0];
}

export default function BuyClient({ productId }: { productId: string }) {
  const t = useTranslations('buy');
  const tc = useTranslations('common');
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null);
  const [refundAddr, setRefundAddr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const router = useRouter();

  useEffect(() => {
    api.getPublicProduct(productId)
      .then((p) => {
        setProduct(p);
        const active = (p.prices || []).filter(pr => pr.active === 1);
        if (active.length > 0) {
          const hasTierLabels = active.some(pr => pr.label);
          setSelectedPrice(hasTierLabels ? active[0] : pickBestPrice(active));
        }
      })
      .catch((e) => setError(e.message));
  }, [productId]);

  const activePrices = (product?.prices || []).filter(pr => pr.active === 1);
  const hasTierLabels = activePrices.some(p => p.label);

  const handleCheckout = async () => {
    setFormError('');

    if (refundAddr) {
      const e = validateZcashAddress(refundAddr);
      if (e) { setFormError(`Refund address: ${e}`); return; }
    }

    setSubmitting(true);
    try {
      const req: CheckoutRequest = {
        product_id: product?.id || productId,
        price_id: selectedPrice?.id,
        refund_address: refundAddr || undefined,
      };
      const resp = await api.checkout(req);
      router.push(`/pay/${resp.invoice_id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Checkout failed');
    }
    setSubmitting(false);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13 }}>
        <div className="checkout-status expired" style={{ maxWidth: 420, width: '100%' }}>
          <div>{t('productNotFound')}</div>
          <div style={{ fontSize: 10, marginTop: 6, color: 'var(--cp-text-muted)', fontWeight: 400 }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      {/* Header */}
      <header className="site-header">
        <Logo size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="tag">{t('tag')}</span>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center" style={{ padding: '48px 24px' }}>
        <div style={{ maxWidth: 440, width: '100%' }}>
          <div className="checkout-preview">
            <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-text-dim)' }}>{t('payWithZec')}</div>
            <div className="price">{product.name}</div>
            <div className="price-zec">
              {selectedPrice
                ? `${currencySymbol(selectedPrice.currency)}${selectedPrice.unit_amount.toFixed(2)} ${selectedPrice.currency}`
                : '—'}
            </div>

            {hasTierLabels && activePrices.length > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                {activePrices.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPrice(p)}
                    className={selectedPrice?.id === p.id ? 'btn-primary' : 'btn'}
                    style={{ minWidth: 80, textAlign: 'center', fontSize: 11, padding: '6px 12px' }}
                  >
                    {p.label || p.currency} · {currencySymbol(p.currency)}{p.unit_amount.toFixed(2)}
                  </button>
                ))}
              </div>
            )}

            {product.description && (
              <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 4, marginBottom: 16 }}>
                {product.description}
              </div>
            )}

            <div className="divider" />

            <div style={{ textAlign: 'left' }}>
              <div className="section-title">{t('refundTitle')}</div>
              <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginBottom: 4, lineHeight: 1.5 }}>
                {t('refundDesc')}
              </div>
              <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', opacity: 0.7, marginBottom: 10, lineHeight: 1.5 }}>
                {t('refundPrivacyHint')}
              </div>
              <div className="form-group">
                <input type="text" value={refundAddr} onChange={(e) => setRefundAddr(e.target.value)} placeholder="u1..." className="input" style={{ fontSize: 10 }} />
              </div>
            </div>

            {formError && (
              <div style={{ color: 'var(--cp-red)', fontSize: 11, marginBottom: 12, textAlign: 'center' }}>
                {formError}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', opacity: submitting ? 0.5 : 1 }}
            >
              {submitting ? t('processing') : t('payButton')}
            </button>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--cp-border)', padding: '16px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--cp-text-muted)', letterSpacing: 1 }}>
          Powered by <span style={{ color: 'var(--cp-cyan)' }}>CipherPay</span>
        </span>
      </footer>
    </div>
  );
}
