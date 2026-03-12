'use client';

import { Code, CodeBlock, Step, Callout, Paragraph, SectionTitle, Strong } from '../components/DocComponents';

export default function ProductsSection() {
  return (
    <>
      <Paragraph>
        This is the fastest way to sell with Zcash. You don&apos;t need a website, a server, or any code.
        Create a product in your CipherPay dashboard, and you get a hosted checkout link you can share anywhere —
        on social media, in an email, on a physical flyer with a QR code, or embedded on an existing site.
      </Paragraph>

      <Callout type="info">
        Think of this like a &quot;Buy Now&quot; button that works everywhere. CipherPay hosts the product page and handles the entire checkout.
      </Callout>

      <SectionTitle>When to use this</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 20 }}>
        • You sell a few items (merch, digital goods, event tickets)<br />
        • You don&apos;t have a website or don&apos;t want to integrate an API<br />
        • You want to share a &quot;Pay with Zcash&quot; link on Twitter, Discord, Telegram, etc.<br />
        • You want a simple storefront without building one
      </div>

      <SectionTitle>How products work</SectionTitle>
      <Paragraph>
        Each product has a <Code>default_price_id</Code> that links it to a price entity. Products can be
        configured as <Strong>one-time</Strong> (single payment) or <Strong>recurring</Strong> (subscription).
        You can add multiple prices in different currencies to the same product — buyers choose their preferred
        currency at checkout.
      </Paragraph>
      <Paragraph>
        Prices have a <Code>price_type</Code> field (<Code>one_time</Code> or <Code>recurring</Code>).
        Recurring prices also include <Code>billing_interval</Code> (<Code>day</Code>, <Code>week</Code>, <Code>month</Code>, <Code>year</Code>)
        and <Code>interval_count</Code> (e.g., 2 with <Code>month</Code> means every 2 months).
      </Paragraph>

      <Step n={1} title="Add a product in the dashboard">
        <Paragraph>
          Go to your dashboard → Products → <Strong>+ Add Product</Strong>.
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          <Strong>Name</Strong> — The product name (e.g. &quot;[REDACTED] Tee&quot;)<br />
          <Strong>Payment type</Strong> — Choose <Strong>One-time</Strong> for single payments or <Strong>Recurring</Strong> for subscriptions<br />
          <Strong>Price</Strong> — Price in any supported currency (EUR, USD, GBP, BRL, CAD, AUD, CHF, JPY, CNY, KRW, INR, and more). CipherPay converts to ZEC at checkout time.<br />
          <Strong>Variants</Strong> (optional) — Sizes or options (e.g. S, M, L, XL). Buyers will choose one at checkout.
        </div>
        <Paragraph>
          When you create a product, CipherPay automatically generates a <Strong>Price</Strong> with a stable ID
          (e.g. <Code>cprice_a1b2c3...</Code>). This becomes the product&apos;s <Code>default_price_id</Code>.
          You can add more prices in different currencies for the same product.
        </Paragraph>
      </Step>

      <Step n={2} title="Copy your IDs">
        <Paragraph>
          Each product card in your dashboard shows copyable IDs for integration:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          <Strong>Product ID</Strong> — Used to link to the buy page or create checkouts.<br />
          <Strong>Price ID</Strong> (<Code>cprice_...</Code>) — Stable identifier for a specific price. Use this in API calls
          to create invoices at a fixed currency and amount.
        </div>
      </Step>

      <Step n={3} title="Share the checkout link">
        <Paragraph>
          Each product gets a permanent hosted page. Copy the link from your dashboard:
        </Paragraph>
        <CodeBlock lang="text" code={`https://cipherpay.app/buy/{product_id}`} />
        <Paragraph>
          Or create an invoice via the API using a price ID:
        </Paragraph>
        <CodeBlock lang="bash" code={`curl -X POST https://api.cipherpay.app/api/checkout \\
  -H "Content-Type: application/json" \\
  -d '{"price_id": "cprice_YOUR_PRICE_ID"}'`} />
        <Paragraph>
          Add the buy link to your website as a button:
        </Paragraph>
        <CodeBlock lang="html" code={`<a href="https://cipherpay.app/buy/YOUR_PRODUCT_ID"
   style="background:#06b6d4;color:#fff;padding:12px 24px;
          border-radius:4px;text-decoration:none;font-weight:600">
  Pay with Zcash
</a>`} />
        <Paragraph>
          When a buyer clicks the link, they see the product details, select a variant (if any), and proceed to the payment page.
          The price is set server-side — buyers cannot tamper with it.
        </Paragraph>
      </Step>

      <Step n={4} title="Track payments">
        <Paragraph>
          All invoices appear in your dashboard → Invoices tab with real-time status.
          If you set up webhooks, your server gets notified automatically when a payment is confirmed.
        </Paragraph>
      </Step>

      <Callout type="tip">
        Combine this with the <Strong>In-Person POS</Strong> mode: create your products once, then use the dashboard at events to create invoices on the fly.
      </Callout>
    </>
  );
}
