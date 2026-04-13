'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export function SiteFooter() {
  const t = useTranslations('nav');

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-links">
          <Link href="/docs">{t('docs')}</Link>
          <Link href="/faq">{t('faq')}</Link>
          <Link href="/privacy">{t('privacy')}</Link>
          <Link href="/terms">{t('terms')}</Link>
          <a href="https://cipherscan.app" target="_blank" rel="noopener noreferrer">CipherScan</a>
        </div>
        <div className="footer-links">
          <a href="https://github.com/atmospherelabs-dev" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://www.youtube.com/@AtmosphereLabsDev" target="_blank" rel="noopener noreferrer">YouTube</a>
          <a href="https://x.com/cipherpay_app" target="_blank" rel="noopener noreferrer">𝕏</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span className="footer-brand">
          <span style={{ color: 'var(--cp-cyan)' }}>&gt; Cipher</span>Pay
        </span>
        <span className="footer-copy">© {new Date().getFullYear()} Atmosphere Labs</span>
      </div>
    </footer>
  );
}
