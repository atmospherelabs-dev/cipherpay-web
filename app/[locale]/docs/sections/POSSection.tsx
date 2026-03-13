'use client';

import { Step, Callout, SectionDivider, Paragraph, SectionTitle, Strong } from '../components/DocComponents';

export default function POSSection() {
  return (
    <>
      <Paragraph>
        Accept Zcash at a physical store, market stall, conference, or pop-up event.
        You don&apos;t need special hardware — a phone, tablet, or laptop with a browser is all it takes.
        Your CipherPay dashboard doubles as a point-of-sale terminal.
      </Paragraph>

      <SectionTitle>How it works</SectionTitle>
      <Paragraph>
        The POS flow is designed for in-person transactions where speed matters:
      </Paragraph>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 20 }}>
        1. Open your dashboard on a tablet or phone<br />
        2. Switch to the <Strong>POS</Strong> tab<br />
        3. Select items from your product catalog (you can add multiple items to a cart)<br />
        4. Tap <Strong>Checkout</Strong> — a QR code appears on screen<br />
        5. The customer scans the QR code with their Zcash wallet and pays<br />
        6. The screen updates in real-time: &quot;Detected&quot; (mempool) → &quot;Confirmed&quot; (block)
      </div>

      <SectionDivider />

      <Step n={1} title="Set up your product catalog">
        <Paragraph>
          Before using POS mode, add your items in the dashboard → Products.
          Set a name and price for each item. For a coffee shop, you might have:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          • Espresso — €3.50<br />
          • Flat White — €4.50<br />
          • Avocado Toast — €8.00<br />
        </div>
      </Step>

      <Step n={2} title="Use the POS tab at the counter">
        <Paragraph>
          Open your CipherPay dashboard on any device. Go to the <Strong>POS</Strong> tab.
          Tap products to add them to the cart. Tap <Strong>Checkout</Strong> when the customer is ready.
        </Paragraph>
        <Paragraph>
          A QR code and payment details appear on screen. Hand the device to the customer or point it at them.
        </Paragraph>
      </Step>

      <Step n={3} title="Wait for confirmation">
        <Paragraph>
          The payment is typically detected in the mempool within <Strong>5-10 seconds</Strong>.
          For low-value items (coffee, food), mempool detection is usually sufficient — the risk of a double-spend on Zcash is extremely low.
          For higher-value items, wait for a block confirmation (~75 seconds).
        </Paragraph>
      </Step>

      <Callout type="tip">
        At conferences and events, you can set up a tablet running the CipherPay dashboard as your &quot;register.&quot;
        Multiple staff members can use the same account simultaneously from different devices.
      </Callout>

      <Callout type="info">
        The POS mode supports multi-item carts — you can select multiple products and create a single invoice for the total.
        This is especially useful for restaurants, cafes, and retail.
      </Callout>
    </>
  );
}
