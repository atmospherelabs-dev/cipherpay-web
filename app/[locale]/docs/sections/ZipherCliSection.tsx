'use client';

import { Code, CodeBlock, Step, Callout, SectionDivider, Paragraph, SectionTitle, Strong, Expandable } from '../components/DocComponents';

export default function ZipherCliSection() {
  return (
    <>

      <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: '3px 8px', borderRadius: 3, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 12 }}>
        EARLY BETA
      </div>

      <Paragraph>
        <Strong>@cipherpay/zipher-cli</Strong> is a headless Zcash light wallet built for AI agents.
        It runs locally, manages keys, syncs with the network, and can pay for APIs autonomously —
        handling x402, MPP, and CipherPay sessions out of the box.
      </Paragraph>

      <Callout type="info">
        The CLI is the agent-side counterpart to <Code>@cipherpay/x402</Code> (merchant middleware).
        While the middleware protects your API, zipher-cli lets agents interact with paywalled APIs.
      </Callout>

      <SectionDivider />

      <SectionTitle>Install</SectionTitle>
      <CodeBlock lang="bash" code={`npm install -g @cipherpay/zipher-cli`} />
      <Paragraph>
        Or run directly without installing:
      </Paragraph>
      <CodeBlock lang="bash" code={`npx @cipherpay/zipher-cli`} />

      <SectionDivider />

      <SectionTitle>Quick start</SectionTitle>

      <Step n={1} title="Create a wallet">
        <CodeBlock lang="bash" code={`zipher-cli wallet create`} />
        <Paragraph>
          Generates a new Zcash wallet with a seed phrase. The seed is stored in platform secure storage.
          Write down the backup phrase — it&apos;s the only way to recover your wallet.
        </Paragraph>
      </Step>

      <Step n={2} title="Sync with the network">
        <CodeBlock lang="bash" code={`zipher-cli sync start`} />
        <Paragraph>
          Downloads and scans the Zcash blockchain. First sync takes a few minutes.
          Check progress with <Code>zipher-cli sync status</Code>.
        </Paragraph>
      </Step>

      <Step n={3} title="Pay for a paywalled API">
        <CodeBlock lang="bash" code={`zipher-cli pay https://api.example.com/premium/data`} />
        <Paragraph>
          The <Code>pay</Code> command auto-detects whether the server uses x402 or MPP, sends a shielded
          ZEC payment, and retries the request with the payment credential. The response data is printed to stdout.
        </Paragraph>
      </Step>

      <SectionDivider />

      <SectionTitle>Sessions (prepaid credit)</SectionTitle>
      <Paragraph>
        For high-frequency API access, open a session instead of paying per-request:
      </Paragraph>

      <CodeBlock lang="bash" code={`# Open a session with a 0.01 ZEC deposit
zipher-cli session open \\
  --merchant abc123 \\
  --deposit 0.01 \\
  --cost-per-request 1000

# Use the session token for subsequent requests
zipher-cli session request \\
  --url https://api.example.com/premium/data

# Check balance
zipher-cli session list

# Close and get remaining balance refunded
zipher-cli session close --id ses_abc123`} />

      <Callout type="tip">
        Session deposits require a memo in the format <Code>{'zipher:session:{merchant_id}'}</Code>.
        The CLI handles this automatically.
      </Callout>

      <SectionDivider />

      <SectionTitle>x402 commands</SectionTitle>
      <Paragraph>
        For more control over the x402 flow, use the two-step propose/pay commands:
      </Paragraph>
      <CodeBlock lang="bash" code={`# Step 1: Get the 402 challenge
zipher-cli x402 propose https://api.example.com/premium/data

# Step 2: Pay and retry
zipher-cli x402 pay --txid <txid>`} />

      <SectionDivider />

      <SectionTitle>Core commands</SectionTitle>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>COMMAND</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            {[
              { cmd: 'wallet create', desc: 'Create a new wallet with seed phrase' },
              { cmd: 'wallet restore', desc: 'Restore wallet from seed phrase' },
              { cmd: 'sync start', desc: 'Start syncing with the Zcash network' },
              { cmd: 'balance', desc: 'Show wallet balance' },
              { cmd: 'address', desc: 'Show your Unified Address' },
              { cmd: 'pay <url>', desc: 'Pay for a paywalled API (auto-detects x402/MPP)' },
              { cmd: 'session open', desc: 'Open a prepaid session with ZEC deposit' },
              { cmd: 'session request', desc: 'Make a request using session token' },
              { cmd: 'session list', desc: 'List active sessions' },
              { cmd: 'session close', desc: 'Close a session' },
              { cmd: 'send propose', desc: 'Propose a ZEC transaction (two-step send)' },
              { cmd: 'send confirm', desc: 'Confirm and broadcast a proposed transaction' },
              { cmd: 'policy show', desc: 'Show spending policy (limits, allowlist)' },
              { cmd: 'policy set', desc: 'Set spending limits' },
              { cmd: 'audit', desc: 'View transaction audit log' },
              { cmd: 'daemon start', desc: 'Start background daemon (IPC socket)' },
            ].map(c => (
              <tr key={c.cmd} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                <td style={{ padding: '8px 12px' }}><Code>{c.cmd}</Code></td>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{c.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionDivider />

      <SectionTitle>Flags</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
        <Code>--testnet</Code> — Use testnet instead of mainnet<br />
        <Code>--data-dir &lt;path&gt;</Code> — Custom data directory<br />
        <Code>--human</Code> — Human-readable output (vs JSON default)
      </div>

      <Expandable title="Spending policy">
        <Paragraph>
          The spending policy controls how much the agent can spend without human approval.
          This is critical for autonomous operation — set limits before giving an agent access.
        </Paragraph>
        <CodeBlock lang="bash" code={`# Set a per-transaction limit
zipher-cli policy set --max-per-tx 0.01

# Add an address to the allowlist
zipher-cli policy add-allowlist u1merchant...

# View current policy
zipher-cli policy show`} />
      </Expandable>

      <SectionDivider />

      <SectionTitle>CipherPay merchant tools</SectionTitle>
      <Paragraph>
        Agents can create and manage CipherPay invoices directly via MCP or CLI.
        Set <Code>CIPHERPAY_API_KEY</Code> to your merchant API key.
      </Paragraph>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>MCP TOOL</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            {[
              { cmd: 'cipherpay_create_invoice', desc: 'Create an invoice (product name, amount, currency)' },
              { cmd: 'cipherpay_check_invoice', desc: 'Check invoice status, received amount, txid' },
              { cmd: 'cipherpay_balance', desc: 'Merchant stats: total ZEC received, confirmed count' },
            ].map(c => (
              <tr key={c.cmd} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                <td style={{ padding: '8px 12px' }}><Code>{c.cmd}</Code></td>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{c.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionDivider />

      <SectionTitle>Links</SectionTitle>
      <div style={{ fontSize: 11, lineHeight: 2.2, color: 'var(--cp-text-dim)' }}>
        <a href="https://zipher.to" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>zipher.to</a> — product page &amp; download<br />
        <a href="https://www.npmjs.com/package/@cipherpay/zipher-cli" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>@cipherpay/zipher-cli on npm</a><br />
        <a href="https://github.com/atmospherelabs-dev/zipher-app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>Source on GitHub</a>
      </div>
    </>
  );
}
