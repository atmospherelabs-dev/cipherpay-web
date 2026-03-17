import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — CipherPay',
  description: 'How CipherPay handles your data. Short version: we don\'t collect it.',
};

const lastUpdated = 'March 17, 2026';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6 }}>
      <SiteHeader />

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--cp-text-muted)', fontSize: 12, marginBottom: 40 }}>
          Last updated: {lastUpdated}
        </p>

        <Section id="01" title="Who we are">
          <P>
            CipherPay is a product of Atmosphere Labs. We build open-source payment
            infrastructure for Zcash (ZEC). Our service enables merchants to accept
            shielded Zcash payments through hosted checkout pages, APIs, and
            e-commerce integrations (Shopify, WooCommerce).
          </P>
        </Section>

        <Section id="02" title="Data we collect">
          <P>
            <Strong>From merchants:</Strong> Email address, API keys, and store configuration
            (e.g., Shopify domain, webhook URLs). This is the minimum required to
            operate the service.
          </P>
          <P>
            <Strong>From customers (buyers):</Strong> We do not collect or store any personal
            information from customers who pay through CipherPay. No names, no email
            addresses, no physical addresses, no phone numbers, no IP addresses.
          </P>
          <P>
            <Strong>Payment data:</Strong> We store invoice amounts, currency, Zcash payment
            addresses, and transaction status. Zcash shielded transactions are
            private by design — we cannot see the sender&apos;s address or the
            transaction amount on-chain when shielded pools are used.
          </P>
          <P>
            <Strong>Analytics:</Strong> We do not use third-party analytics, tracking pixels,
            or cookies on checkout pages.
          </P>
        </Section>

        <Section id="03" title="Shopify integration">
          <P>
            Our Shopify app requests <Code>read_orders</Code> and <Code>write_orders</Code> permissions
            to create payment invoices and mark orders as paid. We read order amounts
            and product names to generate invoices. We do not read or store customer
            personal information from Shopify orders.
          </P>
          <P>
            Payment session data (order ID, amount, invoice reference) is stored
            temporarily with a 24-hour expiration. Shop configuration (access token,
            API keys) is stored securely in encrypted Redis and deleted when the
            app is uninstalled.
          </P>
        </Section>

        <Section id="04" title="Data sharing">
          <P>
            We do not sell, rent, or share data with third parties. Period.
          </P>
          <P>
            Invoice data is processed through the Zcash blockchain, which is a public
            network. However, shielded transactions do not reveal sender, receiver,
            or amount information publicly.
          </P>
        </Section>

        <Section id="05" title="Data retention">
          <P>
            Payment sessions expire automatically after 24 hours. Merchant account
            data is retained while the account is active and deleted upon request
            or app uninstallation. We comply with Shopify&apos;s mandatory data
            deletion webhooks.
          </P>
        </Section>

        <Section id="06" title="Security">
          <P>
            All API communication uses TLS encryption. Webhook signatures are
            verified using HMAC-SHA256. Access tokens and API keys are stored
            in encrypted Redis with access controls. We never log secrets,
            seeds, or private keys.
          </P>
        </Section>

        <Section id="07" title="Your rights">
          <P>
            You can request access to, correction of, or deletion of your data
            at any time by contacting us. Merchants can delete all stored data
            by uninstalling the CipherPay app from their platform.
          </P>
        </Section>

        <Section id="08" title="Contact">
          <P>
            For privacy questions or data requests:{' '}
            <a href="mailto:privacy@cipherpay.app" style={{ color: 'var(--cp-cyan)', textDecoration: 'none' }}>
              privacy@cipherpay.app
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

function Strong({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: 'var(--cp-text)', fontWeight: 600 }}>{children}</strong>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code style={{
      backgroundColor: 'var(--cp-surface)',
      padding: '2px 6px',
      borderRadius: 3,
      fontSize: 11,
      color: 'var(--cp-cyan)',
    }}>
      {children}
    </code>
  );
}
