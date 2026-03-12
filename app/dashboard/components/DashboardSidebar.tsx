'use client';

import { memo } from 'react';
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
          <span className="panel-title">{merchant.name || 'Merchant'}</span>
          <span className="status-badge status-confirmed">ACTIVE</span>
        </div>
        <div className="panel-body">
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>ID</span>
            <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              {merchant.id.substring(0, 8)}...
              <CopyButton text={merchant.id} label="" />
            </span>
          </div>
          <div className="stat-row">
            <span style={{ color: 'var(--cp-text-muted)' }}>Address</span>
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
          {navButton('overview', 'OVERVIEW')}
        </div>

        <div style={{ borderTop: '1px solid var(--cp-border)', margin: '8px 0' }} />

        <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--cp-text-dim)', padding: '4px 14px 4px', fontWeight: 600 }}><span style={{ color: 'var(--cp-cyan)', opacity: 0.4 }}>//</span> STORE</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navButton('products', 'PRODUCTS')}
          {navButton('pos', 'POS')}
          {navButton('invoices', 'INVOICES')}
          {hasX402 && navButton('x402', 'X402')}
        </div>

        <div style={{ borderTop: '1px solid var(--cp-border)', margin: '8px 0' }} />

        <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--cp-text-dim)', padding: '4px 14px 4px', fontWeight: 600 }}><span style={{ color: 'var(--cp-cyan)', opacity: 0.4 }}>//</span> ACCOUNT</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navButton('billing', 'BILLING',
            billing?.fee_enabled && billing.outstanding_zec > 0.00001 ? (
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: billing.billing_status === 'active' ? '#f59e0b' : '#ef4444',
                flexShrink: 0,
              }} />
            ) : undefined
          )}
          {navButton('settings', 'SETTINGS')}
        </div>
      </nav>
    </div>
  );
});
