'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/Logo';

export function SiteFooter() {
  const t = useTranslations('nav');

  return (
    <footer className="site-footer">
      <div className="footer-links footer-links-primary">
        <Link href="/docs">{t('docs')}</Link>
        <Link href="/faq">{t('faq')}</Link>
        <Link href="/brand">{t('brand')}</Link>
        <a href="https://zecmap.com/" target="_blank" rel="noopener noreferrer">{t('zecmap')}</a>
        <a href="https://cipherscan.app" target="_blank" rel="noopener noreferrer">CipherScan</a>
        <a href="https://zipher.to" target="_blank" rel="noopener noreferrer">Zipher</a>
        <Link href="/privacy">{t('privacy')}</Link>
        <Link href="/terms">{t('terms')}</Link>
      </div>
      <div className="footer-links footer-links-social">
        <a href="https://github.com/atmospherelabs-dev" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="https://www.youtube.com/@AtmosphereLabsDev" target="_blank" rel="noopener noreferrer">YouTube</a>
        <a href="https://x.com/cipherpay_app" target="_blank" rel="noopener noreferrer">𝕏</a>
      </div>
      <div className="footer-bottom">
        <span className="footer-brand">
          <Logo size="sm" />
        </span>
        <span className="footer-copy">© {new Date().getFullYear()} Atmosphere Labs</span>
      </div>
    </footer>
  );
}
