'use client';

import { Step, Callout, SectionDivider, Paragraph, SectionTitle, Strong, CodeBlock } from '../components/DocComponents';

export default function POSSection() {
  return (
    <>
      <Paragraph>
        Accept Zcash at a physical store, market stall, conference, or pop-up event.
        No special hardware needed — a phone, tablet, or laptop with a browser is all it takes.
        CipherPay includes a dedicated POS mode that&apos;s installable as a Progressive Web App.
      </Paragraph>

      <SectionTitle>Dedicated POS mode</SectionTitle>
      <Paragraph>
        CipherPay&apos;s POS is a standalone fullscreen experience at <Strong>/pos</Strong> — separate from the dashboard.
        It&apos;s designed for tablets and phones at the counter: no sidebar, no navigation, just a product grid, cart, and payment screen.
      </Paragraph>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 20 }}>
        • <Strong>Split-screen layout</Strong>: product catalog on the left, live cart on the right<br />
        • <Strong>Category tabs</Strong>: group products by category using the metadata field<br />
        • <Strong>Favorites</Strong>: star frequently sold items for quick access<br />
        • <Strong>Custom amount</Strong>: enter a one-off amount with a large numeric keypad<br />
        • <Strong>Tipping</Strong>: 10%, 15%, 20%, custom, or no tip — added before payment<br />
        • <Strong>Fullscreen QR</Strong>: large, high-contrast QR code with real-time status<br />
        • <Strong>Receipt screen</Strong>: print-ready receipt with auto-reset for the next customer
      </div>

      <SectionDivider />

      <SectionTitle>Employee access with POS PIN</SectionTitle>
      <Paragraph>
        You can hand a device to an employee without exposing your dashboard, API keys, or billing.
        Set a <Strong>4-digit POS PIN</Strong> in Dashboard → Settings. Employees enter the PIN to unlock the POS.
      </Paragraph>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 20 }}>
        <Strong>POS sessions can:</Strong> view product catalog, add to cart, create invoices, accept tips, view receipts<br />
        <Strong>POS sessions cannot:</Strong> edit products, access settings, view API keys, manage billing, issue refunds
      </div>

      <Callout type="tip">
        POS sessions last 4 hours. The &quot;Lock&quot; button returns to the PIN screen without logging out — useful for staff handoffs.
        Three wrong PIN attempts locks the device for 30 seconds.
      </Callout>

      <SectionDivider />

      <SectionTitle>Install as a PWA</SectionTitle>
      <Paragraph>
        CipherPay is a Progressive Web App. When you visit <Strong>/pos</Strong> in Chrome or Safari, you&apos;ll see an
        &quot;Install&quot; or &quot;Add to Home Screen&quot; prompt. Once installed, it runs in standalone mode — no browser chrome,
        no address bar. It looks and feels like a native app.
      </Paragraph>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 20 }}>
        1. Open <Strong>cipherpay.app/pos</Strong> on your tablet or phone<br />
        2. Tap the browser menu → <Strong>Install app</Strong> (Chrome) or <Strong>Add to Home Screen</Strong> (Safari)<br />
        3. The app icon appears on your home screen<br />
        4. Open it — fullscreen POS mode, no browser chrome
      </div>

      <Callout type="info">
        The PWA caches your product catalog for offline access. If the network drops briefly, your products still load from cache.
        Invoice creation requires an active connection.
      </Callout>

      <SectionDivider />

      <Step n={1} title="Set up your product catalog">
        <Paragraph>
          Before using POS mode, add items in Dashboard → Products. Set a name and price for each item.
          Optionally, add a <Strong>category</Strong> via the metadata field to organize items in the POS grid:
        </Paragraph>
        <CodeBlock lang="json" code={`{
  "category": "Drinks"
}`} />
      </Step>

      <Step n={2} title="Set a POS PIN">
        <Paragraph>
          Go to Dashboard → Settings → <Strong>POS PIN</Strong>. Set a 4-digit PIN.
          This is what your employees will enter to access the POS — it&apos;s not your dashboard token.
        </Paragraph>
      </Step>

      <Step n={3} title="Open the POS">
        <Paragraph>
          Navigate to <Strong>/pos</Strong> or click &quot;Open POS&quot; in the dashboard sidebar.
          Enter the PIN, then start ringing up sales.
        </Paragraph>
      </Step>

      <Step n={4} title="Ring up a sale">
        <Paragraph>
          Tap products to add them to the cart. Adjust quantities with +/- buttons.
          When ready, tap <Strong>Charge</Strong>. Choose a tip amount (or skip). A fullscreen QR code appears.
          The customer scans and pays. The screen shows <Strong>Detected</Strong> (mempool, ~5-10 seconds) then <Strong>Confirmed</Strong> (block, ~75 seconds).
        </Paragraph>
      </Step>

      <Step n={5} title="Receipt and next customer">
        <Paragraph>
          After payment, a receipt screen appears with the amount, ZEC equivalent, and invoice code.
          Tap <Strong>Print</Strong> to print via a connected receipt printer, or tap <Strong>New Sale</Strong> to start over.
          The screen auto-resets after 10 seconds of inactivity.
        </Paragraph>
      </Step>

      <SectionDivider />

      <SectionTitle>API reference</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 20 }}>
        <Strong>PUT /api/merchants/me/pos-pin</Strong> — set or remove the POS PIN (requires dashboard auth)<br />
        <Strong>GET /api/merchants/me/pos-pin</Strong> — check if a POS PIN is configured<br />
        <Strong>POST /api/auth/pos-session</Strong> — verify PIN and create a scoped POS session (4h TTL)
      </div>

      <Callout type="tip">
        At conferences and events, install the PWA on a tablet, set the POS PIN, and hand it to your team.
        Multiple devices can run the POS simultaneously against the same merchant account.
      </Callout>
    </>
  );
}
