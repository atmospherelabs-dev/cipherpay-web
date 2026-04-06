import { API_URL } from './config';

export interface MerchantInfo {
  id: string;
  name: string;
  payment_address: string;
  webhook_url: string | null;
  webhook_secret_preview: string;
  has_recovery_email: boolean;
  recovery_email_preview: string | null;
  has_luma_key?: boolean;
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
  product_id?: string | null;
  product_name: string | null;
  size: string | null;
  amount: number | null;
  price_id: string | null;
  price_eur: number;
  price_usd: number | null;
  currency: string | null;
  price_zec: number;
  zec_rate_at_creation: number;
  payment_address: string;
  zcash_uri: string;
  merchant_name: string | null;
  merchant_origin?: string | null;
  subscription_id?: string | null;
  status: 'draft' | 'pending' | 'underpaid' | 'detected' | 'confirmed' | 'expired' | 'refunded';
  detected_txid: string | null;
  detected_at: string | null;
  confirmed_at: string | null;
  refunded_at: string | null;
  expires_at: string;
  created_at: string;
  refund_address?: string | null;
  refund_txid?: string | null;
  received_zec: number | null;
  price_zatoshis: number;
  received_zatoshis: number;
  overpaid?: boolean;
  is_donation?: boolean;
  payment_link_id?: string | null;
  is_event?: boolean;
  is_luma?: boolean;
  price_label?: string | null;
  donation_meta?: {
    thank_you?: string | null;
    campaign_name?: string | null;
    contact_email?: string | null;
    social_share_text?: string | null;
    slug?: string | null;
  } | null;
}

export interface CreateInvoiceRequest {
  product_name?: string;
  size?: string;
  amount: number;
  currency?: string;
}

export interface CreateInvoiceResponse {
  invoice_id: string;
  memo_code: string;
  amount: number;
  currency: string;
  price_eur: number;
  price_usd: number;
  price_zec: number;
  zec_rate: number;
  price_id: string | null;
  payment_address: string;
  zcash_uri: string;
  expires_at: string;
  price_label?: string | null;
  event_title?: string | null;
  event_date?: string | null;
  event_location?: string | null;
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

export interface Price {
  id: string;
  product_id: string;
  currency: string;
  unit_amount: number;
  label?: string | null;
  max_quantity?: number | null;
  price_type: string;
  billing_interval: string | null;
  interval_count: number | null;
  active: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  merchant_id: string;
  price_id: string;
  label: string | null;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: number;
  canceled_at: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  merchant_id: string;
  slug: string;
  name: string;
  description: string | null;
  default_price_id: string | null;
  metadata: Record<string, string> | null;
  active: number;
  created_at: string;
  prices?: Price[];
}

export interface DonationConfig {
  mission?: string | null;
  thank_you?: string | null;
  suggested_amounts?: number[] | null;
  currency: string;
  min_amount: number;
  max_amount: number;
  campaign_name?: string | null;
  campaign_goal?: number | null;
  cover_image_url?: string | null;
  cover_image_position?: string | null;
  contact_email?: string | null;
  website_url?: string | null;
  social_share_text?: string | null;
}

export interface PaymentLink {
  id: string;
  merchant_id: string;
  price_id: string | null;
  slug: string;
  name: string | null;
  success_url: string | null;
  metadata: Record<string, string> | null;
  active: boolean;
  total_created: number;
  mode: 'payment' | 'donation';
  donation_config?: DonationConfig | null;
  total_raised: number;
  created_at: string;
}

export interface DonationLinkInfo {
  slug: string;
  name: string | null;
  mode: string;
  active: boolean;
  total_raised: number;
  total_created: number;
  merchant_name: string | null;
  donation_config?: DonationConfig | null;
  donate_url?: string;
  checkout_url?: string;
}

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  default_price_id: string | null;
  metadata: Record<string, string> | null;
  slug: string;
  prices?: Price[];
  event_date?: string | null;
  event_location?: string | null;
  is_luma?: boolean;
  luma_event_url?: string | null;
}

export interface CreateProductRequest {
  slug?: string;
  name: string;
  description?: string;
  unit_amount: number;
  currency?: string;
  metadata?: Record<string, string>;
  price_type?: string;
  billing_interval?: string;
  interval_count?: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  default_price_id?: string;
  metadata?: Record<string, string>;
  active?: boolean;
}

export interface CheckoutRequest {
  product_id?: string;
  price_id?: string;
  refund_address?: string;
  attendee_name?: string;
  attendee_email?: string;
}

export interface ZecRates {
  zec_eur: number;
  zec_usd: number;
  zec_brl: number;
  zec_gbp: number;
  zec_cad: number;
  zec_jpy: number;
  zec_mxn: number;
  zec_ars: number;
  zec_ngn: number;
  zec_chf: number;
  zec_inr: number;
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
  status: 'open' | 'invoiced' | 'paid' | 'past_due' | 'suspended' | 'carried_over';
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
  min_settlement_zec: number;
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
  protocol?: string;
  created_at: string;
}

