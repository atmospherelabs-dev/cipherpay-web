'use server';
import { serverApiFetch } from '@/lib/server-api';

const CHECKOUT_KEY = process.env.CHECKOUT_SERVICE_KEY || '';

export async function createDonationCheckout(
  slug: string,
  amount: number,
  currency: string,
): Promise<{ invoice_id?: string; checkout_token?: string; error?: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (CHECKOUT_KEY) headers['X-Checkout-Key'] = CHECKOUT_KEY;

    const res = await serverApiFetch(`/api/payment-links/${encodeURIComponent(slug)}/checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount, currency }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed' }));
      return { error: err.error || 'Something went wrong' };
    }

    const data = await res.json();
    return { invoice_id: data.invoice_id, checkout_token: data.checkout_token };
  } catch {
    return { error: 'Network error. Please try again.' };
  }
}
