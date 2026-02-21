'use client';

import { useState } from 'react';
import { api, type RegisterResponse } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CopyButton } from '@/components/CopyButton';
import Link from 'next/link';

export default function RegisterPage() {
  const [ufvk, setUfvk] = useState('');
  const [address, setAddress] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RegisterResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.register({
        ufvk,
        payment_address: address,
        webhook_url: webhookUrl || undefined,
        email: email || undefined,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
    setLoading(false);
  };

  if (result) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-cp-border px-6 py-3 flex items-center justify-between">
          <Link href="/"><Logo size="sm" /></Link>
          <ThemeToggle />
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="card p-8 max-w-lg w-full">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-cp-green/15 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cp-green">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">Merchant Created</h1>
              <p className="text-sm text-cp-muted mt-2">
                Save these credentials now. They will not be shown again.
              </p>
            </div>

            <div className="space-y-4">
              <CredentialBlock
                label="API Key (server-side only)"
                value={result.api_key}
                description="Use this in your server backend for creating invoices."
              />
              <CredentialBlock
                label="Dashboard Token"
                value={result.dashboard_token}
                description="Use this to log into the web dashboard."
              />
              <CredentialBlock
                label="Webhook Secret"
                value={result.webhook_secret}
                description="Use this to verify webhook signatures."
              />
            </div>

            <div className="mt-8 p-4 rounded-lg bg-cp-yellow/10 border border-cp-yellow/30">
              <p className="text-sm text-cp-yellow font-medium">
                These credentials are shown once. Copy them to a safe place.
              </p>
            </div>

            <Link
              href="/dashboard/login"
              className="btn-primary w-full py-3 mt-6 text-center block"
            >
              Go to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-cp-border px-6 py-3 flex items-center justify-between">
        <Link href="/"><Logo size="sm" /></Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="card p-8 max-w-lg w-full">
          <h1 className="text-2xl font-bold mb-2">Register as Merchant</h1>
          <p className="text-sm text-cp-muted mb-8">
            Provide your Zcash Unified Full Viewing Key and payment address.
          </p>

          <div className="p-4 rounded-lg bg-cp-purple/10 border border-cp-purple/30 mb-6">
            <div className="flex gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cp-purple shrink-0 mt-0.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-cp-purple mb-1">Security: Use a dedicated wallet</p>
                <p className="text-cp-muted leading-relaxed">
                  Do not use your personal wallet. Create a brand new wallet exclusively
                  for your store, and use its viewing key here. Sweep funds to cold storage
                  regularly.{' '}
                  <Link href="/faq" className="text-cp-cyan hover:underline">
                    Learn why &rarr;
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Unified Full Viewing Key (UFVK) <span className="text-cp-red">*</span>
              </label>
              <textarea
                value={ufvk}
                onChange={(e) => setUfvk(e.target.value)}
                placeholder="uview1..."
                className="input min-h-[80px] resize-y"
                required
              />
              <p className="text-xs text-cp-muted mt-1">
                Read-only key for payment detection. Cannot spend funds.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Payment Address <span className="text-cp-red">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="u1..."
                className="input font-mono text-sm"
                required
              />
              <p className="text-xs text-cp-muted mt-1">
                Must be from the same wallet as the UFVK above. Trial decryption
                only works if the viewing key matches the payment address.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Webhook URL <span className="text-cp-muted">(optional)</span>
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-store.com/api/cipherpay-webhook"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Recovery Email <span className="text-cp-muted">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input"
              />
              <p className="text-xs text-cp-muted mt-1">
                Only used for account recovery if you lose your token. No marketing, ever.
              </p>
            </div>

            {error && (
              <p className="text-sm text-cp-red">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !ufvk || !address}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Merchant Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-cp-border text-center">
            <p className="text-sm text-cp-muted">
              Already have an account?{' '}
              <Link href="/dashboard/login" className="text-cp-cyan hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function CredentialBlock({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-cp-bg border border-cp-border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-cp-muted">{label}</span>
        <CopyButton text={value} />
      </div>
      <code className="text-sm font-mono break-all block">{value}</code>
      <p className="text-xs text-cp-muted mt-2">{description}</p>
    </div>
  );
}
