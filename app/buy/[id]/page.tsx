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
      return {
        title: `${product.name} — €${product.price_eur.toFixed(2)} — CipherPay`,
        description: product.description || `Pay with shielded ZEC`,
        openGraph: {
          title: `${product.name} — CipherPay`,
          description: `€${product.price_eur.toFixed(2)} · Pay with shielded Zcash`,
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
