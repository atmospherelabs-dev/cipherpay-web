'use client';

import { Code, CodeBlock, Step, Callout, SectionDivider, Paragraph, SectionTitle, Strong, Expandable } from '../components/DocComponents';

export default function CustomSection() {
  return (
    <>
      <Paragraph>
        This guide shows you how to integrate CipherPay into any website or application using the REST API.
        The flow mirrors what you&apos;d do with Stripe: your backend creates an invoice, your frontend redirects the buyer
        to a hosted checkout page, and your backend receives a webhook when payment is confirmed.
      </Paragraph>

      <Callout type="info">
        This guide assumes you have a CipherPay account and an API key.
        If not, follow the <Strong>Quickstart</Strong> first.
      </Callout>

      <SectionTitle>The payment flow</SectionTitle>
      <Paragraph>
        Here is the complete flow in code. We&apos;ll go through each step in detail below.
      </Paragraph>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 20 }}>
        1. <Strong>Your backend</Strong> calls <Code>POST /api/invoices</Code> with the price and product info<br />
        2. CipherPay returns an <Code>invoice_id</Code> and a payment address<br />
        3. <Strong>Your frontend</Strong> redirects the buyer to <Code>cipherpay.app/pay/&#123;invoice_id&#125;</Code><br />
        4. The buyer pays on the hosted checkout page<br />
        5. CipherPay detects the payment and sends a <Strong>webhook</Strong> to your server<br />
        6. <Strong>Your backend</Strong> verifies the webhook signature and fulfills the order
      </div>

      <SectionDivider />

      <Step n={1} title="Create an invoice (server-side)">
        <Paragraph>
          When a customer clicks &quot;Pay&quot; on your site, your server creates a CipherPay invoice.
          You send the amount in any supported fiat currency (EUR, USD, GBP, BRL, CAD, AUD, CHF, JPY, CNY, KRW, INR, and more),
          and CipherPay converts it to ZEC at the current exchange rate.
        </Paragraph>
        <CodeBlock lang="bash" code={`curl -X POST https://api.cipherpay.app/api/invoices \\
  -H "Authorization: Bearer cpay_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 65.00,
    "currency": "EUR",
    "product_name": "Privacy Tee",
    "size": "L"
  }'`} />
        <Paragraph>
          Response:
        </Paragraph>
        <CodeBlock lang="json" code={`{
  "invoice_id": "a1b2c3d4-...",
  "memo_code": "CP-3F8A2B1C",
  "price_zec": 0.14285714,
  "payment_address": "u1...",
  "zcash_uri": "zcash:u1...?amount=0.14285714&memo=...",
  "expires_at": "2026-02-22T00:30:00Z"
}`} />
        <Expandable title="Response fields explained">
          <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
            <Code>invoice_id</Code> — Unique identifier. Use this to build the checkout URL and match webhooks to orders.<br />
            <Code>memo_code</Code> — A short code the buyer includes in their transaction memo so CipherPay can match the payment to the invoice.<br />
            <Code>price_zec</Code> — The exact ZEC amount the buyer must pay, calculated from the fiat price at the current exchange rate.<br />
            <Code>payment_address</Code> — A unique Zcash address generated for this invoice. Each invoice gets its own address.<br />
            <Code>zcash_uri</Code> — A <a href="https://zips.z.cash/zip-0321" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>ZIP-321</a> payment URI. Wallets that support it pre-fill the amount, address, and memo automatically.<br />
            <Code>expires_at</Code> — The invoice expires after 30 minutes by default. After that, the exchange rate may have changed.
          </div>
        </Expandable>
      </Step>

      <Step n={2} title="Redirect the buyer to checkout">
        <Paragraph>
          Send the buyer to the hosted checkout page. CipherPay handles the QR code, timer, payment instructions,
          and real-time detection — you don&apos;t need to build any payment UI.
        </Paragraph>
        <CodeBlock lang="javascript" code={`// In your frontend, after creating the invoice:
const invoiceId = response.invoice_id;
window.location.href = \`https://cipherpay.app/pay/\${invoiceId}\`;`} />

        <Expandable title="Customize the checkout page">
          <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.4, marginBottom: 12 }}>
            <Code>return_url</Code> — Where to redirect the buyer after payment is confirmed (URL-encoded).
            The checkout page shows a &quot;Return to store&quot; button after confirmation.<br />
            <Code>theme</Code> — Set to <Code>dark</Code> for a dark checkout page (matches dark-themed stores).
          </div>
          <CodeBlock lang="javascript" code={`const returnUrl = encodeURIComponent('https://mystore.com/order/confirmed');
window.location.href = \`https://cipherpay.app/pay/\${invoiceId}?return_url=\${returnUrl}&theme=dark\`;`} />
        </Expandable>
      </Step>

      <Step n={3} title="Handle the webhook (server-side)">
        <Paragraph>
          When payment is confirmed on the blockchain, CipherPay sends a POST request to the webhook URL
          you configured in your dashboard settings. Your server should:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 16 }}>
          1. Verify the webhook signature (see <Strong>Webhooks</Strong> section)<br />
          2. Check the <Code>event</Code> field — <Code>confirmed</Code> means the payment is final<br />
          3. Match the <Code>invoice_id</Code> to the order in your database<br />
          4. Fulfill the order (update status, send confirmation, ship, etc.)
        </div>
        <Paragraph>
          Example webhook handler in Node.js / Express:
        </Paragraph>
        <CodeBlock lang="javascript" code={`app.post('/api/webhook', express.json(), (req, res) => {
  // 1. Verify the signature (see Webhooks section)
  if (!verifyWebhook(req, process.env.CIPHERPAY_WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  const { event, invoice_id } = req.body;

  // 2. Handle the event
  if (event === 'confirmed') {
    // Payment is confirmed — fulfill the order
    fulfillOrder(invoice_id);
  } else if (event === 'expired') {
    // Invoice expired without payment
    cancelOrder(invoice_id);
  }

  res.status(200).send('OK');
});`} />
      </Step>

      <SectionDivider />

      <Expandable title="Invoice creation fields" defaultOpen={false}>
        <Paragraph>
          Fields you can include when creating an invoice via <Code>POST /api/invoices</Code>:
        </Paragraph>
        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>FIELD</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>REQUIRED</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              {[
                { field: 'amount', req: 'Yes', desc: 'Price in your currency. CipherPay converts to ZEC at the current exchange rate.' },
                { field: 'currency', req: 'No', desc: 'ISO 4217 currency code (e.g. "EUR", "USD", "GBP", "BRL", "CAD", "AUD", "CHF", "JPY", "CNY", "KRW", "INR"). Defaults to "EUR".' },
                { field: 'price_id', req: 'No', desc: 'A Price ID (cprice_...) to use a pre-configured price. Overrides amount/currency.' },
                { field: 'product_name', req: 'No', desc: 'Displayed on the checkout page (e.g. "Premium Plan").' },
                { field: 'size', req: 'No', desc: 'Variant or size label (e.g. "L", "Monthly").' },
                { field: 'shipping_alias', req: 'No', desc: 'Customer name for shipping purposes.' },
                { field: 'shipping_address', req: 'No', desc: 'Full shipping address.' },
                { field: 'shipping_region', req: 'No', desc: 'Country or region code (e.g. "US", "FR").' },
              ].map(row => (
                <tr key={row.field} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                  <td style={{ padding: '8px 12px' }}><Code>{row.field}</Code></td>
                  <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.req}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout type="info">
          Send <Code>amount</Code> with a <Code>currency</Code> code. CipherPay converts to ZEC using a live exchange rate at invoice creation time. The ZEC price is locked for the invoice&apos;s lifetime (30 minutes).
        </Callout>
      </Expandable>

      <SectionDivider />

      <SectionTitle>Check invoice status</SectionTitle>
      <Paragraph>
        Check an invoice&apos;s current status at any time. Individual invoice lookups are public — no API key required.
      </Paragraph>
      <CodeBlock lang="bash" code={`curl https://api.cipherpay.app/api/invoices/{invoice_id}`} />
      <Paragraph>
        The <Code>status</Code> field tells you where the invoice is in its lifecycle:
      </Paragraph>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
        <Code>draft</Code> — Invoice created but not yet finalized (subscription pre-invoices)<br />
        <Code>pending</Code> — Waiting for payment<br />
        <Code>underpaid</Code> — Partial payment received (buyer sent less than required)<br />
        <Code>detected</Code> — Full payment found in the mempool (not yet confirmed in a block)<br />
        <Code>confirmed</Code> — Payment confirmed in a block — safe to fulfill the order<br />
        <Code>expired</Code> — Invoice expired without full payment<br />
        <Code>refunded</Code> — Merchant marked this invoice as refunded
      </div>

      <Expandable title="Real-time updates (SSE)">
        <Paragraph>
          Instead of polling, subscribe to a Server-Sent Events stream for live status updates.
          This is how the hosted checkout page works — it listens to the stream and updates the UI instantly.
        </Paragraph>
        <CodeBlock lang="javascript" code={`const source = new EventSource(
  'https://api.cipherpay.app/api/invoices/{id}/stream'
);

source.addEventListener('status', (e) => {
  const data = JSON.parse(e.data);
  console.log('Status:', data.status);

  if (data.status === 'confirmed') {
    console.log('Payment confirmed! TXID:', data.txid);
    source.close();
  }
  if (data.status === 'expired') {
    console.log('Invoice expired');
    source.close();
  }
});`} />
      </Expandable>
    </>
  );
}
