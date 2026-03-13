'use client';

import { Code, CodeBlock, Step, Callout, SectionDivider, Paragraph, SectionTitle, Strong, Expandable } from '../components/DocComponents';

export default function SandboxSection() {
  return (
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
  );
}
