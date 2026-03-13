'use client';

import { Code, CodeBlock, Step, Callout, SectionDivider, Paragraph, SectionTitle, Strong } from '../components/DocComponents';

export default function WooCommerceSection() {
  return (
    <>
      <Paragraph>
        If you run a WordPress + WooCommerce store, you can accept Zcash payments with a plugin — no coding required.
        The CipherPay WooCommerce plugin handles everything: creating invoices when customers check out,
        redirecting them to the payment page, and updating order statuses when payment is confirmed.
      </Paragraph>

      <Callout type="info">
        Estimated setup time: <Strong>10 minutes</Strong>. You need a CipherPay account (see Quickstart) and WordPress admin access.
      </Callout>

      <SectionTitle>How the plugin works</SectionTitle>
      <Paragraph>
        When a customer selects &quot;Pay with Zcash&quot; at checkout, the plugin:
      </Paragraph>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 16 }}>
        1. Creates a CipherPay invoice via the API (with the order total in your store&apos;s currency)<br />
        2. Redirects the customer to the CipherPay hosted checkout page<br />
        3. The customer pays by scanning the QR code with their Zcash wallet<br />
        4. CipherPay sends a webhook back to your WordPress site<br />
        5. The plugin updates the WooCommerce order status to &quot;Processing&quot; or &quot;Completed&quot;
      </div>

      <SectionDivider />

      <Step n={1} title="Download the plugin">
        <Paragraph>
          Download <Code>cipherpay-woocommerce.zip</Code> from the <a href="https://github.com/atmospherelabs-dev/cipherpay-woocommerce" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-cyan)', textDecoration: 'underline' }}>GitHub repository</a> (Releases page).
        </Paragraph>
      </Step>

      <Step n={2} title="Install and activate">
        <Paragraph>
          In your WordPress admin panel:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          1. Go to <Strong>Plugins → Add New → Upload Plugin</Strong><br />
          2. Select the <Code>cipherpay-woocommerce.zip</Code> file<br />
          3. Click <Strong>Install Now</Strong>, then <Strong>Activate</Strong>
        </div>
      </Step>

      <Step n={3} title="Configure the plugin">
        <Paragraph>
          Go to <Strong>WooCommerce → Settings → Payments → CipherPay (Zcash)</Strong> and fill in:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.4, marginBottom: 12 }}>
          <Code>API Key</Code> — Your CipherPay API key (starts with <Code>cpay_sk_</Code>). Find it in your CipherPay dashboard settings.<br />
          <Code>API URL</Code> — The CipherPay backend URL. Use <Code>https://api.cipherpay.app</Code> for mainnet,
          or <Code>https://api.testnet.cipherpay.app</Code> for testnet.<br />
          <Code>Webhook Secret</Code> — The secret used to verify webhook signatures. Found in your CipherPay dashboard settings (starts with <Code>whsec_</Code>).<br />
          <Code>Checkout Page URL</Code> — Where customers are sent to pay. Use <Code>https://cipherpay.app</Code> for mainnet,
          or <Code>https://testnet.cipherpay.app</Code> for testnet.
        </div>
        <Callout type="tip">
          The plugin automatically detects your WooCommerce store currency and sends the correct price to CipherPay.
          CipherPay supports EUR, USD, GBP, BRL, CAD, AUD, CHF, JPY, CNY, KRW, INR, and more.
          After payment, customers are redirected back to your store&apos;s order confirmation page.
        </Callout>
      </Step>

      <Step n={4} title="Set the webhook URL in CipherPay">
        <Paragraph>
          CipherPay needs to know where to send payment confirmations. In your CipherPay dashboard → Settings, set the Webhook URL to:
        </Paragraph>
        <CodeBlock lang="text" code={`https://yourstore.com/wp-json/cipherpay/v1/webhook`} />
        <Paragraph>
          Replace <Code>yourstore.com</Code> with your actual domain. This is the endpoint the plugin creates automatically.
        </Paragraph>
      </Step>

      <Step n={5} title="Test a payment">
        <Paragraph>
          Add an item to your cart and proceed to checkout. You should see <Strong>&quot;Pay with Zcash (ZEC)&quot;</Strong> as a payment option.
          Select it, place the order, and you&apos;ll be redirected to the CipherPay payment page.
        </Paragraph>
        <Paragraph>
          Pay with your Zcash wallet. Once the payment is confirmed, go back to WooCommerce → Orders.
          The order status should have changed automatically.
        </Paragraph>
      </Step>

      <SectionDivider />

      <SectionTitle>Troubleshooting</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2 }}>
        <Strong>Payment option doesn&apos;t appear at checkout</Strong> — Make sure the plugin is enabled in WooCommerce → Settings → Payments. Check that all required fields (API Key, API URL) are filled in.<br /><br />
        <Strong>Order status doesn&apos;t update</Strong> — Verify your webhook URL is correct and accessible from the internet. Check that the webhook secret in your CipherPay dashboard matches the one in the plugin settings.<br /><br />
        <Strong>Currency mismatch</Strong> — The plugin uses your WooCommerce store currency. CipherPay supports all major fiat currencies — check the API Reference for the full list.
      </div>
    </>
  );
}
