import type { Metadata } from 'next';
import DonateClient from './DonateClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cipherpay.app';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export const metadata: Metadata = {
  title: 'Donate — CipherPay',
  description: 'Make a private donation with Zcash',
};

export default async function DonatePage({ params }: PageProps) {
  const { slug, locale } = await params;

  try {
    const res = await fetch(`${API_URL}/api/payment-links/${slug}/info`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      return <ErrorView status={res.status} message={err.error} />;
    }

    const info = await res.json();

    if (info.mode !== 'donation') {
      return <ErrorView status={404} message="This is not a donation link" />;
    }

    return <DonateClient info={info} slug={slug} locale={locale} />;
  } catch {
    return <ErrorView status={500} message="Something went wrong" />;
  }
}

function ErrorView({ status, message }: { status: number; message: string }) {
  const title =
    status === 404 ? 'Not found' :
    status === 410 ? 'No longer active' :
    'Error';

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
