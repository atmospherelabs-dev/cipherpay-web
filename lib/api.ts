import { API_URL } from './config';

export interface MerchantInfo {
  id: string;
  payment_address: string;
  webhook_url: string | null;
  has_recovery_email: boolean;
  created_at: string;
  stats: {
    total_invoices: number;
    confirmed: number;
    total_zec: number;
  };
}

export interface Invoice {
  id: string;
  merchant_id: string;
  memo_code: string;
  product_name: string | null;
  size: string | null;
  price_eur: number;
  price_zec: number;
  zec_rate_at_creation: number;
  payment_address: string;
  zcash_uri: string;
  status: 'pending' | 'detected' | 'confirmed' | 'expired' | 'shipped';
  detected_txid: string | null;
  detected_at: string | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  expires_at: string;
  created_at: string;
  shipping_alias?: string | null;
  shipping_address?: string | null;
  shipping_region?: string | null;
}

export interface CreateInvoiceRequest {
  product_name?: string;
  size?: string;
  price_eur: number;
  shipping_alias?: string;
  shipping_address?: string;
  shipping_region?: string;
}

export interface CreateInvoiceResponse {
  invoice_id: string;
  memo_code: string;
  price_eur: number;
  price_zec: number;
  zec_rate: number;
  payment_address: string;
  zcash_uri: string;
  expires_at: string;
}

export interface RegisterRequest {
  ufvk: string;
  payment_address: string;
  webhook_url?: string;
  email?: string;
}

export interface RegisterResponse {
  merchant_id: string;
  api_key: string;
  dashboard_token: string;
  webhook_secret: string;
}

export interface ZecRates {
  zec_eur: number;
  zec_usd: number;
  updated_at: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  createSession: (token: string) =>
    request<{ merchant_id: string; payment_address: string }>(
      '/api/auth/session',
      { method: 'POST', body: JSON.stringify({ token }) }
    ),

  logout: () =>
    request<{ status: string }>('/api/auth/logout', { method: 'POST' }),

  me: () => request<MerchantInfo>('/api/merchants/me'),

  myInvoices: () => request<Invoice[]>('/api/merchants/me/invoices'),

  // Public
  register: (data: RegisterRequest) =>
    request<RegisterResponse>('/api/merchants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createInvoice: (data: CreateInvoiceRequest) =>
    request<CreateInvoiceResponse>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getInvoice: (id: string) => request<Invoice>(`/api/invoices/${id}`),

  cancelInvoice: (id: string) =>
    request<{ status: string }>(`/api/invoices/${id}/cancel`, { method: 'POST' }),

  getRates: () => request<ZecRates>('/api/rates'),

  // SSE stream for invoice status
  streamInvoice: (invoiceId: string): EventSource =>
    new EventSource(`${API_URL}/api/invoices/${invoiceId}/stream`, {
      withCredentials: true,
    }),
};
