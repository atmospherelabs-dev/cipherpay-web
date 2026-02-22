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

function OverviewContent({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <>
      <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.8, marginBottom: 20 }}>
        CipherPay lets you accept shielded Zcash payments on any website or app. It&apos;s non-custodial — payments go directly to your wallet. You get an API key, create invoices, and redirect buyers to a hosted checkout page. That&apos;s it.
      </p>

      <div style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 2, marginBottom: 20 }}>
        <strong style={{ color: 'var(--cp-text)' }}>Choose your integration:</strong>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {[
          { title: 'WooCommerce', desc: 'Install the plugin. No code.', link: 'woocommerce' },
          { title: 'Custom Website', desc: 'Use the API to create invoices and redirect buyers.', link: 'custom' },
          { title: 'In-Person POS', desc: 'Create invoices from the dashboard. Customer scans QR.', link: 'pos' },
          { title: 'Product Pages', desc: 'Add products to the dashboard. Link to hosted checkout.', link: 'products' },
        ].map(item => (
          <button
            key={item.link}
            onClick={() => onNavigate(item.link)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '14px 16px',
              background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cp-cyan)', marginBottom: 2 }}>{item.title}</div>
            <div style={{ fontSize: 11, color: 'var(--cp-text-muted)' }}>{item.desc}</div>
          </button>
        ))}
      </div>
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
        <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.8, marginBottom: 20 }}>
          Accept your first Zcash payment in under 5 minutes.
        </p>

        <Step n={1} title="Create your account">
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginBottom: 12 }}>
            Register at <Code>/dashboard/register</Code> with your Zcash Unified Full Viewing Key (UFVK) and payment address. You&apos;ll receive an <strong style={{ color: 'var(--cp-text)' }}>API key</strong> and a <strong style={{ color: 'var(--cp-text)' }}>dashboard token</strong>. Save both — they&apos;re shown only once.
          </p>
        </Step>

        <Step n={2} title="Create an invoice">
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginBottom: 12 }}>
            Call the API from your server to create an invoice. The response includes a payment URL.
          </p>
          <CodeBlock lang="bash" code={`curl -X POST https://pay.example.com/api/invoices \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"price_eur": 65.00, "product_name": "Privacy Tee"}'`} />
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginBottom: 12 }}>
            Response:
          </p>
          <CodeBlock lang="json" code={`{
  "invoice_id": "a1b2c3d4-...",
  "memo_code": "CP-3F8A2B1C",
  "price_zec": 0.14285714,
  "payment_address": "u1...",
  "zcash_uri": "zcash:u1...?amount=0.14285714&memo=...",
  "expires_at": "2026-02-22T00:30:00Z"
}`} />
        </Step>

        <Step n={3} title="Redirect the buyer">
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginBottom: 12 }}>
            Send the buyer to the hosted checkout page. It handles QR codes, real-time payment detection, and status updates automatically.
          </p>
          <CodeBlock lang="javascript" code={`// After creating the invoice, redirect:
window.location.href = \`https://pay.example.com/pay/\${data.invoice_id}\`;`} />
        </Step>

        <Step n={4} title="Get notified">
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginBottom: 12 }}>
            When the payment is confirmed, CipherPay sends a webhook to your server. Use the <Code>invoice_id</Code> to look up the order and fulfill it.
          </p>
          <CodeBlock lang="json" code={`{
  "event": "invoice.confirmed",
  "invoice_id": "a1b2c3d4-...",
  "txid": "abc123...",
  "timestamp": "2026-02-21T18:30:00Z"
}`} />
        </Step>
      </>
    ),
  },
  {
    id: 'custom',
    title: 'Custom Integration',
    content: (
      <>
        <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.8, marginBottom: 20 }}>
          Integrate CipherPay into any website or app using the REST API.
        </p>

        <div className="section-title" style={{ marginBottom: 12 }}>Authentication</div>
        <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginBottom: 12 }}>
          All API calls from your server use your API key in the <Code>Authorization</Code> header:
        </p>
        <CodeBlock lang="http" code={`Authorization: Bearer cpay_sk_...`} />

        <div className="section-title" style={{ marginTop: 20, marginBottom: 12 }}>Create an Invoice</div>
        <CodeBlock lang="bash" code={`curl -X POST https://pay.example.com/api/invoices \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "price_eur": 65.00,
    "product_name": "Privacy Tee",
    "size": "L"
  }'`} />
        <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginBottom: 8 }}>Fields:</p>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2, marginBottom: 20 }}>
          <Code>price_eur</Code> <span style={{ color: 'var(--cp-text-muted)' }}>(required)</span> — Price in EUR. Converted to ZEC at current rate.<br />
          <Code>product_name</Code> <span style={{ color: 'var(--cp-text-muted)' }}>(optional)</span> — Displayed on checkout page.<br />
          <Code>size</Code> <span style={{ color: 'var(--cp-text-muted)' }}>(optional)</span> — Variant/size label.
        </div>

        <div className="section-title" style={{ marginBottom: 12 }}>Check Invoice Status</div>
        <CodeBlock lang="bash" code={`curl https://pay.example.com/api/invoices/{invoice_id}`} />
        <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginBottom: 20 }}>
          Returns the full invoice object including <Code>status</Code>: <Code>pending</Code> → <Code>detected</Code> → <Code>confirmed</Code>.
        </p>

        <div className="section-title" style={{ marginBottom: 12 }}>Real-Time Updates (SSE)</div>
        <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginBottom: 12 }}>
          Subscribe to real-time status changes instead of polling:
        </p>
        <CodeBlock lang="javascript" code={`const source = new EventSource(
  'https://pay.example.com/api/invoices/{id}/stream'
);

source.addEventListener('status', (e) => {
  const { status, txid } = JSON.parse(e.data);
  // status: "detected", "confirmed", or "expired"
  if (status === 'confirmed' || status === 'expired') {
    source.close();
  }
});`} />

        <div className="section-title" style={{ marginBottom: 12 }}>List Your Invoices</div>
        <CodeBlock lang="bash" code={`curl https://pay.example.com/api/invoices \\
  -H "Authorization: Bearer YOUR_API_KEY"`} />

        <div className="section-title" style={{ marginBottom: 12 }}>Get Current Rates</div>
        <CodeBlock lang="bash" code={`curl https://pay.example.com/api/rates`} />
        <CodeBlock lang="json" code={`{ "zec_eur": 455.0, "zec_usd": 490.0, "updated_at": "..." }`} />
      </>
    ),
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    content: (
      <>
        <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.8, marginBottom: 20 }}>
          Webhooks notify your server when a payment is detected, confirmed, or expires. Set your webhook URL in the dashboard settings.
        </p>

        <div className="section-title" style={{ marginBottom: 12 }}>Webhook Events</div>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2, marginBottom: 20 }}>
          <Code>invoice.detected</Code> — Payment found in the mempool (unconfirmed)<br />
          <Code>invoice.confirmed</Code> — Payment mined in a block. <strong style={{ color: 'var(--cp-text)' }}>This is when you fulfill the order.</strong><br />
          <Code>invoice.expired</Code> — Invoice expired without payment
        </div>

        <div className="section-title" style={{ marginBottom: 12 }}>Payload</div>
        <CodeBlock lang="json" code={`{
  "event": "invoice.confirmed",
  "invoice_id": "a1b2c3d4-...",
  "txid": "abc123def456...",
  "timestamp": "2026-02-21T18:30:00Z"
}`} />

        <div className="section-title" style={{ marginBottom: 12 }}>Verify the Signature</div>
        <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginBottom: 12 }}>
          Every webhook is signed. Verify it to make sure it&apos;s from CipherPay and not a spoofed request. Use the <Code>webhook_secret</Code> from your dashboard.
        </p>
        <CodeBlock lang="javascript" code={`const crypto = require('crypto');

function verifyWebhook(req, webhookSecret) {
  const signature = req.headers['x-cipherpay-signature'];
  const timestamp = req.headers['x-cipherpay-timestamp'];
  const body = JSON.stringify(req.body);

  // Reject old webhooks (replay protection)
  const age = Date.now() - new Date(timestamp).getTime();
  if (age > 5 * 60 * 1000) return false;

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(timestamp + '.' + body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature), Buffer.from(expected)
  );
}`} />
        <CodeBlock lang="python" code={`import hmac, hashlib, time
from datetime import datetime

def verify_webhook(headers, body, webhook_secret):
    signature = headers.get('X-CipherPay-Signature')
    timestamp = headers.get('X-CipherPay-Timestamp')
    
    # Reject old webhooks
    ts = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    if (datetime.now(ts.tzinfo) - ts).total_seconds() > 300:
        return False
    
    expected = hmac.new(
        webhook_secret.encode(),
        f"{timestamp}.{body}".encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected)`} />
        <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginTop: 8 }}>
          Your endpoint should return a <Code>2xx</Code> status code. Failed deliveries are retried automatically.
        </p>
      </>
    ),
  },
  {
    id: 'products',
    title: 'Product Pages',
    content: (
      <>
        <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.8, marginBottom: 20 }}>
          If you don&apos;t want to build a custom integration, create products in the dashboard and link directly to hosted checkout pages.
        </p>

        <Step n={1} title="Add a product in the dashboard">
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>
            Go to your dashboard → Products → Add Product. Set a name, price, optional variants (S, M, L), and a URL slug.
          </p>
        </Step>

        <Step n={2} title="Link to the checkout page">
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginBottom: 12 }}>
            Each product gets a hosted page. Copy the link and add it to your website:
          </p>
          <CodeBlock lang="html" code={`<a href="https://pay.example.com/buy/PRODUCT_ID">
  Pay with Zcash
</a>`} />
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>
            The buyer selects a variant and is redirected to the payment page. Pricing is always set server-side — buyers can&apos;t tamper with it.
          </p>
        </Step>

        <Step n={3} title="Track payments in the dashboard">
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>
            View invoices and payment status in your dashboard. Use webhooks to integrate with your own order management.
          </p>
        </Step>
      </>
    ),
  },
  {
    id: 'pos',
    title: 'In-Person POS',
    content: (
      <>
        <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.8, marginBottom: 20 }}>
          Accept Zcash payments at a physical store or event. No hardware needed — just a phone or tablet.
        </p>

        <Step n={1} title="Add your items as products">
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>
            Create your menu items or products in the dashboard with their prices.
          </p>
        </Step>

        <Step n={2} title="Use Quick POS">
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>
            In your dashboard, each product has a &quot;Quick POS&quot; button. Tap it to instantly create an invoice and show the payment QR code. The customer scans it with their Zcash wallet and pays.
          </p>
        </Step>

        <Step n={3} title="Payment confirmed in real-time">
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>
            The checkout page shows real-time status updates. Once confirmed, serve the order.
          </p>
        </Step>
      </>
    ),
  },
  {
    id: 'woocommerce',
    title: 'WooCommerce',
    content: (
      <>
        <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.8, marginBottom: 20 }}>
          Accept Zcash in your WooCommerce store. Install the plugin, enter your API key, done.
        </p>

        <Step n={1} title="Download the plugin">
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>
            Download <Code>cipherpay-woocommerce.zip</Code> from the releases page.
          </p>
        </Step>

        <Step n={2} title="Install and activate">
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)' }}>
            WordPress Admin → Plugins → Add New → Upload Plugin → Activate.
          </p>
        </Step>

        <Step n={3} title="Configure">
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginBottom: 12 }}>
            Go to WooCommerce → Settings → Payments → CipherPay and enter:
          </p>
          <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2 }}>
            <Code>API Key</Code> — Your CipherPay API key<br />
            <Code>API URL</Code> — Your CipherPay server URL<br />
            <Code>Webhook Secret</Code> — From your CipherPay dashboard
          </div>
        </Step>

        <Step n={4} title="Set the webhook URL">
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginBottom: 12 }}>
            In your CipherPay dashboard settings, set the webhook URL to:
          </p>
          <CodeBlock lang="text" code={`https://yourstore.com/wp-json/cipherpay/v1/webhook`} />
        </Step>

        <div style={{ marginTop: 20 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>How it works</div>
          <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2 }}>
            1. Customer selects &quot;Pay with Zcash&quot; at checkout<br />
            2. Plugin creates a CipherPay invoice with the order total<br />
            3. Customer is redirected to the payment page<br />
            4. Payment is confirmed → webhook fires → order marked as paid automatically
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'api-ref',
    title: 'API Reference',
    content: (
      <>
        <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.8, marginBottom: 20 }}>
          All endpoints are relative to your CipherPay server URL. Authenticated endpoints require your API key in the <Code>Authorization: Bearer</Code> header.
        </p>

        {[
          { method: 'POST', path: '/api/invoices', auth: true, desc: 'Create a new invoice' },
          { method: 'GET', path: '/api/invoices', auth: true, desc: 'List your invoices' },
          { method: 'GET', path: '/api/invoices/{id}', auth: false, desc: 'Get invoice details' },
          { method: 'GET', path: '/api/invoices/{id}/stream', auth: false, desc: 'SSE stream for real-time status' },
          { method: 'GET', path: '/api/invoices/{id}/qr', auth: false, desc: 'QR code PNG for payment' },
          { method: 'POST', path: '/api/checkout', auth: false, desc: 'Buyer checkout (from product page)' },
          { method: 'GET', path: '/api/products/{id}/public', auth: false, desc: 'Get product info (public)' },
          { method: 'GET', path: '/api/rates', auth: false, desc: 'Current ZEC/EUR and ZEC/USD rates' },
        ].map(ep => {
          const color = ep.method === 'GET' ? 'var(--cp-green)' : 'var(--cp-cyan)';
          return (
            <div key={ep.path + ep.method} style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 40 }}>{ep.method}</span>
              <code style={{ fontSize: 11, color: 'var(--cp-text)', wordBreak: 'break-all' }}>{ep.path}</code>
              {ep.auth && <span className="tag" style={{ fontSize: 8 }}>API KEY</span>}
              <span style={{ fontSize: 11, color: 'var(--cp-text-muted)' }}>— {ep.desc}</span>
            </div>
          );
        })}

        <div style={{ marginTop: 24 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Invoice Object</div>
          <CodeBlock lang="json" code={`{
  "id": "a1b2c3d4-...",
  "memo_code": "CP-3F8A2B1C",
  "product_name": "Privacy Tee",
  "size": "L",
  "price_eur": 65.0,
  "price_zec": 0.14285714,
  "zec_rate_at_creation": 455.0,
  "payment_address": "u1...",
  "zcash_uri": "zcash:u1...?amount=0.14285714&memo=...",
  "status": "confirmed",
  "detected_txid": "abc123...",
  "expires_at": "2026-02-22T00:30:00Z",
  "created_at": "2026-02-22T00:00:00Z"
}`} />
        </div>
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
            <span style={{ color: 'var(--cp-cyan)' }}>Get</span> Started
          </h1>
          <p style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginTop: 4 }}>
            Private payments for the internet. Accept Zcash in minutes.
          </p>
        </div>

        <div className="grid-layout">
          {/* Sidebar */}
          <div>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">GUIDES</span>
              </div>
              {sections.map((section) => (
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
