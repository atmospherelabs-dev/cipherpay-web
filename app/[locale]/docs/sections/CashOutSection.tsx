'use client';

import { Code, CodeBlock, Callout, SectionDivider, Paragraph, SectionTitle, Strong, Expandable } from '../components/DocComponents';

export default function CashOutSection() {
  return (
    <>
      <Paragraph>
        CipherPay is <Strong>non-custodial</Strong> — your ZEC goes directly to your wallet, never through us.
        When you&apos;re ready to convert ZEC to fiat (USD, EUR, etc.), you use an external off-ramp service.
        CipherPay helps you find the right one.
      </Paragraph>

      <Callout type="info">
        CipherPay does not hold, custody, or move your funds at any point. The &quot;Cash Out&quot; tab
        in your dashboard links to third-party services. You control the full process from your own wallet.
      </Callout>

      <SectionDivider />

      <SectionTitle>Dashboard</SectionTitle>
      <Paragraph>
        Open <Strong>Dashboard &rarr; Cash Out</Strong> to see your total received ZEC, current fiat value,
        and available off-ramp options. The balance shown is informational — it reflects confirmed payments,
        not a balance held by CipherPay.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>Off-ramp options</SectionTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        <div style={{ padding: '14px 16px', background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: 'var(--cp-cyan)' }}>Zipher CLI</span>
            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'rgba(16,185,129,0.1)', color: 'var(--cp-green)', border: '1px solid rgba(16,185,129,0.2)' }}>
              RECOMMENDED
            </span>
          </div>
          <Paragraph>
            <Code>@cipherpay/zipher-cli</Code> includes built-in cross-chain swaps via NEAR Intents.
            Swap ZEC to USDC, SOL, or ETH in one command. Zipher wallets use the OWS standard,
            so you already have EVM wallet addresses (Base, Ethereum) derived from the same seed.
          </Paragraph>
          <CodeBlock lang="bash" code={`# Swap ZEC to USDC on Base
zipher swap quote --to USDC --amount 0.5
zipher swap execute --to USDC --amount 0.5 --destination <your-base-address>

# Then off-ramp USDC to fiat via any CEX or P2P service`} />
        </div>

        <div style={{ padding: '14px 16px', background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 6 }}>
          <Strong>Loofta</Strong>
          <Paragraph>
            <a href="https://swap.loofta.xyz" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>Loofta</a> provides
            ZEC-to-fiat swaps using the Peer (ZKP2P) protocol. Send ZEC, receive fiat directly to your bank account.
            No KYC required for the swap — the Peer protocol uses zero-knowledge proofs to verify fiat payment.
          </Paragraph>
        </div>

        <div style={{ padding: '14px 16px', background: 'var(--cp-bg)', border: '1px solid var(--cp-border)', borderRadius: 6 }}>
          <Strong>Peer (ZKP2P)</Strong>
          <Paragraph>
            <a href="https://peer.xyz" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>Peer</a> is a trustless
            P2P fiat settlement protocol. You deposit USDC into an escrow contract on Base, a buyer sends you fiat,
            and a ZK proof of the fiat payment releases the USDC. Use with Zipher&apos;s cross-chain swap to go ZEC &rarr; USDC &rarr; fiat.
          </Paragraph>
        </div>
      </div>

      <SectionDivider />

      <SectionTitle>How it works</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.4 }}>
        <Strong>1. Receive ZEC payments</Strong> — Customers pay to your shielded address via CipherPay checkout.<br />
        <Strong>2. Sweep to your wallet</Strong> — Your ZEC accumulates in the wallet linked to your UFVK. You control it.<br />
        <Strong>3. Swap or off-ramp</Strong> — Use Zipher CLI to swap ZEC &rarr; USDC, or use Loofta/Peer for direct ZEC &rarr; fiat.
      </div>

      <SectionDivider />

      <Expandable title="Zipher full pipeline (ZEC → fiat)">
        <Paragraph>
          For Zipher users, the full off-ramp pipeline is:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.4 }}>
          1. <Code>zipher swap execute --to USDC --amount 1.0</Code> — swaps ZEC to USDC via NEAR Intents<br />
          2. USDC arrives on your Base address (derived from the same OWS seed)<br />
          3. Deposit USDC into Peer escrow on Base<br />
          4. A buyer sends fiat to your bank account<br />
          5. PeerAuth (browser extension) generates a ZK proof of the fiat payment<br />
          6. Proof releases the USDC from escrow — settlement complete
        </div>
        <Callout type="tip">
          Since Zipher derives EVM addresses from the same seed, you don&apos;t need a separate wallet for step 2.
          The entire pipeline runs from one tool.
        </Callout>
      </Expandable>

      <Expandable title="Why no built-in off-ramp?">
        <Paragraph>
          CipherPay is designed to be non-custodial. Building a built-in fiat off-ramp would require us
          to hold funds during the swap, which contradicts our core design principle. Instead, we connect
          you to the best available options and build tooling (Zipher) that makes the process as smooth as possible.
        </Paragraph>
      </Expandable>
    </>
  );
}
