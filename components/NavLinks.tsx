'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { API_URL } from '@/lib/config';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

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
  const t = useTranslations('nav');
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

  const linkStyle = (href: string): React.CSSProperties => ({
    fontSize: 11,
    textDecoration: 'none',
    letterSpacing: 1,
    color: pathname === href ? 'var(--cp-cyan)' : 'var(--cp-text-muted)',
    fontWeight: pathname === href ? 600 : 400,
    padding: '8px 0',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  });

  const authLinks = isLoggedIn === null ? (
    <span style={{ display: 'inline-block', width: 90, height: 36 }} />
  ) : isLoggedIn ? (
    <Link href="/dashboard" className="btn-primary">
      {t('dashboard')}
    </Link>
  ) : (
    <>
      <Link href="/dashboard/login" className="btn">
        {t('signIn')}
      </Link>
      <Link href="/dashboard/register" className="btn-primary">
        {t('getStarted')}
      </Link>
    </>
  );

  return (
    <>
      {/* Desktop nav */}
      <div className="nav-desktop">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/docs" style={linkStyle('/docs')}>{t('docs')}</Link>
          <Link href="/faq" style={linkStyle('/faq')}>{t('faq')}</Link>
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--cp-border)', margin: '0 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LanguageSwitcher />
          <ThemeToggle />
          {authLinks}
        </div>
      </div>

      {/* Mobile burger */}
      <div className="nav-mobile">
        <LanguageSwitcher />
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
            <Link href="/docs" style={{ ...linkStyle('/docs'), fontSize: 14, padding: '12px 0', display: 'block' }}>{t('docs')}</Link>
            <Link href="/faq" style={{ ...linkStyle('/faq'), fontSize: 14, padding: '12px 0', display: 'block' }}>{t('faq')}</Link>
            <div style={{ borderTop: '1px solid var(--cp-border)', marginTop: 8, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {authLinks}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
