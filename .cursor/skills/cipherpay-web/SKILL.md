---
name: cipherpay-web
description: CipherPay web frontend — merchant dashboard, checkout page, docs, and landing page.
metadata:
  author: cipherpay
  version: "1.0.0"
---

# CipherPay Web Frontend Rules

Project-specific guidelines for the CipherPay Next.js frontend.

## When to Use

These rules apply to ALL work on cipherpay-web:
- Dashboard pages (products, invoices, billing, settings)
- Checkout/payment page
- Landing page and documentation
- Component development

## Categories

| Category | Priority | Description |
|----------|----------|-------------|
| Security | Critical | Never expose API keys, secrets in client code |
| API Integration | High | Calls to CipherPay Rust backend |
| Design System | High | Dark theme, monospace, Atmosphere brand |
| Pages | Medium | Dashboard, checkout, docs, landing |

## Architecture

```
app/
├── page.tsx              # Landing page
├── docs/page.tsx         # Documentation (all guides)
├── faq/page.tsx          # FAQ
├── pay/[id]/page.tsx     # Checkout payment page
├── settings/page.tsx     # Merchant settings
├── dashboard/            # Merchant dashboard
│   ├── page.tsx          # Overview
│   ├── products/         # Product management
│   ├── invoices/         # Invoice history
│   └── billing/          # Billing history
components/
├── Logo.tsx              # LogoMark component
├── NavLinks.tsx          # Navigation
├── CopyButton.tsx        # Copy-to-clipboard
├── SmartCTA.tsx          # Auth-aware CTA button
public/
├── logo-dark-bg.png      # Source logo (dark background)
├── logo-mark.png         # Logo mark only
├── icon-512.png          # PWA icon
├── favicon.png           # Browser favicon
```

## Design System

- **Font**: `Geist Mono` (monospace throughout)
- **Background**: `var(--cp-bg)` — near-black
- **Text**: `var(--cp-text)` — light gray
- **Accent**: `var(--cp-cyan)` — bright cyan
- **Highlight**: `var(--cp-purple)` — purple for emphasis
- **Borders**: `var(--cp-border)` — subtle dark borders
- **Components**: `.panel`, `.panel-header`, `.panel-body`, `.btn`, `.btn-primary`

## Related Projects

- **cipherpay**: Rust backend (API source)
- **cipherpay-shopify**: Shopify app integration
