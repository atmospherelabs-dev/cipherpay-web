'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { NavLinks } from '@/components/NavLinks';
import { CopyButton } from '@/components/CopyButton';

type Section = {
  id: string;
  title: string;
  content: React.ReactNode;
};

function Code({ children }: { children: string }) {
  return <code style={{ color: 'var(--cp-cyan)', fontSize: 'inherit' }}>{children}</code>;
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}>
        <CopyButton text={code} label="" />
      </div>
      <pre style={{
        background: 'var(--cp-bg)',
        border: '1px solid var(--cp-border)',
        borderRadius: 4,
        padding: '14px 16px',
        fontSize: 11,
        lineHeight: 1.6,
        overflowX: 'auto',
        color: 'var(--cp-text)',
        fontFamily: 'var(--font-geist-mono), monospace',
      }}>
        <code>{code}</code>
      </pre>
      <div style={{ fontSize: 9, color: 'var(--cp-text-dim)', marginTop: -12, marginBottom: 8, textAlign: 'right', paddingRight: 4 }}>
        {lang}
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{
          width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, background: 'rgba(6,182,212,0.15)', color: 'var(--cp-cyan)', border: '1px solid rgba(6,182,212,0.3)',
        }}>{n}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cp-text)' }}>{title}</span>
      </div>
      <div style={{ paddingLeft: 34 }}>{children}</div>
    </div>
  );
}

function Callout({ type, children }: { type: 'info' | 'tip' | 'warning'; children: React.ReactNode }) {
  const colors = type === 'tip'
    ? { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', label: 'TIP', labelColor: 'var(--cp-green)' }
    : type === 'warning'
    ? { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', label: 'IMPORTANT', labelColor: '#f59e0b' }
    : { bg: 'rgba(6,182,212,0.06)', border: 'rgba(6,182,212,0.15)', label: 'NOTE', labelColor: 'var(--cp-cyan)' };
  return (
    <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 1.8, marginBottom: 20, padding: '10px 14px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 4 }}>
      <strong style={{ color: colors.labelColor, fontSize: 9, letterSpacing: 1 }}>{colors.label}</strong>
      <div style={{ marginTop: 4 }}>{children}</div>
    </div>
  );
}

function SectionDivider() {
  return <div style={{ borderBottom: '1px solid var(--cp-border)', margin: '28px 0' }} />;
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 1.9, marginBottom: 16 }}>{children}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="section-title" style={{ marginBottom: 12 }}>{children}</div>;
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: 'var(--cp-text)' }}>{children}</strong>;
}

function SidebarGroup({ label }: { label: string }) {
  return (
    <div style={{
      padding: '14px 16px 6px',
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: 1.5,
      color: 'var(--cp-text-muted)',
    }}>
      {label}
    </div>
  );
}

function Expandable({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16, border: '1px solid var(--cp-border)', borderRadius: 4, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '10px 14px', fontSize: 11, fontWeight: 600,
          color: 'var(--cp-text)', background: 'var(--cp-bg)', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {title}
        <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', fontSize: 10, color: 'var(--cp-text-muted)' }}>▶</span>
      </button>
      {open && <div style={{ padding: '2px 14px 14px' }}>{children}</div>}
    </div>
  );
}

const USE_CASES = [
  { title: 'WooCommerce store', bestFor: 'WordPress merchants — install a plugin, no code', time: '~10 min', link: 'woocommerce' },
  { title: 'Custom website or app', bestFor: 'Developers integrating via REST API', time: '~30 min', link: 'custom' },
  { title: 'Product pages (no-code)', bestFor: 'Sell a few items — create a product, share a link', time: '~5 min', link: 'products' },
  { title: 'In-person POS', bestFor: 'Events, pop-ups, physical stores — phone or tablet', time: '~5 min', link: 'pos' },
];

const SIDEBAR_GROUPS = [
  { label: 'Getting Started', ids: ['overview', 'quickstart', 'sandbox'] },
  { label: 'Guides', ids: ['custom', 'woocommerce', 'products', 'pos'] },
  { label: 'Reference', ids: ['webhooks', 'billing', 'api-ref'] },
];

