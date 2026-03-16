'use client';

import { Code, CodeBlock, Step, Callout, SectionDivider, Paragraph, SectionTitle, Strong, Expandable } from '../components/DocComponents';

export default function X402Section() {
  return (
    <>
      <Paragraph>
        The x402 protocol (HTTP 402 &quot;Payment Required&quot;) enables AI agents and automated clients to pay for API access programmatically.
        CipherPay acts as the <Strong>facilitator</Strong> for Zcash — verifying that a shielded payment was made to your wallet
        so your server can grant access without understanding Zcash internals.
      </Paragraph>

      <SectionTitle>How it works</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { n: '1', label: 'Agent requests resource', sub: 'GET /api/data' },
          { n: '2', label: 'Server returns 402', sub: 'With price and ZEC address' },
          { n: '3', label: 'Agent sends ZEC', sub: 'Shielded transaction' },
          { n: '4', label: 'Server calls CipherPay', sub: 'POST /x402/verify' },
          { n: '5', label: 'CipherPay confirms', sub: 'Trial decryption' },
          { n: '6', label: 'Server grants access', sub: 'Returns the data' },
        ].map(s => (
          <div key={s.n} style={{ textAlign: 'center', padding: '14px 10px', background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cp-cyan)', marginBottom: 4 }}>{s.n}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cp-text)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <Paragraph>
        Your server responds with HTTP 402 when an unauthenticated request arrives. The response body includes
        how much to pay, what address to pay to, and which facilitator to use. The agent pays, then retries the request
        with the transaction ID in the <Code>X-PAYMENT</Code> header. Your server forwards the txid to CipherPay for verification.
      </Paragraph>

      <Callout type="info">
        CipherPay verifies payments using your viewing key (UFVK) via trial decryption — the same mechanism
        used for invoice detection. The sender&apos;s identity remains fully private.
      </Callout>

      <SectionDivider />

      <SectionTitle>Why privacy matters for agents</SectionTitle>
      <Paragraph>
        Every AI agent payment on Base, Solana, or Polygon is a public record. Competitors can reconstruct
        your agent&apos;s entire operational strategy — what APIs it calls, what data it buys, how often, and how much
        it spends. On transparent chains, agent payment metadata is a surveillance goldmine.
      </Paragraph>
      <Paragraph>
        With Zcash shielded payments, all of that is invisible. The sender, receiver, amount, and frequency are
        fully encrypted on-chain. CipherPay verifies payments using your viewing key, but the <Strong>agent&apos;s identity,
        balance, and activity remain completely private</Strong>.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>Quick start — @cipherpay/x402</SectionTitle>
      <Paragraph>
        The fastest way to accept shielded ZEC payments on your API. One middleware, one line.
      </Paragraph>
      <CodeBlock lang="bash" code={`npm install @cipherpay/x402`} />
      <CodeBlock lang="typescript" code={`import express from 'express';
import { zcashPaywall } from '@cipherpay/x402/express';

const app = express();

// Gate premium endpoints behind a ZEC payment
app.use('/api/premium', zcashPaywall({
  amount: 0.001,          // ZEC per request
  address: 'u1abc...',    // Your Zcash Unified Address
  apiKey: 'cpay_sk_...',  // CipherPay API key
}));

app.get('/api/premium/data', (req, res) => {
  res.json({ temperature: 18, conditions: 'partly cloudy' });
});`} />
      <Paragraph>
        The middleware handles the full x402 flow: returns 402 with payment terms when no proof is present,
        verifies the txid via CipherPay when the <Code>X-PAYMENT</Code> header is provided, and grants access
        when the payment is valid.
      </Paragraph>

      <Callout type="tip">
        For dynamic pricing (e.g. different rates per model or endpoint), use the <Code>getAmount</Code> option
        instead of a static <Code>amount</Code>.
      </Callout>

      <CodeBlock lang="typescript" code={`app.use('/api/ai', zcashPaywall({
  address: 'u1abc...',
  apiKey: 'cpay_sk_...',
  amount: 0,
  getAmount: (req) => {
    if (req.url.includes('gpt-4')) return 0.01;
    if (req.url.includes('gpt-3')) return 0.001;
    return 0.0005;
  },
}));`} />

      <Paragraph>
        The SDK also exports a standalone <Code>verifyPayment</Code> function for custom integrations:
      </Paragraph>
      <CodeBlock lang="typescript" code={`import { verifyPayment } from '@cipherpay/x402';

const result = await verifyPayment(txid, 0.001, 'cpay_sk_...');
if (result.valid) {
  // Payment confirmed — grant access
}`} />

      <SectionDivider />

      <SectionTitle>Setup guide</SectionTitle>
      <Step n={1} title="Register with CipherPay">
        <Paragraph>
          If you already have a CipherPay merchant account, you can use your existing API key.
          If not, <a href="/dashboard/register" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>register here</a> with
          your UFVK. You&apos;ll get an API key (<Code>cpay_sk_...</Code>) to authenticate verification requests.
        </Paragraph>
      </Step>

      <Step n={2} title="Return 402 from your server">
        <Paragraph>
          When your API receives a request without a valid <Code>X-PAYMENT</Code> header, respond with HTTP 402
          and the payment terms:
        </Paragraph>
        <CodeBlock lang="json" code={`{
  "x402": {
    "version": 1,
    "accepts": [{
      "chain": "zcash:mainnet",
      "address": "u1yourpaymentaddress...",
      "amount": "0.001",
      "facilitator": "https://api.cipherpay.app/api/x402/verify"
    }]
  }
}`} />
      </Step>

      <Step n={3} title="Verify the payment">
        <Paragraph>
          When the agent retries with an <Code>X-PAYMENT</Code> header containing a Zcash txid,
          call the CipherPay verify endpoint from your server:
        </Paragraph>
        <CodeBlock lang="bash" code={`curl -X POST https://api.cipherpay.app/api/x402/verify \\
  -H "Authorization: Bearer cpay_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "txid": "a1b2c3d4e5f6...",
    "expected_amount_zec": 0.001
  }'`} />
        <Paragraph>Response:</Paragraph>
        <CodeBlock lang="json" code={`{
  "valid": true,
  "received_zec": 0.001,
  "received_zatoshis": 100000
}`} />
        <Paragraph>
          If <Code>valid</Code> is <Code>true</Code>, the payment was confirmed to your address. Grant the agent access.
          If <Code>false</Code>, the response includes a <Code>reason</Code> field explaining why (insufficient amount,
          no outputs to your address, tx not found).
        </Paragraph>
      </Step>

      <SectionDivider />

      <SectionTitle>Middleware example</SectionTitle>
      <Paragraph>
        Here is a minimal Express.js middleware that implements the full x402 flow:
      </Paragraph>
      <CodeBlock lang="javascript" code={`const CIPHERPAY_API_KEY = process.env.CIPHERPAY_API_KEY;
const CIPHERPAY_URL = 'https://api.cipherpay.app/api/x402/verify';
const PAYMENT_ADDRESS = 'u1youraddress...';
const PRICE_ZEC = 0.001;

async function x402Middleware(req, res, next) {
  const txid = req.headers['x-payment'];

  if (!txid) {
    return res.status(402).json({
      x402: {
        version: 1,
        accepts: [{
          chain: 'zcash:mainnet',
          address: PAYMENT_ADDRESS,
          amount: String(PRICE_ZEC),
          facilitator: CIPHERPAY_URL,
        }],
      },
    });
  }

  const resp = await fetch(CIPHERPAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${CIPHERPAY_API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      txid,
      expected_amount_zec: PRICE_ZEC,
    }),
  });

  const result = await resp.json();

  if (!result.valid) {
    return res.status(402).json({
      error: 'Payment verification failed',
      reason: result.reason,
    });
  }

  next();
}`} />

      <SectionDivider />

      <SectionTitle>API reference</SectionTitle>
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
              { method: 'POST', path: '/api/x402/verify', auth: 'API Key', desc: 'Verify a shielded ZEC payment by txid' },
              { method: 'GET', path: '/api/merchants/me/x402/history', auth: 'API Key / Session', desc: 'List past x402 verifications' },
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

      <Expandable title="Verify request/response details">
        <Paragraph>
          <Strong>POST /api/x402/verify</Strong>
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          <Strong>Request body:</Strong><br />
          <Code>txid</Code> — 64-character hex Zcash transaction ID<br />
          <Code>expected_amount_zec</Code> — Minimum expected amount (positive float)
        </div>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          <Strong>Response:</Strong><br />
          <Code>valid</Code> — <Code>true</Code> if payment matches, <Code>false</Code> otherwise<br />
          <Code>received_zec</Code> — Total ZEC received in outputs addressed to you<br />
          <Code>received_zatoshis</Code> — Same amount in zatoshis (1 ZEC = 100,000,000 zatoshis)<br />
          <Code>reason</Code> — Present only when <Code>valid</Code> is <Code>false</Code>
        </div>
        <Callout type="info">
          A 0.5% slippage tolerance is applied to account for wallet rounding and network fees.
        </Callout>
      </Expandable>

      <SectionDivider />

      <SectionTitle>Verification history</SectionTitle>
      <Paragraph>
        All verification calls are logged and accessible via the dashboard or the history endpoint.
        This gives you an audit trail of every x402 payment your server has verified.
      </Paragraph>
      <CodeBlock lang="bash" code={`curl https://api.cipherpay.app/api/merchants/me/x402/history \\
  -H "Authorization: Bearer cpay_sk_YOUR_KEY"`} />
      <Paragraph>
        Returns a paginated list with <Code>?limit=</Code> and <Code>?offset=</Code> query parameters (max 200 per page).
      </Paragraph>

      <Callout type="tip">
        x402 verification is free. CipherPay makes money from invoice-based payment processing — the x402 facilitator
        is provided to drive Zcash adoption for AI and programmatic payments.
      </Callout>
    </>
  );
}
