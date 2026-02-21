# CipherPay Web

**Frontend for CipherPay** — hosted checkout page, merchant dashboard, landing page, and docs.

Live at [cipherpay.app](https://cipherpay.app)

## Features

- **Hosted checkout** (`/pay/[id]`) — QR code, payment instructions, real-time status via SSE, auto-redirect
- **Merchant dashboard** (`/dashboard`) — register, manage products, configure webhooks, view invoices
- **Landing page** — product overview with API examples
- **Documentation** (`/docs`) — integration guide
- **Theme support** — light/dark mode, merchants can force theme via URL param

## Tech Stack

- **Next.js 15** (App Router)
- **React 19** + TypeScript
- **Tailwind CSS**
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
├── page.tsx                # Landing page
├── pay/[id]/               # Hosted checkout (QR, payment flow)
├── buy/[id]/               # Product purchase page
├── dashboard/              # Merchant dashboard
│   ├── login/
│   ├── register/
│   └── recover/
├── docs/                   # Integration documentation
└── faq/                    # FAQ

components/
├── QRCode.tsx              # Theme-aware QR with logo
├── Logo.tsx                # CipherPay logo
├── ThemeToggle.tsx          # Light/dark toggle
├── CopyButton.tsx          # Clipboard copy
└── CountdownTimer.tsx      # Invoice expiry timer

contexts/
├── AuthContext.tsx          # Merchant auth state
└── ThemeContext.tsx         # Theme state

lib/
├── api.ts                  # Backend API client
└── config.ts               # Environment config
```

## Checkout Flow

1. Merchant's store creates an invoice via CipherPay API
2. Buyer is redirected to `/pay/[invoice_id]`
3. Page shows QR code, payment address, required memo
4. Real-time status updates via SSE (pending → detected → confirmed)
5. Auto-redirect back to merchant's store after confirmation

## Related

- **[CipherPay API](https://github.com/Kenbak/cipherpay-api)** — Rust API server
- **[CipherScan](https://cipherscan.app)** — Zcash blockchain explorer (data source)

## License

MIT
