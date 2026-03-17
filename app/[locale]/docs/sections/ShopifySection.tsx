'use client';

import { Code, CodeBlock, Step, Callout, SectionDivider, Paragraph, SectionTitle, Strong } from '../components/DocComponents';

export default function ShopifySection() {
  return (
    <>
      <Paragraph>
        If you run a Shopify store, you can accept Zcash payments with the CipherPay app — no coding required.
        The app handles everything: creating invoices when customers place orders,
        showing a payment button on the Thank You page, and updating order statuses when payment is confirmed.
      </Paragraph>

      <Callout type="info">
        Estimated setup time: <Strong>10 minutes</Strong>. You need a CipherPay account (see Quickstart) and Shopify admin access.
      </Callout>

      <SectionTitle>How the app works</SectionTitle>
      <Paragraph>
        When a customer selects &quot;Pay with Zcash (ZEC)&quot; at checkout, the app:
      </Paragraph>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 16 }}>
        1. Creates a CipherPay invoice via the API (with the order total in your store&apos;s currency)<br />
        2. Displays a &quot;Pay with CipherPay&quot; button on the Thank You page<br />
        3. The customer clicks the button and pays by scanning the QR code with their Zcash wallet<br />
        4. CipherPay sends a webhook back to the app<br />
        5. The app marks the Shopify order as paid automatically
      </div>

      

      <SectionDivider />

      <Step n={1} title="Install the CipherPay app">
        <Paragraph>
          Install the app by visiting the install link with your store name:
        </Paragraph>
        <CodeBlock lang="text" code={`https://connect.cipherpay.app/api/auth?shop=yourstore.myshopify.com`} />
        <Paragraph>
          Replace <Code>yourstore</Code> with your actual Shopify store name. This will redirect you to Shopify to authorize the app.
        </Paragraph>
        
      </Step>

      <Step n={2} title="Configure CipherPay credentials">
        <Paragraph>
          After installation, you&apos;ll be redirected to the CipherPay settings page. Fill in:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.4, marginBottom: 12 }}>
          <Code>API Key</Code> — Your CipherPay API key. Find it in your CipherPay dashboard &gt; Settings &gt; API Keys.<br />
          <Code>Webhook Secret</Code> — The secret used to verify webhook signatures. Found in your CipherPay dashboard &gt; Settings (starts with <Code>whsec_</Code>).<br />
          <Code>API URL</Code> — Use <Code>https://api.cipherpay.app</Code> for mainnet,
          or <Code>https://api.testnet.cipherpay.app</Code> for testnet.
        </div>
        
      </Step>

      <Step n={3} title="Add a manual payment method">
        <Paragraph>
          In your Shopify admin, go to <Strong>Settings &rarr; Payments &rarr; Manual payment methods</Strong> and add a method called exactly:
        </Paragraph>
        <CodeBlock lang="text" code={`Pay with Zcash (ZEC)`} />
        <Paragraph>
          This is the payment option customers will see at checkout. You can add a description like
          &quot;Pay securely with Zcash cryptocurrency via CipherPay.&quot;
        </Paragraph>
        
      </Step>

      <Step n={4} title="Add the payment button to the Thank You page">
        <Paragraph>
          The CipherPay button needs to be placed on the checkout Thank You page:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          1. Go to <Strong>Settings &rarr; Checkout &rarr; Customize</Strong><br />
          2. In the page selector (top of the editor), switch to <Strong>Thank you</Strong><br />
          3. In the left sidebar, click <Strong>Add block</Strong> under the Main section<br />
          4. Select <Strong>CipherPay Checkout</Strong> from the app blocks list<br />
          5. Click <Strong>Save</Strong>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div style={{ border: '1px solid var(--cp-border)', borderRadius: 6, overflow: 'hidden' }}>
            <img src="/docs/shopify-checkout-settings.png" alt="Shopify Checkout settings — click Customize" style={{ width: '100%', display: 'block' }} />
            <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', padding: '6px 10px', background: 'var(--cp-bg)' }}>Settings &rarr; Checkout &rarr; Customize</div>
          </div>
          <div style={{ border: '1px solid var(--cp-border)', borderRadius: 6, overflow: 'hidden' }}>
            <img src="/docs/shopify-thankyou-select.png" alt="Select Thank you page in the checkout editor" style={{ width: '100%', display: 'block' }} />
            <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', padding: '6px 10px', background: 'var(--cp-bg)' }}>Switch to the &quot;Thank you&quot; page in the dropdown</div>
          </div>
          <div style={{ border: '1px solid var(--cp-border)', borderRadius: 6, overflow: 'hidden' }}>
            <img src="/docs/shopify-add-block.png" alt="Add CipherPay Checkout block" style={{ width: '100%', display: 'block' }} />
            <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', padding: '6px 10px', background: 'var(--cp-bg)' }}>Click Add block &rarr; select CipherPay Checkout</div>
          </div>
        </div>
      </Step>

      <Step n={5} title="Set the webhook URL in CipherPay">
        <Paragraph>
          CipherPay needs to know where to send payment confirmations. In your CipherPay dashboard &rarr; Settings, set the Webhook URL to:
        </Paragraph>
        <CodeBlock lang="text" code={`https://connect.cipherpay.app/api/webhook/cipherpay`} />
        <Paragraph>
          This URL is also displayed on your CipherPay settings page in Shopify for easy copying.
        </Paragraph>
      </Step>

      <Step n={6} title="Test a payment">
        <Paragraph>
          Add an item to your cart and proceed to checkout. Select <Strong>&quot;Pay with Zcash (ZEC)&quot;</Strong> as the payment method
          and complete the order. On the Thank You page, you&apos;ll see a <Strong>&quot;Pay with CipherPay&quot;</Strong> button.
        </Paragraph>
        <Paragraph>
          Click the button to open the CipherPay payment page. Pay with your Zcash wallet.
          Once payment is confirmed, the Shopify order will be automatically marked as paid.
        </Paragraph>
      </Step>

      <SectionDivider />

      <SectionTitle>Troubleshooting</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2 }}>
        <Strong>Payment button doesn&apos;t appear on the Thank You page</Strong> — Make sure you added the CipherPay Checkout block in the checkout editor (Settings &rarr; Checkout &rarr; Customize &rarr; Thank you page) and clicked Save.<br /><br />
        <Strong>Order status doesn&apos;t update after payment</Strong> — Verify the webhook URL is set correctly in your CipherPay dashboard. Check that the webhook secret in both CipherPay and the Shopify app settings match.<br /><br />
        <Strong>&quot;Payment not ready&quot; message</Strong> — This usually means the app is still creating the invoice. Wait a few seconds and the button should appear. If it persists, check that your CipherPay API key is correct.<br /><br />
        <Strong>Need help?</Strong> — Contact us at contact@atmospherelabs.dev
      </div>
    </>
  );
}
