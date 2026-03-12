'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { MerchantInfo, ZecRates } from '@/lib/api';
import { currencySymbol } from '../utils/currency';

interface DashboardNavbarProps {
  merchant: MerchantInfo;
  zecRates: ZecRates | null;
  displayCurrency: string;
  onLogout: () => void;
}

export const DashboardNavbar = memo(function DashboardNavbar({
  merchant, zecRates, displayCurrency, onLogout,
}: DashboardNavbarProps) {
  const sym = currencySymbol(displayCurrency);
  const rateKey = `zec_${displayCurrency.toLowerCase()}` as keyof ZecRates;
  const rateValue = zecRates && typeof zecRates[rateKey] === 'number'
    ? (zecRates[rateKey] as number).toFixed(2)
    : '--';

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--cp-border)' }}>
      <Link href="/"><Logo size="sm" /></Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="tag" style={{ color: 'var(--cp-text)', padding: '0 10px', height: 36, display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
          ZEC {zecRates ? `${sym}${rateValue}` : '--'}
        </span>
        <div style={{ width: 1, height: 20, background: 'var(--cp-border)', margin: '0 4px' }} />
        <span className="tag" style={{ padding: '0 10px', height: 36, display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
          DASHBOARD // {merchant.payment_address.startsWith('utest') ? 'TESTNET' : 'MAINNET'}
        </span>
        <div style={{ width: 1, height: 20, background: 'var(--cp-border)', margin: '0 4px' }} />
        <ThemeToggle />
        <button onClick={onLogout} className="btn btn-small">
          SIGN OUT
        </button>
      </div>
    </header>
  );
});
