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

## License

MIT
