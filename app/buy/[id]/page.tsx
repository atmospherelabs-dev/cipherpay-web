import { API_URL } from '@/lib/config';
import type { Metadata } from 'next';
import BuyClient from './BuyClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API_URL}/api/products/${id}/public`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const product = await res.json();
      const prices = (product.prices || []).filter((p: { active: number }) => p.active === 1);
      const dp = product.default_price_id
        ? prices.find((p: { id: string }) => p.id === product.default_price_id)
        : prices[0];
      const priceStr = dp
        ? `${dp.currency === 'USD' ? '$' : dp.currency === 'GBP' ? '£' : '€'}${Number(dp.unit_amount).toFixed(2)}`
        : '';
      return {
        title: priceStr ? `${product.name} — ${priceStr} — CipherPay` : `${product.name} — CipherPay`,
        description: product.description || `Pay with shielded ZEC`,
        openGraph: {
          title: `${product.name} — CipherPay`,
          description: priceStr ? `${priceStr} · Pay with shielded Zcash` : 'Pay with shielded Zcash',
        },
      };
    }
  } catch {
    // fallback metadata
  }
  return {
    title: 'Buy with Zcash — CipherPay',
    description: 'Pay privately with shielded Zcash',
  };
}

export default async function BuyPage({ params }: PageProps) {
  const { id } = await params;
  return <BuyClient productId={id} />;
}
