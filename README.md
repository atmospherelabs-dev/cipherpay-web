# CipherPay Web

**Frontend for CipherPay** — hosted checkout, merchant dashboard, product buy pages, docs, and landing page.

Live at [cipherpay.app](https://cipherpay.app)

## Features

- **Hosted checkout** (`/pay/[id]`) — QR code, real-time status via SSE, auto-redirect, underpaid/overpaid handling
- **Product buy pages** (`/buy/[slug]`) — public purchase page with currency selection and refund address
- **Merchant dashboard** (`/dashboard`) — products, invoices, POS, billing, subscriptions (x402), settings
- **Landing page** — product overview with live API examples
- **Documentation** (`/docs`) — integration guides for Shopify, WooCommerce, custom integrations, API reference
- **FAQ** (`/faq`)
- **i18n** — English, Spanish, Portuguese via `next-intl`
- **Theme support** — light/dark mode, merchants can force theme via `?theme=` URL param

## Tech Stack

- **Next.js 15** (App Router) with locale-based routing
- **React 19** + TypeScript
- **Tailwind CSS** + CSS custom properties (design tokens)
- **next-intl** for internationalization
- **qrcode.react** for QR generation
- Deployed on **Vercel**

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Dev server starts on `http://localhost:3001`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | CipherPay backend URL (e.g. `http://localhost:3080`) |

## Project Structure

```
app/
├── globals.css                     # Design tokens + component styles
└── [locale]/
    ├── page.tsx                    # Landing page
    ├── docs/                      # Integration documentation
    │   └── sections/              # Doc sections (Shopify, WooCommerce, API ref, etc.)
    ├── faq/                       # FAQ
    ├── pay/[id]/                  # Hosted checkout (QR, payment flow, SSE)
    ├── buy/[id]/                  # Product purchase page
    ├── admin/                     # Admin dashboard
    └── dashboard/
        ├── DashboardClient.tsx    # Main dashboard shell
        ├── login/                 # Merchant login
        ├── register/              # Merchant registration
        ├── recover/               # Account recovery
        ├── components/            # Navbar, sidebar, refund modal
        └── tabs/
            ├── OverviewTab.tsx    # Dashboard home — stats, recent invoices, setup checklist
            ├── ProductsTab.tsx   # Product CRUD, pricing, API integration snippets
            ├── InvoicesTab.tsx   # Invoice list with status filters, CipherScan links
            ├── POSTab.tsx        # Point of sale — tap-to-add product grid
            ├── BillingTab.tsx    # Usage fees, settlement history
            ├── X402Tab.tsx       # HTTP 402 payment verifications
            └── SettingsTab.tsx   # Store config, webhooks, API keys, recovery email

components/
├── SiteHeader.tsx                 # Shared header for public pages
├── SiteFooter.tsx                 # Shared footer for public pages
├── QRCode.tsx                     # Theme-aware QR with CipherPay logo
├── Logo.tsx                       # CipherPay logo
├── ThemeToggle.tsx                # Light/dark toggle
├── LanguageSwitcher.tsx           # Locale switcher (EN/ES/PT)
├── CopyButton.tsx                 # Clipboard copy with label
├── NavLinks.tsx                   # Navigation links
├── StatusBadge.tsx                # Invoice status badges
├── Banner.tsx                     # Alert/info banners (warning, error variants)
├── EmptyState.tsx                 # Empty state placeholder
├── SectionLabel.tsx               # Consistent section headings
├── HelpText.tsx                   # Subtle helper text
├── Spinner.tsx                    # Loading spinner
├── SmartCTA.tsx                   # Smart call-to-action
└── CountdownTimer.tsx             # Invoice expiry timer

contexts/
├── AuthContext.tsx                 # Merchant auth state
├── ThemeContext.tsx                # Theme state (light/dark)
└── ToastContext.tsx                # Toast notifications

lib/
├── api.ts                         # Backend API client (all endpoints)
├── config.ts                      # Environment config
├── currency.ts                    # Currency symbols + fiat formatting
└── validation.ts                  # Zcash address validation

messages/
├── en/                            # English translations (10 namespaces)
├── es/                            # Spanish translations
└── pt/                            # Portuguese translations
```

## Checkout Flow

1. Merchant's store creates an invoice via CipherPay API (or buyer clicks a buy link)
2. Buyer lands on `/pay/[invoice_id]` (or `/buy/[slug]` for direct product purchases)
3. **Draft** → buyer clicks "Lock Rate & Pay" to lock the ZEC exchange rate
4. **Pending** → page shows QR code, countdown timer, "Open in Wallet" button
5. Real-time status updates via SSE (pending → detected → confirmed)
6. **Confirmed** → receipt with CipherScan transaction link, auto-redirect to merchant

## Related

- **[CipherPay API](https://github.com/atmospherelabs-dev/cipherpay-api)** — Rust backend
- **[CipherPay Shopify](https://github.com/atmospherelabs-dev/cipherpay-shopify)** — Shopify integration
- **[CipherScan](https://cipherscan.app)** — Zcash blockchain explorer
- **[Zipher](https://zipher.to)** — Zcash wallet (mobile, desktop & CLI)

## License

MIT

## Optional cross-chain checkout

Set `NEXT_PUBLIC_CROSSCHAIN_ENABLED=true` at build time after the CipherPay API
cross-chain migration and endpoints are deployed. Keep it unset/false until the
funded qualification described in the backend README is complete. API configuration
requires `NEAR_CROSSCHAIN_ENABLED`, `NEAR_ONECLICK_API_KEY` and encryption on mainnet.
After launch, disable **new quotes** with the backend flag; leave the frontend
flag enabled so existing payments can recover safely.

Before wallet connection, checkout checks each supported route with a dry exact-output
quote. Only confirmed available routes can be selected. If every route reports
a minimum above the invoice amount, Other crypto is disabled and direct ZEC
remains available. Provider timeouts or errors show a retry state, never a claim
that the amount is too low. Availability checks create no payment attempt or
deposit instructions; final quotes are still validated before payment. Existing
attempts resume without a new eligibility check.

Buyers select a token **and network**, connect an injected wallet or enter a refund
address, review an exact-output estimate, then create deposit instructions. The
final amount is displayed before any wallet send. The original payment resumes
after reload, and provider completion still waits for CipherPay to detect the ZEC. The normal
receipt says “Payment accepted” on detection; confirmation remains a separate
backend fulfillment milestone.
Translations are included for English, Spanish, Portuguese and Arabic.

Confidential swap fees become **Handled by NEAR** only after the backend verifies
the original saved quote succeeded with CipherPay’s configured fee recipient and
rate, and the scanner confirmed the matching original Zcash delivery. These fees
are not billed to the merchant again. This is provider-trust evidence: actual
receipt-verified collected amounts remain separate, and handled fees do not add
invented received units or referral earnings. A direct ZEC payment does not gain
this status merely because its invoice has a swap quote.

Wallet discovery/send code is adapted from CipherSwap. EVM wallets switch to the
selected chain and recheck the account; Phantom/Solflare support SOL and classic
SPL USDC/USDT; TronLink supports TRX/USDT; Unisat supports Bitcoin. Other wallets
can use the address/amount/QR flow. This does not add WalletConnect or desktop-to-
mobile pairing. Mobile wallet in-app browsers may expose an injected provider.
No private keys enter CipherPay and payments use direct transfers, not approvals.

For Solana, configure server-only `SOLANA_RPC_URL` with a production mainnet RPC.
The default is the public mainnet endpoint. `/api/rpc/solana` restricts origin,
request size and methods; it only constructs transactions (no signing/broadcast).
Production infrastructure should rate-limit that endpoint. TRON RPC origins are
explicitly allowed by CSP; custom TronLink nodes use manual payment.

Validation commands: `npm run typecheck`, `npm run build`, and
`node --test tests/crosschain.test.cjs`. Local mocked browser checks cover manual
quotes, EVM chain switching and exact transfer encoding, Phantom connection and
SPL transaction construction, rejection, broadcast lock and reload recovery. Real extension/network transfers still need qualification.
The SPL instruction encoder was compared byte-for-byte with the upstream SPL SDK
before removing that SDK's vulnerable native bigint dependency.

Dependency audit: no high/critical findings. The remaining moderate advisory is
`stream-json` (GHSA-528h-pc64-c93x) through `jayson`/`@solana/web3.js`; it concerns
Jayson's server streaming parser. Checkout dynamically loads web3's browser client,
which uses `JSON.parse` and does not import that server parser. No Solana SDK runs
in the RPC route. Track an upstream fix; the `uuid` override retains its compatible
CJS API while fixing the separate bounds-check advisory.

## Private staging deployment

The dedicated Vercel project is `cipherpay-staging` (project ID
`prj_P49aBZHtjIIEA1ndDNu4QIo4KIhz`), separate from the public `cipherpay` project.
Its deployment copy lives outside this checkout to preserve the production project
link. Run `npm run deploy:staging` to publish only this project: the command creates
a clean temporary copy and pins both the Vercel project and organization IDs.
Its `--prod` flag updates the stable alias of **cipherpay-staging**, not the public
CipherPay project. It does not push Git branches or change the normal project link.
Set `STAGING_MODE=true`, a random `STAGING_PASSWORD` of at least 24 characters,
`STAGING_API_URL=https://api.testnet.cipherpay.app/staging` and `STAGING_API_KEY`.
Set the public API base to `/api/staging` and enable cross-chain checkout.

The browser first authenticates as `cipherpay` with the staging password. Middleware
sets a secure, HttpOnly, host-only cookie so merchant Bearer authentication still
works. Missing staging credentials fail closed. The `/api/staging/*` proxy is
unavailable unless staging mode is enabled; it also validates authentication itself.
The proxy and server-rendered checkout requests use the upstream key only on the server.
Server Components use `lib/server-api.ts` with the absolute staging backend URL;
never pass the browser-relative `/api/staging` URL to server-side fetch.
Run `node --test tests/*.test.cjs` to include the staging routing regression check.
HTML/API responses are not cached and
carry `noindex`. A visible banner states that this isolated store uses real funds.

Staging passwords are deployment secrets, never `NEXT_PUBLIC_` values. The local
`.env.staging-access.local` file (ignored by Git) contains the tester login. Do not
copy production merchants, wallet keys or orders into staging. Register a dedicated
merchant using the viewing key/address of a wallet you control. No wallet has been
created or funded automatically.

The cross-chain selector uses token/network artwork from Zipher and wallet icon
assets from CipherSwap. Detected extension icons are rendered as images. Buyers
choose a token/network, then either a compatible installed wallet or explicit
“Pay without connecting.” The manual flow still requires a refund address and
shows the exact amount plus QR/address instructions. Native dialog search and
Escape/focus return, mobile light/dark layout, wallet filtering, and manual
quote-to-QR rendering were checked in a browser; the latter used simulated
responses and made zero wallet connection requests.

Staging checkout refresh (2026-10-05): token/network → payment method → review
replace each other, with Back available before a deposit attempt is created.
Connected wallets appear as a compact summary. Payment progress distinguishes
source detection, conversion and ZEC delivery; only the invoice scanner can
trigger acceptance. The symmetric payment tabs share one availability row with a spinner, green
availability check and explicit unavailable/retry states. The checkout header
uses matching 44px controls, and success icons use green. Animations respect
reduced-motion settings.

Invoice amount and creation-rate labels retain the invoice currency regardless
of the dashboard display preference (including CSV). Cross-chain receipts and merchant cards do not label provider output differences
as customer overpayments. Merchant invoices show a Cross-chain tag; actual received
ZEC remains visible and unchanged in accounting. The public invoice response exposes only an
`is_crosschain` flag, never private swap instructions. This flag is retained in
the current checkout before the invoice stream changes to detected.

Compact staging follow-up: completed selection steps show checks, availability
disappears after choosing crypto, and cancelled/unfunded wallet payments use a
compact prompt instead of the full processing timeline. The token modal has a
thin themed scrollbar, and timeline connectors stop outside the step circles.

Checkout recap follow-up: merchant/item, invoice total, token/network, quoted
source amount, connected wallet and payment status share one recap. Payment
actions sit below it. In-progress screens keep one no-resend reminder; state-specific recovery
copy takes precedence over generic instructions. Updated in all four locales.

Simplified staging checkout: one outer card, a consistent inline status spinner
for wallet confirmation, source deposit and conversion. No processing stepper or
nested recap border. Started payments keep wallet, ZEC output and provider
information in Payment details; fees and privacy remain visible before payment.

Checkout selection order: the step indicator leads the card, followed by the
invoice recap and a visible current-step heading with Back aligned beside it.
Wallet and QR/address are equal-width, keyboard-accessible tabs sharing a panel.

Payment-type tabs use a compact 44px button height with inline icons; privacy
explanations remain outside the controls. The asset picker keeps its accessible
label without displaying a third Token and network heading.

Quote loading is rendered in the estimated-payment amount slot beside the
selected asset. The quote replaces that indicator in place; the separate loading
panel below Review and pay is removed.

On review, Amount details sits directly beneath the quoted source total as a
quiet disclosure. Expanded details use label/value rows for the exact source
amount and ZEC invoice total, with the full refund address wrapping below.

Review hierarchy follow-up: current-step heading and Back now follow the step
indicator before the recap. Invoice, quoted amount, details, fees and timing are
grouped together. The connected wallet sits immediately above the payment button.

The same disclosure position and styling now continues through payment
processing: Payment details sits below the source amount, above the status.
It retains the exact amount, invoice total, refund address, reference and
provider details.

Cross-chain receipts include a Paid with row with the source token logo, network
badge and explicit token/network name only when the persisted swap reports
`SUCCESS` and `settlementVerified === true`. Unused quotes, wallet prompts and
provider progress do not establish attribution. Receipt metadata retries every
five seconds for up to sixty seconds while settlement proof is pending, restarting
when the invoice status changes and stopping on verified delivery,
terminal/unfunded states or unmount. Without verified
attribution, the source-token row stays hidden and the ZEC receipt remains usable.

The buy page is an order summary with a Continue to payment action. Payment
options are chosen at checkout; the crypto hint follows the cross-chain feature
flag. The optional merchant Zcash refund address is collapsed and distinguished
from the source-network address requested for conversion refunds. Product and
ticket buttons and buy-page metadata no longer imply ZEC is the only method.

Crypto route availability is shown in the crypto tab itself: spinner while
checking, then the public-source eye icon. The tab remains selectable; loading, unavailable
and retry messages appear only in its selected view. The ZEC view has no crypto
availability panel. Payment-entry controls remain gated on an available route.

When crypto is selected during availability checks, the same checkout card
retains the step header and order recap with an explicit Checking payment options message explaining that tokens and
networks are being checked for this amount. Ready routes replace it in place;
retry states remain in the card.
The ZEC amount includes the existing CipherSwap ZEC token logo beside its
currency label. Checkout and receipts show only the invoice fiat currency; the
previous automatic secondary EUR/USD conversion has been removed.

Staging fee policy (2026-10-14): frontend deployment
`dpl_8JEFE5Usq3xuTBCx2CV3SySwsSzu` on
[cipherpay-staging.vercel.app](https://cipherpay-staging.vercel.app/) adds Handled by
NEAR billing and verified receipt attribution in all four locales. Validation:
13 cross-chain tests passed, `npm run typecheck` passed, and `npm run build` passed.
