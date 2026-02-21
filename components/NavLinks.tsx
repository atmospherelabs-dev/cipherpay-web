'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { API_URL } from '@/lib/config';
import { ThemeToggle } from './ThemeToggle';

export function useIsLoggedIn() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/merchants/me`, { credentials: 'include' })
      .then((r) => { if (!cancelled) setIsLoggedIn(r.ok); })
      .catch(() => { if (!cancelled) setIsLoggedIn(false); });
    return () => { cancelled = true; };
  }, []);

  return isLoggedIn;
}

export function NavLinks() {
  const isLoggedIn = useIsLoggedIn();
  const pathname = usePathname();

  const linkStyle = (href: string) => ({
    fontSize: 11,
    textDecoration: 'none' as const,
    letterSpacing: 1,
    color: pathname === href ? 'var(--cp-cyan)' : 'var(--cp-text-muted)',
    fontWeight: pathname === href ? 600 : 400,
  });

  return (
    <>
      <Link href="/docs" style={linkStyle('/docs')}>DOCS</Link>
      <Link href="/faq" style={linkStyle('/faq')}>FAQ</Link>
      <ThemeToggle />
      {isLoggedIn === null ? null : isLoggedIn ? (
        <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none' }}>
          DASHBOARD
        </Link>
      ) : (
        <>
          <Link href="/dashboard/login" className="btn" style={{ textDecoration: 'none' }}>
            SIGN IN
          </Link>
          <Link href="/dashboard/register" className="btn-primary" style={{ textDecoration: 'none' }}>
            GET STARTED
          </Link>
        </>
      )}
    </>
  );
}
