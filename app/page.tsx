import { LogoMark } from '@/components/Logo';
import { NavLinks } from '@/components/NavLinks';
import { SmartCTA } from '@/components/SmartCTA';
import Link from 'next/link';

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
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.5 }}>
          <span style={{ color: 'var(--cp-cyan)' }}>Cipher</span>
          <span style={{ color: 'var(--cp-text)' }}>Pay</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NavLinks />
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '80px 24px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" className="hero-gradient hero-gradient-top" />
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
          <h1 className="hero-title" style={{ fontWeight: 700, letterSpacing: -1, marginBottom: 16, lineHeight: 1.1 }}>
            <span style={{ color: 'var(--cp-purple)' }}>Private</span> payments for the internet.
          </h1>

          <p style={{ fontSize: 14, color: 'var(--cp-text-muted)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.8 }}>
            Accept Zcash in minutes. Non-custodial. Zero buyer data. No middleman.
          </p>

          <div className="hero-cta">
            <SmartCTA className="btn-primary" style={{ padding: '12px 28px', fontSize: 12 }}>
              START ACCEPTING ZEC
            </SmartCTA>
            <a href="#how-it-works" className="btn" style={{ padding: '12px 28px', fontSize: 12, textDecoration: 'none' }}>
              HOW IT WORKS
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ borderTop: '1px solid var(--cp-border)', padding: '60px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="section-title" style={{ textAlign: 'center', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><LogoMark size={8} /> WHY CIPHERPAY</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">01 // Non-Custodial</span>
              </div>
              <div className="panel-body">
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                  Your keys, your funds. CipherPay never holds your ZEC. Payments go directly to your shielded address.
                </p>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">02 // Fully Shielded</span>
              </div>
              <div className="panel-body">
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                  Every payment uses Zcash shielded transactions. No transparent addresses, no leaking metadata.
                </p>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">03 // Real-Time</span>
              </div>
              <div className="panel-body">
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                  Payments are detected in seconds and confirmed within minutes. No delays, no manual checks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ borderTop: '1px solid var(--cp-border)', padding: '60px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="section-title" style={{ textAlign: 'center', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><LogoMark size={8} /> HOW IT WORKS</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>
            Three steps. Zero middlemen.
          </h2>

          <div className="panel" style={{ marginBottom: 24 }}>
            <div className="panel-body">
              <div className="step-row">
                <span style={{ color: 'var(--cp-cyan)', fontWeight: 600, whiteSpace: 'nowrap' }}>1. Register</span>
                <span style={{ color: 'var(--cp-text-muted)' }}>Provide your viewing key</span>
              </div>
              <div className="step-row">
                <span style={{ color: 'var(--cp-cyan)', fontWeight: 600, whiteSpace: 'nowrap' }}>2. Add Products</span>
                <span style={{ color: 'var(--cp-text-muted)' }}>Create your catalog in the dashboard</span>
              </div>
              <div className="step-row">
                <span style={{ color: 'var(--cp-cyan)', fontWeight: 600, whiteSpace: 'nowrap' }}>3. Get Paid</span>
                <span style={{ color: 'var(--cp-text-muted)' }}>Share links or integrate via API</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section id="how-it-works" style={{ borderTop: '1px solid var(--cp-border)', padding: '60px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="section-title" style={{ textAlign: 'center', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><LogoMark size={8} /> FOR DEVELOPERS</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>
            One API call to get paid
          </h2>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">terminal</span>
              <span className="tag">REST API</span>
            </div>
            <div style={{ padding: 18, overflow: 'auto' }}>
              <pre style={{ margin: 0, fontSize: 11, lineHeight: 1.8, color: 'var(--cp-text)' }}>
                <code>{codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section style={{ borderTop: '1px solid var(--cp-border)', padding: '60px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="section-title" style={{ textAlign: 'center', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><LogoMark size={8} /> INTEGRATIONS</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>
            Works with your stack
          </h2>

          <div className="integrations-grid">
            <div className="panel">
              <div className="panel-body">
                <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 8 }}>HOSTED CHECKOUT</div>
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                  Share a payment link. No website needed. Works from social media, email, or chat.
                </p>
              </div>
            </div>
            <div className="panel">
              <div className="panel-body">
                <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 8 }}>REST API</div>
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                  Create invoices, manage products, receive webhooks. Full programmatic control.
                </p>
              </div>
            </div>
            <div className="panel">
              <div className="panel-body">
                <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 8 }}>JS WIDGET</div>
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                  Drop a script tag on any page. One line to add ZEC payments to any website.
                </p>
              </div>
            </div>
            <div className="panel">
              <div className="panel-body">
                <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 8 }}>WOOCOMMERCE</div>
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                  Install the plugin, enter your API key. Your WordPress store accepts ZEC.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: '1px solid var(--cp-border)', padding: '60px 24px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" className="hero-gradient hero-gradient-bottom" />
        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            Ready to accept private payments?
          </h2>
          <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', marginBottom: 24, lineHeight: 1.8 }}>
            Set up in under a minute. No KYC. No middleman. Just ZEC.
          </p>
          <SmartCTA className="btn-primary" style={{ padding: '12px 32px', fontSize: 12 }}>
            CREATE YOUR MERCHANT ACCOUNT
          </SmartCTA>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <span style={{ fontWeight: 600, fontSize: 10 }}>
          <span style={{ color: 'var(--cp-cyan)' }}>Cipher</span><span>Pay</span>
        </span>
        <div className="footer-links">
          <Link href="/docs" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>Docs</Link>
          <Link href="/faq" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>FAQ</Link>
          <a href="https://cipherscan.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>CipherScan</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>GitHub</a>
        </div>
      </footer>
    </div>
  );
}
