'use client';

import { Code, CodeBlock, Step, Callout, SectionDivider, Paragraph, SectionTitle, Strong } from '../components/DocComponents';

export default function QuickstartSection() {
  return (
    <>
      <Paragraph>
        This guide takes you from zero to your first payment in about 10 minutes.
        By the end, you&apos;ll have a CipherPay account, an API key, and a working checkout link you can test immediately.
      </Paragraph>

      <Callout type="tip">
        We recommend starting on <Strong>testnet</Strong> so you can make test payments with free testnet ZEC.
        When you&apos;re ready to go live, switch your configuration to mainnet — the code stays the same.
        See the <Strong>Sandbox &amp; Testing</Strong> section for details.
      </Callout>

      <Step n={1} title="Get a Zcash wallet">
        <Paragraph>
          If you don&apos;t have one yet, download a wallet that supports Unified Addresses:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          <Strong>Zashi</Strong> — <a href="https://zashi.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>zashi.app</a> (iOS, Android) — recommended for beginners<br />
          <Strong>YWallet</Strong> — <a href="https://ywallet.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>ywallet.app</a> (iOS, Android, desktop) — more advanced features<br />
          <Strong>Zingo!</Strong> — <a href="https://zingolabs.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>zingolabs.org</a> — developer-friendly, supports testnet<br />
        </div>
        <Paragraph>
          Create a new wallet (or use an existing one). Write down your seed phrase and store it safely — this is the master backup for your funds.
        </Paragraph>
        <Callout type="warning">
          For testnet, make sure your wallet is configured for the Zcash testnet network.
          Zingo! supports testnet natively. For Zashi, you may need the testnet build.
        </Callout>
      </Step>

      <Step n={2} title="Find your UFVK and payment address">
        <Paragraph>
          In your wallet, look for <Strong>Unified Full Viewing Key</Strong> (sometimes called &quot;viewing key&quot; or &quot;UFVK&quot;)
          in the settings or export options. Copy it — you&apos;ll need it in the next step.
        </Paragraph>
        <Paragraph>
          Also copy your <Strong>Unified Address</Strong> — the main receiving address shown in your wallet.
          It starts with <Code>u1...</Code> on mainnet or <Code>utest...</Code> on testnet.
        </Paragraph>
      </Step>

      <Step n={3} title="Create your CipherPay account">
        <Paragraph>
          Go to the <a href="/dashboard/register" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>registration page</a> and fill in:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          <Strong>Store name</Strong> — The name of your business or project<br />
          <Strong>UFVK</Strong> — Paste your Unified Full Viewing Key<br />
          <Strong>Email</Strong> (optional) — For account recovery only, not shared or used for marketing<br />
        </div>
        <Paragraph>
          After registering, you&apos;ll receive your <Strong>API key</Strong> and <Strong>dashboard token</Strong>.
          Save them immediately — they are only shown once. If you lose them, you can regenerate new ones from the dashboard settings.
        </Paragraph>
        <Callout type="warning">
          Your UFVK is locked at registration. It cannot be changed later because it&apos;s cryptographically tied to how CipherPay
          detects your payments. If you need to use a different wallet, register a new merchant account.
        </Callout>
      </Step>

      <Step n={4} title="Create your first invoice">
        <Paragraph>
          You can create invoices in two ways: from the <Strong>dashboard</Strong> (no code needed) or via the <Strong>API</Strong>.
        </Paragraph>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8 }}>Option A: From the dashboard</div>
          <Paragraph>
            Go to your dashboard → Invoices → <Strong>+ Payment Link</Strong>.
            Enter a price, product name, and click create. You&apos;ll get a checkout URL you can send to anyone.
          </Paragraph>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8 }}>Option B: Via the API</div>
          <CodeBlock lang="bash" code={`curl -X POST https://api.cipherpay.app/api/invoices \\
  -H "Authorization: Bearer cpay_sk_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10.00,
    "currency": "EUR",
    "product_name": "Test Product"
  }'`} />
          <Paragraph>
            The response includes an <Code>invoice_id</Code>. Send the buyer to the checkout page:
          </Paragraph>
          <CodeBlock lang="text" code={`https://cipherpay.app/pay/{invoice_id}`} />
        </div>
      </Step>

      <Step n={5} title="Test the payment">
        <Paragraph>
          Open the checkout URL. You&apos;ll see a QR code and a payment address.
          Scan it with your Zcash wallet and send the exact amount shown.
        </Paragraph>
        <Paragraph>
          Within seconds, the checkout page will update to <Strong>&quot;Payment detected&quot;</Strong>.
          After one block confirmation (~75 seconds), it changes to <Strong>&quot;Confirmed&quot;</Strong>.
          That&apos;s it — your first ZEC payment is complete.
        </Paragraph>
      </Step>

      <Step n={6} title="Set up webhooks (for automated order fulfillment)">
        <Paragraph>
          If you want your server to be notified automatically when a payment is confirmed, set up a webhook.
          Go to Dashboard → Settings and enter your webhook URL (e.g., <Code>https://mystore.com/api/webhook</Code>).
        </Paragraph>
        <Paragraph>
          CipherPay will send a POST request to this URL whenever an invoice status changes.
          See the <Strong>Webhooks</Strong> section for the full payload format and signature verification.
        </Paragraph>
      </Step>

      <SectionDivider />

      <SectionTitle>What&apos;s next?</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2 }}>
        <span style={{ color: 'var(--cp-cyan)' }}>→</span> Read <Strong>Sandbox &amp; Testing</Strong> to learn how to use testnet for risk-free testing<br />
        <span style={{ color: 'var(--cp-cyan)' }}>→</span> Read <Strong>Shopify</Strong> if you have a Shopify store<br />
        <span style={{ color: 'var(--cp-cyan)' }}>→</span> Read <Strong>WooCommerce</Strong> if you have a WordPress store<br />
        <span style={{ color: 'var(--cp-cyan)' }}>→</span> Read <Strong>Custom Integration</Strong> for a full API walkthrough<br />
        <span style={{ color: 'var(--cp-cyan)' }}>→</span> Read <Strong>Webhooks</Strong> to automate order fulfillment
      </div>
    </>
  );
}
