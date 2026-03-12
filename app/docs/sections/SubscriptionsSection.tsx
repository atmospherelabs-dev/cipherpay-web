'use client';

import { Code, CodeBlock, Step, Callout, SectionDivider, Paragraph, SectionTitle, Strong, Expandable } from '../components/DocComponents';

export default function SubscriptionsSection() {
  return (
    <>
      <Paragraph>
        CipherPay supports recurring payments through a subscription engine designed for non-custodial, push-based
        cryptocurrency. Unlike traditional payment processors that can pull money from a card on file, Zcash requires
        the customer to actively send each payment. CipherPay bridges this gap with a &quot;dynamic invoice&quot; pattern
        that keeps the experience seamless for both merchants and customers.
      </Paragraph>

      <Callout type="info">
        Subscriptions require a <Strong>recurring price</Strong> — a price with <Code>price_type: &quot;recurring&quot;</Code>,
        a <Code>billing_interval</Code>, and an <Code>interval_count</Code>. Create one via the dashboard or API
        before setting up subscriptions.
      </Callout>

      <SectionTitle>How recurring payments work</SectionTitle>
      <Paragraph>
        The subscription lifecycle is fully automated via a background engine that runs hourly:
      </Paragraph>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { n: '1', label: 'Cron generates draft', sub: 'T-3 days before due date' },
          { n: '2', label: 'Webhook fires', sub: 'invoice.created event' },
          { n: '3', label: 'Merchant notifies', sub: 'Email / Discord / SMS' },
          { n: '4', label: 'Customer opens link', sub: 'Clicks "Lock Rate & Pay"' },
          { n: '5', label: 'ZEC rate locked', sub: '15-minute payment window' },
          { n: '6', label: 'Payment confirmed', sub: 'Period advances instantly' },
        ].map(s => (
          <div key={s.n} style={{ textAlign: 'center', padding: '14px 10px', background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cp-cyan)', marginBottom: 4 }}>{s.n}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cp-text)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <Paragraph>
        The key insight is that <Strong>the ZEC exchange rate is not locked when the invoice is created</Strong>.
        Instead, it&apos;s locked when the customer explicitly clicks &quot;Lock Rate &amp; Pay&quot; on the checkout page.
        This eliminates volatility risk — the customer always pays the fair market rate at the moment they&apos;re ready.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>Creating a subscription</SectionTitle>
      <Step n={1} title="Create a recurring price">
        <Paragraph>
          First, create a product with a recurring price in your dashboard or via the API.
          Set the payment type to <Strong>Recurring</Strong> and choose a billing interval.
        </Paragraph>
        <CodeBlock lang="bash" code={`# Create a product with a monthly recurring price
curl -X POST https://api.cipherpay.app/api/products \\
  -H "Authorization: Bearer cpay_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Pro Plan",
    "slug": "pro-plan",
    "amount": 10.00,
    "currency": "EUR",
    "payment_type": "recurring",
    "billing_interval": "month",
    "interval_count": 1
  }'`} />
      </Step>

      <Step n={2} title="Create a subscription">
        <Paragraph>
          Subscribe a customer using the recurring price ID:
        </Paragraph>
        <CodeBlock lang="bash" code={`curl -X POST https://api.cipherpay.app/api/subscriptions \\
  -H "Authorization: Bearer cpay_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "price_id": "cprice_YOUR_RECURRING_PRICE_ID",
    "label": "customer@example.com"
  }'`} />
        <Paragraph>
          The response includes the subscription ID, current period dates, and status.
          The subscription starts <Code>active</Code> immediately.
        </Paragraph>
      </Step>

      <SectionDivider />

      <SectionTitle>Listing subscriptions</SectionTitle>
      <CodeBlock lang="bash" code={`curl https://api.cipherpay.app/api/subscriptions \\
  -H "Authorization: Bearer cpay_sk_YOUR_KEY"`} />
      <Paragraph>
        Returns all your subscriptions with their current status, period dates, and linked invoice.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>Canceling a subscription</SectionTitle>
      <CodeBlock lang="bash" code={`curl -X POST https://api.cipherpay.app/api/subscriptions/{id}/cancel \\
  -H "Authorization: Bearer cpay_sk_YOUR_KEY"`} />
      <Paragraph>
        The subscription is marked <Code>cancel_at_period_end</Code>. It remains active until the current billing
        period ends, then transitions to <Code>canceled</Code>. A <Code>subscription.canceled</Code> webhook fires
        when the cancellation takes effect.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>Invoice finalization</SectionTitle>
      <Paragraph>
        Draft invoices generated by the subscription engine don&apos;t have a ZEC price or payment timer yet.
        When a customer opens the payment link and clicks <Strong>&quot;Lock Rate &amp; Pay&quot;</Strong>, the frontend
        calls the finalize endpoint:
      </Paragraph>
      <CodeBlock lang="bash" code={`POST /api/invoices/{id}/finalize`} />
      <Paragraph>
        This is a <Strong>public endpoint</Strong> (no authentication required) that:
      </Paragraph>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 16 }}>
        1. Fetches the current ZEC exchange rate<br />
        2. Calculates the exact ZEC amount from the fiat price<br />
        3. Generates a payment address and QR code<br />
        4. Sets a <Strong>15-minute</Strong> payment window<br />
        5. Returns the finalized invoice with all payment details
      </div>

      <Expandable title="Re-finalization of expired invoices">
        <Paragraph>
          If the 15-minute window expires before the customer pays, the invoice status changes to <Code>expired</Code>.
          The customer can click &quot;Lock Rate &amp; Pay&quot; again to re-finalize — this fetches a fresh ZEC rate
          and starts a new 15-minute timer. The payment URL stays the same.
        </Paragraph>
        <Callout type="warning">
          <Strong>In-flight payment guard:</Strong> Before re-finalizing, the endpoint checks if a payment is already
          pending (detected in the mempool but not yet confirmed). If so, re-finalization is blocked and the customer
          sees &quot;Payment detected, waiting for network confirmation.&quot; This prevents the exchange rate from changing
          while a transaction is in-flight.
        </Callout>
      </Expandable>

      <Expandable title="Period guard">
        <Paragraph>
          Re-finalization is only allowed while the subscription&apos;s billing period is still active.
          Once <Code>current_period_end</Code> passes without payment, the subscription transitions to <Code>past_due</Code>
          and the draft invoice is permanently expired. The merchant retains control — they can manually create a
          new billing cycle or cancel the subscription.
        </Paragraph>
      </Expandable>

      <SectionDivider />

      <SectionTitle>Lifecycle states</SectionTitle>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>STATUS</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>MEANING</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>TRANSITIONS TO</th>
            </tr>
          </thead>
          <tbody>
            {[
              { status: 'active', meaning: 'Subscription is current. The customer has paid for this period.', transitions: 'past_due, canceled' },
              { status: 'past_due', meaning: 'Billing period ended without confirmed payment. Service may be suspended.', transitions: 'active (if paid), canceled' },
              { status: 'canceled', meaning: 'Subscription has been permanently canceled. No further invoices will be generated.', transitions: '—' },
            ].map(row => (
              <tr key={row.status} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                <td style={{ padding: '8px 12px' }}><Code>{row.status}</Code></td>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.meaning}</td>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.transitions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionDivider />

      <SectionTitle>Webhook events</SectionTitle>
      <Paragraph>
        The subscription engine fires these webhook events throughout the lifecycle.
        See the <Strong>Webhooks</Strong> section for payload format and signature verification.
      </Paragraph>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 16 }}>
        <Code>invoice.created</Code> — Draft invoice generated T-3 days before due date. Use the <Code>hosted_invoice_url</Code> to notify the customer.<br />
        <Code>subscription.renewed</Code> — Payment confirmed, period advanced. Update the customer&apos;s access.<br />
        <Code>subscription.past_due</Code> — Period ended without payment. Consider suspending access.<br />
        <Code>subscription.canceled</Code> — Subscription permanently canceled. Revoke access.
      </div>

      <Callout type="tip">
        CipherPay handles the billing math and blockchain detection. You handle the customer communication.
        When you receive an <Code>invoice.created</Code> webhook, grab the <Code>hosted_invoice_url</Code> and send it
        to your customer however you prefer — email, Discord bot, SMS, push notification.
      </Callout>
    </>
  );
}
