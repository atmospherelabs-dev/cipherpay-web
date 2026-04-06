import type { Metadata } from 'next';
import DonateClient from './DonateClient';
import type { DonationLinkInfo } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cipherpay.app';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cipherpay.app';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

async function fetchInfo(slug: string, retries = 2): Promise<DonationLinkInfo | null> {
  const url = `${API_URL}/api/payment-links/${slug}/info`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(`[donate/${slug}] /info returned ${res.status} (attempt ${attempt + 1}): ${body}`);
        if (attempt < retries && res.status >= 500) continue;
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error(`[donate/${slug}] /info fetch failed (attempt ${attempt + 1}):`, err);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
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
  const url = `${SITE_URL}/en/donate/${slug}`;

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
    return <ErrorView status={503} message="The campaign page is temporarily unavailable. Please refresh to try again." />;
  }

  if ((info as unknown as { error?: string }).error) {
    return <ErrorView status={404} message={(info as unknown as { error: string }).error} />;
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
    status === 503 ? 'Temporarily unavailable' :
    'Error';

  const showRefresh = status === 503 || status === 500;

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
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 20px' }}>
        <div style={{ fontSize: 48, fontWeight: 700, opacity: 0.3, marginBottom: 12 }}>
          {status}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          {title}
        </h1>
        <p style={{ fontSize: 14, opacity: 0.6, lineHeight: 1.5 }}>
          {message}
        </p>
        {showRefresh && (
          <a
            href=""
            style={{
              display: 'inline-block', marginTop: 20,
              padding: '10px 24px', borderRadius: 6,
              background: 'rgba(86, 212, 200, 0.1)',
              border: '1px solid rgba(86, 212, 200, 0.25)',
              color: '#56D4C8', fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Try again
          </a>
        )}
      </div>
    </div>
  );
}
