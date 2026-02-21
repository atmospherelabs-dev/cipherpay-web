import { API_URL } from './config';

export interface MerchantInfo {
  id: string;
  name: string;
  payment_address: string;
  webhook_url: string | null;
  webhook_secret_preview: string;
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
  merchant_name: string | null;
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
  name?: string;
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

export interface Product {
  id: string;
  merchant_id: string;
  slug: string;
  name: string;
  description: string | null;
  price_eur: number;
  variants: string | null;
  active: number;
  created_at: string;
}

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price_eur: number;
  variants: string[];
  slug: string;
}

export interface CreateProductRequest {
  slug: string;
  name: string;
  description?: string;
  price_eur: number;
  variants?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price_eur?: number;
  variants?: string[];
  active?: boolean;
}

export interface CheckoutRequest {
  product_id: string;
  variant?: string;
  shipping_alias?: string;
  shipping_address?: string;
  shipping_region?: string;
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

  updateMe: (data: { name?: string; payment_address?: string; webhook_url?: string }) =>
    request<{ status: string }>('/api/merchants/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  regenerateApiKey: () =>
    request<{ api_key: string }>('/api/merchants/me/regenerate-api-key', { method: 'POST' }),

  regenerateDashboardToken: () =>
    request<{ dashboard_token: string }>('/api/merchants/me/regenerate-dashboard-token', { method: 'POST' }),

  regenerateWebhookSecret: () =>
    request<{ webhook_secret: string }>('/api/merchants/me/regenerate-webhook-secret', { method: 'POST' }),

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

  shipInvoice: (id: string) =>
    request<{ status: string }>(`/api/invoices/${id}/ship`, { method: 'POST' }),

  // Recovery
  recover: (email: string) =>
    request<{ message: string }>('/api/auth/recover', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  recoverConfirm: (token: string) =>
    request<{ dashboard_token: string; message: string }>('/api/auth/recover/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  getRates: () => request<ZecRates>('/api/rates'),

  // Products
  createProduct: (data: CreateProductRequest) =>
    request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listProducts: () => request<Product[]>('/api/products'),

  updateProduct: (id: string, data: UpdateProductRequest) =>
    request<Product>(`/api/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deactivateProduct: (id: string) =>
    request<{ status: string }>(`/api/products/${id}`, { method: 'DELETE' }),

  getPublicProduct: (id: string) =>
    request<PublicProduct>(`/api/products/${id}/public`),

  // Public checkout (buyer-driven)
  checkout: (data: CheckoutRequest) =>
    request<CreateInvoiceResponse>('/api/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // SSE stream for invoice status
  streamInvoice: (invoiceId: string): EventSource =>
    new EventSource(`${API_URL}/api/invoices/${invoiceId}/stream`, {
      withCredentials: true,
    }),
};
