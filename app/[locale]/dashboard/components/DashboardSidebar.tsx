'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { CopyButton } from '@/components/CopyButton';
import type { MerchantInfo, BillingSummary } from '@/lib/api';

export type Tab = 'overview' | 'products' | 'invoices' | 'pos' | 'billing' | 'settings' | 'x402';

interface DashboardSidebarProps {
  merchant: MerchantInfo;
  tab: Tab;
  setTab: (t: Tab) => void;
  billing: BillingSummary | null;
  hasX402: boolean;
}

export const DashboardSidebar = memo(function DashboardSidebar({
  merchant, tab, setTab, billing, hasX402,
}: DashboardSidebarProps) {
  const t = useTranslations('dashboard.sidebar');
  const navButton = (key: Tab, label: string, badge?: React.ReactNode) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        background: tab === key ? 'var(--cp-surface)' : 'transparent',
        border: tab === key ? '1px solid var(--cp-border)' : '1px solid transparent',
        borderRadius: 4,
        cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 11, letterSpacing: 1.5, fontWeight: tab === key ? 600 : 400,
        color: tab === key ? 'var(--cp-cyan)' : 'var(--cp-text-muted)',
        textAlign: 'left',
        transition: 'all 0.15s',
      }}
    >
      {label}
      {badge}
    </button>
  );

  return (
    <div>
      {/* Merchant Identity */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{merchant.name || t('merchant')}</span>
          <span className="status-badge status-confirmed">{t('active')}</span>
        </div>
        <div className="panel-body">
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>{t('id')}</span>
            <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              {merchant.id.substring(0, 8)}...
              <CopyButton text={merchant.id} label="" />
            </span>
          </div>
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>{t('address')}</span>
            <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--cp-cyan)', fontSize: 9 }}>{merchant.payment_address.substring(0, 16)}...</span>
              <CopyButton text={merchant.payment_address} label="" />
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 4 }}>
          {navButton('overview', t('overview'))}
        </div>

        <div style={{ borderTop: '1px solid var(--cp-border)', margin: '8px 0' }} />

        <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--cp-text-dim)', padding: '4px 14px 4px', fontWeight: 600 }}><span style={{ color: 'var(--cp-cyan)', opacity: 0.4 }}>//</span> {t('store')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navButton('products', t('products'))}
          {navButton('pos', t('pos'))}
          {navButton('invoices', t('invoices'))}
          {hasX402 && navButton('x402', t('x402'))}
        </div>

        <div style={{ borderTop: '1px solid var(--cp-border)', margin: '8px 0' }} />

        <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--cp-text-dim)', padding: '4px 14px 4px', fontWeight: 600 }}><span style={{ color: 'var(--cp-cyan)', opacity: 0.4 }}>//</span> {t('account')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navButton('billing', t('billing'),
            billing?.fee_enabled && billing.outstanding_zec > 0.00001 ? (
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: billing.billing_status === 'active' ? '#f59e0b' : '#ef4444',
                flexShrink: 0,
              }} />
            ) : undefined
          )}
          {navButton('settings', t('settings'))}
        </div>

        <div style={{ borderTop: '1px solid var(--cp-border)', margin: '8px 0' }} />

        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 14px',
            fontFamily: 'inherit', fontSize: 11, letterSpacing: 1.5, fontWeight: 400,
            color: 'var(--cp-text-dim)',
            textDecoration: 'none',
            borderRadius: 4,
            transition: 'color 0.15s',
          }}
        >
          {t('docs')}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </nav>
    </div>
  );
});
