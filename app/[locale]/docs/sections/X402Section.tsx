'use client';

import { Code, CodeBlock, Step, Callout, SectionDivider, Paragraph, SectionTitle, Strong, Expandable } from '../components/DocComponents';

export default function X402Section() {
  return (
    <>
      <Paragraph>
        CipherPay enables AI agents and automated clients to pay for API access using shielded Zcash.
        It supports two open standards — <Strong>x402</Strong> (HTTP 402 Payment Required) and the
        <Strong> Machine Payments Protocol (MPP)</Strong> — plus <Strong>prepaid sessions</Strong> for
        high-frequency agent workflows. All payments are verified via trial decryption using your viewing key.
      </Paragraph>

      <SectionTitle>Supported protocols</SectionTitle>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>PROTOCOL</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>CHALLENGE HEADER</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>CREDENTIAL HEADER</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>FLOW</th>
            </tr>
          </thead>
          <tbody>
            {[
              { proto: 'x402 v2', challenge: 'PAYMENT-REQUIRED', credential: 'PAYMENT-SIGNATURE', flow: 'Custom x402 headers + JSON body' },
              { proto: 'MPP', challenge: 'WWW-Authenticate: Payment', credential: 'Authorization: Payment', flow: 'Standard HTTP auth headers' },
              { proto: 'Sessions', challenge: '—', credential: 'Authorization: Bearer cps_...', flow: 'Prepaid credit, no per-request payment' },
            ].map(p => (
              <tr key={p.proto} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--cp-cyan)', fontSize: 10 }}>{p.proto}</td>
                <td style={{ padding: '8px 12px' }}><code style={{ fontSize: 10, color: 'var(--cp-text)' }}>{p.challenge}</code></td>
                <td style={{ padding: '8px 12px' }}><code style={{ fontSize: 10, color: 'var(--cp-text)' }}>{p.credential}</code></td>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)', fontSize: 10 }}>{p.flow}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paragraph>
        The <Code>@cipherpay/x402</Code> middleware auto-detects which protocol the client is using and handles all
        three flows transparently. Session tokens are checked first, then MPP headers, then x402 headers.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>How it works</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { n: '1', label: 'Agent requests resource', sub: 'GET /api/data' },
          { n: '2', label: 'Server returns 402', sub: 'With price and ZEC address' },
          { n: '3', label: 'Agent sends ZEC', sub: 'Shielded transaction' },
          { n: '4', label: 'Server calls CipherPay', sub: 'POST /x402/verify' },
          { n: '5', label: 'CipherPay confirms', sub: 'Trial decryption + replay check' },
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
        When an unauthenticated request arrives, the middleware responds with HTTP 402 and includes payment terms.
        For <Strong>x402</Strong>, this is a JSON body with the <Code>PAYMENT-REQUIRED</Code> header.
        For <Strong>MPP</Strong>, the challenge is in the <Code>WWW-Authenticate: Payment</Code> header.
        Both contain the same information: price, address, network, and facilitator URL.
      </Paragraph>

      <Callout type="info">
        CipherPay verifies payments using your viewing key (UFVK) via trial decryption — the same mechanism
        used for invoice detection. The sender&apos;s identity remains fully private.
      </Callout>

      <SectionDivider />

      <SectionTitle>Replay protection</SectionTitle>
      <Paragraph>
        Every transaction ID is tracked per-merchant. Once a txid has been used to verify a payment, it cannot be
        reused to gain access again. The verify endpoint returns <Code>{'"valid": false'}</Code> with
        reason <Code>&quot;already_used&quot;</Code> for duplicate txids.
      </Paragraph>
      <Callout type="tip">
        Replay protection is automatic — no configuration needed. The middleware handles it transparently.
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

app.use('/api/premium', zcashPaywall({
  amount: 0.001,          // ZEC per request
  address: 'u1abc...',    // Your Zcash Unified Address
  apiKey: 'cpay_sk_...',  // CipherPay API key
}));

app.get('/api/premium/data', (req, res) => {
  res.json({ temperature: 18, conditions: 'partly cloudy' });
});`} />
      <Paragraph>
        The middleware handles all three protocols automatically: returns 402 challenges for x402 and MPP clients,
        validates session bearer tokens, verifies payment txids, and enforces replay protection.
      </Paragraph>

      <Callout type="tip">
        For dynamic pricing, use the <Code>getAmount</Code> option instead of a static <Code>amount</Code>.
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

      <SectionTitle>Prepaid sessions</SectionTitle>
      <Paragraph>
        For agents that make many requests, paying per-call is expensive and slow. Sessions let an agent
        <Strong> deposit ZEC once</Strong>, receive a bearer token, and use it for subsequent requests —
        with the balance deducted automatically per-request.
      </Paragraph>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { n: '1', label: 'Agent prepares session', sub: 'POST /api/sessions/prepare' },
          { n: '2', label: 'Agent deposits ZEC', sub: 'Send to the returned address' },
          { n: '3', label: 'Agent opens session', sub: 'POST /api/sessions/open with session_request_id' },
          { n: '4', label: 'CipherPay confirms', sub: 'Returns bearer token (cps_...)' },
          { n: '5', label: 'Agent uses token', sub: 'Authorization: Bearer cps_...' },
          { n: '6', label: 'Balance deducted', sub: 'Per-request, atomically' },
        ].map(s => (
          <div key={s.n} style={{ textAlign: 'center', padding: '14px 10px', background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cp-cyan)', marginBottom: 4 }}>{s.n}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cp-text)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: 'var(--cp-text-dim)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <Paragraph>
        First, call <Code>POST /api/sessions/prepare</Code> with the merchant&apos;s API key to get a unique deposit address
        and a <Code>session_request_id</Code>. Send ZEC to that address, then call <Code>POST /api/sessions/open</Code> with
        the <Code>session_request_id</Code> and the <Code>txid</Code>. Minimum deposit is 10,000 zatoshis (0.0001 ZEC).
        The bearer token is returned once the deposit is detected, and expires after the configured TTL (default 24h).
      </Paragraph>
      <Callout type="warning">
        The legacy memo-based session flow (<Code>merchant_id</Code> in the open request) is deprecated and will be
        removed in a future version. Always use <Code>session_request_id</Code> from the prepare endpoint.
      </Callout>

      <Callout type="info">
        Sessions are managed via the MCP server tools (<Code>open_session</Code>, <Code>get_session_status</Code>,
        <Code>close_session</Code>) or the REST API directly. The middleware validates session tokens automatically.
      </Callout>

      <Expandable title="Session API endpoints">
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          <Strong>POST /api/sessions/prepare</Strong> — Prepare a session deposit. Returns a unique <Code>deposit_address</Code> and <Code>session_request_id</Code>. Body: <Code>merchant_id</Code>, <Code>deposit_amount_zats</Code>, <Code>cost_per_request_zats</Code>.<br />
          <Strong>POST /api/sessions/open</Strong> — Open a session after deposit. Body: <Code>txid</Code>, <Code>session_request_id</Code>, <Code>refund_address</Code> (optional).<br />
          <Strong>GET /api/sessions/validate</Strong> — Validate a session token and deduct balance. Token must be sent via <Code>Authorization: Bearer</Code> header (query-string tokens are not supported).<br />
          <Strong>GET /api/sessions/{'{id}'}/status</Strong> — Check session status, balance, and request count. Requires merchant auth.<br />
          <Strong>POST /api/sessions/{'{id}'}/close</Strong> — Close a session early. Remaining balance tracked for refund. Requires merchant auth.<br />
          <Strong>GET /api/merchants/me/sessions</Strong> — List all sessions for your merchant account.
        </div>
      </Expandable>

      <Expandable title="Session response headers">
        <Paragraph>
          When a valid session token is used, the middleware adds these response headers:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          <Code>X-Session-Id</Code> — The session identifier<br />
          <Code>X-Session-Balance</Code> — Remaining balance in zatoshis after this request
        </div>
        <Paragraph>
          If the session is expired, depleted, or invalid, the middleware falls through to a 402 payment challenge,
          prompting the agent to open a new session or pay per-request.
        </Paragraph>
      </Expandable>

      <SectionDivider />

      <SectionTitle>Setup guide</SectionTitle>
      <Step n={1} title="Register with CipherPay">
        <Paragraph>
          If you already have a CipherPay merchant account, use your existing API key.
          If not, <a href="/dashboard/register" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>register here</a> with
          your UFVK. You&apos;ll get an API key (<Code>cpay_sk_...</Code>) to authenticate verification requests.
        </Paragraph>
        <Paragraph>
          For agent integrations, mint a <Strong>restricted key</Strong> (<Code>cpay_rk_...</Code>) from
          Dashboard → Settings → Scoped Keys. Restricted keys can verify x402, manage sessions, and
          create invoices but cannot change account settings or revoke other keys — much safer to hand
          to an AI agent. See <Strong>Reference → API Keys</Strong>.
        </Paragraph>
      </Step>

      <Step n={2} title="Return 402 from your server">
        <Paragraph>
          When your API receives a request without valid credentials, respond with HTTP 402.
          The middleware returns both x402 and MPP headers automatically:
        </Paragraph>
        <CodeBlock lang="json" code={`{
  "x402Version": 2,
  "resource": { "url": "/api/data" },
  "accepts": [{
    "scheme": "exact",
    "network": "zcash:mainnet",
    "asset": "ZEC",
    "amount": "100000",
    "payTo": "u1yourpaymentaddress...",
    "maxTimeoutSeconds": 120,
    "extra": {}
  }]
}`} />
        <Paragraph>
          MPP clients receive the same terms via the <Code>WWW-Authenticate: Payment</Code> header:
        </Paragraph>
        <CodeBlock lang="text" code={`WWW-Authenticate: Payment scheme="exact", network="zcash:mainnet",
  asset="ZEC", amount="100000", payTo="u1yourpaymentaddress...",
  facilitator="https://api.cipherpay.app/api/x402/verify"`} />
      </Step>

      <Step n={3} title="Verify the payment">
        <Paragraph>
          When the agent retries with a payment credential (either <Code>PAYMENT-SIGNATURE</Code> or <Code>Authorization: Payment</Code>),
          call the CipherPay verify endpoint:
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
          If <Code>valid</Code> is <Code>true</Code>, the payment is confirmed. If <Code>false</Code>,
          the response includes a <Code>reason</Code> field (<Code>insufficient_amount</Code>, <Code>not_found</Code>,
          <Code>already_used</Code>, etc.).
        </Paragraph>
      </Step>

      <SectionDivider />

      <SectionTitle>Middleware example</SectionTitle>
      <Paragraph>
        A minimal Express.js server with the full agentic payment flow — x402, MPP, sessions, and replay protection:
      </Paragraph>
      <CodeBlock lang="typescript" code={`import express from 'express';
import { zcashPaywall } from '@cipherpay/x402/express';

const app = express();

app.use('/api/premium', zcashPaywall({
  amount: 0.001,
  address: 'u1youraddress...',
  apiKey: process.env.CIPHERPAY_API_KEY,
}));

app.get('/api/premium/data', (req, res) => {
  res.json({ message: 'You paid for this!' });
});`} />

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
              { method: 'POST', path: '/api/x402/verify', auth: 'API Key', desc: 'Verify a shielded ZEC payment by txid (replay-protected)' },
              { method: 'GET', path: '/api/merchants/me/x402/history', auth: 'API Key / Session', desc: 'List past payment verifications (x402 + MPP)' },
              { method: 'POST', path: '/api/sessions/prepare', auth: 'None', desc: 'Prepare a session: get a unique deposit address and session_request_id' },
              { method: 'POST', path: '/api/sessions/open', auth: 'None', desc: 'Open a session after deposit (requires session_request_id + txid)' },
              { method: 'GET', path: '/api/sessions/validate', auth: 'Bearer token', desc: 'Validate session token and deduct balance (header only, no query tokens)' },
              { method: 'GET', path: '/api/sessions/{id}/status', auth: 'API Key / Session', desc: 'Check session balance and usage' },
              { method: 'POST', path: '/api/sessions/{id}/close', auth: 'API Key / Session', desc: 'Close session, track remaining balance for refund' },
              { method: 'GET', path: '/api/merchants/me/sessions', auth: 'API Key / Session', desc: 'List all sessions for your merchant' },
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
          <Code>reason</Code> — Present only when <Code>valid</Code> is <Code>false</Code> (e.g. <Code>already_used</Code>, <Code>insufficient_amount</Code>)<br />
          <Code>protocol</Code> — Which protocol was used: <Code>x402</Code> or <Code>mpp</Code>
        </div>
        <Callout type="info">
          A 0.5% slippage tolerance is applied to account for wallet rounding and network fees.
        </Callout>
      </Expandable>

      <SectionDivider />

      <SectionTitle>Verification history</SectionTitle>
      <Paragraph>
        All verification calls are logged and accessible via the dashboard (Agentic Payments tab) or the history endpoint.
        Each entry shows which protocol was used (x402 or MPP), the amount, and the verification result.
      </Paragraph>
      <CodeBlock lang="bash" code={`curl https://api.cipherpay.app/api/merchants/me/x402/history \\
  -H "Authorization: Bearer cpay_sk_YOUR_KEY"`} />
      <Paragraph>
        Returns a paginated list with <Code>?limit=</Code> and <Code>?offset=</Code> query parameters (max 200 per page).
      </Paragraph>

      <Callout type="tip">
        Payment verification is free. CipherPay makes money from invoice-based payment processing — agentic payment
        verification is provided to drive Zcash adoption for AI and programmatic payments.
      </Callout>

      <SectionDivider />

      <SectionTitle>Agent discovery</SectionTitle>
      <Paragraph>
        CipherPay exposes a <Code>/.well-known/payment</Code> endpoint for agent discovery.
        AI agents can query this URL to learn that a merchant supports Zcash payments via CipherPay,
        and which protocols (x402, MPP) are available.
      </Paragraph>
      <CodeBlock lang="bash" code={`curl https://api.cipherpay.app/.well-known/payment`} />
      <Paragraph>
        This follows the emerging pattern of machine-readable payment metadata at well-known paths,
        letting agents auto-discover payment capabilities without human configuration.
      </Paragraph>
    </>
  );
}
