import { API_URL } from './config';

export interface MerchantInfo {
  id: string;
  name: string;
  payment_address: string;
  webhook_url: string | null;
  webhook_secret_preview: string;
  has_recovery_email: boolean;
  recovery_email_preview: string | null;
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
  price_usd: number | null;
  currency: string | null;
  price_zec: number;
  zec_rate_at_creation: number;
  payment_address: string;
  zcash_uri: string;
  merchant_name: string | null;
  merchant_origin?: string | null;
  status: 'pending' | 'underpaid' | 'detected' | 'confirmed' | 'expired' | 'refunded';
  detected_txid: string | null;
  detected_at: string | null;
  confirmed_at: string | null;
  refunded_at: string | null;
  expires_at: string;
  created_at: string;
  refund_address?: string | null;
  received_zec: number | null;
  price_zatoshis: number;
  received_zatoshis: number;
  overpaid?: boolean;
}

export interface CreateInvoiceRequest {
  product_name?: string;
  size?: string;
  price_eur: number;
  currency?: string;
}

export interface CreateInvoiceResponse {
  invoice_id: string;
  memo_code: string;
  price_eur: number;
  price_usd: number;
  price_zec: number;
  zec_rate: number;
  payment_address: string;
  zcash_uri: string;
  expires_at: string;
}

export interface RegisterRequest {
  name?: string;
  ufvk: string;
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
  currency: string;
  variants: string | null;
  active: number;
  created_at: string;
}

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price_eur: number;
  currency: string;
  variants: string[];
  slug: string;
}

export interface CreateProductRequest {
  slug: string;
  name: string;
  description?: string;
  price_eur: number;
  currency?: string;
  variants?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price_eur?: number;
  currency?: string;
  variants?: string[];
  active?: boolean;
}

export interface CheckoutRequest {
  product_id: string;
  variant?: string;
  refund_address?: string;
}

export interface ZecRates {
  zec_eur: number;
  zec_usd: number;
  updated_at: string;
}

export interface BillingCycle {
  id: string;
  merchant_id: string;
  period_start: string;
  period_end: string;
  total_fees_zec: number;
  auto_collected_zec: number;
  outstanding_zec: number;
  settlement_invoice_id: string | null;
  status: 'open' | 'invoiced' | 'paid' | 'past_due' | 'suspended';
  grace_until: string | null;
  created_at: string;
}

export interface BillingSummary {
  fee_enabled: boolean;
  fee_rate: number;
  trust_tier: string;
  billing_status: string;
  current_cycle: BillingCycle | null;
  total_fees_zec: number;
  auto_collected_zec: number;
  outstanding_zec: number;
}

export interface SettleResponse {
  invoice_id: string;
  outstanding_zec: number;
  message: string;
}

export interface X402Verification {
  id: string;
  txid: string;
  amount_zatoshis: number | null;
  amount_zec: number | null;
  status: 'verified' | 'rejected';
  reason: string | null;
  created_at: string;
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

  updateMe: (data: { name?: string; webhook_url?: string; recovery_email?: string }) =>
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

  refundInvoice: (id: string) =>
    request<{ status: string; refund_address: string | null }>(`/api/invoices/${id}/refund`, { method: 'POST' }),

  saveRefundAddress: (id: string, refund_address: string) =>
    request<{ status: string; refund_address: string }>(`/api/invoices/${id}/refund-address`, {
      method: 'PATCH',
      body: JSON.stringify({ refund_address }),
    }),

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

  // Billing
  getBilling: () => request<BillingSummary>('/api/merchants/me/billing'),

  getBillingHistory: () => request<BillingCycle[]>('/api/merchants/me/billing/history'),

  settleBilling: () =>
    request<SettleResponse>('/api/merchants/me/billing/settle', { method: 'POST' }),

  // x402
  x402History: (limit = 50, offset = 0) =>
    request<{ verifications: X402Verification[] }>(`/api/merchants/me/x402/history?limit=${limit}&offset=${offset}`),

  // Account
  deleteAccount: () =>
    request<{ status: string; message: string }>('/api/merchants/me/delete', { method: 'POST' }),

  // SSE stream for invoice status
  streamInvoice: (invoiceId: string): EventSource =>
    new EventSource(`${API_URL}/api/invoices/${invoiceId}/stream`, {
      withCredentials: true,
    }),
};
