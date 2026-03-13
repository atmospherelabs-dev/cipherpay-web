'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import type { MerchantInfo, ZecRates } from '@/lib/api';
import { currencySymbol } from '@/lib/currency';

interface DashboardNavbarProps {
  merchant: MerchantInfo;
  zecRates: ZecRates | null;
  displayCurrency: string;
  onLogout: () => void;
}

export const DashboardNavbar = memo(function DashboardNavbar({
  merchant, zecRates, displayCurrency, onLogout,
}: DashboardNavbarProps) {
  const t = useTranslations('dashboard.navbar');
  const tc = useTranslations('common');
  const sym = currencySymbol(displayCurrency);
  const rateKey = `zec_${displayCurrency.toLowerCase()}` as keyof ZecRates;
  const rateValue = zecRates && typeof zecRates[rateKey] === 'number'
    ? (zecRates[rateKey] as number).toFixed(2)
    : '--';

  return (
    <header className="site-header">
      <Link href="/"><Logo size="sm" /></Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="tag" style={{ color: 'var(--cp-text)', padding: '0 10px', height: 36, display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
          ZEC {zecRates ? `${sym}${rateValue}` : '--'}
        </span>
        <div style={{ width: 1, height: 20, background: 'var(--cp-border)', margin: '0 4px' }} />
        <span className="tag" style={{ padding: '0 10px', height: 36, display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
          {t('dashboardPrefix')} // {merchant.payment_address.startsWith('utest') ? t('testnet') : t('mainnet')}
        </span>
        <div style={{ width: 1, height: 20, background: 'var(--cp-border)', margin: '0 4px' }} />
        <LanguageSwitcher />
        <ThemeToggle />
        <button onClick={onLogout} className="btn btn-small">
          {tc('signOut')}
        </button>
      </div>
    </header>
  );
});
