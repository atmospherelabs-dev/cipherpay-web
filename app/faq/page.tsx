import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ — CipherPay',
  description: 'Frequently asked questions about CipherPay, privacy, security, and self-hosting.',
};

const sections = [
  {
    title: 'Privacy Model',
    questions: [
      {
        q: 'Is CipherPay truly private?',
        a: `CipherPay uses Zcash shielded transactions exclusively. On the blockchain, 
all payments are fully encrypted — no outside observer can see the sender, receiver, 
amount, or memo. However, CipherPay (as the payment processor) does see the transaction 
details because it performs trial decryption using your viewing key. This is the same 
trade-off as any payment processor: Stripe sees your transactions too. The difference 
is that the blockchain layer is completely dark.`,
      },
      {
        q: 'What data does CipherPay have access to?',
        a: `When using the hosted service, CipherPay can see: your Unified Full Viewing Key 
(read-only, cannot spend funds), payment amounts, product names, and shipping information 
you attach to invoices. We cannot see the buyer's wallet balance, other transactions, 
or identity. We never hold your ZEC — payments go directly to your shielded address.`,
      },
      {
        q: 'How do I get maximum privacy?',
        a: `Self-host CipherPay. The entire codebase is open-source. When you run your own 
instance, only your server holds the viewing key, and CipherPay (the company) sees 
nothing. You get the same features — mempool scanning, trial decryption, webhooks — 
with zero third-party data exposure.`,
      },
      {
        q: 'Can CipherPay spend my funds?',
        a: `No. CipherPay uses a Unified Full Viewing Key (UFVK), which is read-only. 
It can detect incoming payments but cannot create transactions or move your ZEC. 
Your spending keys never leave your wallet.`,
      },
    ],
  },
  {
    title: 'Wallet Security',
    questions: [
      {
        q: 'Should I use my personal wallet for my store?',
        a: `No. Generate a dedicated wallet exclusively for your CipherPay store. This 
isolates your commercial transaction history from your personal finances. If the 
server is ever compromised, an attacker would only see your store's sales history, 
not your personal net worth or other transactions. Sweep funds from your store 
wallet to cold storage regularly.`,
      },
      {
        q: 'What is the recommended wallet setup?',
        a: `1. Create a brand new wallet (using Zingo, YWallet, or zcashd) dedicated to your store.
2. Export the Unified Full Viewing Key (UFVK) from that wallet.
3. Use that UFVK when registering on CipherPay.
4. Periodically sweep received funds to your main cold storage wallet.
5. Never reuse this wallet for personal transactions.`,
      },
      {
        q: 'Can I change my payment address?',
        a: `Yes. You can update your payment address anytime from the dashboard settings. 
New invoices will use the new address. Existing pending invoices keep the address 
they were created with. This is useful for address rotation and privacy hygiene.`,
      },
      {
        q: 'Can I change my viewing key (UFVK)?',
        a: `Not in the current version. Changing the UFVK requires the scanner to keep the 
old key active until all pending invoices are resolved. For now, if you need to 
rotate your viewing key, contact support or create a new merchant account. UFVK 
rotation is planned for a future release.`,
      },
    ],
  },
  {
    title: 'How It Works',
    questions: [
      {
        q: 'How does CipherPay detect payments?',
        a: `CipherPay continuously scans the Zcash mempool and new blocks using your UFVK. 
It performs Orchard trial decryption on every shielded transaction to check if it's 
addressed to your wallet. When a match is found, it reads the encrypted memo field 
to identify which invoice was paid. This provides sub-minute payment detection — 
often within seconds of the buyer sending the transaction.`,
      },
      {
        q: 'What is the memo code (e.g. CP-C6CDB775)?',
        a: `Each invoice gets a unique memo code that the buyer includes in their Zcash 
transaction memo field. This is how CipherPay matches a payment to a specific 
invoice. The QR code and Zcash URI automatically include the memo, so the buyer 
doesn't need to type it manually.`,
      },
      {
        q: 'What happens if the buyer sends the wrong amount?',
        a: `CipherPay accepts payments within 0.5% of the invoice price to account for 
wallet rounding and network fee differences. If a payment is significantly 
underpaid, it is ignored and the invoice remains pending. The buyer would need 
to send the correct amount.`,
      },
      {
        q: 'How long do invoices last?',
        a: `By default, 30 minutes. This window locks the ZEC/EUR exchange rate at the 
time of invoice creation, protecting both the merchant and buyer from price 
volatility. If the invoice expires, a new one must be created (with a fresh rate).`,
      },
    ],
  },
  {
    title: 'Self-Hosting',
    questions: [
      {
        q: 'Can I self-host CipherPay?',
        a: `Yes. CipherPay is fully open-source. Clone the repository, configure your 
environment variables (UFVK, CipherScan API URL, database), and run the Rust 
binary. It works with SQLite for local development or PostgreSQL for production. 
You get all features without any dependency on our hosted service.`,
      },
      {
        q: 'Do self-hosted instances cost anything?',
        a: `No. Self-hosting is completely free. You run the infrastructure, you pay for 
your own server costs, and CipherPay charges nothing. The hosted service is 
a convenience tier for merchants who don't want to manage infrastructure.`,
      },
      {
        q: 'What do I need to self-host?',
        a: `A server with Rust installed (or use the Docker image), access to a CipherScan 
API instance (public testnet/mainnet endpoints work), and a Zcash wallet to 
generate your UFVK. The minimum requirements are modest — the Rust binary 
is lightweight and SQLite handles small-to-medium volume.`,
      },
    ],
  },
  {
    title: 'Pricing & Plans',
    questions: [
      {
        q: 'Is CipherPay free?',
        a: `The current version is free for all users. Subscription tiers with rate 
limits and premium features are planned for the future. Self-hosting will 
always remain free.`,
      },
      {
        q: 'Will there be transaction fees?',
        a: `No. CipherPay does not take a percentage of your sales. The planned 
monetization model is a flat subscription fee for the hosted service, 
not a per-transaction cut. Your revenue is your revenue.`,
      },
      {
        q: 'Can I pay for CipherPay with ZEC?',
        a: `That's the plan. When subscription tiers launch, you'll be able to pay 
for your CipherPay subscription using CipherPay itself — fully shielded 
ZEC payments, no credit card required. Dogfooding at its finest.`,
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 w-full z-50 border-b border-cp-border bg-cp-bg/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/"><Logo size="md" /></Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/dashboard/login" className="btn-secondary text-sm">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-cp-muted mb-12">
            Privacy model, security practices, and how CipherPay works under the hood.
          </p>

          <div className="space-y-12">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-xl font-semibold mb-6 text-cp-cyan">
                  {section.title}
                </h2>
                <div className="space-y-6">
                  {section.questions.map((item) => (
                    <div key={item.q} className="card p-5">
                      <h3 className="font-medium mb-3">{item.q}</h3>
                      <p className="text-sm text-cp-muted leading-relaxed whitespace-pre-line">
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-cp-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-cp-muted">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span>&middot; Powered by CipherScan</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-cp-cyan transition-colors">Home</Link>
            <a href="https://cipherscan.app" target="_blank" rel="noopener noreferrer" className="hover:text-cp-cyan transition-colors">CipherScan</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
