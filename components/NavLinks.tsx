'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/config';

export function NavLinks() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/merchants/me`, { credentials: 'include' })
      .then((r) => { if (!cancelled) setIsLoggedIn(r.ok); })
      .catch(() => { if (!cancelled) setIsLoggedIn(false); });
    return () => { cancelled = true; };
  }, []);

  if (isLoggedIn === null) return null;

  if (isLoggedIn) {
    return (
      <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none' }}>
        DASHBOARD
      </Link>
    );
  }

  return (
    <>
      <Link href="/dashboard/login" className="btn" style={{ textDecoration: 'none' }}>
        SIGN IN
      </Link>
      <Link href="/dashboard/register" className="btn-primary" style={{ textDecoration: 'none' }}>
        GET STARTED
      </Link>
    </>
  );
}
