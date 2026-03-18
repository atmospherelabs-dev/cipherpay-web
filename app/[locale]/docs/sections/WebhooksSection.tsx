'use client';

import { Code, CodeBlock, Step, Callout, SectionDivider, Paragraph, SectionTitle, Strong, Expandable } from '../components/DocComponents';

export default function WebhooksSection() {
  return (
    <>
      <Paragraph>
        Webhooks let your server react to payment events automatically.
        When a payment status changes (detected, confirmed, expired), CipherPay sends an HTTP POST request
        to a URL you specify. This is how you automate order fulfillment — exactly like Stripe or PayPal webhooks.
      </Paragraph>

      <SectionTitle>Setting up webhooks</SectionTitle>
      <Step n={1} title="Configure your webhook URL">
        <Paragraph>
          In your CipherPay dashboard → Settings, enter the URL where you want to receive webhook notifications.
          For example: <Code>https://mystore.com/api/cipherpay-webhook</Code>
        </Paragraph>
        <Paragraph>
          This must be a publicly accessible HTTPS URL (HTTP is allowed on testnet for development).
          CipherPay will POST to this URL whenever an invoice status changes.
        </Paragraph>
      </Step>

      <Step n={2} title="Copy your webhook secret">
        <Paragraph>
          In the same settings page, you&apos;ll see a <Strong>Webhook Secret</Strong> (starts with <Code>whsec_</Code>).
          Copy this — you&apos;ll need it to verify that incoming webhooks are really from CipherPay and not an attacker.
        </Paragraph>
        <Callout type="warning">
          Always verify webhook signatures. Without verification, anyone could send fake webhook requests to your server
          and trigger unauthorized order fulfillment.
        </Callout>
      </Step>

      <SectionDivider />

      <SectionTitle>Webhook events</SectionTitle>
      <Paragraph>
        CipherPay sends the following events:
      </Paragraph>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>EVENT</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>WHEN IT FIRES</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>RECOMMENDED ACTION</th>
            </tr>
          </thead>
          <tbody>
            {[
              { event: 'detected', when: 'Payment found in the Zcash mempool (unconfirmed)', action: 'Show "payment received" to the user. Do not ship yet.' },
              { event: 'confirmed', when: 'Payment confirmed in a mined block', action: 'Fulfill the order. This is the safe event to act on.' },
              { event: 'underpaid', when: 'Buyer sent less ZEC than required', action: 'Contact the buyer or wait for the remaining amount.' },
              { event: 'expired', when: 'Invoice expired without (full) payment', action: 'Cancel the order or create a new invoice.' },
              { event: 'invoice.created', when: 'Draft invoice generated for a subscription renewal (T-3 days before due date)', action: 'Email the customer the payment link.' },
              { event: 'subscription.renewed', when: 'Subscription period advanced after confirmed payment', action: 'Update the customer\'s access.' },
              { event: 'subscription.past_due', when: 'Billing period ended without confirmed payment', action: 'Notify customer, suspend access if desired.' },
              { event: 'subscription.canceled', when: 'Subscription canceled (by API or end-of-period)', action: 'Revoke access, send cancellation confirmation.' },
            ].map(row => (
              <tr key={row.event} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                <td style={{ padding: '8px 12px' }}><Code>{row.event}</Code></td>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.when}</td>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout type="warning">
        <Strong>Only fulfill orders on the <Code>confirmed</Code> event.</Strong> The <Code>detected</Code> event fires when a payment
        is seen in the mempool but not yet confirmed. While double-spends on Zcash are very rare, for security you should wait
        for block confirmation before shipping goods or granting access.
      </Callout>

      <SectionDivider />

      <SectionTitle>Webhook payload</SectionTitle>
      <Paragraph>
        Every webhook is a JSON POST request with these headers and body:
      </Paragraph>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
        <Strong>Headers:</Strong><br />
        <Code>Content-Type: application/json</Code><br />
        <Code>X-CipherPay-Signature</Code> — HMAC-SHA256 signature for verification<br />
        <Code>X-CipherPay-Timestamp</Code> — ISO 8601 timestamp of when the webhook was sent
      </div>

      <div style={{ fontSize: 11, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8 }}>Payment event payload</div>
      <CodeBlock lang="json" code={`{
  "event": "confirmed",
  "invoice_id": "a1b2c3d4-...",
  "txid": "17d8dd4df713a677d2f6637c2b449e71...",
  "timestamp": "2026-02-21T18:30:00Z",
  "price_zec": 0.14285714,
  "received_zec": 0.14285714,
  "overpaid": false
}`} />
      <Paragraph>
        The <Code>price_zec</Code> and <Code>received_zec</Code> fields are included
        on <Code>detected</Code>, <Code>underpaid</Code>, and <Code>confirmed</Code> events.
        Use <Code>overpaid</Code> to detect when a buyer sent more ZEC than required.
      </Paragraph>

      <div style={{ fontSize: 11, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Subscription event payload</div>
      <CodeBlock lang="json" code={`{
  "event": "invoice.created",
  "invoice_id": "inv_9f8e7d6c-...",
  "subscription_id": "sub_a1b2c3d4-...",
  "amount": 10.00,
  "currency": "EUR",
  "hosted_invoice_url": "https://cipherpay.app/pay/inv_9f8e7d6c-...",
  "due_date": "2026-03-15T00:00:00Z",
  "timestamp": "2026-03-12T00:00:00Z"
}`} />
      <Callout type="tip">
        Use the <Code>hosted_invoice_url</Code> from <Code>invoice.created</Code> webhooks to send your customers a payment link
        via email, Discord, or any notification channel. The customer clicks the link, locks the ZEC rate, and pays.
      </Callout>

      <SectionDivider />

      <SectionTitle>Verifying webhook signatures</SectionTitle>
      <Paragraph>
        To verify that a webhook is genuinely from CipherPay, compute the HMAC-SHA256 of the timestamp + payload
        using your webhook secret, and compare it to the signature header. Also check that the timestamp is recent
        (within 5 minutes) to prevent replay attacks.
      </Paragraph>

      <div style={{ fontSize: 11, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8 }}>Node.js / Express</div>
      <CodeBlock lang="javascript" code={`const crypto = require('crypto');

function verifyWebhook(req, webhookSecret) {
  const signature = req.headers['x-cipherpay-signature'];
  const timestamp = req.headers['x-cipherpay-timestamp'];
  const body = JSON.stringify(req.body);

  // Reject if timestamp is older than 5 minutes
  const age = Date.now() - new Date(timestamp).getTime();
  if (age > 5 * 60 * 1000) return false;

  // Compute expected signature
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(timestamp + '.' + body)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature), Buffer.from(expected)
  );
}`} />

      <div style={{ fontSize: 11, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Python / Flask</div>
      <CodeBlock lang="python" code={`import hmac, hashlib
from datetime import datetime, timezone

def verify_webhook(headers, body, webhook_secret):
    signature = headers.get('X-CipherPay-Signature')
    timestamp = headers.get('X-CipherPay-Timestamp')

    # Reject if older than 5 minutes
    ts = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    age = (datetime.now(timezone.utc) - ts).total_seconds()
    if age > 300:
        return False

    # Compute expected signature
    expected = hmac.new(
        webhook_secret.encode(),
        f"{timestamp}.{body}".encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected)`} />

      <SectionDivider />

      <Expandable title="Retry behavior">
        <Paragraph>
          If your endpoint returns a non-2xx status code, CipherPay retries the webhook with exponential backoff.
          Make sure your endpoint is idempotent — it may receive the same event more than once.
        </Paragraph>
        <Callout type="tip">
          A common pattern: store the <Code>invoice_id</Code> in your database when you receive a webhook.
          Before processing, check if you&apos;ve already handled that invoice. This prevents duplicate fulfillment.
        </Callout>
      </Expandable>
    </>
  );
}