export interface AgentSession {
  id: string;
  deposit_txid: string;
  balance_zatoshis: number;
  balance_remaining: number;
  cost_per_request: number;
  requests_made: number;
  balance_used: number;
  status: 'active' | 'closed' | 'expired' | 'depleted';
  expires_at: string;
  created_at: string;
  closed_at: string | null;
  refund?: {
    address: string;
    amount_zatoshis: number;
    amount_zec: number;
  };
}

export interface WebhookDelivery {
  id: string;
  invoice_id: string;
  event_type: string | null;
  status: string;
  response_status: number | null;
  response_error: string | null;
  attempts: number;
  created_at: string;
  last_attempt_at: string | null;
}

export interface WebhookHistory {
  deliveries: WebhookDelivery[];
  total: number;
}

export interface EventSummary {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_location: string | null;
  status: 'draft' | 'active' | 'cancelled' | 'past';
  created_at: string;
  sold_count: number;
  used_count: number;
  total_capacity: number | null;
  luma_event_id?: string | null;
  luma_event_url?: string | null;
}

export interface EventTierStat {
  price_id: string;
  label: string | null;
  currency: string;
  unit_amount: number;
  max_quantity: number | null;
  sold_count: number;
  used_count: number;
}

export interface EventDetail extends EventSummary {
  tiers: EventTierStat[];
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  event_date?: string;
  event_location?: string;
}

export interface Ticket {
  id: string;
  invoice_id: string;
  product_id: string;
  price_id: string | null;
  merchant_id: string;
  code: string;
  status: 'valid' | 'used' | 'void';
  used_at: string | null;
  created_at: string;
}

export interface TicketListItem {
  id: string;
  invoice_id: string;
  code: string;
  status: 'valid' | 'used' | 'void';
  used_at: string | null;
  created_at: string;
  product_id: string;
  product_name: string | null;
  price_id: string | null;
  price_label: string | null;
  event_title: string | null;
  event_date: string | null;
  event_location: string | null;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  event_date?: string;
  event_location?: string;
  prices: Array<{
    currency: string;
    unit_amount: number;
    label?: string;
    max_quantity?: number;
  }>;
}

export interface LumaTicketTypePrice {
  amount?: number | null;
  currency?: string | null;
}

export interface LumaTicketType {
  api_id: string;
  name?: string | null;
  description?: string | null;
  price?: LumaTicketTypePrice | null;
}

export interface LumaEventEntry {
  api_id: string;
  name: string;
  start_at?: string | null;
  end_at?: string | null;
  cover_url?: string | null;
  url?: string | null;
  timezone?: string | null;
  geo_address_json?: Record<string, unknown> | null;
  ticket_types: LumaTicketType[];
}

export interface LumaPassData {
  status: 'not_luma' | 'pending' | 'registered' | 'failed';
  guest?: {
    api_id?: string | null;
    approval_status?: string | null;
    check_in_qr_code?: string | null;
    event_ticket?: Record<string, unknown> | null;
  } | null;
  event_title?: string | null;
  event_date?: string | null;
  event_location?: string | null;
  luma_event_url?: string | null;
  ticket_type?: string | null;
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

  updateMe: (data: { name?: string; webhook_url?: string; recovery_email?: string; luma_api_key?: string }) =>
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

  finalizeInvoice: (id: string) =>
    request<Invoice>(`/api/invoices/${id}/finalize`, { method: 'POST' }),

  cancelInvoice: (id: string) =>
    request<{ status: string }>(`/api/invoices/${id}/cancel`, { method: 'POST' }),

