'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.startsWith('cpay_dash_')) {
      setError('Token must start with cpay_dash_');
      return;
    }

    setLoading(true);
    setError('');

    const ok = await login(token);
    if (ok) {
      router.push('/dashboard');
    } else {
      setError('Invalid dashboard token');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-cp-border px-6 py-3 flex items-center justify-between">
        <Link href="/"><Logo size="sm" /></Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="card p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-2">Merchant Dashboard</h1>
          <p className="text-sm text-cp-muted mb-8">
            Paste your dashboard token to sign in.
          </p>

          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium mb-2">
              Dashboard Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="cpay_dash_..."
              className="input mb-4"
              autoFocus
            />

            {error && (
              <p className="text-sm text-cp-red mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-cp-border text-center space-y-2">
            <p className="text-sm text-cp-muted">
              Don&apos;t have an account?
            </p>
            <Link
              href="/dashboard/register"
              className="text-sm text-cp-cyan hover:underline"
            >
              Register as a merchant
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/dashboard/recover"
              className="text-xs text-cp-muted hover:text-cp-cyan transition-colors"
            >
              Lost your token?
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
