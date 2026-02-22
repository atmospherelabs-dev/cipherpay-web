'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type PublicProduct, type CheckoutRequest } from '@/lib/api';
import { validateZcashAddress } from '@/lib/validation';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function BuyClient({ productId }: { productId: string }) {
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [refundAddr, setRefundAddr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const router = useRouter();

  useEffect(() => {
    api.getPublicProduct(productId)
      .then((p) => {
        setProduct(p);
        if (p.variants.length > 0) setSelectedVariant(p.variants[0]);
      })
      .catch((e) => setError(e.message));
  }, [productId]);

  const handleCheckout = async () => {
    setFormError('');

    if (product?.variants && product.variants.length > 0 && !selectedVariant) {
      setFormError('Please select a variant');
      return;
    }

    if (refundAddr) {
      const e = validateZcashAddress(refundAddr);
      if (e) { setFormError(`Refund address: ${e}`); return; }
    }

    setSubmitting(true);
    try {
      const req: CheckoutRequest = {
        product_id: productId,
        variant: selectedVariant || undefined,
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
          <div>PRODUCT NOT FOUND</div>
          <div style={{ fontSize: 10, marginTop: 6, color: 'var(--cp-text-muted)', fontWeight: 400 }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--cp-cyan)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="tag">CHECKOUT</span>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center" style={{ padding: '48px 24px' }}>
        <div style={{ maxWidth: 440, width: '100%' }}>
          <div className="checkout-preview">
            <div style={{ fontSize: 10, letterSpacing: 1, color: 'var(--cp-text-dim)' }}>PAY WITH SHIELDED ZEC</div>
            <div className="price">{product.name}</div>
            <div className="price-zec">{product.currency === 'USD' ? '$' : '€'}{product.price_eur.toFixed(2)}</div>

            {product.description && (
              <div style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 4, marginBottom: 16 }}>
                {product.description}
              </div>
            )}

            {product.variants.length > 0 && (
              <div style={{ textAlign: 'left', marginTop: 16 }}>
                <div className="form-group">
                  <label className="form-label">SELECT VARIANT</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {product.variants.map((v) => (
                      <button
                        key={v}
                        onClick={() => setSelectedVariant(v)}
                        className={selectedVariant === v ? 'btn-primary' : 'btn'}
                        style={{ minWidth: 44, textAlign: 'center' }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="divider" />

            <div style={{ textAlign: 'left' }}>
              <div className="section-title">Refund Address (optional)</div>
              <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', marginBottom: 8, lineHeight: 1.5 }}>
                Provide a Zcash address if you want the option of a refund. Without it, refunds require manual coordination.
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
              {submitting ? 'PROCESSING...' : 'PAY WITH ZEC'}
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
