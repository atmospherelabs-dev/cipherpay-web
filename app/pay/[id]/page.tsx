import { API_URL } from '@/lib/config';
import type { Metadata } from 'next';
import CheckoutClient from './CheckoutClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API_URL}/api/invoices/${id}`, {
      next: { revalidate: 30 },
    });
    if (res.ok) {
      const invoice = await res.json();
      return {
        title: `Pay ${invoice.price_zec.toFixed(4)} ZEC — CipherPay`,
        description: `Invoice ${invoice.memo_code} · €${invoice.price_eur.toFixed(2)}`,
        openGraph: {
          title: `Pay ${invoice.price_zec.toFixed(4)} ZEC — CipherPay`,
          description: `Shielded Zcash payment for €${invoice.price_eur.toFixed(2)}`,
        },
      };
    }
  } catch {
    // fallback metadata
  }
  return {
    title: 'Pay with Zcash — CipherPay',
    description: 'Complete your shielded Zcash payment',
  };
}

export default async function CheckoutPage({ params }: PageProps) {
  const { id } = await params;
  return <CheckoutClient invoiceId={id} />;
}
