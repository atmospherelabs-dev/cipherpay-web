'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { api, type PublicProduct, type CheckoutRequest, type Price } from '@/lib/api';
import { validateZcashAddress } from '@/lib/validation';
import { currencySymbol } from '@/lib/currency';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Link } from '@/i18n/navigation';
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

function formatEventDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

export default function BuyClient({ productId }: { productId: string }) {
  const t = useTranslations('buy');
  const tc = useTranslations('common');
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null);
  const [refundAddr, setRefundAddr] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [soldOut, setSoldOut] = useState(false);

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
  const isEvent = !!(product?.event_date || product?.event_location || hasTierLabels);

  const isLuma = !!product?.is_luma;

  const handleCheckout = async () => {
    setFormError('');

    if (isLuma && !attendeeEmail.trim()) {
      setFormError(t('emailRequired'));
      return;
    }

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
        attendee_name: isLuma && attendeeName.trim() ? attendeeName.trim() : undefined,
        attendee_email: isLuma && attendeeEmail.trim() ? attendeeEmail.trim() : undefined,
      };
      const resp = await api.checkout(req);
      router.push(`/pay/${resp.invoice_id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Checkout failed';
      if (msg.toLowerCase().includes('sold out')) {
        setSoldOut(true);
      } else {
        setFormError(msg);
      }
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
        <Link href="/"><Logo size="sm" /></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="tag">{t('tag')}</span>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center" style={{ padding: '48px 24px' }}>
        <div style={{ maxWidth: 440, width: '100%' }}>
          <div className="checkout-preview">
            <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-text-dim)' }}>
              {isEvent ? t('getTickets') : t('payWithZec')}
            </div>
            <div className="price">{product.name}</div>

            {isEvent && (product.event_date || product.event_location) && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center',
                marginTop: 6, marginBottom: 2,
              }}>
                {product.event_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--cp-text-muted)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>{formatEventDate(product.event_date)}</span>
                  </div>
                )}
                {product.event_location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--cp-text-muted)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>{product.event_location}</span>
                  </div>
                )}
              </div>
            )}

            {hasTierLabels && activePrices.length > 1 ? (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--cp-text-dim)', marginBottom: 8 }}>
                  {t('selectTier')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activePrices.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPrice(p)}
                      className={selectedPrice?.id === p.id ? 'btn-primary' : 'btn'}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '10px 16px' }}
                    >
                      <span>{p.label || p.currency}</span>
                      <span style={{ opacity: 0.7 }}>{currencySymbol(p.currency)}{p.unit_amount.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="price-zec">
                {selectedPrice
                  ? `${currencySymbol(selectedPrice.currency)}${selectedPrice.unit_amount.toFixed(2)} ${selectedPrice.currency}`
                  : '—'}
              </div>
            )}

            {product.description && (
              <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 10, marginBottom: 4, lineHeight: 1.5 }}>
                {product.description}
              </div>
            )}

            <div className="divider" />

            {isLuma && (
              <div style={{ textAlign: 'left', marginBottom: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-text-dim)', marginBottom: 6, lineHeight: 1.5 }}>
                  {t('attendeeRequired')}
                </div>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 10, letterSpacing: 0.5, color: 'var(--cp-text-muted)', marginBottom: 2, display: 'block' }}>{t('attendeeName')}</label>
                  <input
                    type="text"
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                    placeholder={t('attendeeNamePlaceholder')}
                    className="input"
                    style={{ fontSize: 11 }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: 10, letterSpacing: 0.5, color: formError && !attendeeEmail.trim() ? 'var(--cp-red)' : 'var(--cp-text-muted)', marginBottom: 2, display: 'block' }}>{t('attendeeEmail')} *</label>
                  <input
                    type="email"
                    value={attendeeEmail}
                    onChange={(e) => { setAttendeeEmail(e.target.value); setFormError(''); }}
                    placeholder={t('attendeeEmailPlaceholder')}
                    className="input"
                    style={{ fontSize: 11, borderColor: formError && !attendeeEmail.trim() ? 'var(--cp-red)' : undefined }}
                    required
                  />
                </div>
              </div>
            )}

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

            {soldOut && (
              <div style={{
                textAlign: 'center', padding: '16px 20px', marginBottom: 12,
                border: '1px solid var(--cp-red)', borderRadius: 6,
                background: 'rgba(239,68,68,0.06)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cp-red)', letterSpacing: 1 }}>
                  {t('soldOut')}
                </div>
                <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginTop: 6, lineHeight: 1.5 }}>
                  {t('soldOutHint')}
                </div>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={submitting || soldOut}
              className="btn-primary"
              style={{ width: '100%', opacity: (submitting || soldOut) ? 0.5 : 1 }}
            >
              {submitting ? t('processing') : soldOut ? t('soldOut') : (isEvent ? t('buyTicket') : t('payButton'))}
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