function OverviewContent({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <>
      <SectionTitle>What is CipherPay?</SectionTitle>
      <Paragraph>
        CipherPay is a payment gateway for <Strong>Zcash (ZEC)</Strong> — the privacy-focused cryptocurrency.
        It lets any website, app, or physical store accept ZEC payments the same way they would use Stripe or PayPal,
        except there is no intermediary holding your money.
      </Paragraph>
      <Paragraph>
        When a customer pays, the ZEC goes <Strong>directly to your wallet</Strong>. CipherPay never touches your funds.
        It watches for incoming payments using your <Strong>viewing key</Strong> (a read-only key that can see payments but cannot spend them),
        and notifies your server when a payment arrives.
      </Paragraph>
      <Paragraph>
        All payments are <Strong>shielded</Strong> — meaning the amount, sender, and recipient are encrypted on-chain.
        Nobody can see who paid whom or how much, except you and your customer.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>How it works</SectionTitle>
      <Paragraph>
        The payment flow is the same whether you use the API, WooCommerce, or product links.
        Here is what happens behind the scenes:
      </Paragraph>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { n: '1', label: 'You create an invoice', sub: 'Via API, dashboard, or plugin' },
          { n: '2', label: 'Buyer scans & pays', sub: 'Hosted checkout with QR code' },
          { n: '3', label: 'CipherPay detects it', sub: 'Mempool + block scanning' },
          { n: '4', label: 'You get notified', sub: 'Webhook + dashboard update' },
        ].map(s => (
          <div key={s.n} style={{ textAlign: 'center', padding: '14px 10px', background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cp-cyan)', marginBottom: 4 }}>{s.n}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cp-text)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <Paragraph>
        <Strong>Step 1:</Strong> When a customer is ready to pay, you (or your plugin) call the CipherPay API with the price.
        CipherPay converts it to ZEC at the current exchange rate, generates a unique payment address, and returns a checkout URL.
      </Paragraph>
      <Paragraph>
        <Strong>Step 2:</Strong> The customer is redirected to a hosted checkout page. They see a QR code and a payment address.
        They scan it with their Zcash wallet (like Zashi or YWallet), and the transaction is sent.
      </Paragraph>
      <Paragraph>
        <Strong>Step 3:</Strong> CipherPay continuously monitors the Zcash network. When the transaction appears in the mempool
        (usually within 5-10 seconds), the checkout page updates to &quot;Payment detected.&quot;
        When it gets confirmed in a block (~75 seconds), the status changes to &quot;Confirmed.&quot;
      </Paragraph>
      <Paragraph>
        <Strong>Step 4:</Strong> CipherPay sends a webhook (an HTTP POST request) to your server, telling you the payment is confirmed.
        You use this to fulfill the order — update the order status, send a confirmation, ship the product, etc.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>Choose your integration</SectionTitle>
      <Paragraph>
        Pick the path that matches your setup. Each guide walks you through end-to-end, from account creation to your first real payment.
      </Paragraph>

      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10, letterSpacing: 0.5 }}>USE CASE</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10, letterSpacing: 0.5 }}>BEST FOR</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10, letterSpacing: 0.5 }}>TIME</th>
            </tr>
          </thead>
          <tbody>
            {USE_CASES.map(uc => (
              <tr key={uc.link} style={{ borderBottom: '1px solid var(--cp-border)', cursor: 'pointer' }} onClick={() => onNavigate(uc.link)}>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ color: 'var(--cp-cyan)', fontWeight: 600, cursor: 'pointer' }}>{uc.title}</span>
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--cp-text-dim)' }}>{uc.bestFor}</td>
                <td style={{ padding: '10px 12px', color: 'var(--cp-text-dim)', textAlign: 'right', whiteSpace: 'nowrap' }}>{uc.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="info">
        Want to see a live store built on CipherPay? Check out <a href="https://0x00.store" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>0x00.store</a> — a fully functional shop with checkout, webhooks, and order management.
      </Callout>

      <SectionDivider />

      <SectionTitle>Before you start</SectionTitle>
      <Paragraph>
        You need three things before you can accept payments. The setup takes about 5 minutes.
      </Paragraph>

      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.4 }}>
        <div style={{ marginBottom: 8 }}>
          <Strong>1. A Zcash wallet</Strong><br />
          <span style={{ paddingLeft: 16, display: 'inline-block' }}>
            Download <a href="https://zashi.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>Zashi</a> (mobile) or <a href="https://ywallet.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>YWallet</a> (desktop &amp; mobile).
            This is where your payments will arrive. You control the private keys — CipherPay never has access to them.
          </span>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Strong>2. Your Unified Full Viewing Key (UFVK)</Strong><br />
          <span style={{ paddingLeft: 16, display: 'inline-block' }}>
            This is a <em>read-only</em> key that lets CipherPay see incoming payments to your wallet, without being able to spend them.
            You can find it in your wallet&apos;s settings or advanced options. It starts with <Code>uview</Code> (mainnet) or <Code>uviewtest</Code> (testnet).
          </span>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Strong>3. Your payment address</Strong><br />
          <span style={{ paddingLeft: 16, display: 'inline-block' }}>
            A Unified Address (starts with <Code>u1...</Code>) from your wallet. This is what customers pay to.
            CipherPay derives unique sub-addresses from your UFVK for each invoice, so every payment gets its own address.
          </span>
        </div>
      </div>

      <Callout type="tip">
        Not sure what a UFVK is? Think of it like a bank giving read-only access to your statement.
        Someone with your UFVK can see incoming payments, but they <em>cannot</em> move your money. It&apos;s safe to share with CipherPay.
      </Callout>
    </>
  );
}

