import { API_URL } from '@/lib/config';
import type { Metadata } from 'next';
import { Suspense } from 'react';
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
      const cur = invoice.currency || 'EUR';
      const amt = invoice.amount ?? invoice.price_eur;
      const title = invoice.status === 'draft'
        ? `Pay ${amt.toFixed(2)} ${cur} — CipherPay`
        : `Pay ${invoice.price_zec.toFixed(4)} ZEC — CipherPay`;
      const desc = invoice.status === 'draft'
        ? `Invoice ${invoice.memo_code} · ${amt.toFixed(2)} ${cur}`
        : `Invoice ${invoice.memo_code} · €${invoice.price_eur.toFixed(2)}`;
      return {
        title,
        description: desc,
        openGraph: { title, description: desc },
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
  return (
    <Suspense>
      <CheckoutClient invoiceId={id} />
    </Suspense>
  );
}
