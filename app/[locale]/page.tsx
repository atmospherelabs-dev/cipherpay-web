import { LogoMark } from '@/components/Logo';
import { SmartCTA } from '@/components/SmartCTA';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { DemoQR } from '@/components/DemoQR';
import { MeshGradient } from '@/components/MeshGradient';
import { AnimatedSection, StaggerChildren, StaggerItem } from '@/components/AnimatedSection';
import { CodeTabs } from '@/components/CodeTabs';
import { PrivacyTable } from '@/components/PrivacyTable';
import { getTranslations } from 'next-intl/server';

const x402Snippet = `import { zcashPaywall } from '@cipherpay/x402/express';

app.use('/api/premium', zcashPaywall({
  amount: 0.001,
  address: 'u1abc...',
  apiKey: process.env.CIPHERPAY_API_KEY,
}));`;

const agentTabs = [
  {
    label: 'Merchant',
    tag: '@cipherpay/x402',
    code: `import { zcashPaywall } from '@cipherpay/x402/express';

// One line — handles x402, MPP, and session tokens
app.use('/api/premium', zcashPaywall({
  amount: 0.001,
  address: 'u1abc...',
  apiKey: process.env.CIPHERPAY_API_KEY,
}));

// Agents pay with ZEC, you get the data
app.get('/api/premium/data', (req, res) => {
  res.json({ temperature: 18 });
});`,
  },
  {
    label: 'Agent (beta)',
    tag: '@cipherpay/zipher-cli',
    code: `# Pay for a paywalled API — auto-detects x402 or MPP
$ zipher-cli pay https://api.example.com/premium/data

# Or open a prepaid session for bulk access
$ zipher-cli session open \\
    --merchant abc123 \\
    --deposit 0.01 \\
    --cost-per-request 1000

# Then use the session token
$ zipher-cli session request \\
    --url https://api.example.com/premium/data`,
  },
  {
    label: 'MCP',
    tag: '@cipherpay/mcp',
    code: `// Add to claude_desktop_config.json or mcp.json
{
  "mcpServers": {
    "cipherpay": {
      "command": "npx",
      "args": ["@cipherpay/mcp"],
      "env": {
        "CIPHERPAY_API_KEY": "cpay_sk_..."
      }
    }
  }
}

// Then ask your AI: "Verify tx abc123 paid 0.001 ZEC"
// Or: "Open a session for merchant xyz"`,
  },
];

const codeTabs = [
  {
    label: 'cURL',
    tag: 'REST API',
    code: `curl -X POST https://api.cipherpay.app/api/invoices \\
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
# }`,
  },
  {
    label: 'TypeScript',
    tag: 'SDK',
    code: `import CipherPay from '@cipherpay/sdk';

const cp = new CipherPay('cpay_sk_...');

const invoice = await cp.invoices.create({
  amount: 29.99,
  currency: 'USD',
  product_name: 'T-Shirt',
});

console.log(invoice.zcash_uri);
// → "zcash:u1...?amount=0.12345678&memo=..."`,
  },
  {
    label: 'Python',
    tag: 'SDK',
    code: `import cipherpay

cp = cipherpay.Client("cpay_sk_...")

invoice = cp.invoices.create(
    amount=29.99,
    currency="USD",
    product_name="T-Shirt",
)

print(invoice.zcash_uri)
# → "zcash:u1...?amount=0.12345678&memo=..."`,
  },
];

