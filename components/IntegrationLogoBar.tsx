'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const INTEGRATIONS = [
  { name: 'Shopify', href: '/docs', logo: '/integrations/shopify.svg' },
  { name: 'WooCommerce', href: '/docs', logo: '/integrations/woocommerce.svg' },
] as const;

export function IntegrationLogoBar() {
  const t = useTranslations('landing.logoBar');

  return (
    <section className="integration-logo-bar" aria-label={t('ariaLabel')}>
      <p className="integration-logo-bar-label">{t('label')}</p>
      <div className="integration-logo-bar-items">
        {INTEGRATIONS.map((item) => (
          <Link key={item.name} href={item.href} className="integration-logo-link">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.logo} alt="" className="integration-logo integration-logo--wide" />
            <span className="sr-only">{item.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
