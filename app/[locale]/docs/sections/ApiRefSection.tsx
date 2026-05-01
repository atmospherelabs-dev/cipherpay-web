'use client';

import { Code, CodeBlock, Callout, SectionDivider, Paragraph, SectionTitle, Strong, Expandable } from '../components/DocComponents';

function EndpointTable({ endpoints }: { endpoints: { method: string; path: string; auth: string; desc: string }[] }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 20 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
            <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>METHOD</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>ENDPOINT</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>AUTH</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>DESCRIPTION</th>
          </tr>
        </thead>
        <tbody>
          {endpoints.map(ep => {
            const color = ep.method === 'GET' ? 'var(--cp-green)' : ep.method === 'POST' ? 'var(--cp-cyan)' : ep.method === 'DELETE' ? '#ef4444' : '#f59e0b';
            return (
              <tr key={ep.path + ep.method} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, color, fontSize: 10 }}>{ep.method}</td>
                <td style={{ padding: '8px 12px' }}><code style={{ color: 'var(--cp-text)', wordBreak: 'break-all', fontSize: 10 }}>{ep.path}</code></td>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)', fontSize: 10 }}>{ep.auth}</td>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{ep.desc}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ApiRefSection() {
  return (
    <>
      <Paragraph>
        All endpoints are relative to your CipherPay API server.
        For the hosted service, this is <Code>https://api.cipherpay.app</Code> (mainnet)
        or <Code>https://api.testnet.cipherpay.app</Code> (testnet).
      </Paragraph>

      <SectionTitle>Authentication</SectionTitle>
      <Paragraph>
        CipherPay uses two types of authentication:
      </Paragraph>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.4, marginBottom: 20 }}>
        <Strong>API Key</Strong> — For server-to-server calls (creating invoices, listing invoices).
        Include it in the <Code>Authorization</Code> header:<br />
        <span style={{ paddingLeft: 16, display: 'inline-block' }}><Code>Authorization: Bearer cpay_sk_YOUR_KEY</Code></span><br /><br />
        <Strong>Session (cookie)</Strong> — For dashboard operations (managing products, settings, billing).
        This is set automatically when you log into the dashboard. You typically don&apos;t need to manage this manually.
      </div>

      <SectionDivider />

      <SectionTitle>Endpoints</SectionTitle>

      <div style={{ fontSize: 12, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Invoices</div>
      <EndpointTable endpoints={[
        { method: 'POST', path: '/api/invoices', auth: 'API Key', desc: 'Create a new invoice with price and product details' },
        { method: 'GET', path: '/api/invoices', auth: 'API Key', desc: 'List all your invoices (paginated)' },
        { method: 'GET', path: '/api/invoices/{id}', auth: '—', desc: 'Get a single invoice by ID (public)' },
        { method: 'GET', path: '/api/invoices/{id}/status', auth: '—', desc: 'Poll the current status of an invoice' },
        { method: 'GET', path: '/api/invoices/{id}/stream', auth: '—', desc: 'SSE stream for real-time status updates' },
        { method: 'GET', path: '/api/invoices/{id}/qr', auth: '—', desc: 'QR code image (PNG) for the payment URI' },
        { method: 'GET', path: '/api/invoices/lookup/{memo}', auth: '—', desc: 'Look up an invoice by its memo code' },
        { method: 'POST', path: '/api/invoices/{id}/finalize', auth: '—', desc: 'Lock ZEC rate and start payment timer (public, for draft/expired subscription invoices)' },
        { method: 'POST', path: '/api/invoices/{id}/cancel', auth: 'Session', desc: 'Cancel a pending invoice' },
        { method: 'POST', path: '/api/invoices/{id}/refund', auth: 'Session', desc: 'Mark an invoice as refunded' },
        { method: 'PATCH', path: '/api/invoices/{id}/refund-address', auth: '—', desc: 'Set a refund address (buyer-facing)' },
      ]} />

      <div style={{ fontSize: 12, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Products &amp; Checkout</div>
      <EndpointTable endpoints={[
        { method: 'POST', path: '/api/products', auth: 'Session', desc: 'Create a new product (auto-creates a default price)' },
        { method: 'GET', path: '/api/products', auth: 'Session', desc: 'List your products (includes prices)' },
        { method: 'PATCH', path: '/api/products/{id}', auth: 'Session', desc: 'Update a product' },
        { method: 'DELETE', path: '/api/products/{id}', auth: 'Session', desc: 'Deactivate a product' },
        { method: 'GET', path: '/api/products/{id}/public', auth: '—', desc: 'Get public product info with active prices' },
        { method: 'POST', path: '/api/checkout', auth: '—', desc: 'Create an invoice from a price_id or product_id. Accepts optional success_url; returns checkout_url.' },
      ]} />

      <div style={{ fontSize: 12, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Payment Links</div>
      <EndpointTable endpoints={[
        { method: 'POST', path: '/api/payment-links', auth: 'API Key / Session', desc: 'Create a reusable payment link tied to a price' },
        { method: 'GET', path: '/api/payment-links', auth: 'API Key / Session', desc: 'List all your payment links' },
        { method: 'PATCH', path: '/api/payment-links/{id}', auth: 'API Key / Session', desc: 'Update a payment link (name, success_url, active status)' },
        { method: 'DELETE', path: '/api/payment-links/{id}', auth: 'API Key / Session', desc: 'Delete a payment link' },
        { method: 'POST', path: '/api/payment-links/{slug}/checkout', auth: '—', desc: 'Resolve a link by slug: creates a new invoice and returns checkout_url (public)' },
      ]} />

      <div style={{ fontSize: 12, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Prices</div>
      <EndpointTable endpoints={[
        { method: 'POST', path: '/api/prices', auth: 'Session', desc: 'Create a new price for a product (any supported currency)' },
        { method: 'GET', path: '/api/products/{id}/prices', auth: 'Session', desc: 'List all prices for a product' },
        { method: 'PATCH', path: '/api/prices/{id}', auth: 'Session', desc: 'Update a price (amount or currency)' },
        { method: 'DELETE', path: '/api/prices/{id}', auth: 'Session', desc: 'Deactivate a price' },
        { method: 'GET', path: '/api/prices/{id}/public', auth: '—', desc: 'Get a single price by its ID (public)' },
      ]} />

      <div style={{ fontSize: 12, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Subscriptions</div>
      <EndpointTable endpoints={[
        { method: 'POST', path: '/api/subscriptions', auth: 'API Key', desc: 'Create a subscription from a recurring price_id' },
        { method: 'GET', path: '/api/subscriptions', auth: 'API Key', desc: 'List all subscriptions' },
        { method: 'POST', path: '/api/subscriptions/{id}/cancel', auth: 'API Key', desc: 'Cancel a subscription (at end of current period)' },
      ]} />

      <div style={{ fontSize: 12, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Merchant &amp; Account</div>
      <EndpointTable endpoints={[
        { method: 'POST', path: '/api/merchants', auth: '—', desc: 'Register a new merchant account' },
        { method: 'GET', path: '/api/merchants/me', auth: 'Session', desc: 'Get your merchant profile' },
        { method: 'PATCH', path: '/api/merchants/me', auth: 'Session', desc: 'Update store name, email, webhook URL' },
        { method: 'POST', path: '/api/auth/session', auth: '—', desc: 'Log in (create a session)' },
        { method: 'POST', path: '/api/auth/logout', auth: '—', desc: 'Log out (clear session)' },
        { method: 'POST', path: '/api/auth/passkey/register/begin', auth: 'Session', desc: 'Begin passkey registration (WebAuthn)' },
        { method: 'POST', path: '/api/auth/passkey/register/complete', auth: 'Session', desc: 'Complete passkey registration' },
        { method: 'POST', path: '/api/auth/passkey/login/begin', auth: '—', desc: 'Begin passkey login' },
        { method: 'POST', path: '/api/auth/passkey/login/complete', auth: '—', desc: 'Complete passkey login' },
        { method: 'GET', path: '/api/auth/passkeys', auth: 'Session', desc: 'List registered passkeys' },
        { method: 'DELETE', path: '/api/auth/passkeys/{id}', auth: 'Session', desc: 'Delete a passkey' },
        { method: 'POST', path: '/api/merchants/me/regenerate-api-key', auth: 'Session', desc: 'Generate a new API key (invalidates old one)' },
        { method: 'POST', path: '/api/merchants/me/regenerate-dashboard-token', auth: 'Session', desc: 'Generate a new dashboard token' },
        { method: 'POST', path: '/api/merchants/me/regenerate-webhook-secret', auth: 'Session', desc: 'Generate a new webhook secret' },
      ]} />

      <div style={{ fontSize: 12, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Billing</div>
      <EndpointTable endpoints={[
        { method: 'GET', path: '/api/merchants/me/billing', auth: 'Session', desc: 'Current billing summary (balance, cycle, tier)' },
        { method: 'GET', path: '/api/merchants/me/billing/history', auth: 'Session', desc: 'Past billing cycles and fee entries' },
        { method: 'POST', path: '/api/merchants/me/billing/settle', auth: 'Session', desc: 'Create a settlement invoice to pay outstanding fees' },
      ]} />

      <div style={{ fontSize: 12, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>API Keys</div>
      <EndpointTable endpoints={[
        { method: 'GET', path: '/api/merchants/me/keys', auth: 'Full / Session', desc: 'List your full and restricted API keys' },
        { method: 'POST', path: '/api/merchants/me/keys', auth: 'Full / Session', desc: 'Mint a new key (full or restricted) — returns the raw key once' },
        { method: 'DELETE', path: '/api/merchants/me/keys/{id}', auth: 'Full / Session', desc: 'Revoke a key immediately' },
      ]} />

      <div style={{ fontSize: 12, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Sessions (MPP)</div>
      <EndpointTable endpoints={[
        { method: 'POST', path: '/api/sessions/prepare', auth: '—', desc: 'Prepare a session deposit' },
        { method: 'POST', path: '/api/sessions/open', auth: '—', desc: 'Open a session after deposit confirmation' },
        { method: 'GET', path: '/api/sessions/validate', auth: '—', desc: 'Validate a session token' },
        { method: 'POST', path: '/api/sessions/deduct', auth: '—', desc: 'Deduct from session balance' },
        { method: 'GET', path: '/api/sessions/{id}', auth: '—', desc: 'Get session status and balance' },
        { method: 'POST', path: '/api/sessions/{id}/close', auth: '—', desc: 'Close a session' },
        { method: 'GET', path: '/api/merchants/me/sessions', auth: 'Session', desc: 'Session history' },
      ]} />

      <div style={{ fontSize: 12, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Other</div>
      <EndpointTable endpoints={[
        { method: 'GET', path: '/api/rates', auth: '—', desc: 'Current ZEC exchange rates for all supported currencies' },
        { method: 'GET', path: '/api/health', auth: '—', desc: 'Server health check' },
        { method: 'GET', path: '/.well-known/payment', auth: '—', desc: 'Agent payment discovery metadata' },
      ]} />

      <SectionDivider />

      <Expandable title="Full invoice object">
        <Paragraph>
          The invoice object returned by <Code>GET /api/invoices/&#123;id&#125;</Code> (public, no auth required):
        </Paragraph>
        <CodeBlock lang="json" code={`{
  "id": "a1b2c3d4-...",
  "memo_code": "CP-3F8A2B1C",
  "product_name": "Privacy Tee",
  "size": "L",
  "amount": 65.0,
  "currency": "EUR",
  "price_id": "cprice_a1b2c3...",
  "price_eur": 65.0,
  "price_usd": 70.85,
  "price_zec": 0.14285714,
  "price_zatoshis": 14285714,
  "received_zec": 0.14285714,
  "received_zatoshis": 14285714,
  "zec_rate_at_creation": 455.0,
  "payment_address": "u1...",
  "zcash_uri": "zcash:u1...?amount=0.14285714&memo=...",
  "merchant_name": "My Store",
  "merchant_origin": "https://mystore.com",
  "status": "confirmed",
  "detected_txid": "abc123...",
  "detected_at": "2026-02-22T00:05:00Z",
  "confirmed_at": "2026-02-22T00:12:00Z",
  "refunded_at": null,
  "refund_txid": null,
  "overpaid": false,
  "expires_at": "2026-02-22T00:30:00Z",
  "created_at": "2026-02-22T00:00:00Z"
}`} />
        <Callout type="tip">
          This endpoint is public so the checkout page can fetch invoice details client-side.
          It returns only checkout-safe fields — shipping info and merchant secrets are never exposed.
        </Callout>
      </Expandable>

      <Expandable title="Price object fields">
        <Paragraph>
          Price objects returned by the API include:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          <Code>id</Code> — Stable price identifier (e.g. <Code>cprice_a1b2c3...</Code>)<br />
          <Code>product_id</Code> — The product this price belongs to<br />
          <Code>amount</Code> — The price amount in the specified currency<br />
          <Code>currency</Code> — ISO 4217 currency code (EUR, USD, GBP, BRL, etc.)<br />
          <Code>price_type</Code> — <Code>one_time</Code> or <Code>recurring</Code><br />
          <Code>billing_interval</Code> — For recurring prices: <Code>day</Code>, <Code>week</Code>, <Code>month</Code>, or <Code>year</Code><br />
          <Code>interval_count</Code> — Number of intervals between charges (e.g. 2 with <Code>month</Code> = every 2 months)<br />
          <Code>active</Code> — Whether this price is active and usable
        </div>
      </Expandable>

      <Expandable title="Checkout: success_url and checkout_url">
        <Paragraph>
          When creating an invoice via <Code>POST /api/checkout</Code>, you can include an
          optional <Code>success_url</Code> in the request body. If provided, the response includes
          a <Code>checkout_url</Code> — a ready-made URL with the redirect baked in.
        </Paragraph>
        <CodeBlock lang="bash" code={`curl -X POST https://api.cipherpay.app/api/checkout \\
  -H "Content-Type: application/json" \\
  -d '{
    "price_id": "cprice_a1b2c3...",
    "success_url": "https://mystore.com/order/confirmed"
  }'`} />
        <Paragraph>
          Response includes:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          <Code>checkout_url</Code> — Full URL to redirect the buyer to (e.g. <Code>https://cipherpay.app/pay/&#123;id&#125;?return_url=...</Code>)<br />
          <Code>invoice_id</Code> — The created invoice ID<br />
          <Code>price_zec</Code> — ZEC amount to pay
        </div>
        <Callout type="tip">
          This is the recommended pattern for platform integrations (Luma, custom apps).
          One API call, one redirect — no manual URL construction needed.
        </Callout>
      </Expandable>

      <Expandable title="Payment link fields">
        <Paragraph>
          Payment links are reusable URLs that auto-create a new invoice each time a buyer visits.
          Managed via the dashboard or API.
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          <Code>price_id</Code> — (required) The price to charge. Must be an active price.<br />
          <Code>name</Code> — Display name for the link (e.g. &quot;Buy Premium Plan&quot;)<br />
          <Code>success_url</Code> — Where to redirect the buyer after payment<br />
          <Code>metadata</Code> — Arbitrary JSON object for your records
        </div>
        <Paragraph>
          Each link gets a unique slug. The public URL is <Code>https://cipherpay.app/link/&#123;slug&#125;</Code>.
          When a buyer visits, a fresh invoice is created automatically. The link tracks how many invoices it has generated
          via <Code>total_created</Code>.
        </Paragraph>
      </Expandable>

      <SectionDivider />

      <SectionTitle>Rate limiting</SectionTitle>
      <Paragraph>
        The API is rate-limited to prevent abuse. If you exceed the limit, the server responds with
        <Code> 429 Too Many Requests</Code>. Wait a moment and retry. Authentication endpoints (registration, login) have
        stricter limits than general API calls.
      </Paragraph>
    </>
  );
}