export default async function LandingPage() {
  const t = await getTranslations('landing');

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      <SiteHeader />

      {/* Hero */}
      <section style={{ padding: '100px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <MeshGradient />
        <AnimatedSection style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
          <h1 className="hero-title" style={{ fontWeight: 700, letterSpacing: -1.5, marginBottom: 20, lineHeight: 1.08 }}>
            {t.rich('heroTitle', {
              purple: (chunks) => <span className="hero-accent">{chunks}</span>,
            })}
          </h1>

          <p style={{ fontSize: 15, color: 'var(--cp-text-muted)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.8, fontWeight: 400 }}>
            {t('heroSubtitle')}
          </p>

          <div className="hero-cta">
            <SmartCTA className="btn-primary" style={{ padding: '14px 32px', fontSize: 12 }}>
              {t('ctaStart')}
            </SmartCTA>
            <a href="#how-it-works" className="btn" style={{ padding: '14px 32px', fontSize: 12 }}>
              {t('ctaHowItWorks')}
            </a>
          </div>
        </AnimatedSection>
      </section>

      {/* Features */}
      <section style={{ borderTop: '1px solid var(--cp-border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <AnimatedSection>
            <div className="section-title" style={{ textAlign: 'center', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><LogoMark size={8} /> {t('whyCipherpay')}</div>
          </AnimatedSection>
          <StaggerChildren style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <StaggerItem>
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
            </StaggerItem>

            <StaggerItem>
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
            </StaggerItem>

            <StaggerItem>
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">{t('feature3Title')}</span>
                </div>
                <div className="panel-body">
                  <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>
                    {t('feature3Desc')}
                  </p>
                </div>
              </div>
            </StaggerItem>
          </StaggerChildren>
        </div>
      </section>

      {/* How it works */}
      <section style={{ borderTop: '1px solid var(--cp-border)', padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        <MeshGradient variant="steps" className="mesh-gradient-steps" colors={['#00D4FF', '#8FE1FF', '#F4B728', '#FFE876']} />
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
          <AnimatedSection>
            <div className="section-title" style={{ textAlign: 'center', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><LogoMark size={8} /> {t('ctaHowItWorks')}</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 56 }}>
              {t('howItWorksTitle')}
            </h2>
          </AnimatedSection>

          <StaggerChildren className="steps-grid">
            {/* Step 1: Register */}
            <StaggerItem className="step-col">
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
            </StaggerItem>

            {/* Step 2: Add Products */}
            <StaggerItem className="step-col">
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
            </StaggerItem>

            {/* Step 3: Get Paid */}
            <StaggerItem className="step-col">
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
            </StaggerItem>
          </StaggerChildren>
        </div>
      </section>

      {/* Code Example */}
      <section id="how-it-works" style={{ borderTop: '1px solid var(--cp-border)', padding: '80px 24px' }}>
        <AnimatedSection style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="section-title" style={{ textAlign: 'center', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><LogoMark size={8} /> {t('forDevelopers')}</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>
            {t('oneApiCall')}
          </h2>

          <CodeTabs tabs={codeTabs} />
        </AnimatedSection>
      </section>

      {/* Integrations */}
      <section style={{ borderTop: '1px solid var(--cp-border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <AnimatedSection>
            <div className="section-title" style={{ textAlign: 'center', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><LogoMark size={8} /> {t('integrationsTitle')}</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>
              {t('integrationsSubtitle')}
            </h2>
          </AnimatedSection>

          <StaggerChildren className="integrations-grid">
            <StaggerItem><div className="panel">
              <div className="panel-body">
                <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 8 }}>{t('intHosted')}</div>
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>{t('intHostedDesc')}</p>
              </div>
            </div></StaggerItem>
            <StaggerItem><div className="panel">
              <div className="panel-body">
                <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 8 }}>{t('intApi')}</div>
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>{t('intApiDesc')}</p>
              </div>
            </div></StaggerItem>
            <StaggerItem><div className="panel">
              <div className="panel-body">
                <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 8 }}>{t('intWidget')}</div>
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>{t('intWidgetDesc')}</p>
              </div>
            </div></StaggerItem>
            <StaggerItem><div className="panel">
              <div className="panel-body">
                <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 8 }}>{t('intShopify')}</div>
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>{t('intShopifyDesc')}</p>
              </div>
            </div></StaggerItem>
            <StaggerItem><div className="panel">
              <div className="panel-body">
                <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 8 }}>{t('intWoo')}</div>
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>{t('intWooDesc')}</p>
              </div>
            </div></StaggerItem>
            <StaggerItem><div className="panel">
              <div className="panel-body">
                <div style={{ fontSize: 11, color: 'var(--cp-cyan)', letterSpacing: 1, marginBottom: 8 }}>{t('intMcp')}</div>
                <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.7 }}>{t('intMcpDesc')}</p>
              </div>
            </div></StaggerItem>
          </StaggerChildren>
        </div>
      </section>

      {/* AI Agents */}
      <section className="section-agents" style={{ borderTop: '1px solid var(--cp-border)', padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        <MeshGradient variant="agents" colors={['#8FE1FF', '#00D4FF', '#56D4C8', '#FFE876']} />
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
          <AnimatedSection>
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
          </AnimatedSection>

          {/* Privacy Comparison — full width */}
          <PrivacyTable
            header={{
              label: <>&nbsp;</>,
              publicLabel: t('agentsPrivacyTitle'),
              zcashLabel: t('agentsPrivacyZcash'),
            }}
            rows={(['Row1', 'Row2', 'Row3', 'Row4', 'Row5'] as const).map((row) => ({
              label: t(`agentsPrivacy${row}`),
              publicText: t('agentsPrivacyVisible'),
              privateText: t('agentsPrivacyHidden'),
            }))}
          />

          {/* x402 Flow */}
          <AnimatedSection>
            <div className="panel" style={{ marginBottom: 16 }}>
              <div className="panel-header">
                <span className="panel-title">{t('agentsHow')}</span>
                <span className="tag">x402 / MPP</span>
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
          </AnimatedSection>

          {/* Tabbed code: Merchant / Agent / MCP */}
          <AnimatedSection>
            <CodeTabs tabs={agentTabs} />
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: '1px solid var(--cp-border)', padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        <MeshGradient
          variant="cta"
          colors={['#8FE1FF', '#00D4FF', '#F4B728', '#FFE876']}
        />
        <AnimatedSection style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            {t('readyTitle')}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', marginBottom: 24, lineHeight: 1.8 }}>
            {t('readySubtitle')}
          </p>
          <SmartCTA className="btn-primary" style={{ padding: '12px 32px', fontSize: 12 }}>
            {t('ctaRegister')}
          </SmartCTA>
        </AnimatedSection>
      </section>

      <SiteFooter />
    </div>
  );
}
