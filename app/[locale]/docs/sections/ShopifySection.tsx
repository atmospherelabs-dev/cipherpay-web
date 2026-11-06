'use client';

import { Code, CodeBlock, Step, Callout, SectionDivider, Paragraph, SectionTitle, Strong } from '../components/DocComponents';

export default function ShopifySection() {
  return (
    <>
      <Paragraph>
        If you run a Shopify store, you can accept Zcash payments with CipherPay using a merchant-owned custom app.
        The app handles invoice creation, shows a payment button on the Thank You page, and updates order statuses when payment is confirmed.
      </Paragraph>

      <Callout type="info">
        Estimated setup time: <Strong>15 minutes</Strong>. You need a CipherPay account, Shopify admin access, and a free Shopify Partner account to create your private app.
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

      <div style={{ margin: '24px 0', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--cp-border)' }}>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src="https://www.youtube.com/embed/CfnQORoMOEs"
            title="CipherPay for Shopify — Setup Walkthrough"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
        <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', padding: '8px 12px', background: 'var(--cp-bg)' }}>
          Full setup walkthrough — install, configure, and test a payment in under 5 minutes.
        </div>
      </div>

      <SectionDivider />

      <Step n={1} title="Create your private Shopify app">
        <Paragraph>
          Create or log into a free Shopify Partner account, then open the Shopify Dev Dashboard and create a new app.
          This is a private custom app for your own store — you do not submit it to the Shopify App Store.
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.4, marginBottom: 12 }}>
          <Strong>App URL</Strong> — Use <Code>https://connect.cipherpay.app</Code> temporarily when creating the app. CipherPay will set the final app URL when the checkout block is deployed.<br />
          <Strong>Redirect URL</Strong> — Use <Code>https://connect.cipherpay.app/api/auth/callback</Code>.<br />
          <Strong>Scopes</Strong> — Use <Code>read_orders,write_orders</Code>.<br />
          <Strong>Embedded app</Strong> — Leave disabled.
        </div>
        <Paragraph>
          Copy the app&apos;s Client ID and Client Secret from <Strong>Settings &rarr; Credentials</Strong>. Both must come from the same app; a secret from another app makes the install fail with &quot;Client Secret does not match this app&quot;.
          Then create a service account (app <Strong>Settings &rarr; App CLI automation token &rarr; Manage &rarr; Add service account</Strong>, with <Strong>App development</Strong> access to this app) and copy its token in the same Dev Dashboard and copy its token. An existing App automation token (<Code>atkn_...</Code>) also works.
          CipherPay uses these to securely deploy the checkout block to your private app. The service account token is used once and is not stored.
        </Paragraph>
      </Step>

      <Step n={2} title="Allow network access (required)">
        <Callout type="warning">
          Without this, Shopify creates the app version but never publishes the CipherPay checkout block, so customers see no
          payment button and no invoice is created.
        </Callout>
        <Paragraph>
          The checkout block calls CipherPay to create the invoice, which Shopify treats as network access. This setting lives in the
          <Strong> Partner Dashboard</Strong> (partners.shopify.com), not the Dev Dashboard:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          1. Open <Strong>Apps</Strong> and select your CipherPay app<br />
          2. Open <Strong>API access requests</Strong><br />
          3. Under &quot;Allow network access in checkout and account UI extensions&quot;, click <Strong>Allow network access</Strong>. It is approved immediately.
        </div>
      </Step>

      <Step n={3} title="Deploy and install your private app">
        <Paragraph>
          Go to <Strong>CipherPay Dashboard &rarr; Settings &rarr; Integrations &rarr; Shopify</Strong>. Paste your permanent store domain,
          Shopify Client ID, Client Secret, Shopify service account token, and CipherPay dashboard token.
        </Paragraph>
        <Paragraph>
          CipherPay will create a dedicated restricted API key, configure the webhook URL, and deploy the checkout extension to your private Shopify app.
          The app version will contain the final App URL and Redirect URL automatically, so you do not need to manually edit the version URLs after deployment.
        </Paragraph>
        <Paragraph>
          Wait for the status to show <Strong>connected</Strong>. If it shows <Strong>action needed</Strong>, Shopify created the version but did not
          release it: finish step 2, then open the version from the link shown and click <Strong>Release</Strong>.
        </Paragraph>
        <Paragraph>
          Next, choose <Strong>Custom distribution</Strong> in Shopify and enter your store&apos;s permanent <Code>.myshopify.com</Code> domain.
          Shopify will generate a private install link for your store.
        </Paragraph>
        <Paragraph>
          Open the install link and approve the app. If Shopify shows both a store name and an internal generated domain, use the permanent domain Shopify uses in the install link.
          You&apos;ll be redirected to the CipherPay Shopify settings page.
        </Paragraph>
      </Step>

      <Step n={4} title="Confirm connector settings">
        <Paragraph>
          After installation, you&apos;ll be redirected to the CipherPay Shopify settings page. If setup was completed from the CipherPay dashboard,
          your API key, webhook secret, and API URL should already be configured.
        </Paragraph>
        <Paragraph>
          You only need to edit this page if you are troubleshooting or intentionally replacing the generated restricted API key.
        </Paragraph>
      </Step>

      <Step n={5} title="Add a manual payment method">
        <Paragraph>
          In your Shopify admin, go to <Strong>Settings &rarr; Payments &rarr; Manual payment methods</Strong> and add a method called exactly:
        </Paragraph>
        <CodeBlock lang="text" code={`Pay with Zcash (ZEC)`} />
        <Paragraph>
          This is the payment option customers will see at checkout. You can add a description like
          &quot;Pay securely with Zcash cryptocurrency via CipherPay.&quot;
        </Paragraph>
        
      </Step>

      <Step n={6} title="Add the payment button to the Thank You page">
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

      <Step n={7} title="Test a payment">
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
        <Strong>Payment button doesn&apos;t appear on the Thank You page, and no invoice is created</Strong> — Allow network access (step 2), then in the Dev Dashboard open your app &rarr; Versions and make sure the newest version is <Strong>Active</Strong>; if not, open it and click Release. Also confirm the CipherPay Checkout block is on the Thank you page in the checkout editor and saved, and that the order used &quot;Pay with Zcash (ZEC)&quot;.<br /><br />
        <Strong>&quot;Client Secret does not match this app&quot; during install</Strong> — The secret saved in CipherPay belongs to a different Shopify app. Copy the Client Secret from the app with the same Client ID, run setup again, and reinstall.<br /><br />
        <Strong>Order status doesn&apos;t update after payment</Strong> — Open the CipherPay Shopify settings page and confirm the API key, webhook secret, and API URL are configured.<br /><br />
        <Strong>&quot;Payment not ready&quot; message</Strong> — This usually means the app is still creating the invoice. Wait a few seconds and try again. If it persists, confirm the connector settings are configured.<br /><br />
        <Strong>Need help?</Strong> — Contact us at contact@atmospherelabs.dev
      </div>
    </>
  );
}
