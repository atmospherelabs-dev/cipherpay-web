import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — CipherPay',
  description: 'Terms of Service for CipherPay — non-custodial Zcash payment processing by Atmosphere Labs.',
};

const lastUpdated = 'March 13, 2026';

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      <SiteHeader />

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: 'var(--cp-text-muted)', fontSize: 12, marginBottom: 40 }}>
          Last updated: {lastUpdated}
        </p>

        <Section id="01" title="Agreement">
          <P>
            These Terms of Service (&quot;Terms&quot;) govern your use of CipherPay, a product of
            Atmosphere Labs (&quot;we&quot;, &quot;us&quot;). By creating an account, using our APIs,
            checkout pages, or integrations, you agree to these Terms. If you do not agree, do not
            use the service.
          </P>
        </Section>

        <Section id="02" title="Service description">
          <P>
            CipherPay provides non-custodial payment processing for shielded Zcash (ZEC). We
            operate software that helps merchants create invoices, detect payments, and notify
            your systems via webhooks. We do not hold customer funds; payments are settled on the
            Zcash network according to the invoices and addresses you configure.
          </P>
        </Section>

        <Section id="03" title="Accounts and API keys">
          <P>
            You are responsible for safeguarding API keys, webhook secrets, dashboard credentials,
            and any recovery mechanisms. You must provide accurate registration information and
            keep it current. You may not use the service to violate applicable law or third-party
            rights.
          </P>
        </Section>

        <Section id="04" title="Acceptable use">
          <P>
            You may not use CipherPay to facilitate fraud, money laundering, sanctions evasion,
            or illegal commerce. We may suspend or terminate access if we reasonably believe the
            service is being abused or if required by law or payment-network rules.
          </P>
        </Section>

        <Section id="05" title="Fees and billing">
          <P>
            Platform fees, billing cycles, and settlement rules are described in your dashboard
            and documentation. Fee rates may change with notice where required. You remain
            responsible for any amounts owed under your merchant agreement with us.
          </P>
        </Section>

        <Section id="06" title="Third-party integrations">
          <P>
            Integrations (e.g. Shopify, WooCommerce, custom sites) are subject to those
            platforms&apos; own terms. We are not affiliated with Automattic, WooCommerce, or
            Shopify unless expressly stated in a separate agreement.
          </P>
        </Section>

        <Section id="07" title="Disclaimer of warranties">
          <P>
            The service is provided &quot;as is&quot; and &quot;as available&quot; without
            warranties of any kind, whether express or implied, including merchantability, fitness
            for a particular purpose, and non-infringement, to the fullest extent permitted by law.
          </P>
        </Section>

        <Section id="08" title="Limitation of liability">
          <P>
            To the fullest extent permitted by law, Atmosphere Labs and its contributors will not
            be liable for any indirect, incidental, special, consequential, or exemplary damages, or
            any loss of profits, revenues, goodwill, or data, arising from your use of CipherPay.
            Our aggregate liability for any claim relating to the service shall not exceed the
            amount you paid us in fees for the service in the three (3) months preceding the claim,
            or one hundred US dollars (USD $100), whichever is greater.
          </P>
        </Section>

        <Section id="09" title="Open source">
          <P>
            Portions of CipherPay may be distributed under open-source licenses (e.g. GPLv2 or
            later for the WooCommerce plugin). Your use of such components is governed by those
            licenses in addition to these Terms where applicable.
          </P>
        </Section>

        <Section id="10" title="Changes">
          <P>
            We may update these Terms from time to time. We will post the revised version on this
            page and update the &quot;Last updated&quot; date. Continued use after changes constitutes
            acceptance of the revised Terms.
          </P>
        </Section>

        <Section id="11" title="Governing law">
          <P>
            These Terms are governed by the laws applicable to Atmosphere Labs in its place of
            incorporation or principal place of business, without regard to conflict-of-law
            principles, except where mandatory consumer protections apply in your jurisdiction.
          </P>
        </Section>

        <Section id="12" title="Contact">
          <P>
            For legal or terms questions:{' '}
            <a href="mailto:legal@cipherpay.app" style={{ color: 'var(--cp-cyan)', textDecoration: 'none' }}>
              legal@cipherpay.app
            </a>
          </P>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{id} // {title}</span>
        </div>
        <div style={{ padding: '16px 18px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, color: 'var(--cp-text-muted)', lineHeight: 1.8, marginTop: 0, marginBottom: 12 }}>
      {children}
    </p>
  );
}
