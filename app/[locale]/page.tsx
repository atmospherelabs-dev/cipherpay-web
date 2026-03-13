import { LogoMark } from '@/components/Logo';
import { NavLinks } from '@/components/NavLinks';
import { SmartCTA } from '@/components/SmartCTA';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

const codeSnippet = `curl -X POST https://api.cipherpay.app/api/invoices \\
  -H "Authorization: Bearer cpay_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 29.99, "currency": "USD", "product_name": "T-Shirt"}'

# Response:
# {
#   "invoice_id": "a1b2c3...",
#   "memo_code": "CP-C6CDB775",
#   "price_zec": 0.12345678,
#   "zcash_uri": "zcash:u1...?amount=0.12345678&memo=...",
#   "payment_address": "u1...",
#   "expires_at": "2026-02-21T13:30:00Z"
# }`;

export default async function LandingPage() {
  const t = await getTranslations('landing');

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
            {t.rich('heroTitle', {
              purple: (chunks) => <span style={{ color: 'var(--cp-purple)' }}>{chunks}</span>,
            })}
          </h1>

          <p style={{ fontSize: 14, color: 'var(--cp-text-muted)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.8 }}>
            {t('heroSubtitle')}
          </p>

          <div className="hero-cta">
            <SmartCTA className="btn-primary" style={{ padding: '12px 28px', fontSize: 12 }}>
              {t('ctaStart')}
            </SmartCTA>
            <a href="#how-it-works" className="btn" style={{ padding: '12px 28px', fontSize: 12 }}>
              {t('ctaHowItWorks')}
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ borderTop: '1px solid var(--cp-border)', padding: '60px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="section-title" style={{ textAlign: 'center', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><LogoMark size={8} /> {t('whyCipherpay')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{t('feature1Title')}</span>
              </div>
              <div className="panel-body">
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                  {t('feature1Desc')}
                </p>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{t('feature2Title')}</span>
              </div>
              <div className="panel-body">
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                  {t('feature2Desc')}
                </p>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{t('feature3Title')}</span>
              </div>
              <div className="panel-body">
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                  {t('feature3Desc', { link: t('x402Link') })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ borderTop: '1px solid var(--cp-border)', padding: '60px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="section-title" style={{ textAlign: 'center', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><LogoMark size={8} /> {t('ctaHowItWorks')}</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>
            {t('howItWorksTitle')}
          </h2>

          <div className="panel" style={{ marginBottom: 24 }}>
            <div className="panel-body">
              <div className="step-row">
                <span style={{ color: 'var(--cp-cyan)', fontWeight: 600, whiteSpace: 'nowrap' }}>{t('step1')}</span>
                <span style={{ color: 'var(--cp-text-muted)' }}>{t('step1Desc')}</span>
              </div>
              <div className="step-row">
                <span style={{ color: 'var(--cp-cyan)', fontWeight: 600, whiteSpace: 'nowrap' }}>{t('step2')}</span>
                <span style={{ color: 'var(--cp-text-muted)' }}>{t('step2Desc')}</span>
              </div>
              <div className="step-row">
                <span style={{ color: 'var(--cp-cyan)', fontWeight: 600, whiteSpace: 'nowrap' }}>{t('step3')}</span>
                <span style={{ color: 'var(--cp-text-muted)' }}>{t('step3Desc')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section id="how-it-works" style={{ borderTop: '1px solid var(--cp-border)', padding: '60px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="section-title" style={{ textAlign: 'center', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><LogoMark size={8} /> {t('forDevelopers')}</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>
            {t('oneApiCall')}
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
          <div className="section-title" style={{ textAlign: 'center', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><LogoMark size={8} /> {t('integrationsTitle')}</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>
            {t('integrationsSubtitle')}
          </h2>

          <div className="integrations-grid">
            <div className="panel">
              <div className="panel-body">
                <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 8 }}>{t('intHosted')}</div>
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                  {t('intHostedDesc')}
                </p>
              </div>
            </div>
            <div className="panel">
              <div className="panel-body">
                <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 8 }}>{t('intApi')}</div>
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                  {t('intApiDesc')}
                </p>
              </div>
            </div>
            <div className="panel">
              <div className="panel-body">
                <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 8 }}>{t('intWidget')}</div>
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                  {t('intWidgetDesc')}
                </p>
              </div>
            </div>
            <div className="panel">
              <div className="panel-body">
                <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 8 }}>{t('intShopify')}</div>
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                  {t('intShopifyDesc')}
                </p>
              </div>
            </div>
            <div className="panel">
              <div className="panel-body">
                <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 8 }}>{t('intWoo')}</div>
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                  {t('intWooDesc')}
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
            {t('readyTitle')}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', marginBottom: 24, lineHeight: 1.8 }}>
            {t('readySubtitle')}
          </p>
          <SmartCTA className="btn-primary" style={{ padding: '12px 32px', fontSize: 12 }}>
            {t('ctaRegister')}
          </SmartCTA>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <span style={{ fontWeight: 600, fontSize: 10 }}>
          <span style={{ color: 'var(--cp-cyan)' }}>Cipher</span><span>Pay</span>
        </span>
        <div className="footer-links">
          <Link href="/docs" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>{t('footerDocs')}</Link>
          <Link href="/faq" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>{t('footerFaq')}</Link>
          <a href="https://cipherscan.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>CipherScan</a>
          <a href="https://github.com/atmospherelabs-dev/cipherpay-web" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>GitHub</a>
          <a href="https://x.com/cipherpay_app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>𝕏</a>
        </div>
      </footer>
    </div>
  );
}
