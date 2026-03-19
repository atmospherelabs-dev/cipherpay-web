'use client';

import { Code, CodeBlock, Step, Callout, SectionDivider, Paragraph, SectionTitle, Strong, Expandable } from '../components/DocComponents';

export default function MCPSection() {
  return (
    <>
      <Paragraph>
        The <Strong>@cipherpay/mcp</Strong> package is an MCP (Model Context Protocol) server that lets AI agents
        create Zcash invoices, check payment statuses, verify shielded payments, and look up exchange rates —
        all as native tool calls. Works with Claude Desktop, Cursor, and any MCP-compatible client.
      </Paragraph>

      <Callout type="info">
        MCP is an open standard by Anthropic that lets AI assistants call external tools securely.
        The CipherPay MCP server runs locally on your machine and makes authenticated API calls on behalf of your AI agent.
      </Callout>

      <SectionTitle>Architecture</SectionTitle>
      <CodeBlock lang="text" code={`AI Assistant (Claude, Cursor, OpenClaw)
       │
       │  stdio (local, JSON-RPC)
       ▼
  @cipherpay/mcp (local process)
       │
       │  HTTPS (your API key)
       ▼
  api.cipherpay.app`} />
      <Paragraph>
        Your API key stays on your machine. The MCP server is a thin bridge — it translates tool calls
        into CipherPay REST API requests and returns structured results to your AI assistant.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>Install</SectionTitle>
      <CodeBlock lang="bash" code={`npm install -g @cipherpay/mcp`} />
      <Paragraph>
        Or run directly without installing:
      </Paragraph>
      <CodeBlock lang="bash" code={`npx @cipherpay/mcp`} />

      <SectionDivider />

      <SectionTitle>Setup</SectionTitle>

      <Step n={1} title="Claude Desktop">
        <Paragraph>
          Add to <Code>~/Library/Application Support/Claude/claude_desktop_config.json</Code>:
        </Paragraph>
        <CodeBlock lang="json" code={`{
  "mcpServers": {
    "cipherpay": {
      "command": "npx",
      "args": ["@cipherpay/mcp"],
      "env": {
        "CIPHERPAY_API_KEY": "cpay_sk_your_api_key_here"
      }
    }
  }
}`} />
      </Step>

      <Step n={2} title="Cursor">
        <Paragraph>
          Go to Settings &gt; Tools &amp; MCP &gt; Add Custom MCP. This opens your <Code>mcp.json</Code>. Paste:
        </Paragraph>
        <CodeBlock lang="json" code={`{
  "mcpServers": {
    "cipherpay": {
      "command": "npx",
      "args": ["@cipherpay/mcp"],
      "env": {
        "CIPHERPAY_API_KEY": "cpay_sk_your_api_key_here"
      }
    }
  }
}`} />
        <Paragraph>
          Save, then reload the window (<Code>Cmd+Shift+P</Code> &gt; &quot;Reload Window&quot;). CipherPay should appear
          in the Installed MCP Servers list with a green status.
        </Paragraph>
      </Step>

      <SectionDivider />

      <SectionTitle>Environment variables</SectionTitle>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>VARIABLE</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>REQUIRED</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            {[
              { var: 'CIPHERPAY_API_KEY', required: 'For invoices + x402', desc: 'Your CipherPay API key (cpay_sk_...)' },
              { var: 'CIPHERPAY_API_URL', required: 'No', desc: 'API URL (default: https://api.cipherpay.app)' },
            ].map(row => (
              <tr key={row.var} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                <td style={{ padding: '8px 12px' }}><Code>{row.var}</Code></td>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)', fontSize: 10 }}>{row.required}</td>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{row.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout type="tip">
        Tools that don&apos;t require authentication (<Code>get_exchange_rates</Code>, <Code>get_invoice_status</Code>, <Code>get_product_info</Code>)
        work without an API key.
      </Callout>

      <SectionDivider />

      <SectionTitle>Tools</SectionTitle>
      <Paragraph>
        Five tools are available to the AI agent:
      </Paragraph>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {[
          {
            name: 'create_invoice',
            auth: true,
            desc: 'Create a Zcash payment invoice. Returns a payment address, ZIP-321 URI, amount in ZEC, and expiry time.',
            example: '"Create an invoice for $25 USD"',
          },
          {
            name: 'get_invoice_status',
            auth: false,
            desc: 'Check if an invoice has been paid. Returns: pending, detected, confirmed, expired, or cancelled.',
            example: '"Has invoice CP-1234 been paid?"',
          },
          {
            name: 'get_exchange_rates',
            auth: false,
            desc: 'Get current ZEC exchange rates against fiat currencies (USD, EUR, BRL, GBP, etc.).',
            example: '"What\'s the current ZEC price?"',
          },
          {
            name: 'verify_x402_payment',
            auth: true,
            desc: 'Verify a shielded Zcash payment by transaction ID. For x402 resource servers that need to confirm a payment.',
            example: '"Verify that tx abc123... paid 0.001 ZEC"',
          },
          {
            name: 'get_product_info',
            auth: false,
            desc: 'Get details about a CipherPay product including name, description, and available prices.',
            example: '"Show me the details for product premium-api"',
          },
        ].map(tool => (
          <div key={tool.name} style={{ padding: '12px 14px', background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Code>{tool.name}</Code>
              <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: tool.auth ? 'rgba(6,182,212,0.1)' : 'rgba(16,185,129,0.1)', color: tool.auth ? 'var(--cp-cyan)' : 'var(--cp-green)', border: `1px solid ${tool.auth ? 'rgba(6,182,212,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                {tool.auth ? 'API KEY' : 'NO AUTH'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginBottom: 4 }}>{tool.desc}</div>
            <div style={{ fontSize: 10, color: 'var(--cp-text-muted)', fontStyle: 'italic' }}>{tool.example}</div>
          </div>
        ))}
      </div>

      <SectionDivider />

      <SectionTitle>Resources</SectionTitle>
      <Paragraph>
        MCP resources provide read-only data that AI agents can access without a tool call:
      </Paragraph>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cp-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>URI</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cp-text-muted)', fontWeight: 600, fontSize: 10 }}>DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            {[
              { uri: 'cipherpay://rates', desc: 'Live ZEC exchange rates against fiat currencies' },
              { uri: 'cipherpay://invoice/{id}', desc: 'Invoice details by ID or memo code' },
            ].map(r => (
              <tr key={r.uri} style={{ borderBottom: '1px solid var(--cp-border)' }}>
                <td style={{ padding: '8px 12px' }}><Code>{r.uri}</Code></td>
                <td style={{ padding: '8px 12px', color: 'var(--cp-text-dim)' }}>{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionDivider />

      <SectionTitle>Example flows</SectionTitle>

      <Expandable title="Create and monitor a payment" defaultOpen>
        <Paragraph>Ask your AI assistant:</Paragraph>
        <CodeBlock lang="text" code={`"Create an invoice for $10 USD for 'API Access'"`} />
        <Paragraph>The agent calls <Code>create_invoice</Code> and returns:</Paragraph>
        <CodeBlock lang="text" code={`Invoice created: CP-4821

Amount: 10.00 USD (0.00234 ZEC)
Rate: 1 ZEC = 4273.50 USD
Payment address: u1abc...
Invoice ID: 8f3a2b1c-...
Expires: 2026-03-17T15:30:00Z

Payment URI (for wallets):
zcash:u1abc...?amount=0.00234&memo=...

Use get_invoice_status with invoice_id "8f3a2b1c-..." to check payment progress.`} />
        <Paragraph>After the customer pays, ask:</Paragraph>
        <CodeBlock lang="text" code={`"Has invoice CP-4821 been paid?"`} />
        <CodeBlock lang="text" code={`Invoice status: CONFIRMED
Payment confirmed on the Zcash blockchain.
Transaction: 7f3a9b...
Received: 0.00234 ZEC (expected: 0.00234 ZEC)`} />
      </Expandable>

      <Expandable title="Check ZEC exchange rates">
        <CodeBlock lang="text" code={`"What's the current ZEC price?"`} />
        <CodeBlock lang="text" code={`Current ZEC exchange rates:

1 ZEC = 4273.50 USD
1 ZEC = 3912.80 EUR
1 ZEC = 21450.00 BRL
1 ZEC = 3380.20 GBP
...`} />
      </Expandable>

      <SectionDivider />

      <SectionTitle>Links</SectionTitle>
      <div style={{ fontSize: 11, lineHeight: 2.2, color: 'var(--cp-text-dim)' }}>
        <a href="https://www.npmjs.com/package/@cipherpay/mcp" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>@cipherpay/mcp on npm</a><br />
        <a href="https://github.com/atmospherelabs-dev/cipherpay-mcp" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>Source on GitHub</a><br />
        <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>Model Context Protocol spec</a>
      </div>
    </>
  );
}
