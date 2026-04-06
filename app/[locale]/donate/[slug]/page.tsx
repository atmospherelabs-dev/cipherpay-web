import type { Metadata } from 'next';
import DonateClient from './DonateClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cipherpay.app';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cipherpay.app';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

async function fetchInfo(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/payment-links/${slug}/info`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const info = await fetchInfo(slug);

  if (!info || info.mode !== 'donation') {
    return { title: 'Donate — CipherPay', description: 'Make a private donation with Zcash' };
  }

  const dc = info.donation_config;
  const campaignName = dc?.campaign_name || info.name || 'Donation';
  const orgName = info.name || 'CipherPay';
  const title = `${campaignName} — ${orgName}`;
  const description = dc?.mission || `Donate privately with Zcash to ${orgName}`;
  const url = `${SITE_URL}/donate/${slug}`;

  const meta: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'CipherPay',
      type: 'website',
    },
    twitter: {
      card: dc?.cover_image_url ? 'summary_large_image' : 'summary',
      title,
      description,
    },
  };

  if (dc?.cover_image_url) {
    meta.openGraph!.images = [{ url: dc.cover_image_url, alt: campaignName }];
    meta.twitter!.images = [dc.cover_image_url];
  }

  return meta;
}

export default async function DonatePage({ params }: PageProps) {
  const { slug, locale } = await params;

  const info = await fetchInfo(slug);

  if (!info) {
    return <ErrorView status={500} message="Something went wrong" />;
  }

  if (info.error) {
    return <ErrorView status={404} message={info.error} />;
  }

  if (info.mode !== 'donation') {
    return <ErrorView status={404} message="This is not a donation link" />;
  }

  return <DonateClient info={info} slug={slug} locale={locale} />;
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
