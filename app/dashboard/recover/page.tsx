'use client';

import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';

export default function RecoverPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-cp-border px-6 py-3 flex items-center justify-between">
        <Link href="/"><Logo size="sm" /></Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-cp-yellow/15 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cp-yellow">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-2">Account Recovery</h1>
          <p className="text-sm text-cp-muted mb-6">
            Email-based recovery is coming soon. If you registered with an email,
            you will be able to recover your dashboard token.
          </p>

          <div className="p-4 rounded-lg bg-cp-bg border border-cp-border text-left text-sm text-cp-muted space-y-2">
            <p>
              <strong className="text-cp-text">If you saved your token:</strong>{' '}
              Use it on the{' '}
              <Link href="/dashboard/login" className="text-cp-cyan hover:underline">
                login page
              </Link>.
            </p>
            <p>
              <strong className="text-cp-text">If you lost it:</strong>{' '}
              Without a recovery email, you&apos;ll need to create a new merchant account
              with a different UFVK.
            </p>
          </div>

          <Link
            href="/dashboard/login"
            className="btn-secondary w-full py-3 mt-6 text-center block"
          >
            Back to Login
          </Link>
        </div>
      </main>
    </div>
  );
}
