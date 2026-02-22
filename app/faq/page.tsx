import { Logo } from '@/components/Logo';
import { NavLinks } from '@/components/NavLinks';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ — CipherPay',
  description: 'Frequently asked questions about CipherPay, privacy, security, and self-hosting.',
};

const sections = [
  {
    id: '01',
    title: 'Privacy Model',
    questions: [
      {
        q: 'Is CipherPay truly private?',
        a: `CipherPay uses Zcash shielded transactions exclusively. On the blockchain, all payments are fully encrypted — no outside observer can see the sender, receiver, amount, or memo. However, CipherPay (as the payment processor) does see the transaction details because it performs trial decryption using your viewing key. This is the same trade-off as any payment processor: Stripe sees your transactions too. The difference is that the blockchain layer is completely dark.`,
      },
      {
        q: 'What data does CipherPay have access to?',
        a: `When using the hosted service, CipherPay can see: your Unified Full Viewing Key (read-only, cannot spend funds), payment amounts, and product names. We cannot see the buyer's wallet balance, other transactions, or identity. We never hold your ZEC — payments go directly to your shielded address. No shipping addresses or buyer PII are stored.`,
      },
      {
        q: 'How do I get maximum privacy?',
        a: `Self-host CipherPay. The entire codebase is open-source. When you run your own instance, only your server holds the viewing key, and CipherPay (the company) sees nothing. You get the same features — mempool scanning, trial decryption, webhooks — with zero third-party data exposure.`,
      },
      {
        q: 'Can CipherPay spend my funds?',
        a: `No. CipherPay uses a Unified Full Viewing Key (UFVK), which is read-only. It can detect incoming payments but cannot create transactions or move your ZEC. Your spending keys never leave your wallet.`,
      },
    ],
  },
  {
    id: '02',
    title: 'Wallet Security',
    questions: [
      {
        q: 'Should I use my personal wallet for my store?',
        a: `No. Generate a dedicated wallet exclusively for your CipherPay store. This isolates your commercial transaction history from your personal finances. If the server is ever compromised, an attacker would only see your store's sales history, not your personal net worth or other transactions. Sweep funds from your store wallet to cold storage regularly.`,
      },
      {
        q: 'What is the recommended wallet setup?',
        a: `1. Create a brand new wallet (using Zingo, YWallet, or zcashd) dedicated to your store.\n2. Export the Unified Full Viewing Key (UFVK) from that wallet.\n3. Use that UFVK when registering on CipherPay.\n4. Periodically sweep received funds to your main cold storage wallet.\n5. Never reuse this wallet for personal transactions.`,
      },
      {
        q: 'Can I change my payment address?',
        a: `Yes. You can update your payment address anytime from the dashboard settings. For security, this requires re-entering your dashboard token. New invoices will use the new address. Existing pending invoices keep the address they were created with.`,
      },
      {
        q: 'Can I change my viewing key (UFVK)?',
        a: `Not in the current version. Changing the UFVK requires the scanner to keep the old key active until all pending invoices are resolved. For now, if you need to rotate your viewing key, create a new merchant account. UFVK rotation is planned for a future release.`,
      },
    ],
  },
  {
    id: '03',
    title: 'How It Works',
    questions: [
      {
        q: 'How does CipherPay detect payments?',
        a: `Each invoice gets a unique payment address derived from your viewing key (UFVK). CipherPay scans the Zcash mempool and new blocks, performing Orchard trial decryption on shielded transactions. When a payment is detected to an invoice's unique address, it is automatically matched — no memo required. This provides sub-minute payment detection, often within seconds.`,
      },
      {
        q: 'What is the reference code (e.g. CP-C6CDB775)?',
        a: `Each invoice gets a reference code for identification purposes. It is included in the Zcash URI as an informational memo, but payment detection does not depend on it. CipherPay matches payments by their unique cryptographic address, so the buyer just scans the QR code and sends — nothing to copy or type.`,
      },
      {
        q: 'What happens if the buyer sends the wrong amount?',
        a: `CipherPay accepts payments within 0.5% of the invoice price to account for wallet rounding and network fee differences. If a payment is significantly underpaid, it is ignored and the invoice remains pending. The buyer would need to send the correct amount.`,
      },
      {
        q: 'How long do invoices last?',
        a: `By default, 30 minutes. This window locks the ZEC/EUR exchange rate at the time of invoice creation, protecting both the merchant and buyer from price volatility. If the invoice expires, a new one must be created (with a fresh rate).`,
      },
    ],
  },
  {
    id: '04',
    title: 'Security',
    questions: [
      {
        q: 'How is authentication handled?',
        a: `Merchants authenticate via a dashboard token (cpay_dash_...) exchanged for an HttpOnly session cookie. The token is hashed with SHA-256 before storage — a database breach doesn't leak credentials. Sessions use Secure + SameSite=Lax cookies, preventing XSS cookie theft and CSRF attacks. API keys (cpay_sk_...) are also SHA-256 hashed and used for server-to-server integrations.`,
      },
      {
        q: 'What protections exist against payment exploits?',
        a: `The "penny exploit" (sending 0.00001 ZEC to trigger a confirmation) is blocked by server-side amount verification with a 0.5% slippage tolerance. Webhooks use HMAC-SHA256 signatures with timestamps, preventing both forgery and replay attacks (5-minute replay window). Changing the payment address requires re-authentication with your dashboard token.`,
      },
      {
        q: 'Does CipherPay store buyer personal data?',
        a: `No. CipherPay does not collect or store shipping addresses, names, or any buyer PII. It is a pure payment processor. Merchants who need shipping information should collect it through their own store and integrate with CipherPay via webhooks for payment confirmation.`,
      },
      {
        q: 'What are the Content Security Policy headers?',
        a: `The Next.js frontend enforces strict CSP: default-src 'self', frame-ancestors 'none' (prevents clickjacking), form-action 'self', and connect-src scoped to the API domain. X-Frame-Options, X-Content-Type-Options, and a strict Referrer-Policy are also set.`,
      },
    ],
  },
  {
    id: '05',
    title: 'Self-Hosting & Pricing',
    questions: [
      {
        q: 'Can I self-host CipherPay?',
        a: `Yes. CipherPay is fully open-source. Clone the repository, configure your environment variables (UFVK, CipherScan API URL, database), and run the Rust binary. It works with SQLite for local development or PostgreSQL for production.`,
      },
      {
        q: 'What do I need to self-host?',
        a: `A server with Rust installed (or use the Docker image), access to a CipherScan API instance (public testnet/mainnet endpoints work), and a Zcash wallet to generate your UFVK. The minimum requirements are modest — the Rust binary is lightweight.`,
      },
      {
        q: 'Is CipherPay free?',
        a: `The current version is free for all users. Subscription tiers with rate limits and premium features are planned for the future. Self-hosting will always remain free.`,
      },
      {
        q: 'Will there be transaction fees?',
        a: `No. CipherPay does not take a percentage of your sales. The planned monetization model is a flat subscription fee for the hosted service. Your revenue is your revenue.`,
      },
      {
        q: 'Can I pay for CipherPay with ZEC?',
        a: `That's the plan. When subscription tiers launch, you'll be able to pay for your CipherPay subscription using CipherPay itself — fully shielded ZEC payments. Dogfooding at its finest.`,
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <Link href="/"><Logo size="md" /></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NavLinks />
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Frequently Asked Questions</h1>
        <p style={{ color: 'var(--cp-text-muted)', fontSize: 12, marginBottom: 40 }}>
          Privacy model, security practices, and how CipherPay works under the hood.
        </p>

        {sections.map((section) => (
          <div key={section.id} style={{ marginBottom: 40 }}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{section.id} // {section.title}</span>
              </div>

              {section.questions.map((item, i) => (
                <div key={i} style={{ padding: '16px 18px', borderBottom: i < section.questions.length - 1 ? '1px solid var(--cp-border)' : 'none' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cp-text)', marginBottom: 8 }}>
                    {item.q}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      <footer style={{ borderTop: '1px solid var(--cp-border)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--cp-text-muted)' }}>
          <Logo size="sm" />
          <span>Powered by CipherScan</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 10 }}>
          <Link href="/" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>Home</Link>
          <a href="https://cipherscan.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>CipherScan</a>
        </div>
      </footer>
    </div>
  );
}
