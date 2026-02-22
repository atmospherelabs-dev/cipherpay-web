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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const linkStyle = (href: string) => ({
    fontSize: 11,
    textDecoration: 'none' as const,
    letterSpacing: 1,
    color: pathname === href ? 'var(--cp-cyan)' : 'var(--cp-text-muted)',
    fontWeight: pathname === href ? 600 : 400,
  });

  const authLinks = isLoggedIn === null ? null : isLoggedIn ? (
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
  );

  return (
    <>
      {/* Desktop nav */}
      <div className="nav-desktop">
        <Link href="/docs" style={linkStyle('/docs')}>DOCS</Link>
        <Link href="/faq" style={linkStyle('/faq')}>FAQ</Link>
        <ThemeToggle />
        {authLinks}
      </div>

      {/* Mobile burger */}
      <div className="nav-mobile">
        <ThemeToggle />
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="burger-btn"
          aria-label="Toggle menu"
        >
          <span className={`burger-icon ${menuOpen ? 'open' : ''}`}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="mobile-overlay" onClick={() => setMenuOpen(false)}>
          <nav className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <Link href="/docs" style={{ ...linkStyle('/docs'), fontSize: 14, padding: '12px 0', display: 'block' }}>DOCS</Link>
            <Link href="/faq" style={{ ...linkStyle('/faq'), fontSize: 14, padding: '12px 0', display: 'block' }}>FAQ</Link>
            <div style={{ borderTop: '1px solid var(--cp-border)', marginTop: 8, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {authLinks}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
