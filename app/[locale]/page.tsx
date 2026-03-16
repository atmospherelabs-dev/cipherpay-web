import { LogoMark } from '@/components/Logo';
import { SmartCTA } from '@/components/SmartCTA';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { DemoQR } from '@/components/DemoQR';
import { getTranslations } from 'next-intl/server';

const x402Snippet = `import { zcashPaywall } from '@cipherpay/x402/express';

app.use('/api/premium', zcashPaywall({
  amount: 0.001,
  address: 'u1abc...',
  apiKey: process.env.CIPHERPAY_API_KEY,
}));`;

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
      <SiteHeader />

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
      <section style={{ borderTop: '1px solid var(--cp-border)', padding: '60px 24px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" className="hero-gradient hero-gradient-steps" />
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
          <div className="section-title" style={{ textAlign: 'center', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><LogoMark size={8} /> {t('ctaHowItWorks')}</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 56 }}>
            {t('howItWorksTitle')}
          </h2>

          <div className="steps-grid">
            {/* Step 1: Register */}
            <div className="step-col">
              <div className="step-header">
                <div className="step-title">{t('step1')}</div>
                <div className="step-desc">{t('step1Desc')}</div>
              </div>
              <div className="step-preview" aria-hidden="true">
                <div className="step-preview-bar">
                  <span style={{ fontSize: 7, color: 'var(--cp-cyan)', fontWeight: 700, letterSpacing: 1 }}>CIPHERPAY</span>
                  <span style={{ fontSize: 7, color: 'var(--cp-text-dim)', letterSpacing: 1 }}>REGISTER</span>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div className="step-preview-label">STORE NAME</div>
                  <div className="step-preview-input">Acme Store</div>
                  <div className="step-preview-label" style={{ marginTop: 6 }}>UNIFIED VIEWING KEY</div>
                  <div className="step-preview-input" style={{ color: 'var(--cp-text-dim)', fontSize: 8 }}>uview1qxf5rn2...k9w7mzj</div>
                  <div className="step-preview-label" style={{ marginTop: 6 }}>DASHBOARD PASSWORD</div>
                  <div className="step-preview-input">
                    <span style={{ letterSpacing: 2 }}>••••••••••</span>
                  </div>
                  <div className="step-preview-btn">CREATE ACCOUNT</div>
                </div>
              </div>
            </div>

            {/* Step 2: Add Products */}
            <div className="step-col">
              <div className="step-header">
                <div className="step-title">{t('step2')}</div>
                <div className="step-desc">{t('step2Desc')}</div>
              </div>
              <div className="step-preview" aria-hidden="true">
                <div className="step-preview-bar">
                  <span style={{ fontSize: 7, color: 'var(--cp-text-muted)', letterSpacing: 1 }}>PRODUCTS</span>
                  <span style={{ fontSize: 7, color: 'var(--cp-cyan)', fontWeight: 600 }}>+ NEW</span>
                </div>
                <div style={{ padding: '6px 12px' }}>
                  <div className="step-preview-product">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 9, color: 'var(--cp-text)' }}>Premium T-Shirt</div>
                      <div style={{ fontSize: 7, color: 'var(--cp-text-dim)' }}>premium-t-shirt · one-time</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: 'var(--cp-cyan)' }}>$29.99</div>
                      <div style={{ fontSize: 7, color: 'var(--cp-text-dim)' }}>USD</div>
                    </div>
                  </div>
                  <div className="step-preview-product">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 9, color: 'var(--cp-text)' }}>Hoodie</div>
                      <div style={{ fontSize: 7, color: 'var(--cp-text-dim)' }}>hoodie · one-time</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: 'var(--cp-cyan)' }}>€59.99</div>
                      <div style={{ fontSize: 7, color: 'var(--cp-text-dim)' }}>EUR</div>
                    </div>
                  </div>
                  <div className="step-preview-product">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 9, color: 'var(--cp-text)' }}>API Access</div>
                      <div style={{ fontSize: 7, color: 'var(--cp-text-dim)' }}>api-access · recurring</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: 'var(--cp-cyan)' }}>€9.99</div>
                      <div style={{ fontSize: 7, color: 'var(--cp-text-dim)' }}>EUR/mo</div>
                    </div>
                  </div>
                  <div className="step-preview-product">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 9, color: 'var(--cp-text)' }}>VPN Monthly</div>
                      <div style={{ fontSize: 7, color: 'var(--cp-text-dim)' }}>vpn-monthly · recurring</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: 'var(--cp-cyan)' }}>$4.99</div>
                      <div style={{ fontSize: 7, color: 'var(--cp-text-dim)' }}>USD/mo</div>
                    </div>
                  </div>
                  <div className="step-preview-product" style={{ borderBottom: 'none' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 9, color: 'var(--cp-text)' }}>Donation</div>
                      <div style={{ fontSize: 7, color: 'var(--cp-text-dim)' }}>donation · one-time</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: 'var(--cp-cyan)' }}>$10.00</div>
                      <div style={{ fontSize: 7, color: 'var(--cp-text-dim)' }}>USD</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Get Paid */}
            <div className="step-col">
              <div className="step-header">
                <div className="step-title">{t('step3')}</div>
                <div className="step-desc">{t('step3Desc')}</div>
              </div>
              <div className="step-preview" aria-hidden="true">
                <div className="step-preview-bar">
                  <span style={{ fontSize: 7, color: 'var(--cp-text-muted)', letterSpacing: 1 }}>CHECKOUT</span>
                  <span className="step-preview-badge-pending">14:59</span>
                </div>
                <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 8, letterSpacing: 1, color: 'var(--cp-text-dim)', marginBottom: 2 }}>ACME STORE</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--cp-text)', marginBottom: 4 }}>Premium T-Shirt</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cp-text)' }}>$29.99</div>
                  <div style={{ fontSize: 9, color: 'var(--cp-cyan)', marginBottom: 10 }}>≈ 0.1234 ZEC</div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <DemoQR />
                  </div>
                  <div style={{ fontSize: 7, color: 'var(--cp-text-dim)', letterSpacing: 1, marginTop: 6 }}>SCAN WITH YOUR ZCASH WALLET</div>
                  <div className="step-preview-btn" style={{ marginTop: 8 }}>OPEN IN WALLET</div>
                </div>
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

      {/* AI Agents */}
      <section style={{ borderTop: '1px solid var(--cp-border)', padding: '60px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="section-title" style={{ textAlign: 'center', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><LogoMark size={8} /> {t('agentsTitle')}</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 16 }}>
            {t('agentsSubtitle')}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', textAlign: 'center', maxWidth: 560, margin: '0 auto 12px', lineHeight: 1.8 }}>
            {t('agentsDesc')}
          </p>
          <p style={{ fontSize: 13, color: 'var(--cp-cyan)', textAlign: 'center', fontWeight: 600, marginBottom: 40 }}>
            {t('agentsDescHighlight')}
          </p>

          {/* Privacy Comparison — full width */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-body" style={{ padding: 0 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 120px', alignItems: 'center',
                padding: '12px 18px',
                borderBottom: '1px solid var(--cp-border)',
                fontSize: 10, letterSpacing: 1.5, fontWeight: 600,
              }}>
                <span style={{ color: 'var(--cp-text-dim)' }}>&nbsp;</span>
                <span style={{ color: 'var(--cp-text-muted)', textAlign: 'center' }}>{t('agentsPrivacyTitle')}</span>
                <span style={{ color: 'var(--cp-cyan)', textAlign: 'center' }}>{t('agentsPrivacyZcash')}</span>
              </div>
              {(['Row1', 'Row2', 'Row3', 'Row4', 'Row5'] as const).map((row, i) => (
                <div key={row} style={{
                  display: 'grid', gridTemplateColumns: '1fr 120px 120px', alignItems: 'center',
                  padding: '10px 18px',
                  borderBottom: i < 4 ? '1px solid var(--cp-border)' : 'none',
                  fontSize: 11,
                }}>
                  <span style={{ color: 'var(--cp-text-muted)' }}>{t(`agentsPrivacy${row}`)}</span>
                  <span style={{ color: '#ef4444', fontWeight: 600, textAlign: 'center' }}>{t('agentsPrivacyVisible')}</span>
                  <span style={{ color: 'var(--cp-cyan)', fontWeight: 600, textAlign: 'center' }}>{t('agentsPrivacyHidden')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* x402 Flow + SDK snippet — side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* x402 Flow */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{t('agentsHow')}</span>
                <span className="tag">x402</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                {[
                  { step: '1', text: t('agentsStep1'), color: 'var(--cp-text-muted)' },
                  { step: '2', text: t('agentsStep2'), color: 'var(--cp-text-muted)' },
                  { step: '3', text: t('agentsStep3'), color: 'var(--cp-cyan)' },
                  { step: '4', text: t('agentsStep4'), color: 'var(--cp-text-muted)' },
                  { step: '5', text: t('agentsStep5'), color: 'var(--cp-text-muted)' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 18px',
                    borderBottom: i < 4 ? '1px solid var(--cp-border)' : 'none',
                    fontSize: 11,
                  }}>
                    <span style={{ color: 'var(--cp-text-dim)', fontWeight: 700, fontSize: 10, width: 16 }}>{item.step}</span>
                    <span style={{ color: item.color }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SDK snippet */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{t('agentsSdkTitle')}</span>
                <span className="tag">TypeScript</span>
              </div>
              <div style={{ padding: '4px 18px 6px' }}>
                <div style={{
                  fontSize: 10, color: 'var(--cp-cyan)', fontFamily: 'var(--font-geist-mono), monospace',
                  background: 'var(--cp-surface)', border: '1px solid var(--cp-border)', borderRadius: 4,
                  padding: '8px 12px', marginBottom: 8, letterSpacing: 0.5,
                }}>
                  $ {t('agentsNpmInstall')}
                </div>
              </div>
              <div style={{ padding: '0 18px 18px', overflow: 'auto' }}>
                <pre style={{ margin: 0, fontSize: 10, lineHeight: 1.8, color: 'var(--cp-text)' }}>
                  <code>{x402Snippet}</code>
                </pre>
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

      <SiteFooter />
    </div>
  );
}
