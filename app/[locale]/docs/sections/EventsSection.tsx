'use client';

import { Code, CodeBlock, Step, Callout, Paragraph, SectionTitle, Strong } from '../components/DocComponents';

export default function EventsSection() {
  return (
    <>
      <Paragraph>
        Sell event tickets with Zcash. CipherPay handles ticket generation, capacity management, and QR-based check-in.
        No PII is stored — attendees get a private, scannable ticket the moment their payment confirms.
      </Paragraph>

      <Callout type="info">
        Events are built on top of CipherPay&apos;s billing pipeline. Under the hood, each event creates a product and
        prices — but you manage everything through the Events tab. The composition is invisible.
      </Callout>

      <SectionTitle>How it works</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 20 }}>
        • Create an event with title, date, location, and ticket tier(s)<br />
        • CipherPay creates a backing product and prices automatically<br />
        • Share the checkout link — capacity is enforced atomically<br />
        • On payment confirmation, a unique ticket code (<Code>tkt_...</Code>) is generated<br />
        • Buyers see the ticket QR code on the confirmation page<br />
        • At the door, scan tickets via the API to mark as used
      </div>

      <Step n={1} title="Create an event">
        <Paragraph>
          Go to your dashboard → Events → <Strong>+ Create Event</Strong>. Fill in the event details
          and at least one ticket tier with a price and optional capacity.
        </Paragraph>
        <Paragraph>
          Or use the API:
        </Paragraph>
        <CodeBlock lang="bash" code={`curl -X POST https://api.cipherpay.app/api/events \\
  -H "Content-Type: application/json" \\
  -H "Cookie: session=YOUR_SESSION" \\
  -d '{
    "title": "ZEC Privacy Summit",
    "event_date": "2026-06-15T18:00:00Z",
    "event_location": "Berlin, Germany",
    "prices": [{
      "currency": "EUR",
      "unit_amount": 25.00,
      "label": "General Admission",
      "max_quantity": 200
    }]
  }'`} />
      </Step>

      <Step n={2} title="Share the checkout link">
        <Paragraph>
          Each event gets a checkout link through its backing product. Copy it from the event detail view in
          the dashboard, or construct it from the <Code>product_id</Code> returned by the API.
        </Paragraph>
        <CodeBlock lang="text" code={`https://cipherpay.app/buy/{product_id}`} />
        <Paragraph>
          The checkout page displays event context (title, date, location) alongside the payment QR.
          When the tier reaches max capacity, new checkouts return <Code>Sold out</Code>.
        </Paragraph>
      </Step>

      <Step n={3} title="Tickets are generated automatically">
        <Paragraph>
          When a payment is confirmed on-chain, CipherPay mints a unique ticket:
        </Paragraph>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 12 }}>
          <Strong>Code</Strong> — <Code>tkt_</Code> + 32 hex chars (128-bit entropy, not guessable)<br />
          <Strong>Status</Strong> — <Code>valid</Code> → <Code>used</Code> (on scan) or <Code>void</Code> (merchant action)<br />
          <Strong>QR</Strong> — Displayed to the buyer on the confirmation page
        </div>
        <Paragraph>
          If you have a webhook configured, a <Code>ticket.created</Code> event is dispatched
          with the ticket code, event context, and invoice reference.
        </Paragraph>
      </Step>

      <Step n={4} title="Scan tickets at the door">
        <Paragraph>
          Use the scan API endpoint to validate and consume tickets:
        </Paragraph>
        <CodeBlock lang="bash" code={`curl -X POST https://api.cipherpay.app/api/tickets/scan \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"code": "tkt_a1b2c3d4e5f6..."}'`} />
        <Paragraph>
          The response tells you if the ticket is valid (first scan), already used, or voided:
        </Paragraph>
        <CodeBlock lang="json" code={`{
  "valid": true,
  "already_used": false,
  "voided": false,
  "ticket_status": "used",
  "ticket_id": "...",
  "used_at": "2026-06-15T19:42:00Z"
}`} />
      </Step>

      <SectionTitle>Managing events</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 2.2, marginBottom: 20 }}>
        • <Strong>Active</Strong> — Tickets can be purchased<br />
        • <Strong>Past</Strong> — Automatically set 24h after <Code>event_date</Code>. Product is deactivated.<br />
        • <Strong>Cancelled</Strong> — Manually cancelled by merchant. No new sales.<br />
        • <Strong>Void a ticket</Strong> — <Code>POST /api/tickets/&#123;id&#125;/void</Code> marks it as void (refund flow)
      </div>

      <SectionTitle>API endpoints</SectionTitle>
      <CodeBlock lang="text" code={`GET    /api/events              — List your events
POST   /api/events              — Create event (with product + prices)
POST   /api/events/{id}/archive — Cancel an event

GET    /api/tickets             — List all tickets
GET    /api/tickets/invoice/{id}— Get ticket by invoice (public, limited)
POST   /api/tickets/scan        — Scan/validate a ticket
POST   /api/tickets/{id}/void   — Void a ticket`} />

      <Callout type="tip">
        Event-backed products are protected: generic <Code>PATCH /api/products</Code> and <Code>DELETE /api/products</Code>
        calls return <Code>409 Conflict</Code>. Use the events endpoints to manage lifecycle.
      </Callout>
    </>
  );
}
