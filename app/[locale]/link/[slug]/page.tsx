import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cipherpay.app';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export const metadata: Metadata = {
  title: 'Payment Link — CipherPay',
  description: 'Complete your shielded Zcash payment',
};

export default async function PaymentLinkPage({ params }: PageProps) {
  const { slug, locale } = await params;

  try {
    const res = await fetch(`${API_URL}/api/payment-links/${slug}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      return <ErrorView status={res.status} message={err.error} />;
    }

    const data = await res.json();
    const invoiceId = data.invoice_id;

    if (!invoiceId) {
      return <ErrorView status={500} message="Failed to create invoice" />;
    }

    const checkoutPath = `/${locale}/pay/${invoiceId}`;
    const returnUrl = data.checkout_url?.includes('return_url=')
      ? `?return_url=${data.checkout_url.split('return_url=')[1]}`
      : '';

    redirect(`${checkoutPath}${returnUrl}`);
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'digest' in e) throw e;
    return <ErrorView status={500} message="Something went wrong" />;
  }
}

function ErrorView({ status, message }: { status: number; message: string }) {
  const title =
    status === 404 ? 'Link not found' :
    status === 410 ? 'Link expired' :
    status === 429 ? 'Too many requests' :
    'Payment error';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--cp-bg, #0a0a0f)',
      color: 'var(--cp-text, #e0e0e0)',
      fontFamily: 'var(--font-mono, monospace)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, fontWeight: 700, opacity: 0.3, marginBottom: 12 }}>
          {status}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          {title}
        </h1>
        <p style={{ fontSize: 14, opacity: 0.6, lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
    </div>
  );
}
