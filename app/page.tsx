import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';

const features = [
  {
    title: 'Non-Custodial',
    description:
      'Your keys, your funds. CipherPay never holds your ZEC. Payments go directly to your shielded address.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: 'Fully Shielded',
    description:
      'Every payment uses Zcash shielded transactions. No transparent addresses, no leaking metadata.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: 'Real-Time Detection',
    description:
      'Mempool scanning with trial decryption catches payments in seconds, not minutes.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
];

const codeSnippet = `curl -X POST https://api.cipherpay.app/api/invoices \\
  -H "Authorization: Bearer cpay_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{"price_eur": 29.99, "product_name": "T-Shirt"}'

# Response:
# {
#   "invoice_id": "a1b2c3...",
#   "memo_code": "CP-C6CDB775",
#   "price_zec": 0.12345678,
#   "zcash_uri": "zcash:u1...?amount=0.12345678&memo=...",
#   "payment_address": "u1...",
#   "expires_at": "2026-02-21T13:30:00Z"
# }`;

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-cp-border bg-cp-bg/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <Link href="/faq" className="text-sm text-cp-muted hover:text-cp-cyan transition-colors hidden sm:block">
              FAQ
            </Link>
            <ThemeToggle />
            <Link href="/dashboard/login" className="btn-secondary text-sm">
              Dashboard
            </Link>
            <Link href="/dashboard/register" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cp-border text-xs text-cp-muted mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cp-green" />
            Powered by CipherScan
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            Accept{' '}
            <span className="text-cp-purple">shielded</span>{' '}
            Zcash payments
          </h1>

          <p className="text-lg text-cp-muted max-w-2xl mx-auto mb-10">
            Non-custodial payment gateway with real-time mempool detection.
            Your keys, your privacy, your commerce.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard/register" className="btn-primary px-8 py-3 text-base">
              Start Accepting ZEC
            </Link>
            <a href="#how-it-works" className="btn-secondary px-8 py-3 text-base">
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-cp-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card p-6">
                <div className="w-10 h-10 rounded-lg bg-cp-cyan/10 flex items-center justify-center text-cp-cyan mb-4">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-cp-muted leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section id="how-it-works" className="py-20 px-6 border-t border-cp-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            One API call to get paid
          </h2>
          <p className="text-cp-muted text-center mb-10 max-w-xl mx-auto">
            Create an invoice, show the QR code, get a webhook when paid.
            That&apos;s it.
          </p>
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-cp-border">
              <span className="w-3 h-3 rounded-full bg-cp-red/60" />
              <span className="w-3 h-3 rounded-full bg-cp-yellow/60" />
              <span className="w-3 h-3 rounded-full bg-cp-green/60" />
              <span className="ml-2 text-xs text-cp-muted font-mono">
                terminal
              </span>
            </div>
            <pre className="p-6 overflow-x-auto text-sm leading-relaxed">
              <code className="font-mono text-cp-text">{codeSnippet}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-cp-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to accept private payments?
          </h2>
          <p className="text-cp-muted mb-8">
            Set up in under a minute. No KYC. No middleman. Just ZEC.
          </p>
          <Link href="/dashboard/register" className="btn-primary px-10 py-3 text-base">
            Create Your Merchant Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cp-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-cp-muted">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span>&middot; Powered by CipherScan</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/faq" className="hover:text-cp-cyan transition-colors">
              FAQ
            </Link>
            <a
              href="https://cipherscan.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cp-cyan transition-colors"
            >
              CipherScan
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cp-cyan transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
