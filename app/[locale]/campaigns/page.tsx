import type { Metadata } from 'next';
import { serverApiFetch } from '@/lib/server-api';
import CampaignsClient from './CampaignsClient';
import type { CampaignEntry } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export const metadata: Metadata = {
  title: 'Campaigns — CipherPay',
  description: 'Browse active donation campaigns accepting private Zcash payments.',
  openGraph: {
    title: 'Donation Campaigns — CipherPay',
    description: 'Browse active donation campaigns accepting private Zcash payments.',
    siteName: 'CipherPay',
    type: 'website',
  },
};

async function fetchCampaigns(): Promise<CampaignEntry[]> {
  try {
    const res = await serverApiFetch('/api/campaigns', {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchZecRate(): Promise<number | null> {
  try {
    const res = await serverApiFetch('/api/rates', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const rates = await res.json();
    return rates.zec_usd ?? null;
  } catch {
    return null;
  }
}

export default async function CampaignsPage() {
  const [campaigns, zecRate] = await Promise.all([
    fetchCampaigns(),
    fetchZecRate(),
  ]);

  return <CampaignsClient campaigns={campaigns} zecRate={zecRate} />;
}
