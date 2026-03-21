'use client';

import { Code, Callout, SectionDivider, Paragraph, SectionTitle, Strong } from '../components/DocComponents';

const USE_CASES = [
  { title: 'Shopify store', bestFor: 'Shopify merchants — install an app, no code', time: '~10 min', link: 'shopify' },
  { title: 'WooCommerce store', bestFor: 'WordPress merchants — install a plugin, no code', time: '~10 min', link: 'woocommerce' },
  { title: 'Custom website or app', bestFor: 'Developers integrating via REST API', time: '~30 min', link: 'custom' },
  { title: 'Product pages (no-code)', bestFor: 'Sell a few items — create a product, share a link', time: '~5 min', link: 'products' },
  { title: 'In-person POS', bestFor: 'Events, pop-ups, physical stores — phone or tablet', time: '~5 min', link: 'pos' },
];

export default function OverviewSection({ onNavigate }: { onNavigate: (id: string) => void }) {
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
        The payment flow is the same whether you use Shopify, WooCommerce, the API, or product links.
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
        They scan it with their Zcash wallet (like Zodl or YWallet), and the transaction is sent.
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
            Download <a href="https://zodl.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>Zodl</a> (mobile) or <a href="https://ywallet.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>YWallet</a> (desktop &amp; mobile).
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
