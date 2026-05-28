'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { CopyButton } from '@/components/CopyButton';
import type { MerchantInfo, BillingSummary } from '@/lib/api';

export type Tab = 'overview' | 'products' | 'events' | 'invoices' | 'subscriptions' | 'pos' | 'links' | 'billing' | 'cashOut' | 'webhooks' | 'settings' | 'x402';

interface DashboardSidebarProps {
  merchant: MerchantInfo;
  tab: Tab;
  setTab: (t: Tab) => void;
  billing: BillingSummary | null;
  isNewMerchant?: boolean;
}

export const DashboardSidebar = memo(function DashboardSidebar({
  merchant, tab, setTab, billing, isNewMerchant,
}: DashboardSidebarProps) {
  const t = useTranslations('dashboard.sidebar');
  const navButton = (key: Tab, label: string, badge?: React.ReactNode) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      className={`dash-nav-btn${tab === key ? ' active' : ''}`}
    >
      {label}
      {badge}
    </button>
  );

  return (
    <div className="dash-sidebar">
      {/* Merchant Identity — hidden on mobile */}
      <div className="panel dash-sidebar-identity">
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
      <nav className="dash-sidebar-nav">
        <div className="dash-sidebar-nav-group">
          {navButton('overview', t('overview'))}
        </div>

        <div className="dash-sidebar-divider" />

        <div className="dash-sidebar-label"><span style={{ color: 'var(--cp-cyan)', opacity: 0.4 }}>//</span> {t('commerce')}</div>
        <div className="dash-sidebar-nav-group">
          {navButton('invoices', t('invoices'))}
          {navButton('products', t('products'))}
          {navButton('subscriptions', t('subscriptions'))}
          {navButton('events', t('events'))}
          {navButton('links', t('links'))}
          {navButton('pos', t('pos'))}
        </div>

        <div className="dash-sidebar-divider" />
        <div className="dash-sidebar-label"><span style={{ color: 'var(--cp-cyan)', opacity: 0.4 }}>//</span> {t('developer')}</div>
        <div className="dash-sidebar-nav-group">
          {navButton('webhooks', t('webhooks'))}
          {navButton('x402', t('x402'))}
        </div>

        <div className="dash-sidebar-divider" />

        <div className="dash-sidebar-label"><span style={{ color: 'var(--cp-cyan)', opacity: 0.4 }}>//</span> {t('account')}</div>
        <div className="dash-sidebar-nav-group">
          {navButton('billing', t('billing'),
            billing?.fee_enabled && billing.outstanding_zec > 0.00001 ? (
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: billing.billing_status === 'active' ? 'var(--cp-yellow)' : 'var(--cp-red)',
                flexShrink: 0,
              }} />
            ) : undefined
          )}
          {navButton('cashOut', t('cashOut'))}
          {navButton('settings', t('settings'))}
        </div>

        <div className="dash-sidebar-divider" />

        <a
          href="/pos"
          target="_blank"
          rel="noopener noreferrer"
          className="dash-nav-btn"
          style={{ color: 'var(--cp-cyan)' }}
        >
          {t('openPos')}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
        <Link
          href={isNewMerchant ? '/docs/quickstart' : '/docs'}
          target="_blank"
          rel="noopener noreferrer"
          className="dash-nav-btn dash-sidebar-docs"
        >
          {t('docs')}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </Link>
      </nav>
    </div>
  );
});
