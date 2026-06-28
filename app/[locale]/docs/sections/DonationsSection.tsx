import { SectionTitle, Paragraph, CodeBlock, Callout, SectionDivider } from '../components/DocComponents';

export default function DonationsSection() {
  return (
    <>
      <SectionTitle>Donation Mode</SectionTitle>
      <Paragraph>
        CipherPay supports <strong>non-custodial, shielded Zcash donations</strong> through
        donation links. Donors choose their amount, pay via shielded ZEC, and the funds
        go directly to your wallet. No fiat conversion, no KYC, no PII stored.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>Setup</SectionTitle>
      <Paragraph>
        1. Go to <strong>Dashboard &rarr; Links</strong> and switch to <strong>Donation Links</strong>.
      </Paragraph>
      <Paragraph>
        2. Click <strong>+ New Donation Link</strong> and fill in the form:
      </Paragraph>
      <ul style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--cp-text-dim)', paddingLeft: 20 }}>
        <li><strong>Organization Name</strong> — displayed to donors (required)</li>
        <li><strong>Campaign Name</strong> — the specific campaign or initiative</li>
        <li><strong>Cover Image</strong> — HTTPS URL for a campaign hero image, with focus position (Top / Center / Bottom)</li>
        <li><strong>Mission Statement</strong> — shown on the donation page</li>
        <li><strong>Campaign Goal / Currency</strong> — enables a progress bar. Currency is locked after creation.</li>
        <li><strong>Suggested Amounts</strong> — preset buttons (e.g. $10, $25, $50, $100). Donors can also enter a custom amount.</li>
        <li><strong>Thank You Message</strong> — shown to donors after payment is confirmed</li>
        <li><strong>Contact Email</strong> — for tax receipt inquiries (out-of-band)</li>
        <li><strong>Website URL</strong> — link to your organization</li>
        <li><strong>Social Share Text</strong> — pre-filled text when donors share the donation link</li>
      </ul>
      <Paragraph>
        3. Share the generated <code>/donate/&#123;slug&#125;</code> URL with your supporters.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>Editing Campaigns</SectionTitle>
      <Paragraph>
        Click <strong>Edit</strong> on any donation link in the dashboard to update its details.
        All fields are editable except <strong>Currency</strong>, which is locked after creation
        to preserve the integrity of the total raised amount.
      </Paragraph>
      <Paragraph>
        Common edits include updating the mission text, raising the goal after it&apos;s reached,
        changing the cover image, or refining the thank-you message.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>Donor Flow</SectionTitle>
      <Paragraph>1. Donor opens the donation link URL.</Paragraph>
      <Paragraph>2. Selects an amount (preset or custom) and clicks <strong>Donate</strong>.</Paragraph>
      <Paragraph>3. An invoice is created with the chosen fiat amount, converted to ZEC at the live rate.</Paragraph>
      <Paragraph>4. Donor scans the QR code or clicks <strong>Open in Wallet</strong> to pay from their Zcash wallet.</Paragraph>
      <Paragraph>5. After confirmation, a thank-you page is shown with the merchant&apos;s custom message, the donation receipt, and reference code.</Paragraph>

      <SectionDivider />

      <SectionTitle>donation_config Reference</SectionTitle>
      <CodeBlock lang="json" code={`{
  "mission": "Defending digital rights worldwide",
  "thank_you": "Thank you for supporting privacy.",
  "suggested_amounts": [1000, 2500, 5000, 10000],
  "currency": "USD",
  "min_amount": 100,
  "max_amount": 1000000,
  "campaign_name": "2026 Legal Defense Fund",
  "campaign_goal": 1000000,
  "cover_image_url": "https://example.org/campaign-hero.jpg",
  "cover_image_position": "center top",
  "contact_email": "donations@example.org",
  "website_url": "https://example.org",
  "social_share_text": "I just donated with Zcash!"
}`} />
      <Paragraph>
        All amounts are in <strong>cents</strong> (e.g. 1000 = $10.00).
        <code>min_amount</code> defaults to 100 ($1), <code>max_amount</code> to 1000000 ($10,000).
        <code>cover_image_position</code> accepts <code>center top</code>, <code>center center</code>,
        or <code>center bottom</code>.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>Campaign Progress</SectionTitle>
      <Paragraph>
        When <code>campaign_name</code> and <code>campaign_goal</code> are set, the donation page
        shows a progress bar. <code>total_raised</code> increments atomically when each donation
        is confirmed, tracking the fiat amount pledged at the time of donation (not live ZEC value).
      </Paragraph>
      <Paragraph>
        The campaign stays active after the goal is reached. Donors can still contribute.
        The progress bar caps at 100%, but the raised amount displays the true total.
      </Paragraph>
      <Paragraph>
        Campaigns have no time limit. Deactivate the link from the dashboard when the campaign is complete.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>Tax Receipts</SectionTitle>
      <Callout type="info">
        CipherPay never collects donor identity. Donations are anonymous by default.
      </Callout>
      <Paragraph>
        For tax receipts, donors are directed to contact the organization using the
        <code> contact_email</code> provided in the donation config. The thank-you page shows:
      </Paragraph>
      <Paragraph>
        <em>&quot;Want a tax receipt? Contact [Org] at [email] with reference code CP-XXXXXXXX.&quot;</em>
      </Paragraph>
      <Paragraph>
        The organization matches the memo code to the donation in their CipherPay dashboard
        and issues a receipt directly. CipherPay is never in the loop.
      </Paragraph>

      <SectionDivider />

      <SectionTitle>API Endpoints</SectionTitle>
      <Paragraph><strong>Create Donation Link</strong></Paragraph>
      <CodeBlock lang="bash" code={`POST /api/donation-links
Authorization: Bearer <api_key>

{
  "name": "Example Foundation",
  "mission": "Defending digital rights",
  "suggested_amounts": [1000, 2500, 5000],
  "currency": "USD",
  "campaign_name": "2026 Fund",
  "campaign_goal": 1000000,
  "contact_email": "donate@example.org",
  "cover_image_url": "https://example.org/hero.jpg",
  "cover_image_position": "center top",
  "website_url": "https://example.org",
  "social_share_text": "Donate with Zcash!"
}`} />

      <Paragraph><strong>Update Donation Link</strong></Paragraph>
      <CodeBlock lang="bash" code={`PATCH /api/payment-links/{id}
Authorization: Bearer <api_key>

{
  "name": "Updated Foundation Name",
  "donation_config": {
    "mission": "Updated mission statement",
    "campaign_goal": 2000000
  }
}`} />
      <Paragraph>
        Only include the fields you want to change. Omitted fields keep their existing values.
      </Paragraph>

      <Paragraph><strong>Get Donation Link Info (Public)</strong></Paragraph>
      <CodeBlock lang="bash" code={`GET /api/payment-links/{slug}/info`} />
      <Paragraph>Returns donation config, campaign progress, org name. No authentication required. Rate limited.</Paragraph>

      <Paragraph><strong>Create Donation Invoice (Public)</strong></Paragraph>
      <CodeBlock lang="bash" code={`POST /api/payment-links/{slug}/checkout

{
  "amount": 5000,
  "currency": "USD"
}`} />
      <Paragraph>Amount in cents. Creates an invoice and returns <code>invoice_id</code> and <code>checkout_url</code>.</Paragraph>

      <SectionDivider />

      <SectionTitle>Embed on Your Website</SectionTitle>
      <Paragraph>
        Add a donation widget to any website with a single script tag. The widget renders a
        self-contained card with your campaign image, mission, progress bar, and a
        &quot;Donate with Zcash&quot; button that opens your CipherPay donation page.
      </Paragraph>

      <Paragraph><strong>Basic embed</strong></Paragraph>
      <CodeBlock lang="html" code={`<script src="https://cipherpay.app/embed.js"
        data-campaign="your-campaign-slug"></script>`} />

      <Paragraph><strong>All options</strong></Paragraph>
      <CodeBlock lang="html" code={`<script src="https://cipherpay.app/embed.js"
        data-campaign="your-campaign-slug"
        data-locale="en"
        data-theme="dark"></script>`} />

      <Paragraph>
        <strong>Attributes:</strong>
      </Paragraph>
      <ul style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--cp-text-dim)', paddingLeft: 20 }}>
        <li><code>data-campaign</code> — your donation link slug (required)</li>
        <li><code>data-locale</code> — language for the donate page link: <code>en</code>, <code>es</code>, <code>pt</code>, <code>ar</code> (default: <code>en</code>)</li>
        <li><code>data-theme</code> — <code>dark</code> or <code>light</code> (default: <code>dark</code>)</li>
      </ul>

      <Callout type="info">
        The widget uses Shadow DOM — its styles never conflict with your site&apos;s CSS.
        It fetches campaign data from the public API on load, so the progress bar is always up to date.
      </Callout>

      <Paragraph><strong>WordPress</strong> — paste the script tag into a Custom HTML block. No plugin needed.</Paragraph>
      <Paragraph><strong>Static sites</strong> — add the script tag wherever you want the widget to appear.</Paragraph>
    </>
  );
}
