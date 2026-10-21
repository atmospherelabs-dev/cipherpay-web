import { serverApiFetch } from '@/lib/server-api';
import type { Metadata } from 'next';
import BuyClient from './BuyClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await serverApiFetch(`/api/products/${encodeURIComponent(id)}/public`, {
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
        description: product.description || 'Continue to payment with CipherPay',
        openGraph: {
          title: `${product.name} — CipherPay`,
          description: priceStr ? `${priceStr} · Checkout with CipherPay` : 'Checkout with CipherPay',
        },
      };
    }
  } catch {
    // fallback metadata
  }
  return {
    title: 'Checkout — CipherPay',
    description: 'Continue to payment with CipherPay',
  };
}

export default async function BuyPage({ params }: PageProps) {
  const { id } = await params;
  return <BuyClient productId={id} />;
}
