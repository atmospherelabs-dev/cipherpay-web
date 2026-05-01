'use client';

import { Code, CodeBlock, Callout, SectionDivider, Paragraph, SectionTitle, Strong, Step } from '../components/DocComponents';

export default function ApiKeysSection() {
  return (
    <>
      <Paragraph>
        CipherPay supports two types of API keys: <Strong>full</Strong> keys
        (<Code>cpay_sk_...</Code>) that grant the same access as the dashboard,
        and <Strong>restricted</Strong> keys (<Code>cpay_rk_...</Code>) that can
        only do day-to-day payment operations. Use restricted keys for AI agents
        and any integration that doesn&apos;t need to change account settings.
      </Paragraph>

      <Callout type="info">
        Every account has one full key minted at registration (returned in the
        <Code> api_key</Code> field). You can mint additional full or restricted
        keys at any time from the dashboard.
      </Callout>

      <SectionDivider />

      <SectionTitle>Full vs restricted</SectionTitle>

      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>OPERATION</th>
              <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--cp-cyan)', fontWeight: 600, fontSize: 10 }}>FULL</th>
              <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--cp-warm)', fontWeight: 600, fontSize: 10 }}>RESTRICTED</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Create / read / refund invoices', true, true],
              ['x402 verify and settle', true, true],
              ['Manage agent sessions (prepare, open, deduct, close)', true, true],
              ['Create payment links', true, true],
              ['Create / cancel subscriptions', true, true],
              ['Create products and prices', true, true],
              ['Read account info (GET /merchants/me)', true, false],
              ['Update account settings (name, webhook URL, recovery email)', true, false],
              ['Rotate API keys, dashboard token, webhook secret', true, false],
              ['Manage other API keys (list, create, revoke)', true, false],
              ['Update or delete payment links', true, false],
              ['Settle billing or delete the account', true, false],
            ].map(([op, full, restricted], i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--cp-border-light)' }}>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text)', fontSize: 11 }}>{op as string}</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', color: full ? 'var(--cp-green)' : 'var(--cp-text-dim)' }}>{full ? 'YES' : '—'}</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', color: restricted ? 'var(--cp-green)' : 'var(--cp-red)' }}>{restricted ? 'YES' : 'NO'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paragraph>
        A restricted key calling a denied endpoint gets <Code>403 Forbidden</Code>{' '}
        with <Code>{'{ "code": "restricted_key_forbidden" }'}</Code>.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>Create a key</SectionTitle>

      <Step n={1} title="From the dashboard (recommended)">
        <Paragraph>
          Open <Strong>Dashboard &rarr; Settings</Strong>, scroll to <Strong>Scoped Keys</Strong>,
          click <Strong>CREATE NEW KEY</Strong>. Pick the type, give it a label
          (e.g. &quot;Claude Agent&quot;), copy the raw key when it&apos;s shown.
          The key is only displayed once.
        </Paragraph>
      </Step>

      <Step n={2} title="Via API">
        <Paragraph>
          Mint programmatically with a full key or dashboard session:
        </Paragraph>
        <CodeBlock lang="bash" code={`curl -X POST https://api.cipherpay.app/api/merchants/me/keys \\
  -H "Authorization: Bearer cpay_sk_YOUR_FULL_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "restricted",
    "label": "Claude Agent"
  }'`} />
        <Paragraph>
          Response:
        </Paragraph>
        <CodeBlock lang="json" code={`{
  "id": "mak_a1b2c3d4...",
  "key": "cpay_rk_8f3e9a...",
  "key_prefix": "cpay_rk_8f3e9a14",
  "key_type": "restricted",
  "label": "Claude Agent",
  "created_at": "2026-05-01T10:23:45Z"
}`} />
      </Step>

      <SectionDivider />

      <SectionTitle>Use the key</SectionTitle>

      <Paragraph>
        Pass the key as a Bearer token, same as a full key:
      </Paragraph>
      <CodeBlock lang="bash" code={`curl -X POST https://api.cipherpay.app/api/invoices \\
  -H "Authorization: Bearer cpay_rk_8f3e9a..." \\
  -H "Content-Type: application/json" \\
  -d '{ "amount": 9.99, "currency": "USD" }'`} />

      <Callout type="info">
        Most x402 and MCP integrations should set the restricted key in the same
        place they would a full key — they only need invoice creation and payment
        verification.
      </Callout>

      <SectionDivider />

      <SectionTitle>Revoke a key</SectionTitle>

      <Paragraph>
        From the dashboard, click <Strong>REVOKE</Strong> next to any key.
        Authentication using that key fails immediately with <Code>401</Code>.
        Existing sessions opened with that key continue until they expire on
        their own.
      </Paragraph>

      <CodeBlock lang="bash" code={`curl -X DELETE https://api.cipherpay.app/api/merchants/me/keys/mak_a1b2c3d4 \\
  -H "Authorization: Bearer cpay_sk_YOUR_FULL_KEY"`} />

      <Callout type="warning">
        You cannot revoke your last remaining full-access key — that would lock
        the API out of your account. Create a new full key first, then revoke
        the old one. The dashboard token always works as a recovery path.
      </Callout>

      <SectionDivider />

      <SectionTitle>Best practices</SectionTitle>

      <ul style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 1.8, paddingLeft: 20 }}>
        <li>Give every agent its own restricted key with a descriptive label.</li>
        <li>Rotate keys when an agent is decommissioned or a service is rotated.</li>
        <li>Never put a full key in agent prompts, system messages, or tool descriptions.</li>
        <li>Use the dashboard <Strong>Last used</Strong> column to spot keys that haven&apos;t been used in months — revoke them.</li>
        <li>Restricted keys are safe to commit to private CI secrets; full keys are not.</li>
      </ul>
    </>
  );
}