const sections: Section[] = [
  {
    id: 'overview',
    title: 'Overview',
    content: null,
  },
  {
    id: 'quickstart',
    title: 'Quickstart',
    content: (
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
    "price_eur": 10.00,
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
          <span style={{ color: 'var(--cp-cyan)' }}>→</span> Read <Strong>Custom Integration</Strong> for a full API walkthrough<br />
          <span style={{ color: 'var(--cp-cyan)' }}>→</span> Read <Strong>WooCommerce</Strong> if you have a WordPress store<br />
          <span style={{ color: 'var(--cp-cyan)' }}>→</span> Read <Strong>Webhooks</Strong> to automate order fulfillment
        </div>
      </>
    ),
  },
  {
    id: 'sandbox',
    title: 'Sandbox & Testing',
    content: (
      <>
        <Paragraph>
          CipherPay has two environments: <Strong>testnet</Strong> (sandbox) and <Strong>mainnet</Strong> (production).
          This works similarly to Stripe&apos;s test mode — you develop and test on testnet with fake money,
          then switch to mainnet when you&apos;re ready to accept real payments.
        </Paragraph>

        <SectionTitle>Testnet vs. Mainnet</SectionTitle>
        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}></th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>TESTNET (SANDBOX)</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>MAINNET (PRODUCTION)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Dashboard', test: 'testnet.cipherpay.app', prod: 'cipherpay.app' },
                { label: 'API', test: 'api.testnet.cipherpay.app', prod: 'api.cipherpay.app' },
                { label: 'Money', test: 'Free testnet ZEC (no real value)', prod: 'Real ZEC' },
                { label: 'UFVK prefix', test: 'uviewtest...', prod: 'uview...' },
                { label: 'Address prefix', test: 'utest...', prod: 'u1...' },
                { label: 'Webhook URLs', test: 'http:// or https://', prod: 'https:// only' },
                { label: 'CORS', test: 'All origins allowed', prod: 'Restricted to allowed origins' },
              ].map(row => (
                <tr key={row.label} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--cp-text)', fontSize: 11 }}>{row.label}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.test}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.prod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionTitle>How to test payments</SectionTitle>
        <Step n={1} title="Register on testnet">
          <Paragraph>
            Go to <a href="https://testnet.cipherpay.app/dashboard/register" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>testnet.cipherpay.app/dashboard/register</a> and
            create a merchant account using a <Strong>testnet UFVK</Strong> (starts with <Code>uviewtest</Code>).
          </Paragraph>
          <Paragraph>
            Everything works exactly like production, but with testnet ZEC that has no monetary value.
          </Paragraph>
        </Step>

        <Step n={2} title="Get testnet ZEC">
          <Paragraph>
            You need testnet ZEC to simulate payments. You can get some from the Zcash testnet faucet,
            or use the <a href="https://zingolabs.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>Zingo!</a> wallet
            which has built-in testnet support.
          </Paragraph>
          <Callout type="tip">
            Zingo! CLI or Zingo! mobile with testnet enabled is the easiest way to send test payments.
            You can fund your test wallet from a testnet faucet or ask in the Zcash community.
          </Callout>
        </Step>

        <Step n={3} title="Create and pay an invoice">
          <Paragraph>
            From the testnet dashboard, create an invoice (or use the API with <Code>api.testnet.cipherpay.app</Code>).
            Then send testnet ZEC to the displayed address from your testnet wallet.
          </Paragraph>
          <Paragraph>
            The payment will be detected in the mempool within seconds, and confirmed after one block (~75 seconds).
            Your dashboard and checkout page update in real-time.
          </Paragraph>
        </Step>

        <Step n={4} title="Test your webhooks">
          <Paragraph>
            Set up your webhook URL in the testnet dashboard settings.
            On testnet, <Code>http://</Code> URLs are accepted (for local development), so you can use tools
            like <a href="https://ngrok.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>ngrok</a> to
            tunnel webhook calls to your local machine:
          </Paragraph>
          <CodeBlock lang="bash" code={`# Expose your local server on port 3000
ngrok http 3000

# Then set your webhook URL to:
# https://your-id.ngrok.io/api/webhook`} />
        </Step>

        <SectionDivider />

        <SectionTitle>Switching to mainnet</SectionTitle>
        <Paragraph>
          When your integration works on testnet, going live is straightforward:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 16 }}>
          <Strong>1.</Strong> Register a new merchant account on <a href="https://cipherpay.app/dashboard/register" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>cipherpay.app</a> with your <Strong>mainnet</Strong> UFVK (starts with <Code>uview</Code>)<br />
          <Strong>2.</Strong> Update your API URL from <Code>api.testnet.cipherpay.app</Code> to <Code>api.cipherpay.app</Code><br />
          <Strong>3.</Strong> Update your checkout URL from <Code>testnet.cipherpay.app</Code> to <Code>cipherpay.app</Code><br />
          <Strong>4.</Strong> Replace your testnet API key with your mainnet API key<br />
          <Strong>5.</Strong> Make sure your webhook URL uses <Code>https://</Code> (required on mainnet)
        </div>
        <Callout type="warning">
          Testnet and mainnet are completely separate. Your testnet account, products, and invoices do not carry over to mainnet.
          This is by design — it ensures your production environment starts clean.
        </Callout>

        <SectionDivider />

        <Expandable title="API differences on testnet">
          <Paragraph>
            On testnet, the API is more permissive to make local development easier:
          </Paragraph>
          <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
            • <Code>http://</Code> webhook URLs are accepted (not only <Code>https://</Code>)<br />
            • CORS restrictions are relaxed so you can call the API from any origin
          </div>
        </Expandable>
      </>
    ),
  },
  {
    id: 'woocommerce',
    title: 'WooCommerce',
    content: (
      <>
        <Paragraph>
          If you run a WordPress + WooCommerce store, you can accept Zcash payments with a plugin — no coding required.
          The CipherPay WooCommerce plugin handles everything: creating invoices when customers check out,
          redirecting them to the payment page, and updating order statuses when payment is confirmed.
        </Paragraph>

        <Callout type="info">
          Estimated setup time: <Strong>10 minutes</Strong>. You need a CipherPay account (see Quickstart) and WordPress admin access.
        </Callout>

        <SectionTitle>How the plugin works</SectionTitle>
        <Paragraph>
          When a customer selects &quot;Pay with Zcash&quot; at checkout, the plugin:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 16 }}>
          1. Creates a CipherPay invoice via the API (with the order total in your store&apos;s currency)<br />
          2. Redirects the customer to the CipherPay hosted checkout page<br />
          3. The customer pays by scanning the QR code with their Zcash wallet<br />
          4. CipherPay sends a webhook back to your WordPress site<br />
          5. The plugin updates the WooCommerce order status to &quot;Processing&quot; or &quot;Completed&quot;
        </div>

        <SectionDivider />

        <Step n={1} title="Download the plugin">
          <Paragraph>
            Download <Code>cipherpay-woocommerce.zip</Code> from the <a href="https://github.com/Kenbak/cipherpay-woocommerce" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>GitHub repository</a> (Releases page).
          </Paragraph>
        </Step>

        <Step n={2} title="Install and activate">
          <Paragraph>
            In your WordPress admin panel:
          </Paragraph>
          <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
            1. Go to <Strong>Plugins → Add New → Upload Plugin</Strong><br />
            2. Select the <Code>cipherpay-woocommerce.zip</Code> file<br />
            3. Click <Strong>Install Now</Strong>, then <Strong>Activate</Strong>
          </div>
        </Step>

        <Step n={3} title="Configure the plugin">
          <Paragraph>
            Go to <Strong>WooCommerce → Settings → Payments → CipherPay (Zcash)</Strong> and fill in:
          </Paragraph>
          <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.4, marginBottom: 12 }}>
            <Code>API Key</Code> — Your CipherPay API key (starts with <Code>cpay_sk_</Code>). Find it in your CipherPay dashboard settings.<br />
            <Code>API URL</Code> — The CipherPay backend URL. Use <Code>https://api.cipherpay.app</Code> for mainnet,
            or <Code>https://api.testnet.cipherpay.app</Code> for testnet.<br />
            <Code>Webhook Secret</Code> — The secret used to verify webhook signatures. Found in your CipherPay dashboard settings (starts with <Code>whsec_</Code>).<br />
            <Code>Checkout Page URL</Code> — Where customers are sent to pay. Use <Code>https://cipherpay.app</Code> for mainnet,
            or <Code>https://testnet.cipherpay.app</Code> for testnet.
          </div>
          <Callout type="tip">
            The plugin automatically detects your WooCommerce store currency (EUR, USD) and sends the correct price to CipherPay.
            After payment, customers are redirected back to your store&apos;s order confirmation page.
          </Callout>
        </Step>

        <Step n={4} title="Set the webhook URL in CipherPay">
          <Paragraph>
            CipherPay needs to know where to send payment confirmations. In your CipherPay dashboard → Settings, set the Webhook URL to:
          </Paragraph>
          <CodeBlock lang="text" code={`https://yourstore.com/wp-json/cipherpay/v1/webhook`} />
          <Paragraph>
            Replace <Code>yourstore.com</Code> with your actual domain. This is the endpoint the plugin creates automatically.
          </Paragraph>
        </Step>

        <Step n={5} title="Test a payment">
          <Paragraph>
            Add an item to your cart and proceed to checkout. You should see <Strong>&quot;Pay with Zcash (ZEC)&quot;</Strong> as a payment option.
            Select it, place the order, and you&apos;ll be redirected to the CipherPay payment page.
          </Paragraph>
          <Paragraph>
            Pay with your Zcash wallet. Once the payment is confirmed, go back to WooCommerce → Orders.
            The order status should have changed automatically.
          </Paragraph>
        </Step>

        <SectionDivider />

        <SectionTitle>Troubleshooting</SectionTitle>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2 }}>
          <Strong>Payment option doesn&apos;t appear at checkout</Strong> — Make sure the plugin is enabled in WooCommerce → Settings → Payments. Check that all required fields (API Key, API URL) are filled in.<br /><br />
          <Strong>Order status doesn&apos;t update</Strong> — Verify your webhook URL is correct and accessible from the internet. Check that the webhook secret in your CipherPay dashboard matches the one in the plugin settings.<br /><br />
          <Strong>Currency mismatch</Strong> — The plugin uses your WooCommerce store currency. Make sure it&apos;s set to EUR or USD in WooCommerce → Settings → General → Currency.
        </div>
      </>
    ),
  },
  {
    id: 'custom',
    title: 'Custom Integration',
    content: (
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
            You send the price in your currency (EUR or USD), and CipherPay converts it to ZEC at the current exchange rate.
          </Paragraph>
          <CodeBlock lang="bash" code={`curl -X POST https://api.cipherpay.app/api/invoices \\
  -H "Authorization: Bearer cpay_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "price_eur": 65.00,
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
                  { field: 'price_eur', req: 'Yes*', desc: 'Price in EUR. CipherPay converts to ZEC at the current exchange rate.' },
                  { field: 'price_usd', req: 'Yes*', desc: 'Price in USD. Use instead of price_eur if your currency is dollars.' },
                  { field: 'currency', req: 'No', desc: 'Currency code: "EUR" or "USD". Defaults to "EUR".' },
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
            <Strong>*</Strong> Provide either <Code>price_eur</Code> or <Code>price_usd</Code>, not both.
            CipherPay converts to ZEC using a live exchange rate at invoice creation time. The ZEC price is locked for the invoice&apos;s lifetime (30 minutes).
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
    ),
  },
  {
    id: 'products',
    title: 'Product Pages',
    content: (
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

        <Step n={1} title="Add a product in the dashboard">
          <Paragraph>
            Go to your dashboard → Products → <Strong>+ Add Product</Strong>.
          </Paragraph>
          <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
            <Strong>Name</Strong> — The product name (e.g. &quot;[REDACTED] Tee&quot;)<br />
            <Strong>Price</Strong> — Price in your currency (EUR or USD). CipherPay converts to ZEC at checkout time.<br />
            <Strong>Variants</Strong> (optional) — Sizes or options (e.g. S, M, L, XL). Buyers will choose one at checkout.
          </div>
        </Step>

        <Step n={2} title="Share the checkout link">
          <Paragraph>
            Each product gets a permanent hosted page. Copy the link from your dashboard:
          </Paragraph>
          <CodeBlock lang="text" code={`https://cipherpay.app/buy/{product_id}`} />
          <Paragraph>
            Add this link to your website as a button:
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

        <Step n={3} title="Track payments">
          <Paragraph>
            All invoices appear in your dashboard → Invoices tab with real-time status.
            If you set up webhooks, your server gets notified automatically when a payment is confirmed.
          </Paragraph>
        </Step>

        <Callout type="tip">
          Combine this with the <Strong>In-Person POS</Strong> mode: create your products once, then use the dashboard at events to create invoices on the fly.
        </Callout>
      </>
    ),
  },
  {
    id: 'pos',
    title: 'In-Person POS',
    content: (
      <>
        <Paragraph>
          Accept Zcash at a physical store, market stall, conference, or pop-up event.
          You don&apos;t need special hardware — a phone, tablet, or laptop with a browser is all it takes.
          Your CipherPay dashboard doubles as a point-of-sale terminal.
        </Paragraph>

        <SectionTitle>How it works</SectionTitle>
        <Paragraph>
          The POS flow is designed for in-person transactions where speed matters:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 20 }}>
          1. Open your dashboard on a tablet or phone<br />
          2. Switch to the <Strong>POS</Strong> tab<br />
          3. Select items from your product catalog (you can add multiple items to a cart)<br />
          4. Tap <Strong>Checkout</Strong> — a QR code appears on screen<br />
          5. The customer scans the QR code with their Zcash wallet and pays<br />
          6. The screen updates in real-time: &quot;Detected&quot; (mempool) → &quot;Confirmed&quot; (block)
        </div>

        <SectionDivider />

        <Step n={1} title="Set up your product catalog">
          <Paragraph>
            Before using POS mode, add your items in the dashboard → Products.
            Set a name and price for each item. For a coffee shop, you might have:
          </Paragraph>
          <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
            • Espresso — €3.50<br />
            • Flat White — €4.50<br />
            • Avocado Toast — €8.00<br />
          </div>
        </Step>

        <Step n={2} title="Use the POS tab at the counter">
          <Paragraph>
            Open your CipherPay dashboard on any device. Go to the <Strong>POS</Strong> tab.
            Tap products to add them to the cart. Tap <Strong>Checkout</Strong> when the customer is ready.
          </Paragraph>
          <Paragraph>
            A QR code and payment details appear on screen. Hand the device to the customer or point it at them.
          </Paragraph>
        </Step>

        <Step n={3} title="Wait for confirmation">
          <Paragraph>
            The payment is typically detected in the mempool within <Strong>5-10 seconds</Strong>.
            For low-value items (coffee, food), mempool detection is usually sufficient — the risk of a double-spend on Zcash is extremely low.
            For higher-value items, wait for a block confirmation (~75 seconds).
          </Paragraph>
        </Step>

        <Callout type="tip">
          At conferences and events, you can set up a tablet running the CipherPay dashboard as your &quot;register.&quot;
          Multiple staff members can use the same account simultaneously from different devices.
        </Callout>

        <Callout type="info">
          The POS mode supports multi-item carts — you can select multiple products and create a single invoice for the total.
          This is especially useful for restaurants, cafes, and retail.
        </Callout>
      </>
    ),
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    content: (
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
        <CodeBlock lang="json" code={`{
  "event": "confirmed",
  "invoice_id": "a1b2c3d4-...",
  "txid": "17d8dd4df713a677d2f6637c2b449e71...",
  "timestamp": "2026-02-21T18:30:00Z"
}`} />

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
    ),
  },
  {
    id: 'billing',
    title: 'Billing & Fees',
    content: (
      <>
        <Paragraph>
          CipherPay uses a transparent, usage-based billing model. There are no monthly subscriptions or upfront costs.
          You only pay when you make money — a small percentage fee on each confirmed payment.
        </Paragraph>

        <SectionTitle>How billing works</SectionTitle>
        <Paragraph>
          Here is the billing flow, step by step:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 20 }}>
          <Strong>1. Fees accrue as you receive payments.</Strong> Each time an invoice is confirmed, a fee is recorded in your ledger
          (a small percentage of the invoice amount in ZEC).<br /><br />
          <Strong>2. Fees accumulate over a billing cycle.</Strong> Instead of charging you per transaction, CipherPay groups fees
          into billing cycles (7 days for new merchants, 30 days for established ones).<br /><br />
          <Strong>3. At the end of the cycle, you settle.</Strong> When a billing cycle ends, you&apos;ll see the outstanding balance
          in your dashboard under the Billing tab. You can pay it anytime during the grace period.<br /><br />
          <Strong>4. You pay the fee in ZEC.</Strong> Click &quot;Settle&quot; in your dashboard to create a settlement invoice.
          Pay it the same way you&apos;d pay any CipherPay invoice — scan the QR code with your wallet.
        </div>

        <Callout type="info">
          The fee rate is displayed in your dashboard billing section. It applies to the ZEC amount of each confirmed invoice.
        </Callout>

        <SectionDivider />

        <SectionTitle>Billing cycle timeline</SectionTitle>
        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>PHASE</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>STATUS</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>WHAT HAPPENS</th>
              </tr>
            </thead>
            <tbody>
              {[
                { phase: 'Active cycle', status: 'OPEN', desc: 'Fees accumulate as invoices are confirmed. Your service is fully functional.' },
                { phase: 'End of cycle', status: 'INVOICED', desc: 'A settlement invoice is generated. Grace period starts. You can pay anytime.' },
                { phase: 'Grace period expires', status: 'PAST DUE', desc: 'You can still use the service, but a reminder appears in your dashboard.' },
                { phase: 'Extended overdue', status: 'SUSPENDED', desc: 'Invoice creation is temporarily blocked until the balance is settled.' },
              ].map(row => (
                <tr key={row.phase} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--cp-text)' }}>{row.phase}</td>
                  <td style={{ padding: '8px 12px' }}><Code>{row.status}</Code></td>
                  <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionDivider />

        <Expandable title="Trust tiers">
          <Paragraph>
            As you use CipherPay and pay your bills on time, your trust tier improves.
            Higher tiers get longer billing cycles and more generous grace periods.
          </Paragraph>
          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>TIER</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>BILLING CYCLE</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>GRACE PERIOD</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>HOW TO REACH</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { tier: 'New', cycle: '7 days', grace: '3 days', how: 'Default for all new accounts' },
                  { tier: 'Standard', cycle: '30 days', grace: '7 days', how: '3+ consecutive on-time payments' },
                  { tier: 'Trusted', cycle: '30 days', grace: '14 days', how: 'Continued on-time payments, no late history in 90 days' },
                ].map(row => (
                  <tr key={row.tier} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                    <td style={{ padding: '8px 12px', color: 'var(--cp-text)', fontWeight: 600 }}>{row.tier}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.cycle}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.grace}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.how}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Expandable>

        <SectionDivider />

        <SectionTitle>Settling your balance</SectionTitle>
        <Paragraph>
          To pay your outstanding fees:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 16 }}>
          1. Go to your dashboard → <Strong>Billing</Strong> tab<br />
          2. You&apos;ll see your current balance and fee history<br />
          3. Click <Strong>Settle</Strong> to create a settlement invoice<br />
          4. Pay it like any CipherPay invoice — scan the QR code with your wallet<br />
          5. Once confirmed, your billing status resets and a new cycle begins
        </div>

        <Callout type="tip">
          You can settle your balance at any time — you don&apos;t have to wait for the cycle to end.
          Early payment doesn&apos;t change your billing cycle schedule, but it keeps your balance low.
        </Callout>

        <Callout type="info">
          CipherPay is open-source. If you self-host your own instance, billing is optional — fees are only enabled
          when the server operator configures a fee address and rate. Without these, CipherPay is completely free to use.
        </Callout>
      </>
    ),
  },
  {
    id: 'api-ref',
    title: 'API Reference',
    content: (
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
              {[
                { method: 'POST', path: '/api/invoices', auth: 'API Key', desc: 'Create a new invoice with price and product details' },
                { method: 'GET', path: '/api/invoices', auth: 'API Key', desc: 'List all your invoices (paginated)' },
                { method: 'GET', path: '/api/invoices/{id}', auth: '—', desc: 'Get a single invoice by ID (public)' },
                { method: 'GET', path: '/api/invoices/{id}/status', auth: '—', desc: 'Poll the current status of an invoice' },
                { method: 'GET', path: '/api/invoices/{id}/stream', auth: '—', desc: 'SSE stream for real-time status updates' },
                { method: 'GET', path: '/api/invoices/{id}/qr', auth: '—', desc: 'QR code image (PNG) for the payment URI' },
                { method: 'GET', path: '/api/invoices/lookup/{memo}', auth: '—', desc: 'Look up an invoice by its memo code' },
                { method: 'POST', path: '/api/invoices/{id}/cancel', auth: 'Session', desc: 'Cancel a pending invoice' },
                { method: 'POST', path: '/api/invoices/{id}/refund', auth: 'Session', desc: 'Mark an invoice as refunded' },
                { method: 'PATCH', path: '/api/invoices/{id}/refund-address', auth: '—', desc: 'Set a refund address (buyer-facing)' },
              ].map(ep => {
                const color = ep.method === 'GET' ? 'var(--cp-green)' : ep.method === 'POST' ? 'var(--cp-cyan)' : '#f59e0b';
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

        <div style={{ fontSize: 12, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Products</div>
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
              {[
                { method: 'POST', path: '/api/products', auth: 'Session', desc: 'Create a new product' },
                { method: 'GET', path: '/api/products', auth: 'Session', desc: 'List your products' },
                { method: 'PATCH', path: '/api/products/{id}', auth: 'Session', desc: 'Update a product' },
                { method: 'DELETE', path: '/api/products/{id}', auth: 'Session', desc: 'Deactivate a product' },
                { method: 'GET', path: '/api/products/{id}/public', auth: '—', desc: 'Get public product info (for buy pages)' },
                { method: 'POST', path: '/api/checkout', auth: '—', desc: 'Create an invoice from a product page (buyer-facing)' },
              ].map(ep => {
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

        <div style={{ fontSize: 12, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Merchant &amp; Account</div>
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
              {[
                { method: 'POST', path: '/api/merchants', auth: '—', desc: 'Register a new merchant account' },
                { method: 'GET', path: '/api/merchants/me', auth: 'Session', desc: 'Get your merchant profile' },
                { method: 'PATCH', path: '/api/merchants/me', auth: 'Session', desc: 'Update store name, email, webhook URL' },
                { method: 'POST', path: '/api/auth/session', auth: '—', desc: 'Log in (create a session)' },
                { method: 'POST', path: '/api/auth/logout', auth: '—', desc: 'Log out (clear session)' },
                { method: 'POST', path: '/api/merchants/me/regenerate-api-key', auth: 'Session', desc: 'Generate a new API key (invalidates old one)' },
                { method: 'POST', path: '/api/merchants/me/regenerate-dashboard-token', auth: 'Session', desc: 'Generate a new dashboard token' },
                { method: 'POST', path: '/api/merchants/me/regenerate-webhook-secret', auth: 'Session', desc: 'Generate a new webhook secret' },
              ].map(ep => {
                const color = ep.method === 'GET' ? 'var(--cp-green)' : ep.method === 'POST' ? 'var(--cp-cyan)' : '#f59e0b';
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

        <div style={{ fontSize: 12, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Billing</div>
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
              {[
                { method: 'GET', path: '/api/merchants/me/billing', auth: 'Session', desc: 'Current billing summary (balance, cycle, tier)' },
                { method: 'GET', path: '/api/merchants/me/billing/history', auth: 'Session', desc: 'Past billing cycles and fee entries' },
                { method: 'POST', path: '/api/merchants/me/billing/settle', auth: 'Session', desc: 'Create a settlement invoice to pay outstanding fees' },
              ].map(ep => {
                const color = ep.method === 'GET' ? 'var(--cp-green)' : 'var(--cp-cyan)';
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

        <div style={{ fontSize: 12, color: 'var(--cp-text)', fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Other</div>
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
              {[
                { method: 'GET', path: '/api/rates', auth: '—', desc: 'Current ZEC/EUR and ZEC/USD exchange rates' },
                { method: 'GET', path: '/api/health', auth: '—', desc: 'Server health check' },
              ].map(ep => {
                const color = 'var(--cp-green)';
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

        <SectionDivider />

        <Expandable title="Full invoice object">
          <Paragraph>
            The complete invoice object returned by <Code>GET /api/invoices/&#123;id&#125;</Code>:
          </Paragraph>
          <CodeBlock lang="json" code={`{
  "id": "a1b2c3d4-...",
  "memo_code": "CP-3F8A2B1C",
  "product_name": "Privacy Tee",
  "size": "L",
  "price_eur": 65.0,
  "price_usd": 70.2,
  "currency": "EUR",
  "price_zec": 0.14285714,
  "price_zatoshis": 14285714,
  "received_zec": 0.14285714,
  "received_zatoshis": 14285714,
  "zec_rate_at_creation": 455.0,
  "payment_address": "u1...",
  "zcash_uri": "zcash:u1...?amount=0.14285714&memo=...",
  "status": "confirmed",
  "detected_txid": "abc123...",
  "refund_address": null,
  "shipping_alias": "Jane Doe",
  "shipping_address": "123 Privacy St",
  "shipping_region": "CH",
  "expires_at": "2026-02-22T00:30:00Z",
  "created_at": "2026-02-22T00:00:00Z"
}`} />
        </Expandable>

        <SectionDivider />

        <SectionTitle>Rate limiting</SectionTitle>
        <Paragraph>
          The API is rate-limited to prevent abuse. If you exceed the limit, the server responds with
          <Code> 429 Too Many Requests</Code>. Wait a moment and retry. Authentication endpoints (registration, login) have
          stricter limits than general API calls.
        </Paragraph>
      </>
    ),
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const current = sections.find((s) => s.id === activeSection) || sections[0];

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/"><Logo size="sm" /></Link>
          <span style={{ fontSize: 16, fontWeight: 300, color: 'var(--cp-text-muted)', letterSpacing: 1 }}>DOCS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NavLinks />
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--cp-text)', margin: 0 }}>
            <span style={{ color: 'var(--cp-cyan)' }}>Documentation</span>
          </h1>
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginTop: 4 }}>
            Accept shielded Zcash payments. Non-custodial. Set up in minutes.
          </p>
        </div>

        <div className="grid-layout">
          {/* Sidebar */}
          <div>
            <div className="panel" style={{ position: 'sticky', top: 24 }}>
              {SIDEBAR_GROUPS.map((group) => (
                <div key={group.label}>
                  <SidebarGroup label={group.label} />
                  {group.ids.map((id) => {
                    const section = sections.find((s) => s.id === id);
                    if (!section) return null;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 16px',
                          fontSize: 11,
                          fontFamily: 'inherit',
                          letterSpacing: 0.5,
                          cursor: 'pointer',
                          border: 'none',
                          borderBottom: '1px solid var(--cp-border)',
                          background: activeSection === section.id ? 'rgba(6,182,212,0.08)' : 'transparent',
                          color: activeSection === section.id ? 'var(--cp-cyan)' : 'var(--cp-text-muted)',
                          fontWeight: activeSection === section.id ? 600 : 400,
                          transition: 'all 0.15s',
                        }}
                      >
                        {section.title.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="panel" data-section={current.id}>
              <div className="panel-header">
                <span className="panel-title">{current.title}</span>
              </div>
              <div className="panel-body">
                {current.id === 'overview' ? (
                  <OverviewContent onNavigate={setActiveSection} />
                ) : (
                  current.content
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
