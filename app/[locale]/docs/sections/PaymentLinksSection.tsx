'use client';

import { Code, CodeBlock, Callout, SectionDivider, Paragraph, SectionTitle, Strong, Step, Expandable } from '../components/DocComponents';

export default function PaymentLinksSection() {
  return (
    <>
      <Paragraph>
        Payment links let you create reusable checkout URLs tied to a product and price.
        Share the link anywhere — email, social media, QR code — and buyers pay with one click.
        No integration required.
      </Paragraph>

      <Callout type="info">
        Payment links are different from invoices. An invoice is a one-time payment request.
        A payment link creates a <Strong>new invoice each time</Strong> someone opens it.
      </Callout>

      <SectionDivider />

      <SectionTitle>Create a payment link</SectionTitle>

      <Step n={1} title="From the dashboard">
        <Paragraph>
          Go to <Strong>Dashboard &rarr; Links</Strong>. Click <Strong>+ New Link</Strong>.
          Select a product and price, give it a name and optional slug, and save.
          You get a shareable URL like <Code>cipherpay.app/c/my-product</Code>.
        </Paragraph>
      </Step>

      <Step n={2} title="Via API">
        <Paragraph>
          Create a payment link programmatically:
        </Paragraph>
        <CodeBlock lang="bash" code={`curl -X POST https://api.cipherpay.app/api/payment-links \\
  -H "Authorization: Bearer cpay_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Premium Plan",
    "slug": "premium",
    "price_id": "cprice_a1b2c3...",
    "success_url": "https://mysite.com/thanks"
  }'`} />
        <Paragraph>
          The response includes the link&apos;s <Code>id</Code>, <Code>slug</Code>, and
          the full <Code>checkout_url</Code>.
        </Paragraph>
      </Step>

      <SectionDivider />

      <SectionTitle>How it works</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.4, marginBottom: 16 }}>
        1. Buyer opens your payment link<br />
        2. A new invoice is created at the current exchange rate<br />
        3. Buyer pays via the standard CipherPay checkout (QR code, wallet link, or Zipher CLI)<br />
        4. Your webhook fires with <Code>invoice.confirmed</Code><br />
        5. If <Code>success_url</Code> is set, the buyer is redirected after confirmation
      </div>

      <SectionDivider />

      <SectionTitle>API reference</SectionTitle>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>METHOD</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>PATH</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            {[
              { m: 'POST', p: '/api/payment-links', d: 'Create a payment link' },
              { m: 'GET', p: '/api/payment-links', d: 'List your payment links' },
              { m: 'PATCH', p: '/api/payment-links/{id}', d: 'Update name, slug, success_url, or status' },
              { m: 'DELETE', p: '/api/payment-links/{id}', d: 'Delete a payment link' },
              { m: 'POST', p: '/api/payment-links/{slug}/checkout', d: 'Create invoice from link (public)' },
              { m: 'GET', p: '/api/payment-links/{slug}/info', d: 'Get link info (public, rate-limited)' },
            ].map(r => (
              <tr key={r.p + r.m} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                <td style={{ padding: '8px 12px' }}><Code>{r.m}</Code></td>
                <td style={{ padding: '8px 12px' }}><Code>{r.p}</Code></td>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{r.d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Expandable title="Payment link vs. buy link">
        <Paragraph>
          <Strong>Payment links</Strong> are reusable, managed from the dashboard, and support <Code>success_url</Code>.
          They live at <Code>/c/&#123;slug&#125;</Code>.
        </Paragraph>
        <Paragraph>
          <Strong>Buy links</Strong> use the product page at <Code>/buy/&#123;slug&#125;</Code>.
          They show the full product page with description, image, and price selection.
          Both ultimately create invoices and route through the same checkout flow.
        </Paragraph>
      </Expandable>
    </>
  );
}
