'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/config';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';
import AdminDashboard from './AdminDashboard';

const ADMIN_KEY_STORAGE = 'cp_admin_key';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const verify = useCallback(async (key: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/auth`, {
        method: 'POST',
        headers: { 'X-Admin-Key': key },
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (stored) {
      verify(stored).then(ok => {
        if (ok) setAdminKey(stored);
        setChecking(false);
      });
    } else {
      setChecking(false);
    }
  }, [verify]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await verify(inputKey);
    if (ok) {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, inputKey);
      setAdminKey(inputKey);
    } else {
      setError('Invalid admin key');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey('');
    setInputKey('');
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-6 h-6 border-2 border-cp-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (adminKey) {
    return <AdminDashboard adminKey={adminKey} onLogout={handleLogout} />;
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, lineHeight: 1.6, display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--cp-border)' }}>
        <Link href="/"><Logo size="sm" /></Link>
        <ThemeToggle />
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: 400, width: '100%' }}>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Admin Access</span>
              <span className="status-badge status-detected">RESTRICTED</span>
            </div>
            <div className="panel-body">
              <p style={{ fontSize: 11, color: 'var(--cp-text-muted)', marginBottom: 20 }}>
                Enter admin key to access the platform dashboard.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Admin Key</label>
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Enter admin key..."
                    className="input"
                    autoFocus
                  />
                </div>

                {error && (
                  <div style={{ color: 'var(--cp-red)', fontSize: 11, marginBottom: 12 }}>{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || !inputKey}
                  className="btn-primary"
                  style={{ width: '100%', opacity: loading || !inputKey ? 0.5 : 1 }}
                >
                  {loading ? 'VERIFYING...' : 'ACCESS DASHBOARD'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
