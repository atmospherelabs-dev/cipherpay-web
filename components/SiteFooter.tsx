'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export function SiteFooter() {
  const t = useTranslations('nav');

  return (
    <footer className="site-footer">
      <span style={{ fontWeight: 600, fontSize: 10 }}>
        <span style={{ color: 'var(--cp-cyan)' }}>Cipher</span><span>Pay</span>
      </span>
      <div className="footer-links">
        <Link href="/docs" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>{t('docs')}</Link>
        <Link href="/faq" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>{t('faq')}</Link>
        <Link href="/privacy" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>{t('privacy')}</Link>
        <a href="https://cipherscan.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>CipherScan</a>
        <a href="https://github.com/atmospherelabs-dev/cipherpay-web" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>GitHub</a>
        <a href="https://x.com/cipherpay_app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cp-text-muted)', textDecoration: 'none' }}>𝕏</a>
      </div>
    </footer>
  );
}