  refundInvoice: (id: string, refund_txid?: string) =>
    request<{ status: string; refund_address: string | null; refund_txid: string | null }>(`/api/invoices/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ refund_txid: refund_txid || null }),
    }),

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

  // Payment Links
  listPaymentLinks: () => request<PaymentLink[]>('/api/payment-links'),

  createPaymentLink: (data: { price_id: string; name?: string; success_url?: string }) =>
    request<PaymentLink>('/api/payment-links', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePaymentLink: (id: string, data: {
    name?: string; success_url?: string; active?: boolean;
    donation_config?: Partial<DonationConfig>;
  }) =>
    request<PaymentLink>(`/api/payment-links/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deletePaymentLink: (id: string) =>
    request<{ status: string }>(`/api/payment-links/${id}`, { method: 'DELETE' }),

  // Donation Links
  createDonationLink: (data: {
    name: string;
    mission?: string;
    thank_you?: string;
    suggested_amounts?: number[];
    currency?: string;
    min_amount?: number;
    max_amount?: number;
    campaign_name?: string;
    campaign_goal?: number;
    cover_image_url?: string;
    cover_image_position?: string;
    contact_email?: string;
    website_url?: string;
    social_share_text?: string;
    success_url?: string;
  }) =>
    request<PaymentLink>('/api/donation-links', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDonationLinkInfo: (slug: string) =>
    request<DonationLinkInfo>(`/api/payment-links/${slug}/info`),

  resolveDonationLink: (slug: string, amount: number, currency: string) =>
    request<{ invoice_id: string; checkout_url: string }>(`/api/payment-links/${slug}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ amount, currency }),
    }),

  // Prices
  createPrice: (data: { product_id: string; currency: string; unit_amount: number; label?: string; max_quantity?: number; price_type?: string; billing_interval?: string; interval_count?: number }) =>
    request<Price>('/api/prices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listPrices: (productId: string) =>
    request<Price[]>(`/api/products/${productId}/prices`),

  updatePrice: (id: string, data: { unit_amount?: number; currency?: string; label?: string; max_quantity?: number; price_type?: string; billing_interval?: string; interval_count?: number }) =>
    request<Price>(`/api/prices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deactivatePrice: (id: string) =>
    request<{ status: string }>(`/api/prices/${id}`, { method: 'DELETE' }),

  // Subscriptions
  createSubscription: (data: { price_id: string; label?: string }) =>
    request<Subscription>('/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listSubscriptions: () =>
    request<Subscription[]>('/api/subscriptions'),

  cancelSubscription: (id: string, atPeriodEnd?: boolean) =>
    request<Subscription>(`/api/subscriptions/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ at_period_end: atPeriodEnd || false }),
    }),

  // Public checkout (buyer-driven)
  checkout: (data: CheckoutRequest) =>
    request<CreateInvoiceResponse>('/api/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Events
  listEvents: () =>
    request<EventSummary[]>('/api/events'),

  createEvent: (data: CreateEventRequest) =>
    request<EventSummary>('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getEvent: (id: string) =>
    request<EventDetail>(`/api/events/${id}`),

  updateEvent: (id: string, data: UpdateEventRequest) =>
    request<EventSummary>(`/api/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  archiveEvent: (id: string) =>
    request<{ status: string }>(`/api/events/${id}/archive`, { method: 'POST' }),

  // Tickets
  getTicketByInvoice: (invoiceId: string) =>
    request<{ code: string; status: string; event_date?: string | null; event_location?: string | null; price_label?: string | null }>(`/api/tickets/invoice/${invoiceId}`),

  scanTicket: (code: string) =>
    request<{ valid: boolean; already_used: boolean; voided: boolean; ticket_status: string; ticket_id: string }>(
      '/api/tickets/scan',
      { method: 'POST', body: JSON.stringify({ code }) }
    ),

  listTickets: () =>
    request<TicketListItem[]>('/api/tickets'),

  voidTicket: (id: string) =>
    request<{ status: string }>(`/api/tickets/${id}/void`, { method: 'POST' }),

  // Billing
  getBilling: () => request<BillingSummary>('/api/merchants/me/billing'),

  getBillingHistory: () => request<BillingCycle[]>('/api/merchants/me/billing/history'),

  settleBilling: () =>
    request<SettleResponse>('/api/merchants/me/billing/settle', { method: 'POST' }),

  // x402
  x402History: (limit = 50, offset = 0) =>
    request<{ verifications: X402Verification[] }>(`/api/merchants/me/x402/history?limit=${limit}&offset=${offset}`),

  // Sessions (agentic prepaid credit)
  sessionHistory: () =>
    request<{ sessions: AgentSession[] }>('/api/merchants/me/sessions'),

  webhookHistory: (params?: { status?: string; limit?: number; offset?: number }) => {
    const p = new URLSearchParams();
    if (params?.status) p.set('status', params.status);
    p.set('limit', String(params?.limit ?? 50));
    p.set('offset', String(params?.offset ?? 0));
    return request<WebhookHistory>(`/api/merchants/me/webhooks?${p}`);
  },

  // Luma
  listLumaEvents: () =>
    request<LumaEventEntry[]>('/api/luma/events'),

  importLumaEvent: (lumaEventId: string) =>
    request<{ event_id: string; product_id: string; title: string; luma_event_id: string }>(
      '/api/luma/import',
      { method: 'POST', body: JSON.stringify({ luma_event_id: lumaEventId }) }
    ),

  syncLumaEvent: (eventId: string) =>
    request<{ synced?: number; added?: number; deactivated?: number; title?: string; cancelled?: boolean; past?: boolean; reason?: string }>(
      `/api/luma/sync/${eventId}`,
      { method: 'POST' }
    ),

  getLumaPass: (invoiceId: string) =>
    request<LumaPassData>(`/api/invoices/${invoiceId}/luma-pass`),

  // Account
  deleteAccount: () =>
    request<{ status: string; message: string }>('/api/merchants/me/delete', { method: 'POST' }),

  // SSE stream for invoice status
  streamInvoice: (invoiceId: string): EventSource =>
    new EventSource(`${API_URL}/api/invoices/${invoiceId}/stream`, {
      withCredentials: true,
    }),
};
